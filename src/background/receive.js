const {chrome} = window ,
  {serial} = chrome ,
  decoder = new TextDecoder();

/**
 * 保存所有串口数据
 * @type {SerialPort[]}
 */
const serialPorts = [];

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

    const serialPort = findSerialPortByConnectionId( cId );
    if ( !serialPort ) {
      console.warn( '在接收数据时没有找到对应的串口。' );
      return;
    }

    // 使用 \n 作为数据分隔符
    if ( receiveString.endsWith( '\n' ) ) {
      const newData = (serialPort.buffer + receiveString).trim();

      const {data:oldData} = serialPort;
      if ( newData !== oldData ) {
        serialPort.data = newData;
        onChangeCbs.forEach( f => f( newData , oldData , serialPort ) );
      }

      serialPort.buffer = '';
    } else {
      serialPort.buffer += receiveString;
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
    console.warn( `此连接接收数据时出错：${connectionId}，错误标识符：${info.error}。在 https://crxdoc-zh.appspot.com/apps/serial#event-onReceiveError 查看此错误类型。` );
    console.log( `尝试断开连接${connectionId}...` );
    serial.disconnect( connectionId , ok => console.log( ok ? '断开成功' : '断开失败' ) );

    const serialPort = findSerialPortByConnectionId( connectionId );
    if ( serialPort ) {
      serialPort.error = info.error;
      onErrorCbs.forEach( f => f( serialPort ) );
    } else {
      console.warn( '奇怪,出错的设备连接没有找到对应的串口数据.' );
    }
  }
);

// 浏览器打开时，先尝试连接至所有设备
connectAll();

/**
 * 根据设备路径获取串口对象
 * @param {String} path - 设备路径
 * @returns {SerialPort|null}
 */
function findSerialPortByDevicePath( path ) {
  let serialPort = null;
  serialPorts.some( sp  => {
    if ( sp.device.path === path ) {
      serialPort = sp;
      return true;
    }
  } );
  return serialPort;
}

/**
 * 根据连接 id 获取串口对象
 * @param {Number} id
 * @returns {SerialPort|null}
 */
function findSerialPortByConnectionId( id ) {
  let serialPort = null;
  serialPorts.some( sp  => {
    if ( sp.connection.connectionId === id ) {
      serialPort = sp;
      return true;
    }
  } );
  return serialPort;
}

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
 * @returns {Promise}
 */
function connectAll() {
  return new Promise( resolve => {
    serial.getDevices(
      /**
       * 回调函数
       * @param {Device[]} devices
       */
      devices => {
        console.log( '找到这些设备：' , devices );

        // 尝试连接到所有设备
        Promise.all( devices.map( connect ) ).then( ()=> resolve( getSnapshot() ) );
      } );
  } );
}

/**
 * 连接到单个设备
 * @param {Device} device
 * @returns {Promise}
 */
function connect( device ) {
  return new Promise( resolve => {
    const {path} = device;
    const serialPort = findSerialPortByDevicePath( path );

    if ( serialPort ) {
      if ( serialPort.error ) { // 若上次连接时出错,则重置它的状态
        delete serialPort.error;
        delete serialPort.connection;
        delete serialPort.buffer;
        delete serialPort.data;
      } else {
        console.log( '已连接至此设备,将不会重复连接.' , serialPort );
        resolve( serialPort );
        return;
      }
    }

    const newSerialPort = serialPort || {
        device
      };

    serial.connect( path , {} , connection => {
      const {lastError} = chrome.runtime;
      if ( lastError ) {
        newSerialPort.error = lastError;
        console.warn( '无法连接到此设备:' , newSerialPort );
      } else {
        newSerialPort.connection = connection;
        newSerialPort.data = newSerialPort.buffer = '';
        console.log( '已连接到此设备：' , newSerialPort );
      }
      if ( !serialPort ) {
        serialPorts.push( newSerialPort );
      }
      resolve( newSerialPort );
    } );
  } );
}

/**
 * 获取当前串口的数据快照
 * @returns {SerialPort[]}
 */
function getSnapshot() {
  return serialPorts;
}

const api = {

  getSnapshot ,

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
  }
};

// 给控制台抛出一个句柄
export default window.__api = api;

/**
 * 使用一种数据结构将串口与串口连接关联起来
 * @typedef {Object} SerialPort
 * @property {Device} device
 * @property {chrome.serial.ConnectionInfo} [connection]
 * @property {String} [data] - 串口的可用数据
 * @property {String} [buffer] - 串口的临时 buffer
 *
 * @property {Error} [error] - 如果连接时出错,则为错误对象
 */

/**
 * @see https://crxdoc-zh.appspot.com/apps/serial#method-getDevices
 * @typedef {Object} Device
 * @property {String} path - 设备的系统路径，应该传递给 chrome.serial.connect 的 path 参数，以便连接到该设备。
 * @property {Number} [vendorId] - PCI 或 USB 制造商标识符（如果可以从底层设备获取）。
 * @property {Number} [productId] - USB 产品标识符（如果可以从底层设备获取）。
 * @property {String} [displayName] - 底层设备的可读显示名称（如果可以从宿主设备获取）。
 */
