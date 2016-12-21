// https://github.com/quantmind/d3-canvas-transition Version 0.2.3. Copyright 2016 undefined.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-selection'), require('d3-collection'), require('d3-timer'), require('d3-color')) :
	typeof define === 'function' && define.amd ? define('d3-canvas-transition', ['exports', 'd3-selection', 'd3-collection', 'd3-timer', 'd3-color'], factory) :
	(factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Selection,d3Collection,d3Timer,d3Color) { 'use strict';

function strokeStyle(node) {
    var ctx = node.context,
        stroke = getColor(node.attrs.get('stroke')),
        width = getSize(node.attrs.get('stroke-width')),
        lineJoin = node.attrs.get('stroke-linejoin'),
        save = false;

    if (width !== undefined) {
        save = true;
        ctx.lineWidth = node.factor * width;
    }
    if (stroke) {
        save = true;
        var opacity = node.getValue('stroke-opacity');
        if (opacity || opacity === 0) stroke.opacity = opacity;
        ctx.strokeStyle = '' + stroke;
    }
    if (lineJoin) {
        save = true;
        ctx.lineJoin = lineJoin;
    }
    return save;
}

function fillStyle(node) {
    var fill = getColor(node.attrs.get('fill'));
    if (fill) {
        var opacity = node.getValue('fill-opacity');
        if (opacity || opacity === 0) fill.opacity = opacity;
        node.context.fillStyle = '' + fill;
        return fill;
    }
}

function getColor(value) {
    if (value && value !== 'none') return d3Color.color(value);
}

function getSize(value) {
    if (typeof value == 'string' && value.substring(value.length - 2) === 'px') return +value.substring(0, value.length - 2);else if (typeof value == 'number') return value;
}

function StyleNode(node) {
    this.node = node;
}

StyleNode.prototype = {
    getPropertyValue: function getPropertyValue(name) {
        var value = this.node.getValue(name);
        if (value === undefined) value = window.getComputedStyle(this.node.context.canvas).getPropertyValue(name);
        return value;
    }
};

var _setAttribute = function (node, attr, value) {
    var current = node.attrs.get(attr);
    if (current === value) return false;
    node.attrs.set(attr, value);
    return true;
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

var namespace = 'canvas';

var tagDraws = d3Collection.map();
var attributes = d3Collection.map();
/**
 * A proxy for a data entry on canvas
 *
 * It partially implements the Node Api (please pull request!)
 * https://developer.mozilla.org/en-US/docs/Web/API/Node
 *
 * It allows the use the d3-select and d3-transition libraries
 * on canvas joins
 */
function CanvasElement(context, factor, tag) {
    var _deque;
    factor = factor || 1;

    Object.defineProperties(this, {
        context: {
            get: function get() {
                return context;
            }
        },
        deque: {
            get: function get() {
                if (!_deque) _deque = deque();
                return _deque;
            }
        },
        factor: {
            get: function get() {
                return factor;
            }
        },
        tagName: {
            get: function get() {
                return tag;
            }
        },
        childNodes: {
            get: function get() {
                return _deque ? _deque.list() : [];
            }
        },
        firstChild: {
            get: function get() {
                return _deque ? _deque._head : null;
            }
        },
        lastChild: {
            get: function get() {
                return _deque ? _deque._tail : null;
            }
        },
        parentNode: {
            get: function get() {
                return this._parent;
            }
        },
        previousSibling: {
            get: function get() {
                return this._prev;
            }
        },
        nextSibling: {
            get: function get() {
                return this._next;
            }
        },
        namespaceURI: {
            get: function get() {
                return namespace;
            }
        },
        //
        // Canvas Element properties
        countNodes: {
            get: function get() {
                return _deque ? _deque._length : 0;
            }
        },
        root: {
            get: function get() {
                if (this._parent) return this._parent.root;
                return this;
            }
        }
    });
}

CanvasElement.prototype = {
    querySelectorAll: function querySelectorAll(selector) {
        if (this.countNodes) {
            if (selector === '*') return this.childNodes;
            return select$1(selector, this.deque, []);
        } else return [];
    },
    querySelector: function querySelector(selector) {
        if (this.countNodes) {
            if (selector === '*') return this.deque._head;
            return select$1(selector, this.deque);
        }
    },
    createElementNS: function createElementNS(namespaceURI, qualifiedName) {
        return new CanvasElement(this.context, this.factor, qualifiedName);
    },
    hasChildNodes: function hasChildNodes() {
        return this.countNodes > 0;
    },
    contains: function contains(child) {
        while (child) {
            if (child._parent == this) return true;
            child = child._parent;
        }
        return false;
    },
    appendChild: function appendChild(child) {
        return this.insertBefore(child);
    },
    insertBefore: function insertBefore(child, refChild) {
        if (child === this) throw Error('inserting self into children');
        if (!(child instanceof CanvasElement)) throw Error('Cannot insert a non canvas element into a canvas element');
        if (child._parent) child._parent.removeChild(child);
        this.deque.prepend(child, refChild);
        child._parent = this;
        touch(this.root, 1);
        return child;
    },
    removeChild: function removeChild(child) {
        if (child._parent === this) {
            delete child._parent;
            this.deque.remove(child);
            touch(this.root, 1);
            return child;
        }
    },
    setAttribute: function setAttribute(attr, value) {
        if (attr === 'class') {
            this.class = value;
        } else if (attr === 'id') {
            this.id = value;
        } else {
            if (!this.attrs) this.attrs = d3Collection.map();
            if (_setAttribute(this, attr, value)) touch(this.root, 1);
        }
    },
    removeAttribute: function removeAttribute(attr) {
        if (this.attrs) {
            this.attrs.remove(attr);
            touch(this.root, 1);
        }
    },
    getAttribute: function getAttribute(attr) {
        var value = this.attrs ? this.attrs.get(attr) : undefined;
        if (value === undefined && !this._parent) value = this.context.canvas[attr];
        return value;
    },


    // Canvas methods
    each: function each(f) {
        if (this.countNodes) this.deque.each(f);
    },
    getValue: function getValue(attr) {
        var value = this.getAttribute(attr);
        if (value === undefined && this._parent) return this._parent.getValue(attr);
        return value;
    },


    // Additional attribute functions
    removeProperty: function removeProperty(name) {
        this.removeAttribute(name);
    },
    setProperty: function setProperty(name, value) {
        this.setAttribute(name, value);
    },
    getProperty: function getProperty(name) {
        return this.getAttribute(name);
    },
    getPropertyValue: function getPropertyValue(name) {
        return this.getAttribute(name);
    },


    // Proxies to this object
    getComputedStyle: function getComputedStyle(node) {
        return new StyleNode(node);
    },


    get ownerDocument() {
        return this;
    },

    get style() {
        return this;
    },

    get defaultView() {
        return this;
    },

    get document() {
        return this;
    }
};

function select$1(selector, deque$$1, selections) {

    var selectors = selector.split(' '),
        bits,
        tag,
        child;

    for (var s = 0; s < selectors.length; ++s) {
        var classes, id;

        child = deque$$1._head;
        selector = selectors[s];

        if (selector.indexOf('#') > -1) {
            bits = selector.split('#');
            tag = bits[0];
            id = bits[1];
        } else if (selector.indexOf('.') > -1) {
            bits = selector.split('.');
            tag = bits[0];
            classes = bits.splice(1).join(' ');
        } else tag = selector;

        while (child) {
            if (!tag || child.tagName === tag) {
                if (id && child.id !== id || classes && child.class !== classes) {
                    // nothing to do
                } else if (selections) selections.push(child);else return child;
            }
            child = child._next;
        }
    }

    return selections;
}

function touch(node, v) {
    if (!node._touches) node._touches = 0;
    node._touches += v;
    if (!node._touches || node._scheduled) return;
    node._scheduled = d3Timer.timeout(redraw(node));
}

function draw(node, t) {
    if (node.attrs) {
        var ctx = node.context,
            drawer = tagDraws.get(node.tagName);

        ctx.save();
        attributes.each(function (attr) {
            return attr(node, t);
        });
        strokeStyle(node, t);
        fillStyle(node, t);
        ctx.save();
        if (drawer) drawer(node, t);
        //
        ctx.stroke();
        ctx.fill();
        ctx.restore();
    }
    node.each(function (child) {
        return draw(child, t);
    });
    if (node.attrs) ctx.restore();
}

function redraw(node) {

    return function () {
        var ctx = node.context;
        node._touches = 0;
        ctx.beginPath();
        ctx.closePath();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        draw(node);
        node._scheduled = false;
        touch(node, 0);
    };
}

var resolution = function (factor) {
    return factor || window.devicePixelRatio || 1;
};

var canvasAttr = function (attr, factor) {

    var orginSize = attr.size(),
        factor2 = factor * factor,
        parameters;

    attr.size(size2);

    function attrWrap() {
        parameters = arguments;
        return attrWrap;
    }

    attrWrap.size = function (_) {
        if (arguments.length === 0) return size2;
        orginSize = _;
        return attrWrap;
    };

    attrWrap.draw = function () {
        attr.apply(this, parameters);
        return attrWrap;
    };

    return attrWrap;

    function size2(d) {
        return factor2 * orginSize(d);
    }
};

var originalAttr = d3Selection.selection.prototype.attr;

d3Selection.selection.prototype.attr = selectionAttr;

var selection$1 = function (context, factor) {
    var s = d3Selection.selection();
    if (!context) return s;
    if (typeof context === 'string') {
        context = d3Selection.select(context).node();
        if (!context) return s;
    }
    if (context.getContext) context = context.getContext('2d');
    if (!factor) factor = resolution();
    s = s.select(function () {
        return new CanvasElement(context, factor, 'canvas');
    });
    s.reset = resetCanvas;
    return s;
};

function selectionAttr(name, value) {
    if (arguments.length > 1) {
        var node = this._parents[0] || this.node();
        if (node instanceof CanvasElement && typeof value.context === 'function') {
            value.context(node.context);
            arguments[1] = canvasAttr(value, node.factor);
        }
    }
    return originalAttr.apply(this, arguments);
}

function resetCanvas() {
    var node = this.node(),
        ctx = node.context,
        factor = node.factor,
        width = ctx.canvas.width,
        height = ctx.canvas.height;

    ctx.beginPath();
    ctx.closePath();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (factor > 1) {
        ctx.canvas.style.width = width + 'px';
        ctx.canvas.style.height = height + 'px';
        ctx.canvas.width = width * factor;
        ctx.canvas.height = height * factor;
        ctx.scale(factor, factor);
    }
    return this;
}

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

var version = "0.2.3";

var circle = function (node) {
    var attrs = node.attrs,
        ctx = node.context,
        f = node.factor;
    ctx.beginPath();
    ctx.arc(f * attrs.get('cx', 0), f * attrs.get('cy', 0), f * attrs.get('r', 0), 0, 2 * Math.PI);
    ctx.closePath();
};

var line = function (node) {
    var attrs = node.attrs;
    node.context.moveTo(node.factor * (attrs.get('x1') || 0), node.factor * (attrs.get('y1') || 0));
    node.context.lineTo(node.factor * attrs.get('x2'), node.factor * attrs.get('y2'));
};

var path = function (node) {
    var path = node.attrs.get('d');
    if (path) {
        if (typeof path.draw === 'function') path.draw(node);else if (path.context) path.context(node.context)();
    }
};

var rect = function (node) {
    var attrs = node.attrs;
    node.context.rect(0, 0, node.factor * (attrs.get('width') || 0), node.factor * (attrs.get('height') || 0));
};

var fontProperties = ['style', 'variant', 'weight', 'size', 'family'];
var defaultBaseline = 'middle';
var textAlign = {
    start: 'start',
    middle: 'center',
    end: 'end'
};

var text = function (node) {
    var size = fontString(node);
    node.context.textAlign = textAlign[node.getValue('text-anchor')] || textAlign.middle;
    node.context.textBaseline = node.getValue('text-baseline') || defaultBaseline;
    node.context.fillText(node.textContent || '', fontLocation(node, 'x', size), fontLocation(node, 'y', size));
};

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

var transform = function (node) {
    var x = +(node.attrs.get('x') || 0),
        y = +(node.attrs.get('y') || 0),
        trans = node.attrs.get('transform'),
        ctx = node.context;

    if (trans) {
        var index1 = trans.indexOf('translate('),
            index2,
            s,
            bits;
        if (index1 > -1) {
            s = trans.substring(index1 + 10);
            index2 = s.indexOf(')');
            bits = s.substring(0, index2).split(',');
            x += +bits[0];
            if (bits.length === 2) y += +bits[1];
        }

        index1 = trans.indexOf('rotate(');
        if (index1 > -1) {
            s = trans.substring(index1 + 7);
            var angle = +s.substring(0, s.indexOf(')'));
            if (angle === angle) {
                ctx.save();
                ctx.rotate(angle * Math.PI / 180);
            }
        }
    }
    if (x || y) {
        ctx.save();
        ctx.translate(node.factor * x, node.factor * y);
    }
};

tagDraws.set('circle', circle);
tagDraws.set('line', line);
tagDraws.set('path', path);
tagDraws.set('rect', rect);
tagDraws.set('text', text);

attributes.set('transform', transform);

exports.selectCanvas = selection$1;
exports.resolution = resolution;
exports.CanvasElement = CanvasElement;
exports.axisTop = axisTop;
exports.axisRight = axisRight;
exports.axisBottom = axisBottom;
exports.axisLeft = axisLeft;
exports.canvasVersion = version;

Object.defineProperty(exports, '__esModule', { value: true });

})));
