import {Client} from 'connect.io';
import Vue from 'vue';
import template from './template.html';

const app = new Vue( {
  el : 'body' ,
  replace : false ,
  template ,
  data : {
    ports : [] ,
    connecting : false ,
    usbDevices : []
  } ,
  methods : {
    reload() {
      this.connecting = true;
      this._client.send( 'serial - reconnect' , true ).then( ()=> {
        console.log( '重新连接至串口完毕' );
        this.connecting = false;
      } );
    } ,

    /**
     * 列出用户选择的 USB 设备的信息
     */
    chooseUSB() {
      chrome.usb.getUserSelectedDevices( { multiple : true } , ( selected_devices )=> {
        if ( Array.isArray( selected_devices ) ) {
          this.usbDevices = selected_devices;
        }
      } );
    }
  } ,
  created() {
    const client = this._client = new Client();

    client.on( 'serial - devices' , ports => {
      console.log( '收到服务端发送过来的串口列表：' , ports );
      this.ports = ports;
    } );

    client.on( 'serial - error' , serialPort => {
      console.log( '收到服务端发送过来的串口错误事件：' , serialPort );
      const {path} = serialPort.info;
      this.ports.some( ( sp , i , a ) => {
        if ( sp.info.path === path ) {
          a.splice( i , 1 , serialPort ); // 这里不能用 sp.error = data.error，否则模板没反应
          return true;
        }
      } );
    } );

    client.on( 'serial - data change' , data => {
      console.log( '收到服务端发送过来的串口数据变化事件：' , data );
      const sp = findSerialPortByDevicePath( data.serialPort.info.path );
      if ( sp ) {
        sp.data = data.newData;
      }
    } );
  }
} );

/**
 * 根据设备路径获取串口对象
 * @param {String} path - 设备路径
 * @returns {SerialDevice|null}
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
