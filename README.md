# OpenClaw Deployer - macOS 版

## 📥 下载安装

### 方式一：DMG 安装包（推荐）

1. 下载 `OpenClaw-Deployer_1.0.0_x64.dmg`
2. 双击打开 DMG 文件
3. 将 "OpenClaw Deployer" 拖到 Applications 文件夹
4. 从启动台或 Applications 文件夹启动

### 方式二：App 文件

1. 下载 `OpenClaw-Deployer.app.tar.gz`
2. 解压到 Applications 文件夹
3. 首次运行可能需要右键点击选择"打开"

## 🚀 快速开始

### 前置要求

在使用前，请确保已安装以下软件：

1. **Docker Desktop for Mac**
   - Intel Mac: https://desktop.docker.com/mac/main/amd64/Docker.dmg
   - Apple Silicon Mac (M1/M2/M3): https://desktop.docker.com/mac/main/arm64/Docker.dmg
   - 或使用 Homebrew: `brew install --cask docker`

2. **Git**（可选，macOS 通常已预装）
   - 如未安装: `brew install git`

### 验证安装

打开终端，运行以下命令：

```bash
# 检查 Docker
docker --version

# 检查 Docker Compose
docker-compose --version
# 或
docker compose version

# 检查 Git
git --version
```

## 🛠️ 构建说明

### 环境要求

- macOS 11.0 (Big Sur) 或更高版本
- Rust 1.70+ （https://rustup.rs/）
- Node.js 18+ （https://nodejs.org/ 或使用 `brew install node`）
- Xcode Command Line Tools: `xcode-select --install`

### 构建步骤

```bash
# 1. 进入项目目录
cd openclaw-deployer-macos

# 2. 安装依赖
npm install

# 3. 安装 Rust 依赖（首次需要）
cd src-tauri
cargo fetch
cd ..

# 4. 构建 macOS 版本
# Intel Mac:
npm run build:mac

# Apple Silicon Mac (M1/M2/M3):
npm run build:mac-arm

# 输出位置：
# src-tauri/target/x86_64-apple-darwin/release/bundle/  (Intel)
# src-tauri/target/aarch64-apple-darwin/release/bundle/ (Apple Silicon)
```

### 构建通用二进制（Universal Binary）

同时支持 Intel 和 Apple Silicon：

```bash
# 构建两个版本
cargo tauri build --target x86_64-apple-darwin
cargo tauri build --target aarch64-apple-darwin

# 合并为通用二进制
lipo -create \
  src-tauri/target/x86_64-apple-darwin/release/OpenClaw-Deployer \
  src-tauri/target/aarch64-apple-darwin/release/OpenClaw-Deployer \
  -o src-tauri/target/universal/OpenClaw-Deployer
```

### 构建输出

构建完成后，会在以下位置生成安装包：

```
src-tauri/target/x86_64-apple-darwin/release/bundle/     # Intel Mac
src-tauri/target/aarch64-apple-darwin/release/bundle/    # Apple Silicon
├── dmg/                                                  # DMG 安装包
│   └── OpenClaw-Deployer_1.0.0_x64.dmg
├── app/                                                  # App 文件
│   └── OpenClaw-Deployer.app
└── tar.gz/                                               # 压缩包
    └── OpenClaw-Deployer.app.tar.gz
```

## 📝 使用说明

1. **启动应用**：
   - 从 Applications 文件夹双击打开
   - 或使用 Spotlight 搜索 "OpenClaw Deployer"

2. **系统托盘**：
   - 应用最小化后会显示在菜单栏
   - 点击图标可显示/隐藏窗口

3. **部署 OpenClaw**：
   - 选择 AI 模型提供商（Claude、GPT、Gemini 等）
   - 配置通信渠道（企业微信、飞书、Telegram 等）
   - 选择需要的 Skills
   - 点击"开始部署"

## 🔧 常见问题

### Q: 提示 "无法打开应用，因为无法验证开发者"
A: 
1. 前往 系统设置 → 隐私与安全性
2. 找到 "OpenClaw Deployer"，点击"仍要打开"
3. 或使用终端: `xattr -cr /Applications/OpenClaw-Deployer.app`

### Q: 提示 "Docker 未安装"
A: 请先安装 Docker Desktop 并确保其正在运行

### Q: Apple Silicon Mac 上运行 Intel 版本
A: 使用 Rosetta 2 自动转译，或下载 Apple Silicon 专用版本

## 📞 技术支持

- GitHub Issues: https://github.com/openclaw/openclaw/issues
- 文档: https://openclaw.ai/docs
