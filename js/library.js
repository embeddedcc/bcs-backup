/*! bcs-backup - v0.1.0 - 2015-09-25 */var saveAs=saveAs||function(a){"use strict";if("undefined"==typeof navigator||!/MSIE [1-9]\./.test(navigator.userAgent)){var b=a.document,c=function(){return a.URL||a.webkitURL||a},d=b.createElementNS("http://www.w3.org/1999/xhtml","a"),e="download"in d,f=function(a){var b=new MouseEvent("click");a.dispatchEvent(b)},g=a.webkitRequestFileSystem,h=a.requestFileSystem||g||a.mozRequestFileSystem,i=function(b){(a.setImmediate||a.setTimeout)(function(){throw b},0)},j="application/octet-stream",k=0,l=500,m=function(b){var d=function(){"string"==typeof b?c().revokeObjectURL(b):b.remove()};a.chrome?d():setTimeout(d,l)},n=function(a,b,c){b=[].concat(b);for(var d=b.length;d--;){var e=a["on"+b[d]];if("function"==typeof e)try{e.call(a,c||a)}catch(f){i(f)}}},o=function(a){return/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type)?new Blob(["\ufeff",a],{type:a.type}):a},p=function(b,i,l){l||(b=o(b));var p,q,r,s=this,t=b.type,u=!1,v=function(){n(s,"writestart progress write writeend".split(" "))},w=function(){if((u||!p)&&(p=c().createObjectURL(b)),q)q.location.href=p;else{var d=a.open(p,"_blank");void 0==d&&"undefined"!=typeof safari&&(a.location.href=p)}s.readyState=s.DONE,v(),m(p)},x=function(a){return function(){return s.readyState!==s.DONE?a.apply(this,arguments):void 0}},y={create:!0,exclusive:!1};return s.readyState=s.INIT,i||(i="download"),e?(p=c().createObjectURL(b),d.href=p,d.download=i,void setTimeout(function(){f(d),v(),m(p),s.readyState=s.DONE})):(a.chrome&&t&&t!==j&&(r=b.slice||b.webkitSlice,b=r.call(b,0,b.size,j),u=!0),g&&"download"!==i&&(i+=".download"),(t===j||g)&&(q=a),h?(k+=b.size,void h(a.TEMPORARY,k,x(function(a){a.root.getDirectory("saved",y,x(function(a){var c=function(){a.getFile(i,y,x(function(a){a.createWriter(x(function(c){c.onwriteend=function(b){q.location.href=a.toURL(),s.readyState=s.DONE,n(s,"writeend",b),m(a)},c.onerror=function(){var a=c.error;a.code!==a.ABORT_ERR&&w()},"writestart progress write abort".split(" ").forEach(function(a){c["on"+a]=s["on"+a]}),c.write(b),s.abort=function(){c.abort(),s.readyState=s.DONE},s.readyState=s.WRITING}),w)}),w)};a.getFile(i,{create:!1},x(function(a){a.remove(),c()}),x(function(a){a.code===a.NOT_FOUND_ERR?c():w()}))}),w)}),w)):void w())},q=p.prototype,r=function(a,b,c){return new p(a,b,c)};return"undefined"!=typeof navigator&&navigator.msSaveOrOpenBlob?function(a,b,c){return c||(a=o(a)),navigator.msSaveOrOpenBlob(a,b||"download")}:(q.abort=function(){var a=this;a.readyState=a.DONE,n(a,"abort")},q.readyState=q.INIT=0,q.WRITING=1,q.DONE=2,q.error=q.onwritestart=q.onprogress=q.onwrite=q.onabort=q.onerror=q.onwriteend=null,r)}}("undefined"!=typeof self&&self||"undefined"!=typeof window&&window||this.content);"undefined"!=typeof module&&module.exports?module.exports.saveAs=saveAs:"undefined"!=typeof define&&null!==define&&null!=define.amd&&define([],function(){return saveAs});