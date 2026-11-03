<h1 align="center">专注番茄钟 Focus App</h1>

**🌱 一套自托管的移动端效率应用：番茄钟 + 待办 + 习惯打卡 + 备忘录，前端基于 [vue3-h5-template](https://github.com/yulimchen/vue3-h5-template) 二次开发，后端为 Cloudflare Workers + D1 的无服务器架构，全链路 0 元托管**

由两部分组成：

- **前端**（仓库根目录，Vue3 + TypeScript + Vant4 + Tailwindcss）：四个业务页面 + 底部导航，数据通过 REST 接口与云端同步
- **后端**（`server/`，Hono + Drizzle ORM + Cloudflare D1）：5 组 REST 路由 + Bearer Token 鉴权 + 5 张业务表，部署在 Cloudflare 边缘网络

> ## 🙏 致谢 —— 感谢模板作者
>
> 本项目基于模板作者 **[yulimchen](https://github.com/yulimchen)** 的开源项目二次开发：
>
> - **[vue3-h5-template](https://github.com/yulimchen/vue3-h5-template)** —— Vue3 + Vite + TS + Vant4 + Tailwindcss 开箱即用的移动端基础模板（MIT 协议）
>
> 模板的工程化能力（按需引入、视口适配、Axios 封装、Mock、ESLint、深色模式等）均来自上游模板，特此致谢。模板能力说明见其 [README](https://github.com/yulimchen/vue3-h5-template#readme)。

## 核心功能

### 🍅 番茄钟

- **番茄闹钟列表**：默认 25 / 15 / 10 分钟三档，右上角加号新增（底部弹窗：事项名称 + 时长步进器），左滑编辑/删除
- **专注计时页**：进度圆环 100ms 步进平滑移动 + 大号倒计时，暂停/继续为圆形图标按钮，结束时手机震动 + 弹窗提醒
- **专注统计**：自然计时完成后自动记录，首页展示「今日已完成 X 次专注 / 累计专注 Y 分钟」，完成弹窗同步播报
- **待办联动**：待办事项可一键「转为番茄闹钟」（弹窗内再确认名称/优先级/日期/时长）

### ✅ 待办

- 任务列表：复选框圆角样式，点击整行切换完成状态，已完成项置底变灰加删除线
- 最后一行直接输入回车即新增；左滑编辑/删除
- 编辑弹窗：任务名称、优先级（无/低/中/高彩色标签）
- 一键转化：「转为番茄闹钟」「转为习惯打卡」

### 📅 习惯打卡

- **自定义月历**：可翻月；今天实心圆、选中日期圆环描边、有打卡记录的日期显示各习惯彩色圆点（超过 4 个折叠为图标）
- **点击任意日期**：列表直接切换为该日打卡情况，顶栏出现「回到今天」快捷按钮
- **打卡列表**：习惯名称 + 频率 + 累计天数，颜色标签与日历圆点同色（按习惯 id 哈希固定，新增/删除不影响其他习惯）
- 新增/编辑弹窗：习惯名称 + 频率（每天/工作日/周末/每周一~日）

### 📝 备忘录

- 列表按修改时间倒序，显示标题 + 时间，左滑删除
- 富文本编辑页：加粗/斜体/下划线/列表/标题工具栏，与浏览器选区同步的激活态高亮，右上角「完成」保存

### 🧭 布局与主题

- 顶栏统一承载页面标题、各页新增按钮、「回到今天」、日夜模式切换（View Transition 圆形扩散动画）
- 底部导航：专注 / 待办 / 习惯 / 备忘录；计时页与编辑页自动隐藏导航
- 全局弹窗统一美化：圆角、留白、确认按钮带主题色背景、删除确认红色警示

## 在线地址

| 组件 | 地址 | 说明 |
| --- | --- | --- |
| 应用页面 | https://focus-app-64v.pages.dev | 前端（Cloudflare Pages），打开即用 |
| 数据接口 | https://focus-app-api.csy-xixi.workers.dev | 后端（Cloudflare Workers），浏览器直开返回 401 是鉴权生效的正常表现 |
| 数据库 | Cloudflare D1（focus-db） | 5 张业务表，云端存储 |

> ⚠️ `pages.dev` / `workers.dev` 域名在中国大陆网络受 DNS 污染与 SNI 阻断影响，访问需开代理；绑定自有域名后可直连（后端代码零改动）。

## 目录结构

```text
src/
  api/
    focus.ts                     业务接口封装（番茄钟/待办/习惯/备忘录/专注记录 5 组）
  store/modules/
    focus-app.ts                 全局业务数据 store（启动拉取云端 + 乐观更新 + 旧数据自动迁移）
    ui.ts                        顶栏触发信号（加号/回到今天的跨页联动）
  views/
    focus/                       番茄钟（index 列表页 + timer 专注计时页）
    todo/                        待办事项
    habit/                       习惯打卡（自定义月历）
    memo/                        备忘录（index 列表 + edit 富文本编辑）
  components/
    nav-bar/                     顶栏（标题 / 加号 / 回到今天 / 日夜切换）
    tabbar/                      底部导航
  layout/index.vue               应用外壳（keep-alive 缓存 + 启动时拉取数据）
  utils/http/                    axios 封装（Bearer Token、错误 Toast、NProgress、可取消请求）
server/
  src/index.ts                   Hono 路由（5 组 REST + CORS + Bearer Token 鉴权）
  src/schema.ts                  Drizzle 表结构（pomodoros / todos / habits / memos / focus_sessions）
  drizzle/                       迁移 SQL（wrangler d1 execute 应用）
  wrangler.jsonc                 Worker 配置（D1 绑定、AUTH_TOKEN）
mock/                            开发环境 Mock 数据（vite-plugin-mock-dev-server）
.github/workflows/main.yml      push 到 master 自动构建 GitHub Pages 镜像站
```

## 本地启动

> 前置要求：Node 20+（本机通过 [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) 管理）、[pnpm](https://pnpm.io/zh/installation) 包管理器。后端已部署在 Cloudflare，**本地开发直连线上接口**，无需本地起后端。

1. 安装依赖并启动前端：

   ```shell
   pnpm install
   pnpm dev
   ```

2. 浏览器访问提示的本地地址（如 http://localhost:5173），**需开启代理**（接口域名在大陆被阻断）。

3. （可选）修改后端代码后重新部署，在 `server/` 目录执行：

   ```shell
   pnpm deploy          # 等价于 wrangler deploy，数秒生效
   ```

## 部署方式（Cloudflare 全托管，0 元）

前端与后端各部署一次，之后更新只需两步：

```shell
# 前端：根目录执行
pnpm build
npx wrangler pages deploy dist --project-name focus-app --branch main

# 后端：server 目录执行（仅改了后端代码时需要）
cd server
pnpm deploy
```

### 后端从零部署（换机器 / 重建环境时）

1. `wrangler login` 登录 Cloudflare 账号
2. `wrangler d1 create focus-db` 创建数据库，将输出的 `database_id` 填入 `server/wrangler.jsonc`
3. `wrangler d1 execute focus-db --remote --file=./drizzle/0000_minor_shatterstar.sql` 远程建表
4. `pnpm deploy` 部署 Worker，然后 `echo "<你的令牌>" | wrangler secret put AUTH_TOKEN` 配置访问令牌（Secret 存于 Cloudflare，不入仓库）；前端 `.env*` 的 `VITE_API_TOKEN` 填同一值
5. 将 Worker 地址填入 `.env.development` / `.env.production` 的 `VITE_BASE_API`，重新构建前端

### 数据安全

- 所有业务数据存云端 D1，本地 localStorage 仅作旧版本迁移来源（首次启动自动上云并清理）
- 接口令牌通过 **Cloudflare Secrets**（后端）与**本地环境变量**（前端）管理，均不提交到仓库；新环境从 `.env.example` 复制并填写
- 诚实说明：令牌随前端打包后存在于页面 JS 中，**能拿到打包产物的人即可提取**——这是单令牌 + 前端直连方案的固有上限，防的是匿名爬取与误用，不防定向提取。要彻底解决需演进为多用户账号体系（见 Roadmap）

## Roadmap

- [ ] 多用户：登录注册（JWT + PBKDF2）+ 数据按 `user_id` 隔离，访客自行注册，演示与私有数据分离
- [ ] 绑定自有域名，摆脱 `pages.dev` / `workers.dev` 在大陆的访问限制

## 模板能力说明

工程化能力（图标使用、路由缓存与命名约定、eruda 调试面板、vw 视口适配、Tailwindcss、Mock 数据、Git 提交规范、CDN 依赖等）均继承自上游模板，完整文档见 **[vue3-h5-template README](https://github.com/yulimchen/vue3-h5-template#readme)**。

本仓库额外约定：

- 路由 `meta.showAdd: true` 启用顶栏加号；`meta.hideBar: true` 隐藏顶栏与底部导航（计时页/编辑页）
- 页面监听 `uiStore.addTrigger` / `todayTrigger` 时必须带 `route.name === '页面名'` 守卫（keep-alive 页面的 watcher 常驻，否则跨页误触）
- Git 提交遵循 [Angular 规范](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular)（`feat` / `fix` / `chore` / `ci` …），由 husky + commitlint 强制校验

## 许可证

模板部分遵循上游 [MIT 协议](LICENSE)；本项目的业务代码同样以 MIT 协议发布。

> ⚠️ 本项目为个人自用工具：接口令牌即单租户数据防线，请勿泄露自用令牌；访客演示请等待多用户版本。
