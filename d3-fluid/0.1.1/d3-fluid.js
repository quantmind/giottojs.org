// d3-fluid Version 0.1.1. Copyright 2016 quantmind.com.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-collection'), require('d3-let'), require('d3-view'), require('crossfilter/crossfilter'), require('d3-selection')) :
  typeof define === 'function' && define.amd ? define('d3-fluid', ['exports', 'd3-collection', 'd3-let', 'd3-view', 'crossfilter/crossfilter', 'd3-selection'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.cf,global.d3));
}(this, (function (exports,d3Collection,d3Let,d3View,cf,d3Selection) { 'use strict';

cf = 'default' in cf ? cf['default'] : cf;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





















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

















var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
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

// Provider interface
var defaultSerie = {
    init: function init(data) {
        this._cf = cf.crossfilter();
        if (arguments.length) this.add(data);
        this.natural = this._cf.dimension(function (d) {
            return d._id;
        });
    },
    size: function size() {
        return this._cf.size();
    },
    get: function get() {},


    // retrieve data from
    getList: function getList() {},


    // add data to the serie
    add: function add(data) {
        var size = this.size();
        data = data.map(function (entry) {
            if ((typeof entry === 'undefined' ? 'undefined' : _typeof(entry)) === 'object') data._id = ++size;else data = { _id: ++size, data: data };
            return data;
        });
        this._cf.add(data);
        return data;
    }
};

function dataStore(vm) {
    var store = new DataStore(vm);
    return store;
}

function DataStore(vm) {
    this.$series = d3Collection.map();
    this.$vm = vm;
}

DataStore.prototype = dataStore.prototype = {
    size: function size() {
        return this.$series.size();
    },


    // set or get a new data provider
    serie: function serie(name, newSerie) {
        if (arguments.length === 1) return this.$series.get(name);
        if (newSerie === null) {
            var p = this.$series.get(name);
            this.$series.remove(name);
            return p;
        }
        var serie = d3Let.assign({}, defaultSerie, newSerie);
        serie.init();
        this.$series.set(name, serie);
        return this;
    },
    getList: function getList(name, params) {
        var serie = this.$series.get(name),
            result = serie ? serie.getList(params) : [];

        if (!d3Let.isPromise(result)) {
            result = new Promise(function (resolve) {
                resolve(result);
            });
            if (!serie) {
                d3View.viewWarn('Serie "' + name + ' not available');
                return result;
            }
        }

        return result.then(function (data) {
            if (!d3Let.isArray(data)) {
                d3View.viewWarn('Excepted an array, got ' + (typeof data === 'undefined' ? 'undefined' : _typeof(data)));
                data = [];
            }
            serie.add(data);
            return data;
        });
    }
};

var tpl = '<ul class="d3-list">\n<li d3-for="entry in data">\n</li>\n</ul>';

var ul = function () {
    return d3View.viewElement(tpl);
};

// d3-view component to list data
// tags supported: table, ul & div
//
// Some ideas taken from
//  * list.js (https://github.com/javve/list.js)
//  *
var tags = {
    ul: ul
};

var list = {
    render: function render(data, attrs) {
        var tag = data.tag || 'ul',
            id = attrs.id || 'list-' + this.uid,
            html = tags[tag],
            store;

        if (attrs.source) {
            store = this.model.$dataStore.serie(attrs.source);
            if (!store) d3View.viewWarn('source "' + attrs.source + '" not available, cannot retrieve serie');
        } else d3View.viewWarn('source not specified, cannot retrieve serie');

        var el = this.htmlElement('<div id="' + id + '"></div>');

        if (!html) d3View.viewWarn('Could not find html builder for "' + tag + '" tag');else d3Selection.select(el).append(html);

        return el;
    }
};

var index = {
    install: function install(vm) {
        vm.model.$dataStore = dataStore(vm);
        vm.addComponent('d3list', list);
        //
        // Add dataProvider method to the view model
        vm.dataSerie = dataSerie;
    }
};

function dataSerie(name, serie) {
    if (arguments.length === 1) return this.model.$dataStore.serie(name);else {
        this.model.$dataStore.serie(name, serie);
        return this;
    }
}

exports.fluid = index;
exports.dataStore = dataStore;

Object.defineProperty(exports, '__esModule', { value: true });

})));
