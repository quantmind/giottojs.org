// d3-view v1.4.1 Copyright 2018 quantmind.com
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
(function (d3) {
var dependencies = {
    "handlebars": {
        "version": "4.0",
        "main": "dist/handlebars.min.js"
    },
    "commander": {
        "version": "2.15",
        "main": "index"
    },
    "d3-ease": {
        "version": "1.0",
        "main": "build/d3-ease.js"
    },
    "d3-transition": {
        "version": "1.1",
        "main": "build/d3-transition.js"
    },
    "d3-view": {
        "version": "1.4",
        "main": "build/d3-view.js"
    },
    "express": {
        "version": "4.16",
        "main": ""
    },
    "feed": {
        "version": "1.1",
        "main": "lib/feed.js"
    },
    "fs-extra": {
        "version": "5.0",
        "main": "lib/index.js"
    },
    "glob": {
        "version": "7.1",
        "main": "glob.js"
    },
    "highlightjs": {
        "version": "9.10",
        "main": "highlight.pack.js"
    },
    "immutable": {
        "version": "3.8",
        "main": "dist/immutable.js"
    },
    "jsdom": {
        "version": "11.6",
        "main": "lib/api.js"
    },
    "livereload": {
        "version": "0.7",
        "main": "lib/livereload.js"
    },
    "mime-types": {
        "version": "2.1",
        "main": ""
    },
    "morgan": {
        "version": "1.9",
        "main": ""
    },
    "sitemap": {
        "version": "1.13",
        "main": "index"
    },
    "tcp-port-used": {
        "version": "0.1",
        "main": "index.js"
    },
    "d3-color": {
        "version": "1",
        "main": "build/d3-color.js"
    },
    "d3-dispatch": {
        "version": "1",
        "main": "build/d3-dispatch.js"
    },
    "d3-interpolate": {
        "version": "1",
        "main": "build/d3-interpolate.js"
    },
    "d3-timer": {
        "version": "1",
        "main": "build/d3-timer.js"
    },
    "d3-let": {
        "version": "0.4",
        "main": "build/d3-let.js"
    },
    "d3-selection": {
        "version": "1.3",
        "main": "dist/d3-selection.js"
    }
};
Object.keys(dependencies).forEach(function (name) {
    d3.libs.set(name, dependencies[name]);
})
}(this.d3));
window.d3.require('/static/d3-fluid-app.js').then(d3 => {
    d3.start();
});
