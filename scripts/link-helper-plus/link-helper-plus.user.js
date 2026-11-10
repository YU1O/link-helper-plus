// ==UserScript==
// @name            链接助手（增强版）
// @namespace       https://github.com/YU1O/link-helper-plus
// @version         2.3.7
// @description     基于 一个北七 的「链接助手」改造：网盘提取码自动识别与填写；文本转链接；新标签打开链接
// @author          一个北七, YU1O
// @icon            https://gitee.com/oneNorth7/pics/raw/master/picgo/link-helper.png
// @license         GPL-3.0 License
// @run-at          document-body
// @match           *://*/*
// @exclude         *://www.kdocs.cn/p/*
// @exclude         *://docs.google.com/document/d/*
// @exclude         *://www.notion.so/*
// @exclude         *://www.wolai.com/*
// @exclude         *://yiqixie.qingque.cn/d/home/*
// @exclude         *://www.yuque.com/*/edit
// @exclude         *://*.cqaso.com/*
// @exclude         *://xiezuocat.com/#/doc/*
// @exclude         *://mail.*
// @noframes
// @compatible      chrome 90+
// @compatible      firefox 90+
// @compatible      edge Latest
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_addStyle
// @updateURL       https://cdn.jsdelivr.net/gh/YU1O/userscripts@main/scripts/link-helper-plus/link-helper-plus.user.js
// @downloadURL     https://cdn.jsdelivr.net/gh/YU1O/userscripts@main/scripts/link-helper-plus/link-helper-plus.user.js
// ==/UserScript==

/*
 * 2.1.0 (2026-11-09) 现代化精简版
 *   保留：网盘提取码自动识别/填写、文本转链接、新标签打开链接
 * 2.1.2 (2026-11-09)
 *   修复：贴吧百度网盘短链识别与生成规则长度不一致；非法 ID 被静默截断。
 * 2.2.0 (2026-11-09) 性能与依赖重构
 *   依赖：移除 jQuery 与 SweetAlert2 的 @require（原先每打开一个网页都要解析执行
 *         ~170KB 第三方库，而实际只用到 8 处 API）。全部改为原生 DOM API；
 *         配置面板改用原生 <dialog>，不再依赖任何 UI 库，也不再申请
 *         GM_notification / GM_info 权限（showNotice 早已无人调用）。
 *   性能：① addCode 的兄弟节点扫描改用 textContent（原 innerText 每次读都强制
 *            reflow），并加入节点数 / 文本长度预算，避免长帖里 O(n²) 拼字符串；
 *         ② fill() 的全文档 MutationObserver 改为 rAF + 120ms 冷却，命中后立即断开；
 *         ③ mapHost 的正则表与别名表提到模块作用域，结果用 Map 缓存；
 *         ④ 各站点 regStr 编译出的正则按 host 缓存，不再每次点击重新编译；
 *         ⑤ GM 配置读取加缓存（一次点击原本要读 4~6 次存储）。
 *   修复：一个文本节点含多个 URL 时，原先固定返回第一个 <a>，点第二个链接会打开
 *         第一个；现按点击坐标反查真正命中的链接。
 *         配置面板的字符数标签原先取不到元素（nextAll 方向反了），打开面板显示
 *         的永远是硬编码 500；现在初始化即同步真实值。
 *         codeFromUrl 对 URLSearchParams 的值重复 decodeURIComponent，遇到含 %
 *         的提取码会抛 URIError / 被改写；hash 残缺转义同样加兜底。
 *         regStr 含 | 的站点（moecloud）用 ^...$ 时会丢失首尾锚点，改成 ^(?:...)$。
 *   加固：链接元素统一用 HTMLAnchorElement 判定，SVG <a> 不再进入处理链。
 * 2.3.0 (2026-11-09) 交互时机与结构
 *   修复：原先绑 selectstart + mousedown，在「开始选区」的瞬间就 replaceWith 掉文本
 *         节点，正在拖选的文字会当场失效（复制含链接的段落时最明显）。
 *         现在 mousedown 只做属性级处理（改 href / target，不碰节点结构），DOM 转换
 *         统一挪到 mouseup，且按下与松开的位移超过 5px 即视为拖选直接放过。
 *         右键 / 中键仍做属性级处理，保住「复制链接地址」能拿到带码链接。
 *   结构：addCode 拆成 rewriteHref / migrateHashCode / scanCode / applyCode，
 *         单个函数不再同时负责 URL 改写、hash 搬运、文本扫描、写回四件事。
 *   清理：删掉站点表里已无作用的 noNotice 残留项。
 *   元数据：补 @updateURL / @downloadURL 占位（2.3.1 已换成 jsDelivr 真实直链）。
 * 2.3.1 (2026-11-09) 独立发布
 *   身份：@namespace 改为本仓库地址、@name 加「增强版」后缀，与原版在 Tampermonkey
 *         中视为两个不同脚本，不会覆盖原版，也不会劫持其更新渠道。
 *         注意 GM_setValue 按脚本隔离，装本版后原版配置不会自动继承，需重设一次。
 *   元数据：两个 URL 字段换成 jsDelivr 直链，移除 example.com 占位。Tampermonkey
 *         BlackCheck 的默认规则按来源 URL 匹配 example.com 域名，命中即禁用脚本，
 *         这正是 2.3.0 在篡改猴里显示「已被列入黑名单」的原因。
 *   版权：原作者「一个北七」的署名、@icon 与 GPL-3.0 声明原样保留；
 *         本文件基于原 2.1.2 改造，许可证全文见仓库根目录 LICENSE。
 * 2.3.2 (2026-11-09) 更新地址对齐
 *   修复：仓库实际文件名是 link-helper-plus.user.js，而 2.3.1 的两个 URL 字段
 *         写的是 link-helper.user.js，指向不存在的文件，检查更新会拿到 404，
 *         自动更新等于失效。现改用仓库实际文件名。
 *   版本：@version 同步递增到 2.3.2——只改 URL 不升版本的话，Tampermonkey
 *         比较版本号后认为没有新版本，不会去拉取新文件。
 *   代码正文未改动。
 * 2.3.3 (2026-11-09) 文本转链接的可视样式
 *   新增：text2Link 生成的 a 一直带 className="text2Link"，但样式表从未给这个
 *         class 写规则，转换后的颜色与下划线完全由站点自身 CSS 决定；论坛 / 贴吧
 *         普遍把 a 设成 color: inherit 且去掉下划线，结果是「文字已经变成链接，
 *         肉眼却看不出来」。现在补上蓝色文字 + 下划线 + 淡蓝底高亮，用高特异度
 *         与 important 压过站点规则；深色模式另配浅蓝，hover / focus 再加深。
 *         只作用于 a.text2Link，不影响页面原有的任何链接。
 * 2.3.4 (2026-11-09) 链接样式收敛
 *   调整：按用户要求去掉转换链接的淡蓝背景色与圆角，只保留蓝色文字 + 下划线；
 *         hover / focus 仍只加深文字与下划线颜色，深色模式配色不变。
 *         页面背景不再被脚本改动，避免与站点自身的底色 / 代码块 / 引用块冲突。
 * 2.3.5 (2026-11-09) 编辑器防护与发版方式
 *   防护：新增 isEditableContext()，在 mousedown / mouseup 两个入口检查
 *         designMode、isContentEditable、contenteditable 属性、role=textbox、
 *         input / textarea / select，命中直接放过。原先只有 9 条 @exclude，
 *         且只在页面加载时判定一次：SPA 内部跳到编辑页不刷新页面，名单外的
 *         在线文档站点也拦不住；在编辑器里 replaceWith 会破坏内容模型、
 *         选区与撤销栈，甚至把改动同步到服务端。
 *   发版：两个 URL 字段维持 jsDelivr @main，另给每次发版打 v<版本> tag 便于
 *         回溯。把地址写死成某个版本 tag 是错误的——客户端取到的 @version
 *         永远不变，会一直认为没有新版本；GitHub Releases 的 latest 地址虽能
 *         绕开 CDN 缓存，但每版都要建 Release 与上传资产，本项目不采用。
 *         推送后调 purge.jsdelivr.net 刷缓存即可，个别边缘节点同步较慢时
 *         在编辑器里粘贴一次。
 * 2.3.6 (2026-11-10) 仓库改名与更新地址迁移
 *   迁移：仓库由 link-helper-plus 改名为 userscripts，成为多脚本合集仓库。
 *         @updateURL / @downloadURL 同步指向新仓库的 jsDelivr 地址。
 *         2026-11-10 实测旧地址仍直接返回新仓库内容（GitHub 的仓库重定向
 *         对 raw 与 jsDelivr 都透明），故已安装用户检查更新即可拉到本版，
 *         并随新版自动换用新地址；代码正文未改动。仍建议手动改一下两个
 *         URL：旧仓库名释放后可被他人注册，届时重定向会失效。
 *   身份：@namespace 保持不变。它只是管理器的身份字符串，不解析、不访问；
 *         改掉会被当成新脚本，GM_setValue 存的 8 项配置全部丢失，还可能
 *         出现两份同名脚本。字符串里带旧仓库名不影响功能。
 *   版本：@version 递增到 2.3.6，保证粘贴与后续检查更新都被识别为新版本。
 * 2.3.7 (2026-11-10) 移入独立目录
 *   结构：脚本本体、README、CHANGELOG 一并移入 scripts/link-helper-plus/，
 *         仓库根目录不再放脚本；每个脚本一个目录，新增脚本互不影响。
 *   地址：两个 URL 改成子目录路径。与 2.3.6 的仓库改名不同，仓库内的
 *         文件路径变化没有重定向可依赖，根目录旧文件已删除，旧地址会 404
 *         （jsDelivr 边缘节点可能还会缓存一阵旧内容）。已安装用户需在
 *         编辑器里粘贴一次本文件，或手动改两个 URL 字段，之后更新恢复。
 *   身份：@namespace 仍保持不变，8 项 GM 配置不丢；代码正文未改动。
 *   版本：@version 递增到 2.3.7。
 */

(function () {
    "use strict";

    const locHost = location.host;

    /* ------------------------------------------------------------------ *
     * 基础工具（配置读取带缓存）
     * ------------------------------------------------------------------ */
    const cfgCache = new Map();
    const CODE_KEYS = ["password", "pwd", "code", "passcode", "accessCode", "key"];

    const t = {
        get(name, def) {
            if (cfgCache.has(name)) return cfgCache.get(name);
            const v = GM_getValue(name, def);
            cfgCache.set(name, v);
            return v;
        },
        // 旧版本可能留下非数组的坏配置，统一兜底避免 listener 整体抛错
        arr(name) {
            const v = t.get(name, []);
            return Array.isArray(v) ? v : [];
        },
        set(name, value) {
            cfgCache.set(name, value);
            GM_setValue(name, value);
        },
        del(name) {
            cfgCache.delete(name);
            GM_deleteValue(name);
        },
        clog(...args) {
            if (!t.get("debug", false)) return;
            console.log("[链接助手]", ...args);
        },
        registerMenu(title, func) {
            return GM_registerMenuCommand(title, func);
        },
        hashcode(l = location) {
            const h = l.hash.slice(1);
            try {
                return decodeURIComponent(h);
            } catch (err) {
                return h; // hash 里有残缺转义（#%E4%）时不要抛错
            }
        },
        search(l = location, p = "password") {
            const v = new URLSearchParams(l.search).get(p);
            return v === null ? "" : v;
        },
        // 从 URL 中取出提取码，兼容各家参数命名与 hash 形式
        codeFromUrl() {
            const params = new URLSearchParams(location.search);
            for (const k of CODE_KEYS) {
                const v = params.get(k);
                // URLSearchParams 取出的值已经是解码后的，再 decode 一次会破坏含 % 的码
                if (v) return v;
            }
            const inHash = /[?&](?:pwd|password|code)=([^&]+)/i.exec(location.hash);
            if (inHash) {
                try {
                    return decodeURIComponent(inHash[1]);
                } catch (err) {
                    return inHash[1];
                }
            }
            const h = t.hashcode();
            // #/s/abc123 之类的 hash 只取最后一段，避免把路径片段误当提取码
            const tail = /(?:^|[\/=?&])([^\/?&=#]+)$/.exec(h);
            return tail ? tail[1] : h;
        },
    };

    /* ------------------------------------------------------------------ *
     * 选择器工具：原生 querySelectorAll + jQuery 的 :contains 兼容
     *
     * 站点规则里大量用到 button:contains("提取文件") 这类 jQuery 专有伪类，
     * 原生 querySelectorAll 会直接抛 SyntaxError。这里把 :contains 拆出来，
     * 用基选择器取集合再按文本过滤，保持原有候选表的语义不变。
     * ------------------------------------------------------------------ */
    function queryAll(selector) {
        const m = /:\s*contains\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/.exec(selector);
        if (!m) {
            try {
                return Array.prototype.slice.call(document.querySelectorAll(selector));
            } catch (err) {
                return [];
            }
        }
        const needle = m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3];
        const base = (selector.slice(0, m.index) + selector.slice(m.index + m[0].length)).trim() || "*";
        let list;
        try {
            list = document.querySelectorAll(base);
        } catch (err) {
            return [];
        }
        return Array.prototype.filter.call(list, (el) => (el.textContent || "").indexOf(needle) >= 0);
    }

    /* ------------------------------------------------------------------ *
     * 链接文本识别正则（文本转链接 / 提取码识别共用）
     * ------------------------------------------------------------------ */
    const hostSuffix = "(?:com|cn|org|net|info|tv|cc|gov|edu|nz|me|io|ke|im|top|xyz|app|moe|in|pw|one|co|ml|art|vip|cam|fun|dev|ai|so|la|ms|us|uk|de|jp|ru|cc)\\b";
    const httpReStr = "(?:https?:\\/\\/|www\\.)[-\\w_.~/=?&#%+:!*@]+|(?<!@)(?:\\w[-\\w._]*\\." + hostSuffix + ")(?:\\/[-\\w_.~/=?&#%+:!*@\\u4e00-\\u9fa5]*)?";
    // 贴吧里的百度网盘短链：/s/1abcdefgh 或 /1abcdefgh（新版 23 位 / 旧版 6~8 位）。
    // 识别与生成共用同一段 ID 规则，避免两处长度范围写歪；右边界防止 22 / 24 位
    // 非法 ID 被静默截断成合法长度，生成打不开的链接。
    const bdpanIdStr = "(?:[-\\w_]{23}|\\w{6,8})";
    const bdpanReStr = "(?:\\/?s)?\\/" + bdpanIdStr + "(?![\\w-])";
    const bdpanTestRe = new RegExp("^(?:\\/?s)?\\/" + bdpanIdStr + "$");
    const emailReStr = "(?<![.@])\\w(?:[-\\w._])+@\\w[-\\w._]+\\." + hostSuffix;
    const ed2kReStr = "ed2k:\\/\\/\\|file\\|[^\\|]+\\|\\d+\\|\\w{32}\\|(?:h=\\w{32}\\|)?\\/";
    const magnetReStr = "magnet:\\?xt=urn:btih:(?:[a-fA-F0-9]{40}|[a-zA-Z2-7]{32})|(?<![|/?#=])\\b(?:[a-f0-9]{40}|[A-F0-9]{40}|[a-z2-7]{32}|[A-Z2-7]{32})\\b";
    const base64ReStr = "(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)";
    const thunderReStr = "thunder:\\/\\/" + base64ReStr;

    const urlRegExpSource =
        "\\b" + ed2kReStr + "|" + emailReStr + "|" + httpReStr + "|" + thunderReStr +
        (locHost === "tieba.baidu.com" ? "|" + bdpanReStr : "") +
        "|" + magnetReStr + "(?:&[\\S]+)?";
    const urlRegExp = new RegExp(urlRegExpSource, "i");

    // 不应被转成链接的文本特征
    const text2LinkSkip = [
        "flashget://", "qqdl://", "tg://", "ss://", "ssr://", "vmess://", "trojan://",
        "115://", "aliyunpan://", "bdpan://", "BDLINK",
    ];

    /* ------------------------------------------------------------------ *
     * 网盘规则
     *
     * inputs / buttons 为「选择器候选数组」，按顺序取第一个可见元素；
     * 站点改版时只需追加候选，或依赖后面的通用兜底，不会立刻整体失效。
     * param     : 提取码写入的查询参数名（不填则写入 hash）
     * store     : 提取码存入 GM 存储，页面从存储读取
     * searchPath: 链接补 ?path=%2F
     * cleanHash : 把 hash 中的 /s/xxxxxx 提到 pathname
     * pathHash  : 把 /f/xxx 改写为 /#/share-detail?id=xxx
     * ------------------------------------------------------------------ */

    // 静态映射表提到模块作用域：原先每次 mapHost 都要新建 7 个正则 + 20 键对象
    const hostPatterns = [
        [/^yun\.baidu\.com$/i, "pan.baidu.com"],
        [/^.*lanzo[a-z]*\.com$/i, "lanzou.com"],
        [/^(?:[a-z]\d{3}|\d{3}[a-z]|t00y|\w+\.(?:ctfile|pipipan))\.com$|^ctfile\.\w+\.cn$/i, "ctfile.com"],
        [/^ct\.\w+\.(?:com|me|org)$/i, "ctfile.com"],
        [/^\w+-my\.sharepoint\.(?:com|cn)$/i, "my.sharepoint.com"],
        [/^(?:www\.)?quark\.cn$/i, "pan.quark.cn"],
        [/^(?:www\.)?123(?:pan|684)\.(?:com|cn)$/i, "www.123pan.com"],
    ];

    const hostAliases = {
        "www.aliyundrive.com": "alipan.com",
        "alywp.net": "alipan.com",
        "pan.quark.cn": "pan.quark.cn",
        "drive.uc.cn": "www.yun.cn",
        "uc.yun.cn": "www.yun.cn",
        "123pan.cn": "www.123pan.com",
        "www.123pan.cn": "www.123pan.com",
        "www.123684.com": "www.123pan.com",
        "123684.com": "www.123pan.com",
        "123pan.com": "www.123pan.com",
        "yun.139.com": "caiyun.139.com",
        "mcloud.139.com": "caiyun.139.com",
        "feixin.10086.cn": "caiyun.139.com",
        "115cdn.com": "115.com",
        "1drv.ms": "onedrive.live.com",
        "ws28.cn": "www.wenshushu.cn",
        "wss1.cn": "www.wenshushu.cn",
        "cloud.qingstore.cn": "moecloud.cn",
        "mofile.own-cloud.cn": "mo.own-cloud.cn",
    };

    const hostCache = new Map();
    const regsCache = new Map();

    const YunDisk = {
        sites: {
            /* ---- 国内主流分享盘 ---- */
            "pan.baidu.com": {
                inputs: ["#accessCode", 'input[placeholder*="提取码"]', "input.u-input__inner", "input.pickpwda-input", "#pwd"],
                buttons: ["#submitBtn", "div.dialog-footer button.u-btn--primary", "a.g-button", 'button:contains("提取文件")'],
                regStr: "[a-z\\d]{4}",
                param: "pwd",
                redirect: { pathname: { "/wap/": "/share/" } },
            },
            "alipan.com": {
                inputs: ['input[placeholder*="提取码"]', 'input[placeholder*="访问码"]', "input.ant-input", 'input[type="text"]'],
                buttons: ['button:contains("提取文件")', 'button:contains("确定")', "button.button--fep7l", 'button[type="submit"]'],
                regStr: "[a-z\\d]{4}",
                param: "pwd",
            },
            "pan.quark.cn": {
                inputs: ['input[placeholder*="提取码"]', 'input[placeholder*="访问码"]', "input.ant-input", 'input[type="text"]'],
                buttons: ['button:contains("提取")', 'button:contains("确定")', "button.ant-btn-primary", 'button[type="submit"]'],
                regStr: "[a-z\\d]{4}",
                param: "pwd",
            },
            "www.yun.cn": {
                inputs: ['input[placeholder*="提取码"]', 'input[placeholder*="访问码"]', "input.ant-input", 'input[type="text"]'],
                buttons: ['button:contains("提取")', 'button:contains("确定")', "button.ant-btn-primary", 'button[type="submit"]'],
                regStr: "[a-z\\d]{4}",
                param: "pwd",
            },
            "www.123pan.com": {
                inputs: ['input[placeholder*="提取码"]', 'input[placeholder*="访问码"]', "input.ant-input", 'input[type="text"]'],
                buttons: ["input.ant-input+button", "button.ant-btn-primary", 'button:contains("提取")', 'button[type="submit"]'],
                regStr: "[a-z\\d]{4,8}",
                param: "pwd",
            },
            "cloud.189.cn": {
                inputs: ["#code_txt", 'input[placeholder*="访问码"]', 'input[placeholder*="提取码"]', "input.access-code-input"],
                buttons: ["a.btn-primary", "button.btn-primary", 'button:contains("确定")', "div.button"],
                regStr: "[a-z\\d]{4}",
            },
            "h5.cloud.189.cn": {
                inputs: ["input.access-code-input", 'input[placeholder*="访问码"]', "input[type=\"text\"]"],
                buttons: ["div.button", "button.btn-primary", 'button:contains("确定")'],
                regStr: "[a-z\\d]{4}",
                param: "password",
                redirect: { href: { "h5.cloud.189.cn/share.html#/t/": "cloud.189.cn/web/share?code=" } },
            },
            "pan.xunlei.com": {
                inputs: ["#__nuxt input.td-input__inner", 'input[placeholder*="提取码"]', "input.td-input__inner", 'input[type="text"]'],
                buttons: ["#__nuxt button.td-button", "button.td-button", 'button:contains("确定")'],
                regStr: "[a-z\\d]{4}",
                param: "password",
                searchPath: true,
            },
            "115.com": {
                inputs: ["input.text", 'input[placeholder*="访问码"]', 'input[type="text"]'],
                buttons: ["a.btn-large", 'button:contains("确定")', "button.btn"],
                regStr: "[a-z\\d]{4}",
                password: true,
            },
            "caiyun.139.com": {
                inputs: ['input[placeholder*="提取码"]', "input[type=\"text\"]", "input"],
                buttons: ["a.btn-token", 'button:contains("确定")', "button"],
                regStr: "[a-z\\d]{4}",
                store: true,
            },
            "share.weiyun.com": {
                inputs: ["input.input-txt", 'input[placeholder*="提取码"]', "input[type=\"text\"]"],
                buttons: ["button.btn-main", 'button:contains("确定")', "button"],
                regStr: "[a-z\\d]{4,6}",
            },
            "pan-yz.chaoxing.com": {
                inputs: ["input.tqInp", 'input[type="text"]'],
                buttons: ["a.blueBgBtn", 'button:contains("确定")'],
                regStr: "[a-z\\d]{6}",
            },

            /* ---- 蓝奏云 / 城通系 ---- */
            "lanzou.com": {
                inputs: ["#pwd", 'input[placeholder*="提取码"]', 'input[type="password"]'],
                buttons: ["#sub", ".passwddiv-btn", 'button:contains("提取")', "a.btn"],
                regStr: "[a-z\\d]{2,10}|-{4}",
            },
            "ctfile.com": {
                inputs: ["#passcode", 'input[placeholder*="密码"]', 'input[type="password"]'],
                buttons: ["button.btn-primary", 'button:contains("确定")', "button"],
                regStr: "[a-z\\d]{4,6}",
            },

            /* ---- 境外盘 ---- */
            "onedrive.live.com": {
                inputs: ['input[type="password"]', "#txtPassword", 'input[placeholder*="密码"]'],
                buttons: ["#btnSubmitPassword", "button.od-Button--primary", 'button[type="submit"]'],
                regStr: "[a-z\\d]{3,7}",
                store: true,
            },
            "my.sharepoint.com": {
                inputs: ["#txtPassword", 'input[type="password"]'],
                buttons: ["#btnSubmitPassword", "input[type=\"submit\"]", "button"],
                regStr: "[a-z\\d]{3,5}",
                password: true,
            },
            "mega.nz": {
                // 仅需识别链接，无需填码
                regStr: "[a-z\\d\\-_]{22}",
            },

            /* ---- 小众 / 自建盘 ---- */
            "www.jianguoyun.com": {
                inputs: ["#access-pwd", 'input[type="password"]', 'input[placeholder*="密码"]'],
                buttons: ["button.action-button", 'button[type="submit"]', "button"],
                regStr: "[a-z\\d]{4,16}",
            },
            "www.wenshushu.cn": {
                inputs: ["input.ivu-input", 'input[placeholder*="提取码"]', 'input[type="text"]'],
                buttons: ["button.m-mg_t40", 'button:contains("确定")', "button"],
                regStr: "[a-z\\d]{4,8}",
            },
            "moecloud.cn": {
                inputs: ["#pwd", 'input[type="password"]', 'input[placeholder*="密码"]'],
                buttons: ["button.MuiButton-root", 'button:contains("确定")', "button"],
                regStr: "\\w+\\.\\w+\\.\\w+|[a-z\\d]{3,8}",
                password: true,
                cleanHash: true,
            },
            "mo.own-cloud.cn": {
                inputs: ["#pwd", 'input[type="password"]'],
                buttons: ["button.MuiButton-root", "button"],
                regStr: "[a-z\\d\\u4e00-\\u9fa5]{2,8}",
                password: true,
                cleanHash: true,
            },
            "shandianpan.com": {
                inputs: ['input[placeholder="请输入文件密码"]', 'input[type="password"]'],
                buttons: ["div.btn", 'button:contains("确定")'],
                regStr: "[a-z\\d]{4}",
                password: true,
                pathHash: true,
            },
        },

        // 只做「文本转链接后自动打开」，不需要填码的站点
        pans: [
            "drive.google.com",
            "www.dropbox.com",
            "www.mediafire.com",
            "disk.yandex.com",
            "yadi.sk",
            "mega.nz",
            "www.kdocs.cn",
            "shimo.im",
            "www.yuque.com",
            "down.52pojie.cn",
            "www.androiddownload.net",
        ],

        // 用于跳过「其它网盘链接文本」的关键词
        panKeywords: [
            "lanzou", "lanzo", "ctfile", "pan.baidu", "yun.baidu", "123pan", "123684",
            "alipan", "aliyundrive", "quark", "189.cn", "xunlei", "115.com", "yun.cn",
            "weiyun", "jianguoyun", "mega.nz", "dropbox", "drive.google", "onedrive",
            "sharepoint", "wenshushu", "moecloud", "shimo.im", "yuque.com",
        ],

        mapHost(host) {
            if (!host) return host;
            const hit = hostCache.get(host);
            if (hit) return hit;

            let mapped = null;
            for (const [re, target] of hostPatterns) {
                if (re.test(host)) {
                    mapped = target;
                    break;
                }
            }

            if (!mapped) {
                // 用户自定义映射（沿用 2.0.2 的存储键，避免丢配置）
                if (t.arr("ctpanHosts").includes(host)) mapped = "ctfile.com";
                else if (t.arr("cloudreveHosts").includes(host)) mapped = "moecloud.cn";
                else mapped = hostAliases[host] || host;
            }

            hostCache.set(host, mapped);
            return mapped;
        },

        // 站点正则按 host 缓存：原先每次点击都要 new RegExp 一次（含那个超长扫描式）
        regs(mapped, site) {
            let r = regsCache.get(mapped);
            if (!r) {
                r = { exact: new RegExp("^(?:" + site.regStr + ")$", "i") };
                regsCache.set(mapped, r);
            }
            if (!r.scan) {
                r.scan = new RegExp(
                    "\\s*(?:提[取示]|访问|查阅|取件|密\\s*|口令|艾|Extracted-code|key|password|pwd)[码碼]?(?:--)?[】\\])）]?\\s*[\\u4e00-\\u9fa5]?[:： （(是为]?\\s*(" +
                    site.regStr +
                    ")|^[码碼]?[】\\])）]?\\s*[:：【\\[ （(]*\\s*(" +
                    site.regStr +
                    ")[】\\])）]?$",
                    "i"
                );
            }
            return r;
        },

        redirect(a, rules) {
            if (!rules) return;
            for (const key in rules) {
                for (const from in rules[key]) {
                    a[key] = a[key].replace(from, rules[key][from]);
                }
            }
        },

        setParam(a, key, value) {
            try {
                const u = new URL(a.href, location.href);
                u.searchParams.set(key, value);
                a.href = u.toString();
            } catch (err) {
                a.search = a.search
                    ? a.search + "&" + key + "=" + encodeURIComponent(value)
                    : key + "=" + encodeURIComponent(value);
            }
        },

        hasCode(a, key) {
            return new URLSearchParams(a.search).has(key);
        },

        // 链接里已经带了合法提取码时不再重复识别，覆盖各家参数命名
        hasValidCode(a, site, regs) {
            const r = regs || this.regs(this.mapHost(a.hostname || a.host), site);
            if (r.exact.test(t.hashcode(a))) return true;
            try {
                const u = new URL(a.href, location.href);
                for (const k of CODE_KEYS) {
                    const v = u.searchParams.get(k);
                    if (v && r.exact.test(v)) return true;
                }
            } catch (err) {
                if (r.exact.test(t.search(a))) return true;
            }
            return false;
        },

        /*
         * 把提取码写进链接。
         * 原来一个函数同时负责 URL 改写、hash 搬运、文本扫描、写回四件事，
         * 现在按职责拆开，每步都能单独改、单独测。
         */
        addCode(a) {
            const mapped = this.mapHost(a.hostname || a.host);
            const site = this.sites[mapped];
            if (!site || !site.regStr) return;

            const regs = this.regs(mapped, site);
            this.rewriteHref(a, site);
            this.migrateHashCode(a, site, regs);

            if (this.hasValidCode(a, site, regs)) return;

            const code = this.scanCode(a, regs);
            if (code) {
                this.applyCode(a, mapped, site, code);
                return;
            }
            if (site.store) t.del(mapped);
            t.clog("找不到提取码", a.href);
        },

        /* 站点特定的 URL 改写：重定向、hash 提到 pathname、补 path 参数 */
        rewriteHref(a, site) {
            if (site.redirect) this.redirect(a, site.redirect);

            if (site.cleanHash) {
                const result = a.hash && /#(\/s\/\w{6})/.exec(a.hash);
                if (result && a.pathname === "/") {
                    a.pathname = result[1];
                    a.hash = "";
                }
            } else if (site.pathHash) {
                if (/\/f\/\w+/.test(a.pathname)) {
                    a.href = a.href.replace("f/", "#/share-detail?id=");
                }
            } else if (site.searchPath) {
                if (!a.search) a.search = "?path=%2F";
            }
        },

        /* 有些站点从查询参数收码，先把 hash 里的码搬到参数上 */
        migrateHashCode(a, site, regs) {
            if (!site.param && !site.password) return;
            const key = site.param || "password";
            const inHash = /^#?([a-z\d]{2,22})$/i.exec(a.hash);
            if (inHash && regs.exact.test(inHash[1]) && !this.hasCode(a, key)) {
                this.setParam(a, key, inHash[1]);
                a.hash = "";
            }
        },

        /* 落码：存 GM 存储 / 写查询参数 / 写 hash，按站点声明三选一 */
        applyCode(a, mapped, site, code) {
            a.href = a.href.replace(/%E6%8F%90%E5%8F%96%E7%A0%81$/, "");
            if (site.store) {
                t.set(mapped, code);
            } else if (site.param || site.password) {
                this.setParam(a, site.param || "password", code);
            } else {
                a.href = a.href.replace(/%23.*$/, "");
                a.hash = code;
            }
        },

        /*
         * 扫描链接自身与周边文本找提取码。
         *
         * 原实现用 next.innerText：innerText 是布局依赖属性，每读一次都强制同步
         * reflow，长帖里一次点击能触发几十次；且兄弟节点遍历没有上限，对每层祖先
         * 都把整棵子树拼成字符串，复杂度接近 O(n²)。
         * 现在：一律 textContent（不触发布局），加节点数 / 文本长度预算，
         * 并用「含内嵌 <a> 即跳过」先做廉价预筛，避免误取其它网盘链接附近的码。
         */
        scanCode(a, regs) {
            const scan = regs.scan;
            const pick = (txt) => {
                if (!txt) return null;
                if (txt.length > 2000) return null; // 提取码上下文很短，超长文本只会放大回溯成本
                const m = scan.exec(txt.trim());
                if (!m) return null;
                const c = m[1] || m[2];
                if (!c || /^http/i.test(c)) return null;
                return c;
            };
            const skipEl = (el) => {
                if (typeof el.querySelector !== "function") return false;
                if (el.querySelector("a")) return true; // 其它网盘链接所在节点
                const txt = (el.textContent || "").toLowerCase();
                return this.panKeywords.some((k) => txt.includes(k));
            };

            let code = pick(a.textContent);
            if (code) return code;

            let nodes = 0;
            for (let level = 10, cur = a; cur && cur.localName !== "body" && level > 0; level--, cur = cur.parentElement) {
                let next = cur;
                while (!code && next && nodes < 60) {
                    nodes++;
                    // next === a 时文本已在上面扫过，不重复处理
                    if (next !== a) {
                        if (next.nodeType === 3) code = pick(next.nodeValue);
                        else if (next.localName !== "a" && !skipEl(next)) code = pick(next.textContent);
                    }
                    next = next.nextSibling;
                }
                if (code || nodes >= 60) break;
            }
            return code;
        },

        /* 在网盘分享页自动填写并提交提取码（自适应实现） */
        autoFill(host) {
            const site = this.sites[host];
            if (!site || !site.inputs) return;

            const code = site.store ? t.get(host, "") : t.codeFromUrl();
            if (!code) {
                t.clog("未找到提取码");
                return;
            }
            // 必须整串匹配，不从 hash 中间截取，避免误填
            if (!this.regs(host, site).exact.test(code)) {
                t.clog("提取码格式不匹配", code);
                return;
            }
            this.fill(site, code);
        },

        fill(site, code) {
            const isVisible = (el) => el.getClientRects().length > 0;
            const find = (selectors, needVisible = true) => {
                for (const sel of selectors || []) {
                    const matches = queryAll(sel);
                    const el = needVisible ? matches.find(isVisible) : matches[0];
                    if (el) return el;
                }
                return null;
            };
            const fallbackButton = (input) => {
                let box = input.parentElement;
                for (let i = 0; box && i < 4; i++, box = box.parentElement) {
                    const candidates = Array.prototype.slice
                        .call(box.querySelectorAll('button, a.btn, [role="button"], input[type="submit"]'))
                        .filter(isVisible);
                    const named = candidates.find((el) => /确定|提交|提取|查看|打开|下载|submit|confirm|ok/i.test(el.textContent || el.value || ""));
                    if (named) return named;
                    if (candidates.length) return candidates[0];
                }
                return null;
            };
            const setValue = (el, value) => {
                const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
                const desc = Object.getOwnPropertyDescriptor(proto, "value");
                if (desc && desc.set) desc.set.call(el, value);
                else el.value = value;
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
            };

            let done = false;
            let observer = null;
            let rafId = 0;
            let lastAt = 0;
            let timer = 0;

            const stop = () => {
                if (observer) {
                    observer.disconnect();
                    observer = null;
                }
                if (rafId) cancelAnimationFrame(rafId);
                rafId = 0;
                if (timer) clearTimeout(timer);
                timer = 0;
            };

            const attempt = () => {
                if (done) return true;
                const input = find(site.inputs);
                if (!input) return false;
                // 已经填过就不重复提交
                if (input.dataset.lhFilled === code) return true;
                input.dataset.lhFilled = code;
                setValue(input, code);
                const button = find(site.buttons, false) || fallbackButton(input);
                if (button) setTimeout(() => button.click(), 60);
                done = true;
                t.clog("已自动填写提取码", locHost, code);
                return true;
            };

            if (attempt()) {
                stop();
                return;
            }

            // 全文档 subtree 观察必须节流：网盘页 DOM 变动极密集，
            // 每批变更都跑一遍选择器查询 + 布局读取会直接卡住主线程。
            const tick = () => {
                rafId = 0;
                if (done) {
                    stop();
                    return;
                }
                const now = performance.now();
                if (now - lastAt < 120) return; // 冷却，避免在高频变更页反复查询
                lastAt = now;
                if (attempt()) stop();
            };

            observer = new MutationObserver(() => {
                if (rafId || done) return;
                rafId = requestAnimationFrame(tick);
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
            timer = setTimeout(stop, 15000);
        },
    };

    /* ------------------------------------------------------------------ *
     * 文本转链接（用 DOM API 构建，不把页面文本当 HTML 插入）
     * ------------------------------------------------------------------ */

    // 用点击坐标反查命中的文本节点（selectstart 之类的无坐标事件返回 null）
    function caretNodeAt(x, y) {
        try {
            const pos = document.caretRangeFromPoint
                ? document.caretRangeFromPoint(x, y)
                : (document.caretPositionFromPoint ? document.caretPositionFromPoint(x, y) : null);
            const node = pos && (pos.startContainer || pos.offsetNode);
            return node && node.nodeType === 3 ? node : null;
        } catch (err) {
            return null; // 坐标无效（例如 selectstart 事件）时交给调用方兜底
        }
    }

    function text2Link(node, ptX, ptY) {
        const text = node.nodeValue;
        if (!text) return null;
        if (text2LinkSkip.some((p) => text.includes(p))) return null;
        if (/SHA-?(1|256)|MD-?5/i.test((node.parentElement && node.parentElement.textContent) || "")) return null;
        if (text.length >= t.get("textLength", 500)) return null;

        const frag = document.createDocumentFragment();
        // 每次调用用独立实例：共享全局正则的 lastIndex 在重入时会串味
        const re = new RegExp(urlRegExpSource, "gi");
        let last = 0;
        let count = 0;
        let m;

        while ((m = re.exec(text)) !== null) {
            if (m[0] === "") {
                re.lastIndex++;
                continue;
            }
            if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));

            const raw = m[0];
            const a = document.createElement("a");
            a.className = "text2Link";
            a.textContent = raw;

            if (raw.includes("@") && !/^https?:\/\/|\/@?|^magnet:/.test(raw)) {
                a.href = "mailto:" + raw;
            } else if (/^https?:\/\//i.test(raw)) {
                a.href = raw;
                a.target = "_blank";
            } else if (/^thunder:\/\//i.test(raw)) {
                a.href = raw;
                a.title = "使用迅雷下载";
            } else if (/^ed2k:\/\//i.test(raw)) {
                a.href = raw;
                a.title = "使用BT软件下载";
            } else if (/^magnet:/i.test(raw)) {
                a.href = raw;
                a.title = "使用BT软件下载";
            } else if (/^[a-f0-9]{40}$|^[A-Z2-7]{32}$/i.test(raw)) {
                a.href = "magnet:?xt=urn:btih:" + raw;
                a.title = "使用BT软件下载";
            } else if (bdpanTestRe.test(raw)) {
                a.href = "https://pan.baidu.com/s/" + raw.replace(/^(?:\/?s)?\//, "");
                a.target = "_blank";
            } else if (/^\//.test(raw)) {
                // 兜底：/ 开头却没命中短链规则时按纯文本保留，不生成 https:///xxx 坏链
                frag.appendChild(document.createTextNode(raw));
                last = m.index + raw.length;
                continue;
            } else {
                a.href = "https://" + raw;
                a.target = "_blank";
            }

            frag.appendChild(a);
            last = m.index + raw.length;
            count++;
        }

        if (!count) return null;
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));

        const span = document.createElement("span");
        span.className = "text2Link";
        span.appendChild(frag);
        node.replaceWith(span);

        // 一个文本节点里可能有多个链接：按点击坐标反查命中的是哪一个 <a>。
        // 原先固定返回 span.querySelector("a")，点第二个链接会打开第一个。
        if (typeof ptX === "number" && typeof ptY === "number") {
            let cur = caretNodeAt(ptX, ptY);
            while (cur && cur !== span) {
                if (cur.localName === "a" && span.contains(cur)) return cur;
                cur = cur.parentNode;
            }
        }
        return span.querySelector("a");
    }

    /* ------------------------------------------------------------------ *
     * 新标签打开链接
     * ------------------------------------------------------------------ */
    function addBlank(a) {
        if (!t.get("isAddBlank", true)) return;
        if (t.arr("defaultTargetSites").some((s) => s === locHost)) return;

        let skip =
            a.href === "" ||
            a.target === "_blank" ||
            /javascript[\w:;()]+/.test(a.href) ||
            /\/\w+-\d+-\d+\.html|.+page\/\d+|category-\d+_?\d*/.test(a.href) ||
            /[前后後上下首末].+[页頁篇张張]|^\.*\s*\d+\s*\.*$|^next$|^previous$|^[＜＞]$/i.test(a.textContent || "") ||
            ["prev", "next"].some((r) => a.attributes.rel && r === a.attributes.rel.nodeValue) ||
            ["prev", "next", "nxt"].some((r) => (a.className || "").includes(r)) ||
            a.href === location.origin + "/" ||
            /^#.+/.test(a.attributes.href && a.attributes.href.nodeValue) ||
            a.href.endsWith(".user.js");

        // 同域站内链接保持页面默认打开方式：SPA 的站内跳转（抖音 / 知乎 / B站等）
        // 被强开新标签会打断路由。相对链接仍由下面的 relative 开关控制，两者互不干扰。
        // 勾选「同域链接也新标签打开」即可恢复 2.1.0 的行为。
        const rawHref = (a.attributes.href && a.attributes.href.nodeValue) || "";
        const isAbsolute = /^(?:https?:|\/\/).+/i.test(rawHref);
        if (!t.get("sameHostBlank", false) && isAbsolute && a.host === locHost) skip = true;
        if (!t.get("relative", false) && locHost !== "www.amazon.com") {
            skip = skip || !isAbsolute;
        }
        if (!skip) a.target = "_blank";
    }

    /* ------------------------------------------------------------------ *
     * 鼠标事件入口
     *
     * 分工（2.3.0 起）：
     *   mousedown → 只做属性级处理（改 href / target），绝不替换 DOM 节点。
     *               原先绑了 selectstart，在「开始选区」的瞬间就把文本节点
     *               replaceWith 掉，正在拖选的文字会当场失效。
     *   mouseup   → 按下与松开的位移超过阈值即视为拖选，直接放过；只有真正的
     *               单击才允许走 text2Link 替换节点 + 自动打开。
     * ------------------------------------------------------------------ */
    const DRAG_TOLERANCE = 5;
    let pressPoint = null;

    function hitsAnchor(node) {
        let cur = node;
        for (let i = 0; cur && i < 5; i++, cur = cur.parentElement || cur.parentNode) {
            if (cur.localName === "a") return cur;
        }
        return null;
    }

    /* 运行时可编辑区防护（2.3.5）
     * @exclude 只在页面加载时判定一次：SPA 从阅读页跳到编辑页不刷新页面，
     * 名单外的在线文档站点也拦不住，脚本早就注入并绑好了全局监听。
     * 在编辑器里替换 DOM 会破坏它自己的内容模型、选区与撤销栈，甚至把改动
     * 同步到服务端。因此两个事件入口都先挡一道，黑名单只用来省注入成本。 */
    function isEditableContext(target) {
        if (!target) return false;
        if (document.designMode === "on") return true;
        let el = target.nodeType === 3 ? target.parentElement : target;
        for (let i = 0; el && i < 6; i++, el = el.parentElement) {
            if (el.nodeType !== 1) break;
            if (el.isContentEditable) return true;
            if (typeof el.getAttribute === "function") {
                if (el.getAttribute("contenteditable") === "true") return true;
                if (el.getAttribute("role") === "textbox") return true;
            }
            const tag = el.localName;
            if (tag === "input" || tag === "textarea" || tag === "select") return true;
        }
        return false;
    }

    /* 属性级处理：只改 href / target，不动节点结构，任意时机调用都安全 */
    function touchAnchor(a) {
        if (!(a instanceof HTMLAnchorElement) || !a.href) return;

        // 特殊协议不强制新标签
        if (/^magnet:\?xt=urn:btih:|^ed2k:\/\/\|file\||^thunder:\/\//i.test(a.href)) {
            a.removeAttribute("target");
            return;
        }
        if (a.host === "pan.baidu.com" && a.hash.startsWith("#/transfer/send?surl=")) return;

        if (YunDisk.sites[YunDisk.mapHost(a.hostname || a.host)]) YunDisk.addCode(a);
        addBlank(a);
    }

    function onMouseDown(ev) {
        if (isEditableContext(ev.target)) return;
        if (ev.button === 0) pressPoint = { x: ev.clientX, y: ev.clientY };
        // 右键 / 中键也处理：改的是 href，不影响选区，
        // 这样右键「复制链接地址」拿到的仍是带提取码的链接。
        const a = hitsAnchor(ev.target);
        if (a) touchAnchor(a);
    }

    function onMouseUp(ev) {
        const start = pressPoint;
        pressPoint = null;
        if (isEditableContext(ev.target)) return;
        if (ev.button !== 0) return;
        if (start && (Math.abs(ev.clientX - start.x) > DRAG_TOLERANCE || Math.abs(ev.clientY - start.y) > DRAG_TOLERANCE)) {
            return; // 拖选 / 拖拽：放过，别把用户刚选中的文本换成链接
        }
        listener(ev);
    }

    function listener(obj) {
        const oe = obj.originalEvent || obj;
        let e = oe.explicitOriginalTarget || oe.target || obj.target;
        if (!e) return;

        const ptX = typeof oe.clientX === "number" ? oe.clientX : null;
        const ptY = typeof oe.clientY === "number" ? oe.clientY : null;
        let isTextToLink = false;

        // 事件目标在链接内时直接按链接处理，避免坐标反查落到无关文本节点，
        // 导致 addCode / addBlank 被跳过。
        let link = e;
        for (let i = 0; link && i < 5 && link.localName !== "a"; i++) link = link.parentElement;
        // explicitOriginalTarget 是 Firefox 专有属性，Chrome / Edge 上不存在，
        // 事件目标会退化成元素节点（nodeValue 为 null），导致文本转链接永不触发。
        // 其余情况用鼠标坐标反查点击处的文本节点，兼容 Chromium 内核。
        if (link && link.localName === "a") {
            e = link;
        } else if (e.nodeType === 1 && ptX !== null && ptY !== null) {
            const node = caretNodeAt(ptX, ptY);
            if (node) e = node;
        }

        if (!e.href) {
            let flag = true;
            let selectNode = null;

            for (let current = e, limit = 5; current && current.localName !== "html" && current.localName !== "body" && limit > 0; current = current.parentElement, limit--) {
                if (current.localName === "a") {
                    e = current;
                    break;
                }
                if (current.localName === "code" || current.localName === "pre") {
                    const selection = getSelection();
                    const text = selection ? selection.toString() : "";
                    // anchorNode 在整块选中时是元素本身，须从选区 range 取真正的文本节点
                    if (urlRegExp.test(text) && selection && selection.rangeCount) {
                        const range = selection.getRangeAt(0);
                        const start = range.startContainer;
                        const node = start.nodeType === 3 ? start : start.childNodes[range.startOffset] || start.firstChild;
                        selectNode = node && node.nodeType === 3 ? node : null;
                        if (!selectNode) flag = false;
                    } else flag = false;
                    break;
                }
            }

            if (e.localName !== "a" && flag) {
                const node = selectNode || e;
                if (node && node.nodeValue) {
                    e = text2Link(node, ptX, ptY);
                    if (e) isTextToLink = true;
                }
            }
        }

        // SVG <a> 的 href 是 SVGAnimatedString，没有 host / search，进入处理链会抛错
        if (!e || !(e instanceof HTMLAnchorElement) || !e.href) return;
        const a = e;

        // 补齐 href（含提取码）与 target。mousedown 已经处理过同一链接时会因
        // hasValidCode 短路，重复调用是幂等的。
        touchAnchor(a);

        if (isTextToLink) {
            const autoOpen =
                t.get("autoClickAll", false) ||
                !!YunDisk.sites[YunDisk.mapHost(a.hostname || a.host)] ||
                t.arr("autoClickHosts").concat(YunDisk.pans).some((h) => h === a.host) ||
                t.arr("autoClickSites").some((h) => h === locHost);
            if (autoOpen) a.click();
        }
    }

    /* ------------------------------------------------------------------ *
     * 配置面板（原生 <dialog>，无第三方 UI 库；GM 存储键与 2.0.2 保持一致）
     * ------------------------------------------------------------------ */
    function parseHosts(value) {
        return value.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean);
    }

    function showSettings() {
        const old = document.getElementById("lh-settings");
        if (old) {
            if (!old.open) old.showModal();
            return;
        }

        const dlg = document.createElement("dialog");
        dlg.id = "lh-settings";
        dlg.className = "lh-dialog";
        dlg.innerHTML = `
            <form method="dialog" class="lh-card">
                <div class="lh-head">
                    <strong>链接助手配置</strong>
                    <button class="lh-x" value="close" title="关闭">×</button>
                </div>
                <div class="lh-body">
                    <label class="lh-item">文本转链接的字符数限制 <span id="lhLen">500</span>
                        <input type="range" id="textLength" min="200" max="800" step="50" />
                    </label>
                    <label class="lh-item lh-check"><input type="checkbox" id="autoClickAll" />文本转链接后一律自动打开</label>
                    <label class="lh-item">自动打开的链接域名（逗号分隔）
                        <input type="text" id="autoClickHosts" placeholder="example.com, pan.quark.cn" />
                    </label>
                    <label class="lh-item">自动打开的页面站点（逗号分隔）
                        <input type="text" id="autoClickSites" placeholder="example.com" />
                    </label>
                    <label class="lh-item lh-check"><input type="checkbox" id="isAddBlank" />新标签打开链接</label>
                    <label class="lh-item lh-check"><input type="checkbox" id="relative" />相对链接也新标签打开</label>
                    <label class="lh-item lh-check"><input type="checkbox" id="sameHostBlank" />同域链接也新标签打开</label>
                    <label class="lh-item">保持默认打开方式的站点（逗号分隔）
                        <input type="text" id="defaultTargetSites" placeholder="docs.example.com" />
                    </label>
                </div>
                <div class="lh-foot">
                    <span class="lh-tip">勾选即时生效，输入框关闭后保存</span>
                    <button class="lh-ok" value="close">完成</button>
                </div>
            </form>`;
        document.body.appendChild(dlg);

        // 面板内局部查询，避免与页面里同 id 的元素抢到错误的节点
        const pick = (id) => dlg.querySelector("#" + id);

        ["autoClickAll", "isAddBlank", "relative", "sameHostBlank"].forEach((name) => {
            const el = pick(name);
            el.checked = t.get(name, name === "isAddBlank");
            el.addEventListener("change", () => t.set(name, el.checked));
        });

        const range = pick("textLength");
        const lenLabel = pick("lhLen");
        const len = t.get("textLength", 500);
        range.value = len;
        lenLabel.textContent = len; // 旧版这里 nextAll 方向反了，打开面板永远显示硬编码 500
        range.addEventListener("input", () => {
            lenLabel.textContent = range.value;
        });

        ["autoClickHosts", "autoClickSites", "defaultTargetSites"].forEach((name) => {
            pick(name).value = t.arr(name).join(", ");
        });

        dlg.addEventListener("close", () => {
            t.set("textLength", +range.value || 500);
            ["autoClickHosts", "autoClickSites", "defaultTargetSites"].forEach((name) => {
                const list = parseHosts(pick(name).value || "");
                if (list.length) t.set(name, list);
                else t.del(name);
            });
        });

        dlg.showModal();
    }

    const style = `
        /* 文本转链接生成的可视标识：站点常把 a 的颜色与下划线覆盖掉，
           这里用高特异度保证「蓝色 + 下划线」稳定生效，不加背景色，
           选择器只命中脚本自己生成的 a.text2Link，不碰页面原有链接。 */
        a.text2Link, a.text2Link:visited {
            color: #1a73e8 !important;
            text-decoration: underline !important;
            text-decoration-color: #1a73e8 !important;
            text-underline-offset: 2px;
        }
        a.text2Link:hover, a.text2Link:focus {
            color: #0b57d0 !important;
            text-decoration-color: #0b57d0 !important;
        }
        @media (prefers-color-scheme: dark) {
            a.text2Link, a.text2Link:visited {
                color: #8ab4f8 !important;
                text-decoration-color: #8ab4f8 !important;
            }
            a.text2Link:hover, a.text2Link:focus {
                color: #aecbfa !important;
                text-decoration-color: #aecbfa !important;
            }
        }
        .lh-dialog { padding: 0; border: 0; border-radius: 12px; width: min(430px, calc(100vw - 32px)); background: #fff; color: #1f2329; box-shadow: 0 18px 48px rgba(0, 0, 0, .3); font: 15px/1.5 'Microsoft Yahei', arial, helvetica, sans-serif; }
        .lh-dialog::backdrop { background: rgba(0, 0, 0, .42); }
        .lh-dialog *, .lh-dialog *::before, .lh-dialog *::after { box-sizing: border-box; }
        .lh-card { margin: 0; font: inherit; color: inherit; }
        .lh-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #eef0f3; font-size: 16px; font-weight: 600; }
        .lh-x { border: 0; background: none; color: #9aa0a8; font-size: 22px; line-height: 1; padding: 0 2px; cursor: pointer; }
        .lh-x:hover { color: #4b5563; }
        .lh-body { padding: 4px 16px; max-height: 62vh; overflow: auto; text-align: left; }
        .lh-item { display: block; padding: 9px 0; font-size: 14px; font-weight: normal; color: #1f2329; }
        .lh-item input[type="text"] { display: block; width: 100%; margin-top: 6px; padding: 6px 8px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 13px; color: #1f2329; background: #fff; }
        .lh-item input[type="range"] { display: block; width: 100%; margin-top: 6px; }
        .lh-check { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .lh-check input[type="checkbox"] { margin: 0; width: auto; height: auto; }
        .lh-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-top: 1px solid #eef0f3; background: #fafbfc; border-radius: 0 0 12px 12px; }
        .lh-tip { font-size: 12px; color: #9aa0a8; }
        .lh-ok { border: 0; border-radius: 6px; padding: 6px 16px; background: #2f6fed; color: #fff; font-size: 14px; cursor: pointer; }
        .lh-ok:hover { background: #2560d8; }
    `;

    /* ------------------------------------------------------------------ *
     * 入口分流：网盘分享页只做自动填码，其它页面才挂全局监听
     * ------------------------------------------------------------------ */
    function main() {
        const dealedHost = YunDisk.mapHost(locHost);
        if (YunDisk.sites[dealedHost]) {
            YunDisk.autoFill(dealedHost);
        } else {
            GM_addStyle(style);
            t.registerMenu("🔗配置", showSettings);
            // 两平台统一：mousedown 做属性级处理，mouseup 才决定是否转换文本
            document.addEventListener("mousedown", onMouseDown);
            document.addEventListener("mouseup", onMouseUp);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", main, { once: true });
    } else {
        main();
    }
})();
