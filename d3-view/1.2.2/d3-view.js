// d3-view Version 1.2.2. Copyright 2018 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-collection'), require('d3-let'), require('d3-timer'), require('d3-selection'), require('d3-dispatch')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3-collection', 'd3-let', 'd3-timer', 'd3-selection', 'd3-dispatch'], factory) :
	(factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Collection,d3Let,d3Timer,d3Selection,d3Dispatch) { 'use strict';

//
// An isolated component
//
// Use this component to create a component with an isolated model
var isolated = {
    props: {
        tag: 'div'
    },

    render: function render(props, attrs, htmlEl) {
        var sel = this.createElement(props.tag);
        return sel.attr('id', attrs.id).attr('class', attrs.class).html(htmlEl.innerHTML);
    },
    createModel: function createModel(data) {
        var model = this.parent.model.$new(data);
        model.$$view = this;
        model.$$name = this.name;
        return model;
    }
};

var components = {
    isolated: isolated
};

var modules = new Map();
var queue = [];
var map$1 = queue.map;
var some = queue.some;
var hasOwnProperty$1 = queue.hasOwnProperty;





function requireFrom(resolver) {
  var require = requireRelative(null);

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
    return arguments.length > 1 ? Promise.all(map$1.call(arguments, require)).then(merge) : require(name);
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
      if (hasOwnProperty$1.call(m, k)) {
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
    return Promise.all(map$1.call(dependencies, function (name) {
      return isexports(name += "") ? exports : require(name);
    })).then(function (dependencies) {
      factory.apply(null, dependencies);
      return exports;
    });
  } : function (require) {
    return Promise.all(map$1.call(dependencies, require)).then(function (dependencies) {
      return typeof factory === "function" ? factory.apply(null, dependencies) : factory;
    });
  });
}

define.amd = {};

var isAbsolute = new RegExp('^([a-z]+://|//)');
var isRelative = new RegExp('^[.]{0,2}/');
var libs = new Map();
var nodeModules = new Map();
var inBrowser$1 = typeof window !== 'undefined' && window.document;

var viewRequire = requireWithLibs();

function isAbsoluteUrl(url) {
    return isAbsolute.test(url);
}

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
    var r = void 0;
    if (inBrowser$1) r = requireFrom(viewResolve);else r = nodeRequire;
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

/* istanbul ignore next */
function nodeRequire() {
    var module = void 0;
    var all = [];
    for (var i = 0; i < arguments.length; ++i) {
        module = nodeModules.get[arguments[i]];
        if (!module) {
            module = require(arguments[i]);
            nodeModules.set(arguments[i], module);
        }
        all.push(module);
    }
    return Promise.resolve(all.length > 1 ? merge$1(all) : all[0]);
}

/* istanbul ignore next */
function merge$1(modules) {
    var o = {},
        i = -1,
        n = modules.length,
        m,
        k;
    while (++i < n) {
        for (k in m = modules[i]) {
            if (hasOwnProperty.call(m, k)) {
                if (m[k] == null) Object.defineProperty(o, k, { get: getter$1(m, k) });else o[k] = m[k];
            }
        }
    }
    return o;
}

/* istanbul ignore next */
function getter$1(object, name) {
    return function () {
        return object[name];
    };
}

d3Let.logger.debug = null;

var providers = d3Let.assign({
    //
    require: viewRequire,
    //
    resolve: viewResolve,
    //
    // log messages
    logger: d3Let.logger,
    //
    // callbacks when page is loaded in browser
    readyCallbacks: [],
    // Set/unset debug
    setDebug: function setDebug(active) {
        if (!arguments.length || active) this.logger.debug = d3Let.isFunction(active) ? active : defaultDebug;else this.logger.debug = null;
    }
}, function () {
    if (d3Let.inBrowser) {
        return d3Let.assign({
            fetch: window.fetch,
            location: window.location
        }, window.d3);
    }
}());

function defaultDebug(msg) {
    this.info(msg);
}

var prefix = '[d3-view]';

function warn (msg) {
    providers.logger.warn(prefix + ' ' + msg);
}

var properties = d3Collection.map({
    disabled: 'disabled',
    readonly: 'readOnly',
    required: 'required'
});

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
        if (d3Let.isArray(value)) return warn('Cannot apply array to attribute ' + this.arg);
        var prop = properties.get(this.arg);
        if (prop) this.sel.property(prop, value || false);else this.sel.attr(this.arg, value || null);
    },
    refreshClass: function refreshClass(value) {
        var sel = this.sel;

        if (!d3Let.isArray(value)) value = [value];

        if (this.oldValue) this.oldValue.forEach(function (entry) {
            if (entry) sel.classed(entry, false);
        });

        this.oldValue = value.map(function (entry) {
            var exist = true;
            if (d3Let.isArray(entry)) {
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
//  attach html or text to the innerHtml property and mount components if required
//
//  Usage:
//      <div id="foo" d3-html="output"></div>
var html = {
    refresh: function refresh(model, html) {
        if (d3Let.isNumber(html)) html = '' + html;
        if (d3Let.isString(html)) {
            var dir = this,
                sel = this.sel,
                transition = this.passes ? this.transition(sel) : null;
            if (transition) {
                transition.style('opacity', 0).on('end', function () {
                    sel.html(html);
                    dir.selectChildren().mount();
                    dir.transition(sel).style('opacity', 1);
                });
            } else {
                sel.html(html);
                this.selectChildren().mount();
            }
        }
    }
};

//
// Evaluate a callback (optional) with given delay (optional)
//
// if delay is not given or 0, the callback is evaluated at the next tick
// of the event loop.
// Calling this method multiple times in the same event loop tick produces
// always the initial promise
function debounce (callback, delay) {
    var promise = null,
        self = void 0,
        args = void 0;

    function debounce() {
        self = this;
        args = arguments;
        if (promise !== null) return promise;

        promise = new Promise(function (resolve, reject) {

            d3Timer.timeout(function () {
                promise = null;
                try {
                    resolve(callback ? callback.apply(self, args) : undefined);
                } catch (err) {
                    reject(err);
                }
            }, delay);
        });

        return promise;
    }

    debounce.promise = function () {
        return promise;
    };

    return debounce;
}

function sel (o) {

    Object.defineProperty(o, 'sel', {
        get: function get() {
            return d3Selection.select(this.el);
        }
    });

    return o;
}

var base = {
    on: function on(model, attrName) {
        var refresh = refreshFunction(this, model, attrName),
            uid = model.uid;

        // DOM => model binding
        this.sel.on('input.' + uid, refresh).on('change.' + uid, refresh);
    },
    off: function off(model) {
        var uid = model.uid;
        this.sel.on('input.' + uid, null).on('change.' + uid, null);
    },
    value: function value(_value) {
        if (arguments.length) this.sel.property('value', _value);else return this.sel.property('value');
    }
};

function createValueType(proto) {

    function ValueType(el) {
        sel(this).el = el;
    }

    ValueType.prototype = d3Let.assign({}, base, proto);

    return ValueType;
}

function refreshFunction(vType, model, attrName) {

    return debounce(function () {
        model.$set(attrName, vType.value());
    });
}

var input = createValueType();

var checkbox = createValueType({
    value: function value(_value) {
        if (arguments.length) this.sel.property('checked', _value);else return this.sel.property('checked');
    }
});

var select$1 = createValueType({
    value: function value(_value) {
        var sel = this.sel,
            options = sel.selectAll('option'),
            values = _value,
            opt;

        if (arguments.length) {
            if (!d3Let.isArray(values)) values = [_value || ''];
            options.each(function () {
                opt = d3Selection.select(this);
                _value = opt.attr('value') || '';
                opt.property('selected', values.indexOf(_value) > -1);
            });
        } else {
            values = [];
            options.each(function () {
                opt = d3Selection.select(this);
                if (opt.property('selected')) values.push(opt.attr('value') || '');
            });
            if (sel.property('multiple')) return values;else return values[0] || '';
        }
    }
});

var types = {
    input: input,
    textarea: input,
    select: select$1,
    checkbox: checkbox
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
            ValueType = types[type] || types[tag];

        if (!ValueType) {
            this.logWarn('Cannot apply d3-value directive to ' + tag);
            return;
        }
        this.tag = new ValueType(this.el);
        return expression;
    },
    mount: function mount(model) {
        var expr = this.expression;
        // TODO: relax this constraint
        if (expr.parsed.type !== expr.codes.IDENTIFIER) {
            this.logWarn('support identifiers only, got "' + expr.parsed.type + '": ' + this.expression);
            return;
        }
        var attrName = this.expression.expr;
        //
        // Create the model reactive attribute
        model.$set(attrName, this.tag.value());
        // register dom event
        this.tag.on(model, attrName);
        return model;
    },
    refresh: function refresh(model, value) {
        this.tag.value(value);
    },
    destroy: function destroy(model) {
        this.tag.off(model);
    }
};

//
//  d3-on directive
//
//  A one-way data binding from dom events to model properties/methods
//  Event listeners are on the DOM, not on the model
var on = {
    mount: function mount(model) {
        var eventName = this.arg || 'click',
            expr = this.expression;

        // DOM event => model binding
        this.on(this.sel, eventName + '.' + this.uid, function (event$$1) {
            var md = model.$child();
            md.$event = event$$1;
            expr.eval(md);
        });

        this.bindDestroy(model);
        // Does not return the model so that model data binding is not performed
    },
    destroy: function destroy() {
        var eventName = this.arg || 'click';
        this.on(this.sel, eventName + '.' + this.uid, null);
    }
};

function template(source, context) {
    if (d3Let.isString(source)) {
        if (context) {
            var s = compile(source);
            if (!s) return source;
            source = s;
        } else return source;
    }
    return source(context);
}

function htmlElement(source, context, ownerDocument) {
    ownerDocument = ownerDocument || document;
    var el = d3Selection.select(ownerDocument.createElement('div'));
    el.html(template(source, context));
    var children = el.node().children;
    if (children.length !== 1) warn('viewElement function should return one root element only, got ' + children.length);
    return children[0];
}

function compile(text) {
    var compile = providers.compileTemplate;
    if (compile) return compile(text);
    warn('No compileTemplate function available in viewProviders, cannot render template');
}

function HttpResponse(response, data) {
    this.response = response;
    this.data = data;
    this.status = response.status;
    this.headers = response.headers;
    this.description = response.statusText;
}

function HttpError(response, data, description) {
    this.response = response;
    this.data = data;
    this.status = response.status;
    this.headers = response.headers;
    this.description = description || response.statusText;
}

function jsonResponse(response) {
    var ct = (response.headers.get('content-type') || '').split(';')[0];
    if (ct === 'application/json') return response.json().then(function (data) {
        return new HttpResponse(response, data);
    });else {
        var msg = response.status < 300 ? 'Expected "application/json" content type, got "' + ct + '"' : null;
        throw new HttpError(response, null, msg);
    }
}

function textResponse(response) {
    if (response.status < 300) return response.text().then(function (data) {
        return new HttpResponse(response, data);
    });else {
        throw new HttpError(response);
    }
}

HttpError.prototype = Error.prototype;

function asSelect (el) {
    if (el && !d3Let.isFunction(el.size)) return d3Selection.select(el);
    return el;
}

//
//  Base d3-view Object
//  =====================
//
var base$1 = {
    // d3-view object
    isd3: true,
    //
    providers: providers,
    //
    // Create a view element, same as createElement but compile it
    viewElement: function viewElement(source, context, ownerDocument) {
        if (!ownerDocument) ownerDocument = this.el ? this.el.ownerDocument : null;
        return htmlElement(source, context, ownerDocument);
    },

    //
    select: function select$$1(el) {
        return d3Selection.select(el);
    },

    //
    selectAll: function selectAll$$1(el) {
        return d3Selection.selectAll(el);
    },

    //
    createElement: function createElement(tag) {
        return d3Selection.select(document.createElement(tag));
    },

    // Shortcut for fetch function in providers
    fetch: function fetch(url, options) {
        var fetch = providers.fetch;
        return arguments.length == 1 ? fetch(url) : fetch(url, options);
    },

    //
    fetchText: function fetchText(url) {
        for (var _len = arguments.length, x = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            x[_key - 1] = arguments[_key];
        }

        return this.fetch.apply(this, [url].concat(x)).then(textResponse);
    },

    //
    json: function json(url) {
        for (var _len2 = arguments.length, x = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
            x[_key2 - 1] = arguments[_key2];
        }

        return this.fetch.apply(this, [url].concat(x)).then(jsonResponse);
    },

    //
    // render a template from a url
    renderFromUrl: function renderFromUrl(url, context) {
        var asElement = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

        var cache = this.cache;
        if (cache.has(url)) return Promise.resolve(render(cache.get(url), context, asElement));
        return this.fetchText(url).then(function (response) {
            cache.set(url, response.data);
            return render(response.data, context, asElement);
        });
    },

    //
    // render from a distribution name. Use d3-require resolve method to find the url
    renderFromDist: function renderFromDist(dist, path, context) {
        var asElement = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

        var resolve = providers.resolve;
        return this.renderFromUrl(resolve(dist, { path: path }), context, asElement);
    },

    //
    on: function on(el, name, callback) {
        el = asSelect(el);
        if (callback === null) return el.on(name, null);else el.on(name, function () {
            return callback(d3Selection.event);
        });
    },

    //
    selectChildren: function selectChildren(el) {
        if (!arguments.length) el = this.el;
        return this.selectAll(Array.prototype.slice.call(el.children));
    },

    //
    domEvent: function domEvent() {
        return d3Selection.event;
    },

    //
    logError: function logError(err) {
        if (err.stack) providers.logger.error(err);else providers.logger.error('[' + this.name + '] ' + err);
        return this;
    },

    //
    logWarn: function logWarn(msg) {
        providers.logger.warn('[' + this.name + '] ' + msg);
        return this;
    },

    //
    logInfo: function logInfo(msg) {
        providers.logger.info('[' + this.name + '] ' + msg);
        return this;
    },

    //
    logDebug: function logDebug(msg) {
        if (providers.logger.debug) providers.logger.debug('[' + this.name + '] ' + msg);
        return this;
    }
};

function render(text, context, asElement) {
    return asElement ? htmlElement(text, context) : template(text, context);
}

providers.transition = {
    duration: 0
};

var base$2 = d3Let.assign(base$1, {
    //
    // return a transition object if possible
    transition: function transition(sel) {
        if (!arguments.length) sel = this.sel;
        var duration = this.transitionDuration(sel);
        if (duration > 0) return sel.transition(this.uid).duration(duration);
    },
    transitionDuration: function transitionDuration(sel) {
        if (!arguments.length) sel = this.sel;
        if (sel && d3Let.isFunction(sel.transition) && sel.size()) {
            var duration = sel.attr('data-transition-duration');
            return +(duration === null ? providers.transition.duration : duration);
        }
        return 0;
    }
});

// Code originally from https://github.com/soney/jsep
// Copyright (c) 2013 Stephen Oney, http://jsep.from.so/
// Code modified and adapted to work with d3-view

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

function evaluate(self, expr, nested) {
    switch (expr.type) {
        case code.IDENTIFIER:
            return self[expr.name];
        case code.LITERAL:
            return nested ? self[expr.value] : expr.value;
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
            return evaluate(evaluate(self, expr.object), expr.property, true);
        case code.CONDITIONAL_EXP:
            return evaluate(self, expr.test) ? evaluate(self, expr.consequent) : evaluate(self, expr.alternate);
        case code.UNARY_EXP:
            return unaryExp(expr.operator, evaluate(self, expr.argument));
    }
}

// extract identifiers
function identifiers(expr, all) {
    if (arguments.length === 1) all = d3Collection.set();
    switch (expr.type) {
        case code.IDENTIFIER:
            all.add(expr.name);break;
        case code.ARRAY_EXP:
            expr.elements.forEach(function (elem) {
                return identifiers(elem, all);
            });
            break;
        case code.LOGICAL_EXP:
        case code.BINARY_EXP:
            identifiers(expr.left, all);
            identifiers(expr.right, all);
            break;
        case code.CALL_EXP:
            identifiers(expr.callee, all);
            expr.arguments.forEach(function (elem) {
                return identifiers(elem, all);
            });
            break;
        case code.MEMBER_EXP:
            all.add(fullName(expr));
            break;
        case code.CONDITIONAL_EXP:
            identifiers(expr.test, all);
            identifiers(expr.consequent, all);
            evaluate(expr.alternate, all);
            break;
        case code.UNARY_EXP:
            identifiers(expr.argument, all);
            break;
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

function fullName(expr) {
    if (expr.type === code.IDENTIFIER) return expr.name;else return fullName(expr.object) + '.' + expr.property.name;
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

    // evaluate identifiers from a model
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

function viewExpression (expr) {
    return new Expression(expr);
}

var UID = 0;
var prefix$1 = 'd3v';

// Add a unique identifier to an object
function uid (o) {
    var uid = prefix$1 + ++UID;

    if (arguments.length) {
        Object.defineProperty(o, 'uid', {
            get: function get() {
                return uid;
            }
        });

        return o;
    } else return uid;
}

function ddispatch () {
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
}

//
// Initialise a model
function asModel(model, initials, parent, isolated) {
    var events = d3Collection.map(),
        Child = null;

    // event handler for any change in the model
    events.set('', ddispatch());

    Object.defineProperties(uid(model), {
        $events: {
            get: function get() {
                return events;
            }
        },
        parent: {
            get: function get() {
                return parent;
            }
        },
        isolated: {
            get: function get() {
                return isolated;
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
        asModel(this, initials, model, false);
    }

    Child.prototype = model;
    return Child;
}

var modelStr = "[object d3Model]";

function toString () {
    return modelStr;
}

// Check if a value is a vanilla javascript object
function isVanillaObject (value) {
    return value && value.constructor === Object;
}

//  $set a reactive attribute for a Model
//
//  Set the value of an attribute in the model
//  If the attribute is not already reactive make it as such.
//
function $set (key, value) {
    // property not reactive - make it as such
    if (!this.$events.get(key)) reactive(this, key, value);else this[key] = value;
}

function isModel(value) {
    return d3Let.isObject(value) && value.toString() === '[object d3Model]';
}

function reactive(model, key, value) {
    var lazy;

    model.$events.set(key, ddispatch());

    Object.defineProperty(model, key, property());

    // Create a new model if value is an object
    value = typeValue(value);
    // Trigger the callback once for initialization
    model.$change(key);

    function update(newValue) {
        if (lazy) newValue = lazy.get.call(model);
        if (newValue === value) return;
        // trigger lazy callbacks
        //
        // Fire model events
        if (providers.logger.debug) {
            var modelName = model.$$name || 'model';
            providers.logger.debug('[d3-model] updating ' + modelName + '.' + key);
        }
        model.$change(key, value).$change();
        value = typeValue(newValue, value);
    }

    function property() {
        var prop = {
            get: function get() {
                return value;
            }
        };

        if (d3Let.isFunction(value)) value = { get: value };

        // calculated attribute
        if (isVanillaObject(value) && d3Let.isFunction(value.get)) {
            lazy = value;
            value = lazy.get.call(model);

            if (lazy.reactOn) lazy.reactOn.forEach(function (name) {
                model.$on(name + '.' + key, update);
            });else warn('reactive lazy property ' + key + ' does not specify \'reactOn\' list or properties');

            if (d3Let.isFunction(lazy.set)) prop.set = lazy.set;
        } else prop.set = update;

        return prop;
    }

    function typeValue(newValue, oldValue) {
        if (newValue === oldValue) return oldValue;else if (d3Let.isArray(newValue)) return arrayValue(newValue, oldValue);else if (isModel(oldValue)) return modelValue(newValue, oldValue);else return isVanillaObject(newValue) ? model.$new(newValue) : newValue;
    }

    function arrayValue(newValue, oldValue) {
        if (isModel(oldValue)) oldValue.$off();
        if (!d3Let.isArray(oldValue)) oldValue = [];
        for (var i = 0; i < newValue.length; ++i) {
            newValue[i] = typeValue(newValue[i], oldValue[i]);
        }return newValue;
    }

    function modelValue(newValue, oldValue) {
        if (isVanillaObject(newValue)) {
            oldValue.$update(newValue);
            return oldValue;
        } else {
            oldValue.$off();
            return typeValue(newValue);
        }
    }
}

// Add change callback to a model reactive attribute
function $on (name, callback) {

    // When no name is provided, wait for changes on this model - no its parents
    if (arguments.length === 1 && d3Let.isFunction(name)) {
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
}

function getEvent(model, name) {
    var event$$1 = model.$events.get(name);
    if (!event$$1 && model.parent) return getEvent(model.parent, name);
    return event$$1;
}

// Update a model with reactive model data
function $update (data, replace) {
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
}

// remove event handlers
function $off (attr) {
    if (attr === undefined) this.$events.each(function (event$$1) {
        return removeEvent(event$$1);
    });else {
        var bits = attr.split('.'),
            type = bits.splice(0, 1)[0],
            event$$1 = this.$events.get(type);
        if (event$$1) removeEvent(event$$1, bits.join('.'));
    }
}

function removeEvent(event$$1, name) {
    if (name) event$$1.on('change.' + name, null);else event$$1.on('change', null);
}

function slice (obj) {
    var idx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

    return Array.prototype.slice.call(obj, idx);
}

// trigger change event on a model reactive attribute
function $change (attribute) {
    var name = arguments.length ? attribute : '',
        event$$1 = this.$events.get(name),
        args = slice(arguments, 1);
    if (event$$1) event$$1.trigger.apply(this, args);else if (!this.isolated) this.parent.$change(name);else warn('attribute \'' + name + '\' is not a reactive property this model');
    return this;
}

//
//check if an attribute is a reactive attribute for the model (or its prototypical parent)
function $isReactive (attr) {
    if (!this.$events.has(attr)) {
        if (!this.parent || this.isolated) return false;
        return this.parent.$isReactive(attr);
    }
    return true;
}

//
//  Return the model owning the reactive attribute attr
function $owner (attr) {
    if (!this.$events.has(attr)) {
        if (!this.parent || this.isolated) return;
        return this.parent.$owner(attr);
    }
    return this;
}

function $data () {
    var model = this,
        data = {},
        keys = this.$events.keys().concat(Object.keys(this)),
        value;

    keys.forEach(function (key) {
        if (key) {
            value = getValue(model[key]);
            if (value !== undefined) data[key] = value;
        }
    });
    return data;
}

function getValue(value) {
    if (typeof value === 'function') return;
    if (value && typeof value.$data === 'function') return value.$data();
    return value;
}

//
//  Emit a custom event Name up the chain of parent models
function $emit (eventName, data) {
    var name = '$' + eventName;
    propagate(this, name, data, this);
    return this;
}

function propagate(model, name, data, originModel) {
    if (!model) return;
    if (model.hasOwnProperty(name) && d3Let.isFunction(model[name])) {
        if (model[name](data, originModel) === false) return;
    }
    propagate(model.parent, name, data, originModel);
}

function $push(attr, value) {
    var array = this[attr].slice();
    array.push(value);
    this[attr] = array;
    return this;
}

function $splice(attr, idx, count) {
    var array = this[attr].slice();
    if (arguments.length == 2) array.splice(idx);else if (arguments.length == 3) array.splice(idx, count);
    this[attr] = array;
    return this;
}

//
//  Model class
//
//  The model is at the core of d3-view reactive data component
function Model(initials, parent) {
    asModel(this, initials, parent, true);
}

function model(initials) {
    return new Model(initials);
}

model.prototype = Model.prototype = {
    constructor: Model,
    // Public API methods
    toString: toString,
    $on: $on,
    $change: $change,
    $emit: $emit,
    $update: $update,
    $set: $set,
    $new: $new,
    $off: $off,
    $isReactive: $isReactive,
    $owner: $owner,
    $data: $data,
    $push: $push,
    $splice: $splice
};

Object.defineProperties(Model.prototype, {
    root: {
        get: function get() {
            return this.parent ? this.parent.root : this;
        }
    },
    isolatedRoot: {
        get: function get() {
            return !this.isolated && this.parent ? this.parent.isolatedRoot : this;
        }
    }
});

function $new(initials) {
    return new Model(initials, this);
}

var viewEvents = d3Dispatch.dispatch('message', 'component-created', 'component-mount', 'component-mounted', 'directive-refresh');

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

    // hooks
    create: function create(expression) {
        return expression;
    },


    // pre mount
    preMount: function preMount() {},
    mount: function mount(model$$1) {
        return model$$1;
    },
    refresh: function refresh() {},
    destroy: function destroy() {},
    removeAttribute: function removeAttribute() {
        this.el.removeAttribute(this.name);
    },


    // Execute directive
    execute: function execute(model$$1) {
        if (!this.active) return;
        this.removeAttribute();
        this.identifiers = [];
        model$$1 = this.mount(model$$1);
        // If model returned, bind the element to its properties
        if (model$$1) this.bindModel(model$$1);
    },
    bindModel: function bindModel(model$$1) {
        var dir = this,
            error = false,
            refresh = function refresh() {
            var value = dir.expression ? dir.expression.eval(model$$1) : dir.data;
            dir.refresh(model$$1, value);
            dir.passes++;
            viewEvents.call('directive-refresh', undefined, dir, model$$1, value);
        };
        //
        // get the cache instance
        dir.cache = model$$1.$$view.cache;

        // Bind expression identifiers with model
        var bits = void 0,
            target = void 0,
            attr = void 0,
            i = void 0;
        if (dir.data) {
            dir.data = model$$1.$new(dir.data);
            dir.identifiers.push({
                model: dir.data,
                attr: ''
            });
        } else if (!this.expression) {
            dir.identifiers.push({
                model: model$$1,
                attr: ''
            });
        } else {
            var modelEvents = d3Collection.map();
            this.expression.identifiers().forEach(function (identifier) {
                bits = identifier.split('.');
                target = model$$1;
                attr = null;

                for (i = 0; i < bits.length - 1; ++i) {
                    target = target[bits[i]];
                    if (!d3Let.isObject(target)) {
                        attr = bits.slice(0, i + 1).join('.');
                        dir.logError('"' + attr + '" is not an object, cannot bind to "' + identifier + '" identifier');
                        error = true;
                        break;
                    }
                }

                // process attribute
                if (attr === null) {
                    if (!(target instanceof model)) {
                        dir.logError(identifier + ' is not a reactive model. Cannot bind to it');
                        error = true;
                    } else addTarget(modelEvents, target, bits[bits.length - 1]);
                }
            });

            // register with model reactive properties
            modelEvents.each(function (target) {
                // if we are listening to all event simply bind to the model changes
                if (target.events.has('')) dir.identifiers.push({
                    model: target.model,
                    attr: ''
                });else target.events.each(function (attr) {
                    dir.identifiers.push({
                        model: target.model,
                        attr: attr
                    });
                });
            });
        }

        if (error) return;

        this.identifiers.forEach(function (identifier) {
            var event$$1 = identifier.attr + '.' + dir.uid;
            identifier.model.$on(event$$1, refresh);
        });

        this.bindDestroy(model$$1);

        refresh();
    },
    bindDestroy: function bindDestroy(model$$1) {
        var dir = this,
            destroy = this.destroy;
        // bind destroy to the model
        dir.destroy = function () {
            dir.identifiers.forEach(function (identifier) {
                identifier.model.$off(identifier.attr + '.' + dir.uid);
            });
            if (dir.data) dir.data.$off();
            try {
                destroy.call(dir, model$$1);
            } finally {
                model$$1.$emit('destroyDirective', dir);
            }
        };
    }
};

// Directive constructor
function createDirective (obj) {

    function Directive(el, attr, arg) {
        this.el = el;
        this.name = attr.name;
        this.arg = arg;
        this.passes = 0;
        var expr = sel(uid(this)).create(attr.value);
        if (expr) {
            try {
                this.expression = viewExpression(expr);
            } catch (e) {
                try {
                    this.data = JSON.parse(expr);
                } catch (m) {
                    this.logError(e);
                }
            }
        }
        if (!this.active) this.active = Boolean(!attr.value || this.expression || this.data);
    }

    Directive.prototype = d3Let.assign({}, base$2, prototype, obj);

    function directive(el, attr, arg) {
        return new Directive(el, attr, arg);
    }

    directive.prototype = Directive.prototype;
    return directive;
}

function addTarget(modelEvents, model$$1, attr) {
    var value = arguments.length === 3 ? model$$1[attr] : undefined;
    //
    // a method of the model, event is at model level
    if (d3Let.isFunction(value) || arguments.length === 2) getTarget(modelEvents, model$$1).events.add('');
    // value is another model, events at both target model level and value model level
    else if (value instanceof model) {
            addTarget(modelEvents, value);
            model$$1 = model$$1.$owner(attr);
            if (model$$1) getTarget(modelEvents, model$$1).events.add('');
        } else {
            // make sure attr is a reactive property of model
            model$$1 = model$$1.$owner(attr) || model$$1;
            if (!model$$1.$isReactive(attr)) model$$1.$set(attr, value);
            getTarget(modelEvents, model$$1).events.add(attr);
        }
}

function getTarget(modelEvents, model$$1) {
    var target = modelEvents.get(model$$1.uid);
    if (!target) {
        target = {
            model: model$$1,
            events: d3Collection.set()
        };
        modelEvents.set(model$$1.uid, target);
    }
    return target;
}

function maybeJson (value) {
    if (d3Let.isString(value)) {
        try {
            return JSON.parse(value);
        } catch (msg) {
            return value;
        }
    }
    return value;
}

var DATAPREFIX = 'data-';

function dataAttributes (attrs) {
    var keys = Object.keys(attrs);
    var p = void 0;
    return keys.reduce(function (o, key) {
        if (key.substring(0, 5) === DATAPREFIX) {
            p = key.split('-').splice(1).reduce(function (s, key, idx) {
                s += idx ? key.substring(0, 1).toUpperCase() + key.substring(1) : key;
                return s;
            }, '');
            o[p] = d3Let.pop(attrs, key);
        }
        return o;
    }, {});
}

function Cache() {
    this.active = true;
    this.data = new Map();
}

Cache.prototype = {
    constructor: Cache,
    set: function set$$1(key, value) {
        if (this.active) this.data.set(key, value);
    },
    get: function get(key) {
        if (this.active) return this.data.get(key);
    },
    has: function has(key) {
        if (this.active) return this.data.has(key);
        return false;
    },
    clear: function clear() {
        return this.data.clear();
    },
    delete: function _delete(key) {
        return this.data.delete(key);
    }
};

// prototype for both views and components
var protoComponent = {
    //
    // hooks
    render: function render() {},
    childrenMounted: function childrenMounted() {},
    mounted: function mounted() {},
    destroy: function destroy() {},

    //
    // Mount the component into an element
    // If this component is already mounted, or it is mounting, it does nothing
    mount: function mount(el, data, onMounted) {
        var _this = this;

        if (mounted(this)) return;
        // fire mount events
        this.events.call('mount', undefined, this, el, data);
        // remove mounted events
        this.events.on('mount', null);
        // fire global mount event
        viewEvents.call('component-mount', undefined, this, el, data);
        var sel$$1 = this.select(el),
            directives = sel$$1.directives(),
            dattrs = directives ? directives.attrs : attributes(el),
            parentModel = this.parent.model,
            datum = sel$$1.datum();

        var props = this.props,
            model$$1 = this.model,
            modelData = d3Let.assign(dataAttributes(dattrs), datum, data),
            key = void 0,
            value = void 0;

        data = d3Let.assign({}, datum, data);

        // override model keys from data object and element attributes
        for (key in model$$1) {
            value = d3Let.pop(modelData, key);
            if (value !== undefined) {
                if (d3Let.isString(value)) {
                    if (parentModel.$isReactive(value)) {
                        if (value !== key) model$$1[key] = reactiveParentProperty(key, value);else delete model$$1[key];
                    } else model$$1[key] = maybeJson(value);
                } else model$$1[key] = value;
            }
        }

        // Create model
        this.model = model$$1 = this.createModel(model$$1);
        if (d3Let.isArray(props)) props = props.reduce(function (o, key) {
            o[key] = undefined;
            return o;
        }, {});

        if (d3Let.isObject(props)) {
            Object.keys(props).forEach(function (key) {
                value = maybeJson(modelData[key] === undefined ? data[key] === undefined ? dattrs[key] : data[key] : modelData[key]);
                if (value !== undefined) {
                    // data point to a model attribute
                    if (d3Let.isString(value) && model$$1[value]) value = model$$1[value];
                    data[key] = value;
                } else if (props[key] !== undefined) {
                    data[key] = props[key];
                }
            });
        }
        //
        // create the new element from the render function
        this.props = data;
        var newEl = this.render(data, dattrs, el);
        if (!newEl.then) newEl = Promise.resolve(newEl);
        return newEl.then(function (element) {
            return compile$1(_this, el, element, onMounted);
        });
    },
    createModel: function createModel(data) {
        var model$$1 = this.parent ? this.parent.model.$child(data) : model(data);
        model$$1.$$view = this;
        model$$1.$$name = this.name;
        return model$$1;
    }
};

// factory of View and Component constructors
function createComponent(name, o, coreDirectives, coreComponents) {
    if (d3Let.isFunction(o)) o = { render: o };

    var obj = d3Let.assign({}, o),
        classComponents = extendComponents(d3Collection.map(), d3Let.pop(obj, 'components')),
        classDirectives = extendDirectives(d3Collection.map(), d3Let.pop(obj, 'directives')),
        model$$1 = d3Let.pop(obj, 'model');

    function Component(options) {
        var parent = d3Let.pop(options, 'parent'),
            components = d3Collection.map(parent ? parent.components : coreComponents),
            directives = d3Collection.map(parent ? parent.directives : coreDirectives),
            events = d3Dispatch.dispatch('message', 'mount', 'mounted'),
            cache = parent ? null : new Cache();

        classComponents.each(function (comp, key) {
            components.set(key, comp);
        });
        classDirectives.each(function (comp, key) {
            directives.set(key, comp);
        });
        extendComponents(components, d3Let.pop(options, 'components'));
        extendDirectives(directives, d3Let.pop(options, 'directives'));

        Object.defineProperties(this, {
            name: {
                get: function get() {
                    return name;
                }
            },
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
            cache: {
                get: function get() {
                    return parent ? parent.cache : cache;
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
        this.model = d3Let.assign({}, d3Let.isFunction(model$$1) ? model$$1() : model$$1, d3Let.pop(options, 'model'));
        viewEvents.call('component-created', undefined, this);
    }

    Component.prototype = d3Let.assign({}, base$2, protoComponent, obj);

    function component(options) {
        return new Component(options);
    }

    component.prototype = Component.prototype;

    return component;
}

// Used by both Component and view

function extendComponents(container, components) {
    d3Collection.map(components).each(function (obj, key) {
        container.set(key, createComponent(key, obj, protoComponent));
    });
    return container;
}

function extendDirectives(container, directives) {
    d3Collection.map(directives).each(function (obj, key) {
        container.set(key, createDirective(obj));
    });
    return container;
}

//
//  Finalise the binding between the view and the model
//  inject the model into the view element
//  call the mounted hook and can return a Promise
function asView(vm, element, onMounted) {

    Object.defineProperty(sel(vm), 'el', {
        get: function get() {
            return element;
        }
    });
    // Apply model to element and mount
    return vm.select(element).view(vm).mount(null, onMounted).then(function () {
        return vmMounted(vm, onMounted);
    });
}

function mounted(vm, onMounted) {
    if (vm.isMounted === undefined) {
        vm.isMounted = false;
        return false;
    } else if (vm.isMounted) {
        vm.logWarn('component already mounted');
    } else {
        vm.isMounted = true;
        // invoke mounted component hook
        vm.mounted();
        // invoke onMounted callback if available
        if (onMounted) onMounted(vm);
        // last invoke the view mounted events
        vm.events.call('mounted', undefined, vm);
        // remove mounted events
        vm.events.on('mounted', null);
        // fire global event
        viewEvents.call('component-mounted', undefined, vm);
    }
    return true;
}

// Internals

//
//  Component/View mounted
//  =========================
//
//  This function is called when a component/view has all its children added
function vmMounted(vm, onMounted) {
    var parent = vm.parent;
    vm.childrenMounted();
    if (parent && !parent.isMounted) parent.events.on('mounted.' + vm.uid, function () {
        mounted(vm, onMounted);
    });else mounted(vm, onMounted);
    return vm;
}

// Compile a component model
// This function is called once a component has rendered the component element
function compile$1(cm, origEl, element, onMounted) {
    if (d3Let.isString(element)) {
        var props = Object.keys(cm.props).length ? cm.props : null;
        element = cm.viewElement(element, props, origEl.ownerDocument);
    }
    if (!element) return cm.logWarn('render function must return a single HTML node. It returned nothing!');
    element = asSelect(element);
    if (element.size() !== 1) cm.logWarn('render function must return a single HTML node');
    element = element.node();
    //
    // Insert before the component element
    origEl.parentNode.insertBefore(element, origEl);
    // remove the component element
    cm.select(origEl).remove();
    //
    return asView(cm, element, onMounted);
}

function attributes(element) {
    var attrs = {};
    var attr = void 0;
    for (var i = 0; i < element.attributes.length; ++i) {
        attr = element.attributes[i];
        attrs[attr.name] = attr.value;
    }
    return attrs;
}

function reactiveParentProperty(key, value) {
    return {
        reactOn: [value],
        get: function get() {
            return this[value];
        },
        set: function set$$1() {
            this.$$view.logError('Cannot set "' + key + '" value because it is owned by a parent model');
        }
    };
}

// No value, it has its own directive
var attributes$1 = ['name', 'class', 'disabled', 'readonly', 'required', 'href'];

function getdirs (element, directives) {
    var sel = d3Selection.select(element),
        dirs = sel.directives();
    if (dirs) return dirs;
    dirs = new Directives();

    if (!directives) return dirs;

    for (var i = 0; i < element.attributes.length; ++i) {
        var attr = element.attributes[i],
            bits = attr.name.split('-'),
            dirName = bits[0] === 'd3' ? bits[1] : null,
            arg = void 0;

        if (dirName) {
            arg = bits.slice(2).join('-');
            if (!arg && attributes$1.indexOf(dirName) > -1) {
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
}

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
        return Promise.all(this.all.map(function (d) {
            return d.execute(model);
        }));
    }
};

// Extend selection prototype with new methods
d3Selection.selection.prototype.mount = mount;
d3Selection.selection.prototype.view = view;
d3Selection.selection.prototype.model = model$1;
d3Selection.selection.prototype.directives = directives;

function directives(value) {
    return arguments.length ? this.property("__d3_directives__", value) : this.node().__d3_directives__;
}

function model$1() {
    var vm = this.view();
    return vm ? vm.model : null;
}

function view(value) {
    if (arguments.length) {
        return this.property("__d3_view__", value);
    } else {
        var element = this.node(),
            view = element ? element.__d3_view__ : null,
            parent = element ? element.parentNode : null;

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
// THis method returns nothing or a promise
function mount(data, onMounted) {
    var promises = [];
    this.each(function () {
        var view = d3Selection.select(this).view();
        if (view) promises.push(mountElement(this, view, data, onMounted));else warn('Cannot mount, no view object available to mount to');
    });
    return Promise.all(promises);
}

// mount an element into a given model
function mountElement(element, vm, data, onMounted) {
    if (!element || !element.tagName) return;

    var component = vm.components.get(element.tagName.toLowerCase()),
        directives = getdirs(element, vm.directives),
        preMount = directives.preMount();

    if (preMount) return preMount.execute(vm.model);else {
        var promises = void 0;
        if (component) promises = [component({ parent: vm }).mount(element, data, onMounted)];else promises = slice(element.children).map(function (c) {
            return mountElement(c, vm, data, onMounted);
        });

        return Promise.all(promises).then(function () {
            return directives.execute(vm.model);
        });
    }
}

//
// prototype for views
var protoView = {
    use: function use(plugin) {
        if (d3Let.isObject(plugin)) plugin.install(this);else plugin(this);
        return this;
    },
    addComponent: function addComponent(name, obj) {
        var component = createComponent(name, obj);
        this.components.set(name, component);
        return component;
    },
    addDirective: function addDirective(name, obj) {
        var directive = createDirective(obj);
        this.directives.set(name, directive);
        return directive;
    },
    mount: function mount(el, callback) {
        if (mounted(this)) return;
        if (!el) return this.logWarn('element not defined, pass an identifier or an HTMLElement object');
        el = asSelect(el).node();
        if (!el) return this.logWarn('element not defined, pass an identifier or an HTMLElement object');
        viewEvents.call('component-mount', undefined, this, el);
        this.model = this.createModel(this.model);
        return asView(this, el, callback);
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
        if (!d3Let.isArray(items)) return;
        var d = void 0;

        var creator = this.creator,
            selector = creator.tagName + '.' + this.itemClass,
            itemName = this.itemName,
            sel = this.sel,
            allItems = sel.selectAll(selector),
            entries = allItems.filter(function () {
            d = this.__d3_view__.model[itemName];
            return items.indexOf(d) > -1;
        }).data(items),
            exits = allItems.filter(function () {
            d = this.__d3_view__.model[itemName];
            return items.indexOf(d) === -1;
        }),
            forView = createComponent('forView', protoView),
            vm = sel.view();

        var x = void 0,
            el = void 0,
            fel = void 0,
            tr = void 0;

        (this.transition(exits) || exits).style('opacity', 0).remove();

        entries.enter().append(function () {
            el = creator.cloneNode(true);
            fel = vm.select(el);
            if (vm.transitionDuration(fel) > 0) fel.style('opacity', 0);
            return el;
        }).classed(this.itemClass, true).each(function (d, index) {
            x = { index: index };
            x[itemName] = d;
            forView({
                model: x,
                parent: vm
            }).mount(this, function (fv) {
                // replace the item with a property from the model
                // This allow for reactivity when d is an object
                items[index] = fv.model[itemName];
                tr = fv.transition();
                if (tr) tr.style('opacity', 1);
            });
        }).merge(entries).each(function (d) {
            // update model itemName property
            this.__d3_view__.model[itemName] = d;
        });
    }
};

//
//  d3-if
//  =============
//
//  Show or hide an element
//
var d3If = {
    mount: function mount(model) {
        var sel = this.sel;
        this.display = sel.style('display');
        if (!this.display || this.display === 'none') this.display = 'block';
        return model;
    },
    refresh: function refresh(model, value) {
        var sel = this.sel,
            transition = this.passes ? this.transition(sel) : null;

        if (value) sel.style('display', this.display);else if (!transition) sel.style('display', 'none');

        if (transition) {
            if (value) transition.style('opacity', 1);else transition.style('opacity', 0).on('end', function () {
                return sel.style('display', 'none');
            });
        }
    }
};

var directives$1 = {
    attr: attr,
    html: html,
    value: value,
    on: on,
    'for': d3For,
    'if': d3If
};

if (d3Let.inBrowser && window.MutationObserver) {
    // DOM observer
    // Check for changes in the DOM that leads to visual actions
    var observer = new window.MutationObserver(visualManager);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

//
//  Clears element going out of scope
function visualManager(records) {
    var sel = void 0,
        nodes = void 0,
        node = void 0,
        vm = void 0;

    records.forEach(function (record) {
        nodes = record.removedNodes;
        if (!nodes || !nodes.length) return;
        vm = record.target ? d3Selection.select(record.target).view() : null;

        for (var i = 0; i < nodes.length; ++i) {
            node = nodes[i];
            if (!node.querySelectorAll) continue;
            sel = d3Selection.select(node);
            if (vm || sel.view()) {
                sel.selectAll('*').each(destroy);
                destroy.call(nodes[i]);
            }
        }
    });
}

function destroy() {
    var dirs = this.__d3_directives__,
        view = this.__d3_view__;
    if (dirs) {
        dirs.all.forEach(function (d) {
            return d.destroy();
        });
        delete this.__d3_directives__;
    }
    if (view) {
        view.destroy();
        delete this.__d3_view__;
    }
}

// Core Directives
var coreDirectives = extendDirectives(d3Collection.map(), directives$1);
var coreComponents = extendComponents(d3Collection.map(), components);

// the root view constructor
function main (config) {
    var viewClass = createComponent('view', protoView, coreDirectives, coreComponents);
    return viewClass(config);
}

// Add callback to execute when the DOM is ready
function dom (callback) {
    providers.readyCallbacks.push(callback);
    /* istanbul ignore next */
    if (document.readyState !== 'complete') {
        document.addEventListener('DOMContentLoaded', _completed);
        // A fallback to window.onload, that will always work
        window.addEventListener('load', _completed);
    } else domReady();
}

/* istanbul ignore next */
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

var properties$1 = d3Collection.map({
    disabled: 'disabled',
    readonly: 'readOnly',
    required: 'required'
});

//
// Mixin for all form elements
var formElement = {
    inputData: function inputData(el, data) {
        var model = this.model;
        if (!data) data = {};
        data.id = data.id || model.uid;
        model.data = data;
        el.attr('id', data.id);
        if (data.classes) el.classed(data.classes, true);
        addAttributes(el, model, data.attributes);
        properties$1.each(function (prop, key) {
            var value = data[key];
            if (value) {
                if (d3Let.isString(value)) el.attr('d3-attr-' + key, value);else el.property(prop, true);
            }
        });
        return data;
    },


    // wrap the form element with extensions
    wrap: function wrap(fieldEl) {
        var field = this,
            wrappedEl = fieldEl;

        field.model.$formExtensions.forEach(function (extension) {
            wrappedEl = extension(field, wrappedEl, fieldEl) || wrappedEl;
        });

        return wrappedEl;
    },
    wrapTemplate: function wrapTemplate(sel, template) {
        var div = document.createElement('div'),
            outer = d3Selection.select(div).html(template),
            slot = outer.select('slot');

        if (!slot.size()) {
            this.logWarn('template does not provide a slot element');
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
var field = d3Let.assign({}, formElement, {

    model: {
        value: null,
        error: '',
        isDirty: null,
        changed: false,
        srOnly: false,
        placeholder: '',
        showError: {
            reactOn: ['error', 'isDirty'],
            get: function get() {
                if (this.error) return this.isDirty;
                return false;
            }
        },
        // default validate function does nothing, IMPORTANT!
        $validate: function $validate() {}
    },

    inputData: function inputData(el, data) {
        // call parent method
        data = formElement.inputData.call(this, el, data);
        if (!data.name) return this.logError('Input field without a name');

        el.attr('name', data.name);
        data.placeholder = data.placeholder || data.label || data.name;
        var model = this.model;
        //
        // add this model to the form inputs object
        model.form.inputs[data.name] = model;
        //
        // give name to model (for debugging info messages)
        model.name = data.name;
        //
        // bind to the value property (two-way binding when used with d3-value)
        model.$on('value', function () {
            // set isDirty to false if first time here, otherwise true
            if (model.isDirty === null) {
                model.isDirty = false;
            } else {
                model.isDirty = true;
                model.changed = true;
            }
            // trigger a change event in the form
            // required for form method such as $isValid
            model.form.$change();
            model.$emit('formFieldChange', model);
        });
        return data;
    }
});

function addAttributes(el, model, attributes) {
    var expr, attr;

    if (!d3Let.isObject(attributes)) return;

    for (attr in attributes) {
        expr = attributes[attr];
        if (d3Let.isObject(expr)) expr = JSON.stringify(expr);
        el.attr(attr, expr || '');
    }
}

var componentsFromType = {
    text: 'input',
    email: "input",
    password: 'input',
    checkbox: 'input',
    number: 'input',
    date: 'input',
    url: 'input',
    'datetime-local': 'input'
};

function formComponent(child) {
    var type = child.type || 'text';
    return componentsFromType[type] || type;
}

function addChildren(sel) {
    var children = this.model.data.children;
    if (children) {
        if (!d3Let.isArray(children)) {
            this.logError('children should be an array of fields, got ' + (typeof children === 'undefined' ? 'undefined' : babelHelpers.typeof(children)));
            return sel;
        }
        sel.selectAll('.d3form').data(children).enter().append(formChild).classed('d3form', true);
    }
    return sel;
}

function formChild(child) {
    var component = formComponent(child);
    return document.createElement('d3-form-' + component);
}

//
// Fieldset element
var fieldset = d3Let.assign({}, formElement, {
    render: function render(data) {
        var tag = data ? data.tag || 'fieldset' : 'fieldset',
            el = this.createElement(tag);
        data = this.inputData(el, data);
        return addChildren.call(this, el);
    }
});

var required = {
    set: function set$$1(el, data) {
        var value = data.required;
        if (d3Let.isString(value)) el.attr('d3-required', value);else el.property('required', value || false);
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
        if (d3Let.isString(value)) el.attr('d3-attr-minlength', value);else if (value !== undefined) el.attr('minlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('minlength');
        if (l === l && l > 0 && value.length < l) return 'too short - ' + l + ' characters or more expected';
    }
};

var maxLength = {
    set: function set$$1(el, data) {
        var value = data.maxLength;
        if (d3Let.isString(value)) el.attr('d3-attr-maxlength', value);else if (value !== undefined) el.attr('maxlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('maxlength');
        if (l === l && l > 0 && value && value.length > l) return 'too long - ' + l + ' characters or less expected';
    }
};

var minimum = {
    set: function set$$1(el, data) {
        var value = data.minimum;
        if (d3Let.isString(value)) el.attr('d3-attr-min', value);else if (value !== undefined) el.attr('min', value);
    },
    validate: function validate(el, value) {
        var r = range(el);
        if (r && +value < r[0]) return 'must be greater or equal ' + r[0];
    }
};

var maximum = {
    set: function set$$1(el, data) {
        var value = data.maximum;
        if (d3Let.isString(value)) el.attr('d3-attr-max', value);else if (value !== undefined) el.attr('max', value);
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
        if (d3Let.isObject(custom)) for (var key in custom) {
            validators.push(customValidator(key, custom[key]));
        }return validators;
    },


    // add model validators to a form-field
    set: function set$$1(vm, el) {
        var model = vm.model;
        model.validators.forEach(function (validator) {
            return validator.set(el, model.data);
        });
        model.$on('value.validate', this.validate);
        model.$validate = this.validate;
    },
    validate: function validate() {
        var model = this,
            vm = model.$$view,
            validators = model.validators,
            value = model.value,
            el = vm.sel.attr('id') === model.data.id ? vm.sel : vm.sel.select('#' + model.data.id),
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

var checks = ['checkbox', 'radio'];

//
// Input element
var input$1 = d3Let.assign({}, field, {
    render: function render(data) {
        var el = this.createElement('input');
        data = this.inputData(el, data);

        el.attr('type', data.type || 'text').attr('d3-value', 'value');

        if (checks.indexOf(el.attr('type')) === -1) el.attr('placeholder', data.placeholder);

        validators.set(this, el);
        return this.wrap(el);
    }
});

//
// Textarea element
var textarea = d3Let.assign({}, field, {
    render: function render(data) {
        var el = this.createElement('textarea');
        data = this.inputData(el, data);
        el.attr('placeholder', data.placeholder).attr('d3-value', 'value');

        validators.set(this, el);
        return this.wrap(el);
    }
});

//
// Select element
var select$2 = d3Let.assign({}, field, {

    model: d3Let.assign({
        options: [],
        $optionLabel: optionLabel,
        $optionValue: optionValue
    }, field.model),

    render: function render(data) {
        var el = this.createElement('select');
        data = this.inputData(el, data);
        el.attr('d3-value', 'value').attr('placeholder', data.placeholder).append('option').attr('d3-for', 'option in options').attr('d3-html', '$optionLabel()').attr('d3-attr-value', '$optionValue()');

        validators.set(this, el);
        return this.wrap(el);
    }
});

function optionValue() {
    if (d3Let.isArray(this.option)) return this.option[0];
    return this.option;
}

function optionLabel() {
    if (d3Let.isArray(this.option)) return this.option[1] || this.option[0];
    return this.option;
}

//
// Submit element
var submit = d3Let.assign({}, formElement, {
    render: function render(data) {
        var tag = data ? data.tag || 'button' : 'button',
            el = this.createElement(tag);

        data = this.inputData(el, data);
        var model = this.model;
        //
        // model non-reactive attributes
        model.type = data.type || 'submit';
        if (data.endpoint) model.endpoint = data.endpoint;
        //
        // default submit function
        model.$submit = function () {
            if (d3Selection.event && d3Selection.event.defaultPrevented) return;
            model.actions.submit.call(model, d3Selection.event);
        };
        if (!data.submit) data.submit = '$submit()';

        el.attr('type', model.type).attr('name', model.name).attr('d3-on-click', data.submit).html(data.label || 'submit');

        return this.wrap(el);
    }
});

//
//  Form Responses
//  ====================
//
//  To add/override responses:
//
//  import viewForms from 'd3-view'
//
//  viewForms.responses.myresponse = function (data, status, headers) {
//      ...
//  }
var responses = {
    "default": defaultResponse,
    redirect: redirect
};

// The default response emit a formMessage to event to parent models
function defaultResponse(response) {
    var level = response.status < 300 ? 'info' : response.status < 500 ? 'warning' : 'error';
    this.$emit('formMessage', {
        level: level,
        data: response.data,
        response: response
    });
}

function redirect(response) {
    var location = this.$$view.providers.location;
    location.href = response.data.redirectTo || '/';
}

//
// Form Actions
var actions = {
    submit: submit$1
};

var messages = {
    default: '<strong>Error!</strong> Could not submit form'
};

var endpointDefauls = {
    contentType: 'application/json',
    method: 'POST'
};

//
// Submit action
function submit$1(e) {
    var submit = this,
        form = submit.form,
        view = submit.$$view,
        endpoint = d3Let.assign({}, endpointDefauls, submit.endpoint);

    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    var data = form.$inputData(),
        options = {};

    if (!endpoint.url) {
        view.logError('No url, cannot submit form');
        return;
    }

    if (endpoint.contentType === 'application/json') {
        options.headers = {
            'Content-Type': endpoint.contentType
        };
        options.body = JSON.stringify(data);
    } else {
        options.body = new FormData();
        for (var key in data) {
            options.body.append(key, data[key]);
        }
    }

    // Flag the form as submitted
    if (!form.$setSubmit()) {
        // form not valid, don't bother with request
        form.$setSubmitDone();
    } else {
        options.method = endpoint.method;
        view.json(endpoint.url, options).then(done, done);
    }

    function done(response) {
        form.$setSubmitDone();
        if (response.status && response.headers) form.$response(response);else form.$emit('formMessage', {
            level: 'error',
            message: messages[response.message] || messages.default
        });
    }
}

// Main form component
var form = {

    // Allow to specify form schema and initial values
    props: ['schema', 'values'],

    components: {
        'd3-form-fieldset': fieldset,
        'd3-form-input': input$1,
        'd3-form-textarea': textarea,
        'd3-form-select': select$2,
        'd3-form-submit': submit
    },

    model: {
        formSubmitted: false,
        formPending: false,
        $isValid: function $isValid(submitting) {
            var inp = void 0,
                valid = true;
            for (var key in this.inputs) {
                inp = this.inputs[key];
                if (submitting) inp.isDirty = true;
                inp.$validate();
                if (inp.error) valid = false;
            }
            return valid;
        },
        $setSubmit: function $setSubmit() {
            this.formSubmitted = true;
            this.formPending = true;
            return this.$isValid(true);
        },
        $setSubmitDone: function $setSubmitDone() {
            this.formPending = false;
        },
        $inputData: function $inputData() {
            var inputs = this.inputs,
                data = {},
                value;
            for (var key in inputs) {
                value = inputs[key].value;
                if (value || input$1.changed) data[key] = value;
            }
            return data;
        },

        //
        // response from a server submit
        $response: function $response(response) {
            if (response.data) {
                if (this.data.resultHandler) {
                    var handler = responses[this.data.resultHandler];
                    if (!handler) this.$$view.logError('Could not find ' + this.data.resultHandler + ' result handler');else handler.call(this, response);
                } else {
                    responses.default.call(this, response);
                }
            } else this.$responseError(response);
        },

        //
        //  bad response from server submit
        $responseError: function $responseError(response) {
            this.$emit('formMessage', {
                level: 'error',
                data: response.data,
                response: response
            });
        }
    },

    render: function render(data) {
        var model = this.model,
            form = this.createElement('form').attr('novalidate', ''),
            self = this;
        //
        model.$formExtensions = this.root.$formExtensions || [];
        model.inputs = {};
        model.actions = {};
        model.form = model; // inject self for children models
        //
        var schema = data.schema;
        if (data.values) schema.values = data.values;
        if (d3Let.isString(schema)) return this.json(schema).then(function (response) {
            return build(response.data);
        });else return build(schema);

        function build(schema) {
            schema = formElement.inputData.call(self, form, schema);
            //
            // Form validations
            model.validators = validators.get(schema.validators);
            //
            // Form actions
            for (var key in actions) {
                var action = schema[key];
                if (d3Let.isString(action)) action = self.model.$get(action);
                model.actions[key] = action || actions[key];
            }
            addChildren.call(self, form);
            return form;
        }
    },
    childrenMounted: function childrenMounted() {
        var model = this.model,
            values = model.data.values;

        if (values) Object.keys(values).forEach(function (key) {
            var inp = model.inputs[key];
            if (inp) inp.value = values[key];
        });
    }
};

// Forms plugin
var plugin = {
    install: function install(vm) {
        vm.addComponent('d3form', form);
        // list of form Extensions
        vm.$formExtensions = [];
    },

    actions: actions,
    responses: responses
};

function label (field, wrappedEl) {
    var data = field.model.data;
    return field.wrapTemplate(wrappedEl, labelTpl(data));
}

function labelTpl(data) {
    var label = data.label || data.name;

    return "<label for=" + data.id + " class=\"control-label\" d3-class=\"[srOnly ? 'sr-only' : null]\">" + label + "</label>\n<slot></slot>";
}

function formGroup (field, wrappedEl, fieldEl) {
    var data = field.model.data,
        size = data.size !== undefined ? data.size : field.model.form.data.size,
        fc = size ? 'form-control form-control-' + size : 'form-control';
    fieldEl.classed(fc, true).attr('d3-class', '[' + (data.required || false) + ' ? "form-control-required" : null, showError ? "form-control-danger" : null]');
    return field.wrapTemplate(wrappedEl, groupTpl(data));
}

function groupTpl() {
    return '<div class="form-group" d3-class=\'showError ? "has-danger" : null\'>\n<slot></slot>\n<p d3-if="showError" class="text-danger error-block" d3-html="error"></p>\n</div>';
}

function inputGroup (field, wrappedEl, fieldEl) {
    var data = field.model.data,
        ig = data['group'];
    if (!ig) return wrappedEl;
    var gid = 'g' + fieldEl.attr('id');
    fieldEl.attr('aria-describedby', gid);
    return field.wrapTemplate(wrappedEl, groupTpl$1(gid, ig));
}

function groupTpl$1(gid, group) {
    return '<div class="input-group" :class="bootstrapStatus()">\n<span class="input-group-addon" id="' + gid + '">' + group + '</span>\n<slot></slot>\n</div>';
}

function formCheck (field, wrappedEl, fieldEl) {
    var data = field.model.data;
    fieldEl.classed('form-check-input', true);
    return field.wrapTemplate(wrappedEl, groupTpl$2(data.label));
}

function groupTpl$2(label) {
    return '<div class="form-check">\n<label class="form-check-label">\n<slot></slot>\n' + label + '\n</label>\n</div>';
}

var groupTpl$3 = '<div class="form-group">\n<slot></slot>\n</div>';

function submit$2 (field, wrappedEl, fieldEl) {
    var data = field.model.data,
        theme = data.theme || 'primary';
    fieldEl.classed('btn', true).classed('btn-' + theme, true);
    return field.wrapTemplate(wrappedEl, groupTpl$3);
}

var bootstrap = {

    input: ['inputGroup', 'label', 'formGroup'],
    checkbox: ['formCheck'],
    textarea: ['label', 'formGroup'],
    select: ['label', 'formGroup'],
    submit: ['submit'],
    wrappers: {
        label: label,
        formGroup: formGroup,
        inputGroup: inputGroup,
        formCheck: formCheck,
        submit: submit$2
    }
};

//
//  Bootstrap plugin
//  ===================
//
//  Simply add a new form extension to wrap form fields
//
var plugin$1 = {
    install: function install(vm) {
        if (!vm.$formExtensions) return vm.logWarn('form bootstrap requires the form plugin installed first!');
        vm.$formExtensions.push(wrapBootstrap);
    }
};

function wrapBootstrap(field, wrappedEl, fieldEl) {
    var wrappers = bootstrap[fieldEl.attr('type')] || bootstrap[fieldEl.node().tagName.toLowerCase()];
    if (!wrappers) return wrappedEl;
    var wrap = void 0;

    wrappers.forEach(function (wrapper) {
        wrap = bootstrap.wrappers[wrapper];
        if (wrap) wrappedEl = wrap(field, wrappedEl, fieldEl);else field.logWarn('Could not find form field wrapper ' + wrapper);
    });

    return wrappedEl;
}

function slugify (str) {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    var from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
    var to = 'aaaaeeeeiiiioooouuuunc------';
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-'); // collapse dashes

    return str;
}

var version = "1.2.2";

exports.view = main;
exports.viewBase = base$2;
exports.viewEvents = viewEvents;
exports.viewModel = model;
exports.viewExpression = viewExpression;
exports.viewReady = dom;
exports.viewProviders = providers;
exports.viewWarn = warn;
exports.viewForms = plugin;
exports.viewBootstrapForms = plugin$1;
exports.viewSelect = asSelect;
exports.viewUid = uid;
exports.viewDebounce = debounce;
exports.viewSlugify = slugify;
exports.jsep = jsep;
exports.viewVersion = version;
exports.viewElement = htmlElement;
exports.viewTemplate = template;
exports.isAbsoluteUrl = isAbsoluteUrl;
exports.viewRequire = viewRequire;
exports.viewResolve = viewResolve;
exports.jsonResponse = jsonResponse;
exports.HttpResponse = HttpResponse;
exports.HttpError = HttpError;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=d3-view.js.map
