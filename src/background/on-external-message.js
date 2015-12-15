import api from './receive';
import Server from 'connect.io';

const server = new Server();

/**
 * 每当数据发生变化时都传给客户端
 */
api.onChange( ( newData , oldData , serialPort )=> {
  server.emit( 'data change' , {
    newData ,
    oldData ,
    serialPort
  } );
} );

/**
 * 当连接出错时也发送给客户端
 */
api.onError( serialPort => {
  server.emit( 'connection error' , serialPort );
} );

server.on( 'connect' , connection => {
  console.log( '收到客户端连接：' , connection );

  connection.emit( 'serial ports' , api.getSnapshot() );

  connection.on( 'reconnect' , ( data , sendResponse )=> {
    console.log( '收到客户端的重新连接请求：' , data );
    api.connectAll().then( ()=> {
      server.emit( 'serial ports' , api.getSnapshot() );
      sendResponse();
    } , e => {
      sendResponse( e );
    } );
  } );
} );
