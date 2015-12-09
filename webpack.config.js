module.exports = {
  entry : './src/index' ,
  output : {
    path : './src/bundle' ,
    filename : 'app.js'
  } ,
  module : {
    loaders : [
      {
        test : /\.js$/ ,

        // 有些模块我使用了源码而非编译好的代码，所以这些模块也要用 babel 转换一下。
        // 在下面的括号中使用竖线 | 分隔开要使用 babel 处理的 npm 包名
        //exclude : /node_modules(?!(\/|\\?\\)(vue-strap)\1)/ ,
        exclude : /node_modules/ ,
        loader : 'babel' ,
        query : {
          presets : [ 'es2015' , 'stage-3' ] ,
          plugins : [ 'transform-runtime' ]
        }
      } ,
      {
        test : /\.html$/ ,
        loader : 'vue-html'
      }
    ]
  } ,
  watch : true ,
  devtool : '#source-map'
};
