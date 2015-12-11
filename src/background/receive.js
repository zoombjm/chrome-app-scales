const {chrome} = window ,
  {serial} = chrome ,
  decoder = new TextDecoder();

const data = {}; // 用于保存每个连接的可用数据
const buffers = {}; // 用于接收 buffer 的临时数据

/**
 * 每当可用数据发生变化后，就执行数组里面的函数
 * @type {Function[]}
 */
const onChangeCbs = [];

// 只有先连接到设备后，这里才会收到设备传送过来的数据
serial.onReceive.addListener( info => {
  const cId = info.connectionId;
  const receiveString = arrayBufferToString( info.data );

  // 使用 \n 作为数据分隔符
  if ( receiveString[ receiveString.length - 1 ] === '\n' ) {
    let buffer = buffers[ cId ];
    buffer += receiveString;

    const newData = buffer.trim();
    const oldData = data[ cId ];
    if ( newData !== oldData ) {
      data[ cId ] = newData;
      onChangeCbs.forEach( f => f( newData , oldData , cId ) );
    }

    buffers[ cId ] = '';
  } else {
    buffers[ cId ] += receiveString;
  }
} );

// 浏览器打开时，先尝试连接至所有设备
connectAll();

/**
 * 将 ArrayBuffer 转换为 String
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/decode
 * @param {ArrayBuffer} arrayBuffer
 * @returns {string}
 */
function arrayBufferToString( arrayBuffer ) {
  return decoder.decode( arrayBuffer );
}

/**
 * 尝试连接到所有可连接的设备。
 * 由于 Chrome 没有将设备与连接关联起来，所以我无从得知获取到的设备是否已经连接过了，可能造成重复连接。
 * @param {Function} [cb] - 每一个连接成功或失败时，都会调用这个回调函数。
 *                          调用格式为 cb( error, connectionInfo, device )。
 *                          error 与 connectionInfo 中必有一个是 null。
 */
function connectAll( cb ) {
  if ( !cb ) {
    cb = ()=> {};
  }
  serial.getDevices(
    /**
     * 回调函数
     * @param {Device[]} devices
     */
    devices => {
      console.log( '获取到所有可连接的设备：' , devices );

      // 尝试连接到所有设备
      devices.forEach( device => connect( device ).then(
        connectionInfo => cb( null , connectionInfo , device ) ,
        error => cb( error , null , device )
      ) );
    } );
}

/**
 * 连接到某个设备
 * @param {Device} device
 * @returns {Promise}
 */
function connect( device ) {
  return new Promise( ( r , j )=> {
    serial.connect( device.path , {} , connectionInfo => {
      const {lastError} = chrome.runtime;
      if ( lastError ) {
        console.log( '连接到此设备时出错：' , device );
        console.error( lastError );
        j( lastError );
      } else {
        console.log( '连接到设备：' , device );
        console.log( '连接信息：' , connectionInfo );
        const cId = connectionInfo.connectionId;
        data[ cId ] = buffers[ cId ] = '';
        r( connectionInfo );
      }
    } );
  } );
}

const exports = {

  /**
   * 获取当前接收到的数据快照
   * @returns {{}}
   */
  getSnapshot() {
    return data;
  } ,

  connectAll ,

  /**
   * 添加 change 回调函数
   * @param {Function} cb
   */
  watch( cb ) {
    onChangeCbs.push( cb );
  } ,

  /**
   * 连接到某个已知的设备路径
   * @param {Device.path} devicePath
   * @returns {Promise}
   */
  connect( devicePath ) {
    return connect( {
      path : devicePath
    } );
  }
};

export default window.__api = exports;

/**
 * @see https://crxdoc-zh.appspot.com/apps/serial#method-getDevices
 * @typedef {Object} Device
 * @property {String} path - 设备的系统路径，应该传递给 chrome.serial.connect 的 path 参数，以便连接到该设备。
 * @property {Number} [vendorId] - PCI 或 USB 制造商标识符（如果可以从底层设备获取）。
 * @property {Number} [productId] - USB 产品标识符（如果可以从底层设备获取）。
 * @property {String} [displayName] - 底层设备的可读显示名称（如果可以从宿主设备获取）。
 */
