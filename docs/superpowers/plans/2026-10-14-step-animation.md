# Step Animation Implementation Plan

**Goal:** 207个步骤具有语义准确的可复用动画，30款甜品独立成品配置，手机完整卡片首屏可见并发布。

**Architecture:** 数据显式声明场景序列和成品配置。统一SVG零件渲染24类动作，单播放器控制当前步骤。响应式布局优先卡片。

- [x] 定义 src/animations/types.ts：模板、参数、步骤与成品契约。
- [x] 迁移 public/data/recipes.json 的60份配方，保留原步骤说明并逐条声明动作场景；src/types.ts引用新类型。
- [x] 创建 src/animations/parts.tsx、FinishArtwork.tsx、StepScene.tsx、StepAnimationPlayer.tsx、animations.css；共享零件，动作和成品按配置渲染。
- [x] RecipeDetail.tsx接入步骤选择、播放控制和文字说明；App.tsx首页/图鉴采用成品配置。
- [x] 调整首页手机DOM布局及独立CSS，紧凑导航、标题、完整卡片、分类和抽卡按钮；SVG替代emoji。
- [x] 更新 scripts/validate-recipes.mjs 校验步骤场景和成品参数；使用负面输入验证，完成后删除临时测试。
- [x] 类型检查、生产构建、代表性动作和播放/暂停/切换/减少动态检查、手机320/375/390/430与横屏边界验证、离线回归。
- [x] 独立审查并修复问题；更新README与验收证据；main推送并检查Pages线上结果。

验证命令：npm run typecheck、npm run validate、npm run build；数据错误必须阻止发布。临时测试直接执行并删除，不增加长期测试框架或动画依赖。
