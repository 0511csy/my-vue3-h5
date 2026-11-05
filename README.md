<h1 align="center">专注番茄钟 Focus App</h1>

**🌱 一套自托管的移动端效率应用：番茄钟 + 待办 + 习惯打卡 + 备忘录，多用户账号体系，数据按账号隔离。前端基于 [vue3-h5-template](https://github.com/yulimchen/vue3-h5-template) 二次开发，后端为 Cloudflare Workers + D1 的无服务器架构，全链路 0 元托管**

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

## 架构

```text
┌────────────┐    HTTPS     ┌──────────────────────────────┐
│   浏览器    │ ──────────▶ │  Cloudflare Pages（前端托管）  │
│  Vue3 SPA  │ ◀────────── │  index.html + 静态资源        │
└─────┬──────┘   静态资源    └──────────────────────────────┘
      │
      │  REST + Authorization: Bearer <JWT>
      ▼
┌────────────────────────────────────────────────────────┐
│            Cloudflare Workers（focus-app-api）          │
│   ┌──────────────────┐   ┌─────────────────────────┐   │
│   │ 鉴权中间件        │   │ Hono 路由                │   │
│   │ JWT 验签 → userId │ ─▶│ /auth/login|register     │   │
│   │（HS256, 7 天有效）│   │ /pomodoros /todos        │   │
│   └──────────────────┘   │ /habits /memos           │   │
│                          │ /focus-sessions          │   │
│   PBKDF2-SHA256 密码哈希  └───────────┬─────────────┘   │
└──────────────────────────────────────┼──────────────────┘
                                       │ Drizzle ORM
                                       ▼
                        ┌──────────────────────────────┐
                        │  Cloudflare D1（SQLite）      │
                        │  users + 5 张业务表           │
                        │  所有业务行按 user_id 隔离     │
                        └──────────────────────────────┘
```

请求链路：浏览器携带登录时签发的 JWT 调用 Workers；鉴权中间件验签后将 `userId` 注入请求上下文，每条 SQL 都带 `user_id` 过滤，实现多用户数据隔离；数据落在同区域的 D1（Workers 与 D1 同区域部署，内网调用零开销）。

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

### 🔐 账号体系（多用户）

- 登录/注册一体页（切换式），用户名 + 密码；JWT 签发（HS256，7 天有效）
- 密码 PBKDF2-SHA256 十万次迭代加盐哈希，库中无明文；JWT 校验使用 `crypto.subtle.verify` 常量时间验证
- 数据按 `user_id` 全链路隔离：每条 SQL 带用户过滤，跨用户写/删在服务端被拒（实测：持他账号 JWT 伪造同 id 写入与删除均无效）
- 未登录访问任意页面被路由守卫拦截到登录页；JWT 过期由 axios 拦截器统一捕获，清凭据跳登录
- 站长引导：`/auth/setup`（需旧单租户令牌）创建站长账号并继承历史数据，完成单租户 → 多用户的无损迁移
- 顶栏显示当前用户名，点击可退出登录

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
    auth.ts                      登录态 store（JWT/用户名持久化，login/register/logout）
    ui.ts                        顶栏触发信号（加号/回到今天的跨页联动）
  views/
    login/                       登录/注册一体页
    focus/                       番茄钟（index 列表页 + timer 专注计时页）
    todo/                        待办事项
    habit/                       习惯打卡（自定义月历）
    memo/                        备忘录（index 列表 + edit 富文本编辑）
  components/
    nav-bar/                     顶栏（标题 / 加号 / 回到今天 / 用户名退出 / 日夜切换）
    tabbar/                      底部导航
  layout/index.vue               应用外壳（keep-alive 缓存 + 启动时拉取数据）
  router/                        路由 + 登录守卫（未登录重定向 /login）
  utils/http/                    axios 封装（JWT 注入、401 跳登录、错误 Toast、NProgress、可取消请求）
server/
  src/index.ts                   Hono 路由（JWT 鉴权中间件 + 5 组 REST，全部按 user_id 隔离）
  src/auth.ts                    /auth 路由（register / login / setup 站长引导）
  src/jwt.ts                     JWT(HS256) 签发验证 + PBKDF2-SHA256 密码哈希（纯 crypto.subtle）
  src/schema.ts                  Drizzle 表结构（users + 5 张业务表，均含 user_id）
  drizzle/                       迁移 SQL（wrangler d1 execute 应用）
  wrangler.jsonc                 Worker 配置（D1 绑定；密钥走 Cloudflare Secrets）
mock/                            开发环境 Mock 数据（vite-plugin-mock-dev-server）
.github/workflows/main.yml      push 到 master 自动构建 GitHub Pages 镜像站（环境变量取自 GitHub Secrets）
```

## 本地启动

> 前置要求：Node 20+（本机通过 [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) 管理）、[pnpm](https://pnpm.io/zh/installation) 包管理器。后端已部署在 Cloudflare，**本地开发直连线上接口**，无需本地起后端。

1. 安装依赖并启动前端：

   ```shell
   pnpm install
   pnpm dev
   ```

2. 浏览器访问提示的本地地址（如 http://localhost:5173），**需开启代理**（接口域名在大陆被阻断），注册一个账号即可开始使用。

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
3. `wrangler d1 execute focus-db --remote --file=./drizzle/0000_minor_shatterstar.sql` 与 `--file=./drizzle/0001_*.sql` 远程建表（users 表 + 业务表 user_id 列）
4. `pnpm deploy` 部署 Worker，然后配置两个 Cloudflare Secrets（均不入仓库）：
   `echo "<jwt密钥>" | wrangler secret put JWT_SECRET`（签名密钥，随机 32 字节 hex 即可）
   `echo "<引导令牌>" | wrangler secret put AUTH_TOKEN`（站长引导用，随机即可）
5. `curl -X POST <worker>/auth/setup -H "Authorization: Bearer <引导令牌>" -d '{"username":"...","password":"..."}'` 创建站长账号并继承历史数据（无历史数据时此步可跳过，直接在前端注册）
6. 将 Worker 地址填入 `.env.development` / `.env.production` 的 `VITE_BASE_API`，重新构建前端

### 数据安全

- 所有业务数据存云端 D1，本地 localStorage 仅作旧版本迁移来源（首次启动自动上云并清理）
- 访客注册自己的账号即可体验，数据与其他账号完全隔离；站长账号凭据不公开
- 后端密钥（JWT 签名密钥、站长引导令牌）通过 **Cloudflare Secrets** 管理，前端不再需要预置令牌——**公开仓库与私有数据可以共存**
- 历史遗留：初版单令牌曾提交进仓库，已轮换作废；演进过程见「已知问题与设计取舍」

## Roadmap

- [x] 多用户：登录注册（JWT + PBKDF2）+ 数据按 `user_id` 隔离
- [ ] 绑定自有域名，摆脱 `pages.dev` / `workers.dev` 在大陆的访问限制
- [ ] 访客数据定期清理（防止公开注册被灌满存储）

## 已知问题与设计取舍

这些是开发过程中真实踩过的坑和对应的取舍决策，记录于此供参考：

### keep-alive 页面的 watcher 常驻，跨页误触

**现象**：在习惯页点顶栏加号，切到专注页时「新增番茄闹钟」弹窗凭空弹了出来；备忘录页甚至会自动跳转。

**根因**：页面组件被 `<keep-alive>` 缓存后不销毁，`setup` 里注册的 `watch` 监听器全部常驻。顶栏加号通过全局 store 的计数器触发各页新增弹窗，于是在 A 页点加号，B 页的监听器也会执行——只是当时不可见。

**修复**：所有监听 `uiStore.addTrigger` / `todayTrigger` 的页面，回调内必须带 `route.name === '页面名'` 守卫。教训：keep-alive 下任何「全局信号 → 页面动作」的联动都要考虑组件常驻生命周期的语义。

### axios 1.13 → 1.21 升级，泛型断裂

**现象**：`pnpm add wrangler` 顺带重解析依赖树，axios 从 1.13.2 跳到 1.21.0，`http.get<T>` 等 5 个包装方法全部报 `Promise<AxiosResponseResult<...>>` 不能赋值给 `Promise<T>`。

**根因**：axios 1.21 把方法返回类型改成了条件类型 `AxiosResponseResult<T, R, D, P> = R extends AxiosResponseDefault ? AxiosResponse<T> : R`。当 R 传的是**未定泛型**（我们包装方法自己的 `T`）时，TS 无法求值 `extends` 判断，类型卡在延迟态。

**修复**：包装方法内显式断言 `as Promise<T>`——运行时本就成立（响应拦截器已把 `{ code, result }` 解包为 result），断言只是把事实告诉 TS。教训：为库方法写包装层时，泛型透传对「上游类型变更」的抵抗力有限，边界处断言 + 注释说明运行时依据是务实解。

### 单令牌 → 多用户 JWT 的演进

**现象**：初版所有请求共享一个静态令牌（写在前端 `.env` 并随打包进入 JS 产物）。仓库公开后意识到：能 clone 仓库或打开 F12 的任何人都能完全读写云端数据。

**取舍过程**：

1. 换令牌 + 改存 Cloudflare Secrets —— 只解决「仓库泄露」，解决不了「打包产物自带凭据」
2. 读写分离双令牌 —— 读令牌公开则备忘录等私有内容等于公开，不可接受
3. **多用户 JWT**（采用）—— 数据按 `user_id` 隔离后，访客注册自己的账号体验应用，站长的数据天然私有

配套的安全细节：业务写入不用 `INSERT ... ON CONFLICT UPSERT`，改为**先删（带 user_id 条件）后插**——否则攻击者可伪造他人 item id 触发主键冲突，把别人的行「更新」到自己名下。实测验证了这条路径在 upsert 方案下确实可行，是本次重构里最有价值的发现之一。

### 本地 workerd 被 Windows WDAC 拦截

**现象**：`wrangler dev` 报 `spawn UNKNOWN`，`--remote` 模式同样失败。

**根因**：本机启用了强制模式的 Device Guard 代码完整性策略（多份 `.cip` 策略文件），只放行受信任签名的可执行文件，`workerd.exe`（Cloudflare 本地运行时）无微软签名。

**取舍**：与其找 IT 加白或关策略，不如改变开发拓扑——**本地开发直连已部署的线上后端**（前端 `VITE_BASE_API` 指向 Workers），本地不再需要 workerd；改后端就 `wrangler deploy`（纯 JS 打包不涉及 workerd，可正常执行）。换来的是开发和线上环境完全一致，代价是后端改动的验证链路变长（先部署再验证）。

## 模板能力说明

工程化能力（图标使用、路由缓存与命名约定、eruda 调试面板、vw 视口适配、Tailwindcss、Mock 数据、Git 提交规范、CDN 依赖等）均继承自上游模板，完整文档见 **[vue3-h5-template README](https://github.com/yulimchen/vue3-h5-template#readme)**。

本仓库额外约定：

- 路由 `meta.showAdd: true` 启用顶栏加号；`meta.hideBar: true` 隐藏顶栏与底部导航（计时页/编辑页）
- 页面监听 `uiStore.addTrigger` / `todayTrigger` 时必须带 `route.name === '页面名'` 守卫（keep-alive 页面的 watcher 常驻，否则跨页误触）
- Git 提交遵循 [Angular 规范](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular)（`feat` / `fix` / `chore` / `ci` …），由 husky + commitlint 强制校验

## 许可证

模板部分遵循上游 [MIT 协议](LICENSE)；本项目的业务代码同样以 MIT 协议发布。

> ⚠️ 本项目为个人自用工具：站长账号数据仅受其密码保护，请使用强密码；访客注册开放，生产使用建议关闭注册或加邀请码。
