// d3-view Version 1.1.3. Copyright 2017 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

var queue = [];
var map = queue.map;
var some = queue.some;
var hasOwnProperty = queue.hasOwnProperty;





function requireFrom(resolver) {
  var modules = new Map(),
      require = requireRelative(null);

  function requireRelative(base) {
    return function (name) {
      var url = resolver(name + "", base),
          module = modules.get(url);
      if (!module) modules.set(url, module = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.onload = function () {
          try {
            resolve(queue.pop()(requireRelative(url.replace(/\/[^/]*$/, "/"))));
          } catch (error) {
            reject(new Error("invalid module"));
          }
          script.remove();
        };
        script.onerror = function () {
          reject(new Error("unable to load module"));
          script.remove();
        };
        script.async = true;
        script.src = url;
        window.define = define;
        document.head.appendChild(script);
      }));
      return module;
    };
  }

  return function (name) {
    return arguments.length > 1 ? Promise.all(map.call(arguments, require)).then(merge) : require(name);
  };
}

function merge(modules) {
  var o = {},
      i = -1,
      n = modules.length,
      m,
      k;
  while (++i < n) {
    for (k in m = modules[i]) {
      if (hasOwnProperty.call(m, k)) {
        if (m[k] == null) Object.defineProperty(o, k, { get: getter(m, k) });else o[k] = m[k];
      }
    }
  }
  return o;
}

function getter(object, name) {
  return function () {
    return object[name];
  };
}

function isexports(name) {
  return name + "" === "exports";
}

function define(name, dependencies, factory) {
  if (arguments.length < 3) factory = dependencies, dependencies = name;
  if (arguments.length < 2) factory = dependencies, dependencies = [];
  queue.push(some.call(dependencies, isexports) ? function (require) {
    var exports = {};
    return Promise.all(map.call(dependencies, function (name) {
      return isexports(name += "") ? exports : require(name);
    })).then(function (dependencies) {
      factory.apply(null, dependencies);
      return exports;
    });
  } : function (require) {
    return Promise.all(map.call(dependencies, require)).then(function (dependencies) {
      return typeof factory === "function" ? factory.apply(null, dependencies) : factory;
    });
  });
}

define.amd = {};

var isAbsolute = new RegExp('^([a-z]+://|//)');
var isRelative = new RegExp('^[.]{0,2}/');
var libs = new Map();

var viewRequire = requireWithLibs();



function viewResolve(name, options) {
    var dist = libs.get(name),
        main = name,
        path = null,
        base = location;

    if (options) {
        if (typeof options.base === 'string') base = options.base;
        path = removeFrontSlash(options.path);
    }

    if (dist) {
        path = path || dist.main;
        main = removeBackSlash(dist.origin || main);
        if (dist.version) main = name + '@' + dist.version;
        if (path) main = main + '/' + path;
    } else if (path) {
        if (isAbsolute.test(main)) main = new URL(main, base).origin;else if (isRelative.test(main)) main = '';
        main = main + '/' + path;
    }

    if (isAbsolute.test(main)) {
        return main;
    } else if (isRelative.test(main)) {
        return new URL(main, base).href;
    } else {
        if (!main.length || /^[\s._]/.test(main) || /\s$/.test(main)) throw new Error("illegal name");
        return "https://unpkg.com/" + main;
    }
}

function requireWithLibs() {
    var r = requireFrom(viewResolve);
    r.libs = libs;
    return r;
}

function removeFrontSlash(path) {
    if (typeof path === 'string' && path.substring(0, 1) === '/') path = path.substring(1);
    return path;
}

function removeBackSlash(path) {
    if (typeof path === 'string' && path.substring(path.length - 1) === '/') path = path.substring(0, path.substring);
    return path;
}

exports.require = viewRequire;
exports.resolve = viewResolve;

Object.defineProperty(exports, '__esModule', { value: true });

})));
