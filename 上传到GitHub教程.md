# OpenClaw Deployer - 上传到 GitHub 自动构建教程

## 🎯 目标

把代码上传到 GitHub，让 GitHub Actions 自动帮你编译出安装包！

---

## 📋 准备工作

### 1. 注册 GitHub 账号（如果还没有）
- 访问 https://github.com/signup
- 用邮箱注册，设置用户名和密码

### 2. 安装 Git（如果还没有）

**Mac:**
```bash
# 打开终端，运行
xcode-select --install
```

**Windows:**
- 下载 https://git-scm.com/download/win
- 安装时一路 Next

---

## 🚀 上传步骤

### 步骤 1: 打开终端

**Mac:** 按 `Command + 空格`，输入 `Terminal`，回车

**Windows:** 按 `Win + R`，输入 `cmd`，回车

### 步骤 2: 进入项目目录

```bash
cd ~/Downloads/openclaw-deployer-easy
```

（根据你实际存放的位置调整）

### 步骤 3: 初始化 Git 仓库

```bash
git init
```

### 步骤 4: 添加所有文件

```bash
git add .
```

### 步骤 5: 提交代码

```bash
git commit -m "Initial commit"
```

### 步骤 6: 在 GitHub 创建仓库

1. 打开浏览器，访问 https://github.com/new
2. **Repository name** 填写: `openclaw-deployer`
3. **Description** 填写: `OpenClaw 一键部署工具`
4. 选择 **Public**（公开）
5. 不要勾选 "Add a README file"
6. 点击 **Create repository**

### 步骤 7: 关联远程仓库

在终端运行（把 `你的用户名` 替换成你的 GitHub 用户名）:

```bash
git remote add origin https://github.com/你的用户名/openclaw-deployer.git
```

### 步骤 8: 推送代码

```bash
git branch -M main
git push -u origin main
```

这时会提示输入用户名和密码：
- **用户名**: 你的 GitHub 用户名
- **密码**: 不是登录密码！需要创建 Personal Access Token

---

## 🔑 创建 Personal Access Token

GitHub 不再支持用密码推送代码，需要创建 Token：

1. 访问 https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. **Note** 填写: `Git Push`
4. **Expiration** 选择: `No expiration`
5. 勾选以下权限:
   - ✅ `repo` (完整仓库访问)
6. 点击 **Generate token**
7. **复制生成的 token**（只显示一次！）

推送代码时，用这个 token 代替密码。

---

## ⏳ 等待自动构建

代码推送成功后：

1. 打开浏览器，访问 `https://github.com/你的用户名/openclaw-deployer`
2. 点击上方的 **Actions** 标签
3. 你会看到 "Build OpenClaw Deployer" 正在运行
4. 等待约 **10-15 分钟**

---

## 📥 下载安装包

构建完成后：

1. 在 Actions 页面，点击最新的成功构建
2. 滚动到最下方 **Artifacts** 区域
3. 下载对应你系统的文件:
   - **Mac Intel**: `OpenClaw-Deployer-macOS-Intel`
   - **Mac M1/M2/M3**: `OpenClaw-Deployer-macOS-AppleSilicon`
   - **Windows**: `OpenClaw-Deployer-Windows`

---

## 🎉 完成！

下载的 `.dmg` (Mac) 或 `.exe` (Windows) 就是可以直接双击运行的安装包！

---

## 🐛 常见问题

### Q: 推送时提示 "Permission denied"
A: 检查 Personal Access Token 是否正确，确保勾选了 `repo` 权限

### Q: Actions 构建失败
A: 点击失败的构建，查看日志，通常是网络问题，可以重新运行

### Q: 如何重新触发构建
A: 在 Actions 页面，点击 "Run workflow" 按钮

### Q: 如何更新代码后重新构建
A: 修改代码后，重复步骤 4-8

---

## 📞 需要帮助？

如果遇到困难，可以：
1. 截图错误信息
2. 发给我帮你分析
