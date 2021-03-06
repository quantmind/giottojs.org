// https://github.com/quantmind/d3-canvas-transition Version 0.2.5. Copyright 2016 undefined.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-selection'), require('d3-collection'), require('d3-color'), require('d3-timer')) :
	typeof define === 'function' && define.amd ? define('d3-canvas-transition', ['exports', 'd3-selection', 'd3-collection', 'd3-color', 'd3-timer'], factory) :
	(factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Selection,d3Collection,d3Color,d3Timer) { 'use strict';

var getSize = function (value, dim) {
    if (typeof value == 'string') {
        if (value.substring(value.length - 2) === 'px') return +value.substring(0, value.length - 2);else if (value.substring(value.length - 1) === '%') return 0.01 * value.substring(0, value.length - 1) * (dim || 1);else if (value.substring(value.length - 2) === 'em') return value.substring(0, value.length - 2) * (dim || 1);
    } else if (typeof value == 'number') return value;
};

var gradients = {
    linearGradient: function linearGradient(node, opacity) {
        var ctx = node.context,
            canvas = ctx.canvas,
            x1 = getSize(node.attrs.get('x1', '0%'), canvas.width),
            x2 = getSize(node.attrs.get('x2', '100%'), canvas.width),
            y1 = getSize(node.attrs.get('y1', '0%'), canvas.height),
            y2 = getSize(node.attrs.get('y2', '0%'), canvas.height),
            col;

        var gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        node.each(function (child) {
            col = d3Color.color(child.attrs.get('stop-color'));
            if (opacity || opacity === 0) col.opacity = opacity;
            gradient.addColorStop(getSize(child.attrs.get('offset')), '' + col);
        });
        return gradient;
    },
    radialGradient: function radialGradient() {}
};

function strokeStyle(node) {
    var ctx = node.context,
        stroke = getColor(node, node.attrs.get('stroke'), node.getValue('stroke-opacity')),
        width = getSize(node.attrs.get('stroke-width'));
    if (width) ctx.lineWidth = node.factor * width;
    if (stroke) ctx.strokeStyle = stroke;
    return stroke;
}

function fillStyle(node) {
    var ctx = node.context,
        fill = getColor(node, node.attrs.get('fill'), node.getValue('fill-opacity'));
    if (fill) ctx.fillStyle = fill;
    return fill;
}

function getColor(node, value, opacity) {
    if (value && value !== 'none') {
        if (typeof value === 'string' && value.substring(0, 4) === 'url(') {
            var selector = value.substring(4, value.length - 1);
            node = selectCanvas(node.rootNode).select(selector).node();
            return node ? gradient(node, opacity) : null;
        }
        var col = d3Color.color(value);
        if (col) {
            if (opacity || opacity === 0) col.opacity = opacity;
            return '' + col;
        }
    }
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

function gradient(node, opacity) {
    var g = gradients[node.tagName];
    if (g) return g(node, opacity);
}

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

var tagDraws = d3Collection.map();

var attributes = d3Collection.map();

function touch(node, v) {
    var root = node.rootNode;
    if (!root._touches) root._touches = 0;
    root._touches += v;
    if (!root._touches || root._scheduled) return;
    root._scheduled = d3Timer.timeout(redraw(root));
}

function draw(node, t) {
    var children = node.countNodes,
        drawer = tagDraws.get(node.tagName);
    if (drawer === false) return;else if (node.attrs) {
        var ctx = node.context,
            stroke,
            fill;

        // save the current context
        ctx.save();
        //
        // apply attributes and styles
        attributes.each(function (attr) {
            return attr(node, t);
        });
        stroke = strokeStyle(node, t);
        fill = fillStyle(node, t);
        //
        if (drawer) drawer(node, stroke, fill);
        if (children) node.each(function (child) {
            return draw(child, t);
        });
        //
        // restore
        ctx.restore();
    } else if (children) {
        node.each(function (child) {
            return draw(child, t);
        });
    }
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

var namespace = 'canvas';

/**
 * A proxy for a data entry on canvas
 *
 * It partially implements the Node Api (please pull request!)
 * https://developer.mozilla.org/en-US/docs/Web/API/Node
 *
 * It allows the use the d3-select and d3-transition libraries
 * on canvas joins
 */
function CanvasElement(tagName, context) {
    var _deque,
        text = '';

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
        tagName: {
            get: function get() {
                return tagName;
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
        textContent: {
            get: function get() {
                return text;
            },
            set: function set(value) {
                text = '' + value;
                touch(this, 1);
            }
        },
        clientLeft: {
            get: function get() {
                return context.canvas.clientLeft;
            }
        },
        clientTop: {
            get: function get() {
                return context.canvas.clientTop;
            }
        },
        clientWidth: {
            get: function get() {
                return context.canvas.clientWidth;
            }
        },
        clientHeight: {
            get: function get() {
                return context.canvas.clientHeight;
            }
        },
        rootNode: {
            get: function get() {
                return this.context._rootElement;
            }
        },
        //
        // Canvas Element properties
        countNodes: {
            get: function get() {
                return _deque ? _deque._length : 0;
            }
        },
        factor: {
            get: function get() {
                return this.context._factor;
            }
        }
    });
}

CanvasElement.prototype = {
    querySelectorAll: function querySelectorAll(selector) {
        return this.countNodes ? select$1(selector, this, []) : [];
    },
    querySelector: function querySelector(selector) {
        if (this.countNodes) return select$1(selector, this);
    },
    createElementNS: function createElementNS(namespaceURI, qualifiedName) {
        return new CanvasElement(qualifiedName, this.context);
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
        touch(this, 1);
        return child;
    },
    removeChild: function removeChild(child) {
        if (child._parent === this) {
            delete child._parent;
            this.deque.remove(child);
            touch(this, 1);
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
            if (_setAttribute(this, attr, value)) touch(this, 1);
        }
    },
    removeAttribute: function removeAttribute(attr) {
        if (this.attrs) {
            this.attrs.remove(attr);
            touch(this, 1);
        }
    },
    getAttribute: function getAttribute(attr) {
        var value = this.attrs ? this.attrs.get(attr) : undefined;
        if (value === undefined && !this._parent) value = this.context.canvas[attr];
        return value;
    },
    addEventListener: function addEventListener() {
        var canvas = this.context.canvas;
        arguments[1] = wrapListener(this, arguments[1]);
        canvas.addEventListener.apply(canvas, arguments);
    },
    getBoundingClientRect: function getBoundingClientRect() {
        return this.context.canvas.getBoundingClientRect();
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
        return this.rootNode;
    }
};

function select$1(selector, node, selections) {

    var selectors = selector.split(' '),
        iterator = new NodeIterator(node),
        child = iterator.next(),
        classes,
        bits,
        tag,
        id,
        sel;

    for (var s = 0; s < selectors.length; ++s) {
        selector = selectors[s];
        if (selector === '*') {
            selector = {};
        } else {
            if (selector.indexOf('#') > -1) {
                bits = selector.split('#');
                tag = bits[0];
                id = bits[1];
            } else if (selector.indexOf('.') > -1) {
                bits = selector.split('.');
                tag = bits[0];
                classes = bits.splice(1).join(' ');
            } else tag = selector;
            selector = { tag: tag, id: id, classes: classes };
        }
        selectors[s] = selector;
    }

    while (child) {
        for (var _s = 0; _s < selectors.length; ++_s) {
            sel = selectors[_s];

            if (!sel.tag || child.tagName === sel.tag) {
                if (sel.id && child.id !== sel.id || sel.classes && child.class !== sel.classes) {
                    // nothing to do
                } else if (selections) {
                    selections.push(child);
                    break;
                } else return child;
            }
        }
        child = iterator.next();
    }

    return selections;
}

function NodeIterator(node) {
    this.node = node;
    this.current = node;
}

NodeIterator.prototype = {
    next: function next() {
        var current = this.current;
        if (!current) return null;
        if (current.firstChild) current = current.firstChild;else {
            while (current) {
                if (current.nextSibling) {
                    current = current.nextSibling;
                    break;
                }
                current = current.parentNode;
                if (current === this.node) current = null;
            }
        }
        this.current = current;
        return current;
    }
};

function wrapListener(node, listener) {

    return function () {
        listener.apply(node, arguments);
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
var defaultFactor;

d3Selection.selection.prototype.attr = selectionAttr;
d3Selection.selection.prototype.canvas = asCanvas;
d3Selection.selection.prototype.canvasResolution = canvasResolution;

function selectCanvas(context, factor) {
    var s = d3Selection.selection();
    if (!context) return s;

    if (isCanvas(context) && arguments.length === 1) return s.select(function () {
        return context;
    });

    if (typeof context === 'string') {
        context = d3Selection.select(context).node();
        if (!context) return s;
    }
    if (context.getContext) context = context.getContext('2d');

    if (!context._rootElement) {
        if (!factor) factor = defaultFactor || resolution();
        context._factor = factor;
        context._rootElement = new CanvasElement('canvas', context);
    }
    return s.select(function () {
        return context._rootElement;
    });
}

function selectionAttr(name, value) {
    if (arguments.length > 1) {
        var node = this._parents[0] || this.node();
        if (isCanvas(node) && typeof value.context === 'function') {
            value.context(node.context);
            arguments[1] = canvasAttr(value, node.factor);
        }
    }
    return originalAttr.apply(this, arguments);
}

function isCanvas(node) {
    return node instanceof CanvasElement;
}

function asCanvas(reset) {
    var s = this,
        node = s.node();

    if (node.tagName === 'CANVAS' && !isCanvas(node)) {
        s = selectCanvas(node);
        node = s.node();
    }

    if (isCanvas(node) && reset) {
        var ctx = node.context,
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
    }

    return s;
}

function canvasResolution(value) {
    if (arguments.length === 1) {
        defaultFactor = value;
        return this;
    }
    return this.factor;
}

var version = "0.2.5";

var circle = function (node, stroke, fill) {
    var attrs = node.attrs,
        ctx = node.context,
        f = node.factor;
    ctx.beginPath();
    ctx.arc(f * attrs.get('cx', 0), f * attrs.get('cy', 0), f * attrs.get('r', 0), 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
    if (fill) ctx.fill();
};

var line = function (node, stroke, fill) {
    var attrs = node.attrs,
        ctx = node.context;
    ctx.moveTo(node.factor * (attrs.get('x1') || 0), node.factor * (attrs.get('y1') || 0));
    ctx.lineTo(node.factor * attrs.get('x2'), node.factor * attrs.get('y2'));
    ctx.stroke();
    if (fill) ctx.fill();
};

var path = function (node, stroke, fill) {
    var path = node.attrs.get('d'),
        ctx = node.context;

    if (path) {
        if (typeof path.draw === 'function') {
            path.draw(node);
            ctx.stroke();
            if (fill) ctx.fill();
        }
    }
};

var rect = function (node, stroke, fill) {
    var attrs = node.attrs,
        ctx = node.context;
    ctx.rect(0, 0, node.factor * (attrs.get('width') || 0), node.factor * (attrs.get('height') || 0));
    if (stroke) ctx.stroke();
    if (fill) ctx.fill();
};

var fontProperties = ['style', 'variant', 'weight', 'size', 'family'];
var defaultBaseline = 'middle';
var textAlign = {
    start: 'start',
    middle: 'center',
    end: 'end'
};

var text = function (node) {
    var factor = node.factor,
        size = fontString(node) / factor,
        ctx = node.context;
    ctx.textAlign = textAlign[node.getValue('text-anchor')] || textAlign.middle;
    ctx.textBaseline = node.getValue('text-baseline') || defaultBaseline;
    ctx.fillText(node.textContent || '', factor * getSize(node.attrs.get('dx') || 0, size), factor * getSize(node.attrs.get('dy') || 0, size));
};

function fontString(node) {
    var bits = [],
        size = 0,
        key = void 0,
        v = void 0,
        family = void 0;
    for (var i = 0; i < fontProperties.length; ++i) {
        key = fontProperties[i];
        v = node.getValue('font-' + key);
        if (v) {
            if (key === 'size') {
                size = node.factor * v;
                v = size + 'px';
            } else if (key === 'family') {
                family = v;
            }
            bits.push(v);
        }
    }
    //
    if (size) {
        if (!family) bits.push('sans serif');
        node.context.font = bits.join(' ');
    }
    return size;
}

var opacity = function (node) {
    var o = node.attrs.get('opacity');
    if (o !== undefined) node.context.globalAlpha = +o;
    o = node.attrs.get('shape-rendering');
    if (o === 'crispEdges') node.context.imageSmoothingEnabled = false;
};

var transform = function (node) {
    var x = +(node.attrs.get('x') || 0),
        y = +(node.attrs.get('y') || 0),
        trans = node.attrs.get('transform'),
        ctx = node.context,
        sx,
        sy;

    if (typeof trans === 'string') {
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
            if (angle === angle) ctx.rotate(angle * Math.PI / 180);
        }
    } else if (trans) {
        x += trans.x;
        y += trans.y;
        sx = trans.k;
    }
    if (x || y) ctx.translate(node.factor * x, node.factor * y);
    if (sx) {
        sy = sy || sx;
        ctx.scale(sx, sy);
    }
};

var linecap = function (node) {
    var o = node.attrs.get('stroke-linecap');
    if (o) node.context.lineCap = o;
};

var linejoin = function (node) {
    var o = node.attrs.get('stroke-linejoin');
    if (o) node.context.lineJoin = o;
};

tagDraws.set('circle', circle);
tagDraws.set('line', line);
tagDraws.set('path', path);
tagDraws.set('rect', rect);
tagDraws.set('text', text);

tagDraws.set('linearGradient', false);
tagDraws.set('radialGradient', false);

attributes.set('opacity', opacity);
attributes.set('stroke-linecap', linecap);
attributes.set('stroke-linejoin', linejoin);
attributes.set('transform', transform);

exports.selectCanvas = selectCanvas;
exports.resolution = resolution;
exports.getSize = getSize;
exports.canvasVersion = version;

Object.defineProperty(exports, '__esModule', { value: true });

})));
