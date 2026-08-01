# ToolKnit Desktop 🛠️

<p align="center">
  <b>.ToolKnit 桌面客户端 — 离线优先的万能工具箱</b><br>
  <sub>所有文件本地处理，无需上传云端，隐私安全有保障</sub>
</p>

---

## 📖 项目简介

ToolKnit Desktop 是一款基于 **Tauri v2** 构建的 Windows 桌面应用程序，集成 PDF、图片、音频、视频、文本、AI 创意等六大工具套件。所有处理均在本地完成，无需联网，保护您的数据隐私。

本项目基于 [ZihangDong/toolknit-desktop](https://github.com/ZihangDong/toolknit-desktop.git) 进行二次开发。

---

## ✨ 核心功能

### 📄 PDF 工具箱
- PDF 转图片、拆分、合并、压缩、旋转
- 加密/解密、格式转换、页码提取、水印处理

### 🖼️ 图片工具箱
- 格式转换（JPG / PNG / WebP / BMP / GIF）
- 批量转换、压缩、去水印、裁剪、拼图

### 🎵 音频工具箱
- 格式转换（MP3 / WAV / FLAC / AAC / M4A / OGG）
- 音频剪辑、音频提取、BPM 检测、声道处理

### 🎬 视频工具箱
- 格式转换、视频截图、视频压缩

### 📝 文本工具箱
- 全角半角转换、文本反转、简繁转换
- 大小写转换、文本格式化

### 🤖 AI 创意助手
- AI 翻译、AI 润色、AI 文档生成、AI 角色扮演

---

## 🎯 使用体验

| 特性 | 说明 |
|------|------|
| 🔒 **离线优先** | 所有工具本地运行，文件无需上传，隐私无忧 |
| 🖱️ **拖拽处理** | PDF、图片、音频、视频等文件支持拖拽导入 |
| 📦 **批量处理** | 图片、音频等工具支持批量导入与一键导出 |
| 💾 **路径记忆** | 可自定义默认保存位置，后续导出自动沿用 |
| 🌐 **中英双语** | 一键切换 中文 / English，完整本地化 |
| 🎨 **深色主题** | 深色主题 + WebGL 动态背景，视觉体验一致 |

---

## 🛠️ 技术栈

### 前端
- **框架**：Vanilla JavaScript (ES Modules)
- **构建**：Vite 5
- **UI**：原生 CSS + Canvas 视觉特效（DarkVeil / Plasma / Ferrofluid）
- **图表**：Chart.js
- **3D**：Three.js / OGL

### 后端（Rust / Tauri）
- **框架**：Tauri v2.11.2
- **异步**：Tokio + reqwest（rustls-tls）
- **图像处理**：image crate
- **文件处理**：zip + sha2

### 配套 API
- **运行时**：Node.js + Express
- **数据库**：MySQL（mysql2）
- **认证**：JWT + bcrypt
- **安全**：helmet + CORS + express-rate-limit

---

## 🚀 开发指南

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) >= 1.70
- [MySQL](https://dev.mysql.com/downloads/) >= 8.0（仅 API 服务需要）

### 安装依赖

```bash
# 安装前端依赖
cd toolknit-desktop
npm install

# 配置 API 服务（可选）
cd toolknit-api
npm install
cp .env.example .env
# 编辑 .env 填入数据库配置
```

### 开发模式

```bash
# 启动前端开发服务器（端口 1420）
npm run dev

# 启动 Tauri 开发模式（含 Rust 后端）
npm run tauri dev

# 启动 API 服务（可选）
cd toolknit-api && npm start
```

### 构建发布

```bash
# 编译前端
npm run build

# 编译 Rust 后端
cd src-tauri && cargo build --release

# 生成 NSIS 安装包
npx tauri build --bundles nsis

# 自定义 API 端点编译
VITE_API_BASE=https://your-api.com npm run tauri build
```

---

## 📁 项目结构

```
toolknit-desktop/
├── src/                        # 前端源码
│   ├── main.js                 # 应用入口
│   ├── config.js               # 运行时配置（API 端点、更新 manifest 等）
│   ├── constants.js            # 全局常量
│   ├── i18n.js                 # 国际化
│   ├── modules/
│   │   └── auth.js             # 认证模块
│   ├── utils/
│   │   └── dom.js              # DOM 工具函数
│   ├── locales/                # 翻译文件（zh.json / en.json）
│   ├── data/                   # 静态数据
│   ├── darkveil.js             # 背景动画效果
│   └── ...
├── src-tauri/                  # Rust 后端（Tauri）
│   ├── Cargo.toml              # Rust 依赖
│   └── src/
│       └── lib.rs              # Tauri 命令实现
├── toolknit-api/               # 配套 REST API
│   ├── server.js               # 入口
│   ├── routes/                 # 路由
│   ├── controllers/            # 控制器
│   ├── middleware/             # 中间件（限流、认证、错误处理）
│   └── config/                 # 配置
├── public/                     # 静态资源（字体、图标）
├── scripts/                    # 构建脚本
├── package.json
├── vite.config.js
└── .env.example                # 环境变量模板
```

---

## 🔧 环境变量

### 前端（.env / 构建时）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_BASE` | `https://toolknitapi.24picture.com` | API 端点 |
| `VITE_UPDATE_MANIFEST_PRIMARY` | CDN 主地址 | 更新清单主源 |
| `VITE_UPDATE_MANIFEST_FALLBACK` | CDN 备地址 | 更新清单备源 |
| `VITE_FFMPEG_PRIMARY_CN` | 国内 CDN | FFmpeg 下载（国内） |
| `VITE_FFMPEG_PRIMARY_EN` | 海外 CDN | FFmpeg 下载（海外） |

### 后端（toolknit-api/.env）

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务端口 |
| `DB_HOST` | `127.0.0.1` | 数据库地址 |
| `DB_PORT` | `3306` | 数据库端口 |
| `DB_NAME` | `toolknit` | 数据库名 |
| `DB_USER` | `toolknit` | 数据库用户 |
| `DB_PASSWORD` | *(必填)* | 数据库密码 |
| `JWT_SECRET` | *(必填)* | JWT 密钥（≥16字符） |
| `CORS_ORIGIN` | *(空=仅同源)* | 允许的跨域来源 |
| `FFMPEG_SHA256` | *(可选)* | FFmpeg 包 SHA256 校验值 |

---

## 🔒 安全说明

本项目已实施以下安全措施：

- **路径安全**：所有文件操作经过 `is_path_safe` 白名单校验，防止路径穿越
- **输入验证**：前端 escapeHtml + 后端 express-validator 双重校验
- **SQL 注入防护**：全部使用参数化查询
- **XSS 防护**：用户可控数据输出前均经 HTML 转义
- **速率限制**：API 分层限流（通用/注册/登录/上传/写入）
- **文件上传**：类型 + MIME 双重校验、随机文件名、大小限制
- **CORS**：默认仅 same-origin，需显式配置跨域来源

---

## 📋 更新日志

### v1.0.1 (2026-08-01) — 安全修复

- 修复 `is_path_safe` 路径穿越漏洞（CRITICAL）
- 为 6 个 Tauri 命令添加路径白名单校验
- 修复收藏/推荐/最近列表 XSS 风险
- 头像上传新增 MIME 类型校验
- 修复 JoinSet 静默吞 panic
- 数据库密码移除空默认值

### v1.0 Beta (2026-06-30) — 首个公开测试版

- 桌面客户端首发（Windows .exe）
- 中英双语界面
- PDF / 图片 / 音频 / 视频 / 文本 / AI 六大工具套件
- 离线优先、拖拽处理、批量处理

[完整更新日志](https://toolknit.com/changelog.html)

---

## 📜 许可证

本项目基于原项目 [ZihangDong/toolknit-desktop](https://github.com/ZihangDong/toolknit-desktop.git) 进行二次开发。

---

<p align="center">
  ⭐ 如果这个项目对你有帮助，欢迎 Star！<br>
  🐛 发现问题？欢迎提交 <a href="https://github.com/zgyzgd1/tools/issues">Issue</a>
</p>
