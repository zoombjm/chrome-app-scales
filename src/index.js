chrome.app.runtime.onLaunched.addListener( function () {
  chrome.app.window.create( '/index.html' , {
    'bounds' : {
      'width' : 400 ,
      'height' : 500
    }
  } );
} );

chrome.runtime.onMessageExternal.addListener( ( obj , sender , sendResponse )=> {
  console.log( obj );
  console.log( sender );
  sendResponse( {
    hello : '收到了'
  } );
  return true;
} );
