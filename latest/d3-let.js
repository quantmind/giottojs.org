// https://github.com/quantmind/d3-let Version 0.2.3. Copyright 2016 Luca Sbardella.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

var ostring = Object.prototype.toString;
var inBrowser = typeof window !== 'undefined' && ostring.call(window) !== '[object Object]';

var logger = inBrowser ? window.console : require('console');

// From https://github.com/sindresorhus/object-assign
// The MIT License (MIT)
//
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

var assign = assign$1();

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

function assign$1() {
	return shouldUseNative() ? Object.assign : function (target) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (Object.getOwnPropertySymbols) {
				symbols = Object.getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};
}

// Simulate a WeekMap for now
var self = {
    get: function get(obj) {
        return obj._self;
    },
    set: function set(obj, value) {
        obj._self = value;
    }
};

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

var version = "0.2.3";

exports.inBrowser = inBrowser;
exports.logger = logger;
exports.assign = assign;
exports.self = self;
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
