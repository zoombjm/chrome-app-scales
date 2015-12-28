// fork from https://github.com/tfoxy/chrome-promise/blob/master/chrome-promise.js

const chromePromise = {};

export default chromePromise;

fillProperties( chrome , chromePromise );

function setPromiseFunction( fn , thisArg ) {

  return function () {
    var args = arguments;

    return new Promise( function ( resolve , reject ) {
      function callback() {
        var err = chrome.runtime.lastError;
        if ( err ) {
          reject( err );
        } else {
          if ( arguments.length <= 1 ) {
            resolve( arguments[ 0 ] );
          } else {
            resolve( arguments );
          }
        }
      }

      Array.prototype.push.call( args , callback );

      fn.apply( thisArg , args );
    } );

  };

}

function fillProperties( source , target ) {
  for ( var key in source ) {
    if ( Object.prototype.hasOwnProperty.call( source , key ) ) {
      var val = source[ key ];
      var type = typeof val;

      if ( type === 'object' ) {
        target[ key ] = {};
        fillProperties( val , target[ key ] );
      } else if ( type === 'function' ) {
        target[ key ] = setPromiseFunction( val , source );
      } else {
        target[ key ] = val;
      }
    }
  }
}
