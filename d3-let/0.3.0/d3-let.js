// https://github.com/quantmind/d3-let Version 0.3.0. Copyright 2017 Luca Sbardella.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

var ostring = Object.prototype.toString;
var inBrowser = typeof window !== 'undefined' && ostring.call(window) !== '[object Object]';

var logger = inBrowser ? window.console : require('console');

function isObject(value) {
    return ostring.call(value) === '[object Object]';
}

function isString(value) {
    return ostring.call(value) === '[object String]';
}

function isFunction(value) {
    return ostring.call(value) === '[object Function]';
}

function isArray(value) {
    return ostring.call(value) === '[object Array]';
}

function isDate(value) {
    return ostring.call(value) === '[object Date]';
}

function isNumber(value) {
    return ostring.call(value) === '[object Number]';
}

function isPromise(value) {
    return ostring.call(value) === '[object Promise]';
}

var pop = function (obj, prop) {
    var value = void 0;
    if (isObject(obj)) {
        value = obj[prop];
        delete obj[prop];
        return value;
    } else if (isArray(obj)) {
        var index = +prop;
        if (index === index) return obj.splice(index, 1)[0];
        value = obj[prop];
        delete obj[prop];
        return value;
    }
};

var prefix = "$";

function Map() {
    this._array = [];
}

Map.prototype = map.prototype = {
    constructor: Map,

    size: function size() {
        return this._array.length;
    },
    get: function get(key) {
        return this[prefix + key];
    },
    set: function set(key, value) {
        if (!this.has(key)) this._array.push(key);
        this[prefix + key] = value;
        return this;
    },
    has: function has(key) {
        return prefix + key in this;
    },
    clear: function clear() {
        var self = this;
        this.each(function (_, property) {
            delete self[prefix + property];
        });
        this._array.splice(0);
    },
    keys: function keys() {
        var entries = [];
        this.each(function (_, key) {
            entries.push(key);
        });
        return entries;
    },
    values: function values() {
        var entries = [];
        this.each(function (v) {
            entries.push(v);
        });
        return entries;
    },
    each: function each(callback) {
        var a = this._array,
            key;
        for (var i = 0; i < a.length; ++i) {
            key = a[i];
            callback(this.get(key), key, i);
        }
    }
};

function map(object, f) {
    var map = new Map();

    // Copy constructor.
    if (object instanceof Map) object.each(function (value, key) {
        map.set(key, value);
    });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
            var i = -1,
                n = object.length,
                o;
            if (f == null) while (++i < n) {
                map.set(i, object[i]);
            } else while (++i < n) {
                map.set(f(o = object[i], i, object), o);
            }
        }

        // Convert object to map.
        else if (object) for (var key in object) {
                map.set(key, object[key]);
            }return map;
}

var version = "0.3.0";

exports.inBrowser = inBrowser;
exports.logger = logger;
exports.pop = pop;
exports.isObject = isObject;
exports.isString = isString;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.isDate = isDate;
exports.isNumber = isNumber;
exports.isPromise = isPromise;
exports.orderedMap = map;
exports.letVersion = version;

Object.defineProperty(exports, '__esModule', { value: true });

})));
