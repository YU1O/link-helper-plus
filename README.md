# link-helper-plus

基于 [一个北七 的「链接助手」](https://github.com/oneNorth7/LinkHelper) 改造，遵循 GPL-3.0。

## 安装
Tampermonkey 新建脚本并粘贴 `link-helper.user.js`，或直接打开
https://cdn.jsdelivr.net/gh/YU1O/link-helper-plus@main/link-helper.user.js 安装。

## 注意
`@namespace` 与原版不同，Tampermonkey 视为独立脚本，`GM_setValue` 按脚本隔离，
原版配置不会自动继承。

## 许可
GPL-3.0，原作者「一个北七」，改造与维护 YU1O。全文见 LICENSE。
