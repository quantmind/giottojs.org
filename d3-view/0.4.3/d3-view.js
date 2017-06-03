// d3-view Version 0.4.3. Copyright 2017 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-collection'), require('d3-selection'), require('d3-timer'), require('d3-dispatch')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3-collection', 'd3-selection', 'd3-timer', 'd3-dispatch'], factory) :
	(factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Collection,d3Selection,d3Timer,d3Dispatch) { 'use strict';

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

Map.prototype = map$1.prototype = {
    constructor: Map,

    size: function size() {
        return this._array.length;
    },
    get: function get(key) {
        return this[prefix + key];
    },
    set: function set$$1(key, value) {
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

function map$1(object, f) {
    var map$$1 = new Map();

    // Copy constructor.
    if (object instanceof Map) object.each(function (value, key) {
        map$$1.set(key, value);
    });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
            var i = -1,
                n = object.length,
                o;
            if (f == null) while (++i < n) {
                map$$1.set(i, object[i]);
            } else while (++i < n) {
                map$$1.set(f(o = object[i], i, object), o);
            }
        }

        // Convert object to map.
        else if (object) for (var key in object) {
                map$$1.set(key, object[key]);
            }return map$$1;
}

var providers = {
    logger: logger,
    fetch: fetch(),
    readyCallbacks: []
};

function fetch() {
    if (inBrowser) return window.fetch;
}

var prefix$1 = '[d3-view]';

var warn = function (msg) {
    providers.logger.warn(prefix$1 + ' ' + msg);
};

var properties = ['disabled', 'readonly', 'required'];

//
//  d3-attr-<attr> directive
//  ==============================
//
//  Create a one-way binding between a model and a HTML element attribute
//
var attr = {

    create: function create(expression) {
        if (!this.arg) return warn('Cannot bind to empty attribute. Specify :<attr-name>');
        return expression;
    },

    refresh: function refresh(model, value) {
        if (this.arg === 'class') return this.refreshClass(value);
        if (isArray(value)) return warn('Cannot apply array to attribute ' + this.arg);
        if (properties.indexOf(this.arg) > -1) this.sel.property(this.arg, value || null);else this.sel.attr(this.arg, value);
    },

    refreshClass: function refreshClass(value) {
        var sel = this.sel;

        if (!isArray(value)) value = [value];

        if (this.oldValue) this.oldValue.forEach(function (entry) {
            if (entry) sel.classed(entry, false);
        });

        this.oldValue = value.map(function (entry) {
            var exist = true;
            if (isArray(entry)) {
                exist = entry[1];
                entry = entry[0];
            }
            if (entry) sel.classed(entry, exist);
            return entry;
        });
    }

};

//
//  d3-html
//  =============
//  attach html or text to the innerHtml property
//
//  Usage:
//      <div id="foo" d3-html="output"></div>
var html = {

    refresh: function refresh(model, html) {
        if (isString(html)) this.sel.html(html);
    }
};

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

/* eslint-disable no-unused-vars */

var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

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

var index$1 = shouldUseNative() ? Object.assign : function (target, source) {
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

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};























































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

//
// Evaluate a callback (optional) with given delay (optional)
//
// if delay is not given or 0, the callback is evaluated at the next tick
// of the event loop.
// Calling this method multiple times in the dsame event loop tick produces
// always the initial promise
var debounce = function (callback, delay) {
    var promise = null;

    return function () {
        if (promise !== null) return promise;
        var self = this,
            args = arguments;

        promise = new Promise(function (resolve, reject) {

            d3Timer.timeout(function () {
                promise = null;
                try {
                    resolve(callback ? callback.call.apply(callback, [self].concat(toConsumableArray(args))) : undefined);
                } catch (err) {
                    reject(err);
                }
            }, delay);
        });

        return promise;
    };
};

var base = {

    on: function on(model, attrName) {
        var refresh = refreshFunction(this, model, attrName);

        // DOM => model binding
        d3Selection.select(this.el).on('input', refresh).on('change', refresh);
    }
};

function createTag(proto) {

    function Tag(el) {
        this.el = el;
    }

    Tag.prototype = index$1({}, base, proto);

    function tag(el) {
        var t = new Tag(el);

        Object.defineProperty(t, 'value', {
            get: function get() {
                return d3Selection.select(t.el).property('value');
            },
            set: function set$$1(v) {
                d3Selection.select(t.el).property('value', v);
            }
        });

        return t;
    }

    tag.prototype = Tag.prototype;

    return tag;
}

function refreshFunction(dom, model, attrName) {

    return debounce(function () {
        model.$set(attrName, dom.value);
    });
}

var input = createTag();

var textarea = createTag();

var tags = {
    input: input,
    textarea: textarea
};

//
//  d3-value directive
//  ===================
//
//  Two-way data binding for HTML elements supporting the value property
var value = {

    create: function create(expression) {
        var type = this.sel.attr('type'),
            tag = this.el.tagName.toLowerCase(),
            Tag = tags[type] || tags[tag];

        if (!Tag) return warn('Cannot apply d3-value directive to ' + tag);
        this.tag = new Tag(this.el);
        return expression;
    },

    mount: function mount(model) {
        var expr = this.expression;
        // TODO: relax this constraint
        if (expr.parsed.type !== expr.codes.IDENTIFIER) return warn('d3-value expression support identifiers only, got "' + expr.parsed.type + '": ' + this.expression);
        var attrName = this.expression.expr;
        //
        // Create the model reactive attribute
        model.$set(attrName, this.tag.value);

        this.tag.on(model, attrName);
        return model;
    },

    refresh: function refresh(model, value) {
        this.tag.value = value;
    },

    destroy: function destroy() {
        this.tag.off();
    }
};

//
//  d3-show
//  =============
//  Show or hide an element
//
var show = {

    mount: function mount(model) {
        this.display = this.sel.style('display');
        if (!this.display || this.display === 'none') this.display = 'block';
        return model;
    },

    refresh: function refresh(model, value) {
        if (value) this.sel.style('display', this.display);else this.sel.style('display', 'none');
    }
};

//
//  d3-on directive
var on = {

    mount: function mount(model) {
        var event$$1 = this.arg || 'click',
            expr = this.expression;

        // DOM event => model binding
        this.sel.on(event$$1 + '.' + this.uid, function () {
            expr.eval(model);
        });
    }
};

// No value, it has its own directive
var attributes = ['name', 'class', 'disabled', 'readonly', 'required', 'href'];

var getdirs = function (element, directives) {
    var sel = d3Selection.select(element),
        dirs = sel.directives();
    if (dirs) return dirs;
    dirs = new Directives();

    if (!directives) return dirs;

    for (var i = 0; i < element.attributes.length; ++i) {
        var attr = element.attributes[i],
            bits = attr.name.split('-'),
            arg = bits[2],
            dirName = bits[0] === 'd3' ? bits[1] : null;

        if (dirName) {
            if (!arg && attributes.indexOf(dirName) > -1) {
                arg = dirName;
                dirName = 'attr';
            }
            var directive = directives.get(dirName);
            if (directive) dirs.add(directive(element, attr, arg));else warn(element.tagName + ' cannot find directive "' + dirName + '". Did you forget to register it?');
        }
        dirs.attrs[attr.name] = attr.value;
    }

    if (dirs.size()) sel.directives(dirs);
    return dirs;
};

// Directives container
function Directives() {
    this.attrs = {};
    this.all = [];
}

Directives.prototype = {
    size: function size() {
        return this.all.length;
    },


    pop: function pop$$1(dir) {
        var index = this.all.indexOf(dir);
        if (index > -1) {
            dir.removeAttribute();
            this.all.splice(index, 1);
        }
        return dir;
    },

    add: function add(dir) {
        this.all.push(dir);
    },
    forEach: function forEach(callback) {
        this.all.forEach(callback);
    },
    preMount: function preMount() {
        var dir = void 0;
        for (var i = 0; i < this.all.length; ++i) {
            dir = this.all[i];
            if (dir.preMount()) return this.pop(dir);
        }
    },
    execute: function execute(model) {
        if (!this.size()) return;
        var promises = [];
        var promise = void 0;
        this.forEach(function (d) {
            promise = d.execute(model);
            if (isPromise(promise)) promises.push(promise);
        });
        if (promises.length) return Promise.all(promises);
    }
};

var slice = function (obj) {
    var idx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    return Array.prototype.slice.call(obj, idx);
};

// Extend selection prototype with new methods
d3Selection.selection.prototype.mount = mount;
d3Selection.selection.prototype.view = view;
d3Selection.selection.prototype.model = model;
d3Selection.selection.prototype.directives = directives$1;

function directives$1(value) {
    return arguments.length ? this.property("__d3_directives__", value) : this.node().__d3_directives__;
}

function model() {
    var vm = this.view();
    return vm ? vm.model : null;
}

function view(value) {
    if (arguments.length) {
        return this.property("__d3_view__", value);
    } else {
        var element = this.node(),
            view = element.__d3_view__,
            parent = element.parentNode;

        while (parent && !view) {
            view = parent.__d3_view__;
            parent = parent.parentNode;
        }
        return view;
    }
}

//
// mount function on a d3 selection
// Use this function to mount the selection
// Return nothing or a promise
function mount(data) {
    var promises = [];
    var promise = void 0;
    this.each(function () {
        var view = d3Selection.select(this).view();
        if (view) {
            promise = mountElement(this, view, data);
            if (isPromise(promise)) promises.push(promise);
        }
    });
    if (promises.length) return Promise.all(promises);
}

// mount an element into a given model
function mountElement(element, vm, data) {
    var component = vm.components.get(element.tagName.toLowerCase()),
        directives = getdirs(element, vm.directives),
        preMount = directives.preMount();

    if (preMount) return preMount.execute(vm.model);else {
        var promise = void 0;
        if (component) {
            vm = component({ parent: vm });
            promise = vm.mount(element, data);
        } else {
            var promises = [],
                children = slice(element.children);
            for (var i = 0; i < children.length; ++i) {
                promise = mountElement(children[i], vm, data);
                if (isPromise(promise)) promises.push(promise);
            }
            if (promises.length) promise = Promise.all(promises);
        }

        if (isPromise(promise)) return promise.then(function () {
            return directives.execute(vm.model);
        });else return directives.execute(vm.model);
    }
}

// Code originally from https://github.com/soney/jsep
// Copyright (c) 2013 Stephen Oney, http://jsep.from.so/

// This is the full set of types that any JSEP node can be.
// Store them here to save space when minified
var code = {
    COMPOUND: 'Compound',
    IDENTIFIER: 'Identifier',
    MEMBER_EXP: 'MemberExpression',
    LITERAL: 'Literal',
    THIS_EXP: 'ThisExpression',
    CALL_EXP: 'CallExpression',
    UNARY_EXP: 'UnaryExpression',
    BINARY_EXP: 'BinaryExpression',
    LOGICAL_EXP: 'LogicalExpression',
    CONDITIONAL_EXP: 'ConditionalExpression',
    ARRAY_EXP: 'ArrayExpression'
};

var PERIOD_CODE = 46;
var COMMA_CODE = 44;
var SQUOTE_CODE = 39;
var DQUOTE_CODE = 34;
var OPAREN_CODE = 40;
var CPAREN_CODE = 41;
var OBRACK_CODE = 91;
var CBRACK_CODE = 93;
var QUMARK_CODE = 63;
var SEMCOL_CODE = 59;
var COLON_CODE = 58;
var throwError = function throwError(message, index) {
    var error = new Error(message + ' at character ' + index);
    error.index = index;
    error.description = message;
    throw error;
};
var t = true;
var unary_ops = { '-': t, '!': t, '~': t, '+': t };
var binary_ops = {
    '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
    '==': 6, '!=': 6, '===': 6, '!==': 6,
    '<': 7, '>': 7, '<=': 7, '>=': 7,
    '<<': 8, '>>': 8, '>>>': 8,
    '+': 9, '-': 9,
    '*': 10, '/': 10, '%': 10
};
var getMaxKeyLen = function getMaxKeyLen(obj) {
    var max_len = 0,
        len;
    for (var key in obj) {
        if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
            max_len = len;
        }
    }
    return max_len;
};
var max_unop_len = getMaxKeyLen(unary_ops);
var max_binop_len = getMaxKeyLen(binary_ops);
var literals = {
    'true': true,
    'false': false,
    'null': null
};
var this_str = 'this';
var binaryPrecedence = function binaryPrecedence(op_val) {
    return binary_ops[op_val] || 0;
};
var createBinaryExpression = function createBinaryExpression(operator, left, right) {
    var type = operator === '||' || operator === '&&' ? code.LOGICAL_EXP : code.BINARY_EXP;
    return {
        type: type,
        operator: operator,
        left: left,
        right: right
    };
};
var isDecimalDigit = function isDecimalDigit(ch) {
    return ch >= 48 && ch <= 57; // 0...9
};
var isIdentifierStart = function isIdentifierStart(ch) {
    return ch === 36 || ch === 95 || // `$` and `_`
    ch >= 65 && ch <= 90 || // A...Z
    ch >= 97 && ch <= 122 || // a...z
    ch >= 128 && !binary_ops[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
};
var isIdentifierPart = function isIdentifierPart(ch) {
    return ch === 36 || ch === 95 || // `$` and `_`
    ch >= 65 && ch <= 90 || // A...Z
    ch >= 97 && ch <= 122 || // a...z
    ch >= 48 && ch <= 57 || // 0...9
    ch >= 128 && !binary_ops[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
};
var jsep = function jsep(expr) {
    // `index` stores the character number we are currently at while `length` is a constant
    // All of the gobbles below will modify `index` as we move along
    var index = 0,
        charAtFunc = expr.charAt,
        charCodeAtFunc = expr.charCodeAt,
        exprI = function exprI(i) {
        return charAtFunc.call(expr, i);
    },
        exprICode = function exprICode(i) {
        return charCodeAtFunc.call(expr, i);
    },
        length = expr.length,


    // Push `index` up to the next non-space character
    gobbleSpaces = function gobbleSpaces() {
        var ch = exprICode(index);
        // space or tab
        while (ch === 32 || ch === 9) {
            ch = exprICode(++index);
        }
    },


    // The main parsing function. Much of this code is dedicated to ternary expressions
    gobbleExpression = function gobbleExpression() {
        var test = gobbleBinaryExpression(),
            consequent,
            alternate;
        gobbleSpaces();
        if (exprICode(index) === QUMARK_CODE) {
            // Ternary expression: test ? consequent : alternate
            index++;
            consequent = gobbleExpression();
            if (!consequent) {
                throwError('Expected expression', index);
            }
            gobbleSpaces();
            if (exprICode(index) === COLON_CODE) {
                index++;
                alternate = gobbleExpression();
                if (!alternate) {
                    throwError('Expected expression', index);
                }
                return {
                    type: code.CONDITIONAL_EXP,
                    test: test,
                    consequent: consequent,
                    alternate: alternate
                };
            } else {
                throwError('Expected :', index);
            }
        } else {
            return test;
        }
    },


    // Search for the operation portion of the string (e.g. `+`, `===`)
    // Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
    // and move down from 3 to 2 to 1 character until a matching binary operation is found
    // then, return that binary operation
    gobbleBinaryOp = function gobbleBinaryOp() {
        gobbleSpaces();
        var to_check = expr.substr(index, max_binop_len),
            tc_len = to_check.length;
        while (tc_len > 0) {
            if (binary_ops.hasOwnProperty(to_check)) {
                index += tc_len;
                return to_check;
            }
            to_check = to_check.substr(0, --tc_len);
        }
        return false;
    },


    // This function is responsible for gobbling an individual expression,
    // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
    gobbleBinaryExpression = function gobbleBinaryExpression() {
        var node, biop, prec, stack, biop_info, left, right, i;

        // First, try to get the leftmost thing
        // Then, check to see if there's a binary operator operating on that leftmost thing
        left = gobbleToken();
        biop = gobbleBinaryOp();

        // If there wasn't a binary operator, just return the leftmost node
        if (!biop) {
            return left;
        }

        // Otherwise, we need to start a stack to properly place the binary operations in their
        // precedence structure
        biop_info = { value: biop, prec: binaryPrecedence(biop) };

        right = gobbleToken();
        if (!right) {
            throwError("Expected expression after " + biop, index);
        }
        stack = [left, biop_info, right];

        // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
        while (biop = gobbleBinaryOp()) {
            prec = binaryPrecedence(biop);

            if (prec === 0) {
                break;
            }
            biop_info = { value: biop, prec: prec };

            // Reduce: make a binary expression from the three topmost entries.
            while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
                right = stack.pop();
                biop = stack.pop().value;
                left = stack.pop();
                node = createBinaryExpression(biop, left, right);
                stack.push(node);
            }

            node = gobbleToken();
            if (!node) {
                throwError("Expected expression after " + biop, index);
            }
            stack.push(biop_info, node);
        }

        i = stack.length - 1;
        node = stack[i];
        while (i > 1) {
            node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
            i -= 2;
        }
        return node;
    },


    // An individual part of a binary expression:
    // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
    gobbleToken = function gobbleToken() {
        var ch, to_check, tc_len;

        gobbleSpaces();
        ch = exprICode(index);

        if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
            // Char code 46 is a dot `.` which can start off a numeric literal
            return gobbleNumericLiteral();
        } else if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
            // Single or double quotes
            return gobbleStringLiteral();
        } else if (isIdentifierStart(ch) || ch === OPAREN_CODE) {
            // open parenthesis
            // `foo`, `bar.baz`
            return gobbleVariable();
        } else if (ch === OBRACK_CODE) {
            return gobbleArray();
        } else {
            to_check = expr.substr(index, max_unop_len);
            tc_len = to_check.length;
            while (tc_len > 0) {
                if (unary_ops.hasOwnProperty(to_check)) {
                    index += tc_len;
                    return {
                        type: code.UNARY_EXP,
                        operator: to_check,
                        argument: gobbleToken(),
                        prefix: true
                    };
                }
                to_check = to_check.substr(0, --tc_len);
            }

            return false;
        }
    },

    // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
    // keep track of everything in the numeric literal and then calling `parseFloat` on that string
    gobbleNumericLiteral = function gobbleNumericLiteral() {
        var number = '',
            ch,
            chCode;
        while (isDecimalDigit(exprICode(index))) {
            number += exprI(index++);
        }

        if (exprICode(index) === PERIOD_CODE) {
            // can start with a decimal marker
            number += exprI(index++);

            while (isDecimalDigit(exprICode(index))) {
                number += exprI(index++);
            }
        }

        ch = exprI(index);
        if (ch === 'e' || ch === 'E') {
            // exponent marker
            number += exprI(index++);
            ch = exprI(index);
            if (ch === '+' || ch === '-') {
                // exponent sign
                number += exprI(index++);
            }
            while (isDecimalDigit(exprICode(index))) {
                //exponent itself
                number += exprI(index++);
            }
            if (!isDecimalDigit(exprICode(index - 1))) {
                throwError('Expected exponent (' + number + exprI(index) + ')', index);
            }
        }

        chCode = exprICode(index);
        // Check to make sure this isn't a variable name that start with a number (123abc)
        if (isIdentifierStart(chCode)) {
            throwError('Variable names cannot start with a number (' + number + exprI(index) + ')', index);
        } else if (chCode === PERIOD_CODE) {
            throwError('Unexpected period', index);
        }

        return {
            type: code.LITERAL,
            value: parseFloat(number),
            raw: number
        };
    },


    // Parses a string literal, staring with single or double quotes with basic support for escape codes
    // e.g. `"hello world"`, `'this is\nJSEP'`
    gobbleStringLiteral = function gobbleStringLiteral() {
        var str = '',
            quote = exprI(index++),
            closed = false,
            ch;

        while (index < length) {
            ch = exprI(index++);
            if (ch === quote) {
                closed = true;
                break;
            } else if (ch === '\\') {
                // Check for all of the common escape codes
                ch = exprI(index++);
                switch (ch) {
                    case 'n':
                        str += '\n';break;
                    case 'r':
                        str += '\r';break;
                    case 't':
                        str += '\t';break;
                    case 'b':
                        str += '\b';break;
                    case 'f':
                        str += '\f';break;
                    case 'v':
                        str += '\x0B';break;
                    default:
                        str += '\\' + ch;
                }
            } else {
                str += ch;
            }
        }

        if (!closed) {
            throwError('Unclosed quote after "' + str + '"', index);
        }

        return {
            type: code.LITERAL,
            value: str,
            raw: quote + str + quote
        };
    },


    // Gobbles only identifiers
    // e.g.: `foo`, `_value`, `$x1`
    // Also, this function checks if that identifier is a literal:
    // (e.g. `true`, `false`, `null`) or `this`
    gobbleIdentifier = function gobbleIdentifier() {
        var ch = exprICode(index),
            start = index,
            identifier;

        if (isIdentifierStart(ch)) {
            index++;
        } else {
            throwError('Unexpected ' + exprI(index), index);
        }

        while (index < length) {
            ch = exprICode(index);
            if (isIdentifierPart(ch)) {
                index++;
            } else {
                break;
            }
        }
        identifier = expr.slice(start, index);

        if (literals.hasOwnProperty(identifier)) {
            return {
                type: code.LITERAL,
                value: literals[identifier],
                raw: identifier
            };
        } else if (identifier === this_str) {
            return { type: code.THIS_EXP };
        } else {
            return {
                type: code.IDENTIFIER,
                name: identifier
            };
        }
    },


    // Gobbles a list of arguments within the context of a function call
    // or array literal. This function also assumes that the opening character
    // `(` or `[` has already been gobbled, and gobbles expressions and commas
    // until the terminator character `)` or `]` is encountered.
    // e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
    gobbleArguments = function gobbleArguments(termination) {
        var ch_i,
            args = [],
            node,
            closed = false;
        while (index < length) {
            gobbleSpaces();
            ch_i = exprICode(index);
            if (ch_i === termination) {
                // done parsing
                closed = true;
                index++;
                break;
            } else if (ch_i === COMMA_CODE) {
                // between expressions
                index++;
            } else {
                node = gobbleExpression();
                if (!node || node.type === code.COMPOUND) {
                    throwError('Expected comma', index);
                }
                args.push(node);
            }
        }
        if (!closed) {
            throwError('Expected ' + String.fromCharCode(termination), index);
        }
        return args;
    },


    // Gobble a non-literal variable name. This variable name may include properties
    // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
    // It also gobbles function calls:
    // e.g. `Math.acos(obj.angle)`
    gobbleVariable = function gobbleVariable() {
        var ch_i, node;
        ch_i = exprICode(index);

        if (ch_i === OPAREN_CODE) {
            node = gobbleGroup();
        } else {
            node = gobbleIdentifier();
        }
        gobbleSpaces();
        ch_i = exprICode(index);
        while (ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
            index++;
            if (ch_i === PERIOD_CODE) {
                gobbleSpaces();
                node = {
                    type: code.MEMBER_EXP,
                    computed: false,
                    object: node,
                    property: gobbleIdentifier()
                };
            } else if (ch_i === OBRACK_CODE) {
                node = {
                    type: code.MEMBER_EXP,
                    computed: true,
                    object: node,
                    property: gobbleExpression()
                };
                gobbleSpaces();
                ch_i = exprICode(index);
                if (ch_i !== CBRACK_CODE) {
                    throwError('Unclosed [', index);
                }
                index++;
            } else if (ch_i === OPAREN_CODE) {
                // A function call is being made; gobble all the arguments
                node = {
                    type: code.CALL_EXP,
                    'arguments': gobbleArguments(CPAREN_CODE),
                    callee: node
                };
            }
            gobbleSpaces();
            ch_i = exprICode(index);
        }
        return node;
    },


    // Responsible for parsing a group of things within parentheses `()`
    // This function assumes that it needs to gobble the opening parenthesis
    // and then tries to gobble everything within that parenthesis, assuming
    // that the next thing it should see is the close parenthesis. If not,
    // then the expression probably doesn't have a `)`
    gobbleGroup = function gobbleGroup() {
        index++;
        var node = gobbleExpression();
        gobbleSpaces();
        if (exprICode(index) === CPAREN_CODE) {
            index++;
            return node;
        } else {
            throwError('Unclosed (', index);
        }
    },


    // Responsible for parsing Array literals `[1, 2, 3]`
    // This function assumes that it needs to gobble the opening bracket
    // and then tries to gobble the expressions as arguments.
    gobbleArray = function gobbleArray() {
        index++;
        return {
            type: code.ARRAY_EXP,
            elements: gobbleArguments(CBRACK_CODE)
        };
    },
        nodes = [],
        ch_i,
        node;

    while (index < length) {
        ch_i = exprICode(index);

        // Expressions can be separated by semicolons, commas, or just inferred without any
        // separators
        if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
            index++; // ignore separators
        } else {
            // Try to gobble each expression individually
            if (node = gobbleExpression()) {
                nodes.push(node);
                // If we weren't able to find a binary expression and are out of room, then
                // the expression passed in probably has too much
            } else if (index < length) {
                throwError('Unexpected "' + exprI(index) + '"', index);
            }
        }
    }

    // If there's only one expression just try returning the expression
    if (nodes.length === 1) {
        return nodes[0];
    } else {
        return {
            type: code.COMPOUND,
            body: nodes
        };
    }
};

/**
 * @method jsep.addUnaryOp
 * @param {string} op_name The name of the unary op to add
 * @return jsep
 */
jsep.addUnaryOp = function (op_name) {
    max_unop_len = Math.max(op_name.length, max_unop_len);
    unary_ops[op_name] = t;return this;
};

/**
 * @method jsep.addBinaryOp
 * @param {string} op_name The name of the binary op to add
 * @param {number} precedence The precedence of the binary op (can be a float)
 * @return jsep
 */
jsep.addBinaryOp = function (op_name, precedence) {
    max_binop_len = Math.max(op_name.length, max_binop_len);
    binary_ops[op_name] = precedence;
    return this;
};

/**
 * @method jsep.addLiteral
 * @param {string} literal_name The name of the literal to add
 * @param {*} literal_value The value of the literal
 * @return jsep
 */
jsep.addLiteral = function (literal_name, literal_value) {
    literals[literal_name] = literal_value;
    return this;
};

/**
 * @method jsep.removeUnaryOp
 * @param {string} op_name The name of the unary op to remove
 * @return jsep
 */
jsep.removeUnaryOp = function (op_name) {
    delete unary_ops[op_name];
    if (op_name.length === max_unop_len) {
        max_unop_len = getMaxKeyLen(unary_ops);
    }
    return this;
};

/**
 * @method jsep.removeBinaryOp
 * @param {string} op_name The name of the binary op to remove
 * @return jsep
 */
jsep.removeBinaryOp = function (op_name) {
    delete binary_ops[op_name];
    if (op_name.length === max_binop_len) {
        max_binop_len = getMaxKeyLen(binary_ops);
    }
    return this;
};

/**
 * @method jsep.removeLiteral
 * @param {string} literal_name The name of the literal to remove
 * @return jsep
 */
jsep.removeLiteral = function (literal_name) {
    delete literals[literal_name];
    return this;
};

function evaluate(self, expr) {

    switch (expr.type) {
        case code.IDENTIFIER:
            return self[expr.name];
        case code.LITERAL:
            return expr.value;
        case code.ARRAY_EXP:
            return expr.elements.map(function (elem) {
                return evaluate(self, elem);
            });
        case code.LOGICAL_EXP:
        case code.BINARY_EXP:
            return binaryExp(expr.operator, evaluate(self, expr.left), evaluate(self, expr.right));
        case code.CALL_EXP:
            return callExpression(self, expr.callee, expr.arguments);
        case code.MEMBER_EXP:
            return evaluate(evaluate(self, expr.object), expr.property);
        case code.CONDITIONAL_EXP:
            return evaluate(self, expr.test) ? evaluate(self, expr.consequent) : evaluate(self, expr.alternate);
        case code.UNARY_EXP:
            return unaryExp(expr.operator, evaluate(self, expr.argument));
    }
}

function identifiers(expr, all) {
    if (arguments.length === 1) all = d3Collection.set();
    switch (expr.type) {
        case code.IDENTIFIER:
            all.add(expr.name);break;
        case code.ARRAY_EXP:
            expr.elements.forEach(function (elem) {
                identifiers(elem, all);
            });break;
        case code.BINARY_EXP:
            identifiers(expr.left, all);identifiers(expr.right, all);break;
        case code.CALL_EXP:
            identifiers(expr.arguments, all);break;
        case code.MEMBER_EXP:
            identifiers(expr.object, all);break;
        case code.CONDITIONAL_EXP:
            identifiers(expr.test, all);identifiers(expr.consequent, all);evaluate(expr.alternate, all);break;
    }
    return all;
}

function callExpression(self, callee, args) {
    var func;

    args = args.map(function (arg) {
        return evaluate(self, arg);
    });

    if (callee.type !== code.IDENTIFIER) {
        self = evaluate(self, callee.object);
        callee = callee.property;
    }

    func = self[callee.name];
    if (!func) throw new EvalError('callable "' + callee.name + '" not found in context');
    return func.apply(self, args);
}

function unaryExp(op, arg) {
    if (!unaryFunctions[op]) unaryFunctions[op] = new Function("arg", 'return ' + op + ' arg');
    return unaryFunctions[op](arg);
}

function binaryExp(op, a, b) {
    if (!binaryFunctions[op]) binaryFunctions[op] = new Function("a", "b", 'return a ' + op + ' b');
    return binaryFunctions[op](a, b);
}

var unaryFunctions = {};
var binaryFunctions = {};

// tiny javascript expression parser
var proto = {

    eval: function _eval(model) {
        return evaluate(model, this.parsed);
    },

    safeEval: function safeEval(model) {
        try {
            return evaluate(model, this.parsed);
        } catch (msg) {
            warn('Could not evaluate <<' + this.expr + '>> expression: ' + msg);
        }
    },

    identifiers: function identifiers$$1() {
        return identifiers(this.parsed).values();
    }
};

function Expression(expr) {
    this.codes = code;
    this.expr = expr;
    this.parsed = jsep(expr);
}

Expression.prototype = proto;

var viewExpression = function (expr) {
    return new Expression(expr);
};

var UID = 0;
var prefix$2 = 'd3v';

// Add a unique identifier to an object
var uid = function (o) {
    var uid = prefix$2 + ++UID;

    if (arguments.length) {
        Object.defineProperty(o, 'uid', {
            get: function get() {
                return uid;
            }
        });

        return o;
    } else return uid;
};

var sel = function (o) {

    Object.defineProperty(o, 'sel', {
        get: function get() {
            return d3Selection.select(this.el);
        }
    });

    return o;
};

//
// Directive Prototype
//
// Directives are special attributes with the d3- prefix.
// Directive attribute values are expected to be binding expressions.
// A directive’s job is to reactively apply special behavior to the DOM
// when the value of its expression changes.
//
// A directive can implement one or more of the directive methods:
//
//  * create
//  * mount
//  * refresh
//  * destroy
//
var prototype = {
    priority: 1,

    // hooks
    create: function create(expression) {
        return expression;
    },


    // pre mount
    preMount: function preMount() {},
    mount: function mount(model) {
        return model;
    },
    refresh: function refresh() {},
    destroy: function destroy() {},
    removeAttribute: function removeAttribute() {
        this.el.removeAttribute(this.name);
    },


    // Execute directive
    execute: function execute(model) {
        var _this = this;

        // No binding expression - nothing to do
        if (!this.expression) return;
        this.removeAttribute();

        model = this.mount(model);
        // No model returned - abort execution
        if (!model) return;

        var dir = this,
            sel$$1 = this.sel,
            refresh = function refresh() {
            try {
                dir.refresh(model, dir.expression.eval(model));
            } catch (msg) {
                warn('Error while refreshing "' + dir.name + '" directive: ' + msg);
            }
        };

        // Bind expression identifiers with model
        this.identifiers = this.expression.identifiers().map(function (id) {
            var event$$1 = id + '.' + dir.uid;
            model.$on(event$$1, refresh);
            return id;
        });

        sel$$1.on('remove.' + dir.uid, function () {
            _this.identifiers.forEach(function (id) {
                model.$off(id + '.' + dir.uid);
            });
            dir.destroy(model);
        });

        refresh();
    }
};

// Directive constructor
var createDirective = function (obj) {

    function Directive(el, attr, arg) {
        this.el = el;
        this.name = attr.name;
        this.arg = arg;
        var expr = sel(uid(this)).create(attr.value);
        if (expr) this.expression = viewExpression(expr);
    }

    Directive.prototype = index$1({}, prototype, obj);

    function directive(el, attr, arg) {
        return new Directive(el, attr, arg);
    }

    directive.prototype = Directive.prototype;
    return directive;
};

var asSelect = function (el) {
    if (el && !isFunction(el.size)) return d3Selection.select(el);
    return el;
};

var maybeJson = function (value) {
    if (isString(value)) {
        try {
            return JSON.parse(value);
        } catch (msg) {
            return value;
        }
    }
    return value;
};

// require handlebar
function compile$1(text) {
    var handlebars = inBrowser ? window.handlebars : require('handlebars');
    if (handlebars) return handlebars.compile(text);
    warn('compile function requires handlebars');
}

function html$1(source, context) {
    if (isString(source)) {
        if (context) {
            var s = compile$1(source);
            if (!s) return source;
        } else return source;
    }
    return source(context);
}

function htmlElement(source, context) {
    var el = d3Selection.select(document.createElement('div'));
    el.html(html$1(source, context));
    var children = el.node().children;
    if (children.length !== 1) warn('HtmlElement function should return one root element only, got ' + children.length);
    return children[0];
}

// prototype for both views and components
var protoComponent = {
    isd3: true,
    providers: providers,
    htmlElement: htmlElement,
    // same as export
    viewElement: htmlElement,
    createElement: function createElement(tag) {
        return d3Selection.select(document.createElement(tag));
    },
    responseError: function responseError(response) {
        var self = this;
        response.json().then(function (data) {
            self.error(data, response);
        });
    },
    error: function error(data) {
        data.level = 'error';
        this.message(data);
    },
    message: function message(data) {
        var self = this;
        this.root.events.call('message', self, data);
    },


    // Shortcut for fetch function in providers
    fetch: function fetch(url, options) {
        var fetch = providers.fetch;
        return arguments.length == 1 ? fetch(url) : fetch(url, options);
    },

    //
    // hooks
    init: function init() {},
    render: function render() {},
    mounted: function mounted() {},

    //
    mount: function mount(el, data) {
        if (mounted(this)) warn('already mounted');else {
            var sel$$1 = d3Selection.select(el),
                directives = sel$$1.directives(),
                dattrs = directives ? directives.attrs : attributes$1(el),
                model = this.parent.model.$child(this.model);

            data = index$1({}, sel$$1.datum(), data);

            this.model = model;

            if (isArray(this.props)) {
                var key, value;
                this.props.forEach(function (prop) {
                    key = data[prop] === undefined ? dattrs[prop] : data[prop];
                    if (isString(key)) {
                        if (model[key]) value = model[key];else value = maybeJson(key);
                    } else value = key;
                    if (value !== undefined) data[prop] = value;
                });
            }
            //
            // create the new element from the render function
            var newEl = this.render(data, dattrs);
            if (isPromise(newEl)) {
                var self = this;
                return newEl.then(function (element) {
                    return compile$$1(self, el, element);
                });
            } else return compile$$1(this, el, newEl);
        }
    }
};

// factory of View and Component constructors
function createComponent(o, prototype, coreDirectives) {
    if (isFunction(o)) o = { render: o };

    var obj = index$1({}, o),
        classComponents = extendComponents(d3Collection.map(), pop(obj, 'components')),
        classDirectives = extendDirectives(d3Collection.map(), pop(obj, 'directives')),
        model = pop(obj, 'model'),
        props = pop(obj, 'props');

    function Component(options) {
        var parent = pop(options, 'parent'),
            components = d3Collection.map(parent ? parent.components : null),
            directives = d3Collection.map(parent ? parent.directives : coreDirectives),
            events = d3Dispatch.dispatch('message', 'mounted');

        classComponents.each(function (comp, key) {
            components.set(key, comp);
        });
        classDirectives.each(function (comp, key) {
            directives.set(key, comp);
        });
        extendComponents(components, pop(options, 'components'));
        extendDirectives(directives, pop(options, 'directives'));

        Object.defineProperties(this, {
            components: {
                get: function get() {
                    return components;
                }
            },
            directives: {
                get: function get() {
                    return directives;
                }
            },
            parent: {
                get: function get() {
                    return parent;
                }
            },
            root: {
                get: function get() {
                    return parent ? parent.root : this;
                }
            },
            props: {
                get: function get() {
                    return props;
                }
            },
            uid: {
                get: function get() {
                    return this.model.uid;
                }
            },
            events: {
                get: function get() {
                    return events;
                }
            }
        });
        this.model = index$1({}, isFunction(model) ? model() : model, pop(options, 'model'));
        this.init(options);
    }

    Component.prototype = index$1({}, prototype, obj);

    function component(options) {
        return new Component(options);
    }

    component.prototype = Component.prototype;

    return component;
}

function mounted(view) {
    var mounted = view.isMounted;
    if (!mounted) Object.defineProperty(view, 'isMounted', {
        get: function get() {
            return true;
        }
    });
    return mounted;
}

function extendComponents(container, components) {
    d3Collection.map(components).each(function (obj, key) {
        container.set(key, createComponent(obj, protoComponent));
    });
    return container;
}

function extendDirectives(container, directives) {
    d3Collection.map(directives).each(function (obj, key) {
        container.set(key, createDirective(obj));
    });
    return container;
}

// Finalise the binding between the view and the model
// inject the model into the view element
// call the mounted hook and can return a Promise
function asView(vm, element) {
    Object.defineProperty(sel(vm), 'el', {
        get: function get() {
            return element;
        }
    });
    // Apply model to element and mount
    var p = d3Selection.select(element).view(vm).mount();
    if (isPromise(p)) return p.then(function () {
        return vm.mounted();
    });else return vm.mounted();
}

// Compile a component model
// This function is called once a component has rendered the component element
function compile$$1(cm, el, element) {
    if (!element) return warn('render function must return a single HTML node. It returned nothing!');
    element = asSelect(element);
    if (element.size() !== 1) warn('render function must return a single HTML node');
    element = element.node();
    //
    // Insert before the component element
    el.parentNode.insertBefore(element, el);
    // remove the component element
    d3Selection.select(el).remove();
    //
    return asView(cm, element);
}

function attributes$1(element) {
    var attrs = {};
    var attr = void 0;
    for (var i = 0; i < element.attributes.length; ++i) {
        attr = element.attributes[i];
        attrs[attr.name] = attr.value;
    }
    return attrs;
}

var ddispatch = function () {
    var events = d3Dispatch.dispatch('change'),
        _triggered = 0;

    return {
        on: function on(typename, callback) {
            if (arguments.length < 2) return events.on(typename);
            events.on(typename, callback);
            return this;
        },

        trigger: debounce(function () {
            events.apply('change', this, arguments);
            _triggered += 1;
        }),
        triggered: function triggered() {
            return _triggered;
        }
    };
};

//
// Initialise a model
function asModel(model, initials) {
    var events = d3Collection.map(),
        children = [],
        Child = null;

    // event handler for any change in the model
    events.set('', ddispatch());

    Object.defineProperties(uid(model), {
        $events: {
            get: function get() {
                return events;
            }
        },
        $children: {
            get: function get() {
                return children;
            }
        }
    });
    model.$child = $child;
    model.$update(initials);

    function $child(o) {
        if (Child === null) Child = createChildConstructor(model);
        return new Child(o);
    }
}

function createChildConstructor(model) {

    function Child(initials) {
        asModel(this, initials);
        model.$children.push(this);
        Object.defineProperty(this, 'parent', {
            get: function get() {
                return model;
            }
        });
    }

    Child.prototype = model;
    return Child;
}

//  $get method for a Model
//
//  attribute is a dotted string
var $get = function (attribute) {

    var bits = attribute.split('.'),
        key = bits.splice(0, 1),
        model = getModel(this, key);

    if (!(key in model)) return;

    var value = model[key];

    while (value && bits.length) {
        value = value[bits.splice(0, 1)];
    }return value;
};

function getModel(model, key) {

    while (!(key in model) && model.$parent) {
        model = model.$parent;
    }return model;
}

//  $set a reactive attribute for a Model
//
//  Set the value of a dotted attribute in the model or its parents
//  If the attribute is not already reactive make it as such.
//
var $set = function (key, value) {
    // property not reactive - make it as such
    if (!this.$events.get(key)) reactive(this, key, value);else this[key] = value;
};

function reactive(model, key, value) {
    var lazy;

    model.$events.set(key, ddispatch());

    Object.defineProperty(model, key, property());
    // Trigger the callback once for initialization
    model.$change(key);

    function update(newValue) {
        if (lazy) newValue = lazy.get.call(model);
        if (newValue === value) return;
        // trigger lazy callbacks
        var oldValue = value;
        value = newValue;
        model.$change(key, oldValue);
    }

    function property() {
        var prop = {
            get: function get() {
                return value;
            }
        };

        if (isFunction(value)) value = { get: value };

        // calculated attribute
        if (isObject(value) && isFunction(value.get)) {
            lazy = value;
            value = lazy.get.call(model);

            if (lazy.reactOn) lazy.reactOn.forEach(function (name) {
                model.$on(name + '.' + key, update);
            });else warn('reactive lazy property ' + key + ' does not specify \'reactOn\' list or properties');

            if (isFunction(lazy.set)) prop.set = lazy.set;
        } else prop.set = update;

        return prop;
    }
}

// Add change callback to a model reactive attribute
var $on = function (name, callback) {

    // When no name is provided, whait for changes on this model - no its parents
    if (arguments.length === 1 && isFunction(name)) {
        callback = name;
        name = '';
    }

    var bits = name.split('.'),
        key = bits[0],
        event$$1 = getEvent(this, key);

    if (!event$$1) return warn('Cannot bind to "' + key + '" - no such reactive property');

    // event from a parent model, add model uid to distinguish it from other child callbacks
    if (!this.$events.get(key)) bits.push(this.uid);

    bits[0] = 'change';
    return event$$1.on(bits.join('.'), callback);
};

function getEvent(model, name) {
    var event$$1 = model.$events.get(name);
    if (!event$$1 && model.parent) return getEvent(model.parent, name);
    return event$$1;
}

// Update a model with reactive model data
var $update = function (data, replace) {
    if (data) {
        replace = arguments.length === 2 ? replace : true;
        for (var key in data) {
            if (replace || this[key] === undefined) {
                if (key.substring(0, 1) === '$') {
                    if (this.constructor.prototype[key]) warn('Cannot set attribute method ' + key + ', it is protected');else this[key] = data[key];
                } else this.$set(key, data[key]);
            }
        }
    }
    return this;
};

function setbase(key, value) {
    if (!this.$events.has(key) && this.$parent) return setbase.call(this.$parent, key, value);
    this.$set(key, value);
}

// remove event handlers
var $off = function (attr) {
    if (attr === undefined) this.$events.each(function (event$$1) {
        return removeEvent(event$$1);
    });else {
        var bits = attr.split('.'),
            type = bits.splice(0, 1)[0],
            event$$1 = this.$events.get(type);
        if (event$$1) removeEvent(event$$1, bits.join('.'));
    }

    this.$children.forEach(function (child) {
        return child.$off(attr);
    });
};

function removeEvent(event$$1, name) {
    if (name) event$$1.on('change.' + name, null);else event$$1.on('change', null);
}

// trigger change event on a model reactive attribute
var $change = function (attribute) {
    var _event$trigger;

    var event$$1 = this.$events.get(attribute),
        args = slice(arguments, 1);
    if (event$$1) (_event$trigger = event$$1.trigger).call.apply(_event$trigger, [this].concat(toConsumableArray(args)));else warn('attribute \'' + attribute + '\' is not a reactive property this model');
    return this;
};

//
//  Model class
//
//  The model is at the core of d3-view reactive data component
function Model(initials) {
    asModel(this, initials);
}

function model$1(initials) {
    return new Model(initials);
}

model$1.prototype = Model.prototype;

// Public API methods
Model.prototype.$on = $on;
Model.prototype.$change = $change;
Model.prototype.$update = $update;
Model.prototype.$get = $get;
Model.prototype.$set = $set;
Model.prototype.$new = $new;
Model.prototype.$setbase = setbase;
Model.prototype.$off = $off;

function $new(initials) {

    var parent = this,
        child = model$1(initials);

    parent.$children.push(child);

    Object.defineProperty(child, 'parent', {
        get: function get() {
            return parent;
        }
    });

    return child;
}

//
// prototype for views
var protoView = index$1({}, protoComponent, {

    use: function use(plugin) {
        if (isObject(plugin)) plugin.install(this);else plugin(this);
        return this;
    },

    addComponent: function addComponent(name, obj) {
        if (this.isMounted) return warn('already mounted, cannot add component');
        var component = createComponent(obj, protoComponent);
        this.components.set(name, component);
        return component;
    },

    addDirective: function addDirective(name, obj) {
        if (this.isMounted) return warn('already mounted, cannot add directive');
        var directive = createDirective(obj);
        this.directives.set(name, directive);
        return directive;
    },

    mount: function mount(el, callback) {
        if (mounted(this)) warn('already mounted');else {
            el = element(el);
            if (el) {
                this.model = this.parent ? this.parent.model.$child(this.model) : model$1(this.model);
                var p = asView(this, el);
                if (callback) return p ? p.then(callback) : callback();
                return p;
            }
        }
    }
});

var simpleView = createComponent(null, protoView);

function element(el) {
    if (!el) return warn('element not defined, pass an identifier or an HTMLElement object');
    var d3el = isFunction(el.node) ? el : d3Selection.select(el),
        element = d3el.node();
    if (!element) warn('could not find ' + el + ' element');else return element;
}

//
//  d3-for directive
//  ======================
//
//  Repeat a element over an array of items and establish
//  a one way binding between the array and the Dom
var d3For = {
    create: function create(expression) {
        var bits = [];
        expression.trim().split(' ').forEach(function (v) {
            v ? bits.push(v) : null;
        });
        if (bits.length !== 3 || bits[1] != 'in') return warn('d3-for directive requires "item in expression" template, got "' + expression + '"');
        this.itemName = bits[0];
        this.itemClass = 'for' + this.uid;
        return bits[2];
    },
    preMount: function preMount() {
        return true;
    },
    mount: function mount(model) {
        this.creator = this.el;
        this.el = this.creator.parentNode;
        // remove the creator from the DOM
        d3Selection.select(this.creator).remove();
        if (this.el) return model;
    },
    refresh: function refresh(model, items) {
        if (!isArray(items)) return;

        var creator = this.creator,
            selector = creator.tagName + '.' + this.itemClass,
            itemName = this.itemName,
            sel = this.sel,
            entries = sel.selectAll(selector).data(items),
            vm = sel.view();

        var x = void 0;

        entries.exit().remove();

        entries.enter().append(function () {
            return creator.cloneNode(true);
        }).classed(this.itemClass, true).each(function (d, index) {
            x = { index: index };
            x[itemName] = d;
            simpleView({
                model: x,
                parent: vm
            }).mount(this);
        });
        //.merge(entries)
        //    .each(function () {
        //        var vm = this.__d3_view__;
        //        if (vm._refresh) vm.refresh();
        //        vm._refresh = true;
        //    });
    }
};

//
//  d3-if
//  =============
//
//  Remove an element if the condition is not satisfied
//
var d3If = {

    refresh: function refresh(model, value) {
        if (value) this.sel.style('display', null);else this.sel.style('display', 'none');
    }
};

var directives = {
    attr: attr,
    html: html,
    value: value,
    show: show,
    on: on,
    'for': d3For,
    'if': d3If
};

// Core Directives
var coreDirectives = extendDirectives(d3Collection.map(), directives);

// the view constructor
var main = createComponent(null, protoView, coreDirectives);

// Add callback to execute when the DOM is ready
var dom = function (callback) {
    providers.readyCallbacks.push(callback);
    if (document.readyState !== 'complete') {
        document.addEventListener('DOMContentLoaded', _completed);
        // A fallback to window.onload, that will always work
        window.addEventListener('load', _completed);
    } else domReady();
};

function _completed() {
    document.removeEventListener('DOMContentLoaded', _completed);
    window.removeEventListener('load', _completed);
    domReady();
}

function domReady() {
    var callback = void 0;
    while (providers.readyCallbacks.length) {
        callback = providers.readyCallbacks.shift();
        d3Timer.timeout(callback);
    }
}

var providers$1 = {
    logger: logger
};

var prefix$3 = '[d3-form]';

var warn$1 = function (msg) {
    providers$1.logger.warn(prefix$3 + ' ' + msg);
};

var modelDataKeys = ['labelSrOnly', 'layout'];

var componentsFromType = {
    'text': 'input',
    'password': 'input',
    'number': 'input'
};

// return A promise which execute a callback at the next event Loop cycle


function formComponent(child) {
    var type = child.type || 'text';
    return componentsFromType[type] || type;
}

function addChildren(sel) {
    var children = this.data.children;
    if (children) {
        if (!isArray(children)) {
            warn$1('children should be an array of fields, for ' + (typeof children === 'undefined' ? 'undefined' : _typeof(children)));
            return sel;
        }
        sel.selectAll('.d3form').data(children).enter().append(formChild).classed('d3form', true);
    }
    return sel;
}

function modelData(data) {
    if (!data) data = {};
    this.data = data;
    var model = this.model;
    modelDataKeys.forEach(function (key) {
        if (key in data) model.$set(key, data[key]);
    });
    return data;
}

function formChild(child) {
    var component = formComponent(child);
    if (!component) {
        warn$1('Could not find form component ' + child.type);
        component = 'input';
        child.type = 'hidden';
    }
    return document.createElement('d3' + component);
}

//
// Fieldset element
var fieldset = {

    render: function render(data) {
        var el = this.createElement('fieldset');
        modelData.call(this, data);
        return addChildren.call(this, el);
    }

};

var formElement = {
    wrap: function wrap(sel) {
        var field = this,
            theme = getTheme(field),
            wrappers = theme ? theme[sel.attr('type')] || theme[sel.node().tagName.toLowerCase()] : null;
        if (!wrappers || !theme.wrappers) return sel;

        var wrapped = sel,
            wrap;

        wrappers.forEach(function (wrapper) {
            wrap = theme.wrappers[wrapper];
            if (wrap) wrapped = wrap.call(field, wrapped, sel);else warn$1('Could not find form field wrapper ' + wrapper);
        });

        return wrapped;
    },
    wrapTemplate: function wrapTemplate(sel, template) {
        var div = document.createElement('div'),
            outer = d3Selection.select(div).html(template),
            slot = outer.select('slot');

        if (!slot.size()) {
            warn$1('template does not provide a slot element');
            return sel;
        }
        var target = d3Selection.select(slot.node().parentNode);
        sel.nodes().forEach(function (node) {
            target.insert(function () {
                return node;
            }, 'slot');
        });
        slot.remove();
        return d3Selection.selectAll(div.children);
    }
};

// A mixin for all form field components
var field = index$1({

    model: {
        value: null,
        error: '',
        isDirty: null,
        showError: {
            reactOn: ['error', 'isDirty', 'formSubmitted'],
            get: function get() {
                if (this.error) return this.isDirty || this.formSubmitted;
                return false;
            }
        },
        // default validate function does nothing, IMPORTANT!
        $validate: function $validate() {}
    },

    inputData: function inputData(data) {
        data = modelData.call(this, data);
        if (!data.name) warn$1('Input field without a name');
        data.placeholder = data.placeholder || data.label || data.name;
        data.id = data.id || 'd3f' + this.uid;
        this.model.inputs[data.name] = this.model;
        return data;
    }
}, formElement);

function getTheme(component) {
    var theme = component.formTheme;
    if (!theme && component.parent) return getTheme(component.parent);else return theme;
}

var required = {
    set: function set$$1(el, data) {
        var value = data.required;
        if (isString(value)) el.attr('d3-required', value);else el.property('required', value || null);
    },
    validate: function validate(el, value) {
        if (el.property('required')) if (!value) return 'required';else if (value === '') {
            // this is valid, no need to continue with the remaining validators
            return true;
        }
    }
};

var minLength = {
    set: function set$$1(el, data) {
        var value = data.minLength;
        if (isString(value)) el.attr('d3-attr-minlength', value);else if (value !== undefined) el.attr('minlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('minlength');
        if (l === l && l > 0 && value.length < l) return 'too short - ' + l + ' characters or more expected';
    }
};

var maxLength = {
    set: function set$$1(el, data) {
        var value = data.maxLength;
        if (isString(value)) el.attr('d3-attr-maxlength', value);else if (value !== undefined) el.attr('maxlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('maxlength');
        if (l === l && l > 0 && value.length > l) return 'too long - ' + l + ' characters or less expected';
    }
};

var minimum = {
    set: function set$$1(el, data) {
        var value = data.minimum;
        if (isString(value)) el.attr('d3-attr-min', value);else if (value !== undefined) el.attr('min', value);
    },
    validate: function validate(el, value) {
        var r = range(el);
        if (r && +value < r[0]) return 'must be greater or equal ' + r[0];
    }
};

var maximum = {
    set: function set$$1(el, data) {
        var value = data.maximum;
        if (isString(value)) el.attr('d3-attr-max', value);else if (value !== undefined) el.attr('max', value);
    },
    validate: function validate(el, value) {
        var r = range(el);
        if (r && +value > r[1]) return 'must be less or equal ' + r[1];
    }
};

// validator singleton
var validators = {

    // get the list of validators
    // custom is an optional list of custom validators
    get: function get(custom) {
        var validators = this.all.slice(0);
        if (isObject(custom)) for (var key in custom) {
            validators.push(customValidator(key, custom[key]));
        }return validators;
    },


    // add model validators to a form-field
    set: function set$$1(vm, el) {
        var model = vm.model;
        model._view = vm;
        model.validators.forEach(function (validator) {
            return validator.set(el, vm.data);
        });
        model.$on('value.validate', this.validate);
        model.$validate = this.validate;
    },
    validate: function validate() {
        var model = this,
            vm = model._view,
            validators = model.validators,
            value = model.value,
            el = vm.sel.attr('id') === vm.data.id ? vm.sel : vm.sel.select('#' + vm.data.id),
            validator,
            msg;

        model.isDirty === null ? model.isDirty = false : model.isDirty = true;

        for (var i = 0; i < validators.length; ++i) {
            validator = validators[i];
            msg = validator.validate(el, value);
            if (msg) {
                if (msg === true) msg = '';
                break;
            }
        }

        model.error = msg || '';
    },


    all: [required, minLength, maxLength, minimum, maximum]
};

function range(el) {
    var l0 = el.attr('min'),
        l1 = el.attr('max');
    l0 = l0 === null ? -Infinity : +l0;
    l1 = l1 === null ? Infinity : +l1;
    return [l0, l1];
}

function customValidator(key, method) {

    return {
        set: function set$$1(el, data) {
            var value = data[key];
            if (!value) return;
        },
        validate: function validate(el, value) {
            return method(el, value);
        }
    };
}

//
// Input element
var input$1 = index$1({
    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('input').attr('id', data.id).attr('type', data.type || 'text').attr('name', data.name).attr('d3-value', 'value').attr('placeholder', data.placeholder);

        validators.set(this, el);
        return this.wrap(el);
    }
}, field);

//
// Textarea element
var textarea$1 = index$1({

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('textarea').attr('id', data.id).attr('name', data.name).attr('placeholder', data.placeholder).attr('d3-value', 'value').attr('d3-validate', 'validators');

        validators.set(this, el);
        return this.wrap(el);
    }

}, field);

//
// Select element
var select$1 = index$1({}, field, {

    model: index$1({
        options: [],
        $optionLabel: optionLabel,
        $optionValue: optionValue
    }, field.model),

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('select').attr('id', data.id).attr('name', data.name).attr('d3-value', 'value').attr('placeholder', data.placeholder);

        this.model.options = data.options;

        el.append('option').attr('d3-for', 'option in options').attr('d3-html', '$optionLabel()').attr('d3-attr-value', '$optionValue()');

        validators.set(this, el);
        return this.wrap(el);
    }
});

function optionValue() {
    if (isArray(this.option)) return this.option[0];
    return this.option;
}

function optionLabel() {
    if (isArray(this.option)) return this.option[1] || this.option[0];
    return this.option;
}

//
// Submit element
var submit = index$1({

    render: function render(data) {
        data = modelData.call(this, data);
        data.type = data.type || 'submit';
        this.model.$set('error', false);
        if (!isString(data.disabled)) {
            this.model.$set('disabled', data.disabled || null);
            data.disabled = 'disabled';
        }
        if (!data.click) data.click = '$vm.click()';

        var el = this.createElement('button').attr('type', data.type).attr('name', data.name).attr('d3-attr-disabled', data.disabled).attr('d3-on-click', data.click).html(data.label || 'submit');

        return this.wrap(el);
    },

    click: function click() {
        this.model.actions.submit.call(this, d3Selection.event);
    }
}, formElement);

// Form Responses
var responses = {
    "default": defaultResponse,
    redirect: redirect
};

function defaultResponse(response) {
    var data = response.json();
    this.message(data);
}

function redirect() {
    window.location.href = this.data.redirectTo || '/';
}

// Form Actions
var actions = {
    submit: submit$1
};

function submit$1(e) {
    var form = this && this.model ? this.model.form : null;

    if (!form) {
        warn$1('form not available, cannot submit');
        return;
    }

    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    var fetch = providers$1.fetch,
        ct = (form.data.enctype || '').split(';')[0],
        action = form.data.action,
        url = isObject(action) ? action.url : action,
        data = form.inputData(),
        options = {};

    if (!fetch) {
        warn$1('fetch provider not available, cannot submit');
        return;
    }

    if (!url) {
        warn$1('No url, cannot submit');
        return;
    }

    if (ct === 'application/json') {
        options.headers = {
            'Content-Type': form.data.enctype
        };
        options.body = JSON.stringify(data);
    } else {
        options.body = new FormData();
        for (var key in data) {
            options.body.set(key, data[key]);
        }
    }

    // Flag the form as submitted
    form.setSubmit();
    options.method = form.method || 'post';
    fetch(url, options).then(success, failure);

    function success(response) {
        form.setSubmitDone();
        form.response(response);
    }

    function failure() {
        form.setSubmitDone();
    }
}

// Main form component
var form = {

    // make sure a new model is created for this component
    props: ['schema'],

    model: function model() {
        return {
            formSubmitted: false,
            formPending: false,
            inputs: {},
            $isValid: function $isValid() {
                var inp = void 0,
                    valid = true;
                for (var key in this.inputs) {
                    inp = this.inputs[key];
                    inp.$validate();
                    if (inp.error) valid = false;
                }
                return valid;
            },
            $setSubmit: function $setSubmit() {
                this.formSubmitted = true;
                this.formPending = true;
                return this.$isValid();
            },
            $setSubmitDone: function $setSubmitDone() {
                this.formPending = false;
            }
        };
    },


    components: {
        'd3fieldset': fieldset,
        'd3input': input$1,
        'd3textarea': textarea$1,
        'd3select': select$1,
        'd3submit': submit
    },

    render: function render(data) {
        var model = this.model,
            form = this.createElement('form').attr('novalidate', ''),
            self = this;
        //
        model.actions = {};
        model.form = this;
        //
        var schema = data['schema'];
        if (isString(schema)) {
            var fetch = providers$1.fetch;
            return fetch(schema, { method: 'GET' }).then(function (response) {
                if (response.status === 200) return response.json().then(build);else warn$1('Could not load form from ' + schema + ': status ' + response.status);
            });
        } else return build(schema);

        function build(schema) {
            modelData.call(self, schema);
            //
            // Form validations
            model.validators = validators.get(data.validators);
            //
            // Form actions
            for (var key in actions) {
                var action = self.data[key];
                if (isString(action)) action = self.model.$get(action);
                model.actions[key] = action || actions[key];
            }
            addChildren.call(self, form);
            return form;
        }
    },

    inputData: function inputData() {
        var inputs = this.model.inputs,
            data = {},
            value;
        for (var key in inputs) {
            value = inputs[key].value;
            if (value !== undefined) data[key] = value;
        }

        return data;
    },

    inputError: function inputError(error) {
        var input = this.model.inputs[error.name];
        if (!input) {
            warn$1('Unknown input, cannot set input error');
            this.error(error);
        }
    },
    response: function response(_response) {
        if (!_response) return;
        var handler;

        if (_response.status) {
            if (_response.status < 300) {
                if (this.data.resultHandler) {
                    handler = responses[this.data.resultHandler];
                    if (!handler) warn$1('Could not find ' + this.data.resultHandler + ' result handler');else handler.call(this, _response);
                } else {
                    responses.default.call(this, _response);
                }
            } else this.responseError(_response);
        } else if (_response.error) {
            this.error(_response.error);
        } else if (isArray(_response.errors)) {
            var self = this;
            _response.errors.forEach(function (error) {
                self.inputError(error);
            });
        } else {
            if (this.data.resultHandler) {
                handler = responses[this.data.resultHandler];
                if (!handler) warn$1('Could not find ' + this.data.resultHandler + ' result handler');else handler.call(this, _response);
            } else {
                responses.default.call(this, _response);
            }
        }
    }
};

// Forms plugin
var plugin = {

    install: function install(view) {
        view.addComponent('d3form', form);
        for (var key in view.providers) {
            providers$1[key] = view.providers[key];
        }
    },

    actions: actions,

    responses: responses
};

var label = function (el) {
    return this.wrapTemplate(el, labelTpl(this.data));
};

function labelTpl(data) {
    var label = data.label || data.name;

    return "<label for=" + data.id + " class=\"control-label\" d3-class=\"[required, labelSrOnly ? 'sr-only' : null]\">" + label + "</label>\n<slot></slot>";
}

var groupTpl = '<div class="form-group" d3-class=\'showError ? "has-danger" : null\'>\n<slot></slot>\n<p d3-if="showError" class="text-danger error-block" d3-html="error"></p>\n</div>';

var formGroup = function (el, formEl) {
    formEl.classed('form-control', true).attr('d3-class', 'showError ? "form-control-danger" : null');
    return this.wrapTemplate(el, groupTpl);
};

var inputGroup = function (el, formEl) {
    var ig = this.data['group'];
    if (!ig) return el;
    var gid = 'g' + formEl.attr('id');
    formEl.attr('aria-describedby', gid);
    return this.wrapTemplate(el, groupTpl$1(gid, ig));
};

function groupTpl$1(gid, group) {
    return '<div class="input-group" :class="bootstrapStatus()">\n<span class="input-group-addon" id="' + gid + '">' + group + '</span>\n<slot></slot>\n</div>';
}

var groupTpl$2 = '<div class="form-group">\n<slot></slot>\n</div>';

var submit$2 = function (el, formEl) {
    var theme = this.data.theme || 'primary';
    formEl.classed('btn', true).classed('btn-' + theme, true);
    return this.wrapTemplate(el, groupTpl$2);
};

var bootstrap = {

    input: ['inputGroup', 'label', 'formGroup'],
    textarea: ['label', 'formGroup'],
    select: ['label', 'formGroup'],
    submit: ['submit'],
    wrappers: {
        label: label,
        formGroup: formGroup,
        inputGroup: inputGroup,
        submit: submit$2
    }
};

// Bootstrap theme
var plugin$1 = {

    install: function install(view) {
        var d3form = view.components.get('d3form');
        if (d3form) d3form.prototype.formTheme = bootstrap;
    }
};

var version$1 = "0.4.3";

exports.view = main;
exports.viewModel = model$1;
exports.viewExpression = viewExpression;
exports.viewReady = dom;
exports.viewProviders = providers;
exports.viewWarn = warn;
exports.viewForms = plugin;
exports.viewBootstrapForms = plugin$1;
exports.viewUid = uid;
exports.viewDebounce = debounce;
exports.viewVersion = version$1;
exports.viewElement = htmlElement;
exports.viewTemplate = compile$1;
exports.viewHtml = html$1;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=d3-view.js.map
