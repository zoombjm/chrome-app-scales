import 'babel-polyfill';
import Vue from 'vue';
import template from './template.html';

const port = chrome.runtime.connect( { name : 'app' } );

const app = new Vue( {
  el : 'body' ,
  replace : false ,
  template ,
  data : {
    ports : []
  } ,
  methods : {
    reload() {
      port.postMessage( {
        action : 'connect'
      } );
    }
  } ,
  created() {
    port.onMessage.addListener(
      /**
       * 这个回调函数处理应用回应客户端传递的消息
       * @param {Message} msg
       */
      msg => {
        const {data} = msg;
        switch ( msg.response ) {
          case 'get ports':
            console.log( '收到端口对象' , data );
            this.ports = data;
            break;
        }
      } );

    port.onMessage.addListener(
      /**
       * 这个回调函数处理由应用主动推送过来的消息
       * @param {Message} msg
       */
      msg => {
        const {data} = msg;
        switch ( msg.type ) {
          case 'data change':
            const sp = findSerialPortByDevicePath( data.serialPort.device.path );
            if ( sp ) {
              sp.data = data.newData;
            }
            break;
          case 'connection error':
            const {path} = data.device;
            this.ports.some( ( sp , i , a ) => {
              if ( sp.device.path === path ) {
                a.splice( i , 1 , data );
                return true;
              }
            } );
            break;
        }
      } );

    port.postMessage( {
      action : 'get ports'
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
