#!/bin/bash

# ============================================
# OpenClaw 一键部署脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查系统要求
check_requirements() {
    log_info "检查系统要求..."
    
    # 检查 Docker
    if ! command_exists docker; then
        log_error "Docker 未安装，请先安装 Docker"
        echo "安装指南: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # 检查 Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    # 检查 Git
    if ! command_exists git; then
        log_warn "Git 未安装，正在尝试安装..."
        if command_exists apt-get; then
            sudo apt-get update && sudo apt-get install -y git
        elif command_exists yum; then
            sudo yum install -y git
        else
            log_error "无法自动安装 Git，请手动安装"
            exit 1
        fi
    fi
    
    log_success "系统要求检查通过"
}

# 生成随机令牌
generate_token() {
    if command_exists openssl; then
        openssl rand -hex 32
    elif command_exists python3; then
        python3 -c "import secrets; print(secrets.token_hex(32))"
    else
        date +%s | sha256sum | base64 | head -c 64
    fi
}

# 克隆 OpenClaw 仓库
clone_openclaw() {
    log_info "克隆 OpenClaw 仓库..."
    
    if [ -d "openclaw" ]; then
        log_warn "openclaw 目录已存在，正在更新..."
        cd openclaw
        git pull origin main || git pull origin master
        cd ..
    else
        git clone https://github.com/openclaw/openclaw.git
    fi
    
    log_success "OpenClaw 仓库准备完成"
}

# 创建配置文件
create_config() {
    log_info "创建配置文件..."
    
    local config_dir="$1"
    local model_provider="$2"
    local model_name="$3"
    local api_key="$4"
    local channels="$5"
    
    cd openclaw
    
    # 创建 configs 目录
    mkdir -p configs
    
    # 生成网关令牌
    local gateway_token=$(generate_token)
    
    # 创建 .env 文件
    cat > .env << EOF
# OpenClaw 自动生成的配置文件
# 生成时间: $(date)

# 网关配置
OPENCLAW_GATEWAY_TOKEN=${gateway_token}
OPENCLAW_GATEWAY_PORT=18789
OPENCLAW_CONFIG_NAME=openclaw.openai-chat.json
OPENCLAW_GATEWAY_BIND=lan

# AI 模型配置
EOF

    # 根据模型提供商添加 API 密钥
    case "$model_provider" in
        "anthropic")
            echo "ANTHROPIC_API_KEY=${api_key}" >> .env
            ;;
        "openai")
            echo "OPENAI_API_KEY=${api_key}" >> .env
            ;;
        "gemini")
            echo "GEMINI_API_KEY=${api_key}" >> .env
            ;;
        "xairouter")
            echo "XAI_API_KEY=${api_key}" >> .env
            ;;
        "openrouter")
            echo "OPENROUTER_API_KEY=${api_key}" >> .env
            ;;
    esac
    
    # 添加通信渠道配置
    echo "" >> .env
    echo "# 通信渠道配置" >> .env
    
    IFS=',' read -ra CHANNEL_ARRAY <<< "$channels"
    for channel in "${CHANNEL_ARRAY[@]}"; do
        case "$channel" in
            "telegram")
                echo "TELEGRAM_BOT_TOKEN=your-telegram-bot-token" >> .env
                ;;
            "discord")
                echo "DISCORD_BOT_TOKEN=your-discord-bot-token" >> .env
                ;;
            "slack")
                echo "SLACK_APP_TOKEN=your-slack-app-token" >> .env
                echo "SLACK_BOT_TOKEN=your-slack-bot-token" >> .env
                ;;
            "whatsapp")
                echo "WHATSAPP_API_KEY=your-whatsapp-api-key" >> .env
                ;;
        esac
    done
    
    # 创建 OpenClaw 配置文件
    cat > configs/openclaw.openai-chat.json << EOF
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "${model_provider}/${model_name}"
      },
      "personality": {
        "name": "OpenClaw Assistant",
        "style": "helpful, direct, and professional"
      }
    }
  },
  "models": {
    "providers": {
      "anthropic": {
        "baseUrl": "https://api.anthropic.com/v1",
        "api": "anthropic-messages"
      },
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-completions"
      },
      "gemini": {
        "baseUrl": "https://generativelanguage.googleapis.com/v1beta",
        "api": "gemini-generate"
      },
      "xairouter": {
        "baseUrl": "https://api.xairouter.com/v1",
        "api": "openai-completions"
      },
      "openrouter": {
        "baseUrl": "https://openrouter.ai/api/v1",
        "api": "openai-completions"
      }
    }
  },
  "channels": {
    "telegram": {
      "enabled": $(echo "$channels" | grep -q "telegram" && echo "true" || echo "false")
    },
    "discord": {
      "enabled": $(echo "$channels" | grep -q "discord" && echo "true" || echo "false")
    },
    "slack": {
      "enabled": $(echo "$channels" | grep -q "slack" && echo "true" || echo "false")
    },
    "whatsapp": {
      "enabled": $(echo "$channels" | grep -q "whatsapp" && echo "true" || echo "false")
    }
  }
}
EOF
    
    cd ..
    
    # 保存网关令牌供后续使用
    echo "$gateway_token" > .gateway_token
    
    log_success "配置文件创建完成"
    log_info "网关令牌: ${gateway_token}"
}

# 部署 OpenClaw
deploy() {
    log_info "开始部署 OpenClaw..."
    
    cd openclaw
    
    # 检查是否存在 docker-compose.yml
    if [ ! -f "docker-compose.yml" ]; then
        log_info "创建 docker-compose.yml..."
        cp "${config_dir}/../templates/docker-compose.yml" ./docker-compose.yml
    fi
    
    # 启动服务
    log_info "启动 OpenClaw 服务..."
    if docker compose version >/dev/null 2>&1; then
        docker compose up -d openclaw-gateway
    else
        docker-compose up -d openclaw-gateway
    fi
    
    cd ..
    
    log_success "OpenClaw 部署完成"
}

# 检查部署状态
check_status() {
    log_info "检查部署状态..."
    
    cd openclaw
    
    if docker compose version >/dev/null 2>&1; then
        docker compose ps
        docker compose logs --tail=50 openclaw-gateway
    else
        docker-compose ps
        docker-compose logs --tail=50 openclaw-gateway
    fi
    
    cd ..
}

# 获取服务信息
get_service_info() {
    log_info "获取服务信息..."
    
    local gateway_token=$(cat .gateway_token 2>/dev/null || echo "unknown")
    local gateway_port=$(grep OPENCLAW_GATEWAY_PORT openclaw/.env 2>/dev/null | cut -d= -f2 || echo "18789")
    local host_ip=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    
    echo ""
    echo "========================================"
    echo "  OpenClaw 部署信息"
    echo "========================================"
    echo ""
    echo "  网关地址: http://${host_ip}:${gateway_port}"
    echo "  网关令牌: ${gateway_token}"
    echo ""
    echo "  API 端点:"
    echo "    - Chat Completions: http://${host_ip}:${gateway_port}/v1/chat/completions"
    echo ""
    echo "  管理命令:"
    echo "    - 查看日志: cd openclaw && docker-compose logs -f openclaw-gateway"
    echo "    - 重启服务: cd openclaw && docker-compose restart openclaw-gateway"
    echo "    - 停止服务: cd openclaw && docker-compose down"
    echo ""
    echo "========================================"
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  OpenClaw 一键部署脚本"
    echo "========================================"
    echo ""
    
    local config_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local action="${1:-deploy}"
    
    case "$action" in
        "deploy")
            check_requirements
            clone_openclaw
            
            # 如果提供了参数，使用参数创建配置
            if [ $# -ge 5 ]; then
                create_config "$config_dir" "$2" "$3" "$4" "$5"
            else
                log_info "使用默认配置，请手动编辑 openclaw/.env 文件"
            fi
            
            deploy
            sleep 5
            check_status
            get_service_info
            ;;
        "status")
            check_status
            ;;
        "info")
            get_service_info
            ;;
        "stop")
            log_info "停止 OpenClaw 服务..."
            cd openclaw && docker-compose down
            log_success "服务已停止"
            ;;
        "restart")
            log_info "重启 OpenClaw 服务..."
            cd openclaw && docker-compose restart
            log_success "服务已重启"
            ;;
        "logs")
            cd openclaw && docker-compose logs -f openclaw-gateway
            ;;
        "update")
            log_info "更新 OpenClaw..."
            clone_openclaw
            cd openclaw && docker-compose pull && docker-compose up -d
            log_success "更新完成"
            ;;
        *)
            echo "用法: $0 [deploy|status|info|stop|restart|logs|update]"
            echo ""
            echo "命令:"
            echo "  deploy  - 部署 OpenClaw"
            echo "  status  - 查看服务状态"
            echo "  info    - 显示服务信息"
            echo "  stop    - 停止服务"
            echo "  restart - 重启服务"
            echo "  logs    - 查看日志"
            echo "  update  - 更新到最新版本"
            exit 1
            ;;
    esac
}

main "$@"
