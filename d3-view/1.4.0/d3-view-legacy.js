// d3-view v1.4.0 Copyright 2018 quantmind.com
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-let'), require('d3-timer'), require('d3-selection'), require('d3-dispatch')) :
    typeof define === 'function' && define.amd ? define(['exports', 'd3-let', 'd3-timer', 'd3-selection', 'd3-dispatch'], factory) :
    (factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Let,d3Timer,d3Selection,d3Dispatch) { 'use strict';

    var properties = new Map([['disabled', 'disabled'], ['readonly', 'readOnly'], ['required', 'required']]);

    //
    //  d3-attr-<attr> directive
    //  ==============================
    //
    //  Create a one-way binding between a model and a HTML element attribute
    //
    var attr = {
        create: function create(expression) {
            if (!this.arg) return this.logWarn('Cannot bind to empty attribute. Specify :<attr-name>');
            return expression;
        },
        refresh: function refresh(model, value) {
            if (this.arg === 'class') return this.refreshClass(value);
            if (d3Let.isArray(value)) return this.logWarn('Cannot apply array to attribute ' + this.arg);
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

    var select = createValueType({
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
        select: select,
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
            this.on(this.sel, eventName + '.' + this.uid, function (event) {
                var md = model.$child();
                md.$event = event;
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

    // No value, it has its own directive
    var attributes = ['name', 'class', 'disabled', 'readonly', 'required', 'href'];

    function getdirs (element, vm) {
        var dirs = new Directives();

        for (var i = 0; i < element.attributes.length; ++i) {
            var attr = element.attributes[i],
                bits = attr.name.split('-'),
                dirName = bits[0] === 'd3' ? bits[1] : null,
                arg = void 0;

            if (dirName) {
                if (vm) {
                    arg = bits.slice(2).join('-');
                    if (!arg && attributes.indexOf(dirName) > -1) {
                        arg = dirName;
                        dirName = 'attr';
                    }
                    var directive = vm.directives.get(dirName);
                    if (directive) dirs.add(directive(element, attr, arg));else vm.logWarn(element.tagName + ' cannot find directive "' + dirName + '". Did you forget to register it?');
                }
            } else dirs.attrs[attr.name] = attr.value;
        }

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


        pop: function pop(dir) {
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

    function slice (obj) {
        var idx = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        return Array.prototype.slice.call(obj, idx);
    }

    var isAbsolute = new RegExp('^([a-z]+://|//)'),
        isRelative = new RegExp('^[.]{0,2}/'),
        hasOwnProperty = Array.prototype.hasOwnProperty;

    var viewLibs = new Map();
    var isAbsoluteUrl = function isAbsoluteUrl(url) {
        return isAbsolute.test(url);
    };

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

    var warn = (function (msg) {
        providers.logger.warn(prefix + ' ' + msg);
    });

    // Extend selection prototype with new methods
    d3Selection.selection.prototype.mount = mount;
    d3Selection.selection.prototype.view = view;
    d3Selection.selection.prototype.model = model;
    d3Selection.selection.prototype.directives = directives;

    function directives(vm) {
        var node = this.node();
        var dirs = node.__d3_directives__;
        if (dirs === undefined) {
            dirs = getdirs(node, vm);
            // no point in storing the directive object if there are no directives or the node is not a component
            node.__d3_directives__ = dirs.size() || getComponent(node, vm) ? dirs : null;
        }
        return dirs ? dirs : getdirs(node);
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
    // This method returns nothing or a promise
    function mount(data) {
        var promises = [];
        this.each(function () {
            var view = d3Selection.select(this).view();
            if (view) promises.push(mountElement(this, view, data));else warn('Cannot mount, no view object available to mount to');
        });
        return Promise.all(promises);
    }

    // INTERNALS

    // mount an element into a given model
    var mountElement = function mountElement(element, vm, data) {
        if (!element || !element.tagName) return;

        var component = getComponent(element, vm),
            directives = d3Selection.select(element).directives(vm),
            preMount = directives ? directives.preMount() : null;

        if (preMount) return preMount.execute(vm.model);else {
            if (component) {
                return component({ parent: vm }).mount(element, data).then(function (cm) {
                    if (directives) directives.execute(cm.model);
                    return cm;
                });
            } else {
                if (directives) directives.execute(vm.model);
                return Promise.all(slice(element.children).map(function (c) {
                    return mountElement(c, vm, data);
                }));
            }
        }
    };

    var getComponent = function getComponent(element, vm) {
        return vm.components.get(element.tagName.toLowerCase());
    };

    var template = function template(source, context) {
        if (d3Let.isString(source)) {
            if (context) {
                var s = compile(source);
                if (!s) return source;
                source = s;
            } else return source;
        }
        return source(context);
    };

    var htmlElement = function htmlElement(source, context, ownerDocument) {
        ownerDocument = ownerDocument || document;
        var el = d3Selection.select(ownerDocument.createElement('div'));
        el.html(template(source, context));
        var children = el.node().children;
        if (children.length !== 1) warn('viewElement function should return one root element only, got ' + children.length);
        return children[0];
    };

    var compile = function compile(text) {
        var compile = providers.compileTemplate;
        if (compile) return compile(text);
        warn('No compileTemplate function available in viewProviders, cannot render template');
    };

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

    var asSelect = (function (el) {
      return !el || !d3Let.isFunction(el.size) ? d3Selection.select(el) : el;
    });

    //
    //  Base d3-view Object
    //  =====================
    //
    var base$1 = {
        // available once mounted
        // this is the browser window.document unless we are mounting on jsdom
        ownerDocument: null,
        //
        // d3-view object
        isd3: true,
        //
        providers: providers,
        //
        // Create a view element from a template and optional context
        viewElement: function viewElement(source, context, ownerDocument) {
            return htmlElement(source, context, ownerDocument || this.ownerDocument);
        },

        //
        select: function select(selector) {
            if (typeof selector === "string") return d3Selection.select(this.ownerDocument || document).select(selector);
            return d3Selection.select(selector);
        },

        //
        selectAll: function selectAll(selector) {
            if (typeof selector === "string") return d3Selection.select(this.ownerDocument || document).selectAll(selector);
            return d3Selection.selectAll(selector);
        },

        //
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
        },
        require: function require() {
            var root = this.ownerDocument.defaultView;
            if (!root.d3) root.d3 = {};
            var require = root.d3.require;
            if (!require) {
                if (this.providers.require.root() === root) require = this.providers.require;else require = viewRequireFrom(viewResolve, root);
                root.d3.require = require;
            }
            return require.apply(undefined, arguments);
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

    var PERIOD_CODE = 46,
        // '.'
    COMMA_CODE = 44,
        // ','
    SQUOTE_CODE = 39,
        // single quote
    DQUOTE_CODE = 34,
        // double quotes
    OPAREN_CODE = 40,
        // (
    CPAREN_CODE = 41,
        // )
    OBRACK_CODE = 91,
        // [
    CBRACK_CODE = 93,
        // ]
    QUMARK_CODE = 63,
        // ?
    SEMCOL_CODE = 59,
        // ;
    COLON_CODE = 58,
        // :

    throwError = function throwError(message, index) {
        var error = new Error(message + ' at character ' + index);
        error.index = index;
        error.description = message;
        throw error;
    },


    // Operations
    // ----------

    // Set `t` to `true` to save space (when minified, not gzipped)
    t = true,

    // Use a quickly-accessible map to store all of the unary operators
    // Values are set to `true` (it really doesn't matter)
    unary_ops = { '-': t, '!': t, '~': t, '+': t },

    // Also use a map for the binary operations but set their values to their
    // binary precedence for quick reference:
    // see [Order of operations](http://en.wikipedia.org/wiki/Order_of_operations#Programming_language)
    binary_ops = {
        '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
        '==': 6, '!=': 6, '===': 6, '!==': 6,
        '<': 7, '>': 7, '<=': 7, '>=': 7,
        '<<': 8, '>>': 8, '>>>': 8,
        '+': 9, '-': 9,
        '*': 10, '/': 10, '%': 10
    },

    // Get return the longest key length of any object
    getMaxKeyLen = function getMaxKeyLen(obj) {
        var max_len = 0,
            len;
        for (var key in obj) {
            if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
                max_len = len;
            }
        }
        return max_len;
    },
        max_unop_len = getMaxKeyLen(unary_ops),
        max_binop_len = getMaxKeyLen(binary_ops),

    // Literals
    // ----------
    // Store the values to return for the various literals we may encounter
    literals = {
        'true': true,
        'false': false,
        'null': null
    },

    // Except for `this`, which is special. This could be changed to something like `'self'` as well
    this_str = 'this',

    // Returns the precedence of a binary operator or `0` if it isn't a binary operator
    binaryPrecedence = function binaryPrecedence(op_val) {
        return binary_ops[op_val] || 0;
    },

    // Utility function (gets called from multiple places)
    // Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
    createBinaryExpression = function createBinaryExpression(operator, left, right) {
        var type = operator === '||' || operator === '&&' ? code.LOGICAL_EXP : code.BINARY_EXP;
        return {
            type: type,
            operator: operator,
            left: left,
            right: right
        };
    },

    // `ch` is a character code in the next three functions
    isDecimalDigit = function isDecimalDigit(ch) {
        return ch >= 48 && ch <= 57; // 0...9
    },
        isIdentifierStart = function isIdentifierStart(ch) {
        return ch === 36 || ch === 95 || // `$` and `_`
        ch >= 65 && ch <= 90 || // A...Z
        ch >= 97 && ch <= 122 || // a...z
        ch >= 128 && !binary_ops[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
    },
        isIdentifierPart = function isIdentifierPart(ch) {
        return ch === 36 || ch === 95 || // `$` and `_`
        ch >= 65 && ch <= 90 || // A...Z
        ch >= 97 && ch <= 122 || // a...z
        ch >= 48 && ch <= 57 || // 0...9
        ch >= 128 && !binary_ops[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
    },


    // Parsing
    // -------
    // `expr` is a string with the passed in expression
    jsep = function jsep(expr) {
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
        if (arguments.length === 1) all = new Set();
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
        if (!func) throw new EvalError("callable \"" + callee.name + "\" not found in context");
        return func.apply(self, args);
    }

    function unaryExp(op, arg) {
        if (!unaryFunctions[op]) unaryFunctions[op] = new Function("arg", "return " + op + " arg");
        return unaryFunctions[op](arg);
    }

    function binaryExp(op, a, b) {
        if (!binaryFunctions[op]) binaryFunctions[op] = new Function("a", "b", "return a " + op + " b");
        return binaryFunctions[op](a, b);
    }

    function fullName(expr) {
        if (expr.type === code.IDENTIFIER) return expr.name;else return fullName(expr.object) + "." + expr.property.name;
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
            return identifiers(this.parsed);
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

    var ddispatch = (function () {
        var _triggered = 0;

        var events = d3Dispatch.dispatch('change');

        function change() {
            events.apply('change', this, arguments);
            _triggered += 1;
        }

        return {
            change: change,
            on: function on(typename, callback) {
                if (arguments.length < 2) return events.on(typename);
                events.on(typename, callback);
                return this;
            },

            trigger: debounce(change),
            triggered: function triggered() {
                return _triggered;
            }
        };
    });

    //
    // Initialise a model
    function asModel(model, initials, parent, isolated) {
        var events = new Map(),
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
    var isVanillaObject = (function (value) {
      return value && value.constructor === Object;
    });

    //  $set a reactive attribute for a Model
    //
    //  Set the value of an attribute in the model
    //  If the attribute is not already reactive make it as such.
    //
    function $set (key, value) {
        // property not reactive - make it as such
        if (key.substring(0, 1) === '$') {
            if (this.constructor.prototype[key]) this.$logWarn('Cannot set attribute method ' + key + ', it is protected');else this[key] = value;
        } else if (!this.$events.get(key)) reactive(this, key, value);else this[key] = value;
    }

    var isModel = function isModel(value) {
        return d3Let.isObject(value) && value.toString() === '[object d3Model]';
    };

    var reactive = function reactive(model, key, value) {
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
                });else model.$logWarn('reactive lazy property ' + key + ' does not specify \'reactOn\' list or properties');

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
    };

    //
    //  Connect a model attribute with another model attribute
    //  The attribute is read-only on the model an it reacts on parent changes
    function $connect (attr, parentAttr, owner) {
        var _this = this,
            _arguments = arguments;

        if (this.$events.has(attr)) return this.$logWarn('cannot connect ' + attr + ' attribute, it is already reactive');

        parentAttr = parentAttr || attr;
        owner = (owner || this).$owner(parentAttr);
        if (!owner) return this.$logWarn('cannot find model with attribute ' + parentAttr);
        //
        var dd = ddispatch();
        this.$events.set(attr, dd);
        Object.defineProperty(this, attr, {
            get: function get() {
                return owner[parentAttr];
            },
            set: function set() {
                this.$logWarn('Cannot set "' + attr + '" value because it is owned by a parent model');
            }
        });
        owner.$events.get(parentAttr).on('change.' + this.uid, function () {
            dd.change.apply(_this, _arguments);
            if (owner != _this) _this.$events.get('').change.apply(_this);
        });
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
            event = getEvent(this, key);

        if (!event) return warn('Cannot bind to "' + key + '" - no such reactive property');

        // event from a parent model, add model uid to distinguish it from other child callbacks
        if (!this.$events.get(key)) bits.push(this.uid);

        bits[0] = 'change';
        return event.on(bits.join('.'), callback);
    }

    function getEvent(model, name) {
        var event = model.$events.get(name);
        if (!event && model.parent) return getEvent(model.parent, name);
        return event;
    }

    // Update a model with reactive model data
    function $update (data, replace) {
        if (data) {
            replace = arguments.length === 2 ? replace : true;
            for (var key in data) {
                if (replace || this[key] === undefined) this.$set(key, data[key]);
            }
        }
        return this;
    }

    // remove event handlers
    function $off (attr) {
        if (attr === undefined) this.$events.forEach(function (event) {
            return removeEvent(event);
        });else {
            var bits = attr.split('.'),
                type = bits.splice(0, 1)[0],
                event = this.$events.get(type);
            if (event) removeEvent(event, bits.join('.'));
        }
    }

    function removeEvent(event, name) {
        if (name) event.on('change.' + name, null);else event.on('change', null);
    }

    // trigger change event on a model reactive attribute
    function $change (attribute) {
        var name = arguments.length ? attribute : '',
            event = this.$events.get(name),
            args = slice(arguments, 1);
        if (event) event.trigger.apply(this, args);else if (!this.isolated) this.parent.$change(name);else warn('attribute \'' + name + '\' is not a reactive property this model');
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
        if (!this.$events.has(attr)) return this.parent ? this.parent.$owner(attr) : undefined;
        return this;
    }

    var serialTypes = new Set([Boolean, String, Number]);

    function $data () {
        var model = this,
            data = {},
            keys = Array.from(this.$events.keys()).concat(Object.keys(this)),
            value;

        keys.forEach(function (key) {
            if (key && key.substring(0, 1) !== '$') {
                value = getValue(model[key]);
                if (value !== undefined) data[key] = value;
            }
        });
        return data;
    }

    function getValue(value) {
        if (!value) return value;else if (value.constructor === Array) return value.map(getValue);else if (typeof value.$data === 'function') return value.$data();else if (serialTypes.has(value.constructor)) return value;
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

    function model$1(initials) {
        return new Model(initials);
    }

    model$1.prototype = Model.prototype = {
        constructor: Model,
        // Public API methods
        toString: toString,
        $on: $on,
        $change: $change,
        $connect: $connect,
        $emit: $emit,
        $update: $update,
        $set: $set,
        $new: $new,
        $off: $off,
        $isReactive: $isReactive,
        $owner: $owner,
        $data: $data,
        $push: $push,
        $splice: $splice,
        $logWarn: function $logWarn(msg) {
            if (this.$$view) this.$$view.logWarn(msg);else warn(msg);
        }
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
            if (!this.active) return;
            this.removeAttribute();
            this.identifiers = [];
            model = this.mount(model);
            // If model returned, bind the element to its properties
            if (model) this.bindModel(model);
        },
        bindModel: function bindModel(model) {
            var dir = this,
                error = false,
                events = model.$$view.events,
                refresh = function refresh() {
                var value = dir.expression ? dir.expression.eval(model) : dir.data;
                dir.refresh(model, value);
                dir.passes++;
                events.call('directive-refresh', undefined, dir, model, value);
            };
            //
            // get the cache instance
            dir.cache = model.$$view.cache;

            // Bind expression identifiers with model
            var bits = void 0,
                target = void 0,
                attr = void 0,
                i = void 0;
            if (dir.data) {
                dir.data = model.$new(dir.data);
                dir.identifiers.push({
                    model: dir.data,
                    attr: ''
                });
            } else if (!this.expression) {
                dir.identifiers.push({
                    model: model,
                    attr: ''
                });
            } else {
                var modelEvents = new Map();
                this.expression.identifiers().forEach(function (identifier) {
                    bits = identifier.split('.');
                    target = model;
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
                        if (!(target instanceof model$1)) {
                            dir.logError(identifier + ' is not a reactive model. Cannot bind to it');
                            error = true;
                        } else addTarget(modelEvents, target, bits[bits.length - 1]);
                    }
                });

                // register with model reactive properties
                modelEvents.forEach(function (target) {
                    // if we are listening to all event simply bind to the model changes
                    if (target.events.has('')) dir.identifiers.push({
                        model: target.model,
                        attr: ''
                    });else target.events.forEach(function (attr) {
                        dir.identifiers.push({
                            model: target.model,
                            attr: attr
                        });
                    });
                });
            }

            if (error) return;

            this.identifiers.forEach(function (identifier) {
                var event = identifier.attr + '.' + dir.uid;
                identifier.model.$on(event, refresh);
            });

            this.bindDestroy(model);

            refresh();
        },
        bindDestroy: function bindDestroy(model) {
            var dir = this,
                destroy = this.destroy;
            // bind destroy to the model
            dir.destroy = function () {
                dir.identifiers.forEach(function (identifier) {
                    identifier.model.$off(identifier.attr + '.' + dir.uid);
                });
                if (dir.data) dir.data.$off();
                try {
                    destroy.call(dir, model);
                } finally {
                    model.$emit('destroyDirective', dir);
                }
            };
        }
    };

    // Directive constructor
    function createDirective (obj) {

        function Directive(el, attr, arg) {
            this.el = el;
            this.ownerDocument = el.ownerDocument;
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

    function addTarget(modelEvents, model, attr) {
        var value = arguments.length === 3 ? model[attr] : undefined;
        //
        // a method of the model, event is at model level
        if (d3Let.isFunction(value) || arguments.length === 2) getTarget(modelEvents, model).events.add('');
        // value is another model, events at both target model level and value model level
        else if (value instanceof model$1) {
                addTarget(modelEvents, value);
                model = model.$owner(attr);
                if (model) getTarget(modelEvents, model).events.add('');
            } else {
                // make sure attr is a reactive property of model
                model = model.$owner(attr) || model;
                if (!model.$isReactive(attr)) model.$set(attr, value);
                getTarget(modelEvents, model).events.add(attr);
            }
    }

    function getTarget(modelEvents, model) {
        var target = modelEvents.get(model.uid);
        if (!target) {
            target = {
                model: model,
                events: new Set()
            };
            modelEvents.set(model.uid, target);
        }
        return target;
    }

    var maybeJson = (function (value) {
        if (d3Let.isString(value)) {
            try {
                return JSON.parse(value);
            } catch (msg) {
                return value;
            }
        }
        return value;
    });

    var map = (function (obj) {
        if (obj && obj.constructor === Object) obj = Object.entries(obj);
        return new Map(obj);
    });

    var DATAPREFIX = 'data';

    var dataAttributes = (function (attrs) {
        var p = void 0,
            bits = void 0;
        return Object.keys(attrs).reduce(function (o, key) {
            bits = key.split('-');
            if (bits.length > 1 && bits[0] === DATAPREFIX) bits = bits.splice(1);
            p = bits.reduce(function (s, key, idx) {
                s += idx ? key.substring(0, 1).toUpperCase() + key.substring(1) : key;
                return s;
            }, '');
            o[p] = attrs[key];
            return o;
        }, {});
    });

    function Cache() {
        this.active = true;
        this.data = new Map();
    }

    Cache.prototype = {
        constructor: Cache,
        set: function set(key, value) {
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

    var protoView = {
        doMount: function doMount(el) {
            return asView(this, el);
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
        mount: function mount(el, data) {
            var _this = this;

            if (mounted(this)) return;
            var sel$$1 = asSelect(el);
            el = sel$$1.node();
            if (!el) {
                this.logWarn('element not defined, pass an identifier or an HTMLElement object');
                return Promise.resolve(this);
            }
            // set the owner document
            this.ownerDocument = el.ownerDocument;
            //
            var directives = sel$$1.directives(this);

            var props = d3Let.assign(dataAttributes(directives.attrs), sel$$1.datum(), data),
                extra = maybeJson(d3Let.pop(props, 'props')),
                value = void 0,
                model = void 0,
                parentModel = void 0;

            if (d3Let.isObject(extra)) props = d3Let.assign(extra, props);else if (this.parent && this.parent.props[extra]) props = d3Let.assign({}, this.parent.props[extra], props);

            // fire mount event
            this.events.call('mount', undefined, this, el, props);

            // pick parent model & props
            if (this.parent) {
                //
                parentModel = this.parent.model;
                model = d3Let.pop(props, 'model');
                if (model && !model.$child) model = parentModel[model];
                if (!model) model = parentModel.$new();else model = model.$child();
                //
                // Get props from parent view
                Object.keys(this.props).forEach(function (key) {
                    value = _this.parent.props[props[key]];
                    if (value === undefined) {
                        value = maybeJson(props[key]);
                        if (value !== undefined) props[key] = value;
                        // default value if available
                        else if (_this.props[key] !== undefined) props[key] = _this.props[key];
                    } else props[key] = value;
                });
                //
                // get props object from parent if props is defined
                if (d3Let.isString(extra)) props = d3Let.assign({}, this.parent.props[extra], props);
            } else {
                props = d3Let.assign(this.props, props);
                model = model$1();
            }

            // add reactive model properties
            Object.keys(this.model).forEach(function (key) {
                value = d3Let.pop(props, key);
                if (value !== undefined) {
                    if (d3Let.isString(value) && parentModel && parentModel.$isReactive(value)) model.$connect(key, value, parentModel);else model.$set(key, maybeJson(value));
                } else if (model[key] === undefined) model.$set(key, _this.model[key]);
            });
            this.model = bindView(this, model);
            //
            // create the new element from the render function
            if (!props.id) props.id = model.uid;
            this.props = props;
            //
            return this.doMount(el);
        },
        createElement: function createElement(tag, props) {
            var doc = this.ownerDocument || document;
            var sel$$1 = this.select(doc.createElement(tag));
            if (props) {
                sel$$1.attr('id', this.props.id);
                if (this.props.class) sel$$1.classed(this.props.class, true);
            }
            return sel$$1;
        },
        doMount: function doMount(el) {
            var _this2 = this;

            var newEl = void 0;
            try {
                newEl = this.render(el);
            } catch (error) {
                newEl = Promise.reject(error);
            }
            if (!newEl || !newEl.then) newEl = Promise.resolve(newEl);
            return newEl.then(function (element) {
                return compile$1(_this2, el, element);
            }).catch(function (exc) {
                return error(_this2, el, exc);
            });
        },
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
        }
    };

    // factory of View and Component constructors
    var createComponent = function createComponent(name, o, coreDirectives, coreComponents) {
        if (d3Let.isFunction(o)) o = { render: o };

        var obj = d3Let.assign({}, o),
            classComponents = extendComponents(new Map(), d3Let.pop(obj, 'components')),
            classDirectives = extendDirectives(new Map(), d3Let.pop(obj, 'directives')),
            model = d3Let.pop(obj, 'model'),
            props = d3Let.pop(obj, 'props');

        function Component(options) {
            var parent = d3Let.pop(options, 'parent'),
                components = map(parent ? parent.components : coreComponents),
                directives = map(parent ? parent.directives : coreDirectives),
                events = parent ? parent.events : d3Dispatch.dispatch('message', 'created', 'mount', 'mounted', 'error', 'directive-refresh'),
                cache = parent ? parent.cache : new Cache();

            classComponents.forEach(function (comp, key) {
                components.set(key, comp);
            });
            classDirectives.forEach(function (comp, key) {
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
                        return cache;
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
            this.props = asObject(props, d3Let.pop(options, 'props'));
            this.model = asObject(model, d3Let.pop(options, 'model'));
            this.events.call('created', undefined, this);
        }

        Component.prototype = d3Let.assign({}, base$2, protoComponent, obj);

        function component(options) {
            return new Component(options);
        }

        component.prototype = Component.prototype;

        return component;
    };

    // Used by both Component and view

    var extendComponents = function extendComponents(container, components) {
        map(components).forEach(function (obj, key) {
            container.set(key, createComponent(key, obj, protoComponent));
        });
        return container;
    };

    var extendDirectives = function extendDirectives(container, directives) {
        map(directives).forEach(function (obj, key) {
            container.set(key, createDirective(obj));
        });
        return container;
    };

    //
    //  Finalise the binding between the view and the model
    //  inject the model into the view element
    //  call the mounted hook and can return a Promise
    var asView = function asView(vm, element) {

        Object.defineProperty(sel(vm), 'el', {
            get: function get() {
                return element;
            }
        });
        // Apply model to element and mount
        return vm.select(element).view(vm).mount().then(function () {
            return vmMounted(vm);
        });
    };

    var mounted = function mounted(vm) {
        if (vm.isMounted === undefined) {
            vm.isMounted = false;
            return false;
        } else if (vm.isMounted) {
            vm.logWarn('component already mounted');
        } else {
            vm.isMounted = true;
            // invoke mounted component hook
            vm.mounted();
            // invoke the view mounted events
            vm.events.call('mounted', undefined, vm);
        }
        return true;
    };

    // Internals

    //
    //  Component/View mounted
    //  =========================
    //
    //  This function is called when a component/view has all its children added
    var vmMounted = function vmMounted(vm) {
        var parent = vm.parent;
        vm.childrenMounted();
        if (parent && !parent.isMounted) {
            var event = 'mounted.' + vm.uid;
            vm.events.on(event, function (cm) {
                if (cm === parent) {
                    vm.events.on(event, null);
                    mounted(vm);
                }
            });
        } else mounted(vm);
        return vm;
    };

    // Compile a component model
    // This function is called once a component has rendered the component element
    var compile$1 = function compile(cm, origEl, element) {
        if (d3Let.isString(element)) {
            var props = Object.keys(cm.props).length ? cm.props : null;
            element = cm.viewElement(element, props, origEl.ownerDocument);
        }
        element = asSelect(element);
        var size = element.size();
        if (!size) throw new Error('render() must return a single HTML node. It returned nothing!');else if (size !== 1) cm.logWarn('render() must return a single HTML node');
        element = element.node();
        //
        // mark the original element as component
        origEl.__d3_component__ = true;
        // Insert before the component element
        if (origEl.parentNode) origEl.parentNode.insertBefore(element, origEl);
        // remove the component element
        cm.select(origEl).remove();
        //
        return asView(cm, element);
    };

    // Invoked when a component cm has failed to render
    var error = function error(cm, origEl, exc) {
        cm.logWarn('failed to render due to the unhandled exception reported below');
        cm.logError(exc);
        cm.events.call('error', undefined, cm, origEl, exc);
        return cm;
    };

    var asObject = function asObject(value, opts) {
        if (d3Let.isFunction(value)) value = value();
        if (d3Let.isArray(value)) value = value.reduce(function (o, key) {
            o[key] = undefined;
            return o;
        }, {});
        return d3Let.assign({}, value, opts);
    };

    var bindView = function bindView(view, model) {
        Object.defineProperties(model, {
            $$view: {
                get: function get() {
                    return view;
                }
            },
            $$name: {
                get: function get() {
                    return view.name;
                }
            },
            props: {
                get: function get() {
                    return view.props;
                }
            }
        });
        return model;
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
            if (bits.length !== 3 || bits[1] != 'in') return this.logWarn('directive requires "item in expression" template, got "' + expression + '"');
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
                itemClass = this.itemClass,
                selector = '.' + itemClass,
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
            }).classed(itemClass, false),
                vm = sel.view();

            var forComponent = vm.components.get(creator.tagName.toLowerCase());
            if (!forComponent) forComponent = createComponent('forView', protoView);

            var x = void 0,
                el = void 0,
                fel = void 0,
                tr = void 0;

            (this.transition(exits) || exits).style('opacity', 0).remove();

            // Add all missing entries
            entries.enter().append(function () {
                el = creator.cloneNode(true);
                fel = vm.select(el);
                if (vm.transitionDuration(fel) > 0) fel.style('opacity', 0);
                return el;
            }).each(function (d, index) {
                x = { index: index };
                x[itemName] = d;
                forComponent({
                    model: x,
                    parent: vm
                }).mount(this, { model: vm.model }).then(function (fv) {
                    fv.sel.classed(itemClass, true);
                    // replace the item with a property from the model
                    // This allow for reactivity when d is an object
                    items[index] = fv.model[itemName];
                    tr = fv.transition();
                    if (tr) tr.style('opacity', 1);
                });
            });

            sel.selectAll(selector).each(function (d) {
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
            this.opacity = +sel.style('opacity') || 1;
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
            } else sel.style('opacity', value ? this.opacity : 0);
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
                if (!node.querySelectorAll || node.__d3_component__) continue;
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
    var coreDirectives = extendDirectives(new Map(), directives$1);

    // the root view constructor
    var main = (function (config) {
      return createComponent('view', protoView, coreDirectives)(config);
    });

    // Add callback to execute when the DOM is ready
    var dom = (function (callback) {
        providers.readyCallbacks.push(callback);
        /* istanbul ignore next */
        if (document.readyState !== 'complete') {
            document.addEventListener('DOMContentLoaded', _completed);
            // A fallback to window.onload, that will always work
            window.addEventListener('load', _completed);
        } else domReady();
    });

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

    var componentsFromType = {
        text: 'input',
        email: 'input',
        password: 'input',
        checkbox: 'input',
        number: 'input',
        date: 'input',
        url: 'input',
        'datetime-local': 'input'
    };

    var formComponent = function formComponent(child) {
        var type = child.type || 'text';
        return componentsFromType[type] || type;
    };

    var addAttributes = function addAttributes(el, attributes) {
        var expr, attr;

        if (!d3Let.isObject(attributes)) return;

        for (attr in attributes) {
            expr = attributes[attr];
            if (d3Let.isObject(expr)) expr = JSON.stringify(expr);
            el.attr(attr, expr || '');
        }
    };

    function formChild(child) {
        var component = formComponent(child);
        return document.createElement('d3-form-' + component);
    }

    //
    // Mixin for all form elements
    var formElement = {
        props: ['form'],

        addChildren: function addChildren(sel, form) {
            var children = this.props.children;
            if (children) {
                if (!d3Let.isArray(children)) {
                    this.logError('children should be an array of fields, got ' + (typeof children === 'undefined' ? 'undefined' : babelHelpers.typeof(children)));
                    return sel;
                }
                if (form) children.forEach(function (c) {
                    c.form = form;
                });
                sel.selectAll('.d3form').data(children).enter().append(formChild).attr('form', 'form').classed('d3form', true);
            }
            return sel;
        },
        init: function init(el) {
            var _this = this;

            addAttributes(el, this.props.attributes);
            properties.forEach(function (prop, key) {
                var value = _this.props[key];
                if (value) {
                    if (d3Let.isString(value)) el.attr('d3-attr-' + key, value);else el.property(prop, true);
                }
            });
            return el;
        },


        // wrap the form element with extensions
        wrap: function wrap(fieldEl) {
            var _this2 = this;

            var wrappedEl = fieldEl;

            this.root.$formExtensions.forEach(function (extension) {
                wrappedEl = extension(_this2, wrappedEl, fieldEl) || wrappedEl;
            });

            return wrappedEl;
        },
        wrapTemplate: function wrapTemplate(sel, template) {
            var outer = this.createElement('div').html(template),
                slot = outer.select('slot');

            if (!slot.size()) {
                this.logWarn('template does not provide a slot element');
                return sel;
            }
            var target = this.select(slot.node().parentNode);
            sel.nodes().forEach(function (node) {
                target.insert(function () {
                    return node;
                }, 'slot');
            });
            slot.remove();
            return this.selectAll(outer.node().children);
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

        init: function init(el) {
            // call parent method
            formElement.init.call(this, el);
            var props = this.props,
                model = this.model;

            if (!props.name) {
                this.logError('Input field without a name');
                return el;
            }

            el.attr('name', props.name);
            if (!props.placeholder) props.placeholder = props.label || props.name;
            //
            // give name to model (for debugging info messages)
            model.name = props.name;
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
                props.form.$change();
                model.$emit('formFieldChange', model);
            });
            return el;
        },
        mounted: function mounted() {
            // add this model to the form inputs object
            this.props.form.inputs[this.props.name] = this.model;
        }
    });

    //
    // Fieldset element
    var fieldset = d3Let.assign({}, formElement, {
        render: function render() {
            var tag = this.props.tag || 'fieldset',
                el = this.init(this.createElement(tag, true));
            return this.addChildren(el);
        }
    });

    var required = {
        set: function set(el, data) {
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
        set: function set(el, data) {
            var value = data.minLength;
            if (d3Let.isString(value)) el.attr('d3-attr-minlength', value);else if (value !== undefined) el.attr('minlength', value);
        },
        validate: function validate(el, value) {
            var l = +el.attr('minlength');
            if (l === l && l > 0 && value.length < l) return 'too short - ' + l + ' characters or more expected';
        }
    };

    var maxLength = {
        set: function set(el, data) {
            var value = data.maxLength;
            if (d3Let.isString(value)) el.attr('d3-attr-maxlength', value);else if (value !== undefined) el.attr('maxlength', value);
        },
        validate: function validate(el, value) {
            var l = +el.attr('maxlength');
            if (l === l && l > 0 && value && value.length > l) return 'too long - ' + l + ' characters or less expected';
        }
    };

    var minimum = {
        set: function set(el, data) {
            var value = data.minimum;
            if (d3Let.isString(value)) el.attr('d3-attr-min', value);else if (value !== undefined) el.attr('min', value);
        },
        validate: function validate(el, value) {
            var r = range(el);
            if (r && +value < r[0]) return 'must be greater or equal ' + r[0];
        }
    };

    var maximum = {
        set: function set(el, data) {
            var value = data.maximum;
            if (d3Let.isString(value)) el.attr('d3-attr-max', value);else if (value !== undefined) el.attr('max', value);
        },
        validate: function validate(el, value) {
            var r = range(el);
            if (r && +value > r[1]) return 'must be less or equal ' + r[1];
        }
    };

    var validators = map({
        required: required,
        minLength: minLength,
        maxLength: maxLength,
        minimum: minimum,
        maximum: maximum
    });

    var range = function range(el) {
        var l0 = el.attr('min'),
            l1 = el.attr('max');
        l0 = l0 === null ? -Infinity : +l0;
        l1 = l1 === null ? Infinity : +l1;
        return [l0, l1];
    };

    // validator singleton
    var validators$1 = (function (vm, el) {
        validators.forEach(function (validator) {
            if (validator.set) validator.set(el, vm.props);
        });
        vm.model.$on('value.validate', validate);
        vm.model.$validate = validate;
    });

    function validate() {
        var vm = this.$$view,
            value = this.value,
            el = vm.sel.attr('id') === this.props.id ? vm.sel : vm.sel.select('#' + this.props.id),
            msg;

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = validators.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var validator = _step.value;

                msg = validator.validate(el, value);
                if (msg) {
                    if (msg === true) msg = '';
                    break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        this.error = msg || '';
    }

    var checks = ['checkbox', 'radio'];

    //
    // Input element
    var input$1 = d3Let.assign({}, field, {
        render: function render() {
            var el = this.init(this.createElement('input', true));

            el.attr('type', this.props.type || 'text').attr('d3-value', 'value');

            if (checks.indexOf(el.attr('type')) === -1 && this.props.placeholder) el.attr('placeholder', this.props.placeholder);

            validators$1(this, el);
            return this.wrap(el);
        }
    });

    //
    // Textarea element
    var textarea = d3Let.assign({}, field, {
        render: function render() {
            var el = this.init(this.createElement('textarea', true));
            el.attr('placeholder', this.props.placeholder).attr('d3-value', 'value');

            validators$1(this, el);
            return this.wrap(el);
        }
    });

    //
    // Select element
    var select$1 = d3Let.assign({}, field, {

        model: d3Let.assign({
            options: []
        }, field.model),

        render: function render() {
            var el = this.init(this.createElement('select', true));
            this.model.options = asOptions(this.model.options);
            el.attr('d3-value', 'value').attr('placeholder', this.props.placeholder).append('option').attr('d3-for', 'option in options').attr('d3-html', 'option.label').attr('d3-attr-value', 'option.value');

            validators$1(this, el);
            return this.wrap(el);
        }
    });

    var asOptions = function asOptions(options) {
        if (!d3Let.isArray(options)) options = [];
        options.forEach(function (opt, idx) {
            if (d3Let.isArray(opt)) opt = {
                value: opt[0],
                label: opt[1] || opt[0]
            };else if (d3Let.isString(opt)) opt = {
                value: opt,
                label: opt
            };
            options[idx] = opt;
        });
        return options;
    };

    //
    // Submit element
    var submit = d3Let.assign({}, formElement, {

        model: {
            $submit: function $submit() {
                if (this.$event && this.$event.defaultPrevented) return;
                this.props.form.actions.submit.call(this, this.$event);
            }
        },

        render: function render() {
            var tag = this.props.tag || 'button',
                el = this.init(this.createElement(tag, true));

            el.attr('type', this.props.type || 'submit').attr('name', this.props.name || '_submit_').attr('d3-on-click', '$submit()').html(this.props.label || 'submit');

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

    var endpointDefaults = {
        contentType: 'application/json',
        method: 'POST'
    };

    //
    // Submit action
    function submit$1(e) {
        var submit = this,
            view = submit.$$view,
            form = view.props.form,
            endpoint = d3Let.assign({}, endpointDefaults, submit.props.endpoint);

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
    var form = d3Let.assign({}, formElement, {

        // Allow to specify and initial values
        props: ['url', 'values', 'form'],

        components: {
            'd3-form-fieldset': fieldset,
            'd3-form-input': input$1,
            'd3-form-textarea': textarea,
            'd3-form-select': select$1,
            'd3-form-submit': submit
        },

        model: {
            form: null, //  parent form
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
                    if (this.props.resultHandler) {
                        var handler = responses[this.props.resultHandler];
                        if (!handler) this.$$view.logError('Could not find ' + this.props.resultHandler + ' result handler');else handler.call(this, response);
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

        render: function render() {
            var _this = this;

            if (this.props.url) return this.json(this.props.url).then(function (response) {
                return _this.build(response.data);
            });else return this.build();
        },
        childrenMounted: function childrenMounted() {
            var model = this.model,
                values = this.props.values;

            if (values) Object.keys(values).forEach(function (key) {
                var inp = model.inputs[key];
                if (inp) inp.value = values[key];
            });
        },
        build: function build(props) {
            if (props) this.props = d3Let.assign(this.props, props);
            var form = this.init(this.createElement('form', true).attr('novalidate', '')),
                model = this.model;
            //
            model.$formExtensions = this.root.$formExtensions || [];
            model.inputs = {};
            model.actions = {};
            //
            // Form actions
            for (var key in actions) {
                var action = this.props[key];
                if (d3Let.isString(action)) action = this.model.$get(action);
                model.actions[key] = action || actions[key];
            }
            return this.addChildren(form, model);
        }
    });

    // Forms plugin
    var plugin = {
        install: function install(vm) {
            vm.addComponent('d3form', form);
            // list of form Extensions
            vm.$formExtensions = [];
        },

        actions: actions,
        responses: responses,
        validators: validators
    };

    var error$1 = (function (field, wrappedEl) {
        return field.wrapTemplate(wrappedEl, "<slot></slot><div class=\"invalid-feedback\" d3-html=\"error\"></div>");
    });

    function label (field, wrappedEl) {
        var data = field.props;
        return field.wrapTemplate(wrappedEl, labelTpl(data));
    }

    function labelTpl(data) {
        var label = data.label || data.name;

        return "<label for=" + data.id + " class=\"control-label\" d3-class=\"[srOnly ? 'sr-only' : null]\">" + label + "</label>\n<slot></slot>";
    }

    var formGroup = (function (field, wrappedEl, fieldEl) {
        var data = field.props,
            size = data.size !== undefined ? data.size : data.form.props.size,
            fc = size ? 'form-control form-control-' + size : 'form-control';
        fieldEl.classed(fc, true).attr('d3-class', '[' + (data.required || false) + ' ? "form-control-required" : null, showError ? "is-invalid" : null]');
        return field.wrapTemplate(wrappedEl, '<div class="form-group"><slot></slot></div>');
    });

    function inputGroup (field, wrappedEl, fieldEl) {
        var data = field.props,
            ig = data.group;
        if (!ig) return wrappedEl;
        var gid = 'g' + fieldEl.attr('id');
        fieldEl.attr('aria-describedby', gid);
        return field.wrapTemplate(wrappedEl, groupTpl(gid, ig));
    }

    function groupTpl(gid, group) {
        return '\n        <div class="input-group">\n            <div class="input-group-prepend">\n                <span class="input-group-text" id="' + gid + '">' + group + '</span>\n            </div>\n            <slot></slot>\n        </div>\n    ';
    }

    function formCheck (field, wrappedEl, fieldEl) {
        var data = field.props;
        fieldEl.classed('custom-control-input', true);
        return field.wrapTemplate(wrappedEl, groupTpl$1(data));
    }

    function groupTpl$1(data) {
        return '\n        <div class="custom-control custom-checkbox">\n            <slot></slot>\n            <label class="custom-control-label" for="' + data.id + '">' + data.label + '</label>\n        </div>\n    ';
    }

    var groupTpl$2 = '<div class="form-group">\n<slot></slot>\n</div>';

    function submit$2 (field, wrappedEl, fieldEl) {
        var data = field.props,
            theme = data.theme || 'primary';
        fieldEl.classed('btn', true).classed('btn-' + theme, true);
        return field.wrapTemplate(wrappedEl, groupTpl$2);
    }

    function help (field, wrappedEl, fieldEl) {
        var data = field.props;
        if (data.help) {
            fieldEl.attr('aria-describedby', 'help-' + data.id);
            return field.wrapTemplate(wrappedEl, helpTpl(data));
        } else return wrappedEl;
    }

    function helpTpl(data) {
        return '<slot></slot><small id="help-' + data.id + '" class="form-text text-muted">' + data.help + '</small>';
    }

    var bootstrap = {

        input: ['error', 'inputGroup', 'label', 'help', 'formGroup'],
        checkbox: ['error', 'formCheck', 'help', 'formGroup'],
        textarea: ['error', 'label', 'help', 'formGroup'],
        select: ['error', 'label', 'help', 'formGroup'],
        submit: ['submit'],
        wrappers: {
            error: error$1,
            label: label,
            formGroup: formGroup,
            inputGroup: inputGroup,
            formCheck: formCheck,
            submit: submit$2,
            help: help
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

    var slugify = (function (str) {
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
    });

    var version = "1.4.0";

    exports.view = main;
    exports.viewBase = base$2;
    exports.viewModel = model$1;
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
    exports.viewRequireFrom = viewRequireFrom;
    exports.viewRequire = viewRequire;
    exports.viewResolve = viewResolve;
    exports.viewLibs = viewLibs;
    exports.jsonResponse = jsonResponse;
    exports.HttpResponse = HttpResponse;
    exports.HttpError = HttpError;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=d3-view-legacy.js.map
