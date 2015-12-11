# Serial Port App

读取[串行接口](https://zh.wikipedia.org/wiki/串行端口)设备数据的 Chrome App。

## 为什么开发 Serial Port App

公司项目原本使用 Java 开发了一个浏览器插件，用于从网页里读取连接到电脑的电子秤的读数，但由于 [Google Chrome 禁用了 NPAPI 插件](https://support.google.com/chrome/answer/6213033?hl=zh-Hans)，导致这个浏览器插件失效了，所以我开发了这个 Chrome App 来读取电子秤读数。

但是，Serial Port App 并不是只能用于电子秤，理论上来说，它能读取所有**使用串行接口**接入到电脑的设备的数据，电子秤只是其中一种。

## 如何使用

不同于其它 Chrome 应用，Serial Port App 没有界面，它使用[外部网页连接](https://developer.chrome.com/apps/manifest/externally_connectable)（[中文](https://crxdoc-zh.appspot.com/apps/manifest/externally_connectable)）让普通网页能与应用通信，从而获取设备的数据。

**但正如文档里所说，只有列在 [manifest.json](https://github.com/lmk123/chrome-app-scales/blob/master/src/manifest.json) 文件里的网站才能连接至应用，所以，你需要告诉我你的网站网址，然后我会加入到 manifest.json 中并重新发布应用。**你也可以 Fork 源码之后生成自己的应用并安装在 Chrome 里使用。

[manifest.json 中的 externally_connectable.matches 属性](https://github.com/lmk123/chrome-app-scales/blob/master/src/manifest.json#L17) 列出了目前能连接到 Serial Port App 的网站。

安装之后，就可以参照 [/external/connect.html](https://github.com/lmk123/chrome-app-scales/blob/master/external/connect.html) 里的代码获取数据了。

## 许可

MIT
