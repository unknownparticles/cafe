# Daily Ritual · 日常灵感事务所

移动优先的咖啡与甜品抽卡 PWA。React + TypeScript + Vite，配方和原创 SVG 均为本地静态资源，无后端、无运行时第三方 API、无外部字体。

## 本地运行

Node.js 20.19+ 或 22.12+：

```sh
npm ci
npm run dev
```

打开终端输出的 `/cafe/` 地址。生产验证：

```sh
npm run build
npm run preview
```

`build` 必须依次通过 TypeScript 检查、60 条配方校验、Vite 构建和 Service Worker 生成。开发模式不注册 Service Worker；离线能力请使用生产预览或 HTTPS Pages 站点验证。

## 使用

- 首页选择咖啡、甜品或随机混合后抽卡。动画可以跳过，并尊重系统减少动态效果。
- 配方图鉴支持名称、食材、风味搜索、分类、难度与收藏筛选；这些筛选也会用于下一次抽卡。
- 详情中调整份量只换算食材，不换算温度、时间及萃取参数。大量制作请分批。
- 收藏与动画偏好仅保存于当前浏览器；清除网站数据会移除收藏。存储失败时保留当前页面内存中的操作并提示。
- 首次在线访问完成缓存后，可以离线打开、抽卡、浏览配方和收藏。

## 安装与更新

iOS/iPadOS Safari 使用「分享 → 添加到主屏幕」。Chrome/Edge 使用浏览器安装入口；支持安装提示事件时，设置页显示安装按钮。不同浏览器入口不同。

Manifest 使用相对路径，包含 192、512 PNG 图标和 Apple Touch Icon。安全区域通过 CSS `env()` 适配。

每次构建由输出内容生成缓存版本。新 Service Worker 不强制接管旧页面：提示新版就绪后，请关闭所有应用窗口再打开。旧页面保留匹配的脚本和配方，避免更新时混用资源。入口采用网络优先并检查脚本版本；哈希脚本、配方和 SVG 使用所属版本缓存。四张小型原创成品 SVG 随核心预缓存；额外图片缓存有 64 项上限。

## 添加配方

编辑 `public/data/recipes.json`，类型见 `src/types.ts`。每条记录必须包含唯一稳定 ID、四类分组、份量、时间、难度、风味、器具、原料、步骤、制作参数、过敏原、插图/线稿和完整来源审核信息。

原料使用独立 `amount` 数字和 `unit` 文本，不要将 `18g` 存成唯一数量。蛋类优先以蛋液克重表示；整数原料应在备注提供称重或取整建议。总时间应包含冷却/冷藏等待。过敏原在原料中声明并在配方中汇总。

```sh
npm run validate
```

校验失败会阻止发布。当前门禁固定 60 张、每组 15 张；扩充库时同步更新 `scripts/validate-recipes.mjs` 的数量门禁和来源清单。`reviewed` 表示编辑与结构审核，实际制作验证的边界必须写入 `source.reviewNote`。

## 添加动画模板

1. 在 `public/assets/line-art/` 创建原创、安全 SVG，使用 `path` 等几何图形，不嵌入脚本或外部资源。
2. 扩充 `src/types.ts` 的 `AnimationTemplate` 和校验器模板枚举。
3. 用配方的 `artwork.animationTemplate` 与 `lineArt` 引用同名文件；`artwork.image` 引用成品 SVG。
4. `Artwork.tsx` 根据每条路径的真实长度设置描边偏移和顺序延迟。请同时测试静态展示、减少动态效果和加载失败后备。

默认模板为 `coffee-cup`、`coffee-pour` 和 `dessert-outline`。整个界面不使用未经授权的成品照片。

## 授权与数据

详见 [配方来源清单](docs/recipe-sources.md)。配方文字由本项目独立编写，SVG 为本项目原创。没有导入 TheMealDB、GitHub 数据集或 USDA 内容，也没有第三方 API 密钥。配方编辑审核不能替代实际制作验证；请依据器具和原料实际状态调整。

## GitHub Pages 部署

目标仓库：`https://github.com/unknownparticles/cafe`；目标项目路径 `/cafe/`。

1. 在仓库 Settings → Pages，将 Source 设为 GitHub Actions。
2. 推送至 `main`，触发 `.github/workflows/deploy.yml`。
3. 构建任务安装锁文件依赖、检查类型和配方、构建并上传 `dist/`。
4. 部署任务必须等待构建成功，并使用 `github-pages` 环境及最小 Pages/OIDC 权限。
5. 检查 Actions 成功和账号现有域名 `https://alunapp.cn/cafe/`（用户已确认沿用），然后测试缓存完成后的离线打开。默认 github.io 项目地址会遵循账号域名配置。

页面采用 hash 导航，刷新图鉴/收藏不会请求不存在的服务器子路由。更换仓库名或根域名部署时，更新 `vite.config.ts` 的 `base`；所有资源从同一基础路径派生。Service Worker 从自己的地址计算 scope，无需手改仓库路径。

## 验收记录

见 [验收记录](docs/acceptance.md)。自动化/桌面视口检查与真机测试分别记录，未执行的浏览器或设备不标记为通过。
