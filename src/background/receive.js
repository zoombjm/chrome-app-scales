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

serial.onReceive.addListener(
  /**
   * 数据会源源不断的传送过来。只有先连接到设备后，这里才会收到设备传送过来的数据。
   * @see https://crxdoc-zh.appspot.com/apps/serial#event-onReceive
   * @param {Object} info
   * @param {Number} info.connectionId - 连接标识符
   * @param {ArrayBuffer} info.data - 接收到的数据
   */
  info => {
    const cId = info.connectionId;
    const receiveString = arrayBufferToString( info.data );

    // 使用 \n 作为数据分隔符
    if ( receiveString.endsWith( '\n' ) ) {
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

/**
 * 当接收数据出错时，会执行数组里的函数
 * @type {Function[]}
 */
const onErrorCbs = [];

serial.onReceiveError.addListener(
  /**
   * 接收设备数据产生错误时的回调函数。产生错误后连接会被暂停，但是它没有提供重新连接的方法，所以直接断开掉。
   * @see https://crxdoc-zh.appspot.com/apps/serial#event-onReceiveError
   * @param {Object} info
   * @param {Number} info.connectionId - 连接标识符
   * @param {String} info.error - 连接标识符，值可能是：
   *                            - "disconnected" 连接已断开
   *                            - "timeout" 经过 receiveTimeout 毫秒后仍然未接收到数据。
   *                            - "device_lost" 设备可能已经从主机断开。
   *                            - "system_error" 发生系统错误，连接可能无法恢复。
   */
  info => {
    const {connectionId} = info;
    console.error( `此连接接收数据时出错：${connectionId}，错误标识符：${info.error}。在 https://crxdoc-zh.appspot.com/apps/serial#event-onReceiveError 查看此错误类型。` );
    console.log( `尝试断开连接${connectionId}...` );
    serial.disconnect( connectionId , ok => console.log( ok ? '断开成功' : '断开失败' ) );
    delete data[ connectionId ];
    delete buffers[ connectionId ];
    onErrorCbs.forEach( f => f( info ) );
  }
);

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
      if ( lastError ) { // todo 判断错误是否是因为应用已连接至设备导致的。这种情况不应该被视为一个错误。
        console.log( '连接到此设备时出错：' , device );
        console.error( lastError );
        console.log( '通常情况下，这是因为应用已经连接至该设备导致的。' );
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
   * @return {Function} - 一个删除此监听函数的方法
   */
  onChange( cb ) {
    onChangeCbs.push( cb );
    return ()=> {
      onChangeCbs.splice( onChangeCbs.indexOf( cb ) , 1 );
    };
  } ,

  /**
   * 添加 error 回调函数
   * @param {Function} cb
   * @returns {Function} - 一个删除此监听函数的方法
   */
  onError( cb ) {
    onErrorCbs.push( cb );
    return ()=> {
      onErrorCbs.splice( onErrorCbs.indexOf( cb ) , 1 );
    };
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

// 给控制台抛出一个句柄
export default window.__api = exports;

/**
 * @see https://crxdoc-zh.appspot.com/apps/serial#method-getDevices
 * @typedef {Object} Device
 * @property {String} path - 设备的系统路径，应该传递给 chrome.serial.connect 的 path 参数，以便连接到该设备。
 * @property {Number} [vendorId] - PCI 或 USB 制造商标识符（如果可以从底层设备获取）。
 * @property {Number} [productId] - USB 产品标识符（如果可以从底层设备获取）。
 * @property {String} [displayName] - 底层设备的可读显示名称（如果可以从宿主设备获取）。
 */
