import api from './receive';

chrome.runtime.onMessageExternal.addListener( onExternalMsg );

/**
 * 供普通网页调用的 api 接口。
 * @param obj - 传过来的消息格式
 * @param {String} obj.method - 要调用的方法名
 * @param {Array} [obj.args] - 要传给调用方法的参数
 * @param sender
 * @param {String} sender.url - 发送此消息的网页的网址
 * @param {Function} sendResponse
 * @returns {boolean}
 */
function onExternalMsg( obj , sender , sendResponse ) {
  console.log( '收到外部消息，发送方：' , sender );
  console.log( '消息：' , obj );

  const method = api[ obj.method ];
  if ( method ) {
    try {
      let {args} = obj;
      if ( !Array.isArray( args ) ) {
        args = [ args ];
      }
      const val = method.apply( null , args );
      if ( 'function' === typeof val.then ) { // 如果方法返回的是 Promise
        val.then(
          v => sendResponse( {
            error : null ,
            data : v
          } ) ,
          e => sendResponse( {
            error : e ,
            data : null
          } )
        );
      } else {
        sendResponse( {
          error : null ,
          data : val
        } );
      }
    }
    catch ( e ) {
      sendResponse( {
        error : e ,
        data : null
      } );
    }
  } else {
    sendResponse( {
      error : new Error( `调用了不存在的方法：${obj.method}` ) ,
      data : null
    } );
  }
  return true;
}
