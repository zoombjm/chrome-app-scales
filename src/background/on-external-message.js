import SerialPool from './serial';
import HIDPool from './hid';
import {Server} from 'connect.io';

const server = new Server();
const hidPool = new HIDPool();
const serialPool = new SerialPool();

/**
 * 每当串口数据发生变化时都传给客户端
 */
serialPool.on( 'data change' , ( newData , oldData , serialDevice )=> {
  server.send( 'serial - data change' , {
    newData ,
    oldData ,
    serialDevice
  } );
} );

/**
 * 当串口设备连接出错时也发送给客户端
 */
serialPool.on( 'error' , serialDevice => {
  server.send( 'serial - error' , serialDevice );
} );

server.on( 'connect' , client => {
  console.log( '收到客户端连接：' , client );

  // todo 可能要给 connect.io 加一个命名空间功能

  client.send( 'serial - devices' , serialPool.devices );

  client.on( 'serial - reconnect' , ( data , resolve , reject )=> {
    console.log( '收到客户端的重新连接请求：' , data );
    client.connectAll().then( ()=> {
      client.send( 'serial - devices' , serialPool.devices );
      resolve();
    } , e => {
      reject( e );
    } );
  } );
} );
