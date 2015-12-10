import api from './receive';

chrome.runtime.onConnectExternal.addListener( onConnect );

const ports = [];

/**
 * 处理从网页到应用内的连接。
 *
 * 网页连接至应用内：
 *   const port = chrome.runtime.connenct('这里填写应用的 ID',{name:'随便一个名字'});
 *
 * 网页调用应用内部方法：
 *   port.postMessage({ method:'这里是方法名称', args:['这里','是参数数组，可选'] });
 *
 * 网页获取内部方法返回的值：
 *   port.onMessage.addListener( msg => {
 *     if( msg.method === '这里是方法名称' ) {
 *       console.log( '方法返回的结果：' , msg.data);
 *     }
 *   });
 *
 * @param {chrome.runtime.Port} port
 */
function onConnect( port ) {
  console.log( '收到外部连接请求，连接方：' , port );

  ports.push( port );

  port.onMessage.addListener( async msg => {
    console.log( '收到外部发送过来的消息，发送方：' , port );
    console.log( '收到的消息是：' , msg );

    // todo 这种通用处理方法并不好，还是一个个显式的将可用的消息列出来吧
    const methodName = msg.method ,
      method = api[ methodName ];

    if ( !method ) { return; }

    let data = null , error = null;

    let {args} = msg;
    if ( !Array.isArray( args ) ) {
      args = [ args ];
    }
    try {
      data = await method.apply( null , args );
    }
    catch ( e ) {
      error = e;
    }
    port.postMessage( {
      data ,
      error ,
      method : methodName
    } );
  } );
}
