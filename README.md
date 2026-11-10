# userscripts

YU1O 的用户脚本合集（Tampermonkey / Violentmonkey / 脚本猫），GPL-3.0。**一个脚本一个独立目录**，每个脚本自己管理版本、文档与更新地址，互不干扰。

## 脚本列表

| 脚本 | 版本 | 说明 | 安装 / 更新地址 |
| --- | --- | --- | --- |
| [链接助手（增强版）](scripts/link-helper-plus/README.md) | 2.3.7 | 网盘提取码自动识别与填写、文本转链接、新标签打开链接 | <https://cdn.jsdelivr.net/gh/YU1O/userscripts@main/scripts/link-helper-plus/link-helper-plus.user.js> |

## 目录结构

```
README.md                                 脚本索引 + 仓库约定（本文件）
LICENSE                                    GPL-3.0 全文（全仓共用）
scripts/
└── link-helper-plus/
    ├── link-helper-plus.user.js           脚本本体
    ├── README.md                          安装 / 功能 / 配置说明
    └── CHANGELOG.md                       该脚本的逐版改动
```

根目录不放任何 `.user.js`：脚本都住在自己的目录里，新增脚本时不必动别人的文件。

## 新增脚本的约定

- 照 `scripts/link-helper-plus/` 的样子建 `scripts/<脚本名>/`，放 `<脚本名>.user.js` + README + CHANGELOG，并在这里的表格登记一行。
- 每个脚本的 `@namespace` 必须唯一（建议带脚本路径），`@version` 各自独立递增；`@updateURL` / `@downloadURL` 指向**自己那个文件**的 jsDelivr 地址，不要照抄别的脚本。复用 namespace 会让管理器把两个脚本当成同一个，`GM_setValue` 数据串在一起。
- 更新地址保持 `@main` 指向分支最新，不要写死版本 tag——写死后客户端取到的 `@version` 永远不变，自动更新会失效。
- 发版 tag 用 `<脚本名>-v<版本>` 前缀，避免多脚本共仓时版本号撞车。
- 根 `LICENSE` 为 GPL-3.0；若个别脚本采用不同许可，在该脚本目录内单独声明。

## 迁移记录（2026-11-10）

**改名**：仓库从 `YU1O/link-helper-plus` 改为通用的 `YU1O/userscripts`。实测改名后旧 jsDelivr 地址仍直接返回 200（无对外 301）、内容就是新仓库的文件，GitHub 的仓库重定向对 raw 与 jsDelivr 都透明，所以这一步没有断掉自动更新。

**移入独立目录**：2.3.7 起脚本从根目录移到 `scripts/link-helper-plus/`，根目录旧文件已删除。**仓库内部改路径没有任何重定向可依赖**，旧地址会 404（jsDelivr 边缘节点可能还会缓存一阵旧内容）。已安装旧版的用户需要在管理器编辑器里**粘贴一次 2.3.7 全文**，或手动把头部的两个 URL 字段改成上表的新地址；`@namespace` 未变，8 项配置保留。

`@namespace` 一直保留旧字符串不动：它只是管理器的身份标识，不解析也不访问；改掉会被当成新脚本，`GM_setValue` 配置全部丢失，还可能出现两份同名脚本。历史 tag（`v2.3.5`、`link-helper-plus-v2.3.6`）保持不动，仍可回溯任意一版。

## 许可

GPL-3.0。链接助手原作者「一个北七」，改造与维护 YU1O；原作者署名、`@icon` 与许可证声明均予保留，全文见 [LICENSE](LICENSE)。
