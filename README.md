# userscripts

YU1O 的用户脚本合集（Tampermonkey / Violentmonkey / 脚本猫），GPL-3.0。仓库里可以放多个互相独立的脚本，每个脚本自己管理版本与更新地址。

## 脚本列表

| 脚本 | 版本 | 说明 | 安装 / 更新地址 |
| --- | --- | --- | --- |
| [链接助手（增强版）](#链接助手增强版) | 2.3.6 | 网盘提取码自动识别与填写、文本转链接、新标签打开链接 | <https://cdn.jsdelivr.net/gh/YU1O/userscripts@main/link-helper-plus.user.js> |

## 新增脚本的约定

- 脚本放 `scripts/<脚本名>/<脚本名>.user.js`，自带 README 与 CHANGELOG；根 README 的表格登记一行。
- 每个脚本的 `@namespace` 必须唯一（建议带脚本路径），`@version` 各自独立递增；`@updateURL` / `@downloadURL` 指向**自己那个文件**的 jsDelivr 地址，不要照抄别的脚本。复用 namespace 会让管理器把两个脚本当成同一个，`GM_setValue` 数据串在一起。
- 更新地址保持 `@main` 指向分支最新，不要写死版本 tag——写死后客户端取到的 `@version` 永远不变，自动更新会失效。
- 发版 tag 用 `<脚本名>-v<版本>` 前缀，避免多脚本共仓时版本号撞车。
- 根 `LICENSE` 为 GPL-3.0；若个别脚本采用不同许可，在该脚本目录内单独声明。

## 仓库改名与迁移（2026-11-10）

原仓库名 `link-helper-plus` 改为通用的 `userscripts`。这次改名有一个必须手动处理的后果：

- GitHub 网页 / raw / API 的旧地址会自动 301 到新地址，**但 jsDelivr 的 `/gh/` 路径按仓库名原样解析，不跟随这个重定向**，旧的 jsDelivr 地址会 404。
- 已经安装链接助手的用户，脚本头部仍写着旧地址，检查更新会静默失败，管理器不会报错提示。请在管理器编辑器里**粘贴一次 2.3.6 全文**（或手动把两个 URL 字段改成上表的新地址），之后自动更新恢复正常。
- `@namespace` 刻意保留旧字符串不动：它只是管理器的身份标识，不解析也不访问；改掉会被当成新脚本，8 项 `GM_setValue` 配置全部丢失，还可能出现两份同名脚本。
- 历史 tag（`v2.3.5` 及以前）保持不动，仍可回溯任意一版。

---

## 链接助手（增强版）

基于 [一个北七 的「链接助手」](https://github.com/oneNorth7/LinkHelper) 2.1.2 改造，遵循 GPL-3.0。主功能三项：网盘提取码自动识别与填写、文本转链接、新标签打开链接。原版说明中的「移除重定向、重定向自动跳转、密码预处理、链接直达框、自动切换镜像、自动切换中文」等六项在 2.1.0 精简时已移除，本仓库不再提供。

### 安装

需要 Tampermonkey / Violentmonkey / 脚本猫等用户脚本管理器。浏览器直接打开下面任一地址，管理器会弹出安装页：

- **jsDelivr（国内推荐）**：<https://cdn.jsdelivr.net/gh/YU1O/userscripts@main/link-helper-plus.user.js>
- GitHub raw：<https://raw.githubusercontent.com/YU1O/userscripts/main/link-helper-plus.user.js>

也可以在管理器里「新建脚本」，把 `link-helper-plus.user.js` 全文粘贴后保存。

### 自动更新

脚本头部同时声明了 `@updateURL` 与 `@downloadURL`，均指向上述 jsDelivr 地址。

- 每次发版**必须递增 `@version`**，管理器靠版本号判断是否有更新，只改内容不改号不会拉取；
- 每次发版另外打一个 `link-helper-plus-v<版本号>` 的 tag 用来回溯任意一版。tag 不参与更新地址；
- jsDelivr 的 `@main` 约有 12 小时缓存，连「分支 → 提交」的解析结果也一起缓存。推送后可打开 <https://purge.jsdelivr.net/gh/YU1O/userscripts@main/link-helper-plus.user.js> 刷新，但实测不保证立刻生效；想马上用上新内容，最可靠的是在管理器编辑器里粘贴一次，等缓存自然过期后自动更新会恢复；
- 若从 GreasyFork 安装，GreasyFork 会剥掉这两个字段并接管更新，请以那边为准。

### 功能

脚本按当前域名分流：**网盘分享页**只做自动填码；**其它页面**才挂鼠标监听并注册「🔗配置」菜单。

#### 1. 网盘提取码

- 资源页 / 论坛长帖：点击网盘链接时，从链接周边文本扫描「提取码: abcd」，把码写回 URL（查询参数、hash，或写入 GM 存储供页面读取）；顺带做 URL 规范化，如百度 wap → share、天翼云 h5 → web、hash 中的 `/s/xxx` 提到 pathname、补 `?path=%2F`。
- 网盘分享页：自动把码填进输入框并提交。输入框多为异步渲染，用带节流的 MutationObserver 等待出现，命中即断开，15 秒超时兜底；选择器找不到时还有「向上找容器里的按钮」的通用兜底。
- 覆盖 22 条站点规则，并用别名表把马甲域名归一（蓝奏系、123pan / 123684、城通 / ctfile、阿里 / alywp、夸克、UC、115、天翼云、移动云、微云、超星、坚果云、文叔叔、MoeCloud、闪电盘、OneDrive / SharePoint、MEGA 等）；另有 11 个境外 / 文档盘域名只做「转链接后自动打开」，不填码。

#### 2. 文本转链接

单击时把纯文本 URL、邮箱、磁力链、`ed2k://`、`thunder://`、40 位哈希、百度网盘短链转成可点击的 `<a>`。

- 转换后的链接显示**蓝色文字 + 下划线**（2.3.3 起；2.3.4 起不再加背景色），深色模式自动切换浅蓝配色；样式只作用于脚本生成的 `a.text2Link`，不会改动页面原有链接，也不会给文字铺底色。
- 拖选保护：mousedown 只改属性不碰 DOM，mouseup 且位移 ≤ 5px 才转换，拖选复制不会被打断；右键「复制链接地址」仍能拿到带码链接。
- 跳过规则：文本超过字符数上限（默认 500）、`<code>` / `<pre>` 未整块选中、SHA / MD5 校验值附近、`flashget://` / `ss://` / `vmess://` 等协议。

#### 3. 新标签打开

给链接加 `target="_blank"`。例外：分页文案与 prev / next、`javascript:`、同域站内绝对链接（避免打断 SPA 路由）、相对链接、`magnet` / `ed2k` / `thunder`。

#### 配置面板

脚本菜单里的「🔗配置」，共 8 项：字符数限制（200–800）、转换后一律自动打开、自动打开的链接域名、自动打开的页面站点、新标签打开、相对链接也新标签打开、同域链接也新标签打开、保持默认打开方式的站点。勾选项即时生效，输入框在面板关闭时保存。另有一个无 UI 的 `debug` 开关，默认关闭。

### 注意

- `@namespace` 与原版不同，管理器视其为**独立脚本**；`GM_setValue` 按脚本隔离，原版存的配置不会继承，装完需重设一次。
- 9 条 `@exclude` 在页面加载时排除协作文档 / 编辑器站点（kdocs、Google Docs、Notion、wolai、语雀 `/edit`、写作猫、mail 等），`@noframes` 不在 iframe 中运行。2.3.5 起另有运行时防护：每次鼠标事件都检查可编辑区与输入框，命中直接跳过——SPA 内部跳到编辑页、以及名单外的在线文档站点也能挡住。
- 元数据里不要留 `example.com` 之类的占位 URL：Tampermonkey 的 BlackCheck 按来源 URL 匹配黑名单，命中后脚本开关会变灰且无法启用（Q303）。2.3.0 曾因此踩过坑，2.3.1 起已换成真实直链。

## 目录

```
README.md                    脚本索引 + 仓库约定（本文件）
CHANGELOG.md                 链接助手的逐版改动
LICENSE                      GPL-3.0 全文
link-helper-plus.user.js     链接助手（历史兼容位，保持在根目录不动）
scripts/                     后续新增脚本放这里，每个脚本一个子目录
```

`link-helper-plus.user.js` 特意留在根目录：它是最早安装的那个脚本的更新地址，挪动路径会让已安装用户的更新地址 404。

## 许可

GPL-3.0。链接助手原作者「一个北七」，改造与维护 YU1O；原作者署名、`@icon` 与许可证声明均予保留，全文见 [LICENSE](LICENSE)。
