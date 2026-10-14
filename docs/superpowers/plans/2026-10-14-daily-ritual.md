# Daily Ritual Implementation Plan

> Execute tasks in this session, checking the approved design after each group.

**Goal:** 完成 60 张配方的抽卡 PWA 并部署到 unknownparticles/cafe 的 GitHub Pages。

**Architecture:** React 负责页面和交互，纯函数负责筛选、抽卡与份量；本地 JSON 与原创 SVG 提供内容。构建生成版本化 Service Worker，GitHub Actions 校验后部署。

**Tech Stack:** React、TypeScript、Vite、SVG/CSS、Node.js。

## 1. 基础工程

- [x] 核对远程仓库并获取现有文件，避免覆盖未知内容。
- [x] 创建 package.json、tsconfig.json、vite.config.ts、index.html 和 .gitignore。固定 /cafe/ base，scripts 提供 typecheck、validate、build、dev 和 preview。
- [x] 安装依赖并保存锁文件。

## 2. 数据与核心逻辑

- [x] src/types.ts 定义完整 Recipe、Ingredient、Source、Artwork 类型。
- [x] 先用临时脚本验证空候选、避免重复、单候选、缩放不改源数据及过滤行为，再实现 src/services/recipes.ts。
- [x] public/data/recipes.json 编写 60 条完整配方，各组 15 条，包含配比、步骤、器具、过敏原和审核记录。
- [x] scripts/validate-recipes.mjs 校验字段、分组数量、资源路径、来源、授权及 reviewed 状态；执行 node scripts/validate-recipes.mjs 应输出 60 条通过。

## 3. 原创资源与界面

- [x] public/assets/line-art/ 创建 coffee-cup、coffee-pour、dessert-outline 三模板及成品 SVG。
- [x] src/components/Artwork.tsx 按实际路径长度绘制，支持静态后备和按模板加载。
- [x] src/App.tsx、src/components/RecipeDetail.tsx、src/styles.css 实现抽卡、图鉴、收藏、设置、安装与响应式布局。
- [x] 显式处理存储失败、加载失败、空结果、防重复抽卡、隐藏标签页、跳过动画、焦点与滚动恢复。

## 4. PWA 与部署

- [x] 创建 public/manifest.webmanifest、public/icons/、public/offline.html。
- [x] scripts/build-sw.mjs 从 dist 生成内容版本和资源清单，Service Worker 不强制接管旧客户端。
- [x] .github/workflows/deploy.yml main 触发构建再发布，包含必要 Pages 权限与 github-pages 环境。
- [x] 执行 npm run typecheck、npm run validate、npm run build，检查 dist 子路径一致性。

## 5. 验收与交付

- [x] 浏览器验证桌面/移动布局、抽卡三模式、跳过、防连点、筛选、收藏重载、缩放、键盘操作。
- [x] 生产预览验证安装资源、首次缓存后离线重启、网络恢复、版本更新和 hash 刷新。
- [x] 修复验收问题后删除临时测试文件，保留数据校验脚本。
- [x] README.md、docs/recipe-sources.md、docs/acceptance.md 记录运行/扩展/授权/部署和实际证据；不把模拟设备当真机。
- [x] 核对远程权限后推送发布，检查 Actions 与公开页面。若外部权限缺失，保留目标并明确阻塞项。

## 外部验收跟踪

- [ ] 补齐用户真机平台/版本与浏览器矩阵记录，尚未覆盖的设备保持未验证。
