import api from './receive';
import hidPool from './hid';
import {Server} from 'connect.io';

const server = new Server();

/**
 * 每当数据发生变化时都传给客户端
 */
api.onChange( ( newData , oldData , serialPort )=> {
  server.send( 'data change' , {
    newData ,
    oldData ,
    serialPort
  } );
} );

/**
 * 当连接出错时也发送给客户端
 */
api.onError( serialPort => {
  server.send( 'connection error' , serialPort );
} );

server.on( 'connect' , connection => {
  console.log( '收到客户端连接：' , connection );

  connection.send( 'serial ports' , api.getSnapshot() );

  connection.on( 'reconnect' , ( data , resolve , reject )=> {
    console.log( '收到客户端的重新连接请求：' , data );
    api.connectAll().then( ()=> {
      server.send( 'serial ports' , api.getSnapshot() );
      resolve();
    } , e => {
      reject( e );
    } );
  } );
} );
