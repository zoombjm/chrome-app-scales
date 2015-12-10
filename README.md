# Scales

读取电子秤的 Chrome App。

## 为什么开发 Scales

由于 [Google Chrome 禁用了 NPAPI 插件](https://support.google.com/chrome/answer/6213033?hl=zh-Hans)，大部分原有的浏览器插件都已失效，所以我开发了这个 Chrome App 来读取电子秤读数。

## 如何使用及测试

 1. 首先，将你的设备（比如电子秤）连接到电脑
 2. 克隆此项目
 3. 安装依赖包：`npm i`
 4. 生成项目文件：`npm run webpack`
 5. 打开 Chrome 浏览器，进入扩展程序页面（或者直接在浏览器中输入 chrome://extensions/），勾选右上角的“开发者模式”，点击出现的“加载未打包的扩展程序”，将路径指向项目中的 `/src` 文件夹。
 6. 现在页面上会出现一个名为“读取电子秤”的 Chrome 应用，点击下面的 `background page` 打开后台网页的控制台，控制台已经提供了相关信息。
 7. 在 Web 服务器中（例如 IIS）打开项目里的 `/external/connect.html` 文件，点击“打印串行端口数据”按钮。

## How it works?

应用会在安装后（不是启动时）检测所有连接至电脑的设备并尝试连接，然后会持续接收来自这些设备的数据，并以换行符（\n）作为分隔符，将整行的数据保存下来；当点击“打印串行端口数据”按钮时，就会将这个数据显示出来。

## TODOs

 + 添加一个方法用于发现并连接至所有设备，而不是目前的仅在安装时才会连接至设备
 + 使用可以双向发送数据的 [Port](https://developer.chrome.com/apps/runtime#method-connect) 进行通信（概念类似于 WebSocket），而不是目前单向的、一次性的 [sendMessage](https://developer.chrome.com/apps/runtime#method-sendMessage)。（概念类似于 XMLHTTPRequest）
 + 电子秤稳定时会不停的发送不变的读数给应用，添加一个检测，当检测到电子秤的读数变化时，就从应用主动发送给网页一个消息。
## 许可

MIT
