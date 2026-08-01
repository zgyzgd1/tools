# ToolKnit Desktop — 优化交接文档

## 日期: 2026-08-01

---

## 一、本次优化摘要

基于代码审查结果，执行了安全加固、架构模块化和编译验证，共修改 11 个文件，新增 883 行，删除 104 行。

## 二、变更清单

### 2.1 安全加固

| 文件 | 变更内容 |
|------|---------|
| `src-tauri/src/lib.rs` | FFmpeg 下载后新增 SHA256 校验（通过 `FFMPEG_SHA256` 环境变量传入预期哈希） |
| `src-tauri/Cargo.toml` | 添加 `sha2 = "0.10"` 依赖 |
| `toolknit-api/server.js` | CORS 默认从 `*` 改为 same-origin，需显式配置 `CORS_ORIGIN` |
| `src-tauri/src/lib.rs` | `setup()` 中窗口图标加载用 `ok_or_else` 替代 `unwrap()`，避免启动 panic |

### 2.2 架构模块化

| 新增文件 | 说明 |
|---------|------|
| `src/config.js` | 可配置 API 端点、更新 manifest URL、FFmpeg 下载 URL，通过 `VITE_*` 环境变量覆盖 |
| `src/constants.js` | 集中管理文件大小限制、存储键名、速率限制、UI 定时等常量 |
| `src/utils/dom.js` | 共享 DOM 工具函数：`escapeHtml`、`formatBytes`、`formatDuration`、`debounce`、`createElement` |
| `src/modules/auth.js` | 认证模块（28KB），从 main.js 提取，导出 `init()`、`logout()`、`isLoggedIn()`、`hasAiApiKey()`、`authHeaders()`、`updatePersonalPanel()`、`restoreSession()`、`openAuthOverlay()`、`openToolWithAiCheck()` 等 |
| `.env.example` | 前端环境变量模板 |

### 2.3 代码清理

| 文件 | 变更内容 |
|------|---------|
| `scripts/subset-fonts.cjs` | 删除 ~90 行废弃的 `opentype.js`/`fontkit` 子集化实验代码（179→90 行），仅保留 `subset-font` 实际使用路径 |

## 三、Git 信息

```
提交哈希: 25a615b
分支: main
提交信息: refactor: security hardening, modularization, and build config
父提交: a10ae4a (docs: 添加 README)
```

## 四、编译验证

- **前端**: Vite build 成功（1993 个模块，25.97s）
- **后端 Rust**: `cargo check` 通过（仅 3 个预存警告）
- **可执行文件**: `src-tauri/target/release/toolknit-desktop.exe`（56 MB）
- **JS 语法**: 所有新增文件通过 `node --check` 验证

## 五、后续待办

| 优先级 | 事项 | 说明 |
|--------|------|------|
| P1 | 提取 main.js 剩余模块 | 图片/音频/视频/PDF/AI 工具可按 auth.js 模式继续拆分到 `modules/` |
| P1 | 设置 FFMPEG_SHA256 | 在 CI/CD 中配置 FFmpeg 包的 SHA256 校验值 |
| P1 | 配置 CORS_ORIGIN | 生产部署时设置 `CORS_ORIGIN=https://your-domain.com` |
| P2 | 添加单元测试 | 为核心逻辑（auth、文件处理、限额计算）补充测试 |
| P2 | 拆分 main.js | 目标将 680KB 的 main.js 拆分为 <100KB 的入口 + 多个模块 |
| P3 | 生成 NSIS 安装包 | `npx tauri build --bundles nsis` 生成带向导的安装程序 |

## 六、构建命令

```bash
# 开发模式
npm run tauri dev

# 编译发布版
npm run tauri build

# 生成 NSIS 安装包
npx tauri build --bundles nsis

# 指定自定义 API 端点编译
VITE_API_BASE=https://your-api.com npm run tauri build
```

## 七、环境变量参考

### 前端（.env / 构建时）
```
VITE_API_BASE=https://toolknitapi.24picture.com
VITE_UPDATE_MANIFEST_PRIMARY=https://cdn.24picture.com/toolknit/manifest.json
VITE_UPDATE_MANIFEST_FALLBACK=https://toolknit.cn-nb1.rains3.com/manifest.json
VITE_FFMPEG_PRIMARY_CN=https://toolknit.cn-nb1.rains3.com/ffmpeg-master-latest-win64-gpl.zip
VITE_FFMPEG_PRIMARY_EN=https://cdn.24picture.com/ffmpeg-master-latest-win64-gpl.zip
```

### 后端（toolknit-api/.env）
```
CORS_ORIGIN=https://your-domain.com
JWT_SECRET=<至少16字符随机字符串>
FFMPEG_SHA256=<ffmpeg压缩包的SHA256哈希>
```

## 八、项目结构（变更后）

```
toolknit-desktop/
├── src/
│   ├── main.js              ← 应用入口（15220行，待继续拆分）
│   ├── config.js            ← [新增] 可配置端点
│   ├── constants.js         ← [新增] 常量集中管理
│   ├── modules/
│   │   └── auth.js          ← [新增] 认证模块
│   ├── utils/
│   │   └── dom.js           ← [新增] DOM 工具函数
│   ├── i18n.js              ← 国际化
│   ├── darkveil.js          ← 背景动画
│   └── ...
├── src-tauri/
│   ├── Cargo.toml           ← [修改] 添加 sha2 依赖
│   └── src/
│       └── lib.rs           ← [修改] SHA256 校验 + unwrap 修复
├── .env.example             ← [新增] 环境变量模板
└── scripts/
    └── subset-fonts.cjs     ← [修改] 清理废弃代码
```
