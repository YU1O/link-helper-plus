# Changelog

本文件记录「链接助手（增强版）」的逐版改动；仓库改为多脚本合集后，新增脚本请在自己的目录下维护独立的 CHANGELOG，此处只记链接助手。基于 [一个北七 的「链接助手」](https://github.com/oneNorth7/LinkHelper) 2.1.2 改造。完整的技术说明同时写在脚本头部注释里。

## 2.3.6 (2026-11-10) — 仓库改名与更新地址迁移

- 仓库 `YU1O/link-helper-plus` → `YU1O/userscripts`，从单脚本仓库改为多脚本合集；README 改成脚本索引，并写明新增脚本的约定：各自独立的 `@namespace` / `@version` / 两个 URL 指向自己的文件，根 README 登记一行，tag 加脚本名前缀。
- `@updateURL` / `@downloadURL` 换成新仓库的 jsDelivr 地址，`@version` 递增到 2.3.6；**代码正文未改**。
- **实测修正（2026-11-10）**：原先判断「jsDelivr 的 `/gh/` 不跟随 GitHub 仓库重定向、旧地址会 404」是错的。改名后实测旧 jsDelivr 地址直接返回 200（无对外 301），内容就是新仓库的 2.3.6；旧 raw 地址同样 200。因此已安装用户检查更新即可拉到 2.3.6 并自动换用新地址，通常无需手动操作。仍建议改一下两个 URL：仓库改名后旧名会被释放，被他人注册后重定向即失效，依赖隐式跳转也不利于排障。
- `@namespace` 刻意保留旧字符串：改动会让管理器视为新脚本，`GM_setValue` 存的 8 项配置全部丢失，还可能出现两份同名脚本。它只是身份标识，不需要可访问。
- 发版 tag 前缀改为 `<脚本名>-v<版本>`（本版 `link-helper-plus-v2.3.6`），避免多脚本共仓时版本号撞车；历史 tag `v2.3.5` 及以前保持不动。

## 2.3.5 (2026-11-09) — 编辑器防护与版本标记

- 新增运行时可编辑区防护：`isEditableContext()` 在 mousedown / mouseup 两个入口检查 `designMode`、`isContentEditable`、`contenteditable` 属性、`role=textbox`、`input` / `textarea` / `select`，命中直接放过。此前只有 9 条 `@exclude`，且只在页面加载时判定一次：SPA 从阅读页跳到编辑页不刷新页面，名单外的在线文档站点也拦不住；在编辑器里 `replaceWith` 会破坏内容模型、选区与撤销栈，甚至把改动同步到服务端。
- 发版改用 `v<版本号>` tag 标记每一版，便于回溯。**更新地址仍保持 jsDelivr `@main`**：写死某个版本 tag 会让客户端取到的 `@version` 永远不变，自动更新直接失效；GitHub Releases 的 latest 地址虽能绕开 CDN 缓存，但每版都要建 Release 与上传资产，按维护者决定不采用。推送后 purge 一次 CDN 缓存即可，但该缓存连分支解析一起缓存，实测不保证立刻生效，必要时在编辑器里粘贴一次。
- `@version` 递增到 2.3.5；README 补发版流程与防护说明。

## 2.3.4 (2026-11-09) — 链接样式收敛

- 按用户要求**去掉转换链接的淡蓝背景色与圆角**，只保留蓝色文字 + 下划线。页面底色不再被脚本改动，避免与站点自身的底色、代码块、引用块冲突。
- hover / focus 仍只加深文字与下划线颜色，深色模式浅蓝配色不变。
- `@version` 递增到 2.3.4，保证自动更新能触发；README 功能描述同步。

## 2.3.3 (2026-11-09) — 文本转链接的可视样式

- 修复「文字已经变成链接、肉眼却看不出来」：`text2Link` 生成的 `<a>` 一直带 `className="text2Link"`，但样式表从未给这个 class 写规则，颜色与下划线完全由站点 CSS 决定；论坛 / 贴吧普遍把 `a` 设成 `color: inherit` 并去掉下划线。
- 新增蓝色文字 + 下划线 + 淡蓝底高亮，用高特异度与 `!important` 压过站点规则；深色模式另配浅蓝，hover / focus 加深。只命中 `a.text2Link`，不影响页面原有链接。
- 同步补齐仓库 README 与 CHANGELOG。

## 2.3.2 (2026-11-09) — 更新地址对齐

- 仓库实际文件名是 `link-helper-plus.user.js`，2.3.1 的两个 URL 字段却写成 `link-helper.user.js`，指向不存在的文件，检查更新拿 404，自动更新等于失效。
- 改用实际文件名；`@version` 递增到 2.3.2（只改 URL 不升版本，管理器会认为没有新版本）。代码正文未改。

## 2.3.1 (2026-11-09) — 独立发布

- `@namespace` 改为本仓库地址、`@name` 加「增强版」后缀，与原版在管理器中视为两个独立脚本，不覆盖原版、不劫持其更新渠道。`GM_setValue` 按脚本隔离，原版配置不会继承。
- 两个 URL 字段换成 jsDelivr 真实直链，移除 `example.com` 占位。Tampermonkey BlackCheck 的默认规则按来源 URL 匹配 `example.com`，命中即禁用脚本 —— 这正是 2.3.0 显示「已被列入黑名单」的原因。
- 保留原作者署名、`@icon` 与 GPL-3.0 声明；许可证全文见 `LICENSE`。

## 2.3.0 (2026-11-09) — 交互时机与结构

- 修复拖选被中断：原先绑 `selectstart` + `mousedown`，在「开始选区」的瞬间就 `replaceWith` 掉文本节点。现在 mousedown 只做属性级处理（改 href / target，不碰节点结构），DOM 转换统一挪到 mouseup，位移 > 5px 视为拖选直接放过；右键 / 中键仍做属性级处理，保住「复制链接地址」能拿到带码链接。
- `addCode` 拆成 `rewriteHref` / `migrateHashCode` / `scanCode` / `applyCode`，不再一个函数同时负责 URL 改写、hash 搬运、文本扫描、写回。
- 删除站点表里已无作用的 `noNotice` 残留项；补 `@updateURL` / `@downloadURL` 占位（2.3.1 换成真实直链）。

## 2.2.0 (2026-11-09) — 性能与依赖重构

- 移除 jQuery 与 SweetAlert2 的 `@require`：原先每打开一个网页都要解析执行约 170KB 第三方库，而实际只用到 8 处 API。全部改为原生 DOM；配置面板改用原生 `<dialog>`；不再申请 `GM_notification` / `GM_info`。
- 原生 `querySelectorAll` 不支持 `:contains`，旧版靠 try/catch 静默跳过，导致部分站点候选选择器一直失效；改为「基选择器 + 文本过滤」后真正生效。
- 性能：兄弟节点扫描用 `textContent` 替代 `innerText`（后者每次读都强制同步 reflow）并加节点数 / 字符数预算；`fill()` 的全文档 MutationObserver 改为 rAF + 120ms 冷却、命中即断开；`mapHost` 的正则表与别名表提到模块作用域并用 `Map` 缓存；站点正则按 host 缓存；GM 配置读取加缓存。
- 修复：一个文本节点含多个 URL 时原先固定返回第一个 `<a>`，点第二个会打开第一个，改为按点击坐标反查；配置面板字符数标签因 `nextAll` 方向反了永远显示硬编码 500；`codeFromUrl` 对 `URLSearchParams` 的值重复 `decodeURIComponent`，含 `%` 的码会抛 `URIError` 或被改写；`regStr` 含 `|` 的站点（moecloud）丢失首尾锚点，改为 `^(?:...)$`。
- 加固：链接元素统一用 `HTMLAnchorElement` 判定，SVG `<a>` 不再进入处理链。

## 2.1.2 / 2.1.0 — 精简与短链修复

- 修复贴吧百度网盘短链识别与生成规则长度不一致、非法 ID 被静默截断。
- 精简为三项主功能：网盘提取码自动识别 / 填写、文本转链接、新标签打开链接。移除重定向处理、密码预处理、链接直达框、镜像 / 语言切换等六项。
