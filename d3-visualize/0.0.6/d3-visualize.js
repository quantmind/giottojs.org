// d3-visualize Version 0.0.6. Copyright 2017 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-canvas-transition'), require('object-assign'), require('d3-array'), require('d3-random'), require('d3-collection'), require('d3-let'), require('d3-dsv'), require('d3-view'), require('d3-dispatch'), require('crossfilter'), require('d3-format'), require('d3-time-format'), require('d3-selection'), require('d3-shape'), require('d3-require')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3-canvas-transition', 'object-assign', 'd3-array', 'd3-random', 'd3-collection', 'd3-let', 'd3-dsv', 'd3-view', 'd3-dispatch', 'crossfilter', 'd3-format', 'd3-time-format', 'd3-selection', 'd3-shape', 'd3-require'], factory) :
	(factory((global.d3 = {}),global.d3,global.assign,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.crossfilter,global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3CanvasTransition,assign,d3Array,d3Random,d3Collection,d3Let,d3Dsv,d3View,d3Dispatch,crossfilter,d3Format,d3TimeFormat,d3Selection,d3_shape,d3Require) { 'use strict';

assign = assign && assign.hasOwnProperty('default') ? assign['default'] : assign;
crossfilter = crossfilter && crossfilter.hasOwnProperty('default') ? crossfilter['default'] : crossfilter;

var version = "0.0.6";

var defaults = {
    sigma: 0.1,
    drift: 0
};

var randompath = function (size, options) {
    options = assign({}, defaults, options);
    var t = d3Array.range(0, +size, 1),
        S = options.sigma,
        drift = options.drift,
        data = [{ x: 0, y: 0 }],
        norm = d3Random.randomNormal(0, 1),
        dx;

    for (var i = 1; i < t.length; i++) {
        dx = drift + S * norm();
        data[i] = {
            x: i,
            y: data[i - 1].y + dx
        };
    }

    return data;
};

var array = {
    init: function init(config) {
        if (d3Let.isArray(config)) return { data: config };else if (d3Let.isObject(config) && d3Let.isArray(config.data)) return config;
    },
    load: function load() {
        return d3Let.pop(this.config, 'data');
    }
};

var prefix = '[d3-data-source]';

var warn = function (msg) {
    d3View.viewProviders.logger.warn(prefix + ' ' + msg);
};

var schemes = ['http', 'https', 'ws', 'wss'];

var isUrl = function (value) {
    return d3Let.isString(value) && schemes.indexOf(value.split('://')[0]) > -1;
};

//
//  Remote dataSource
//  ===================
//
//  handle Json and csv data
var remote = {
    init: function init(config) {
        if (isUrl(config)) return { url: config };else if (d3Let.isObject(config) && config.url) return config;
    },
    load: function load() {
        var fetch = d3View.viewProviders.fetch;
        if (!fetch) {
            warn('fetch provider not available, cannot submit');
            return;
        }
        return fetch(this.url).then(parse);
    }
};

function parse(response) {
    var ct = (response.headers.get('content-type') || '').split(';')[0];
    if (ct === 'text/plain' || ct === 'text/csv') return response.text().then(d3Dsv.csvParse);else if (ct === 'application/json') return response.json();else {
        warn('Cannot load content type \'' + ct + '\'');
        return [];
    }
}

var expression = {
    init: function init(config) {
        var opts;
        if (isUrl(config)) return;else if (d3Let.isString(config)) return { expression: config };else if (d3Let.isObject(config) && config.type === 'expression') return config;
        opts = config;
        if (opts) {
            this.name = opts.name || this.dataName();
            this.expression = d3View.viewExpression(opts.expression);
            return this;
        }
    },
    load: function load() {
        if (!this.expression) this.expression = d3View.viewExpression(this.config.expression);
        var model = this.store.model;
        return this.expression.eval(model);
    }
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

















































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var dataEvents = d3Dispatch.dispatch('init', 'data');

var dataSourcePrototype = {
    init: function init() {},
    size: function size() {
        return this.cf.size();
    },
    load: function load() {},
    data: function data(cfg, _data) {
        if (arguments.length === 2) return this.add(_data);else {
            var self = this;
            _data = this.load();
            if (d3Let.isPromise(_data)) return _data.then(function (d) {
                self.data(cfg, d);
            });
            return this.data(cfg, _data);
        }
    },


    // add data to the serie
    add: function add(data) {
        if (!data) return this;
        var size = this.size();
        data = data.map(function (entry) {
            if ((typeof entry === 'undefined' ? 'undefined' : _typeof(entry)) === 'object') entry._id = ++size;else entry = { _id: ++size, data: entry };
            return entry;
        });
        this.cf.add(data);
        dataEvents.call('data', this, data);
        return this;
    }
};

// DataSource container
var dataSources = assign(d3Collection.map(), {
    events: dataEvents,

    add: function add(type, source) {

        function DataSource(config, store) {
            initDataSource(this, type, config, store);
        }

        DataSource.prototype = assign({}, dataSourcePrototype, source);

        this.set(type, DataSource);
        return DataSource;
    },


    // Create a DataSource for a dataStore
    create: function create(config, store) {
        var sources = this.values(),
            cfg;
        for (var i = 0; i < sources.length; ++i) {
            cfg = sources[i].prototype.init(config);
            if (cfg) return new sources[i](cfg, store);
        }
    }
});

function initDataSource(dataSource, type, config, store) {

    var name = store.dataName(d3Let.pop(config, 'name')),
        cf = crossfilter();

    // store.natural = cf.dimension(d => d._id);

    Object.defineProperties(dataSource, {
        cf: {
            get: function get$$1() {
                return cf;
            }
        },
        name: {
            get: function get$$1() {
                return name;
            }
        },
        store: {
            get: function get$$1() {
                return store;
            }
        },
        type: {
            get: function get$$1() {
                return type;
            }
        },
        config: {
            get: function get$$1() {
                return config;
            }
        }
    });

    store.series.set(name, dataSource);
    dataEvents.call('init', dataSource);
    // load data
    dataSource.data();
}

dataSources.add('array', array);
dataSources.add('remote', remote);
dataSources.add('expression', expression);

//
//  DataStore
//  ==============
//
//  Map names to datasets
//  Individual data sets are assumed to contain a collection of records
//  (or “rows”), which may contain any number of named data
//  attributes (fields, or “columns”).
//  Records are modeled using standard JavaScript objects.
function DataStore(model) {
    var series = d3Collection.map();

    Object.defineProperties(this, {
        series: {
            get: function get() {
                return series;
            }
        }
    });

    this.dataCount = 0;
    this.model = model;
}

DataStore.prototype = {
    size: function size() {
        return this.series.size();
    },


    // Add a new serie from a data source
    add: function add(config) {
        return dataSources.create(config, this);
    },


    // set, get or remove data by datasource name
    serie: function serie(name, _serie) {
        if (arguments.length === 1) return this.series.get(name);
        if (_serie === null) {
            var p = this.series.get(name);
            this.series.remove(name);
            return p;
        }
        this.series.set(name, _serie);
        return this;
    },
    dataName: function dataName(name) {
        this.dataCount++;
        if (name) return '' + name;
        var def = this.serie('default');
        if (!def) return 'default';
        return 'serie' + this.dataCount;
    }
};

// utility to load and set locale
//
// manage locale
var locale = {
    formatDate: d3TimeFormat.timeFormat('%d/%m/%Y'),

    formatDateTime: d3TimeFormat.timeFormat('%a %e %b %X %Y'),

    load: function load(symbol) {
        var locales = this,
            source1 = dataSources.create('https://unpkg.com/d3-format/locale/' + symbol + '.json'),
            source2 = dataSources.create('https://unpkg.com/d3-time-format/locale/' + symbol + '.json');

        return Promise.all([source1.load().then(function (locale) {
            locales.symbol = symbol;
            locales.number = locale;
            d3Format.formatDefaultLocale(locale);
        }), source2.load().then(function (locale) {
            locales.time = locale;
            locales.formatDate = d3TimeFormat.timeFormat(locale.date);
            locales.formatDateTime = d3TimeFormat.timeFormat(locale.dateTime);
            d3TimeFormat.timeFormatDefaultLocale(locale);
        })]);
    }
};

//
//  Global options for visuals
//  ============================
//
var globalOptions = {
    // visual data source
    dataSource: null,
    //
    size: {
        // width set by the parent element
        width: null,
        // height set as percentage of width
        height: '70%'
    }
};

var round = function (x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
};

var WIDTH = 400;
var HEIGHT = '75%';

// Internal function for evaluating paper dom size
function getSize(element, options) {
    var size = {
        width: options.width,
        height: options.height
    };

    if (!size.width) {
        size.width = getWidth(element);
        if (size.width) size.widthElement = getWidthElement(element);else size.width = WIDTH;
    }

    if (!size.height) {
        size.height = getHeight(element);
        if (size.height) size.heightElement = getHeightElement(element);else size.height = HEIGHT;
    }

    // Allow to specify height as a percentage of width
    if (typeof size.height === "string" && size.height.indexOf('%') === size.height.length - 1) {
        size.heightPercentage = 0.01 * parseFloat(size.height);
        size.height = round(size.heightPercentage * size.width);
    }

    return size;
}

function getWidth(element) {
    var el = getParentElementRect(element, 'width');
    if (el) return elementWidth(el);
}

function getHeight(element) {
    var el = getParentElementRect(element, 'width');
    if (el) return elementHeight(el);
}

function getWidthElement(element) {
    return getParentElementRect(element, 'width');
}

function getHeightElement(element) {
    return getParentElementRect(element, 'height');
}

function elementWidth(el) {
    var w = el.getBoundingClientRect()['width'],
        s = d3Selection.select(el),
        left = padding(s.style('padding-left')),
        right = padding(s.style('padding-right'));
    return w - left - right;
}

function elementHeight(el) {
    var w = el.getBoundingClientRect()['height'],
        s = d3Selection.select(el),
        top = padding(s.style('padding-top')),
        bottom = padding(s.style('padding-bottom'));
    return w - top - bottom;
}

function getParentElementRect(element, key) {
    var parent = element.node ? element.node() : element,
        v = void 0;
    while (parent && parent.tagName !== 'BODY') {
        v = parent.getBoundingClientRect()[key];
        if (v) return parent;
        parent = parent.parentNode;
    }
}

function padding(value) {
    if (value && value.substring(value.length - 2) == 'px') return +value.substring(0, value.length - 2);
    return 0;
}

function boundingBox(size) {
    var w = size.widthElement ? getWidth(size.widthElement) : size.width,
        h;
    if (size.heightPercentage) h = round(w * size.heightPercentage, 0);else h = size.heightElement ? getHeight(size.heightElement) : size.height;
    if (size.minHeight) h = Math.max(h, size.minHeight);
    return [round(w), round(h)];
}

var liveVisuals = [];
var visualTypes = {};
var visualEvents = d3Dispatch.dispatch('before-init', 'after-init', 'before-draw', 'after-draw');

//
//  Visual Interface
//  ====================
//
//  Base prototype object for visuals
//
var visualPrototype = assign({}, {

    // initialise the visual with options
    initialise: function initialise() {},


    // draw this visual
    draw: function draw() {
        visualEvents.call('before-draw', undefined, this);
        this.doDraw();
        visualEvents.call('after-draw', undefined, this);
    },
    select: function select$$1(el) {
        return d3Selection.select(el);
    },


    // destroy the visual
    destroy: function destroy() {},
    doDraw: function doDraw() {}
}, d3View.viewBase);

//
//  Root element
//  ================
//
//  Controls the size of a a visual or visuals within a group
//  It does not control margins
function RootElement(element, options) {

    Object.defineProperties(this, {
        element: {
            get: function get() {
                return element;
            }
        },
        sel: {
            get: function get() {
                return d3Selection.select(element);
            }
        },
        size: {
            get: function get() {
                return [this.width, this.height];
            }
        }
    });
    this.width = options.width;
    this.height = options.height;
}

RootElement.prototype = {
    select: function select$$1(el) {
        return d3Selection.select(el);
    },


    // Fit the root element to the size of the parent element
    fit: function fit() {
        var size = getSize(this.element, this);
        this.width = size.width;
        this.height = size.height;
    },
    resize: function resize(visual, size) {
        if (!size) size = boundingBox(this);
        var currentSize = this.size;

        if (currentSize[0] !== size[0] || currentSize[1] !== size[1]) {
            this.root.width = size[0];
            this.root.height = size[1];
            visual.draw();
        }
    }
};

//
//  Create a new Visual Constructor
var createVisual = function (type, proto) {
    var opts = d3Let.pop(proto, 'options');
    if (opts) globalOptions[type] = opts;

    function Visual(element, options) {
        options = assign({}, globalOptions[type], options);
        visualEvents.call('before-init', undefined, this, options);
        element = this.initialise(element, options);

        Object.defineProperties(this, {
            visualType: {
                get: function get() {
                    return type;
                }
            },
            element: {
                get: function get() {
                    return element;
                }
            }
        });
        visualEvents.call('after-init', undefined, this, options);
    }

    Visual.prototype = assign({}, visualPrototype, proto);
    visualTypes[type] = Visual;
    return Visual;
};

var prefix$1 = '[d3-visualize]';

var warn$1 = function (msg) {
    d3View.viewProviders.logger.warn(prefix$1 + ' ' + msg);
};

//
//  Visual
//  =============
//
//  A Visual is a a container of visual layers and it is
//  associated with an HTML element
//
//  Usually a Visual contains one layer only, however it is possible to
//  have more than one by combining several layers together. Importantly,
//  layers in one visual generate HTMLElements which are children of the visual
//  element and inherit both the width and height.
//
//  A visual register itself with the liveVisuals array
//
var Visual = createVisual('visual', {

    options: {
        render: 'svg'
    },

    initialise: function initialise(element, options) {
        var self = this;
        if (!element) throw new Error('HTMLElement required by visual group');
        this.root = new RootElement(element, options);
        this.select(element).classed('d3-visual', true);
        // list of layers which define the visual
        this.visuals = [];
        liveVisuals.push(this);

        Object.defineProperties(this, {
            group: {
                get: function get() {
                    return self;
                }
            }
        });
    },


    // Draw the visuals
    doDraw: function doDraw() {
        this.visuals.forEach(function (visual) {
            visual.draw();
        });
    },


    // Add a new visual to this group
    addVisual: function addVisual(options) {
        options.group = this;
        var VisualClass = visualTypes[options.type];
        if (!VisualClass) warn$1('Cannot add visual ' + options.type);else {
            var viz = new VisualClass(this.element, options);
            this.visuals.push(viz);
            return viz;
        }
    },


    //
    // Resize the visual group if it needs resizing
    //
    resize: function resize(size) {
        this.root.resize(this, size);
    },
    destroy: function destroy() {
        var idx = liveVisuals.indexOf(this);
        if (idx > -1) {
            liveVisuals.splice(idx, 1);
            this.visuals.forEach(function (visual) {
                return visual.destroy();
            });
        }
    }
});

//
//  crateChart
//
//  A chart is a drawing of series data in two dimensional
var createChart = function (type, proto) {

    return createVisual(type, assign({}, chartPrototype, proto));
};

var vizPrototype = {
    initialise: function initialise(element, options) {
        if (!options.visual) options.visual = new Visual(element, options);
        this.visual = options.visual;
    }
};

var chartPrototype = assign({}, {

    //  override draw method
    //  invoke doDraw only if a series is available for the chart
    draw: function draw() {
        visualEvents.call('before-draw', this);
        this.applyTransforms();
        if (this.series) {
            this.doDraw();
            visualEvents.call('after-draw', this);
        }
    },


    // Apply data transforms to chart
    applyTransforms: function applyTransforms() {}
}, vizPrototype);

//
//  Bar Chart
//  =============
//
//  The barchart is one of the most flexible visuals.
//  It can be used to display label data as well as
//  timeserie data. It can display absulte values as
//  proportional data via vertical staking and normalization
var bar = createChart('barchart', {

    options: {
        orientation: 'vertical',
        // stack multiple y series?
        stack: false
    },

    doDraw: function doDraw() {}
});

//
//  Line Chart
//  =============
//
//  The barchart is one of the most flexible visuals.
//  It can be used to display label data as well as
//  timeserie data. It can display absulte values as
//  proportional data via vertical staking and normalization
var line$1 = createChart('linechart', {

    options: {
        lineWidth: 1,
        colorOpacity: 1,
        curve: 'cardinalOpen'
    },

    doDraw: function doDraw() {
        var data = this.series,
            aesthetics = this.aesthetics,
            path = this.plot.path(this).data([data]),
            x = this.scaled(this.mapping.x, this.plot, data),
            y = this.scaled(this.mapping.y, this.plot, data),
            line$$1 = d3_shape.line().x(x).y(y).curve(curve(this, aesthetics.curve)),
            width = this.plot.dim(aesthetics.lineWidth),
            merge = this.plot.transition('update');

        path.enter().append('path').attr('class', 'line').attr('fill', 'none').attr('stroke', aesthetics.color).attr('stroke-opacity', 0).attr('stroke-width', width).merge(path).transition(merge).attr('stroke', aesthetics.color).attr('stroke-opacity', aesthetics.colorOpacity).attr('stroke-width', width).attr('d', line$$1);

        path.exit().remove();
    }
});

function curve(layer, name) {
    var obj = d3_shape[curveName(name)];
    if (!obj) {
        warn$1('Could not locate curve type "' + name + '"');
        name = curveName(layer.defaults().curveName);
        obj = d3_shape[name];
    }
    return obj;
}

function curveName(name) {
    if (name.substring(0, 5) !== 'curve') name = 'curve' + name[0].toUpperCase() + name.substring(1);
    return name;
}

//
//  vizComponent base prototype
//  =============================
//
//  Some common properties and methods for all visualize components
//
var vizComponent = {
    props: ['schema', // Schema is a collection of fields to display in the table
    'datasource', // Data source
    'plugins'],

    render: function render(props, attrs, el) {
        var self = this,
            inner = this.select(el).html();
        //
        // make sure data store exists
        this.dataStore();
        //
        // build
        return this.getSchema(props.schema, function (schema) {
            if (!d3Let.isObject(schema)) schema = {};
            return self.build(schema, inner);
        });
    },
    getSchema: function getSchema(input, build) {
        if (d3Let.isString(input)) {
            return this.json(input).then(build);
        } else return build(input);
    },
    dataStore: function dataStore() {
        var store = this.model.dataStore;

        if (!store) {
            store = new DataStore(this.model);
            this.model.dataStore = store;
        }
        return store;
    },

    //
    // build the visual component has the schema available
    build: function build() {}
};
//
//  Dashboard Component
//  ========================
//
//  A collection of visual components arranged according
//  to a custom layout.
//
//  * Dashboard visuals are independent of each other but
//    interact via the data object
//  * The Dashboard layout is given by the inner HTML elements
//  * The configuration is obtained via the schema property which
//    can be either:
//      1) an object
//      2) a url
var dashboard = assign({}, vizComponent, {
    build: function build(schema, inner) {
        var model = this.model;
        // Set itself as the visualGroup
        model.dashboard = model;
        // collection of visuals
        model.visuals = [];
        // model.visuals = schema.visuals;
        // self.model.$set('dashboard', schema);
        var sel = this.createElement('div').classed('dashboard', true);
        return this.mountInner(sel, inner);
    }
});

//
//  Visual component
//  ======================
//
//  An element containing a visualization
var visual = assign({}, vizComponent, {
    build: function build(schema) {
        var model = this.model,
            dashboard$$1 = model.dashboard,
            sel = this.createElement('div');
        // no visual group, the visual is not used in a group
        // create its own group
        if (dashboard$$1) {
            dashboard$$1.visuals.push(model);
        }
        // build the visual group object object
        model.visual = new Visual(sel.node(), schema);
        return sel;
    }
});

var parsers = {
    date: d3TimeFormat.isoParse,

    string: function string(value) {
        return '' + value;
    }
};

// formatters
var formatters = {
    number: function number(value) {
        return value;
    },
    date: function date(value) {
        return locale.formatDate(value);
    },
    boolean: function boolean(value) {
        return value;
    }
};

//
// Create table columns from schema
var createColumns = function (schema) {
    var columns = [];
    var col = void 0;

    if (!schema) return columns;

    if (d3Let.isArray(schema)) schema = { properties: schema };

    if (d3Let.isObject(schema.properties)) {
        for (var key in schema.properties) {
            col = schema.properties[key];
            if (d3Let.isObject(col)) {
                if (!col.name) col.name = key;
                columns.push(col);
            }
        }
    } else columns.push.apply(columns, toConsumableArray(schema.properties));

    return columns.map(function (col) {
        if (!d3Let.isObject(col)) col = { name: col };
        if (!col.label) col.label = col.name;
        if (!col.hidden) col.hidden = false;
        if (!col.$parse) col.$parse = parsers[col.type] || parsers.string;
        if (!col.$html) col.$html = formatters[col.type] || $html;
        return col;
    });
};

function $html(value) {
    return value;
}

//
//  dataStore integration with visuals
visualEvents.on('after-init.data', function (viz, options) {
    if (viz.visualType === 'visual') setupVisual(viz, options);else setupLayer(viz, options);
});

function setupVisual(visual, options) {
    var store = options.dataStore,
        data = d3Let.pop(options, 'data');
    //
    // No data entry - skip data setup
    if (!data) return;
    //
    if (!store) store = new DataStore();

    visual.dataStore = store;
    //
    // data is a string, it must be already registered with store
    if (d3Let.isString(data)) data = { name: data };

    if (!store.get(data.name)) {
        data = store.add(data);
    }
    visual.data = data;
}

function setupLayer(layer, options) {
    var visual = layer.visual,
        store = visual.dataStore,
        data = options.data;

    // no data - do nothing
    if (!store) return;

    if (data) layer.data = data;
}

if (!globalOptions.resizeDelay) globalOptions.resizeDelay = 200;

if (d3Let.inBrowser) {
    var resize = d3View.viewDebounce(function () {
        liveVisuals.forEach(function (p) {
            return p.resize();
        });
    }, globalOptions.resizeDelay);

    d3Selection.select(window).on('resize.visuals', resize);
}

// Title plot annotation
visualEvents.on('after-init.title', function (visual, options) {
    var title = options.title;
    if (!title) return;
    if (d3Let.isString(title)) title = { text: title };
    visual.title = title;
});

//
// Use clusterize.js to render the table
var clusterize = function (table, options) {
    return d3Require.require('clusterize.js@0.17.6').then(function (Clusterize) {
        return clusterize$1(Clusterize, table, options);
    });
};

function clusterize$1(Clusterize) {
    var cl = new Clusterize();
    return cl;
}

var paginate = function (table) {
    return table;
};

//
//  bootstrap styling for tabular component
//  ==========================================
//
var defaults$2 = {
    over: true,
    small: true,
    bordered: true,
    loadingClass: 'table-info',
    loadingTextClass: 'text-center'
};

var bootstrap = function (table, options) {
    var style = table.model.style;
    style.$update(assign({}, defaults$2, options));

    style.tableClass = 'table table-responsive';
    if (style.striped) style.tableClass += ' table-striped';
    if (style.over) style.tableClass += ' table-hover';
    if (style.bordered) style.tableClass += ' table-bordered';
    if (style.small) style.tableClass += ' table-sm';
};

//
//  Plugins for visuals and tabular
//
// visual plugins
//
//  This module depends on core but not on components
// plugins add functionalities to a d3 table
// A plugin is a function accepting two parameters:
//  * the table component
//  * object with configuration parameters
var tablePlugins = {
    bootstrap: bootstrap,
    clusterize: clusterize,
    paginate: paginate
};

// import {timeout} from 'd3-timer';
var tableTpl = '<table d3-class="[style.tableClass, loadingData ? \'loading\' : null]">\n<thead d3-class="style.headerClass">\n<tr d3-class="style.headerRowClass">\n  <th d3-for="col in columns"\n        d3-html="col.label"\n        d3-if="!col.hidden">\n  </th>\n</tr>\n<tr d3-if="loadingData" d3-class="style.loadingClass">\n    <td d3-attr-colspan="columns.length">\n        <p d3-class="style.loadingTextClass">loading data</p>\n    </td>\n</tr>\n</thead>\n<tbody></tbody>\n</table>';

var tabular = assign({}, vizComponent, {
    model: function model() {
        return {
            header: true, // show header
            columns: [], // table columns
            loadingData: false,
            style: {
                tableClass: null,
                headerClass: null,
                headerRowClass: null,
                loadingClass: 'loading',
                loadingTextClass: null
            }
        };
    },
    build: function build(schema) {
        var self = this,
            model = this.model,
            plugins = schema.plugins || [];
        // model.allData = crossfilter([]);
        this.records = {};
        this.data = [];
        this.template = tableTpl;

        model.columns = createColumns(schema);
        // if (data.dataurl) model.dataLoader = new DataLoader(data.dataurl);

        if (!d3Let.isArray(plugins)) {
            warn$1('plugins should be an array');
        } else {
            var promises = [];
            var promise = void 0;
            plugins.forEach(function (plugin) {
                if (d3Let.isString(plugin)) plugin = { name: plugin };
                if (!tablePlugins[plugin.name]) warn$1('Unknown table plugin ' + plugin.name);else {
                    promise = tablePlugins[plugin.name](self, plugin);
                    if (d3Let.isPromise(promise)) promises.push(promise);
                }
            });
            if (promises.length) return Promise.all(promises).then(function () {
                return self.viewElement(self.template);
            });
        }

        return this.viewElement(this.template);
    },
    mounted: function mounted() {
        var vm = this,
            model = this.model;
        if (model.dataLoader) {
            var p = model.dataLoader.load(model.columns);
            if (p) {
                model.loadingData = true;
                p.then(function (data) {
                    // var allData = model.allData;
                    model.loadingData = false;
                    addData(vm, data);
                }, function (err) {
                    model.loadingData = false;
                    return err;
                });
            }
        }
    }
});

// new data to include in the table
function addData(vm, newData) {
    var records = vm.records,
        data = vm.data,
        model = vm.model,
        delayData = newData;

    var record = void 0,
        value = void 0;

    newData = delayData.splice(0, 100);

    newData.forEach(function (d) {
        if (d.id) {
            record = d.id ? records[d.id] : null;
            if (record) d = assign(record, d);else {
                data.push(d);
                records[d.id] = d;
            }
        } else data.push(d);
        model.columns.forEach(function (col) {
            d[col.name] = col.$parse(d[col.name]);
        });
    });

    //if (delayData.length)
    //    timeout(() => addData(vm, delayData));

    var rows = vm.sel.select('tbody').selectAll('tr').data(data);

    rows.enter().append('tr').attr('scope', 'row').selectAll('td').data(model.columns).enter().append('td').style('display', function (col) {
        return col.hidden ? 'none' : null;
    }).html(function (col) {
        record = this.parentNode.__data__;
        value = record[col.name];
        return col.$html(value === undefined ? '' : value);
    });
}

//
//  d3-view components
//  ======================
//
//  d3-view plugin for visualization components
//
// Visual components plugin
var index = {
    tabularPlugins: tablePlugins,

    install: function install(vm) {
        vm.addComponent('dashboard', dashboard);
        vm.addComponent('visual', visual);
        vm.addComponent('tabular', tabular);
    }
};

exports.visualizeVersion = version;
exports.randomPath = randompath;
exports.DataStore = DataStore;
exports.dataSources = dataSources;
exports.dataLocale = locale;
exports.Visual = Visual;
exports.crateChart = createChart;
exports.BarChart = bar;
exports.LineChart = line$1;
exports.visualComponents = index;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=d3-visualize.js.map
