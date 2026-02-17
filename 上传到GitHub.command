#!/bin/bash

# OpenClaw Deployer - 一键上传到 GitHub 脚本

clear
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     OpenClaw Deployer - 上传到 GitHub                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 检查 Git
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装"
    echo ""
    echo "请安装 Git:"
    echo "  Mac: xcode-select --install"
    echo "  或访问: https://git-scm.com/download"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

echo "✓ Git 已安装"
echo ""

# 检查是否已初始化
if [ -d ".git" ]; then
    echo "✓ Git 仓库已初始化"
else
    echo "📦 初始化 Git 仓库..."
    git init
fi
echo ""

# 添加所有文件
echo "📦 添加文件..."
git add .

# 提交
echo "📦 提交代码..."
git commit -m "Initial commit" 2>/dev/null || echo "✓ 代码已是最新"
echo ""

# 检查是否已关联远程仓库
if git remote get-url origin &> /dev/null; then
    echo "✓ 已关联远程仓库"
    REMOTE_URL=$(git remote get-url origin)
    echo "  地址: $REMOTE_URL"
else
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  首次使用，需要配置 GitHub 仓库                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "请按以下步骤操作："
    echo ""
    echo "1. 访问 https://github.com/new"
    echo "2. Repository name 填写: openclaw-deployer"
    echo "3. 点击 Create repository"
    echo "4. 复制仓库地址（选择 HTTPS）"
    echo ""
    read -p "粘贴仓库地址 (https://github.com/用户名/openclaw-deployer.git): " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo "❌ 地址不能为空"
        exit 1
    fi
    
    git remote add origin "$REPO_URL"
    echo "✓ 已关联远程仓库"
fi
echo ""

# 设置分支名并推送
echo "📤 推送代码到 GitHub..."
git branch -M main

# 尝试推送
if git push -u origin main; then
    echo ""
    echo "✅ 上传成功！"
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  接下来：                                                   ║"
    echo "║                                                            ║"
    echo "║  1. 打开浏览器访问你的 GitHub 仓库                          ║"
    echo "║  2. 点击 Actions 标签                                       ║"
    echo "║  3. 等待构建完成（约 10-15 分钟）                           ║"
    echo "║  4. 下载生成的安装包                                        ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    # 提取用户名和仓库名
    REMOTE_URL=$(git remote get-url origin)
    if [[ $REMOTE_URL == *"github.com"* ]]; then
        # 处理 HTTPS 格式
        REPO_PATH=$(echo "$REMOTE_URL" | sed 's/https:\/\/github.com\///' | sed 's/\.git//')
        echo "仓库地址: https://github.com/$REPO_PATH"
        echo "Actions: https://github.com/$REPO_PATH/actions"
        echo ""
    fi
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "可能的原因："
    echo "  1. 需要登录 GitHub"
    echo "  2. 需要使用 Personal Access Token 代替密码"
    echo ""
    echo "解决方法："
    echo "  1. 访问 https://github.com/settings/tokens"
    echo "  2. 点击 Generate new token (classic)"
    echo "  3. 勾选 'repo' 权限"
    echo "  4. 用 token 代替密码"
    echo ""
fi

read -p "按回车键退出..."
