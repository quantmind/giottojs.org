// d3-view Version 1.0.1. Copyright 2017 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

var queue = [];
var map = queue.map;
var some = queue.some;
var hasOwnProperty = queue.hasOwnProperty;



function requireFrom(source) {
  var modules = new Map;

  function require(name) {
    var url = source(name + ""), module = modules.get(url);
    if (!module) modules.set(url, module = new Promise(function(resolve, reject) {
      var script = document.createElement("script");
      script.onload = function() {
        if (queue.length !== 1) return reject(new Error("invalid module"));
        resolve(queue.pop()(require));
      };
      script.onerror = function() {
        reject(new Error("unable to load module"));
      };
      script.async = true;
      script.src = url;
      window.define = define;
      document.head.appendChild(script);
    }));
    return module;
  }

  return function(name) {
    return arguments.length > 1 ? Promise.all(map.call(arguments, require)).then(merge) : require(name);
  };
}

function merge(modules) {
  var o = {}, i = -1, n = modules.length, m, k;
  while (++i < n) {
    for (k in (m = modules[i])) {
      if (hasOwnProperty.call(m, k)) {
        if (m[k] == null) Object.defineProperty(o, k, {get: getter(m, k)});
        else o[k] = m[k];
      }
    }
  }
  return o;
}

function getter(object, name) {
  return function() { return object[name]; };
}

function isexports(name) {
  return (name + "") === "exports";
}

function define(name, dependencies, factory) {
  if (arguments.length < 3) factory = dependencies, dependencies = name;
  if (arguments.length < 2) factory = dependencies, dependencies = [];
  queue.push(some.call(dependencies, isexports) ? function(require) {
    var exports = {};
    return Promise.all(map.call(dependencies, function(name) {
      return isexports(name += "") ? exports : require(name);
    })).then(function(dependencies) {
      factory.apply(null, dependencies);
      return exports;
    });
  } : function(require) {
    return Promise.all(map.call(dependencies, require)).then(function(dependencies) {
      return typeof factory === "function" ? factory.apply(null, dependencies) : factory;
    });
  });
}

define.amd = {};

var isAbsolute = new RegExp('^([a-z]+://|//)');
var libs = new Map;


function urlIsAbsolute (url) {
    return typeof url === 'string' && isAbsolute.test(url);
}

var require = requireFrom(function (name) {
    var nameUrl = libs.get(name) || name;
    if (nameUrl.local) return nameUrl.url;
    else if (urlIsAbsolute(nameUrl)) return nameUrl;
    return 'https://unpkg.com/' + nameUrl;
});

require.libs = libs;
require.local = function (name, url) {
    libs.set(name, {
        local: true,
        url: url
    });
};

exports.require = require;
exports.requireFrom = requireFrom;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=d3-require.js.map
(function (require) {
var dependencies = '{"d3-array":"1.2","d3-collection":"1.0","d3-color":"1.0","d3-dispatch":"1.0","d3-dsv":"1.0","d3-format":"1.2","d3-let":"0.3","d3-selection":"1.1","d3-time":"1.0","d3-time-format":"2.1","d3-timer":"1.0","d3-transition":"1.1","d3-view":"1.0.1","d3-ease":"1","d3-interpolate":"1","d3-drag":"1","d3-random":"1.1","d3-path":"1","d3-scale":"1.0.3"}';
Object.keys(dependencies).forEach(function (name) {
    require.libs.set(name, name + '@' + dependencies[name]);
})
}(this.d3.require));
