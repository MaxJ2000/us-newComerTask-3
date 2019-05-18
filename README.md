# us-newComerTask-3
promise部分参考了npm 库中es6-promise的接口文件

eventemiter很玩具，因为我现在使用的还不是很多，没有完善

musicBox在实现过程中，我用别人现成的网易云api，本地用node.js跑了一个neteaseMusic的接口，通过访问其可以得到对应的歌单，进而得到歌曲链接。

然后我用webpack配置了一个proxy，webpack自建了一个http中间件，跨域的访问可以通过访问同源的对应接口来实现，避免出现跨域问题，用法类似于这样
```
 proxy: {
      "/music": {
        target: "http://m10.music.126.net",
        changeOrigin: true,
        pathRewrite: { "^/music": "" },
        secure: false
      },
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        pathRewrite: { "^/api": ""},
        secure: false
      }
 ``` 
 
在这时我fetch('/api/song/url')时，fetch请求实际上会发送给127.0.0.1:3000/song/url(/api被pathRewrite删除了)，这样就避免了跨域的问题

因为无法跑代码，我就说一下我实现了什么。

播放\暂停

进度条

音量控制(没有添加按钮，但是可以控制)

播放速率

页面上允许存在多个播放器实例（没有开放接口，但是只要new一个就可以实现）

实现一个接口，用以获取歌词

之前因为跨域问题踩了太多坑，耗费了很多时间，所以实时歌词没有实现

我认为不完善的地方：对于getter和setter的用途理解和设计不佳，导致后期代码混乱，需要重构；实时歌词没有完成；

顺便远程提问后端有没有能够自动生成ts接口文件的方法，每次处理接口的返回值的时候都要对着postman写有点痛苦，如果有ts的interface辅助就很舒服了
