import Vue from 'vue';

import template from './template.html';

const port = chrome.runtime.connect( { name : 'app' } );

const app = new Vue( {
  el : 'body' ,
  replace : false ,
  template ,
  data : {
    devices : null
  } ,
  created() {

  }
} );
