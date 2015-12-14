import api from './receive';

chrome.runtime.onConnectExternal.addListener( onConnect );
chrome.runtime.onConnect.addListener( onConnect );

/**
 * 用一个数组将所有连接都保存起来，用于群发数据
 * @type {chrome.runtime.Port[]}
 */
const ports = [];

/**
 * 每当数据发生变化时都传给客户端
 */
api.onChange( ( newData , oldData , serialPort )=> {
  ports.forEach( port => {
    port.postMessage( {
      type : 'data change' ,
      data : {
        newData ,
        oldData ,
        serialPort
      }
    } );
  } );
} );

/**
 * 当连接出错时也发送给客户端
 */
api.onError( serialPort => {
  ports.forEach( port => {
    port.postMessage( {
      type : 'connection error' ,
      data : serialPort
    } );
  } );
} );

/**
 * 处理从网页到应用内的连接。
 *
 * 网页连接至应用内：
 *   const port = chrome.runtime.connect('这里填写应用的 ID',{name:'随便一个名字'});
 *
 * 网页传递消息给应用：
 *   port.postMessage({ action:'这里是命令名称', data:'这里是任意数据' });
 *
 * 网页获取应用对消息的处理结果：
 *   port.onMessage.addListener( msg => {
 *     if( msg.response === '这里是命令名称' ) {
 *       console.log( '方法返回的结果：' , msg.data);
 *     }
 *   });
 *
 * 网页接收来自应用的消息：
 *  port.onMessage.addListener( msg => {
 *   if( msg.type === '这里是应用发送的消息' ) {
 *     console.log( '应用传递的结果：' , msg.data);
 *   }
 * });
 *
 * @param {chrome.runtime.Port} port
 */
function onConnect( port ) {
  console.log( '收到连接请求，连接方：' , port );

  ports.push( port );

  port.onMessage.addListener(
    /**
     * 接收到消息的处理函数
     * @param msg
     * @param {String} msg.action - 客户端命令
     */
    async msg => {
      const {action} = msg ,
        response = {
          response : action
        };

      console.log( '收到外部发送过来的消息，发送方：' , port );
      console.log( '收到的消息是：' , msg );

      switch ( action ) {

        // 获取当前所有设备的数据快照
        // data 是一个 hash map，格式为 { 应用到设备的连接 ID : 设备最后可用的数据 }
        case 'get ports':
          response.data = api.getSnapshot();
          break;

        // 通知应用重新连接至所有设备。
        // 应用无法检测到新设备接入了，所以此时需要手动连接
        case 'connect':
          try {
            response.data = await api.connectAll();
          }
          catch ( e ) {
            response.error = e;
          }
          response.response = 'get ports';
          break;

        default:
          response.error = new Error( '不支持命令：' , action );
          break;
      }

      console.log( '返回的数据为：' , response.data );
      port.postMessage( response );
    } );

  port.onDisconnect.addListener(
    /**
     * 当连接断开时的处理函数
     */
    ()=> {
      console.log( '此连接断开了：' , port );
      ports.splice( ports.indexOf( port ) , 1 );
    } );

}
