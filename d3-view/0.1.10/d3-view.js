// d3-view Version 0.1.10. Copyright 2016 quantmind.com.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-timer'), require('d3-selection'), require('d3-collection'), require('d3-dispatch'), require('d3-transition')) :
  typeof define === 'function' && define.amd ? define('d3-view', ['exports', 'd3-timer', 'd3-selection', 'd3-collection', 'd3-dispatch', 'd3-transition'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Timer,d3Selection,d3Collection,d3Dispatch,d3Transition) { 'use strict';

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

var pop$1 = function (obj, prop) {
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

function identifiers$1(expr, all) {
    if (arguments.length === 1) all = d3Collection.set();
    switch (expr.type) {
        case code.IDENTIFIER:
            all.add(expr.name);break;
        case code.ARRAY_EXP:
            expr.elements.forEach(function (elem) {
                identifiers$1(elem, all);
            });break;
        case code.BINARY_EXP:
            identifiers$1(expr.left, all);identifiers$1(expr.right, all);break;
        case code.CALL_EXP:
            identifiers$1(expr.arguments, all);break;
        case code.MEMBER_EXP:
            identifiers$1(expr.object, all);break;
        case code.CONDITIONAL_EXP:
            identifiers$1(expr.test, all);identifiers$1(expr.consequent, all);evaluate(expr.alternate, all);break;
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

var providers = {
    logger: logger,
    fetch: fetch()
};

function fetch() {
    if (inBrowser) return window.fetch;
}

var prefix$1 = '[d3-view]';

var warn = function (msg) {
    providers.logger.warn(prefix$1 + ' ' + msg);
};

// tiny javascript expression parser
var proto$1 = {

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

    identifiers: function identifiers() {
        return identifiers$1(this.parsed).values();
    }
};

function Expression(expr) {
    this.codes = code;
    this.expr = expr;
    this.parsed = jsep(expr);
}

Expression.prototype = proto$1;

var viewExpression = function (expr) {
    try {
        return new Expression(expr);
    } catch (msg) {
        warn('Could not parse <<' + expr + '>> expression: ' + msg);
    }
};

var UID = 0;

// Add a unique identifier to an object
var uid = function (o) {
    var uid = ++UID;

    Object.defineProperty(o, 'uid', {
        get: function get() {
            return uid;
        }
    });

    return o;
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

    Directive.prototype = assign({}, prototype, obj);

    function directive(el, attr, arg) {
        return new Directive(el, attr, arg);
    }

    directive.prototype = Directive.prototype;
    return directive;
};

d3Selection.selection.prototype.model = model$1;

var asModel = function (model, initials) {
    var events = d3Collection.map();

    // event handler for any change in the model
    events.set('', d3Dispatch.dispatch('change'));

    Object.defineProperty(uid(model), '$events', {
        get: function get() {
            return events;
        }
    });
    model._Child = null;
    model.$update(initials);
};



function model$1(value) {
    return arguments.length ? this.property("__model__", value) : this.node().__model__;
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

var debounce = function (callback) {
    var queued = false;
    return function () {
        if (!queued) {
            var args = Array.prototype.slice.call(arguments);
            queued = true;
            d3Timer.timeout(function () {
                queued = false;
                callback.apply(undefined, args);
            });
        }
    };
};

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
    var events = model.$events,
        oldValue,
        lazy;

    events.set(key, d3Dispatch.dispatch('change'));

    Object.defineProperty(model, key, property());

    // the event is fired at the next tick of the event loop
    // Cannot use the () => notation here otherwise arguments are incorrect
    var trigger = debounce(function () {
        oldValue = arguments[0];
        events.get(key).call('change', model, value, oldValue);
        // trigger model change event only when not a lazy property
        if (!lazy) events.get('').call('change', model, key);
    });

    // Trigger the callback once for initialization
    trigger();

    function update(newValue) {
        if (lazy) newValue = lazy.get.call(model);
        if (newValue === value) return;
        // trigger lazy callbacks
        trigger(value);
        // update the value
        value = newValue;
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
            });else model.$on('.' + key, update);

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
    if (!this.$events.get(name)) bits.push(this.uid);

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
    if (data) replace = arguments.length === 2 ? replace : true;
    for (var key in data) {
        if (replace || this[key] === undefined) {
            if (key.substring(0, 1) === '$') {
                if (this.constructor.prototype[key]) warn('Cannot set attribute method ' + key + ', it is protected');else this[key] = data[key];
            } else this.$set(key, data[key]);
        }
    }
    return this;
};

// create a child model
var $child = function (initials) {
    if (!this._Child) this._Child = createChildConstructor(this);

    var parent = this,
        child = new this._Child(initials);

    Object.defineProperty(child, 'parent', {
        get: function get() {
            return parent;
        }
    });

    return child;
};

function createChildConstructor(model) {

    function Child(initials) {
        asModel(this, initials);
    }

    Child.prototype = model;
    return Child;
}

function setbase(key, value) {
    if (!this.$events.has(key) && this.$parent) return setbase.call(this.$parent, key, value);
    this.$set(key, value);
}

//
//  Model class
//
//  The model is at the core of d3-view reactive data component
function Model(initials) {
    asModel(this, initials);
}

function model(initials) {
    return new Model(initials);
}

model.prototype = Model.prototype;

// Public API methods
Model.prototype.$on = $on;
Model.prototype.$update = $update;
Model.prototype.$get = $get;
Model.prototype.$set = $set;
Model.prototype.$child = $child;
Model.prototype.$new = $new;
Model.prototype.$setbase = setbase;

function $new(initials) {

    var parent = this,
        child = model(initials);

    Object.defineProperty(child, 'parent', {
        get: function get() {
            return parent;
        }
    });

    return child;
}

// Model factory function
var createModel = function (directives, defaults, parent) {
    // model directive
    var dir = directives.pop('model');

    // For loop directive not permitted in the root view
    if (directives.get('for') && !parent) {
        warn('Cannot have a "d3-for" directive in the root view element');
        directives.pop('for');
    }

    if (!parent) {
        if (dir) warn('Cannot have a d3-model directive in the root element');
        return model(defaults);
    }

    // Execute model directive
    if (dir) {
        dir.execute(parent);
        var model$$1 = dir.sel.model();
        if (model$$1) model$$1.$update(defaults, false);
        return model$$1;
    } else if (defaults) return parent.$child(defaults);else return parent;
};

// No value, it has its own directive
var attributes = ['name', 'class', 'disabled', 'readonly', 'required'];

d3Selection.selection.prototype.directives = directives;

function directives(value) {
    return arguments.length ? this.property("__directives__", value) : this.node().__directives__;
}

var getdirs = function (element, directives) {
    var sel = d3Selection.select(element),
        dirs = sel.directives();
    if (dirs) return dirs;
    dirs = new Directives();
    sel.directives(dirs);

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
            if (directive) dirs.add(dirName, directive(element, attr, arg));else warn(element.tagName + ' cannot find directive "' + dirName + '". Did you forget to register it?');
        }
        dirs.attrs[attr.name] = attr.value;
    }
    return dirs.sorted();
};

// Directives container
function Directives() {
    this.attrs = {};
    this._dirs = {};
    this._all = [];
}

Directives.prototype = {
    size: function size() {
        return this._all.length;
    },

    get: function get(name) {
        return this._dirs[name];
    },

    pop: function pop(name) {
        var dir = this._dirs[name];
        if (dir) {
            delete this._dirs[name];
            dir.removeAttribute();
            var index = this._all.indexOf(dir);
            if (index > -1) this._all.splice(index, 1);
        }
        return dir;
    },

    add: function add(name, dir) {
        this._dirs[name] = dir;
        this._all.push(dir);
    },

    sorted: function sorted() {
        this._all.sort(function (d) {
            return -d.priority;
        });
        return this;
    },

    forEach: function forEach(callback) {
        this._all.forEach(callback);
    }
};

// Mount a model into an element
function mount$1(model, el) {
    var sel = d3Selection.select(el),
        directives = sel.directives();

    // directives not available, this is a mount from
    // a directive/loop and requires a new model
    if (!directives) {
        directives = getdirs(el, model.$vm ? model.$vm.directives : null);
        model = createModel(directives, null, model);
    }

    // Loop directive is special
    var loop = directives.pop('for');

    if (loop) {
        loop.execute(model);
        return true; // Important - skip mounting a component
    } else {
        if (!sel.model()) sel.model(model);
        mountChildren(sel, directives);
    }
}

function mountChildren(sel, directives) {
    var model = sel.model(),
        vm = model.$vm;

    sel.selectAll(function () {
        return this.children;
    }).each(function () {
        var component = vm ? vm.components.get(this.tagName.toLowerCase()) : null;

        if (component) component({ parent: vm }).mount(this);else {
            // vanilla element
            mount$1(model, this);
            var child = d3Selection.select(this);
            // cleanup model if not needed
            if (child.model() === model) child.model(null);
        }
    });

    // Execute directives
    if (directives.size()) {
        directives.forEach(function (d) {
            d.execute(model);
        });
    } else
        // no directives - remove property
        sel.directives(null);
}

//
//  d3-model directive
//  ===================
//
//  Create a new model on the element based on data from parent models
//  This is a special directive and the first to be mounted
var model$2 = {

    mount: function mount(model) {
        var expr = this.expression;
        if (expr.parsed.type !== expr.codes.IDENTIFIER) return warn('d3-model expression support identifiers only, got "' + expr.parsed.type + '": ' + this.expression);
        var newModel = model.$child(expr.eval(model));
        this.sel.model(newModel);
        model.$setbase(this.expression.expr, newModel);
    }

};

var properties = ['disabled', 'readonly', 'required'];

//
//  d3-attr:<attr> directive
//  ==============================
//
//  Create a one-way binding between a model and a HTML element attribute
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

    Tag.prototype = assign({}, base, proto);

    function tag(el) {
        var t = new Tag(el);

        Object.defineProperty(t, 'value', {
            get: function get() {
                return d3Selection.select(t.el).property('value');
            },
            set: function set(v) {
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
        this.block = this.sel.style('display') ? 'block' : null;
        return model;
    },

    refresh: function refresh(model, value) {
        if (value) this.sel.style('display', this.block);else this.sel.style('display', 'none');
    }
};

//
//  d3-on directive
var on$1 = {

    mount: function mount(model) {
        var event$$1 = this.arg || 'click',
            expr = this.expression;

        // DOM event => model binding
        this.sel.on(event$$1 + '.' + this.uid, function () {
            expr.eval(model);
        });
    }
};

//
//  d3-transition
//  =============
var transition$1 = {

    refresh: function refresh(model) {
        d3Transition.transition(model);
    }
};

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
        if (bits.length !== 3 || bits[1] != 'in') return warn('d3-for directive requires "item in expression" template');
        this.itemName = bits[0];
        this.itemClass = 'for' + this.uid;
        return bits[2];
    },

    mount: function mount$1(model) {
        this.creator = this.el;
        this.el = this.creator.parentNode;
        // remove the creator from the DOM
        d3Selection.select(this.creator).remove();
        return model;
    },

    refresh: function refresh(model, items) {
        if (!isArray(items)) return;

        var creator = this.creator,
            selector = creator.tagName + '.' + this.itemClass,
            itemName = this.itemName,
            entries = this.sel.selectAll(selector).data(items);

        entries.enter().append(function () {
            return creator.cloneNode(true);
        }).classed(this.itemClass, true).each(function (d, index) {
            var x = { index: index };
            x[itemName] = d;
            mount$1(model.$child(x), this);
        });

        entries.exit().remove();
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

var directives$1 = {
    model: model$2,
    attr: attr,
    html: html,
    value: value,
    show: show,
    on: on$1,
    transition: transition$1,
    'for': d3For,
    'if': d3If
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

// Core Directives
var coreDirectives = extendDirectives(d3Collection.map(), directives$1);

// prototype for both views and components
var proto = {
    isd3: true,
    providers: providers,
    htmlElement: htmlElement,
    // same as export
    viewElement: htmlElement,

    init: function init() {},

    mounted: function mounted$1() {},

    createElement: function createElement(tag) {
        return d3Selection.select(document.createElement(tag));
    },

    responseError: function responseError(response) {
        var self$$1 = this;
        response.json().then(function (data) {
            self$$1.error(data, response);
        });
    },
    error: function error(data) {
        data.level = 'error';
        this.message(data);
    },
    message: function message(data) {
        var self$$1 = this;
        this.root.events.call('message', self$$1, data);
    },


    // Shortcut for fetch function in providers
    fetch: function fetch(url, options) {
        var fetch = providers.fetch;
        return arguments.length == 1 ? fetch(url) : fetch(url, options);
    }
};

//
// prototype for views
var protoView = assign({}, proto, {

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

    mount: function mount(el) {
        if (mounted$1(this)) warn('already mounted');else {
            el = element(el);
            if (el) {
                var parent = this.parent ? this.parent.model : null;
                this.model = createModel(getdirs(el, this.directives), this.model, parent);
                asView(this, el);
            }
        }
        return this;
    }
});

//
// prototype for components
var protoComponent = assign({}, proto, {

    render: function render() {},

    mount: function mount(el) {
        if (mounted$1(this)) warn('already mounted');else {
            var parent = this.parent ? this.parent.model : null,
                directives = getdirs(el, this.directives),
                model = createModel(directives, this.model, parent);
            //
            this.model = model;
            //
            // When a for d3-for loop is active we abort mounting this component
            // The component will be mounted as many times the the for loop requires
            if (mount$1(this.model, el)) return;

            var data = d3Selection.select(el).datum() || {};

            if (isArray(this.props)) {
                var key, value;
                this.props.forEach(function (prop) {
                    key = directives.attrs[prop];
                    if (model[key]) value = model[key];else value = maybeJson(key);
                    data[prop] = value;
                });
            }
            //
            // create the new element from the render function
            var newEl = this.render(data, directives.attrs);
            if (isPromise(newEl)) {
                var self$$1 = this;
                newEl.then(function (element) {
                    compile$$1(self$$1, el, element);
                });
            } else compile$$1(this, el, newEl);
        }
        return this;
    }
});

// factory of View and Component constructors
function createComponent(o, prototype) {
    prototype = prototype || protoView;
    if (isFunction(o)) o = { render: o };

    var obj = assign({}, o),
        classComponents = extendComponents(d3Collection.map(), pop$1(obj, 'components')),
        classDirectives = extendDirectives(d3Collection.map(), pop$1(obj, 'directives')),
        model = pop$1(obj, 'model'),
        props = pop$1(obj, 'props');

    function Component(options) {
        var parent = pop$1(options, 'parent'),
            components = d3Collection.map(parent ? parent.components : null),
            directives = d3Collection.map(parent ? parent.directives : coreDirectives),
            events = d3Dispatch.dispatch('message');

        classComponents.each(function (comp, key) {
            components.set(key, comp);
        });
        classDirectives.each(function (comp, key) {
            directives.set(key, comp);
        });
        extendComponents(components, pop$1(options, 'components'));
        extendDirectives(directives, pop$1(options, 'directives'));

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
        this.model = assign({}, model, pop$1(options, 'model'));
        this.init(options);
    }

    Component.prototype = assign({}, prototype, obj);

    function component(options) {
        return new Component(options);
    }

    component.prototype = Component.prototype;

    return component;
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

function asView(vm, element) {
    var model = vm.model;

    Object.defineProperty(sel(vm), 'el', {
        get: function get() {
            return element;
        }
    });

    Object.defineProperty(model, '$vm', {
        get: function get() {
            return vm;
        }
    });

    // Apply model to element
    d3Selection.select(element).model(model);

    mount$1(model, element);
    //
    // mounted hook
    d3Timer.timeout(function () {
        vm.mounted();
    });
}

function element(el) {
    if (!el) return warn('element not defined, pass an identifier or an HTMLElement object');
    var d3el = isFunction(el.node) ? el : d3Selection.select(el),
        element = d3el.node();
    if (!element) warn('could not find ' + el + ' element');else return element;
}

function mounted$1(view) {
    var mounted = view.isMounted;
    if (!mounted) Object.defineProperty(view, 'isMounted', {
        get: function get() {
            return true;
        }
    });
    return mounted;
}

function compile$$1(vm, el, element) {
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
    // Mount
    asView(vm, element);
}

// the view constructor
var index = createComponent();

// Add callback to execute when the DOM is ready
var dom = function (callback) {
    readyCallbacks.push(callback);
    if (document.readyState !== 'complete') {
        document.addEventListener('DOMContentLoaded', _completed);
        // A fallback to window.onload, that will always work
        window.addEventListener('load', _completed);
    } else domReady();
};

var readyCallbacks = [];

function _completed() {
    document.removeEventListener('DOMContentLoaded', _completed);
    window.removeEventListener('load', _completed);
    domReady();
}

function domReady() {
    var callback = void 0;
    while (readyCallbacks.length) {
        callback = readyCallbacks.shift();
        d3Timer.timeout(callback);
    }
}

var providers$1 = {
    logger: logger
};

var prefix$2 = '[d3-form]';

var warn$1 = function (msg) {
    providers$1.logger.warn(prefix$2 + ' ' + msg);
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();















var get$1 = function get$1(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get$1(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set$2 = function set$2(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set$2(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

var modelDataKeys = ['labelSrOnly', 'layout'];

var componentsFromType = {
    'text': 'input',
    'password': 'input',
    'number': 'input'
};

// return A promise which execute a callback at the next event Loop cycle
function nextTick(callback) {
    var self$$1 = this;
    return new Promise(function (resolve) {
        resolve();
    }).then(function () {
        return callback.call(self$$1);
    });
}

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
var field = assign({

    model: {
        error: '',
        isDirty: false,
        showError: {
            reactOn: ['error', 'isDirty', 'formSubmitted'],
            get: function get() {
                if (this.error) return this.isDirty || this.formSubmitted;
                return false;
            }
        }
    },

    mounted: function mounted() {
        this.model.$on('value', function () {
            this.isDirty = true;
        });
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
    set: function set(el, data) {
        var value = data.required;
        if (isString(value)) el.attr('d3-required', value);else el.property('required', value || null);
    },
    validate: function validate(el, value) {
        if (el.property('required')) {
            if (!value) return 'required';
        } else if (value === '') return true;
    }
};

var minlength = {
    set: function set(el, data) {
        var value = data.minlength;
        if (isString(value)) el.attr('d3-attr-minlength', value);else if (value !== undefined) el.attr('minlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('minlength');
        if (l === l && l > 0 && value.length < l) return 'too short - ' + l + ' characters or more expected';
    }
};

var maxlength = {
    set: function set(el, data) {
        var value = data.maxlength;
        if (isString(value)) el.attr('d3-attr-maxlength', value);else if (value !== undefined) el.attr('maxlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('maxlength');
        if (l === l && l > 0 && value.length > l) return 'too long - ' + l + ' characters or less expected';
    }
};

var min = {
    set: function set(el, data) {
        var value = data.min;
        if (isString(value)) el.attr('d3-attr-min', value);else if (value !== undefined) el.attr('min', value);
    },
    validate: function validate(el, value) {
        var r = range(el);
        if (r && +value < r[0]) return 'must be greater or equal ' + r[0];
    }
};

var max = {
    set: function set(el, data) {
        var value = data.max;
        if (isString(value)) el.attr('d3-attr-max', value);else if (value !== undefined) el.attr('max', value);
    },
    validate: function validate(el, value) {
        var r = range(el);
        if (r && +value > r[1]) return 'must be less or equal ' + r[1];
    }
};

var validators = {
    get: function get(model, custom) {
        var validators = this.all.slice(0);
        if (isObject(custom)) for (var key in custom) {
            validators.push(customValidator(key, custom[key]));
        }return validators;
    },
    set: function set(vm, el) {
        vm.model.validators.forEach(function (validator) {
            validator.set(el, vm.data);
        });

        vm.model.$on(this.validate);
    },
    validate: function validate(property) {
        if (property !== 'value') return;

        var vm = this.$vm,
            validators = this.validators,
            el = vm.sel.attr('id') === vm.data.id ? vm.sel : vm.sel.select('#' + vm.data.id),
            value = this.value,
            validator,
            msg;

        for (var i = 0; i < validators.length; ++i) {
            validator = validators[i];
            msg = validator.validate(el, value);
            if (msg) {
                if (msg === true) msg = '';
                break;
            }
        }

        this.error = msg || '';
    },


    all: [required, minlength, maxlength, min, max]
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
        set: function set(el, data) {
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
var input$1 = assign({

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('input').attr('id', data.id).attr('type', data.type || 'text').attr('name', data.name).attr('d3-value', 'value').attr('placeholder', data.placeholder);

        validators.set(this, el);
        return this.wrap(el);
    }
}, field);

//
// Textarea element
var textarea$1 = assign({

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('textarea').attr('id', data.id).attr('name', data.name).attr('placeholder', data.placeholder).attr('d3-value', 'value').attr('d3-validate', 'validators');

        validators.set(this, el);
        return this.wrap(el);
    }

}, field);

//
// Select element
var select$1 = assign({}, field, {

    model: assign({
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
var submit = assign({

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
        this.model.form.actions.submit.call(this, d3Selection.event);
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
    props: ['json'],

    model: {
        formSubmitted: false,
        formPending: false
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
            self$$1 = this;
        //
        model.inputs = {};
        model.form = this;
        //
        var json = data['json'];
        if (isString(json)) {
            var fetch = providers$1.fetch;
            return fetch(json, { method: 'GET' }).then(function (response) {
                if (response.status === 200) return response.json().then(build);else warn$1('Could not load form from ' + json + ': status ' + response.status);
            });
        } else return build(json);

        function build(formData) {
            modelData.call(self$$1, formData);
            //
            // Form validations
            model.validators = validators.get(model, data.validators);
            //
            // Form actions
            self$$1.actions = {};
            for (var key in actions) {
                var action = self$$1.data[key];
                if (isString(action)) action = self$$1.model.$get(action);
                self$$1.actions[key] = action || actions[key];
            }
            addChildren.call(self$$1, form);
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

    setSubmit: function setSubmit() {
        var _this = this;

        this.model.formSubmitted = true;
        this.model.formPending = true;
        return nextTick.call(this, function () {
            return _this.isValid();
        });
    },

    setSubmitDone: function setSubmitDone() {
        this.model.formPending = false;
    },

    isValid: function isValid() {
        var inp;
        for (var key in this.model.inputs) {
            inp = this.model.inputs[key];
            if (inp.error) return false;
        }
        return true;
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
            var self$$1 = this;
            _response.errors.forEach(function (error) {
                self$$1.inputError(error);
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
var index$1 = {

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
var index$2 = {

    install: function install(view) {
        var d3form = view.components.get('d3form');
        if (d3form) d3form.prototype.formTheme = bootstrap;
    }
};

var version$1 = "0.1.10";

exports.view = index;
exports.viewModel = model;
exports.viewExpression = viewExpression;
exports.viewReady = dom;
exports.viewProviders = providers;
exports.viewWarn = warn;
exports.viewForms = index$1;
exports.viewBootstrapForms = index$2;
exports.viewVersion = version$1;
exports.viewElement = htmlElement;
exports.viewTemplate = compile$1;
exports.viewHtml = html$1;

Object.defineProperty(exports, '__esModule', { value: true });

})));
