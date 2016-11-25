// https://github.com/quantmind/d3-canvas-transition Version 0.2.1. Copyright 2016 undefined.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-transition'), require('d3-collection'), require('d3-timer'), require('d3-color'), require('d3-selection')) :
  typeof define === 'function' && define.amd ? define('d3-canvas-transition', ['exports', 'd3-transition', 'd3-collection', 'd3-timer', 'd3-color', 'd3-selection'], factory) :
  (factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Transition,d3Collection,d3Timer,d3,d3Selection) { 'use strict';

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
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

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
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

// import {active} from 'd3-transition';


var SymbolTransition = function () {
    function SymbolTransition(factor) {
        classCallCheck(this, SymbolTransition);

        this.factor = factor || 1;
        this.time = Infinity;
        this.data1 = [];
    }

    createClass(SymbolTransition, [{
        key: 'update',
        value: function update(value) {
            this.pen = value.pen;
            this.time = value.time;
            this.current = value.data;
        }
    }, {
        key: 'draw',
        value: function draw(node) {
            node.context.beginPath();
            this.pen.context(node.context)();
        }
    }, {
        key: 'accessor',
        value: function accessor(f, j) {
            var factor = this.factor,
                data0 = this.data0,
                data1 = this.data1,
                time = this.time,
                prev,
                curr;
            return function (d, i) {
                prev = data0[i][j];
                if (prev === undefined) curr = factor * f(d);else curr = factor * (time * f(d) + (1 - time) * prev);
                data1[i][j] = curr;
                return curr;
            };
        }
    }]);
    return SymbolTransition;
}();

var PathTransition = function (_SymbolTransition) {
    inherits(PathTransition, _SymbolTransition);

    function PathTransition() {
        classCallCheck(this, PathTransition);
        return possibleConstructorReturn(this, (PathTransition.__proto__ || Object.getPrototypeOf(PathTransition)).apply(this, arguments));
    }

    createClass(PathTransition, [{
        key: 'update',
        value: function update(value) {
            if (value.time < this.time) {
                var data1 = this.data1;
                while (data1.length < value.data.length) {
                    data1.push(new Array(2));
                }this.data0 = this.data1;
                this.x = value.pen.x();
                this.y = value.pen.y();
            }
            get$1(PathTransition.prototype.__proto__ || Object.getPrototypeOf(PathTransition.prototype), 'update', this).call(this, value);
        }
    }, {
        key: 'draw',
        value: function draw(node) {
            node.context.beginPath();
            this.pen.context(node.context).x(this.accessor(this.x, 0)).y(this.accessor(this.y, 1))(this.current);
        }
    }]);
    return PathTransition;
}(SymbolTransition);

var shapeTransitions = {
    symbol: SymbolTransition,
    line: PathTransition,
    arc: PathTransition,
    area: PathTransition
};

var _setAttribute = function (node, attr, value) {
    var current = node.attrs.get(attr);
    if (current === value) return false;

    if (attr === 'd' && value && value.pen) {

        if (!current) {
            var Constructor = shapeTransitions[value.pen.name];
            current = new Constructor(node.factor);
            node.attrs.set(attr, current);
        }

        current.update(value);
        return true;
    } else {
        node.attrs.set(attr, value);
        return true;
    }
};

function pen(p, t, d, i) {
    return {
        pen: p,
        time: t,
        data: d,
        index: i || 0
    };
}

pen.test = function (name, value) {
    return name === 'd' && value && typeof value.context === 'function';
};

function deque() {
    return new Deque();
}

function Deque() {
    this._head = null;
    this._tail = null;
    this._length = 0;

    Object.defineProperty(this, 'length', {
        get: function get() {
            return this._length;
        }
    });
}

Deque.prototype = deque.prototype = {
    prepend: function prepend(child, refChild) {
        if (!this._length) {
            child._prev = null;
            child._next = null;
        } else if (refChild) {
            child._prev = refChild._prev;
            child._next = refChild;

            if (refChild._prev) refChild._prev.next = child;

            refChild._prev = child;
        } else {
            child._prev = this._tail;
            child._next = null;
            this._tail._next = child;
        }
        if (!child._prev) this._head = child;
        if (!child._next) this._tail = child;
        this._length++;
    },
    remove: function remove(child) {
        if (child._prev) child._prev._next = child._next;

        if (child._next) child._next._prev = child._prev;

        if (this._head === child) this._head = child._next;

        if (this._tail === child) this._tail = child._prev;

        delete child._prev;
        delete child._next;

        this._length--;
    },
    list: function list() {
        var child = this._head,
            list = [];
        while (child) {
            list.push(child);
            child = child._next;
        }
        return list;
    },
    each: function each(f) {
        var child = this._head;
        while (child) {
            f(child);
            child = child._next;
        }
    }
};

var namespace$1 = 'canvas';
var tag_line = 'line';
var tag_text = 'text';
var defaultBaseline = 'middle';
var textAlign = {
    start: 'start',
    middle: 'center',
    end: 'end'
};

var fontProperties = ['style', 'variant', 'weight', 'size', 'family'];

/**
 * A proxy for a data entry on canvas
 *
 * It partially implements the Node Api
 * https://developer.mozilla.org/en-US/docs/Web/API/Node
 *
 * It allow the use the d3-select and d3-transition libraries
 * on canvas joins
 */
var CanvasElement = function () {
    function CanvasElement(context, factor) {
        classCallCheck(this, CanvasElement);

        this.context = context;
        this.factor = factor || 1;
    }

    // API


    createClass(CanvasElement, [{
        key: 'querySelectorAll',
        value: function querySelectorAll(selector$$1) {
            if (this._deque) {
                if (selector$$1 === '*') return this.childNodes;
                return select$1(selector$$1, this._deque, []);
            } else return [];
        }
    }, {
        key: 'querySelector',
        value: function querySelector(selector$$1) {
            if (this._deque) {
                if (selector$$1 === '*') return this._deque._head;
                return select$1(selector$$1, this._deque);
            }
        }
    }, {
        key: 'createElementNS',
        value: function createElementNS(namespaceURI, qualifiedName) {
            var elem = new CanvasElement(this.context, this.factor);
            elem.tag = qualifiedName;
            return elem;
        }
    }, {
        key: 'hasChildNodes',
        value: function hasChildNodes() {
            return this._deque ? this._deque.length > 0 : false;
        }
    }, {
        key: 'contains',
        value: function contains(child) {
            while (child) {
                if (child._parent == this) return true;
                child = child._parent;
            }
            return false;
        }
    }, {
        key: 'appendChild',
        value: function appendChild(child) {
            return this.insertBefore(child);
        }
    }, {
        key: 'insertBefore',
        value: function insertBefore(child, refChild) {
            if (child === this) throw Error('inserting self into children');
            if (!(child instanceof CanvasElement)) throw Error('Cannot insert a non canvas element into a canvas element');
            if (child._parent) child._parent.removeChild(child);
            if (!this._deque) this._deque = deque();
            this._deque.prepend(child, refChild);
            child._parent = this;
            touch$1(this.root, 1);
            return child;
        }
    }, {
        key: 'removeChild',
        value: function removeChild(child) {
            if (child._parent === this) {
                delete child._parent;
                this._deque.remove(child);
                touch$1(this.root, 1);
                return child;
            }
        }
    }, {
        key: 'setAttribute',
        value: function setAttribute(attr, value) {
            if (attr === 'class') {
                this.class = value;
            } else if (attr === 'id') {
                this.id = value;
            } else {
                if (!this.attrs) this.attrs = d3Collection.map();
                if (_setAttribute(this, attr, value)) touch$1(this.root, 1);
            }
        }
    }, {
        key: 'removeAttribute',
        value: function removeAttribute(attr) {
            if (this.attrs) {
                this.attrs.remove(attr);
                touch$1(this.root, 1);
            }
        }
    }, {
        key: 'getAttribute',
        value: function getAttribute(attr) {
            if (this.attrs) return this.attrs.get(attr);
        }
    }, {
        key: 'draw',
        value: function draw(t) {
            var ctx = this.context,
                attrs = this.attrs;

            if (attrs) {
                ctx.save();
                transform(this, this.attrs.get('transform'));
                ctx.save();
                if (this.tag === tag_line) drawLine(this);else if (this.tag === tag_text) drawText(this);else path(this, attrs.get('d'), t);
                fillStyle(this);
                strokeStyle(this);
                ctx.restore();
            }

            if (this._deque) this._deque.each(function (child) {
                child.draw(t);
            });

            if (attrs) ctx.restore();
        }
    }, {
        key: 'each',
        value: function each(f) {
            if (this._deque) this._deque.each(f);
        }
    }, {
        key: 'getValue',
        value: function getValue(attr) {
            var value = this.getAttribute(attr);
            if (value === undefined && this._parent) return this._parent.getValue(attr);
            return value;
        }

        // Additional attribute functions

    }, {
        key: 'removeProperty',
        value: function removeProperty(name) {
            this.removeAttribute(name);
        }
    }, {
        key: 'setProperty',
        value: function setProperty(name, value) {
            this.setAttribute(name, value);
        }
    }, {
        key: 'getProperty',
        value: function getProperty(name) {
            return this.getAttribute(name);
        }
    }, {
        key: 'getPropertyValue',
        value: function getPropertyValue(name) {
            return this.getAttribute(name);
        }

        // Proxies to this object

    }, {
        key: 'getComputedStyle',
        value: function getComputedStyle() {
            return this;
        }
    }, {
        key: 'onStart',

        //
        value: function onStart() {
            return;
        }
    }, {
        key: 'childNodes',
        get: function get() {
            return this._deque ? this._deque.list() : [];
        }
    }, {
        key: 'firstChild',
        get: function get() {
            return this._deque ? this._deque._head : null;
        }
    }, {
        key: 'lastChild',
        get: function get() {
            return this._deque ? this._deque._tail : null;
        }
    }, {
        key: 'parentNode',
        get: function get() {
            return this._parent;
        }
    }, {
        key: 'previousSibling',
        get: function get() {
            return this._prev;
        }
    }, {
        key: 'nextSibling',
        get: function get() {
            return this._next;
        }
    }, {
        key: 'namespaceURI',
        get: function get() {
            return namespace$1;
        }

        // Canvas methods

    }, {
        key: 'countNodes',
        get: function get() {
            return this._deque ? this._deque._length : 0;
        }
    }, {
        key: 'root',
        get: function get() {
            if (this._parent) return this._parent.root;
            return this;
        }
    }, {
        key: 'ownerDocument',
        get: function get() {
            return this;
        }
    }, {
        key: 'style',
        get: function get() {
            return this;
        }
    }, {
        key: 'defaultView',
        get: function get() {
            return this;
        }
    }, {
        key: 'document',
        get: function get() {
            return this;
        }
    }]);
    return CanvasElement;
}();

function select$1(selector$$1, deque$$1, selections) {

    var selectors = selector$$1.split(' ');

    for (var s = 0; s < selectors.length; ++s) {
        selector$$1 = selectors[s];
        var bits = selector$$1.split('.'),
            tag = bits[0],
            classes = bits.splice(1).join(' '),
            child = deque$$1._head;

        while (child) {
            if (!tag || child.tag === tag) {
                if (classes && child.class !== classes) {
                    // nothing to do
                } else if (selections) selections.push(child);else return child;
            }
            child = child._next;
        }
    }

    return selections;
}

function strokeStyle(node) {
    var stroke = node.attrs.get('stroke');
    if (stroke && stroke !== 'none') {
        stroke = d3.color(stroke);
        var opacity = node.getValue('stroke-opacity');
        if (opacity || opacity === 0) stroke.opacity = opacity;
        node.context.strokeStyle = '' + stroke;
        node.context.lineWidth = node.factor * (node.getValue('stroke-width') || 1);
        node.context.stroke();
        return stroke;
    }
}

function fillStyle(node) {
    var fill = node.attrs.get('fill');
    if (fill && fill !== 'none') {
        fill = d3.color(fill);
        var opacity = node.getValue('fill-opacity');
        if (opacity || opacity === 0) fill.opacity = opacity;
        node.context.fillStyle = '' + fill;
        node.context.fill();
        return fill;
    }
}

function transform(node, trans) {
    if (!trans) return;
    var index1 = trans.indexOf('translate('),
        index2,
        s,
        bits;
    if (index1 > -1) {
        s = trans.substring(index1 + 10);
        index2 = s.indexOf(')');
        bits = s.substring(0, index2).split(',');
        node.context.translate(node.factor * bits[0], node.factor * bits[1]);
    }
    return true;
}

function drawLine(node) {
    var attrs = node.attrs;
    node.context.moveTo(node.factor * (attrs.get('x1') || 0), node.factor * (attrs.get('y1') || 0));
    node.context.lineTo(node.factor * attrs.get('x2'), node.factor * attrs.get('y2'));
}

function drawText(node) {
    var size = fontString(node);
    node.context.textAlign = textAlign[node.getValue('text-anchor')] || textAlign.middle;
    node.context.textBaseline = node.getValue('text-baseline') || defaultBaseline;
    node.context.fillText(node.textContent || '', fontLocation(node, 'x', size), fontLocation(node, 'y', size));
}

function path(node, path) {
    if (path) {
        if (typeof path.draw === 'function') path.draw(node);else if (path.context) path.context(node.context)();
    }
}

function fontString(node) {
    var bits = [],
        size = 0,
        key = void 0,
        v = void 0;
    for (var i = 0; i < fontProperties.length; ++i) {
        key = fontProperties[i];
        v = node.getValue('font-' + key);
        if (v) {
            if (key === 'size') {
                size = node.factor * v;
                v = size + 'px';
            }
            bits.push(v);
        }
    }
    if (size) node.context.font = bits.join(' ');
    return size;
}

function fontLocation(node, d, size) {
    var p = node.attrs.get(d) || 0,
        dp = node.attrs.get('d' + d) || 0;
    if (dp) {
        if (dp.substring(dp.length - 2) == 'em') dp = size * dp.substring(0, dp.length - 2);else if (dp.substring(dp.length - 2) == 'px') dp = +dp.substring(0, dp.length - 2);
    }
    return node.factor * (p + dp);
}

function touch$1(node, v) {
    if (!node._touches) node._touches = 0;
    node._touches += v;
    if (!node._touches || node._inloop) return;
    node._inloop = d3Timer.timeout(redraw(node));
}

function redraw(node) {

    return function () {
        var ctx = node.context;
        node._touches = 0;
        ctx.beginPath();
        ctx.closePath();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        node.draw();
        node._inloop = false;
        touch$1(node, 0);
    };
}

var originalAttr = d3Transition.transition.prototype.attr;

function tweenAttr(name, value) {
    var node = this.node();
    if (node instanceof CanvasElement && pen.test(name, value)) {
        return d3Transition.transition.prototype.attrTween.call(this, name, wrapPath(value));
    } else return originalAttr.call(this, name, value);
}

d3Transition.transition.prototype.attr = tweenAttr;

function wrapPath(p) {
    return function (d, i) {
        return function (t) {
            return pen(p, t, d, i);
        };
    };
}

var resolution = function (factor) {
    return factor || window.devicePixelRatio || 1;
};

function canvasSelection(context, factor) {
    if (!factor) factor = resolution();
    var s = d3Selection.selection();
    s._groups[0][0] = new CanvasElement(context, factor);
    return s;
}

canvasSelection.prototype = d3Selection.selection.prototype;

var originalAttr$1 = canvasSelection.prototype.attr;

function selectAttr(name, value) {
    if (arguments.length > 1) {
        var ref = this._parents[0] || this.node();
        if (ref instanceof CanvasElement && pen.test(name, value)) arguments[1] = pen(value, 1);
    }
    return originalAttr$1.apply(this, arguments);
}

canvasSelection.prototype.attr = selectAttr;

var slice = Array.prototype.slice;

function identity(d) {
    return d;
}

var top = 1;
var right = 2;
var bottom = 3;
var left = 4;
var epsilon = 1e-6;

function translateX(scale0, scale1, d) {
    var x = scale0(d);
    return 'translate(' + (isFinite(x) ? x : scale1(d)) + ',0)';
}

function translateY(scale0, scale1, d) {
    var y = scale0(d);
    return 'translate(0,' + (isFinite(y) ? y : scale1(d)) + ')';
}

function center(scale) {
    var width = scale.bandwidth() / 2;
    return function (d) {
        return scale(d) + width;
    };
}

function axis(orient, scale) {
    var tickArguments = [],
        tickValues = null,
        tickFormat = null,
        tickSizeInner = 6,
        tickSizeOuter = 6,
        tickPadding = 3;

    function axis(context) {
        var values = tickValues == null ? scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain() : tickValues,
            format = tickFormat == null ? scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity : tickFormat,
            spacing = Math.max(tickSizeInner, 0) + tickPadding,
            transform = orient === top || orient === bottom ? translateX : translateY,
            range = scale.range(),
            range0 = range[0],
            range1 = range[range.length - 1],
            position = (scale.bandwidth ? center : identity)(scale.copy()),
            selection$$1 = context.selection ? context.selection() : context,
            path = selection$$1.selectAll('.domain').data([null]),
            tick = selection$$1.selectAll('.tick').data(values, scale).order(),
            tickExit = tick.exit(),
            tickEnter = tick.enter().append('g', '.domain').attr('class', 'tick'),
            line = tick.select('line'),
            text = tick.select('text');

        path = path.merge(path.enter().append('line').attr('class', 'domain'));
        tick = tick.merge(tickEnter);
        line = line.merge(tickEnter.append('line'));
        text = text.merge(tickEnter.append('text'));

        if (context !== selection$$1) {
            path = path.transition(context);
            tick = tick.transition(context);
            tickExit = tickExit.transition(context).style('opacity', epsilon).attr('transform', function (d) {
                return transform(position, this.parentNode.__axis || position, d);
            });
            tickEnter.style('opacity', epsilon).attr('transform', function (d) {
                return transform(this.parentNode.__axis || position, position, d);
            });
            line = line.transition(context);
            text = text.transition(context);
        }

        tick.style('opacity', 1).attr('transform', function (d) {
            return transform(position, position, d);
        });
        tickExit.remove();
        text.text(format);

        switch (orient) {
            case top:
                {
                    path.attr('x1', range0).attr('y1', -tickSizeOuter).attr('x2', range1).attr('y2', -tickSizeOuter);
                    line.attr('x2', 0).attr('y2', -tickSizeInner);
                    text.attr('x', 0).attr('y', -spacing).attr('dy', '0em').style('text-anchor', 'middle');
                    break;
                }
            case right:
                {
                    path.attr('x1', tickSizeOuter).attr('y1', range0).attr('x2', tickSizeOuter).attr('y2', range1);
                    line.attr('y2', 0).attr('x2', tickSizeInner);
                    text.attr('y', 0).attr('x', spacing).attr('dy', '.32em').style('text-anchor', 'start');
                    break;
                }
            case bottom:
                {
                    path.attr('x1', range0).attr('y1', tickSizeOuter).attr('x2', range1).attr('y2', tickSizeOuter);
                    line.attr('x2', 0).attr('y2', tickSizeInner);
                    text.attr('x', 0).attr('y', spacing).attr('dy', '.71em').style('text-anchor', 'middle');
                    break;
                }
            case left:
                {
                    path.attr('x1', -tickSizeOuter).attr('y1', range0).attr('x2', -tickSizeOuter).attr('y2', range1);
                    line.attr('y2', 0).attr('x2', -tickSizeInner);
                    text.attr('y', 0).attr('x', -spacing).attr('dy', '.32em').style('text-anchor', 'end');
                    break;
                }
        }

        selection$$1.each(function () {
            this.__axis = position;
        });
    }

    axis.scale = function (_) {
        return arguments.length ? (scale = _, axis) : scale;
    };

    axis.ticks = function () {
        return tickArguments = slice.call(arguments), axis;
    };

    axis.tickArguments = function (_) {
        return arguments.length ? (tickArguments = _ == null ? [] : slice.call(_), axis) : tickArguments.slice();
    };

    axis.tickValues = function (_) {
        return arguments.length ? (tickValues = _ == null ? null : slice.call(_), axis) : tickValues && tickValues.slice();
    };

    axis.tickFormat = function (_) {
        return arguments.length ? (tickFormat = _, axis) : tickFormat;
    };

    axis.tickSize = function (_) {
        return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
    };

    axis.tickSizeInner = function (_) {
        return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
    };

    axis.tickSizeOuter = function (_) {
        return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
    };

    axis.tickPadding = function (_) {
        return arguments.length ? (tickPadding = +_, axis) : tickPadding;
    };

    return axis;
}

function axisTop(scale) {
    return axis(top, scale);
}

function axisRight(scale) {
    return axis(right, scale);
}

function axisBottom(scale) {
    return axis(bottom, scale);
}

function axisLeft(scale) {
    return axis(left, scale);
}

var version = "0.2.1";

exports.tweenAttr = tweenAttr;
exports.selection = canvasSelection;
exports.resolution = resolution;
exports.CanvasElement = CanvasElement;
exports.fontProperties = fontProperties;
exports.axisTop = axisTop;
exports.axisRight = axisRight;
exports.axisBottom = axisBottom;
exports.axisLeft = axisLeft;
exports.canvasVersion = version;
exports.creator = d3Selection.creator;
exports.matcher = d3Selection.matcher;
exports.mouse = d3Selection.mouse;
exports.namespace = d3Selection.namespace;
exports.namespaces = d3Selection.namespaces;
exports.select = d3Selection.select;
exports.selectAll = d3Selection.selectAll;
exports.selector = d3Selection.selector;
exports.selectorAll = d3Selection.selectorAll;
exports.touch = d3Selection.touch;
exports.touches = d3Selection.touches;
exports.window = d3Selection.window;
exports.event = d3Selection.event;

Object.defineProperty(exports, '__esModule', { value: true });

})));
