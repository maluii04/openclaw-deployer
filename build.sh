#!/bin/bash

# OpenClaw Deployer macOS 构建脚本
# 用法: ./build.sh [--dev|--release|--universal]

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

# 检测架构
detect_arch() {
    local arch=$(uname -m)
    if [ "$arch" = "arm64" ]; then
        echo "aarch64-apple-darwin"
    else
        echo "x86_64-apple-darwin"
    fi
}

# 主函数
main() {
    echo ""
    echo "========================================"
    echo "  OpenClaw Deployer - macOS Builder"
    echo "========================================"
    echo ""

    local mode="${1:-release}"
    local target=$(detect_arch)

    # 检查环境
    log_info "[1/5] 检查构建环境..."

    # 检查 Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_success "  ✓ Node.js $node_version"
    else
        log_error "  ✗ Node.js 未安装"
        log_info "  请访问 https://nodejs.org/ 或使用: brew install node"
        exit 1
    fi

    # 检查 Rust
    if command -v rustc &> /dev/null; then
        local rust_version=$(rustc --version)
        log_success "  ✓ Rust $rust_version"
    else
        log_error "  ✗ Rust 未安装"
        log_info "  请访问 https://rustup.rs/ 安装"
        exit 1
    fi

    # 检查 cargo-tauri
    if command -v cargo-tauri &> /dev/null; then
        local tauri_version=$(cargo tauri --version)
        log_success "  ✓ Tauri CLI $tauri_version"
    else
        log_warn "  ! Tauri CLI 未安装，正在安装..."
        cargo install tauri-cli
    fi

    # 检查 Xcode Command Line Tools
    if xcode-select -p &> /dev/null; then
        log_success "  ✓ Xcode Command Line Tools"
    else
        log_warn "  ! Xcode Command Line Tools 未安装"
        log_info "  运行: xcode-select --install"
    fi

    echo ""

    # 安装依赖
    log_info "[2/5] 安装 Node.js 依赖..."
    npm install
    log_success "  ✓ 依赖安装完成"
    echo ""

    # 构建
    if [ "$mode" = "dev" ]; then
        log_info "[3/5] 启动开发模式..."
        cargo tauri dev
    elif [ "$mode" = "universal" ]; then
        log_info "[3/5] 构建通用二进制 (Intel + Apple Silicon)..."
        log_info "  这可能需要较长时间，请耐心等待..."
        
        # 构建 Intel 版本
        log_info "  构建 Intel (x86_64) 版本..."
        cargo tauri build --target x86_64-apple-darwin
        
        # 构建 Apple Silicon 版本
        log_info "  构建 Apple Silicon (aarch64) 版本..."
        cargo tauri build --target aarch64-apple-darwin
        
        # 创建通用二进制
        log_info "  合并为通用二进制..."
        mkdir -p src-tauri/target/universal
        lipo -create \
            src-tauri/target/x86_64-apple-darwin/release/OpenClaw-Deployer \
            src-tauri/target/aarch64-apple-darwin/release/OpenClaw-Deployer \
            -o src-tauri/target/universal/OpenClaw-Deployer
        
        log_success "  ✓ 通用二进制构建完成"
    else
        log_info "[3/5] 构建 macOS 安装包 ($target)..."
        log_info "  这可能需要几分钟时间，请耐心等待..."
        
        cargo tauri build --target "$target"
        
        log_success "  ✓ 构建完成!"
        echo ""
        
        # 显示输出位置
        log_info "[4/5] 构建输出:"
        local bundle_dir="src-tauri/target/$target/release/bundle"
        
        if [ -d "$bundle_dir/dmg" ]; then
            for file in "$bundle_dir/dmg"/*.dmg; do
                if [ -f "$file" ]; then
                    local size=$(du -h "$file" | cut -f1)
                    log_success "  📦 $(basename "$file") ($size)"
                fi
            done
        fi
        
        if [ -d "$bundle_dir/macos" ]; then
            for file in "$bundle_dir/macos"/*.app; do
                if [ -d "$file" ]; then
                    local size=$(du -sh "$file" | cut -f1)
                    log_success "  📦 $(basename "$file") ($size)"
                fi
            done
        fi
    fi

    echo ""
    log_success "[5/5] 构建成功! 🎉"
    echo ""
    log_info "安装包位置: src-tauri/target/$target/release/bundle"
    echo ""
}

# 显示帮助
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --dev        启动开发模式"
    echo "  --release    构建发布版本 (默认)"
    echo "  --universal  构建通用二进制 (Intel + Apple Silicon)"
    echo "  --help       显示帮助"
    echo ""
}

# 解析参数
case "${1:-}" in
    --dev)
        main "dev"
        ;;
    --release)
        main "release"
        ;;
    --universal)
        main "universal"
        ;;
    --help|-h)
        show_help
        ;;
    "")
        main "release"
        ;;
    *)
        log_error "未知选项: $1"
        show_help
        exit 1
        ;;
esac
