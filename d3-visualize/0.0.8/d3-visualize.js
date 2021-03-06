// d3-visualize Version 0.0.8. Copyright 2017 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-canvas-transition'), require('object-assign'), require('d3-array'), require('d3-random'), require('d3-collection'), require('d3-let'), require('d3-view'), require('d3-dsv'), require('d3-dispatch'), require('crossfilter'), require('d3-format'), require('d3-time-format'), require('d3-selection'), require('d3-shape')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3-canvas-transition', 'object-assign', 'd3-array', 'd3-random', 'd3-collection', 'd3-let', 'd3-view', 'd3-dsv', 'd3-dispatch', 'crossfilter', 'd3-format', 'd3-time-format', 'd3-selection', 'd3-shape'], factory) :
	(factory((global.d3 = {}),global.d3,global.assign,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.crossfilter,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3CanvasTransition,assign,d3Array,d3Random,d3Collection,d3Let,d3View,d3Dsv,d3Dispatch,crossfilter,d3Format,d3TimeFormat,d3Selection,d3_shape) { 'use strict';

assign = assign && assign.hasOwnProperty('default') ? assign['default'] : assign;
crossfilter = crossfilter && crossfilter.hasOwnProperty('default') ? crossfilter['default'] : crossfilter;

var version = "0.0.8";

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

//
//  Array DataSource
//  ====================
//
//  Data is given in an array, pkain & simple
var array = {
    initialise: function initialise(config) {
        this._data = config.data;
    },
    getConfig: function getConfig(config) {
        if (d3Let.isArray(config)) return { data: config };else if (d3Let.isObject(config) && d3Let.isArray(config.data)) return config;
    },
    getData: function getData() {
        return d3View.resolvedPromise(this.asFrame(this._data));
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
    getConfig: function getConfig(config) {
        if (isUrl(config)) return { url: config };else if (d3Let.isObject(config) && config.url) return config;
    },
    getData: function getData() {
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

//
//  Remote dataSource
//  ===================
//
//  handle Json and csv data
var composite = {
    getConfig: function getConfig(config) {
        if (d3Let.isObject(config) && config.source) {
            if (!d3Let.isArray(config.source)) config.source = [config.source];
            return config;
        }
    },
    getData: function getData() {
        var store = this.store;
        return Promise.all(this.source.map(function (source) {
            return store.getData(source);
        })).then(function (frames) {
            if (frames.length === 1) return frames[0];
            return frames[0];
        });
    }
};

var expression = {
    initialise: function initialise(config) {
        this.expression = d3View.viewExpression(config.expression);
    },
    getConfig: function getConfig(config) {
        if (d3Let.isObject(config) && config.expression) return config;
    },
    getData: function getData() {
        var self = this,
            model = this.store.model;
        return d3View.resolvedPromise(this.expression.eval(model)).then(function (data) {
            return self.asFrame(data);
        });
    }
};

var dataEvents = d3Dispatch.dispatch('init', 'data');

//
//  DataSource prototype
//  ======================
var dataSourcePrototype = {

    // get the config object-assign// This method is used by the prototype
    // to check if the config object is a valid one
    getConfig: function getConfig() {},


    // initialise the data source with a config object
    initialise: function initialise(config) {
        assign(this, config);
    },
    getData: function getData() {},


    //
    // given a data object returns a Cross filter object
    asFrame: function asFrame(data) {
        data = data.map(function (entry) {
            if (entry.constructor !== Object) entry = { data: entry };
            return entry;
        });
        return crossfilter(data);
    }
};

// DataSource container
var dataSources = assign(d3Collection.map(), {
    events: dataEvents,

    add: function add(type, source) {

        // DataSource constructor
        function DataSource(config, store) {
            initDataSource(this, type, config, store);
        }

        DataSource.prototype = assign({}, dataSourcePrototype, source);

        this.set(type, DataSource);
        return DataSource;
    },


    // Create a new DataSource
    create: function create(config, store) {
        var sources = this.values(),
            cfg;
        for (var i = 0; i < sources.length; ++i) {
            cfg = sources[i].prototype.getConfig(config);
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
            get: function get() {
                return cf;
            }
        },
        name: {
            get: function get() {
                return name;
            }
        },
        store: {
            get: function get() {
                return store;
            }
        },
        type: {
            get: function get() {
                return type;
            }
        },
        config: {
            get: function get() {
                return config;
            }
        }
    });

    dataSource.initialise(config);
    store.sources.set(name, dataSource);
    dataEvents.call('init', undefined, dataSource);
}

//
// Create a groupby transform from a config object
var groupby = function (config) {
    return groupby;

    function groupby(series) {
        return series.groupby(config.field);
    }
};

// Collection of transforms
//
//  transforms Store
var transformStore = {
    groupby: groupby
};

// Apply data transforms to a series
function applyTransforms(series, transforms) {
    var ts = void 0;
    if (!transforms) return series;
    transforms.forEach(function (transform) {
        ts = transform(series);
        series = ts ? ts : series;
    });
    return series;
}

dataSources.add('array', array);
dataSources.add('remote', remote);
dataSources.add('composite', composite);
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
    var sources = d3Collection.map();

    Object.defineProperties(this, {
        sources: {
            get: function get() {
                return sources;
            }
        }
    });

    // transforms function
    this.transforms = assign({}, transformStore);
    this.dataCount = 0;
    this.model = model;
}

DataStore.prototype = {
    size: function size() {
        return this.sources.size();
    },


    // Add a new serie from a data source
    addSources: function addSources(config) {
        //
        // data is a string, it must be already registered with store
        if (d3Let.isString(config)) config = { source: config };

        if (d3Let.isArray(config)) {
            var self = this;
            return config.map(function (cfg) {
                return dataSources.create(cfg, self);
            });
        } else if (config) {
            return dataSources.create(config, this);
        }
    },
    addTransforms: function addTransforms(transforms) {
        assign(this.transforms, transforms);
    },


    // set, get or remove a data source
    source: function source(name, _source) {
        if (arguments.length === 1) return this.sources.get(name);
        if (_source === null) {
            var p = this.sources.get(name);
            this.sources.remove(name);
            return p;
        }
        this.sources.set(name, _source);
        return this;
    },
    clearCache: function clearCache() {
        this.sources.each(function (ds) {
            delete ds.cachedFrame;
        });
    },


    // get data from a source
    getData: function getData(source) {
        var ds = this.sources.get(source);
        if (!ds) throw new Error('Data source ' + source + ' not available');
        if (ds.cachedFrame) return d3View.resolvedPromise(ds.cachedFrame);
        return ds.getData().then(function (frame) {
            ds.cachedFrame = frame;
            return frame;
        });
    },
    dataName: function dataName(name) {
        this.dataCount++;
        if (name) return '' + name;
        var def = this.source('default');
        if (!def) return 'default';
        return 'source' + this.dataCount;
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

var CONTAINERS = ['visual', 'container'];

//
//  Gloval visuals object
//  ==========================
//
//  Container of
//  * live visuals
//  * visual types
//  * paper types
//  * visual events
var visuals = {
    live: [],
    types: {},
    papers: {},
    events: d3Dispatch.dispatch('before-init', 'after-init', 'before-draw', 'after-draw')
};

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
    draw: function draw() {},
    select: function select$$1(el) {
        return d3Selection.select(el);
    },


    // destroy the visual
    destroy: function destroy() {},


    // get a reactive model for type
    getModel: function getModel(type) {
        var model = this.model[type];
        if (!model && type in globalOptions) {
            var options = d3Let.pop(this.options, type);
            if (this.visualParent) model = this.visualParent.getModel(type).$child(options);else {
                model = this.model.$new(globalOptions[type]);
                model.$update(options);
            }
            this.model[type] = model;
        }
        return model;
    }
}, d3View.viewBase);

//
//  Create a new Visual Constructor
var createVisual = function (type, proto) {
    var opts = d3Let.pop(proto, 'options');
    if (opts) globalOptions[type] = opts;

    function Visual(element, options, model) {
        Object.defineProperties(this, {
            visualType: {
                get: function get() {
                    return type;
                }
            },
            isViz: {
                get: function get() {
                    return CONTAINERS.indexOf(type) === -1;
                }
            }
        });
        this.options = options || {};
        visuals.events.call('before-init', undefined, this);
        this.initialise(element, model);
        visuals.events.call('after-init', undefined, this);
    }

    Visual.prototype = assign({}, visualPrototype, proto);
    visuals.types[type] = Visual;
    return Visual;
};

var containerPrototype = {
    initialise: function initialise(element, model) {
        if (!model) model = d3View.viewModel();
        this.model = model;
        this.visualParent = model.visualParent;
    }
};

var VisualContainer = createVisual('container', containerPrototype);

var prefix$1 = '[d3-visualize]';

var warn$1 = function (msg) {
    d3View.viewProviders.logger.warn(prefix$1 + ' ' + msg);
};

var round = function (x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
};

var WIDTH = 400;
var HEIGHT = '75%';

function sizeValue(value, size) {
    if (typeof value === "string" && value.indexOf('%') === value.length - 1) return round(0.01 * parseFloat(value) * size);
    return +value;
}

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
//  A visual register itself with the visuals.live array
//
var Visual = createVisual('visual', assign({}, containerPrototype, {

    options: {
        render: 'svg',
        // width set by the parent element
        width: null,
        // height set as percentage of width
        height: '70%'
    },

    initialise: function initialise(element, model) {
        if (!element) throw new Error('HTMLElement required by visual group');
        this.select(element).classed('d3-visual', true);
        containerPrototype.initialise.call(this, element, model);
        // list of layers which define the visual
        this.layers = [];
        this.drawCount = 0;
        visuals.live.push(this);

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
    },


    // Draw the visual
    draw: function draw() {
        if (!this.drawCount) {
            this.drawCount = 1;
            this.fit();
        } else {
            this.drawCount++;
            this.clear();
        }
        visuals.events.call('before-draw', undefined, this);
        this.layers.forEach(function (visual) {
            visual.draw();
        });
        visuals.events.call('after-draw', undefined, this);
    },
    clear: function clear() {},


    // Add a new visual to this group
    addVisual: function addVisual(options) {
        var type = d3Let.pop(options, 'type');
        var VisualClass = visuals.types[type];
        if (!VisualClass) warn$1('Cannot add visual ' + options.type);else {
            this.model.visualParent = this;
            return new VisualClass(this.element, this.model);
        }
    },

    // Fit the root element to the size of the parent element
    fit: function fit() {
        var size = getSize(this.element.parentNode, this.getModel('visual'));
        this.width = size.width;
        this.height = size.height;
        this.sel.style('width', this.width + 'px').style('height', this.height + 'px');
    },
    resize: function resize(size) {
        if (!size) size = boundingBox(this);
        var currentSize = this.size;

        if (currentSize[0] !== size[0] || currentSize[1] !== size[1]) {
            d3View.viewDebug('Resizing visual "' + this.model.uid + '"');
            this.width = size[0];
            this.height = size[1];
            this.draw();
        }
    },
    destroy: function destroy() {
        var idx = visuals.live.indexOf(this);
        if (idx > -1) {
            visuals.live.splice(idx, 1);
            this.visuals.forEach(function (visual) {
                return visual.destroy();
            });
        }
    }
}));

//
//  crateChart
//
//  A chart is a drawing of series data in two dimensional
var createChart = function (type, proto) {

    return createVisual(type, assign({}, vizPrototype, chartPrototype, proto));
};

//  Viz Prototype
//  =================
var vizPrototype = {
    initialise: function initialise(element, model) {
        var visual = model ? model.visualParent : null;
        if (!visual || visual.visuatlType !== 'visual') {
            visual = new Visual(element, this.options, model);
            this.options = {};
        }
        this.visualParent = visual;
        this.model = visual.model.$child();
        visual.layers.push(this);
    },


    //
    // paper object for this visualisation
    paper: function paper() {
        var visual = this.getModel('visual'),
            paper = this._paper;
        if (paper && paper.type === visual.render) return paper;
        var PaperType = visuals.papers[visual.render];
        if (!PaperType) throw new Error('Unknown paper ' + visual.render);
        paper = new PaperType(this);
        this._paper = paper;
        return paper;
    },
    translate: function translate(x, y) {
        if (d3Let.isFunction(x)) {
            return function (d) {
                var xt = x(d) || 0,
                    yt = y(d) || 0;
                return 'translate(' + xt + ', ' + yt + ')';
            };
        } else return 'translate(' + x + ', ' + y + ')';
    }
};

var chartPrototype = {

    //  override draw method
    draw: function draw() {
        var _this = this;

        visuals.events.call('before-draw', undefined, this);
        var self = this;

        this.getData().then(function (frame) {
            if (frame) {
                frame = applyTransforms(frame, self.transforms);
                _this.doDraw(frame);
                visuals.events.call('after-draw', undefined, _this);
            }
        });
    }
};

function createPaper(type, proto) {

    function Paper(viz) {
        var element = this.initialise(viz);
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
            }
        });
    }

    Paper.prototype = assign({}, paperPrototype, proto);

    visuals.papers[type] = Paper;
    return Paper;
}

var paperPrototype = {
    initialise: function initialise() {},
    transition: function transition() {},
    dim: function dim(value) {
        return value;
    }
};

var Svg = createPaper('svg', {
    initialise: function initialise(viz) {
        var svg = viz.visualParent.sel.append('svg').attr('id', viz.model.uid).classed(viz.visualType, true);
        return svg.node();
    }
});

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
        // build
        return this.getSchema(props.schema, function (schema) {
            if (!d3Let.isObject(schema)) schema = {};
            return self.build(schema, inner, attrs);
        });
    },


    // get the schema from the input schema property
    getSchema: function getSchema(input, build) {
        var parent = this.model.visualParent;

        // allow to specify the schema as an entry of
        // visuals object in the dashboard schema
        if (parent && parent !== this.model && d3Let.isString(input)) {
            var schema = parent.options.visuals[input];
            if (schema) input = schema;
        }

        if (d3Let.isString(input)) {
            return this.json(input).then(build);
        } else return build(input);
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
    build: function build(schema, inner, attrs) {
        var model = this.model;
        var sel = this.createElement('div');
        if (attrs.class) sel.attr('class', attrs.class);
        if (!schema.visuals) schema.visuals = {};
        model.visualParent = new VisualContainer(sel.node(), schema, model);
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
            sel = this.createElement('div'),
            type = d3Let.pop(schema, 'type') || 'visual',
            Visual = visuals.types[type];
        // build the visual object
        if (Visual) {
            var visual = new Visual(sel.node(), schema, model);
            model.visualParent = visual.isViz ? visual.visualParent : visual;
        } else warn$1('Unknown visual ' + type);
        return sel;
    },


    // once the element is mounted in the dom, draw the visual
    mounted: function mounted() {
        if (this.model.visualParent) this.model.visualParent.draw();
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
    } else Array.prototype.push.apply(columns, schema.properties);

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
vizPrototype.getData = function () {
    var name = this.model.data;
    if (!name) {
        warn$1('Visual without data name, cannot get data');
        return d3View.resolvedPromise();
    }
    return this.model.dataStore.getData(name);
};

visuals.events.on('before-init.data', function (viz) {
    if (!viz.isViz) return;
    // remove data from options
    viz.data = d3Let.pop(viz.options, 'data');
});

visuals.events.on('after-init.data', function (viz) {
    if (viz.isViz) setupLayer(viz);else setupVisual(viz);
});

function setupVisual(visual) {
    var store = visual.model.dataStore,
        data = d3Let.pop(visual.options, 'data');
    //
    if (!store) {
        store = new DataStore(visual.model);
        visual.model.dataStore = store;
    }
    store.addSources(data);
}

function setupLayer(layer) {
    var store = layer.model.dataStore,
        data = d3Let.pop(layer, 'data');
    if (!data) return;
    if (d3Let.isString(data)) data = { source: data };
    if (!data.name) data.name = layer.model.uid;
    data = store.addSources(data);
    if (data) layer.model.$set('data', data.name);else warn$1('Could not create data source ' + data.name);
}

if (!globalOptions.resizeDelay) globalOptions.resizeDelay = 200;

if (d3Let.inBrowser) {
    var resize = d3View.viewDebounce(function () {
        visuals.live.forEach(function (p) {
            return p.resize();
        });
    }, globalOptions.resizeDelay);

    d3Selection.select(window).on('resize.visuals', resize);
}

// Title plot annotation
globalOptions.title = {
    text: null,
    fontSize: '10px'
};

visuals.events.on('after-init.title', function (viz) {
    var title = viz.options.title;
    if (d3Let.isString(title)) viz.options.title = { text: title };
});

var KEYS = ['top', 'bottom', 'left', 'right'];
var LEFTRIGHT = ['left', 'right'];

// margin for visual marks
globalOptions.margin = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
};
// padding for the visual paper
globalOptions.padding = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
};

//
//  Bounding box for a viz
//  ==========================
vizPrototype.boundingBox = function () {
    var width = this.visualParent.width,
        height = this.visualParent.height,
        margin = calculate(this.getModel('margin'), width, height),
        padding = calculate(this.getModel('padding'), width, height),
        total = KEYS.reduce(function (o, key) {
        o[key] = margin[key] + padding[key];
        return o;
    }, {});
    return {
        width: width,
        height: height,
        margin: margin,
        padding: margin,
        total: total,
        innerWidth: width - total.left - total.right,
        innerHeight: width - total.top - total.bottom
    };
};

visuals.events.on('after-init.margin', function (viz) {
    viz.margin = margins('margin', viz);
    viz.padding = margins('padding', viz);
});

function margins(name, viz) {
    var value = viz.options[name];

    if (value !== undefined && !d3Let.isObject(value)) {
        var v = value || 0;
        viz.options[name] = {
            left: v,
            right: v,
            top: v,
            bottom: v
        };
    }
}

function calculate(model, width, height) {
    return KEYS.reduce(function (o, key) {
        o[key] = sizeValue(model[key], LEFTRIGHT.indexOf(key) > -1 ? width : height);
        return o;
    }, {});
}

globalOptions.color = {
    scale: 'cool'
};

//
//  Color scale method
//  ==========================
vizPrototype.colorScale = function () {
    var color = this.getModel('color');
    return color;
};

//
// Use clusterize.js to render the table
var clusterize = function (table, options) {
    return table.require('clusterize.js@0.17.6').then(function (Clusterize) {
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
var defaults$1 = {
    over: true,
    small: true,
    bordered: true,
    loadingClass: 'table-info',
    loadingTextClass: 'text-center'
};

var bootstrap = function (table, options) {
    var style = table.model.style;
    style.$update(assign({}, defaults$1, options));

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

var pi = Math.PI;
var rad = pi / 180;

//
//  Pie Chart
//  =============
//
var pie$1 = createChart('piechart', {

    options: {
        // The data values from this field will be encoded as angular spans.
        // If omitted, all pie slices will have equal spans
        field: null,
        startAngle: 0,
        endAngle: 360,
        sort: false,
        innerRadius: 0,
        padAngle: 0,
        cornerRadius: 0,
        //
        color: null,
        lineWidth: 1,
        colorOpacity: 1,
        fillOpacity: 1
    },

    doDraw: function doDraw(frame) {
        var model = this.model,
            cscale = model.colorScale,
            box = this.boundingBox(),
            outerRadius = box.innerWidth / 2,
            innerRadius = model.innerRadius * outerRadius,
            angles = d3_shape.pie().padAngle(rad * model.padAngle).startAngle(rad * model.startAngle),
            arcs = d3_shape.arc().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(model.cornerRadius),
            paper = this.paper(),
            update = paper.transition('update'),
            fill = this.scaled(this.accessor(model.field), cscale),
            slices = paper.sel.attr("transforms", this.translate(box.shift.left + outerRadius, box.shift.top + outerRadius)).selectAll('.slice').data(angles(frame));

        slices.enter().append('path').attr('class', 'slice').attr('stroke', model.color).attr('stroke-opacity', 0).attr('fill-opacity', 0).attr('fill', fill).attr('stroke-width', paper.dim(model.lineWidth)).merge(slices).transition(update).attr('stroke', model.color).attr('stroke-opacity', model.colorOpacity).attr('d', arcs).attr('fill', fill).attr('fill-opacity', model.fillOpacity);

        slices.exit().remove();
    }
});

//
//  Treemap
//  =============
//
var treemap = createChart('treemap', {
    requires: ['d3-treemap']

});

exports.visualizeVersion = version;
exports.randomPath = randompath;
exports.DataStore = DataStore;
exports.dataSources = dataSources;
exports.dataLocale = locale;
exports.Visual = Visual;
exports.crateChart = createChart;
exports.cratePaper = createPaper;
exports.Svg = Svg;
exports.visualComponents = index;
exports.BarChart = bar;
exports.LineChart = line$1;
exports.PieChart = pie$1;
exports.Treemap = treemap;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=d3-visualize.js.map
