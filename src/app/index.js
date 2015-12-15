import Client from 'connect.io-client';
import Vue from 'vue';
import template from './template.html';

const app = new Vue( {
  el : 'body' ,
  replace : false ,
  template ,
  data : {
    ports : [] ,
    connecting : false
  } ,
  methods : {
    reload() {
      this.connecting = true;
      this._client.emit( 'reconnect' , ()=> {
        console.log( '重新连接至串口完毕' );
        this.connecting = false;
      } );
    }
  } ,
  created() {
    const client = this._client = new Client();

    client.on( 'serial ports' , ports => {
      console.log( '收到服务端发送过来的串口列表：' , ports );
      this.ports = ports;
    } );

    client.on( 'connection error' , serialPort => {
      console.log( '收到服务端发送过来的串口错误事件：' , serialPort );
      const {path} = serialPort.device;
      this.ports.some( ( sp , i , a ) => {
        if ( sp.device.path === path ) {
          a.splice( i , 1 , serialPort ); // 这里不能用 sp.error = data.error，否则模板没反应
          return true;
        }
      } );
    } );

    client.on( 'data change' , data => {
      console.log( '收到服务端发送过来的串口数据变化事件：' , data );
      const sp = findSerialPortByDevicePath( data.serialPort.device.path );
      if ( sp ) {
        sp.data = data.newData;
      }
    } );
  }
} );

/**
 * 根据设备路径获取串口对象
 * @param {String} path - 设备路径
 * @returns {SerialPort|null}
 */
function findSerialPortByDevicePath( path ) {
  let serialPort = null;
  app.ports.some( sp  => {
    if ( sp.device.path === path ) {
      serialPort = sp;
      return true;
    }
  } );
  return serialPort;
}
