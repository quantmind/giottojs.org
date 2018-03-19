// d3-view v1.4.0 Copyright 2018 quantmind.com
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

    var isAbsolute = new RegExp('^([a-z]+://|//)'),
        isRelative = new RegExp('^[.]{0,2}/'),
        hasOwnProperty = Array.prototype.hasOwnProperty;

    var viewLibs = new Map();

    var viewResolve = function viewResolve(name, options) {
        var dist = viewLibs.get(name),
            main = name,
            path = null,
            base = typeof location !== 'undefined' ? location : '';

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
    };

    var viewRequireFrom = function viewRequireFrom(resolver, root) {
        var modules = new Map(),
            queue = [],
            map = queue.map,
            some = queue.some,
            getRoot = function getRoot() {
            return !root && typeof window !== 'undefined' ? window : root;
        },
            requireRelative = function requireRelative(base) {
            return function (name) {
                var url = resolver(name + "", base),
                    module = modules.get(url);
                if (!module) modules.set(url, module = new Promise(function (resolve, reject) {
                    root = getRoot();
                    var script = root.document.createElement("script");
                    script.onload = function () {
                        try {
                            resolve(queue.pop()(requireRelative(url)));
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
                    root.define = define;
                    root.document.head.appendChild(script);
                }));
                return module;
            };
        },
            requireOne = requireRelative(null);

        function require(name) {
            return arguments.length > 1 ? Promise.all(map.call(arguments, requireOne)).then(merge) : requireOne(name);
        }

        require.root = getRoot;

        define.amd = {};

        return require;

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
    };

    var viewRequire = viewRequireFrom(viewResolve);

    // INTERNALS

    var isexports = function isexports(name) {
        return name + "" === "exports";
    };

    var removeFrontSlash = function removeFrontSlash(path) {
        if (typeof path === 'string' && path.substring(0, 1) === '/') path = path.substring(1);
        return path;
    };

    var removeBackSlash = function removeBackSlash(path) {
        if (typeof path === 'string' && path.substring(path.length - 1) === '/') path = path.substring(0, path.substring);
        return path;
    };

    var merge = function merge(modules) {
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
    };

    var getter = function getter(object, name) {
        return function () {
            return object[name];
        };
    };

    exports.require = viewRequire;
    exports.libs = viewLibs;
    exports.resolve = viewResolve;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
