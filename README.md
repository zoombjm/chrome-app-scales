# Scales

读取电子秤的 Chrome App。

注意：应用仍处于开发初期阶段。

## 一点说明

由于 Google Chrome 禁用了 NPAPI 插件，导致项目里的电子秤插件失效了，而 Chrome 扩展程序没法访问操作系统的硬件，所以想到通过 Chrome App 的方式来读取电子秤读数。

项目开发步骤：

 - [x] 学会[开发一个 Chrome App](https://crxdoc-zh.appspot.com/apps/first_app)。运行 `npm run webpack`，然后在 chrome://extensions/ 载入 `/src` 文件夹
 - [x] 测试看看普通网页能否通过[外部消息传递](https://crxdoc-zh.appspot.com/apps/manifest/externally_connectable)连接到 Chrome App。在 chrome://extensions/ 中查看第一步加载的应用的 id，然后编辑 `/external/connect.html` 中的 `eid` 变量，最后在**本地 web 服务器**中打开这个 html 文件。
 - [ ] [使用 chrome.serial API](https://crxdoc-zh.appspot.com/apps/app_serial) 读取电子秤读数
