const {chrome} = window ,
  {serial} = chrome ,
  decoder = new TextDecoder();

const data = {}; // 用于保存每个连接的可用数据
const buffers = {}; // 用于接收 buffer 的临时数据

serial.getDevices( ports => {
  console.log( '获取到所有可连接的设备：' , ports );

  // 尝试连接到所有设备
  ports.forEach( port => {
    serial.connect( port.path , {} , connectionInfo => {
      const {lastError} = chrome.runtime;
      if ( lastError ) {
        console.log( '连接到设备时出错：' , port );
        console.error( lastError );
      } else {
        console.log( '连接到设备：' , port );
        console.log( '连接信息：' , connectionInfo );
        const cId = connectionInfo.connectionId;
        data[ cId ] = buffers[ cId ] = '';
      }
    } );
  } );
} );

// 只有先连接到设备后，这里才会收到设备传送过来的数据
serial.onReceive.addListener( info => {
  const cId = info.connectionId;
  const receiveString = arrayBufferToString( info.data );

  // 使用 \n 作为数据分隔符
  if ( receiveString[ receiveString.length - 1 ] === '\n' ) {
    let buffer = buffers[ cId ];
    buffer += receiveString;
    data[ cId ] = buffer.trim();
    buffers[ cId ] = '';
  } else {
    buffers[ cId ] += receiveString;
  }
} );

/**
 * 将 ArrayBuffer 转换为 String
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/decode
 * @param {ArrayBuffer} arrayBuffer
 * @returns {string}
 */
function arrayBufferToString( arrayBuffer ) {
  return decoder.decode( arrayBuffer );
}

const exports = {

  /**
   * 获取当前接收到的数据快照
   * @returns {{}}
   */
  snapshot() {
    return data;
  }
};

export default window.__api = exports;

