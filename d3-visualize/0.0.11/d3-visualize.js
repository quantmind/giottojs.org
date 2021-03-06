// d3-visualize Version 0.0.11. Copyright 2017 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-canvas-transition'), require('object-assign'), require('d3-array'), require('d3-random'), require('d3-collection'), require('d3-let'), require('d3-view'), require('d3-dsv'), require('d3-dispatch'), require('crossfilter'), require('d3-time-format'), require('d3-format'), require('d3-selection'), require('d3-scale'), require('d3-shape')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3-canvas-transition', 'object-assign', 'd3-array', 'd3-random', 'd3-collection', 'd3-let', 'd3-view', 'd3-dsv', 'd3-dispatch', 'crossfilter', 'd3-time-format', 'd3-format', 'd3-selection', 'd3-scale', 'd3-shape'], factory) :
	(factory((global.d3 = {}),global.d3,global.assign,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.crossfilter,global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3CanvasTransition,assign,d3Array,d3Random,d3Collection,d3Let,d3View,d3Dsv,d3Dispatch,crossfilter,d3TimeFormat,d3Format,d3Selection,d3_scale,d3_shape) { 'use strict';

assign = assign && assign.hasOwnProperty('default') ? assign['default'] : assign;
crossfilter = crossfilter && crossfilter.hasOwnProperty('default') ? crossfilter['default'] : crossfilter;

var version = "0.0.11";

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
    initialise: function initialise(config) {
        this.url = config.url;
    },
    getData: function getData() {
        var fetch = d3View.viewProviders.fetch,
            self = this;
        if (!fetch) {
            warn('fetch provider not available, cannot submit');
            return d3View.resolvedPromise([]);
        }
        return fetch(this.url).then(parse).then(function (data) {
            return self.asFrame(data);
        });
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
//  A composite dataSource
//  ===================
//
//  A composite data source has the source attribute with the name of one
//  or more data sets to use as the source for this data set.
//  The source property is useful in combination with a transform pipeline
//  to derive new data.
//  If string-valued, indicates the name of the source data set.
//  If array-valued, specifies a collection of data source names that
//  should be merged (unioned) together.
var composite = {
    initialise: function initialise(config) {
        this.source = config.source;
    },
    getConfig: function getConfig(config) {
        if (d3Let.isObject(config) && config.source) {
            if (!d3Let.isArray(config.source)) config.source = [config.source];
            return config;
        }
    },
    getData: function getData() {
        var store = this.store,
            self = this;
        var frame = void 0;
        return Promise.all(this.source.map(function (source) {
            return store.getData(source);
        })).then(function (frames) {
            if (frames.length === 1) frame = frames[0];else frame = self.mergeFrames(frames);
            return self.asFrame(frame);
        });
    },


    // TODO: implement frame merging
    mergeFrames: function mergeFrames(frames) {
        return frames[0];
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

var accessor = function (field) {
    return function (d) {
        return d[field];
    };
};

function DataFrame(data, serie, store) {
    if (d3Let.isArray(data)) data = {
        store: store,
        data: data,
        dimensions: {},
        series: d3Collection.map()
    };
    Object.defineProperties(this, {
        _inner: {
            get: function get() {
                return data;
            }
        },
        store: {
            get: function get() {
                return data.store;
            }
        },
        data: {
            get: function get() {
                return data.data;
            }
        },
        dimensions: {
            get: function get() {
                return data.dimensions;
            }
        },
        series: {
            get: function get() {
                return data.series;
            }
        }
    });
    this.serie = serie;
}

DataFrame.prototype = {
    size: function size() {
        return this.data.length;
    },
    new: function _new(serie) {
        if (d3Let.isArray(serie)) return new DataFrame(serie, null, this.store);else return new DataFrame(this._inner, serie);
    },
    cf: function cf() {
        if (!this._inner.cf) this._inner.cf = crossfilter(this.data);
        return this._inner.cf;
    },
    dimension: function dimension(name, value, keepExisting) {
        if (arguments.length === 1) keepExisting = true;
        var current = this.dimensions[name];
        if (current) {
            if (keepExisting) return current;
            current.dispose();
        }
        if (!value) value = accessor(name);
        this.dimensions[name] = this.cf().dimension(value);
        return this.dimensions[name];
    },
    add: function add() {
        //this._inner.cf.add(data);
    },
    map: function map$$1(mapper) {
        return this.new(this.data.map(mapper));
    }
};

var prefix$1 = '[d3-visualize]';

var warn$1 = function (msg) {
    d3View.viewProviders.logger.warn(prefix$1 + ' ' + msg);
};

//
// Create a groupby transform from a config object
var filter = function (config) {
    var dimension = config.dimension;

    if (!dimension) warn$1('Filter transform requires a "dimenstion" entry');

    return filter;

    function filter(frame) {
        if (dimension) {
            var d = frame.dimension(dimension);
            return frame.new(d.group());
        }
    }
};

//
// Create a groupby transform from a config object
var timeseries = function (config) {
    var sortby = config.sortby,
        groupby = config.groupby;

    if (!sortby) warn$1('timeseries transform requires a "sortby" entry');

    return timeseries;

    function timeseries(frame) {
        if (sortby) {
            if (groupby) {
                var dim = frame.dimension(groupby),
                    groups = dim.group().top(Infinity),
                    newframe = frame.new([]),
                    tmp;
                groups.forEach(function (group) {
                    tmp = frame.new(dim.filterExact(group.key).top(Infinity)).dimension(sortby).group().top(Infinity);
                    newframe.series.set(group.key, frame.new(tmp).dimension('key').top(Infinity));
                });
                return newframe;
            } else {
                return frame.new(frame.dimension(sortby).top(Infinity));
            }
        }
        return frame;
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

//
//  Map Fields Transform
//  ========================
//
//  Convert a set af fields to a different data type
//
globalOptions.dateFormat = '%d-%b-%y';

var converters = {
    date: function date(entry) {
        return d3TimeFormat.utcParse(entry.dateFormat || globalOptions.dateFormat);
    },
    number: function number() {
        return parseFloat;
    }
};

//
var mapfields = function (config) {
    config = assign({}, globalOptions.dateFormat, config);
    var fields = d3Collection.map(config.fields);
    var i = void 0,
        converter = void 0;

    return mapfields;

    function mapfields(frame) {
        var mappers = [];

        fields.each(function (entry, key) {
            if (d3Let.isString(entry)) entry = { type: entry };
            converter = converters[entry.type];
            if (!converter) warn$1('Cannot convert field ' + key + ' to type ' + entry.type);else mappers.push([key, converter(entry)]);
        });

        if (mappers.length) frame = frame.map(function (d) {
            for (i = 0; i < mappers.length; ++i) {
                d[mappers[i][0]] = mappers[i][1](d[mappers[i][0]]);
            }return d;
        });

        return frame;
    }
};

// Collection of transforms
//
//  transforms Store
var transformStore = d3Collection.map({
    filter: filter,
    mapfields: mapfields,
    timeseries: timeseries
});

// Apply data transforms to a series
function applyTransforms(frame, transforms) {
    var ts = void 0;
    if (!transforms) return frame;
    transforms.forEach(function (transform) {
        ts = transform(frame);
        frame = ts ? ts : frame;
    });
    return frame;
}

var dataEvents = d3Dispatch.dispatch('init', 'data');

//
//  DataSource prototype
//  ======================
var dataSourcePrototype = {

    // get the config object-assign// This method is used by the prototype
    // to check if the config object is a valid one
    getConfig: function getConfig() {},


    // initialise the data source with a config object
    initialise: function initialise() {},
    getData: function getData() {},


    //
    addTransforms: function addTransforms(transforms) {
        var self = this;
        var t = void 0;
        if (!transforms) return;
        if (!d3Let.isArray(transforms)) transforms = [transforms];
        transforms.forEach(function (transform) {
            t = transformStore.get(transform.type);
            if (!t) warn$1('Transform "' + transform.type + '" not known');else self.transforms.push(t(transform));
        });
    },

    //
    // given a data object returns a Cross filter object
    asFrame: function asFrame(data) {
        if (d3Let.isArray(data)) {
            data = data.map(function (entry) {
                if (entry.constructor !== Object) entry = { data: entry };
                return entry;
            });
            data = new DataFrame(data, null, this.store);
        }
        return applyTransforms(data, this.transforms);
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
        transforms = [];

    // store.natural = cf.dimension(d => d._id);

    Object.defineProperties(dataSource, {
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
        // transforms to apply to data
        transforms: {
            get: function get() {
                return transforms;
            }
        },
        config: {
            get: function get() {
                return config;
            }
        }
    });

    dataSource.initialise(config);
    dataSource.addTransforms(d3Let.pop(config, 'transforms'));
    store.sources.set(name, dataSource);
    dataEvents.call('init', undefined, dataSource);
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

    load: function load(symbol$$1) {
        var locales = this,
            source1 = dataSources.create('https://unpkg.com/d3-format/locale/' + symbol$$1 + '.json'),
            source2 = dataSources.create('https://unpkg.com/d3-time-format/locale/' + symbol$$1 + '.json');

        return Promise.all([source1.load().then(function (locale) {
            locales.symbol = symbol$$1;
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
        if (!type) type = this.visualType;
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

    function Visual(element, options, parent, model) {
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
        this.visualParent = parent;
        this.model = parent ? parent.model.$new() : model || d3View.viewModel();
        this.options = options || {};
        visuals.events.call('before-init', undefined, this);
        this.initialise(element);
        visuals.events.call('after-init', undefined, this);
    }

    Visual.prototype = assign({}, visualPrototype, proto);
    visuals.types[type] = Visual;
    return Visual;
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
    size.height = sizeValue(size.height, size.width);
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
var Visual = createVisual('visual', {

    options: {
        render: 'svg',
        // width set by the parent element
        width: null,
        // height set as percentage of width
        height: '70%',
        // heightElement - selector for an element from wich to obtain height
        heightElement: null
    },

    initialise: function initialise(element) {
        if (!element) throw new Error('HTMLElement required by visual group');
        if (this.visualParent && this.visualParent.visualType !== 'container') throw new Error('Visual parent can be a container only');

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

        this.sel.classed('d3-visual', true);
        // list of layers which define the visual
        this.layers = [];
        this.drawCount = 0;
        visuals.live.push(this);
        element.__visual__ = this;
    },
    toString: function toString() {
        return 'visual ' + this.model.uid;
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
        if (!VisualClass) warn$1('Cannot add visual ' + options.type);else return new VisualClass(this.element, options, this);
    },

    //
    // Fit the root element to the size of the parent element
    fit: function fit() {
        var size = getSize(this.element.parentNode, this.getModel());
        this.width = size.width;
        this.height = size.height;
        this.sel.style('width', this.width + 'px').style('height', this.height + 'px');
    },
    resize: function resize(size) {
        if (!size) size = getSize(this.element.parentNode, this.getModel());
        var currentSize = this.size;

        if (currentSize[0] !== size.width || currentSize[1] !== size.height) {
            d3View.viewDebug('Resizing "' + this.toString() + '"');
            this.width = size.width;
            this.height = size.height;
            this.sel.style('width', this.width + 'px').style('height', this.height + 'px');
            this.draw();
        }
    },
    destroy: function destroy() {
        var idx = visuals.live.indexOf(this);
        if (idx > -1) visuals.live.splice(idx, 1);
    }
});

if (d3Let.inBrowser) {
    // DOM observer
    // Check for changes in the DOM that leads to visual actions
    var observer = new MutationObserver(visualManager);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

//
//  Clears visualisation going out of scope
function visualManager(records) {
    records.forEach(function (record) {
        var nodes = record.removedNodes;
        if (!nodes || !nodes.length) return; // phantomJs hack
        nodes.forEach(function (node) {
            if (node.nodeName !== '#text') {
                if (!node.__visual__) d3Selection.select(node).selectAll('.d3-visual').each(destroy);else destroy.call(node);
            }
        });
    });
}

function destroy() {
    var viz = this.__visual__;
    if (viz) {
        viz.destroy();
        d3View.viewDebug('Removed "' + viz.toString() + '" from DOM, ' + visuals.live.length + ' live visuals left');
    } else warn$1('d3-visual without __visual__ object');
}

//
//  crateChart
//
//  A chart is a drawing of series data in two dimensional
var createChart = function (type) {
    var protos = [{}, vizPrototype, chartPrototype];
    for (var i = 1; i < arguments.length; ++i) {
        protos.push(arguments[i]);
    }return createVisual(type, assign.apply(undefined, protos));
};

//  Viz Prototype
//  =================
var vizPrototype = {
    initialise: function initialise(element) {
        // No visual parent, create the visual
        var visual = this.visualParent;
        if (!visual) {
            this.visualParent = visual = new Visual(element, this.options, null, this.model);
            this.model = visual.model.$new();
            this.options = {};
        } else if (visual.visualType !== 'visual') throw new Error('visual parent of ' + this.visualType + ' can only be "visual"');
        visual.layers.push(this);
    },


    //
    // paper object for this visualisation
    paper: function paper() {
        var visual = this.getModel('visual'),
            paper = this._paper;
        if (paper && paper.paperType === visual.render) return paper;
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

        this.getData().then(function (frame) {
            if (frame) {
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
            },
            paperType: {
                get: function get() {
                    return type;
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
    size: function size(box) {
        this.sel.attr('width', box.width).attr('height', box.height);
        return this;
    },
    group: function group(box, cname) {
        if (!cname) cname = 'main';
        var sel = this.sel;
        sel.selectAll('.' + cname).data([0]).enter().append('g').classed(cname, true);
        return sel.select('.' + cname);
    },
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

var VisualContainer = createVisual('container');

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
        var parent = this.model.visual;

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
        model.visual = new VisualContainer(sel.node(), schema, model.visual);
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
        var sel = this.createElement('div'),
            type = schema.type || 'visual',
            model = this.model,
            options = {};

        if (type === 'visual') options = schema;else options.visual = d3Let.pop(schema, 'visual') || {};

        model.visual = new Visual(sel.node(), options, model.visual);
        if (type !== 'visual') model.visual.addVisual(schema);
        return sel;
    },


    // once the element is mounted in the dom, draw the visual
    mounted: function mounted() {
        this.model.visual.draw();
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
//  getData method
//  =====================
//
//  Inject a method for easily retrieving data from the datastore
vizPrototype.getData = function () {
    var name = this.model.data;
    if (!name) {
        warn$1('Visual without data name, cannot get data');
        return d3View.resolvedPromise();
    }
    return this.dataStore.getData(name);
};

visuals.events.on('before-init.data', function (viz) {
    if (!viz.isViz) return;
    // remove data from options
    viz.data = d3Let.pop(viz.options, 'data');
});

visuals.events.on('after-init.data', function (viz) {
    Object.defineProperties(viz, {
        dataStore: {
            get: function get() {
                if (viz.visualParent) return viz.visualParent.dataStore;
                return viz.model.dataStore;
            }
        }
    });
    if (viz.isViz) setupLayer(viz);else setupVisual(viz);
});

function setupVisual(visual) {
    var store = visual.dataStore,
        data = d3Let.pop(visual.options, 'data');
    //
    if (!store) {
        store = new DataStore(visual.model);
        visual.model.dataStore = store;
    }
    store.addSources(data);
}

function setupLayer(layer) {
    var store = layer.dataStore,
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
        innerHeight: height - total.top - total.bottom
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

var colorScales = d3Collection.map();

globalOptions.color = {
    scale: 'cool',
    stroke: '#333',
    strokeOpacity: 1,
    fillOpacity: 1
};

colorScales.set('viridis', function () {
    return d3_scale.scaleSequential(d3_scale.interpolateViridis);
});
colorScales.set('inferno', function () {
    return d3_scale.scaleSequential(d3_scale.interpolateInferno);
});
colorScales.set('magma', function () {
    return d3_scale.scaleSequential(d3_scale.interpolateMagma);
});
colorScales.set('plasma', function () {
    return d3_scale.scaleSequential(d3_scale.interpolatePlasma);
});
colorScales.set('warm', function () {
    return d3_scale.scaleSequential(d3_scale.interpolateWarm);
});
colorScales.set('cool', function () {
    return d3_scale.scaleSequential(d3_scale.interpolateCool);
});
colorScales.set('rainbow', function () {
    return d3_scale.scaleSequential(d3_scale.interpolateRainbow);
});
colorScales.set('cubehelix', function () {
    return d3_scale.scaleSequential(d3_scale.interpolateCubehelixDefault);
});

//
//  Color scale method
//  ==========================
vizPrototype.colorScale = function () {
    var color = this.getModel('color'),
        scale = colorScales.get(color.scale);
    if (!scale) throw new Error('Unknown scale ' + color.scale);
    return scale();
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

var constant = function (x) {
    return function constant() {
        return x;
    };
};

var descending = function (a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};

var identity = function (d) {
    return d;
};

//
//  Pyramid Shape generator
//  ============================
var pyramid = function () {
    var value = identity,
        pad = constant(0),
        height = 1,
        base = 1;

    function pyramid(data) {
        var i = void 0,
            j = void 0,
            k = void 0,
            points = void 0,
            fraction = void 0,
            hi = void 0,
            x = void 0,
            y = void 0,
            v0 = void 0,
            ph = void 0,
            pj = void 0;
        var n = data.length,
            r = 0.5 * base / height,
            polygons = new Array(n),
            index = new Array(n);

        for (i = 0; i < n; ++i) {
            polygons[index[i] = i] = +value(data[i], i, data);
        }

        // Sort the polygons
        index.sort(function (i, j) {
            return descending(polygons[i], polygons[j]);
        });

        // Compute the polygons! They are stored in the original data's order.
        v0 = polygons[index[0]];
        hi = null;

        for (i = n - 1; i >= 0; --i) {
            points = [];
            if (hi === null) points.push([0, 0]);else {
                y = hi + ph;
                x = y * r;
                points.push([-x, y]);
                points.push([x, y]);
            }
            j = index[i];
            k = n - i - 1;
            fraction = polygons[j] / v0;
            pj = Math.sqrt(fraction);
            hi = height * pj;
            ph = i ? pad(pj, k) : 0;
            y = hi - ph;
            x = y * r;
            points.push([x, y]);
            points.push([-x, y]);
            polygons[j] = {
                index: k,
                value: polygons[j],
                fraction: fraction,
                points: points
            };
        }
        return polygons;
    }

    pyramid.value = function (_) {
        return arguments.length ? (value = typeof _ === "function" ? _ : constant(+_), pyramid) : value;
    };

    pyramid.base = function (_) {
        return arguments.length ? (base = _, pyramid) : base;
    };

    pyramid.height = function (_) {
        return arguments.length ? (height = _, pyramid) : height;
    };

    pyramid.pad = function (_) {
        return arguments.length ? (pad = typeof _ === "function" ? _ : constant(+_), pyramid) : pad;
    };

    return pyramid;
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

var lineDrawing = {
    fill: function fill(meta) {
        var cscale = this.colorScale().domain([0, meta.length - 1]);

        function fill(d, index) {
            return cscale(index);
        }

        fill.scale = cscale;

        return fill;
    },
    curve: function curve(name) {
        var obj = d3_shape[this.curveName(name)];
        if (!obj) {
            warn$1('Could not locate curve type "' + name + '"');
            name = this.curveName('cardinalOpen');
            obj = d3_shape[name];
        }
        return obj;
    },
    curveName: function curveName(name) {
        if (name.substring(0, 5) !== 'curve') name = 'curve' + name[0].toUpperCase() + name.substring(1);
        return name;
    }
};

//
//  Line Chart
//  =============
//
//  The barchart is one of the most flexible visuals.
//  It can be used to display label data as well as
//  timeserie data. It can display absulte values as
//  proportional data via vertical staking and normalization
var line$1 = createChart('linechart', lineDrawing, {

    options: {
        lineWidth: 1,
        curve: 'cardinalOpen',
        x: 'x',
        y: 'y'
    },

    doDraw: function doDraw(frame) {
        var self = this,
            range$$1 = this.newRange(),
            model = this.getModel(),
            color = this.getModel('color'),
            x = accessor(model.x),
            y = accessor(model.y),
            data = frame.series.values(),
            meta = frame.series.keys().map(function (label, index) {
            return {
                index: index,
                label: label,
                range: self.range(data[index], x, y, range$$1)
            };
        }),
            box = this.boundingBox(),
            paper = this.paper(),
            lines = paper.size(box).group().attr("transform", this.translate(box.total.left, box.total.top)).selectAll('.line').data(data),
            strokeColor = this.fill(meta),

        //merge = paper.transition('update'),
        line$$1 = d3_shape.line().x(this.x(box, range$$1.x)).y(this.y(box, range$$1.y)).curve(this.curve(model.curve));

        lines.enter().append('path').attr('class', 'line').attr('fill', 'none').attr('stroke', strokeColor).attr('stroke-opacity', 0).attr('stroke-width', model.lineWidth).merge(lines)
        //.transition(merge)
        .attr('stroke', strokeColor).attr('stroke-opacity', color.strokeOpacity).attr('stroke-width', model.lineWidth).attr('d', line$$1);

        lines.exit().remove();
    },
    x: function x(box, ranges) {
        var model = this.getModel(),
            scale = d3_scale.scaleLinear().domain(d3Array.extent(ranges)).range([0, box.innerWidth]);
        return function (d) {
            return scale(d[model.x]);
        };
    },
    y: function y(box, ranges) {
        var model = this.getModel(),
            scale = d3_scale.scaleLinear().domain(d3Array.extent(ranges)).range([box.innerHeight, 0]);
        return function (d) {
            return scale(d[model.y]);
        };
    },
    range: function range$$1(data, x, y, agg) {
        var range$$1 = {
            x: d3Array.extent(data, x),
            y: d3Array.extent(data, y)
        };
        if (agg) {
            Array.prototype.push.apply(agg.x, range$$1.x);
            Array.prototype.push.apply(agg.y, range$$1.y);
        }
    },
    newRange: function newRange() {
        return {
            x: [],
            y: []
        };
    }
});

var pi = Math.PI;
var rad = pi / 180;

var proportional = {
    fill: function fill(data) {
        var cscale = this.colorScale().domain([0, data.length - 1]);

        function fill(d) {
            return cscale(d.index);
        }

        fill.scale = cscale;

        return fill;
    },
    proportionalData: function proportionalData(frame, field) {
        return frame.dimension(field).top(Infinity);
    }
};

//
//  Pie Chart
//  =============
//
var pie$1 = createChart('piechart', proportional, {

    options: {
        // The data values from this field will be encoded as angular spans.
        // If omitted, all pie slices will have equal spans
        field: 'data',
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
        var model = this.getModel(),
            color = this.getModel('color'),
            field = model.field,
            box = this.boundingBox(),
            outerRadius = Math.min(box.innerWidth, box.innerHeight) / 2,
            innerRadius = sizeValue(model.innerRadius, outerRadius),
            angles = d3_shape.pie().padAngle(rad * model.padAngle).startAngle(rad * model.startAngle).endAngle(rad * model.endAngle).value(function (d) {
            return d[field];
        }),
            arcs = d3_shape.arc().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(model.cornerRadius),
            paper = this.paper(),

        //update = paper.transition('update'),
        data = angles(this.proportionalData(frame, field)),
            fill = this.fill(data),
            slices = paper.size(box).group().attr("transform", this.translate(box.total.left + box.innerWidth / 2, box.total.top + box.innerHeight / 2)).selectAll('.slice').data(data);

        slices.enter().append('path').attr('class', 'slice').attr('stroke', color.stroke).attr('stroke-opacity', 0).attr('fill-opacity', 0).attr('fill', fill).attr('stroke-width', model.lineWidth).merge(slices)
        //.transition(update)
        .attr('stroke', color.stroke).attr('stroke-opacity', color.strokeOpacity).attr('d', arcs).attr('fill', fill).attr('fill-opacity', color.fillOpacity);

        slices.exit().remove();
    }
});

//
//  Custom Symbol type
//  =====================
//
//  Draw a polygon given an array of points
//  This can be used as type in a d3-shape symbol
var polygon = function (points) {

    return {
        draw: function draw(context) {
            points.forEach(function (point, idx) {
                if (!idx) context.moveTo(point[0], point[1]);else context.lineTo(point[0], point[1]);
            });
            context.closePath();
        }
    };
};

var pyramid$1 = createChart('pyramidchart', proportional, {

    options: {
        field: 'data',
        pad: 0,
        lineWidth: 1
    },

    doDraw: function doDraw(frame) {
        var model = this.getModel(),
            field = model.field,
            color = this.getModel('color'),
            box = this.boundingBox(),
            pad = sizeValue(model.pad, Math.min(box.innerWidth, box.innerHeight)),
            polygons = pyramid().base(box.innerWidth).height(box.innerHeight).pad(pad).value(function (d) {
            return d[field];
        }),
            data = polygons(this.proportionalData(frame, field)),
            marks = d3_shape.symbol().type(function (d) {
            return polygon(d.points);
        }).size(1),
            fill = this.fill(data),
            paper = this.paper(),
            segments = paper.size(box).group().attr("transform", this.translate(box.total.left + box.innerWidth / 2, box.total.top)).selectAll('.segment').data(data);

        segments.enter().append('path').attr('class', 'segment').attr('stroke', color.stroke).attr('stroke-opacity', 0).attr('fill-opacity', 0).attr('fill', fill).attr('stroke-width', model.lineWidth).merge(segments)
        //.transition(update)
        .attr('stroke', color.stroke).attr('stroke-opacity', color.strokeOpacity).attr('d', marks).attr('fill', fill).attr('fill-opacity', color.fillOpacity);

        segments.exit().remove();
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
exports.visuals = visuals;
exports.Visual = Visual;
exports.crateChart = createChart;
exports.cratePaper = createPaper;
exports.Svg = Svg;
exports.visualComponents = index;
exports.colorScales = colorScales;
exports.pyramid = pyramid;
exports.BarChart = bar;
exports.LineChart = line$1;
exports.PieChart = pie$1;
exports.PyramidChart = pyramid$1;
exports.Treemap = treemap;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=d3-visualize.js.map
