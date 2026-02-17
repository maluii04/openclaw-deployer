# OpenClaw Deployer - 一键部署工具

真正一键运行的 OpenClaw 部署工具，自动检测并安装依赖。

## ✨ 特性

- 🎯 **一键运行** - 双击即可启动，自动检测环境
- 🤖 **自动安装** - 缺失的依赖可以一键自动安装
- 🎨 **精美界面** - 现代化的向导式操作界面
- 🚀 **快速部署** - 4 步完成 OpenClaw 部署

## 📦 前置要求

| 软件 | 必需 | 说明 |
|------|------|------|
| Node.js 18+ | ✅ | 构建时需要 |
| Rust 1.70+ | ✅ | 构建时需要 |
| Docker Desktop | ✅ | 运行时必需 |
| Git | ❌ | 可选 |

## 🚀 快速开始

### 方式一：使用预编译版本（推荐）

1. 下载 `OpenClaw-Deployer.dmg`
2. 双击挂载，将应用拖到 Applications
3. 从启动台打开应用
4. 应用会自动检测环境，如有缺失会提示安装

### 方式二：自己构建

```bash
# 1. 确保已安装 Node.js 和 Rust
node --version  # v18+
rustc --version  # 1.70+

# 2. 进入项目目录
cd openclaw-deployer-easy

# 3. 运行构建脚本
./构建命令

# 4. 获取安装包
# 位置: src-tauri/target/release/bundle/dmg/OpenClaw-Deployer_1.0.0_x64.dmg
```

## 🖥️ 使用流程

1. **环境检测** - 应用启动时自动检测 Docker 等依赖
2. **自动安装** - 如有缺失，点击"一键安装"即可
3. **选择 AI 模型** - 选择 Claude/GPT/Gemini 并输入 API Key
4. **配置通信渠道** - 选择企业微信/飞书/Telegram 等
5. **选择 Skills** - 选择需要的功能扩展
6. **一键部署** - 点击部署，等待完成

## 📁 项目结构

```
openclaw-deployer-easy/
├── src/                    # React 前端代码
│   ├── components/        # 组件
│   │   ├── SystemCheck.tsx    # 系统检测
│   │   └── DeployWizard.tsx   # 部署向导
│   ├── App.tsx           # 主应用
│   └── main.tsx          # 入口
├── src-tauri/            # Rust 后端代码
│   ├── src/main.rs       # 主程序
│   ├── tauri.conf.json   # Tauri 配置
│   └── icons/            # 应用图标
├── package.json          # Node.js 配置
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 配置
└── 构建命令              # 构建脚本
```

## 🔧 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri:dev

# 构建发布版本
npm run tauri:build
```

## 🐛 常见问题

### Q: 构建失败
A: 确保已安装 Node.js 18+ 和 Rust 1.70+

### Q: Docker 安装失败
A: 手动从 https://www.docker.com/products/docker-desktop 下载安装

### Q: 应用无法打开
A: macOS 提示"无法验证开发者"时，前往 系统设置 → 隐私与安全性 → 点击"仍要打开"

## 📄 许可证

MIT
