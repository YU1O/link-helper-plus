# Changelog

基于 [一个北七 的「链接助手」](https://github.com/oneNorth7/LinkHelper) 2.1.2 改造。完整的技术说明同时写在脚本头部注释里。

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
