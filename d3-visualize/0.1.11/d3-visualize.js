// d3-visualize Version 0.1.11. Copyright 2017 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('object-assign'), require('d3-array'), require('d3-random'), require('d3-collection'), require('d3-let'), require('d3-view'), require('d3-dsv'), require('d3-dispatch'), require('crossfilter'), require('d3-time-format'), require('d3-selection'), require('d3-transition'), require('d3-scale'), require('d3-format'), require('d3-axis'), require('d3-shape'), require('d3-color'), require('d3-svg-legend')) :
	typeof define === 'function' && define.amd ? define(['exports', 'object-assign', 'd3-array', 'd3-random', 'd3-collection', 'd3-let', 'd3-view', 'd3-dsv', 'd3-dispatch', 'crossfilter', 'd3-time-format', 'd3-selection', 'd3-transition', 'd3-scale', 'd3-format', 'd3-axis', 'd3-shape', 'd3-color', 'd3-svg-legend'], factory) :
	(factory((global.d3 = global.d3 || {}),global.assign,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.crossfilter,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,assign,d3Array,d3Random,d3Collection,d3Let,d3View,d3Dsv,d3Dispatch,crossfilter,d3TimeFormat,d3Selection,d3Transition,d3_scale,d3Format,d3Axis,d3_shape,d3Color,d3SvgLegend) { 'use strict';

assign = assign && assign.hasOwnProperty('default') ? assign['default'] : assign;
crossfilter = crossfilter && crossfilter.hasOwnProperty('default') ? crossfilter['default'] : crossfilter;

var version = "0.1.11";

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

var CSV = d3Collection.set(['text/plain', 'text/csv', 'application/vnd.ms-excel']);
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
            return [];
        }
        return fetch(this.url).then(parse).then(function (data) {
            return self.asFrame(data);
        });
    }
};

function parse(response) {
    var ct = (response.headers.get('content-type') || '').split(';')[0];
    if (CSV.has(ct)) return response.text().then(d3Dsv.csvParse);else if (ct === 'application/json') return response.json();else {
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
            sources = this.source,
            self = this;

        return Promise.all(sources.map(function (source) {
            return store.getData(source);
        })).then(function (frames) {
            if (frames.length === 1) return frames[0];else if (self.config.merge) return self.mergeFrames(frames);else return frames.reduce(function (o, frame, index) {
                o[sources[index]] = frame;
                return o;
            }, { type: 'frameCollection' });
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
            model = this.store.model,
            result = this.expression.eval(model);
        if (d3Let.isPromise(result)) return result.then(function (data) {
            return self.asFrame(data);
        });else return self.asFrame(result);
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


    //  Create and return a crossfilter dimension
    //  If value is not specified, keepExisting is by default true, and any
    //  existing dimension name is recycled.
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


    //  Sort a dataframe by name and return the top values or all of them if
    //  top is not defined. The name can be a function.
    sortby: function sortby(name, top) {
        return this.new(this.dimension(name).top(top || Infinity));
    },


    // return a new dataframe by pivoting values for field name
    pivot: function pivot(dimension, key, value, total) {
        var group = this.dimension(dimension).group();
        if (!total) total = 'total';
        return this.new(group.reduce(pivoter(1), pivoter(-1), Object).all().map(function (d) {
            return d.value;
        }));

        function pivoter(m) {
            var pk = void 0,
                pv = void 0;
            return function (o, record) {
                pk = '' + record[key];
                pv = m * record[value];
                o[dimension] = record[dimension];
                if (pk in o) o[pk] += pv;else o[pk] = pv;
                if (total in o) o[total] += pv;else o[total] = pv;
                return o;
            };
        }
    },
    add: function add() {
        //this._inner.cf.add(data);
    },
    map: function map$$1(mapper) {
        return this.new(this.data.map(mapper));
    }
};

var transformFactory = function (options) {
    var transform = options.transform,
        schema = options.schema || {},
        jsonValidator = d3View.viewProviders.jsonValidator ? d3View.viewProviders.jsonValidator(options.schema) : dummyValidator;
    if (!schema.type) schema.type = 'object';

    function transformFactory(config) {
        var valid = jsonValidator.validate(config);

        if (!valid) return jsonValidator.logError();

        return doTransform;

        function doTransform(frame) {
            return transform(frame, config);
        }
    }

    transformFactory.schema = schema;

    return transformFactory;
};

var dummyValidator = {
    validate: function validate() {
        return true;
    }
};

//
// Create a groupby transform from a config object
var filter = transformFactory({
    schema: {
        description: "The filter transform removes objects from a data frame based on a provided filter expression",
        properties: {
            expr: {
                type: "string"
            }
        },
        required: ["expr"]
    },
    transform: function transform(frame, config) {
        var expr = d3View.viewExpression(config.expr);
        return frame.data.reduce(function (data, d, index) {
            if (expr.safeEval({ d: d, index: index, frame: frame })) data.push(d);
            return data;
        }, []);
    }
});

var prefix$1 = '[d3-visualize]';

var warn$1 = function (msg) {
    d3View.viewProviders.logger.warn(prefix$1 + ' ' + msg);
};

var fillArray = function (size, value) {
    var a = new Array(size);
    a.fill(value);
    return a;
};

var operations = d3Collection.map({
    count: count,
    max: d3Array.max,
    min: d3Array.min,
    sum: d3Array.sum,
    mean: d3Array.mean,
    median: d3Array.median,
    variance: d3Array.variance,
    deviation: d3Array.deviation
});

var scalar_operations = d3Collection.map({
    count: function count(agg) {
        return agg + 1;
    },
    sum: function sum$$1(agg, v) {
        return agg + v;
    },

    max: Math.max,
    min: Math.min
});

function count(array, accessor) {
    return array.reduce(function (v, d) {
        if (accessor(d) !== undefined) v += 1;
        return v;
    }, 0);
}
//
// The aggregate transform groups and summarizes an imput data stream to
// produce a derived output data stream. Aggregate transforms can be used
// to compute counts, sums, averages and other descriptive statistics over
// groups of data objects.
var aggregate = function (config) {
    var fields = config.fields,
        ops = config.ops,
        as = config.as,
        groupby = config.groupby;

    if (!fields && !ops) return countAll;

    if (!d3Let.isArray(fields)) return warn$1('Aggregate transforms expect an array of fields');
    if (!ops) ops = 'count';
    if (d3Let.isString(ops)) ops = fillArray(fields.length, ops);
    if (!d3Let.isArray(ops)) return warn$1('Aggregate transform expects an array of ops');
    if (ops.length < fields.length) warn$1('Aggregate transforms expects an ops array with same length as fields');
    if (!as) as = [];
    if (!d3Let.isArray(as)) return warn$1('Aggregate transform expects an array of as fields');
    return aggregate;

    function countAll(frame) {
        var key = void 0;
        return frame.data.reduce(function (o, d) {
            for (key in d) {
                if (key in o) o[key] += 1;else o[key] = 1;
            }
            return o;
        }, {});
    }

    function aggregate(frame) {
        var data = [],
            name,
            op;

        if (groupby) return group(frame);

        fields.forEach(function (field, index) {
            name = ops[index];
            op = count;
            if (name) {
                op = operations.get(name);
                if (!op) {
                    op = count;
                    warn$1('Operation ' + ops[index] + ' is not supported, use count');
                }
            }
            data.push({
                label: as[index] || field,
                data: op(frame.data, function (d) {
                    return d[field];
                })
            });
        });
        return data;
    }

    //
    //  Perform aggregation with a set of data fields to group by
    function group(frame) {
        var v = void 0,
            name = void 0,
            op = void 0;
        var entries = fields.map(function (field, index) {
            name = ops[index];
            op = scalar_operations.get('count');
            if (name) {
                op = scalar_operations.get(name);
                if (!op) {
                    op = scalar_operations.get('count');
                    warn$1('Operation ' + name + ' is not supported, use count');
                }
            }
            return {
                field: field,
                as: as[index] || field,
                op: op
            };
        });

        return frame.dimension(groupby).group().reduce(function (o, record) {
            return entries.reduce(function (oo, entry) {
                v = 0;
                if (entry.as in oo) v = oo[entry.as];
                oo[entry.as] = entry.op(v, record[entry.field]);
                return oo;
            }, o);
        }, null, Object).all().map(function (d) {
            d.value[groupby] = d.key;
            return d.value;
        });
    }
};

//
// Apply a cross filter to an array of fields
var crossfilter$1 = function (config) {
    var fields = config.fields,
        query = config.query;

    if (!d3Let.isArray(fields)) return warn$1('crossfilter transform expects an array of fields');
    if (!d3Let.isArray(query)) return warn$1('crossfilter transform expects an array of query');
    if (query.length != fields.length) return warn$1('crossfilter transform expects an query array with same length as fields');

    return crossfilter$$1;

    function crossfilter$$1(frame) {
        var dim = void 0,
            q = void 0;
        fields.forEach(function (field, index) {
            q = query[index];
            if (d3Let.isString(q)) q = frame.store.eval(q);
            dim = frame.dimension(field).filterAll();
            if (q) dim.filter(q);
        });
        if (dim) return frame.new(dim.top(Infinity));
        return frame;
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

var mapfields = transformFactory({
    shema: {
        description: "map a field values into another type",
        properties: {
            fields: {
                type: "object"
            },
            dateFormat: {
                type: "string"
            }
        },
        required: ["fields"]
    },
    transform: function transform(frame, config) {
        var fields = d3Collection.map(config.fields),
            mappers = [];
        var i = void 0,
            converter = void 0;

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
});

var minmax = function (value, min$$1, max$$1) {
    return Math.max(Math.min(value, max$$1), min$$1);
};

var DEFAULT_METHOD = 'ema';
var DEFAULT_PERIOD = 10;
var DEFAULT_ALPHA = 0.5;
var MAXALPHA = 0.999999;

//
// Exponential moving average transform
// Useful for smoothing out volatile timeseries
var movingaverage = transformFactory({
    shema: {
        description: "Create moving average series from existing one. The new series override the existing one unless the as array is provided",
        properties: {
            method: {
                type: "string"
            },
            alpha: {
                type: "number"
            },
            period: {
                type: "number"
            },
            fields: {
                type: "array",
                items: {
                    type: "string"
                }
            },
            as: {
                type: "array",
                items: {
                    type: "string"
                }
            }
        },
        required: ["fields"]
    },
    transform: function transform(frame, config) {
        var as = config.as || [],
            method = config.method || DEFAULT_METHOD;
        var fieldto = void 0,
            y = void 0,
            s = void 0;

        config.fields.forEach(function (field, index) {
            fieldto = as[index] || field;
            //
            // Simple Moving Average
            if (method === 'sma') {
                var period = Math.max(config.period || DEFAULT_PERIOD, 1),
                    cumulate = [],
                    buffer = [];
                frame.data.forEach(function (d, index) {
                    y = d[field];
                    if (cumulate.length === period) y -= buffer.splice(0, 1)[0];
                    buffer.push(y);
                    if (index) y += cumulate[cumulate.length - 1];
                    cumulate.push(y);
                    d[fieldto] = y / cumulate.length;
                });
                //
                // Exponential moving average
            } else {
                var alpha = minmax(config.alpha || DEFAULT_ALPHA, 1 - MAXALPHA, MAXALPHA);

                frame.data.forEach(function (d, index) {
                    y = d[field];
                    if (!index) s = y;else s = alpha * s + (1 - alpha) * y;
                    d[fieldto] = s;
                });
            }
        });
    }
});

// Collection of transforms
//
//  transforms Store
var transformStore = d3Collection.map({
    filter: filter,
    aggregate: aggregate,
    mapfields: mapfields,
    timeseries: timeseries,
    crossfilter: crossfilter$1,
    movingaverage: movingaverage
});

// Apply data transforms to a series
function applyTransforms(frame, transforms) {
    var ts = void 0;
    if (!transforms) return frame;
    transforms.forEach(function (transform) {
        if (transform) {
            ts = transform(frame);
            if (d3Let.isArray(ts)) frame = frame.new(ts);else if (ts) frame = ts;
        }
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
        var data = ds.getData();
        if (!d3Let.isPromise(data)) data = d3View.resolvedPromise(data);
        return data.then(function (frame) {
            if (ds.config.cache) ds.cachedFrame = frame;
            return frame;
        });
    },
    eval: function _eval(expr, context) {
        var ctx = this.model;
        if (context) ctx = ctx.$child(context);
        return d3View.viewExpression(expr).safeEval(ctx);
    },
    dataName: function dataName(name) {
        this.dataCount++;
        if (name) return '' + name;
        var def = this.source('default');
        if (!def) return 'default';
        return 'source' + this.dataCount;
    }
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

function clone(o) {
    if (d3Let.isArray(o)) return o.map(clone);else if (d3Let.isObject(o)) {
        var v = {};
        for (var key in o) {
            v[key] = clone(o[key]);
        }
        return v;
    } else return o;
}

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
    options: globalOptions,
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


    // redraw the visual
    // this is the method that should be invoked by applications
    redraw: function redraw(fetchData) {
        if (this.drawing) {
            var self = this,
                event = 'after-draw.' + this.toString();
            visuals.events.on(event, function () {
                // remove callback
                visuals.events.on(event, null);
                self.redraw(fetchData);
            });
        } else this.drawing = this.draw(fetchData);
        return this.drawing;
    },
    select: function select$$1(el) {
        return d3Selection.select(el);
    },


    // destroy the visual
    destroy: function destroy() {},
    toString: function toString() {
        return this.visualType + '-' + this.model.uid;
    },


    // get a reactive model for type
    getModel: function getModel(type) {
        if (!type) type = this.visualType;
        var model = this.model[type];
        if (!model && type in globalOptions) {
            var options = d3Let.pop(this.options, type),
                self = this;
            if (this.visualParent) model = this.visualParent.getModel(type).$child(options);else {
                model = this.model.$new(globalOptions[type]);
                model.$update(options);
            }
            this.model[type] = model;
            model.$on(function () {
                return self.draw();
            });
        }
        return model;
    },
    dim: function dim(size, refSize, minSize, maxSize) {
        size = Math.max(sizeValue(size, refSize), minSize || 0);
        if (maxSize) {
            maxSize = Math.max(maxSize, minSize || 0);
            size = Math.min(size, maxSize);
        }
        return size;
    },

    // pop this visual from a container
    pop: function pop$$1(container) {
        if (container) {
            var idx = container.live.indexOf(this);
            if (idx > -1) container.live.splice(idx, 1);
        }
    },
    getVisualSchema: function getVisualSchema(name) {
        var schema = this.options.visuals ? this.options.visuals[name] : null,
            parent = this.visualParent;
        if (parent && d3Let.isString(schema)) {
            name = schema;
            schema = parent.getVisualSchema(name);
        } else if (parent && !schema) schema = parent.getVisualSchema(name);
        if (d3Let.isObject(schema)) return clone(schema);
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
            },
            visualRoot: {
                get: function get() {
                    if (this.visualParent) return this.visualParent.visualRoot;
                    return this;
                }
            }
        });
        this.visualParent = parent;
        this.model = parent ? parent.model.$new() : model || d3View.viewModel();
        this.options = options || {};
        this.drawing = false;
        visuals.events.call('before-init', undefined, this);
        this.initialise(element);
        visuals.events.call('after-init', undefined, this);
    }

    Visual.prototype = assign({}, visualPrototype, proto);
    visuals.types[type] = Visual;
    return Visual;
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
        if (!this.select(element).select('.paper').node()) this.select(element).append('div').classed('paper', true);

        Object.defineProperties(this, {
            element: {
                get: function get() {
                    return element;
                }
            },
            paper: {
                get: function get() {
                    return this.sel.select('.paper');
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
        if (this.visualParent) this.visualParent.live.push(this);
    },


    // Draw the visual
    draw: function draw(fetchData) {
        if (this.drawing) {
            warn$1(this.toString() + ' already drawing');
            return this.drawing;
        } else if (!this.drawCount) {
            this.drawCount = 1;
            this.fit();
        } else {
            this.drawCount++;
            this.clear();
        }
        var self = this;
        visuals.events.call('before-draw', undefined, this);
        return Promise.all(this.layers.map(function (visual) {
            return visual.redraw(fetchData);
        })).then(function () {
            delete self.drawing;
            visuals.events.call('after-draw', undefined, self);
        }, function (err) {
            delete self.drawing;
            warn$1('Could not draw ' + self.toString() + ': ' + err);
        });
    },
    clear: function clear() {},


    // Add a new visual to this group
    addVisual: function addVisual(options) {
        var type = d3Let.pop(options, 'type');
        var VisualClass = visuals.types[type];
        if (!VisualClass) warn$1('Cannot add visual "' + type + '", not available');else return new VisualClass(this.element, options, this);
    },

    //
    // Fit the root element to the size of the parent element
    fit: function fit() {
        this.resize(null, true);
    },


    // resize the chart
    resize: function resize(size, fit) {
        if (!size) size = getSize(this.element.parentNode || this.element, this.getModel());
        var currentSize = this.size;

        if (fit || currentSize[0] !== size.width || currentSize[1] !== size.height) {
            if (!fit) d3View.viewDebug('Resizing "' + this.toString() + '"');
            this.width = size.width;
            this.height = size.height;
            // this.paper.style('width', this.width + 'px').style('height', this.height + 'px');
            this.paper.style('height', this.height + 'px');
            // if we are not just fitting draw the visual without fetching data!!
            if (!fit) this.draw(false);
        }
    },
    destroy: function destroy() {
        this.pop(this.visualParent);
        this.pop(visuals);
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

var camelFunction = function (o, prefix, name, objectOnly) {
    if (name.substring(0, prefix.length) !== prefix) name = "" + prefix + name[0].toUpperCase() + name.substring(1);
    return objectOnly ? o[name] : o[name]();
};

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
    },
    getScale: function getScale(name) {
        return camelFunction(d3_scale, 'scale', name);
    },
    displayError: function displayError() {}
};

var chartPrototype = {

    //  override draw method
    draw: function draw(fetchData) {
        var _this = this;

        if (this.drawing) {
            warn$1(this.toString() + ' already drawing');
            return this.drawing;
        }
        var self = this,
            doDraw = this.doDraw;

        visuals.events.call('before-draw', undefined, this);

        if (fetchData === false && this._drawArgs) {
            delete self.drawing;
            doDraw.apply(self, this._drawArgs);
            visuals.events.call('after-draw', undefined, self);
        } else {
            return Promise.all([this.requires ? d3View.require.apply(undefined, this.requires) : [],
            // this.getMetaData(),
            this.getData()]).then(function (args) {
                delete self.drawing;
                var frame = args[1];
                if (frame) {
                    args = d3Let.isArray(args[0]) ? args[0] : [args[0]];
                    args.unshift(frame);
                    _this._drawArgs = args;
                    doDraw.apply(self, args);
                    visuals.events.call('after-draw', undefined, self);
                }
            }, function (err) {
                delete self.drawing;
                warn$1('Could not draw ' + self.toString() + ': ' + err);
                _this.displayError(err);
            });
        }
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
    group: function group(cname) {
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
        var svg = viz.visualParent.paper.append('svg').attr('id', viz.model.uid).classed(viz.visualType, true).style('position', 'absolute');
        return svg.node();
    }
});

var Div = createPaper('div', {
    initialise: function initialise(viz) {
        var div = viz.visualParent.paper.append('div').attr('id', viz.model.uid).classed(viz.visualType, true);
        //.style('position', 'absolute');
        return div.node();
    },
    group: function group(cname) {
        if (!cname) cname = 'main';
        var sel = this.sel;
        sel.selectAll('.' + cname).data([0]).enter().append('div').classed(cname, true);
        return sel.select('.' + cname);
    }
});

//
//  Add a menu buttom to a visual

globalOptions.menu = {
    display: false,
    height: '8%',
    maxHeight: 50,
    minHeight: 20
};

visuals.events.on('after-init.menu', function (viz) {
    if (viz.visualType === 'visual') {
        var menu = viz.getModel('menu');
        if (menu.display) {
            viz.menu = viz.sel.insert('nav', ':first-child').classed('d3-nav navbar p-1', true);
            viz.menu.append('h4').classed('title', true);
        }
    }
});

visuals.events.on('before-draw.menu', function (viz) {
    if (viz && viz.menu) {
        refreshMenu(viz);
    }
});

function refreshMenu(viz) {
    var menu = viz.getModel('menu'),
        height = viz.dim(menu.height, viz.height, menu.minHeight, menu.maxHeight);
    viz.menu.style('height', height + 'px');
}

var formats = d3Collection.map();

var cachedFormat = function (specifier, value) {
    var fmt = formats.get(specifier);
    if (!fmt) {
        fmt = d3Format.format(specifier);
        formats.set(specifier, fmt);
    }
    return fmt(value);
};

//
//  dataStore integration with visuals
//
// Visual Data Context
visuals.options.dataContext = {
    $format: cachedFormat
};

//  getData method
//  =====================
//
//  Inject a method for easily retrieving data from the datastore
vizPrototype.getData = function () {
    var name = this.model.data;
    if (!name) {
        warn$1('Visual ' + this.visualType + ' without data name, cannot get data');
        return d3View.resolvedPromise();
    }
    return this.dataStore.getData(name);
};

//
// Context for expression evaluation
vizPrototype.getContext = function (context) {
    return this.dataStore.model.$child(context);
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
                return viz.model.root.dataStore;
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
        // create the data store for the visual or container
        store = new DataStore(visual.getModel('dataContext'));
        visual.model.root.dataStore = store;
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

visuals.options.font = {
    size: '3%',
    minSize: 10,
    maxSize: 20
};

vizPrototype.font = function (box) {
    var model = this.getModel(),
        font = this.getModel('font'),
        size = this.dim(font.size, box.height, font.minSize, font.maxSize);
    if (model.fontSizeMultiplier) size *= model.fontSizeMultiplier;
    return size;
};

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
    fontSize: '5%',
    minFontSize: 15,
    maxFontSize: 25
};

visuals.events.on('before-init.title', function (viz) {
    var title = viz.options.title;
    if (d3Let.isString(title)) viz.options.title = { text: title };
});

visuals.events.on('before-draw.title', function (viz) {
    var title = viz.getModel('title');
    if (!title.text) return;
    var visual = viz.isViz ? viz.visualParent : viz;
    if (visual.visualType === 'visual' && visual.menu) menuTitle(visual, title, viz);
});

function menuTitle(visual, title, viz) {
    var height = number(visual.menu.style('height')),
        maxSize = title.maxFontSize ? Math.min(height - 4, title.maxFontSize) : height - 4,
        size = viz.dim(title.fontSize, visual.width, title.minFontSize, maxSize);
    visual.menu.select('.title').html(title.text).style('font-size', size + 'px').style('line-height', height + 'px');
}

function number(px) {
    return +px.substring(0, px.length - 2);
}

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

var axisOrientation = d3Collection.map({
    top: d3Axis.axisTop,
    bottom: d3Axis.axisBottom,
    left: d3Axis.axisLeft,
    right: d3Axis.axisRight
});

var axisDefaults = {
    tickSize: 6,
    tickSizeOuter: null,
    format: null,
    stroke: '#333'
};

visuals.options.xAxis = assign({
    location: "bottom"
}, axisDefaults);

visuals.options.yAxis = assign({
    location: "left"
}, axisDefaults);

vizPrototype.xAxis = function (scale, x, y) {
    var model = this.getModel('xAxis'),
        axis = getAxis(model, scale);
    this.paper().group('x-axis').attr("transform", this.translate(x, y)).call(axis).select('path.domain').attr('stroke', model.stroke);
};

vizPrototype.yAxis = function (scale, x, y) {
    var model = this.getModel('yAxis'),
        axis = getAxis(model, scale);
    this.paper().group('y-axis').attr("transform", this.translate(x, y)).call(axis).select('path.domain').attr('stroke', model.stroke);
};

vizPrototype.axis = function (orientation, scale) {
    return axisOrientation.get(orientation)(scale);
};

function getAxis(model, scale) {
    var axis = axisOrientation.get(model.location)(scale).tickSize(model.tickSize);
    if (model.tickSizeOuter !== null) axis.tickSizeOuter(model.tickSizeOuter);
    if (model.format !== null) axis.tickFormat(model.format);
    return axis;
}

var symbols = d3Collection.map({
    circle: d3_shape.symbolCircle,
    square: d3_shape.symbolSquare,
    star: d3_shape.symbolStar
});

vizPrototype.getSymbol = function (name) {
    var s = symbols.get(name);
    return d3_shape.symbol().type(s);
};

var colorScales = d3Collection.map();

globalOptions.color = {
    scale: 'cool',
    // Minumim number of colors in a sequantial color scale
    // This helps in keeping a consistent palette when few colors are used
    scaleMinPoints: 6,
    // An offset in the color scale, useful for combined visuals
    scaleOffset: 0,
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
vizPrototype.colors = function (n) {
    var color$$1 = this.getModel('color'),
        scaleDef = colorScales.get(color$$1.scale);

    if (!scaleDef) throw new Error('Unknown scale ' + color$$1.scale);
    if (!d3Let.isObject(scaleDef)) scaleDef = { scale: scaleDef };
    if (scaleDef.minPoints === undefined) scaleDef.minPoints = color$$1.scaleMinPoints;

    var offset = color$$1.scaleOffset,
        npoints = n + offset,
        points = Math.max(npoints, scaleDef.minPoints),
        domain = scaleDef.reversed ? [points - 1, 0] : [0, points - 1],
        scale = scaleDef.scale().domain(domain);
    return d3Array.range(offset, Math.min(npoints, points)).map(function (v) {
        return scale(v);
    });
};

//
//  Linear Gradient method
//  ==========================
//
//  Create a monocromatic linear gradient in the visualization box,
//  either horizontal or vertical
vizPrototype.linearGradient = function (col, box, orientation, gid) {
    var paper = this.paper().sel,
        defs = paper.select('defs');
    if (!defs.node()) defs = paper.append('defs');
    var grad = defs.selectAll('#' + gid).data([0]),
        colto = d3Color.color(col);

    colto.opacity = 0.1;

    grad.enter().append('linearGradient').attr('id', gid).attr('x1', '0%').attr('y1', '0%').attr('x2', orientation === 'vertical' ? '0%' : '100%').attr('y2', orientation === 'vertical' ? '100%' : '0%');

    var stops = defs.select('#' + gid).selectAll('stop').data([{ offset: '0%', color: col }, { offset: '100%', color: colto }]);

    stops.enter().append('stop').merge(stops).attr('offset', function (d) {
        return d.offset;
    }).attr('stop-color', function (d) {
        return d.color;
    });

    return 'url(#' + gid + ')';
};

globalOptions.legend = {
    location: "top-right",
    orient: "vertical",
    fontSize: '3%',
    title: '',
    titleWidth: "20%",
    labelFormat: null,
    titleMinWidth: 30,
    titleMaxWidth: 60,
    minFontSize: 10,
    maxFontSize: 20,
    offsetX: 10,
    offsetY: 10,
    shapeWidth: 15,
    shapeHeight: 15
};

var legends = {
    color: d3SvgLegend.legendColor,
    size: d3SvgLegend.legendSize,
    symbol: d3SvgLegend.legendSymbol
};

//
//  Legend method
//  ==========================
vizPrototype.legend = function (cfg, box) {
    var vizModel = this.getModel(),
        lgModel = this.getModel('legend'),
        name = d3Let.pop(cfg, 'type') || vizModel.legendType,
        size = this.dim(lgModel.fontSize, box.height, lgModel.minFontSize, lgModel.maxFontSize);
    if (!name) return;
    var legend = legends[name];
    if (!legend) return warn$1('Could not load legend ' + name);
    legend = legend().orient(lgModel.orient);
    if (lgModel.title) {
        var width = this.dim(lgModel.titleWidth, box.width, lgModel.titleMinWidth, lgModel.titleMaxWidth);
        legend.title(lgModel.title).titleWidth(width);
    }

    if (lgModel.labelFormat) legend.labelFormat(lgModel.labelFormat);
    legend.shapeWidth(lgModel.shapeWidth).shapeHeight(lgModel.shapeHeight);

    // apply cfg parameters
    for (var key in cfg) {
        legend[key](cfg[key]);
    }var g = this.paper().group('legend').style('font-size', size + 'px').html('').call(legend),
        bb = locations.get(lgModel.location)(g.node().getBBox(), box, lgModel);
    g.attr('transform', this.translate(bb.x, bb.y));
};

var locations = d3Collection.map({
    top: top,
    bottom: bottom,
    right: right,
    left: left,
    'top-left': topLeft,
    'top-right': topRight,
    'bottom-left': bottomLeft,
    'bottom-right': bottomRight
});

function top(bb, box, options) {
    return {
        x: box.total.left + (box.innerWidth - bb.width) / 2,
        y: options.offsetY
    };
}

function bottom(bb, box, options) {
    return {
        x: box.total.left + (box.innerWidth - bb.width) / 2,
        y: box.height - bb.height - options.offsetY
    };
}

function right(bb, box, options) {
    return {
        x: box.width - bb.width - options.offsetX,
        y: box.total.top + (box.innerHeight - bb.height) / 2
    };
}

function left(bb, box, options) {
    return {
        x: box.total.left + (box.innerWidth - bb.width) / 2,
        y: options.offsetY
    };
}

function topLeft(bb, box, options) {
    return {
        x: box.total.left + (box.innerWidth - bb.width) / 2,
        y: options.offsetY
    };
}

function topRight(bb, box, options) {
    return {
        x: box.width - bb.width - options.offsetX,
        y: options.offsetY
    };
}

function bottomLeft(bb, box, options) {
    return {
        x: box.total.left + (box.innerWidth - bb.width) / 2,
        y: box.height - bb.height - options.offsetY
    };
}

function bottomRight(bb, box, options) {
    return {
        x: box.width - bb.width - options.offsetX,
        y: box.height - bb.height - options.offsetY
    };
}

var constant = function (x) {
    return function constant() {
        return x;
    };
};

var functor = function (v) {
    if (d3Let.isFunction(v)) return v;
    return constant(v);
};

var identity = function (d) {
    return d;
};

//
//
//  Mouse events handling
//  ==========================
//
var mouseStrategies = d3Collection.map({
    darker: darkerStrategy(),
    fill: fillStrategy()
});

visuals.options.mouse = {
    over: ['darker'],
    darkerFactor: 0.5,
    fillColor: '#addd8e'
};

vizPrototype.mouseOver = function () {
    var self = this,
        model = this.getModel('mouse');

    return function (d, i) {
        if (!this.__mouse_over__) this.__mouse_over__ = {};
        var sel = self.select(this);
        var strategy = void 0;
        model.over.forEach(function (name) {
            strategy = mouseStrategies.get(name);
            if (!strategy) warn$1('Unknown mouse strategy ' + name);else strategy(self, sel, d, i);
        });
    };
};

vizPrototype.mouseOut = function () {
    var self = this,
        model = this.getModel('mouse');

    return function (d, i) {
        if (!this.__mouse_over__) this.__mouse_over__ = {};
        var sel = self.select(this);
        var strategy = void 0;
        model.over.forEach(function (name) {
            strategy = mouseStrategies.get(name);
            if (!strategy) warn$1('Unknown mouse strategy ' + name);else strategy.out(self, sel, d, i);
        });
    };
};

function darkerStrategy() {

    function darker(viz, sel) {
        var model = viz.getModel('mouse'),
            fill = d3Color.color(sel.style('fill')),
            filldarker = fill.darker(model.darkerFactor),
            node = sel.node();
        node.__mouse_over__.fill = fill;
        sel.style('fill', filldarker);
    }

    darker.out = function (viz, sel) {
        var node = sel.node(),
            fill = node.__mouse_over__.fill;
        if (fill) sel.style('fill', fill);
    };

    return darker;
}

function fillStrategy() {

    function fill(viz, sel) {
        var model = viz.getModel('mouse'),
            fill = d3Color.color(sel.style('fill')),
            node = sel.node();
        node.__mouse_over__.fill = fill;
        sel.style('fill', model.fillColor);
    }

    fill.out = function (viz, sel) {
        var node = sel.node(),
            fill = node.__mouse_over__.fill;
        if (fill) sel.style('fill', fill);
    };

    return fill;
}

visuals.options.tooltip = {
    location: "top",
    offset: [0, 0],
    html: ""
};

if (d3Let.inBrowser) vizPrototype.tooltip = tooltip();else vizPrototype.tooltip = identity;

mouseStrategies.set('tooltip', function () {

    function tooltip(viz, sel, d, i) {
        var html = viz.tooltipHtml(sel, d, i);
        if (html) {
            var model = viz.getModel('tooltip');
            viz.tooltip.location(model.location).offset(model.offset).html(html).show(sel.node());
        }
    }

    tooltip.out = function (viz) {
        viz.tooltip.hide();
    };

    return tooltip;
}());

vizPrototype.tooltipHtml = function (sel, d, i) {
    var model = this.getModel('tooltip');
    if (model.html) return this.dataStore.eval(model.html, {
        d: d,
        index: i,
        model: this.getModel()
    });
};

function tooltip() {

    var location = functor('top'),
        offset = functor([0, 0]),
        html = functor(' '),
        node = null,
        point = null;

    var locationCallbacks = d3Collection.map({
        top: top,
        bottom: bottom,
        right: right,
        left: left,
        'top-left': topLeft,
        'top-right': topRight,
        'bottom-left': bottomLeft,
        'bottom-right': bottomRight
    });

    var locations = locationCallbacks.keys();

    function selectNode() {
        if (node === null) {
            node = d3Selection.select(document.body).append('div').classed('d3-tooltip', true).style('position', 'absolute').style('top', 0).style('opacity', 0).style('pointer-events', 'none').style('box-sizing', 'border-box').node();
            point = d3Selection.select(document.body).append('svg').style('opacity', 0).style('pointer-events', 'none').node().createSVGPoint();
        }
        return d3Selection.select(node);
    }

    function tooltip() {}

    tooltip.show = function (target) {
        var args = Array.prototype.slice.call(arguments),
            snode = selectNode(),
            content = html.apply(this, args) || '',
            poffset = offset.apply(this, args),
            dir = location.apply(this, args),
            scrollTop = document.documentElement.scrollTop || document.body.scrollTop,
            scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft,
            coords;

        snode.html(content).style('opacity', 1).style('pointer-events', 'all');

        var i = locations.length;
        while (i--) {
            snode.classed(locations[i], false);
        }coords = locationCallbacks.get(dir).call(this, target);
        snode.classed(dir, true).style('top', coords.top + poffset[0] + scrollTop + 'px').style('left', coords.left + poffset[1] + scrollLeft + 'px');

        return tooltip;
    };

    tooltip.hide = function () {
        selectNode().style('opacity', 0).style('pointer-events', 'none');
        return tooltip;
    };

    // Returns tip or location
    tooltip.location = function (v) {
        if (!arguments.length) return location;
        location = v === null ? v : functor(v);
        return tooltip;
    };

    tooltip.html = function (v) {
        if (!arguments.length) return html;
        html = v === null ? v : functor(v);
        return tooltip;
    };

    tooltip.offset = function (v) {
        if (!arguments.length) return offset;
        offset = v == null ? v : functor(v);
        return tooltip;
    };

    return tooltip;

    function top(target) {
        var bbox = getScreenBBox(target);
        return {
            top: bbox.n.y - node.offsetHeight,
            left: bbox.n.x - node.offsetWidth / 2
        };
    }

    function bottom(bb, box, options) {
        return {
            x: box.total.left + (box.innerWidth - bb.width) / 2,
            y: box.height - bb.height - options.offsetY
        };
    }

    function right(target) {
        var bbox = getScreenBBox(target);
        return {
            top: bbox.e.y - node.offsetHeight / 2,
            left: bbox.e.x
        };
    }

    function left(bb, box, options) {
        return {
            x: box.total.left + (box.innerWidth - bb.width) / 2,
            y: options.offsetY
        };
    }

    function topLeft(bb, box, options) {
        return {
            x: box.total.left + (box.innerWidth - bb.width) / 2,
            y: options.offsetY
        };
    }

    function topRight(bb, box, options) {
        return {
            x: box.width - bb.width - options.offsetX,
            y: options.offsetY
        };
    }

    function bottomLeft(bb, box, options) {
        return {
            x: box.total.left + (box.innerWidth - bb.width) / 2,
            y: box.height - bb.height - options.offsetY
        };
    }

    function bottomRight(bb, box, options) {
        return {
            x: box.total.left + (box.innerWidth - bb.width) / 2,
            y: box.height - bb.height - options.offsetY
        };
    }

    // Private - gets the screen coordinates of a shape
    //
    // Given a shape on the screen, will return an SVGPoint for the locations
    // n(north), s(south), e(east), w(west), ne(northeast), se(southeast),
    // nw(northwest), sw(southwest).
    //
    //    +-+-+
    //    |   |
    //    +   +
    //    |   |
    //    +-+-+
    //
    // Returns an Object {n, s, e, w, nw, sw, ne, se}
    function getScreenBBox(targetel) {

        while (targetel.getScreenCTM == null && targetel.parentNode == null) {
            targetel = targetel.parentNode;
        }

        var bbox = {},
            matrix = targetel.getScreenCTM(),
            tbbox = targetel.getBBox(),
            width = tbbox.width,
            height = tbbox.height,
            x = tbbox.x,
            y = tbbox.y;

        point.x = x;
        point.y = y;
        bbox.nw = point.matrixTransform(matrix);
        point.x += width;
        bbox.ne = point.matrixTransform(matrix);
        point.y += height;
        bbox.se = point.matrixTransform(matrix);
        point.x -= width;
        bbox.sw = point.matrixTransform(matrix);
        point.y -= height / 2;
        bbox.w = point.matrixTransform(matrix);
        point.x += width;
        bbox.e = point.matrixTransform(matrix);
        point.x -= width / 2;
        point.y -= height / 2;
        bbox.n = point.matrixTransform(matrix);
        point.y += height;
        bbox.s = point.matrixTransform(matrix);

        return bbox;
    }
}

var VisualContainer = createVisual('container', {
    initialise: function initialise() {
        this.live = [];
        if (this.visualParent) this.visualParent.live.push(this);
    },
    draw: function draw() {
        if (this.drawing) {
            warn$1(this.toString() + ' already drawing');
            return this.drawing;
        }
        var self = this;
        visuals.events.call('before-draw', undefined, self);
        return Promise.all(this.live.map(function (visual) {
            return visual.redraw();
        })).then(function () {
            delete self.drawing;
            visuals.events.call('after-draw', undefined, self);
        });
    },
    destroy: function destroy() {
        this.pop(this.visualParent);
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
        var parent = this.model.visual;

        // allow to specify the schema as an entry of
        // visuals object in the dashboard schema
        if (parent && parent !== this.model && d3Let.isString(input)) {
            var schema = parent.getVisualSchema(input);
            if (schema) input = schema;
        }

        if (d3Let.isString(input)) {
            return this.json(input).then(build).catch(function (err) {
                warn$1('Could not reach ' + input + ': ' + err);
            });
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
        var model = this.model,
            sel = this.createElement('div'),
            root = model.root;
        if (attrs.class) sel.attr('class', attrs.class);
        if (!schema.visuals) schema.visuals = {};
        model.visual = new VisualContainer(sel.node(), schema, model.visual, model.visual ? null : model.$new());
        if (!root.visualDashboard) root.visualDashboard = model.visual;
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
            options = {},
            layers;

        if (type === 'visual') {
            layers = d3Let.pop(schema, 'layers');
            options = schema;
        } else options.visual = d3Let.pop(schema, 'visual') || {};

        model.visual = new Visual(sel.node(), options, model.visual, model.visual ? null : model.$new());
        if (type !== 'visual') model.visual.addVisual(schema);else if (layers) {
            layers.forEach(function (layer) {
                return model.visual.addVisual(layer);
            });
        }
        return sel;
    },


    // once the element is mounted in the dom, draw the visual
    mounted: function mounted() {
        if (this.model.visualDrawOnMount === false) return;
        this.model.visual.redraw();
    }
});

//
//  d3-view components
//  ======================
//
//  d3-view plugin for visualization components
//
//  visual plugins first
// Visual components plugin
var index = {
    install: function install(vm) {
        vm.addComponent('dashboard', dashboard);
        vm.addComponent('visual', visual);
    }
};

var descending = function (a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
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
                points.push([x, y]);
                points.push([-x, y]);
            }
            j = index[i];
            k = n - i - 1;
            fraction = polygons[j] / v0;
            pj = Math.sqrt(fraction);
            hi = height * pj;
            ph = i ? pad(pj, k) : 0;
            y = hi - ph;
            x = y * r;
            points.push([-x, y]);
            points.push([x, y]);
            polygons[j] = {
                index: k,
                value: polygons[j],
                fraction: fraction,
                points: points,
                data: data[j]
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

var niceRange = function (range$$1, splits) {
    var x0 = range$$1[0],
        x1 = range$$1[1],
        dx = (x1 - x0) / splits,
        n = Math.floor(Math.log10(dx)),
        v = Math.pow(10, n);
    if (dx / v > 5) v *= 10;
    v *= 0.1;

    var ndx = v * Math.ceil(dx / v),
        nx0 = v * Math.floor(x0 / v);
    return [nx0, nx0 + splits * ndx];
};

var lineDrawing = {

    // get information about
    //  * data []
    //  * range {x: [min, max], y: [min, max]}
    //  * meta []
    //      * index
    //      * label
    //      * range
    //
    getDataInfo: function getDataInfo(frame) {
        var model = this.getModel(),
            range$$1 = this.newRange(),
            nseries = frame.series.size(),
            data = nseries ? frame.series.values() : [frame.data],
            keys = nseries ? frame.series.keys() : [model.y],
            x = accessor(model.x),
            y = accessor(model.y),
            self = this;
        return {
            data: data,
            range: range$$1,
            meta: keys.map(function (label, index) {
                return {
                    index: index,
                    label: label,
                    range: self.range(data[index], x, y, range$$1)
                };
            })
        };
    },
    fill: function fill(data) {
        var colors = this.colors(data.length);

        function fill(d, index) {
            return colors[index];
        }

        fill.colors = colors;

        return fill;
    },
    curve: function curve(name) {
        var obj = camelFunction(d3_shape, 'curve', name, true);
        if (!obj) {
            warn$1('Could not locate curve type "' + name + '"');
            obj = camelFunction(d3_shape, 'curve', 'cardinalOpen', true);
        }
        return obj;
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
    },
    x: function x(box, ranges) {
        var model = this.getModel(),
            scale = this.getScale(model.scaleX).domain(d3Array.extent(ranges)).range([0, box.innerWidth]);
        return function (d) {
            return scale(d[model.x]);
        };
    },
    y: function y(box, ranges, value) {
        var model = this.getModel(),
            scale = this.getScale(model.scaleY).domain(d3Array.extent(ranges)).range([box.innerHeight, 0]);
        if (arguments.length === 2) value = function value(d) {
            return d[model.y];
        };
        return function (d) {
            return scale(value(d));
        };
    },
    getStack: function getStack() {
        var model = this.getModel();
        if (model.stack) {
            var s = d3_shape.stack();
            if (model.stackOrder) s.order(model.stackOrder);
            return s;
        }
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
        y: 'y',
        scaleX: 'linear',
        scaleY: 'linear'
    },

    doDraw: function doDraw(frame) {
        var self = this,
            range$$1 = this.newRange(),
            model = this.getModel(),
            color$$1 = this.getModel('color'),
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
        .attr('stroke', strokeColor).attr('stroke-opacity', color$$1.strokeOpacity).attr('stroke-width', model.lineWidth).attr('d', line$$1);

        lines.exit().remove();
    }
});

//
//  Bar Chart
//  =============
//
//  The barchart is one of the most flexible visuals.
//  It can be used to display label data as well as
//  timeserie data. It can display absulte values as
//  proportional data via vertical staking and normalization
var bar = createChart('barchart', lineDrawing, {

    options: {
        orientation: 'vertical',
        // stack multiple y series?
        sortby: null, // specify "x" or "y"
        stack: true,
        normalize: false,
        scale: 'linear',
        padding: 0.1,
        x: 'x',
        y: 'y',
        groupby: null, // group data by a field for staked or grouped bar chart
        //
        // legend & tooltip
        valueformat: '.1f',
        legendType: 'color',
        legendLabel: 'label'
    },

    doDraw: function doDraw(frame) {
        var model = this.getModel(),
            color$$1 = this.getModel('color'),
            data = frame.data,
            box = this.boundingBox(),
            paper = this.paper().size(box),
            bars = paper.group().attr("transform", this.translate(box.total.left, box.total.top)).selectAll('.group'),
            x = model.x,
            y = model.y,
            groupby = model.groupby,
            sx = this.getScale('band'),
            sy = this.getScale(model.scale),
            sz = this.getScale('ordinal'),
            stacked = false,
            width = null,
            height = null,
            xrect = x0,
            yrect = y0,
            yi = 1,
            groups,
            axis;

        if (model.orientation === 'vertical') {
            sx.rangeRound([0, box.innerWidth]).paddingInner(model.padding);
            sy.rangeRound([box.innerHeight, 0]);
            width = sx.bandwidth;
            height = bardim;
        } else {
            sx.rangeRound([0, box.innerHeight]).paddingInner(model.padding);
            sy.rangeRound([0, box.innerWidth]);
            yi = 0;
            width = bardim;
            height = sx.bandwidth;
            xrect = y0;
            yrect = x0;
        }

        if (groupby) {
            groups = frame.dimension(groupby).group().top(Infinity).map(function (g) {
                return g['key'];
            });
            if (groups.length <= 1) groups = null;
        }

        if (groups) {
            frame = frame.pivot(x, groupby, y);
            if (model.sortby === 'y') frame = frame.sortby('total');
            data = frame.data;
            sz.domain(groups).range(this.colors(groups.length));
            if (model.stack) {
                if (model.normalize) this.normalize(frame.data);
                stacked = true;
            }
        }

        // set domain for the labels
        sx.domain(data.map(function (d) {
            return d[x];
        }));

        if (stacked) {
            sy.domain([0, d3Array.max(data, function (d) {
                return d.total;
            })]).nice();
            data = d3_shape.stack().order(d3_shape.stackOrderDescending).keys(groups)(data);
            var rects = bars.data(data).enter().append('g').classed('group', true).attr('fill', function (d) {
                return sz(d.key);
            }).merge(bars).attr('fill', function (d) {
                return sz(d.key);
            }).attr('stroke', color$$1.stroke).attr('stroke-opacity', color$$1.strokeOpacity).attr('fill-opacity', color$$1.fillOpacity).selectAll('rect').data(function (d) {
                return d;
            });
            rects.enter().append('rect').attr('x', xrect).attr('y', yrect).attr('height', height).attr('width', width).on("mouseover", this.mouseOver()).on("mouseout", this.mouseOut()).merge(rects).transition().attr('x', xrect).attr('y', yrect).attr('height', height).attr('width', width);
        } else {
            var x1 = self.getScale('band').padding(0.5 * model.padding);
            return x1;
        }

        if (model.orientation === 'vertical') {
            axis = this.axis('bottom', sx).tickSizeOuter(0);
            paper.group('axis').attr("transform", this.translate(box.total.left, box.total.top + box.innerHeight)).call(axis);
        } else {
            axis = this.axis('left', sx).tickSizeOuter(0);
            paper.group('axis').attr("transform", this.translate(box.total.left, box.total.top)).call(axis);
        }

        if (model.legendType && groups) {
            this.legend({ scale: sz }, box);
        }

        function bardim(d) {
            return sy(d[1 - yi]) - sy(d[yi]);
        }

        function x0(d) {
            return sx(d.data[x]);
        }

        function y0(d) {
            return sy(d[yi]);
        }
    }
});

//
//  Box Chart
//  =============
//
//  A box-and-whisker plot uses simple glyphs that summarize a quantitative
//  distribution with five standard statistics: the smallest value, lower
//  quartile, median, upper quartile, and largest value.
//  This summary approach allows the viewer to easily recognize
//  differences between distributions.
//
var box = createChart('boxchart', lineDrawing, {

  options: {
    orientation: 'vertical',
    lineWidth: 1,
    x: 'x',
    y: 'y',
    scaleX: 'linear',
    scaleY: 'linear',
    // area with vertical gradient to zero opacity
    gradient: true
  },

  doDraw: function doDraw(frame) {
    var self = this,
        model = this.getModel(),

    //color = this.getModel('color'),
    info = self.getDataInfo(frame),
        box = this.boundingBox(),
        chart = boxplot(),
        paper = this.paper().size(box),
        x = accessor(model.x),

    //y = accessor(model.y),
    boxes = paper.group().attr("transform", this.translate(box.total.left, box.total.top)).selectAll('.box').data(info.data),

    //fill = this.fill(info.meta),
    groups = frame.groupby(model.x),
        sx = this.getScale(model.scaleX).domain(d3Array.extent(frame.data, x)),

    //sy = this.getScale(model.scaleY)
    //    .domain(extent(frame.data, y)),
    width = box.innerWidth;

    if (model.orientation === 'vertical') {
      sx.range([0, box.innerWidth]);
    } else {
      sx.range([0, box.innerHeight]);
      width = this.innerHeight;
    }
    chart.width(this.dim(model.width, width, width / groups.length - 2));

    boxes.enter().append('g').classed('box', true).call(chart);
  }
});

function boxplot() {
  var width = 1,
      height = 1,
      duration = 0,
      domain = null,
      value = Number,
      whiskers = boxWhiskers,
      quartiles = boxQuartiles,
      tickFormat = null;

  // For each small multiple
  function box(g) {
    var _this = this;

    g.each(function (d, i) {
      d = d.map(value).sort(d3Array.ascending);

      var n = d.length,
          min$$1 = d[0],
          max$$1 = d[n - 1],

      // Compute quartiles. Must return exactly 3 elements.
      quartileData = d.quartiles = quartiles(d),

      // Compute whiskers. Must return exactly 2 elements, or null.
      whiskerIndices = whiskers && whiskers(d),
          whiskerData = whiskerIndices && whiskerIndices.map(function (i) {
        return d[i];
      }),

      // Compute outliers. If no whiskers are specified, all data are "outliers".
      // We compute the outliers as indices, so that we can join across transitions!
      outlierIndices = whiskerIndices ? d3Array.range(0, whiskerIndices[0]).concat(d3Array.range(whiskerIndices[1] + 1, n)) : d3Array.range(n),

      // Compute the new x-scale.
      x1 = d3_scale.scaleLinear().domain(domain && domain.call(_this, d, i) || [min$$1, max$$1]).range([height, 0]),

      // Retrieve the old x-scale, if this is an update.
      x0 = _this.__chart__ || d3_scale.scaleLinear().domain([0, Infinity]).range(x1.range());

      // Stash the new scale.
      _this.__chart__ = x1;
      // Note: the box, median, and box tick elements are fixed in number,
      // so we only have to handle enter and update. In contrast, the outliers
      // and other elements are variable, so we need to exit them! Variable
      // elements also fade in and out.

      // Update center line: the vertical line spanning the whiskers.
      var center = g.selectAll("line.center").data(whiskerData ? [whiskerData] : []);

      center.enter().insert("line", "rect").attr("class", "center").attr("x1", width / 2).attr("y1", function (d) {
        return x0(d[0]);
      }).attr("x2", width / 2).attr("y2", function (d) {
        return x0(d[1]);
      }).style("opacity", 1e-6).transition().duration(duration).style("opacity", 1).attr("y1", function (d) {
        return x1(d[0]);
      }).attr("y2", function (d) {
        return x1(d[1]);
      });

      center.transition().duration(duration).style("opacity", 1).attr("y1", function (d) {
        return x1(d[0]);
      }).attr("y2", function (d) {
        return x1(d[1]);
      });

      center.exit().transition().duration(duration).style("opacity", 1e-6).attr("y1", function (d) {
        return x1(d[0]);
      }).attr("y2", function (d) {
        return x1(d[1]);
      }).remove();

      // Update innerquartile box.
      var box = g.selectAll("rect.box").data([quartileData]);

      box.enter().append("rect").attr("class", "box").attr("x", 0).attr("y", function (d) {
        return x0(d[2]);
      }).attr("width", width).attr("height", function (d) {
        return x0(d[0]) - x0(d[2]);
      }).transition().duration(duration).attr("y", function (d) {
        return x1(d[2]);
      }).attr("height", function (d) {
        return x1(d[0]) - x1(d[2]);
      });

      box.transition().duration(duration).attr("y", function (d) {
        return x1(d[2]);
      }).attr("height", function (d) {
        return x1(d[0]) - x1(d[2]);
      });

      // Update median line.
      var medianLine = g.selectAll("line.median").data([quartileData[1]]);

      medianLine.enter().append("line").attr("class", "median").attr("x1", 0).attr("y1", x0).attr("x2", width).attr("y2", x0).transition().duration(duration).attr("y1", x1).attr("y2", x1);

      medianLine.transition().duration(duration).attr("y1", x1).attr("y2", x1);

      // Update whiskers.
      var whisker = g.selectAll("line.whisker").data(whiskerData || []);

      whisker.enter().insert("line", "circle, text").attr("class", "whisker").attr("x1", 0).attr("y1", x0).attr("x2", width).attr("y2", x0).style("opacity", 1e-6).transition().duration(duration).attr("y1", x1).attr("y2", x1).style("opacity", 1);

      whisker.transition().duration(duration).attr("y1", x1).attr("y2", x1).style("opacity", 1);

      whisker.exit().transition().duration(duration).attr("y1", x1).attr("y2", x1).style("opacity", 1e-6).remove();

      // Update outliers.
      var outlier = g.selectAll("circle.outlier").data(outlierIndices, Number);

      outlier.enter().insert("circle", "text").attr("class", "outlier").attr("r", 5).attr("cx", width / 2).attr("cy", function (i) {
        return x0(d[i]);
      }).style("opacity", 1e-6).transition().duration(duration).attr("cy", function (i) {
        return x1(d[i]);
      }).style("opacity", 1);

      outlier.transition().duration(duration).attr("cy", function (i) {
        return x1(d[i]);
      }).style("opacity", 1);

      outlier.exit().transition().duration(duration).attr("cy", function (i) {
        return x1(d[i]);
      }).style("opacity", 1e-6).remove();

      // Compute the tick format.
      var format$$1 = tickFormat || x1.tickFormat(8);

      // Update box ticks.
      var boxTick = g.selectAll("text.box").data(quartileData);

      boxTick.enter().append("text").attr("class", "box").attr("dy", ".3em").attr("dx", function (d, i) {
        return i & 1 ? 6 : -6;
      }).attr("x", function (d, i) {
        return i & 1 ? width : 0;
      }).attr("y", x0).attr("text-anchor", function (d, i) {
        return i & 1 ? "start" : "end";
      }).text(format$$1).transition().duration(duration).attr("y", x1);

      boxTick.transition().duration(duration).text(format$$1).attr("y", x1);

      // Update whisker ticks. These are handled separately from the box
      // ticks because they may or may not exist, and we want don't want
      // to join box ticks pre-transition with whisker ticks post-.
      var whiskerTick = g.selectAll("text.whisker").data(whiskerData || []);

      whiskerTick.enter().append("text").attr("class", "whisker").attr("dy", ".3em").attr("dx", 6).attr("x", width).attr("y", x0).text(format$$1).style("opacity", 1e-6).transition().duration(duration).attr("y", x1).style("opacity", 1);

      whiskerTick.transition().duration(duration).text(format$$1).attr("y", x1).style("opacity", 1);

      whiskerTick.exit().transition().duration(duration).attr("y", x1).style("opacity", 1e-6).remove();
    });
  }

  box.width = function (x) {
    if (!arguments.length) return width;
    width = x;
    return box;
  };

  box.height = function (x) {
    if (!arguments.length) return height;
    height = x;
    return box;
  };

  box.tickFormat = function (x) {
    if (!arguments.length) return tickFormat;
    tickFormat = x;
    return box;
  };

  box.duration = function (x) {
    if (!arguments.length) return duration;
    duration = x;
    return box;
  };

  box.domain = function (x) {
    if (!arguments.length) return domain;
    domain = x === null ? x : constant(x);
    return box;
  };

  box.value = function (x) {
    if (!arguments.length) return value;
    value = x;
    return box;
  };

  box.whiskers = function (x) {
    if (!arguments.length) return whiskers;
    whiskers = x;
    return box;
  };

  box.quartiles = function (x) {
    if (!arguments.length) return quartiles;
    quartiles = x;
    return box;
  };

  return box;
}

function boxWhiskers(d) {
  return [0, d.length - 1];
}

function boxQuartiles(d) {
  return [d3Array.quantile(d, 0.25), d3Array.quantile(d, 0.5), d3Array.quantile(d, 0.75)];
}

//
//  Create a Grouper generator
//  ===============================
//
//  This is a chart transform rather than a data transform
var grouper = function () {
    var groupby = null,
        x = 'x',
        y = 'y',
        sort = false,
        stack$$1 = null,
        normalize = false;

    function grouper(frame) {
        var stacked = false,
            data = void 0,
            labels = void 0,
            s = void 0;

        if (groupby) {
            labels = frame.dimension(groupby).group().top(Infinity).map(function (g) {
                return g['key'];
            });
            if (labels.length <= 1) labels = null;
        }

        if (labels) {
            frame = frame.pivot(x, groupby, y);
            if (sort) frame = frame.sortby('total');
            data = frame.data;
            if (stack$$1) {
                if (normalize) data = normalizeData(data);
                data = stack$$1.keys(labels)(data);
                stacked = true;
            }
        } else {
            data = frame.data;
            labels = [y];
        }

        if (!stacked) data = labels.map(function (key, index) {
            s = data.map(function (d) {
                s = [0, d[key]];
                s.data = d;
                return s;
            });
            s.index = index;
            s.key = key;
            return s;
        });

        return new GroupedData(data, x, y, stacked);
    }

    grouper.groupby = function (_) {
        if (arguments.length) {
            groupby = _;
            return grouper;
        }
        return groupby;
    };

    grouper.x = function (_) {
        return arguments.length ? (x = _, grouper) : x;
    };

    grouper.y = function (_) {
        return arguments.length ? (y = _, grouper) : y;
    };

    grouper.normalize = function (_) {
        return arguments.length ? (normalize = _, grouper) : normalize;
    };

    grouper.stack = function (_) {
        return arguments.length ? (stack$$1 = _, grouper) : stack$$1;
    };

    return grouper;
};

function GroupedData(data, x, y, stacked) {
    this.data = data;
    this.stacked = stacked;
    this.x = x;
    this.y = y;
}

GroupedData.prototype = {
    rangeX: function rangeX() {
        return this.range(this.x);
    },
    rangeY: function rangeY() {
        return this.range();
    },
    range: function range$$1(key) {
        var range$$1 = void 0,
            vals = void 0;
        if (key) vals = this.data.reduce(function (a, d) {
            range$$1 = d3Array.extent(d, acc);
            a.push(range$$1[0]);
            a.push(range$$1[1]);
            return a;
        }, []);else vals = this.data.reduce(function (a, d) {
            range$$1 = d3Array.extent(d, acc0);
            a.push(range$$1[0]);
            a.push(range$$1[1]);
            range$$1 = d3Array.extent(d, acc1);
            a.push(range$$1[0]);
            a.push(range$$1[1]);
            return a;
        }, []);
        return d3Array.extent(vals);

        function acc0(d) {
            return d[0];
        }

        function acc1(d) {
            return d[1];
        }

        function acc(d) {
            return d.data[key];
        }
    }
};

function normalizeData(data) {
    return data;
}

//
//  Area Chart
//  =============
var area$1 = createChart('areachart', lineDrawing, {

    options: {
        lineWidth: 1,
        curve: 'natural',
        x: 'x',
        y: 'y',
        groupby: null, // group data by a field for staked or grouped area chart
        scaleX: 'linear',
        scaleY: 'linear',
        // area with vertical gradient to zero opacity
        gradient: true,
        lineDarken: 0.2,
        //
        axisX: 'bottom',
        axisXticks: 5,
        axisY: 'left',
        axisYticks: 5,
        //
        axisFormat: ',',
        axisTimeFormat: '%Y-%m-%d',
        axisTickSizeOuter: 0
    },

    doDraw: function doDraw(frame) {
        var self = this,
            model = this.getModel(),
            x = model.x,
            y = model.y,
            col = this.getModel('color'),
            box = this.boundingBox(),
            info = grouper().groupby(model.groupby).stack(this.getStack()).x(x).y(y)(frame),
            rangeX = info.rangeX(),
            rangeY = info.rangeY(),
            scaleX = this.getScale(model.scaleX).domain(rangeX).rangeRound([0, box.innerWidth]),
            scaleY = this.getScale(model.scaleY).domain(rangeY).rangeRound([box.innerHeight, 0]).nice(),
            paper = this.paper().size(box),
            areas = paper.group().attr("transform", this.translate(box.total.left, box.total.top)).selectAll('.areagroup').data(info.data),
            colors = this.colors(info.data.length),
            fill = model.gradient ? colors.map(function (c, i) {
            return self.linearGradient(c, box, 'vertical', 'fill' + self.model.uid + '-' + i);
        }) : colors,
            curve = this.curve(model.curve);

        var areagroup = areas.enter().append('g').classed('areagroup', true).merge(areas).selectAll('path').data(arealine);

        areagroup.enter().append('path').attr('class', function (d) {
            return d.type;
        }).attr('fill', function (d) {
            return d.fill;
        }).attr('stroke', function (d) {
            return d.stroke;
        }).attr('d', function (d) {
            return d.draw;
        }).merge(areagroup).attr('d', function (d) {
            return d.draw;
        }).attr('fill', function (d) {
            return d.fill;
        }).attr('stroke', function (d) {
            return d.stroke;
        }).attr('fill-opacity', col.fillOpacity).attr('stroke-width', model.lineWidth).attr('stroke-opacity', col.strokeOpacity);

        areagroup.exit().transition().remove();

        if (model.axisX) {
            var xa = this.axis(model.axisX, scaleX).ticks(this.ticks(box.innerWidth, 50)).tickFormat(this.format(rangeX[0])).tickSizeOuter(model.axisTickSizeOuter);
            paper.group('x-axis').attr("transform", this.translate(box.total.left, box.total.top + box.innerHeight)).call(xa);
        }
        if (model.axisY) {
            var ya = this.axis(model.axisY, scaleY).ticks(this.ticks(box.innerHeight, 30)).tickFormat(this.format(rangeY[0])).tickSizeOuter(model.axisTickSizeOuter);
            paper.group('y-axis').attr("transform", this.translate(box.total.left, box.total.top)).call(ya);
        }

        function xx(d) {
            return scaleX(d.data[x]);
        }

        function y0(d) {
            return scaleY(d[0]);
        }

        function y1(d) {
            return scaleY(d[1]);
        }

        function arealine(d) {
            var area_ = d3_shape.area().curve(curve).x(xx).y1(y1).y0(y0),
                line_ = d3_shape.line().curve(curve).x(xx).y(y1),
                c = d3Color.color(colors[d.index]);

            return [{
                type: 'area',
                data: d,
                draw: area_(d),
                stroke: 'none',
                fill: fill[d.index]
            }, {
                type: 'line',
                data: d,
                draw: line_(d),
                fill: 'none',
                stroke: c.darker(model.lineDarken)
            }];
        }
    },
    format: function format$$1(value) {
        if (d3Let.isDate(value)) return d3TimeFormat.timeFormat(this.getModel().axisTimeFormat);else return d3Format.format(this.getModel().axisFormat);
    },
    ticks: function ticks(size, spacing) {
        return Math.max(Math.floor(size / spacing), 1);
    }
});

//Text wrapping code adapted from Mike Bostock
var textWrap = function (text, width) {

    text.each(function () {
        var text = d3Selection.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line$$1 = [],
            lineHeight = 1.2,
            dy = parseFloat(text.attr("dy")) || 0,
            tspan = text.text(null).append("tspan").attr("x", 0).attr("dy", dy + "em");

        while (word = words.pop()) {
            line$$1.push(word);
            tspan.text(line$$1.join(" "));
            if (tspan.node().getComputedTextLength() > width && line$$1.length > 1) {
                line$$1.pop();
                tspan.text(line$$1.join(" "));
                line$$1 = [word];
                tspan = text.append("tspan").attr("x", 0).attr("dy", lineHeight + dy + "em").text(word);
            }
        }
    });
};

var pi = Math.PI;
var rad = pi / 180;

var proportional = {
    fill: function fill(data) {
        var colors = this.colors(data.length);

        function fill(d, idx) {
            return colors[idx];
        }

        fill.colors = colors;

        return fill;
    },
    proportionalData: function proportionalData(frame, field) {
        return frame.dimension(field).top(Infinity);
    },
    total: function total(field) {
        var total = 0;

        function value(d) {
            total += d[field];
            return d[field];
        }

        value.total = function () {
            return total;
        };
        return value;
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
        label: 'label',
        startAngle: 0,
        endAngle: 360,
        sort: false,
        innerRadius: 0,
        padAngle: 0,
        cornerRadius: 0,
        lineWidth: 1,
        //
        fractionFormat: '.1%',
        legendType: 'color',
        legendLabel: "label + ' - ' + format(fraction)",
        //
        // display information in the center of the pie chart
        // Should be used with innerRadius greater than 0
        center: null,
        centerOpacity: 1,
        centerFontSize: '7%'
    },

    doDraw: function doDraw(frame) {
        var model = this.getModel(),
            color$$1 = this.getModel('color'),
            field = model.field,
            box = this.boundingBox(),
            outerRadius = Math.min(box.innerWidth, box.innerHeight) / 2,
            innerRadius = sizeValue(model.innerRadius, outerRadius),
            total = this.total(field),
            angles = d3_shape.pie().padAngle(rad * model.padAngle).startAngle(rad * model.startAngle).endAngle(rad * model.endAngle).value(total),
            arcs = d3_shape.arc().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(model.cornerRadius),
            paper = this.paper().size(box),

        //update = paper.transition('update'),
        data = angles(this.proportionalData(frame, field)),
            fill = this.fill(data),
            slices = paper.group().attr("transform", this.translate(box.total.left + box.innerWidth / 2, box.total.top + box.innerHeight / 2)).selectAll('.slice').data(data);

        slices.enter().append('path').attr('class', 'slice').attr('stroke', color$$1.stroke).attr('stroke-opacity', 0).attr('fill-opacity', 0).attr('fill', fill).attr('stroke-width', model.lineWidth).on("mouseover", this.mouseOver()).on("mouseout", this.mouseOut()).merge(slices).transition().attr('stroke', color$$1.stroke).attr('stroke-opacity', color$$1.strokeOpacity).attr('d', arcs).attr('fill', fill).attr('fill-opacity', color$$1.fillOpacity);

        slices.exit().transition().remove();

        if (model.center) {
            var text = this.dataStore.eval(model.center, { total: total.total() });
            if (text) {
                var size = this.dim(model.centerFontSize, box.innerWidth),
                    center = paper.group('center-notation').attr("transform", this.translate(box.total.left + box.innerWidth / 2, box.total.top + box.innerHeight / 2)).selectAll('.info').data([text]);
                center.enter().append('text').attr('class', 'info').attr("text-anchor", "middle").attr("alignment-baseline", "middle").style("font-size", size + 'px').style('fill-opacity', 0).merge(center).text(text).style('fill-opacity', model.centerOpacity).call(textWrap, 1.5 * (innerRadius || outerRadius));
            }
        }
        if (!model.legendType) return;
        total = total.total();
        var expr = d3View.viewExpression(model.legendLabel),
            fmt = d3Format.format(model.fractionFormat),
            labels = data.map(function (d, idx) {
            return expr.eval({
                d: d,
                value: d.value,
                format: fmt,
                total: total,
                fraction: d.value / total,
                label: d.data[model.label] || idx
            });
        });
        this.legend({
            scale: d3_scale.scaleOrdinal().domain(labels).range(fill.colors)
        }, box);
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
        label: 'label',
        pad: 0.005,
        lineWidth: 1,
        inverted: false,
        legendType: 'color',
        invereted: false,
        legendLabel: "label + ' - ' + format('.1%', fraction)"
    },

    doDraw: function doDraw(frame) {
        var model = this.getModel(),
            field = model.field,
            color$$1 = this.getModel('color'),
            box = this.boundingBox(),
            pad = this.dim(model.pad, Math.min(box.innerWidth, box.innerHeight)),
            polygons = pyramid().pad(pad).value(function (d) {
            return d[field];
        }),
            scaleX = this.getScale('linear').rangeRound([0, box.innerWidth]),
            scaleY = this.getScale('linear').rangeRound(model.inverted ? [box.innerHeight, 0] : [0, box.innerHeight]),
            data = frame.new(polygons(this.proportionalData(frame, field))).dimension('fraction').bottom(Infinity),
            marks = d3_shape.symbol().type(function (d) {
            return polygon(d.points.map(function (xy) {
                return [scaleX(xy[0]), scaleY(xy[1])];
            }));
        }).size(1),
            fill = this.fill(data),
            paper = this.paper(),
            segments = paper.size(box).group().attr("transform", this.translate(box.total.left + box.innerWidth / 2, box.total.top)).selectAll('.segment').data(data);

        segments.enter().append('path').attr('class', 'segment').attr('stroke', color$$1.stroke).attr('stroke-opacity', 0).attr('fill-opacity', 0).attr('fill', fill).attr('stroke-width', model.lineWidth).attr('d', marks).on("mouseover", this.mouseOver()).on("mouseout", this.mouseOut()).merge(segments).transition().attr('stroke', color$$1.stroke).attr('stroke-opacity', color$$1.strokeOpacity).attr('d', marks).attr('fill', fill).attr('fill-opacity', color$$1.fillOpacity);

        segments.exit().remove();

        if (!model.legendType) return;
        var expr = d3View.viewExpression(model.legendLabel),
            self = this,
            labels = data.map(function (d, idx) {
            return expr.eval(self.getContext({
                d: d,
                value: d.value,
                fraction: d.fraction,
                label: d.data[model.label] || idx
            }));
        });
        this.legend({
            scale: this.getScale('ordinal').domain(labels).range(fill.colors)
        }, box);
    }
});

//
//  Treemap
//  =============
//
var treemap = createChart('treemap', {
    requires: ['d3-hierarchy'],

    doDraw: function doDraw() {}
});

var text = createChart('text', {

    options: {
        label: 'label',
        data: 'data',
        text: 'label + " " + data'
    },

    doDraw: function doDraw(frame) {
        var self = this,
            model = this.getModel(),
            color$$1 = this.getModel('color'),
            box = this.boundingBox(),
            size = this.font(box),
            paper = this.paper().size(box),
            group = paper.group().attr("transform", this.translate(box.total.left, box.total.top)).selectAll('text').data(frame.data),
            width = box.innerWidth / frame.data.length,
            widthWrap = 0.4 * width,
            store = this.dataStore;

        group.enter().append('text').attr("transform", shift).attr("text-anchor", "middle").attr("alignment-baseline", "middle").style("font-size", size + 'px').style('fill-opacity', 0).merge(group).attr("transform", shift).text(function (d) {
            return store.eval(model.text, d);
        }).style('fill-opacity', color$$1.fillOpacity).call(textWrap, widthWrap);

        group.exit().remove();

        function shift(d, i) {
            return self.translate((i + 0.5) * width, 0);
        }
    }
});

//
//  Heatmap
//  =============
//
//  A heatmap is a graphical representation of data where the individual
//  values contained in a matrix are represented as colors.
//  This chart type allow to specify to types of layout:
//  * heatmap - classical heatmap
//  * punchcard - the z dimension is converted into different sizes of the shape elements
//  * contour - similar to heatmap but continous rather than descrete
var heatmap = createChart('heatmap', lineDrawing, {

    options: {
        shape: 'square',
        layout: 'heatmap',
        buckets: 10,
        pad: 0.005, // padding for heatmap & punchcard
        x: 'x',
        y: 'y',
        z: 'data',
        axisX: 'bottom',
        axisY: 'left'
    },

    doDraw: function doDraw(frame) {
        var model = this.getModel(),
            color$$1 = this.getModel('color'),
            layout = model.layout,
            box = this.boundingBox(),
            zrange = d3Array.extent(frame.data, accessor(model.z)),
            paper = this.paper().size(box);

        if (zrange[0] < 0 && layout === 'punchcard') layout = 'heatmap';

        var heat = this.heatmap(layout, frame, box, zrange),
            dx = (box.innerWidth - heat.width) / 2,
            dy = (box.innerHeight - heat.height) / 2,
            shape = this.getSymbol(model.shape).size(function (d) {
            return d.size * d.size;
        }),
            shapes = paper.group().attr("transform", this.translate(box.total.left + dx, box.total.top + dy)).selectAll('.shape').data(heat.data);

        if (d3Array.range[0] < 0 && layout === 'punchcard') layout = 'heatmap';

        shapes.enter().append('path').classed('shape', true).attr("transform", function (d) {
            return 'translate(' + d.x + ', ' + d.y + ')';
        }).attr("fill", function (d) {
            return d.color;
        }).attr("fill-opacity", 0).attr("stroke-opacity", 0).attr("stroke", color$$1.stroke).attr('d', shape).merge(shapes).transition().attr("transform", function (d) {
            return 'translate(' + d.x + ', ' + d.y + ')';
        }).attr("fill-opacity", color$$1.fillOpacity).attr("fill", function (d) {
            return d.color;
        }).attr("stroke-opacity", color$$1.strokeOpacity).attr("stroke", color$$1.stroke).attr('d', shape);

        if (model.axisX === 'bottom') this.xAxis(heat.scaleX, box.total.left, box.total.top + heat.height + dy);
        if (model.axisY === 'left') this.yAxis(heat.scaleY, box.total.left, box.total.top + dy);

        if (layout === 'heatmap') this.legend({
            type: 'color',
            shape: model.shape,
            scale: heat.colors
        }, box);else if (layout === 'punchcard') this.legend({
            type: 'size',
            shape: model.shape,
            scale: heat.sizes
        }, box);
    },
    heatmap: function heatmap(layout, frame, box, zrange) {
        var model = this.getModel(),
            pad = model.pad,
            x = model.x,
            y = model.y,
            z = model.z,
            gx = frame.dimension(model.x).group().size(),
            gy = frame.dimension(model.y).group().size(),
            buckets = Math.min(model.buckets, gx * gy),
            dx = (1 - pad * (gx + 1)) * box.innerWidth / gx,
            dy = (1 - pad * (gy + 1)) * box.innerHeight / gy,
            data = [],
            labelsX = [],
            labelsY = [],
            xp = d3Collection.map(),
            yp = d3Collection.map();

        var xv = void 0,
            yv = void 0,
            zv = void 0,
            i = void 0,
            j = void 0,
            colors = void 0,
            sizes = void 0,
            dd = void 0,
            width = void 0,
            height = void 0;

        if (dx < dy) {
            dd = dx;
            width = box.innerWidth;
            pad = width * pad;
            height = gy * (dd + pad) + pad;
        } else {
            dd = dy;
            height = box.innerHeight;
            pad = height * pad;
            width = gx * (dd + pad) + pad;
        }

        zrange = niceRange(zrange, buckets);

        if (layout === 'heatmap') {
            colors = this.getScale('quantile').range(this.colors(buckets).reverse()).domain(zrange);
            sizes = function sizes() {
                return 1;
            };
        } else {
            var color$$1 = this.colors(1)[0];
            colors = function colors() {
                return color$$1;
            };
            sizes = this.getScale('quantile').range(d3Array.range(buckets).map(function (s) {
                return (s + 1) / buckets;
            })).domain(zrange);
        }
        frame.data.forEach(function (d) {
            xv = d[x];
            yv = d[y];
            zv = d[z];
            if (!xp.has(xv)) {
                xp.set(xv, labelsX.length);
                labelsX.push(xv);
            }
            if (!yp.has(yv)) {
                yp.set(yv, labelsY.length);
                labelsY.push(yv);
            }
            i = xp.get(xv);
            j = yp.get(yv);
            data.push({
                i: i,
                j: j,
                x: pad + dd / 2 + i * (dd + pad),
                y: pad + dd / 2 + j * (dd + pad),
                color: colors(zv),
                size: dd * sizes(zv),
                data: d
            });
        });
        return {
            data: data,
            size: dd,
            width: width,
            height: height,
            scaleX: this.getScale('band').domain(labelsX).range([0, width]),
            scaleY: this.getScale('band').domain(labelsY).range([0, height]),
            colors: colors,
            sizes: sizes
        };
    }
});

//
//  GeoChart
//  =============
//
//  A chart displaying a geographical map
var geo = createChart('geochart', {
    // load these libraries
    requires: ['d3-geo', 'topojson', 'd3-geo-projection', 'leaflet'],

    options: {
        // Geometry data to display in this chart - must be in the topojson source
        geometry: 'countries',
        //
        // for choropleth maps
        // geoKey and dataKey are used to match geometry with data
        geoKey: 'id',
        dataKey: 'id',
        dataLabelKey: 'label',
        dataValueKey: 'value',
        // how many color buckets to visualise
        buckets: 10,
        choroplethScale: 'quantile',
        //
        // specify one of the topojson geometry object for calculating
        // the projected bounding box
        boundGeometry: null,
        // how much to zoom out, 1 = no zoom out, 0.95 to 0.8 are sensible values
        boundScaleFactor: 0.9,
        //
        projection: null,
        graticule: false,
        leaflet: false,
        scale: 200,
        //
        // mouseover strategy
        mouseover: ['darken', 'tooltip']
    },

    doDraw: function doDraw(frame, geo) {
        var info = this.getGeoData(frame);
        if (!info) return warn$1('Topojson data not available - cannot draw topology');
        if (!this._geoPath) this.createGeoPath(geo, info);
        this.update(geo, info);
    },
    update: function update(geo, info) {
        var model = this.getModel(),
            color$$1 = this.getModel('color'),
            box = this.boundingBox(),
            paper = this.paper().size(box),
            group = paper.group().attr("transform", this.translate(box.total.left, box.total.top)),
            path = this._geoPath,
            geometryData = geo.feature(info.topology, info.topology.objects[model.geometry]).features,
            paths = group.selectAll('.geometry').data(geometryData),
            fill = 'none';

        this.center(geo, info);
        if (info.data) fill = this.choropleth(info.data, box);

        paths.enter().append("path").attr("class", "geometry").attr("d", path).style('fill', 'none').style("stroke", color$$1.stroke).style("stroke-opacity", 0).style("fill-opacity", 0).on("mouseover", this.mouseOver()).on("mouseout", this.mouseOut()).merge(paths).transition().attr("d", path).style("stroke", color$$1.stroke).style("stroke-opacity", color$$1.strokeOpacity).style("fill", fill).style("fill-opacity", color$$1.fillOpacity);

        paths.exit().remove();
    },
    createGeoPath: function createGeoPath(geo, info) {
        var model = this.getModel(),
            projection = camelFunction(geo, 'geo', info.projection).scale(model.scale),
            path = geo.geoPath().projection(projection),
            self = this,
            lefletMap;

        this._geoPath = path;
        this.center(geo, info);

        if (model.leaflet) {
            var leafletId = 'leaflet-' + model.uid,
                paper = this.paper();
            this.visualParent.paper.append('div').attr('id', leafletId);
            lefletMap = new geo.Map(leafletId, { center: [37.8, -96.9], zoom: 4 }).addLayer(new geo.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")), lefletMap.getPanes().overlayPane.appendChild(paper.element);
            projection = geo.transform({ point: projectPoint });
            lefletMap.on("viewreset", function () {
                return self.update(geo, info);
            });
        }

        return path;

        function projectPoint(x, y) {
            var point = lefletMap.latLngToLayerPoint(new geo.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }
    },
    getGeoData: function getGeoData(frame) {
        var info = {};
        if (frame.type === 'frameCollection') for (var key in frame) {
            if (frame[key].type === 'Topology') info.topology = frame[key];else info.data = frame[key];
        } else if (frame.type === 'Topology') info.topology = frame;
        if (info.topology) {
            var model = this.getModel();
            if (model.projection) info.projection = model.proection;else {
                info.projection = 'kavrayskiy7';
            }
            return info;
        }
    },
    center: function center(geo, info) {
        var model = this.getModel();
        if (!model.boundGeometry) return;

        var path = this._geoPath,
            projection = path.projection(),
            box = this.boundingBox(),
            boundGeometry = geo.feature(info.topology, info.topology.objects[model.boundGeometry]).features;

        projection.scale(1).translate([0, 0]);

        var b = path.bounds(boundGeometry[0]),
            topLeft = b[0],
            bottomRight = b[1],
            scaleX = (bottomRight[0] - topLeft[0]) / box.innerWidth,
            scaleY = (bottomRight[1] - topLeft[1]) / box.innerHeight,
            scale = Math.round(model.boundScaleFactor / Math.max(scaleX, scaleY)),
            translate = [(box.innerWidth - scale * (bottomRight[0] + topLeft[0])) / 2, (box.innerHeight - scale * (bottomRight[1] + topLeft[1])) / 2];

        projection.scale(scale).translate(translate);
    },


    // choropleth map based on data
    choropleth: function choropleth(frame, box) {
        var model = this.getModel(),
            buckets = Math.min(model.buckets, frame.data.length),
            dataKey = model.dataKey,
            dataLabelKey = model.dataLabelKey,
            dataValueKey = model.dataValueKey,
            geoKey = model.geoKey,
            valueRange = niceRange(d3Array.extent(frame.data, accessor(dataValueKey)), buckets),
            colors = this.getScale(model.choroplethScale).range(this.colors(buckets).reverse()).domain(valueRange),
            values = frame.data.reduce(function (o, d) {
            o[d[dataKey]] = d;return o;
        }, {});
        var key = void 0,
            value = void 0;

        this.legend({
            type: 'color',
            scale: colors
        }, box);

        return function (d) {
            key = d.properties[geoKey];
            value = values[key];
            d.choropleth = {
                label: value[dataLabelKey] || key,
                value: value[dataValueKey],
                color: colors(value[dataValueKey])
            };
            return d.choropleth.color;
        };
    }
});

//

exports.visualizeVersion = version;
exports.randomPath = randompath;
exports.DataStore = DataStore;
exports.dataSources = dataSources;
exports.visuals = visuals;
exports.createChart = createChart;
exports.createPaper = createPaper;
exports.Svg = Svg;
exports.Div = Div;
exports.visualTransforms = transformStore;
exports.visualComponents = index;
exports.colorScales = colorScales;
exports.pyramid = pyramid;
exports.niceRange = niceRange;
exports.Visual = Visual;
exports.BarChart = bar;
exports.BoxChart = box;
exports.LineChart = line$1;
exports.AreaChart = area$1;
exports.PieChart = pie$1;
exports.PyramidChart = pyramid$1;
exports.Treemap = treemap;
exports.TextChart = text;
exports.Heatmap = heatmap;
exports.Geochart = geo;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=d3-visualize.js.map
