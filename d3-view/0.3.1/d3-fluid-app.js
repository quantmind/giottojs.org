(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-dispatch'), require('d3-view'), require('d3-ease'), require('d3-transition'), require('handlebars')) :
    typeof define === 'function' && define.amd ? define(['exports', 'd3-dispatch', 'd3-view', 'd3-ease', 'd3-transition', 'handlebars'], factory) :
    (factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3,global.d3,global.handlebars));
}(this, (function (exports,d3Dispatch,d3View,d3Ease,d3Transition,Handlebars) { 'use strict';

    Handlebars = Handlebars && Handlebars.hasOwnProperty('default') ? Handlebars['default'] : Handlebars;

    var version = "0.3.1";

    /*
    object-assign
    (c) Sindre Sorhus
    @license MIT
    */
    /* eslint-disable no-unused-vars */
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;

    function toObject(val) {
    	if (val === null || val === undefined) {
    		throw new TypeError('Object.assign cannot be called with null or undefined');
    	}

    	return Object(val);
    }

    function shouldUseNative() {
    	try {
    		if (!Object.assign) {
    			return false;
    		}

    		// Detect buggy property enumeration order in older V8 versions.

    		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
    		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
    		test1[5] = 'de';
    		if (Object.getOwnPropertyNames(test1)[0] === '5') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test2 = {};
    		for (var i = 0; i < 10; i++) {
    			test2['_' + String.fromCharCode(i)] = i;
    		}
    		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
    			return test2[n];
    		});
    		if (order2.join('') !== '0123456789') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test3 = {};
    		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
    			test3[letter] = letter;
    		});
    		if (Object.keys(Object.assign({}, test3)).join('') !==
    				'abcdefghijklmnopqrst') {
    			return false;
    		}

    		return true;
    	} catch (err) {
    		// We don't expect any of the above to throw, but better to be safe.
    		return false;
    	}
    }

    var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
    	var from;
    	var to = toObject(target);
    	var symbols;

    	for (var s = 1; s < arguments.length; s++) {
    		from = Object(arguments[s]);

    		for (var key in from) {
    			if (hasOwnProperty.call(from, key)) {
    				to[key] = from[key];
    			}
    		}

    		if (getOwnPropertySymbols) {
    			symbols = getOwnPropertySymbols(from);
    			for (var i = 0; i < symbols.length; i++) {
    				if (propIsEnumerable.call(from, symbols[i])) {
    					to[symbols[i]] = from[symbols[i]];
    				}
    			}
    		}
    	}

    	return to;
    };

    const ostring = Object.prototype.toString;
    const inBrowser = typeof window !== 'undefined' && ostring.call(window) !== '[object Object]';

    const logger = inBrowser ? window.console : console;

    function isObject (value) {
        return ostring.call(value) === '[object Object]';
    }


    function isString (value) {
        return ostring.call(value) === '[object String]';
    }


    function isArray (value) {
        return ostring.call(value) === '[object Array]';
    }

    function pop (obj, prop) {
        let value;
        if (isObject(obj)) {
            value = obj[prop];
            delete obj[prop];
            return value;
        } else if (isArray(obj)) {
            var index = +prop;
            if (index === index) return obj.splice(index, 1)[0];
            value = obj[prop];
            delete obj[prop];
            return value;
        }
    }

    // a resolved promise

    var viewActive = {

        //
        // Listen for changes to the currentUrl attribute
        mount (model) {
            var dir = this;
            model.$on(`currentUrl.${this.uid}`, () => dir.refresh(model));
            return model;
        },

        refresh (model) {
            const
                href = this.el.href,
                current = model.currentUrl,
                sel = this.sel;

            sel.classed('active', false);

            if (!href || !current || href !== current.substring(0, href.length)) return;
            if (sel.attr('data-active-strict') !== null && href !== current) return;

            var rel = current.substring(href.length),
                dvd = rel.substring(0, 1);

            if (!rel || dvd === '/' || dvd === '#')
                this.sel.classed('active', true);
        },

        //
        // Remove listener for changes to the currentUrl attribute
        destroy (model) {
            if (model)
                model.$off(`currentUrl.${this.uid}`);
        }
    };

    //
    // Make sure the currentUrl attribute is a reactive attribute
    //viewEvents.on('component-mount.currentUrl', vm => {
    //    if (!vm.parent) vm.model.currentUrl = vm.ownerDocument.location.href;
    //});

    var tpl = "<div class=\"alert-messages\">\n  <div class=\"alert\" d3-for=\"msg in alertMessages\" d3-class=\"$messageClass(msg)\" data-transition-duration=\"{{ transitionDuration }}\">\n    <span d3-html=\"msg.message\"></span>\n    <span class=\"badge badge-light\" d3-if=\"msg.count > 1\" d3-html=\"msg.count\" style=\"display: inline-block;\"></span>\n    <button type=\"button\" class=\"close\" aria-label=\"Close\" d3-on=\"$emit('alertMessageClose', msg)\">\n      <span aria-hidden=\"true\">×</span>\n    </button>\n  </div>\n</div>\n";

    const levels = {
        error: 'danger',
        warn: 'warning'
    };


    const messageKey = msg => `${msg.level}::${msg.message}`;

    const alertDirective = {

        mount (model) {
            // event handler for adding messages
            model.$alertMessageAdd = addMessage;
            model.$alertMessageClose = closeMessage;
            model.$$messageIds = new Map;
            // messages
            model.$set('alertMessages', []);
        }
    };

    // component
    const alertMessages = {

        props: {
            transitionDuration: 0
        },

        model: {
            $messageClass (message) {
                return 'alert-' + (levels[message.level] || message.level);
            }
        },

        render () {
            this.model.$connect('alertMessages');
            return tpl;
        }
    };


    var viewAlert = {

        install (vm) {
            vm.addComponent('alerts', alertMessages);
            vm.addDirective('alerts', alertDirective);
        }
    };


    function addMessage (data) {
        if (!data) return false;
        if (isString(data)) data = {message: data};
        if (data.message) {
            if (!data.level) data.level = 'info';
            var key = messageKey(data),
                msg = this.$$messageIds.get(key);
            if (msg) msg.count += 1;
            else {
                data.count = 1;
                msg = this.$new(data);
                this.$$messageIds.set(key, msg);
                this.$push('alertMessages', msg);
            }
        }
        return false;
    }


    function closeMessage (msg) {
        var messages = this.alertMessages;
        this.$$messageIds.delete(messageKey(msg));

        for (let i=0; i<messages.length; ++i) {
            if (msg === messages[i]) {
                this.alertMessages = messages.slice();
                this.alertMessages.splice(i, 1);
                break;
            }
        }
    }

    const
        COLLAPSE = 'collapse',
        COLLAPSING = 'd3-collapsing',
        COLLAPSED = 'collapsed',
        WIDTH = 'width',
        SHOW = 'show';

    const events = d3Dispatch.dispatch(
        'show-start',
        'show-end',
        'hide-start',
        'hide-end'
    );


    var viewCollapse = {
        events,

        refresh () {
            if (this.target) return;

            var self = this,
                sel = this.sel,
                tid = sel.attr('aria-controls'),
                target = tid ? this.select(`#${tid}`) : null,
                node = target ? target.node() : null;

            if (node) {
                node.d3Collapse = this;
                this.target = target;
                this.smallScreen = sel.attr('data-small-screen') || 993;
                this.container = this.getContainer(target);
                const isOpen = target.classed(SHOW);
                this.duration = 400;
                this.transitioning = false;
                sel.classed(COLLAPSED, !isOpen);
                sel.attr('aria-expanded', isOpen);
                this.on(sel, `click.${this.uid}`, (event) => self.toggle(target, event));
            }
        },

        show (target, event) {
            if (this.transitioning || target.classed(SHOW)) return;
            if (event) event.preventDefault();
            var self = this,
                sel = this.sel,
                dimension = this.getDimension(target);
            target.classed(COLLAPSE, false).classed(COLLAPSING, true).style(dimension, 0);
            sel.classed(COLLAPSED, false).attr('aria-expanded', true);
            this.transitioning = true;
            const capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1),
                scrollSize = `scroll${capitalizedDimension}`,
                node = target.node(),
                size = node[scrollSize],
                sizepx = `${size}px`;

            if (this.container) this.container.show(sizepx);
            events.call('show-start', undefined, target);

            target.transition()
                .duration(this.duration)
                .style(dimension, sizepx)
                .on("end", () => {
                    self.transitioning = false;
                    target.classed(COLLAPSING, false).classed(COLLAPSE, true).classed(SHOW, true);
                    target.style(dimension, '');
                    events.call('show-end', undefined, target);
                });
        },

        hide (target, event) {
            if (this.transitioning || !target.classed('show')) return;
            if (event) event.preventDefault();
            var self = this,
                sel = this.sel,
                dimension = this.getDimension(target);
            target.classed(COLLAPSING, true).classed(COLLAPSE, false).classed(SHOW, false);
            sel.classed(COLLAPSED, true).attr('aria-expanded', false);
            this.transitioning = true;
            target.style(dimension, '');
            if (this.container) this.container.hide();
            events.call('hide-start', undefined, target);
            target.transition()
                .duration(this.duration)
                .style(dimension, '0px')
                .on("end", () => {
                    self.transitioning = false;
                    target.classed(COLLAPSING, false).classed(COLLAPSE, true);
                    events.call('hide-end', undefined, target);
                });
        },

        toggle (target, event) {
            var sel = this.sel,
                expanded = sel.attr('aria-expanded');
            if (expanded === 'false') this.show(target, event);
            else this.hide(target, event);
        },

        getDimension (target) {
            return target.classed(WIDTH) ? 'width' : 'height';
        },

        getContainer (target) {
            const self = this,
                style = target.attr('data-container'),
                element = style ? this.select(target.node().parentNode) : null;

            if (element) {
                let small = this.getSize(target);

                this.select(window)
                    .on(`resize.${this.uid}`, () => {
                        small = self.getSize(target, small);
                    });


                return {
                    show (sizepx) {
                        element
                            .transition()
                            .duration(self.duration)
                            .style(style, sizepx)
                            .on("end", () => {
                                element.classed(SHOW, true).style(style, '');
                            });
                    },
                    hide () {
                        element
                            .transition()
                            .duration(self.duration)
                            .style(style, '0px')
                            .on("end", () => {
                                element.classed(SHOW, false);
                            });
                    }
                };
            }
        },

        getSize (target, prev) {
            const sizepx = this.select('body').style('width'),
                size = +sizepx.substring(0, sizepx.length-2),
                small = +size < this.smallScreen;
            if (prev === undefined) {
                if (small) target.classed(SHOW, false);
            } else if (small !== prev) {
                if (small) this.hide(target);
                else this.show(target);
            }
            return small;
        },

        destroy () {
            if (this.target) this.target.on(`click.${this.uid}`, null);
        }

    };

    var activity = "<polyline points=\"22 12 18 12 15 21 9 3 6 12 2 12\"></polyline>";
    var airplay = "<path d=\"M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1\"></path><polygon points=\"12 15 17 21 7 21 12 15\"></polygon>";
    var anchor = "<circle cx=\"12\" cy=\"5\" r=\"3\"></circle><line x1=\"12\" y1=\"22\" x2=\"12\" y2=\"8\"></line><path d=\"M5 12H2a10 10 0 0 0 20 0h-3\"></path>";
    var aperture = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"14.31\" y1=\"8\" x2=\"20.05\" y2=\"17.94\"></line><line x1=\"9.69\" y1=\"8\" x2=\"21.17\" y2=\"8\"></line><line x1=\"7.38\" y1=\"12\" x2=\"13.12\" y2=\"2.06\"></line><line x1=\"9.69\" y1=\"16\" x2=\"3.95\" y2=\"6.06\"></line><line x1=\"14.31\" y1=\"16\" x2=\"2.83\" y2=\"16\"></line><line x1=\"16.62\" y1=\"12\" x2=\"10.88\" y2=\"21.94\"></line>";
    var archive = "<polyline points=\"21 8 21 21 3 21 3 8\"></polyline><rect x=\"1\" y=\"3\" width=\"22\" height=\"5\"></rect><line x1=\"10\" y1=\"12\" x2=\"14\" y2=\"12\"></line>";
    var award = "<circle cx=\"12\" cy=\"8\" r=\"7\"></circle><polyline points=\"8.21 13.89 7 23 12 20 17 23 15.79 13.88\"></polyline>";
    var battery = "<rect x=\"1\" y=\"6\" width=\"18\" height=\"12\" rx=\"2\" ry=\"2\"></rect><line x1=\"23\" y1=\"13\" x2=\"23\" y2=\"11\"></line>";
    var bell = "<path d=\"M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0\"></path>";
    var bluetooth = "<polyline points=\"6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5\"></polyline>";
    var bold = "<path d=\"M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z\"></path><path d=\"M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z\"></path>";
    var book = "<path d=\"M4 19.5A2.5 2.5 0 0 1 6.5 17H20\"></path><path d=\"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z\"></path>";
    var bookmark = "<path d=\"M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z\"></path>";
    var box = "<path d=\"M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z\"></path><polyline points=\"2.32 6.16 12 11 21.68 6.16\"></polyline><line x1=\"12\" y1=\"22.76\" x2=\"12\" y2=\"11\"></line>";
    var briefcase = "<rect x=\"2\" y=\"7\" width=\"20\" height=\"14\" rx=\"2\" ry=\"2\"></rect><path d=\"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16\"></path>";
    var calendar = "<rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><line x1=\"16\" y1=\"2\" x2=\"16\" y2=\"6\"></line><line x1=\"8\" y1=\"2\" x2=\"8\" y2=\"6\"></line><line x1=\"3\" y1=\"10\" x2=\"21\" y2=\"10\"></line>";
    var camera = "<path d=\"M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z\"></path><circle cx=\"12\" cy=\"13\" r=\"4\"></circle>";
    var cast = "<path d=\"M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6\"></path><line x1=\"2\" y1=\"20\" x2=\"2\" y2=\"20\"></line>";
    var check = "<polyline points=\"20 6 9 17 4 12\"></polyline>";
    var chrome = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><circle cx=\"12\" cy=\"12\" r=\"4\"></circle><line x1=\"21.17\" y1=\"8\" x2=\"12\" y2=\"8\"></line><line x1=\"3.95\" y1=\"6.06\" x2=\"8.54\" y2=\"14\"></line><line x1=\"10.88\" y1=\"21.94\" x2=\"15.46\" y2=\"14\"></line>";
    var circle = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle>";
    var clipboard = "<path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"></path><rect x=\"8\" y=\"2\" width=\"8\" height=\"4\" rx=\"1\" ry=\"1\"></rect>";
    var clock = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polyline points=\"12 6 12 12 16 14\"></polyline>";
    var cloud = "<path d=\"M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z\"></path>";
    var code = "<polyline points=\"16 18 22 12 16 6\"></polyline><polyline points=\"8 6 2 12 8 18\"></polyline>";
    var codepen = "<polygon points=\"12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2\"></polygon><line x1=\"12\" y1=\"22\" x2=\"12\" y2=\"15.5\"></line><polyline points=\"22 8.5 12 15.5 2 8.5\"></polyline><polyline points=\"2 15.5 12 8.5 22 15.5\"></polyline><line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"8.5\"></line>";
    var command = "<path d=\"M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z\"></path>";
    var compass = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polygon points=\"16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76\"></polygon>";
    var copy = "<rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path>";
    var cpu = "<rect x=\"4\" y=\"4\" width=\"16\" height=\"16\" rx=\"2\" ry=\"2\"></rect><rect x=\"9\" y=\"9\" width=\"6\" height=\"6\"></rect><line x1=\"9\" y1=\"1\" x2=\"9\" y2=\"4\"></line><line x1=\"15\" y1=\"1\" x2=\"15\" y2=\"4\"></line><line x1=\"9\" y1=\"20\" x2=\"9\" y2=\"23\"></line><line x1=\"15\" y1=\"20\" x2=\"15\" y2=\"23\"></line><line x1=\"20\" y1=\"9\" x2=\"23\" y2=\"9\"></line><line x1=\"20\" y1=\"14\" x2=\"23\" y2=\"14\"></line><line x1=\"1\" y1=\"9\" x2=\"4\" y2=\"9\"></line><line x1=\"1\" y1=\"14\" x2=\"4\" y2=\"14\"></line>";
    var crop = "<path d=\"M6.13 1L6 16a2 2 0 0 0 2 2h15\"></path><path d=\"M1 6.13L16 6a2 2 0 0 1 2 2v15\"></path>";
    var crosshair = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"22\" y1=\"12\" x2=\"18\" y2=\"12\"></line><line x1=\"6\" y1=\"12\" x2=\"2\" y2=\"12\"></line><line x1=\"12\" y1=\"6\" x2=\"12\" y2=\"2\"></line><line x1=\"12\" y1=\"22\" x2=\"12\" y2=\"18\"></line>";
    var database = "<ellipse cx=\"12\" cy=\"5\" rx=\"9\" ry=\"3\"></ellipse><path d=\"M21 12c0 1.66-4 3-9 3s-9-1.34-9-3\"></path><path d=\"M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5\"></path>";
    var disc = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><circle cx=\"12\" cy=\"12\" r=\"3\"></circle>";
    var download = "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path><polyline points=\"7 10 12 15 17 10\"></polyline><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"></line>";
    var droplet = "<path d=\"M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z\"></path>";
    var edit = "<path d=\"M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34\"></path><polygon points=\"18 2 22 6 12 16 8 16 8 12 18 2\"></polygon>";
    var eye = "<path d=\"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z\"></path><circle cx=\"12\" cy=\"12\" r=\"3\"></circle>";
    var facebook = "<path d=\"M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z\"></path>";
    var feather = "<path d=\"M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z\"></path><line x1=\"16\" y1=\"8\" x2=\"2\" y2=\"22\"></line><line x1=\"17\" y1=\"15\" x2=\"9\" y2=\"15\"></line>";
    var file = "<path d=\"M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z\"></path><polyline points=\"13 2 13 9 20 9\"></polyline>";
    var film = "<rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"2.18\" ry=\"2.18\"></rect><line x1=\"7\" y1=\"2\" x2=\"7\" y2=\"22\"></line><line x1=\"17\" y1=\"2\" x2=\"17\" y2=\"22\"></line><line x1=\"2\" y1=\"12\" x2=\"22\" y2=\"12\"></line><line x1=\"2\" y1=\"7\" x2=\"7\" y2=\"7\"></line><line x1=\"2\" y1=\"17\" x2=\"7\" y2=\"17\"></line><line x1=\"17\" y1=\"17\" x2=\"22\" y2=\"17\"></line><line x1=\"17\" y1=\"7\" x2=\"22\" y2=\"7\"></line>";
    var filter = "<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\"></polygon>";
    var flag = "<path d=\"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z\"></path><line x1=\"4\" y1=\"22\" x2=\"4\" y2=\"15\"></line>";
    var folder = "<path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"></path>";
    var gift = "<polyline points=\"20 12 20 22 4 22 4 12\"></polyline><rect x=\"2\" y=\"7\" width=\"20\" height=\"5\"></rect><line x1=\"12\" y1=\"22\" x2=\"12\" y2=\"7\"></line><path d=\"M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z\"></path><path d=\"M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z\"></path>";
    var github = "<path d=\"M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22\"></path>";
    var gitlab = "<path d=\"M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z\"></path>";
    var globe = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"2\" y1=\"12\" x2=\"22\" y2=\"12\"></line><path d=\"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\"></path>";
    var grid = "<rect x=\"3\" y=\"3\" width=\"7\" height=\"7\"></rect><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\"></rect><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\"></rect><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\"></rect>";
    var hash = "<line x1=\"4\" y1=\"9\" x2=\"20\" y2=\"9\"></line><line x1=\"4\" y1=\"15\" x2=\"20\" y2=\"15\"></line><line x1=\"10\" y1=\"3\" x2=\"8\" y2=\"21\"></line><line x1=\"16\" y1=\"3\" x2=\"14\" y2=\"21\"></line>";
    var headphones = "<path d=\"M3 18v-6a9 9 0 0 1 18 0v6\"></path><path d=\"M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z\"></path>";
    var heart = "<path d=\"M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z\"></path>";
    var home = "<path d=\"M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"></path><polyline points=\"9 22 9 12 15 12 15 22\"></polyline>";
    var image = "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><circle cx=\"8.5\" cy=\"8.5\" r=\"1.5\"></circle><polyline points=\"21 15 16 10 5 21\"></polyline>";
    var inbox = "<polyline points=\"22 12 16 12 14 15 10 15 8 12 2 12\"></polyline><path d=\"M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z\"></path>";
    var info = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"12\"></line><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"8\"></line>";
    var instagram = "<rect x=\"2\" y=\"2\" width=\"20\" height=\"20\" rx=\"5\" ry=\"5\"></rect><path d=\"M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z\"></path><line x1=\"17.5\" y1=\"6.5\" x2=\"17.5\" y2=\"6.5\"></line>";
    var italic = "<line x1=\"19\" y1=\"4\" x2=\"10\" y2=\"4\"></line><line x1=\"14\" y1=\"20\" x2=\"5\" y2=\"20\"></line><line x1=\"15\" y1=\"4\" x2=\"9\" y2=\"20\"></line>";
    var layers = "<polygon points=\"12 2 2 7 12 12 22 7 12 2\"></polygon><polyline points=\"2 17 12 22 22 17\"></polyline><polyline points=\"2 12 12 17 22 12\"></polyline>";
    var layout = "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><line x1=\"3\" y1=\"9\" x2=\"21\" y2=\"9\"></line><line x1=\"9\" y1=\"21\" x2=\"9\" y2=\"9\"></line>";
    var link = "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"></path><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"></path>";
    var linkedin = "<path d=\"M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z\"></path><rect x=\"2\" y=\"9\" width=\"4\" height=\"12\"></rect><circle cx=\"4\" cy=\"4\" r=\"2\"></circle>";
    var list = "<line x1=\"8\" y1=\"6\" x2=\"21\" y2=\"6\"></line><line x1=\"8\" y1=\"12\" x2=\"21\" y2=\"12\"></line><line x1=\"8\" y1=\"18\" x2=\"21\" y2=\"18\"></line><line x1=\"3\" y1=\"6\" x2=\"3\" y2=\"6\"></line><line x1=\"3\" y1=\"12\" x2=\"3\" y2=\"12\"></line><line x1=\"3\" y1=\"18\" x2=\"3\" y2=\"18\"></line>";
    var loader = "<line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"6\"></line><line x1=\"12\" y1=\"18\" x2=\"12\" y2=\"22\"></line><line x1=\"4.93\" y1=\"4.93\" x2=\"7.76\" y2=\"7.76\"></line><line x1=\"16.24\" y1=\"16.24\" x2=\"19.07\" y2=\"19.07\"></line><line x1=\"2\" y1=\"12\" x2=\"6\" y2=\"12\"></line><line x1=\"18\" y1=\"12\" x2=\"22\" y2=\"12\"></line><line x1=\"4.93\" y1=\"19.07\" x2=\"7.76\" y2=\"16.24\"></line><line x1=\"16.24\" y1=\"7.76\" x2=\"19.07\" y2=\"4.93\"></line>";
    var lock = "<rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\" ry=\"2\"></rect><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"></path>";
    var mail = "<path d=\"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z\"></path><polyline points=\"22,6 12,13 2,6\"></polyline>";
    var map$1 = "<polygon points=\"1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6\"></polygon><line x1=\"8\" y1=\"2\" x2=\"8\" y2=\"18\"></line><line x1=\"16\" y1=\"6\" x2=\"16\" y2=\"22\"></line>";
    var maximize = "<path d=\"M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3\"></path>";
    var menu = "<line x1=\"3\" y1=\"12\" x2=\"21\" y2=\"12\"></line><line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"></line><line x1=\"3\" y1=\"18\" x2=\"21\" y2=\"18\"></line>";
    var mic = "<path d=\"M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z\"></path><path d=\"M19 10v2a7 7 0 0 1-14 0v-2\"></path><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"23\"></line><line x1=\"8\" y1=\"23\" x2=\"16\" y2=\"23\"></line>";
    var minimize = "<path d=\"M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3\"></path>";
    var minus = "<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"></line>";
    var monitor = "<rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\" ry=\"2\"></rect><line x1=\"8\" y1=\"21\" x2=\"16\" y2=\"21\"></line><line x1=\"12\" y1=\"17\" x2=\"12\" y2=\"21\"></line>";
    var moon = "<path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"></path>";
    var move = "<polyline points=\"5 9 2 12 5 15\"></polyline><polyline points=\"9 5 12 2 15 5\"></polyline><polyline points=\"15 19 12 22 9 19\"></polyline><polyline points=\"19 9 22 12 19 15\"></polyline><line x1=\"2\" y1=\"12\" x2=\"22\" y2=\"12\"></line><line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"22\"></line>";
    var music = "<path d=\"M9 17H5a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm12-2h-4a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z\"></path><polyline points=\"9 17 9 5 21 3 21 15\"></polyline>";
    var navigation = "<polygon points=\"3 11 22 2 13 21 11 13 3 11\"></polygon>";
    var octagon = "<polygon points=\"7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2\"></polygon>";
    var paperclip = "<path d=\"M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48\"></path>";
    var pause = "<rect x=\"6\" y=\"4\" width=\"4\" height=\"16\"></rect><rect x=\"14\" y=\"4\" width=\"4\" height=\"16\"></rect>";
    var percent = "<line x1=\"19\" y1=\"5\" x2=\"5\" y2=\"19\"></line><circle cx=\"6.5\" cy=\"6.5\" r=\"2.5\"></circle><circle cx=\"17.5\" cy=\"17.5\" r=\"2.5\"></circle>";
    var phone = "<path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"></path>";
    var play = "<polygon points=\"5 3 19 12 5 21 5 3\"></polygon>";
    var plus = "<line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"></line>";
    var pocket = "<path d=\"M4 3h16a2 2 0 0 1 2 2v6a10 10 0 0 1-10 10A10 10 0 0 1 2 11V5a2 2 0 0 1 2-2z\"></path><polyline points=\"8 10 12 14 16 10\"></polyline>";
    var power = "<path d=\"M18.36 6.64a9 9 0 1 1-12.73 0\"></path><line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"12\"></line>";
    var printer = "<polyline points=\"6 9 6 2 18 2 18 9\"></polyline><path d=\"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\"></path><rect x=\"6\" y=\"14\" width=\"12\" height=\"8\"></rect>";
    var radio = "<circle cx=\"12\" cy=\"12\" r=\"2\"></circle><path d=\"M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14\"></path>";
    var repeat = "<polyline points=\"17 1 21 5 17 9\"></polyline><path d=\"M3 11V9a4 4 0 0 1 4-4h14\"></path><polyline points=\"7 23 3 19 7 15\"></polyline><path d=\"M21 13v2a4 4 0 0 1-4 4H3\"></path>";
    var rewind = "<polygon points=\"11 19 2 12 11 5 11 19\"></polygon><polygon points=\"22 19 13 12 22 5 22 19\"></polygon>";
    var rss = "<path d=\"M4 11a9 9 0 0 1 9 9\"></path><path d=\"M4 4a16 16 0 0 1 16 16\"></path><circle cx=\"5\" cy=\"19\" r=\"1\"></circle>";
    var save = "<path d=\"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z\"></path><polyline points=\"17 21 17 13 7 13 7 21\"></polyline><polyline points=\"7 3 7 8 15 8\"></polyline>";
    var scissors = "<circle cx=\"6\" cy=\"6\" r=\"3\"></circle><circle cx=\"6\" cy=\"18\" r=\"3\"></circle><line x1=\"20\" y1=\"4\" x2=\"8.12\" y2=\"15.88\"></line><line x1=\"14.47\" y1=\"14.48\" x2=\"20\" y2=\"20\"></line><line x1=\"8.12\" y1=\"8.12\" x2=\"12\" y2=\"12\"></line>";
    var search = "<circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line>";
    var send = "<line x1=\"22\" y1=\"2\" x2=\"11\" y2=\"13\"></line><polygon points=\"22 2 15 22 11 13 2 9 22 2\"></polygon>";
    var server = "<rect x=\"2\" y=\"2\" width=\"20\" height=\"8\" rx=\"2\" ry=\"2\"></rect><rect x=\"2\" y=\"14\" width=\"20\" height=\"8\" rx=\"2\" ry=\"2\"></rect><line x1=\"6\" y1=\"6\" x2=\"6\" y2=\"6\"></line><line x1=\"6\" y1=\"18\" x2=\"6\" y2=\"18\"></line>";
    var settings = "<circle cx=\"12\" cy=\"12\" r=\"3\"></circle><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z\"></path>";
    var share = "<path d=\"M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8\"></path><polyline points=\"16 6 12 2 8 6\"></polyline><line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"15\"></line>";
    var shield = "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z\"></path>";
    var shuffle = "<polyline points=\"16 3 21 3 21 8\"></polyline><line x1=\"4\" y1=\"20\" x2=\"21\" y2=\"3\"></line><polyline points=\"21 16 21 21 16 21\"></polyline><line x1=\"15\" y1=\"15\" x2=\"21\" y2=\"21\"></line><line x1=\"4\" y1=\"4\" x2=\"9\" y2=\"9\"></line>";
    var sidebar = "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><line x1=\"9\" y1=\"3\" x2=\"9\" y2=\"21\"></line>";
    var slack = "<path d=\"M22.08 9C19.81 1.41 16.54-.35 9 1.92S-.35 7.46 1.92 15 7.46 24.35 15 22.08 24.35 16.54 22.08 9z\"></path><line x1=\"12.57\" y1=\"5.99\" x2=\"16.15\" y2=\"16.39\"></line><line x1=\"7.85\" y1=\"7.61\" x2=\"11.43\" y2=\"18.01\"></line><line x1=\"16.39\" y1=\"7.85\" x2=\"5.99\" y2=\"11.43\"></line><line x1=\"18.01\" y1=\"12.57\" x2=\"7.61\" y2=\"16.15\"></line>";
    var slash = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"4.93\" y1=\"4.93\" x2=\"19.07\" y2=\"19.07\"></line>";
    var sliders = "<line x1=\"4\" y1=\"21\" x2=\"4\" y2=\"14\"></line><line x1=\"4\" y1=\"10\" x2=\"4\" y2=\"3\"></line><line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"12\"></line><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"3\"></line><line x1=\"20\" y1=\"21\" x2=\"20\" y2=\"16\"></line><line x1=\"20\" y1=\"12\" x2=\"20\" y2=\"3\"></line><line x1=\"1\" y1=\"14\" x2=\"7\" y2=\"14\"></line><line x1=\"9\" y1=\"8\" x2=\"15\" y2=\"8\"></line><line x1=\"17\" y1=\"16\" x2=\"23\" y2=\"16\"></line>";
    var smartphone = "<rect x=\"5\" y=\"2\" width=\"14\" height=\"20\" rx=\"2\" ry=\"2\"></rect><line x1=\"12\" y1=\"18\" x2=\"12\" y2=\"18\"></line>";
    var speaker = "<rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\" ry=\"2\"></rect><circle cx=\"12\" cy=\"14\" r=\"4\"></circle><line x1=\"12\" y1=\"6\" x2=\"12\" y2=\"6\"></line>";
    var square = "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect>";
    var star = "<polygon points=\"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2\"></polygon>";
    var sun = "<circle cx=\"12\" cy=\"12\" r=\"5\"></circle><line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"3\"></line><line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"23\"></line><line x1=\"4.22\" y1=\"4.22\" x2=\"5.64\" y2=\"5.64\"></line><line x1=\"18.36\" y1=\"18.36\" x2=\"19.78\" y2=\"19.78\"></line><line x1=\"1\" y1=\"12\" x2=\"3\" y2=\"12\"></line><line x1=\"21\" y1=\"12\" x2=\"23\" y2=\"12\"></line><line x1=\"4.22\" y1=\"19.78\" x2=\"5.64\" y2=\"18.36\"></line><line x1=\"18.36\" y1=\"5.64\" x2=\"19.78\" y2=\"4.22\"></line>";
    var sunrise = "<path d=\"M17 18a5 5 0 0 0-10 0\"></path><line x1=\"12\" y1=\"2\" x2=\"12\" y2=\"9\"></line><line x1=\"4.22\" y1=\"10.22\" x2=\"5.64\" y2=\"11.64\"></line><line x1=\"1\" y1=\"18\" x2=\"3\" y2=\"18\"></line><line x1=\"21\" y1=\"18\" x2=\"23\" y2=\"18\"></line><line x1=\"18.36\" y1=\"11.64\" x2=\"19.78\" y2=\"10.22\"></line><line x1=\"23\" y1=\"22\" x2=\"1\" y2=\"22\"></line><polyline points=\"8 6 12 2 16 6\"></polyline>";
    var sunset = "<path d=\"M17 18a5 5 0 0 0-10 0\"></path><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"2\"></line><line x1=\"4.22\" y1=\"10.22\" x2=\"5.64\" y2=\"11.64\"></line><line x1=\"1\" y1=\"18\" x2=\"3\" y2=\"18\"></line><line x1=\"21\" y1=\"18\" x2=\"23\" y2=\"18\"></line><line x1=\"18.36\" y1=\"11.64\" x2=\"19.78\" y2=\"10.22\"></line><line x1=\"23\" y1=\"22\" x2=\"1\" y2=\"22\"></line><polyline points=\"16 5 12 9 8 5\"></polyline>";
    var tablet = "<rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\" ry=\"2\" transform=\"rotate(180 12 12)\"></rect><line x1=\"12\" y1=\"18\" x2=\"12\" y2=\"18\"></line>";
    var tag = "<path d=\"M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z\"></path><line x1=\"7\" y1=\"7\" x2=\"7\" y2=\"7\"></line>";
    var target = "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><circle cx=\"12\" cy=\"12\" r=\"6\"></circle><circle cx=\"12\" cy=\"12\" r=\"2\"></circle>";
    var terminal = "<polyline points=\"4 17 10 11 4 5\"></polyline><line x1=\"12\" y1=\"19\" x2=\"20\" y2=\"19\"></line>";
    var thermometer = "<path d=\"M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z\"></path>";
    var trash = "<polyline points=\"3 6 5 6 21 6\"></polyline><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path>";
    var triangle = "<path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"></path>";
    var truck = "<rect x=\"1\" y=\"3\" width=\"15\" height=\"13\"></rect><polygon points=\"16 8 20 8 23 11 23 16 16 16 16 8\"></polygon><circle cx=\"5.5\" cy=\"18.5\" r=\"2.5\"></circle><circle cx=\"18.5\" cy=\"18.5\" r=\"2.5\"></circle>";
    var tv = "<rect x=\"2\" y=\"7\" width=\"20\" height=\"15\" rx=\"2\" ry=\"2\"></rect><polyline points=\"17 2 12 7 7 2\"></polyline>";
    var twitter = "<path d=\"M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z\"></path>";
    var type = "<polyline points=\"4 7 4 4 20 4 20 7\"></polyline><line x1=\"9\" y1=\"20\" x2=\"15\" y2=\"20\"></line><line x1=\"12\" y1=\"4\" x2=\"12\" y2=\"20\"></line>";
    var umbrella = "<path d=\"M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7\"></path>";
    var underline = "<path d=\"M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3\"></path><line x1=\"4\" y1=\"21\" x2=\"20\" y2=\"21\"></line>";
    var unlock = "<rect x=\"3\" y=\"11\" width=\"18\" height=\"11\" rx=\"2\" ry=\"2\"></rect><path d=\"M7 11V7a5 5 0 0 1 9.9-1\"></path>";
    var upload = "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path><polyline points=\"17 8 12 3 7 8\"></polyline><line x1=\"12\" y1=\"3\" x2=\"12\" y2=\"15\"></line>";
    var user = "<path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"></path><circle cx=\"12\" cy=\"7\" r=\"4\"></circle>";
    var users = "<path d=\"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"></path><circle cx=\"9\" cy=\"7\" r=\"4\"></circle><path d=\"M23 21v-2a4 4 0 0 0-3-3.87\"></path><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"></path>";
    var video = "<polygon points=\"23 7 16 12 23 17 23 7\"></polygon><rect x=\"1\" y=\"5\" width=\"15\" height=\"14\" rx=\"2\" ry=\"2\"></rect>";
    var voicemail = "<circle cx=\"5.5\" cy=\"11.5\" r=\"4.5\"></circle><circle cx=\"18.5\" cy=\"11.5\" r=\"4.5\"></circle><line x1=\"5.5\" y1=\"16\" x2=\"18.5\" y2=\"16\"></line>";
    var volume = "<polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"></polygon>";
    var watch = "<circle cx=\"12\" cy=\"12\" r=\"7\"></circle><polyline points=\"12 9 12 12 13.5 13.5\"></polyline><path d=\"M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83\"></path>";
    var wifi = "<path d=\"M5 12.55a11 11 0 0 1 14.08 0\"></path><path d=\"M1.42 9a16 16 0 0 1 21.16 0\"></path><path d=\"M8.53 16.11a6 6 0 0 1 6.95 0\"></path><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"20\"></line>";
    var wind = "<path d=\"M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2\"></path>";
    var x = "<line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"></line><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"></line>";
    var youtube = "<path d=\"M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z\"></path><polygon points=\"9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02\"></polygon>";
    var zap = "<polygon points=\"13 2 3 14 12 14 11 22 21 10 12 10 13 2\"></polygon>";
    var feather$1 = {
    	activity: activity,
    	airplay: airplay,
    	anchor: anchor,
    	aperture: aperture,
    	archive: archive,
    	award: award,
    	battery: battery,
    	bell: bell,
    	bluetooth: bluetooth,
    	bold: bold,
    	book: book,
    	bookmark: bookmark,
    	box: box,
    	briefcase: briefcase,
    	calendar: calendar,
    	camera: camera,
    	cast: cast,
    	check: check,
    	chrome: chrome,
    	circle: circle,
    	clipboard: clipboard,
    	clock: clock,
    	cloud: cloud,
    	code: code,
    	codepen: codepen,
    	command: command,
    	compass: compass,
    	copy: copy,
    	cpu: cpu,
    	crop: crop,
    	crosshair: crosshair,
    	database: database,
    	disc: disc,
    	download: download,
    	droplet: droplet,
    	edit: edit,
    	eye: eye,
    	facebook: facebook,
    	feather: feather,
    	file: file,
    	film: film,
    	filter: filter,
    	flag: flag,
    	folder: folder,
    	gift: gift,
    	github: github,
    	gitlab: gitlab,
    	globe: globe,
    	grid: grid,
    	hash: hash,
    	headphones: headphones,
    	heart: heart,
    	home: home,
    	image: image,
    	inbox: inbox,
    	info: info,
    	instagram: instagram,
    	italic: italic,
    	layers: layers,
    	layout: layout,
    	link: link,
    	linkedin: linkedin,
    	list: list,
    	loader: loader,
    	lock: lock,
    	mail: mail,
    	map: map$1,
    	maximize: maximize,
    	menu: menu,
    	mic: mic,
    	minimize: minimize,
    	minus: minus,
    	monitor: monitor,
    	moon: moon,
    	move: move,
    	music: music,
    	navigation: navigation,
    	octagon: octagon,
    	paperclip: paperclip,
    	pause: pause,
    	percent: percent,
    	phone: phone,
    	play: play,
    	plus: plus,
    	pocket: pocket,
    	power: power,
    	printer: printer,
    	radio: radio,
    	repeat: repeat,
    	rewind: rewind,
    	rss: rss,
    	save: save,
    	scissors: scissors,
    	search: search,
    	send: send,
    	server: server,
    	settings: settings,
    	share: share,
    	shield: shield,
    	shuffle: shuffle,
    	sidebar: sidebar,
    	slack: slack,
    	slash: slash,
    	sliders: sliders,
    	smartphone: smartphone,
    	speaker: speaker,
    	square: square,
    	star: star,
    	sun: sun,
    	sunrise: sunrise,
    	sunset: sunset,
    	tablet: tablet,
    	tag: tag,
    	target: target,
    	terminal: terminal,
    	thermometer: thermometer,
    	trash: trash,
    	triangle: triangle,
    	truck: truck,
    	tv: tv,
    	twitter: twitter,
    	type: type,
    	umbrella: umbrella,
    	underline: underline,
    	unlock: unlock,
    	upload: upload,
    	user: user,
    	users: users,
    	video: video,
    	voicemail: voicemail,
    	volume: volume,
    	watch: watch,
    	wifi: wifi,
    	wind: wind,
    	x: x,
    	youtube: youtube,
    	zap: zap,
    	"alert-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"></line><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"16\"></line>",
    	"alert-octagon": "<polygon points=\"7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2\"></polygon><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"></line><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"16\"></line>",
    	"alert-triangle": "<path d=\"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z\"></path><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"></line><line x1=\"12\" y1=\"17\" x2=\"12\" y2=\"17\"></line>",
    	"align-center": "<line x1=\"18\" y1=\"10\" x2=\"6\" y2=\"10\"></line><line x1=\"21\" y1=\"6\" x2=\"3\" y2=\"6\"></line><line x1=\"21\" y1=\"14\" x2=\"3\" y2=\"14\"></line><line x1=\"18\" y1=\"18\" x2=\"6\" y2=\"18\"></line>",
    	"align-justify": "<line x1=\"21\" y1=\"10\" x2=\"3\" y2=\"10\"></line><line x1=\"21\" y1=\"6\" x2=\"3\" y2=\"6\"></line><line x1=\"21\" y1=\"14\" x2=\"3\" y2=\"14\"></line><line x1=\"21\" y1=\"18\" x2=\"3\" y2=\"18\"></line>",
    	"align-left": "<line x1=\"17\" y1=\"10\" x2=\"3\" y2=\"10\"></line><line x1=\"21\" y1=\"6\" x2=\"3\" y2=\"6\"></line><line x1=\"21\" y1=\"14\" x2=\"3\" y2=\"14\"></line><line x1=\"17\" y1=\"18\" x2=\"3\" y2=\"18\"></line>",
    	"align-right": "<line x1=\"21\" y1=\"10\" x2=\"7\" y2=\"10\"></line><line x1=\"21\" y1=\"6\" x2=\"3\" y2=\"6\"></line><line x1=\"21\" y1=\"14\" x2=\"3\" y2=\"14\"></line><line x1=\"21\" y1=\"18\" x2=\"7\" y2=\"18\"></line>",
    	"arrow-down-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polyline points=\"8 12 12 16 16 12\"></polyline><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"16\"></line>",
    	"arrow-down-left": "<line x1=\"17\" y1=\"7\" x2=\"7\" y2=\"17\"></line><polyline points=\"17 17 7 17 7 7\"></polyline>",
    	"arrow-down-right": "<line x1=\"7\" y1=\"7\" x2=\"17\" y2=\"17\"></line><polyline points=\"17 7 17 17 7 17\"></polyline>",
    	"arrow-down": "<line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"></line><polyline points=\"19 12 12 19 5 12\"></polyline>",
    	"arrow-left-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polyline points=\"12 8 8 12 12 16\"></polyline><line x1=\"16\" y1=\"12\" x2=\"8\" y2=\"12\"></line>",
    	"arrow-left": "<line x1=\"19\" y1=\"12\" x2=\"5\" y2=\"12\"></line><polyline points=\"12 19 5 12 12 5\"></polyline>",
    	"arrow-right-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polyline points=\"12 16 16 12 12 8\"></polyline><line x1=\"8\" y1=\"12\" x2=\"16\" y2=\"12\"></line>",
    	"arrow-right": "<line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"></line><polyline points=\"12 5 19 12 12 19\"></polyline>",
    	"arrow-up-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polyline points=\"16 12 12 8 8 12\"></polyline><line x1=\"12\" y1=\"16\" x2=\"12\" y2=\"8\"></line>",
    	"arrow-up-left": "<line x1=\"17\" y1=\"17\" x2=\"7\" y2=\"7\"></line><polyline points=\"7 17 7 7 17 7\"></polyline>",
    	"arrow-up-right": "<line x1=\"7\" y1=\"17\" x2=\"17\" y2=\"7\"></line><polyline points=\"7 7 17 7 17 17\"></polyline>",
    	"arrow-up": "<line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"5\"></line><polyline points=\"5 12 12 5 19 12\"></polyline>",
    	"at-sign": "<circle cx=\"12\" cy=\"12\" r=\"4\"></circle><path d=\"M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94\"></path>",
    	"bar-chart-2": "<line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"10\"></line><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"4\"></line><line x1=\"6\" y1=\"20\" x2=\"6\" y2=\"14\"></line>",
    	"bar-chart": "<line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"10\"></line><line x1=\"18\" y1=\"20\" x2=\"18\" y2=\"4\"></line><line x1=\"6\" y1=\"20\" x2=\"6\" y2=\"16\"></line>",
    	"battery-charging": "<path d=\"M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19\"></path><line x1=\"23\" y1=\"13\" x2=\"23\" y2=\"11\"></line><polyline points=\"11 6 7 12 13 12 9 18\"></polyline>",
    	"bell-off": "<path d=\"M8.56 2.9A7 7 0 0 1 19 9v4m-2 4H2a3 3 0 0 0 3-3V9a7 7 0 0 1 .78-3.22M13.73 21a2 2 0 0 1-3.46 0\"></path><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"></line>",
    	"book-open": "<path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\"></path><path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"></path>",
    	"camera-off": "<line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"></line><path d=\"M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56\"></path>",
    	"check-circle": "<path d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\"></path><polyline points=\"22 4 12 14.01 9 11.01\"></polyline>",
    	"check-square": "<polyline points=\"9 11 12 14 22 4\"></polyline><path d=\"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11\"></path>",
    	"chevron-down": "<polyline points=\"6 9 12 15 18 9\"></polyline>",
    	"chevron-left": "<polyline points=\"15 18 9 12 15 6\"></polyline>",
    	"chevron-right": "<polyline points=\"9 18 15 12 9 6\"></polyline>",
    	"chevron-up": "<polyline points=\"18 15 12 9 6 15\"></polyline>",
    	"chevrons-down": "<polyline points=\"7 13 12 18 17 13\"></polyline><polyline points=\"7 6 12 11 17 6\"></polyline>",
    	"chevrons-left": "<polyline points=\"11 17 6 12 11 7\"></polyline><polyline points=\"18 17 13 12 18 7\"></polyline>",
    	"chevrons-right": "<polyline points=\"13 17 18 12 13 7\"></polyline><polyline points=\"6 17 11 12 6 7\"></polyline>",
    	"chevrons-up": "<polyline points=\"17 11 12 6 7 11\"></polyline><polyline points=\"17 18 12 13 7 18\"></polyline>",
    	"cloud-drizzle": "<line x1=\"8\" y1=\"19\" x2=\"8\" y2=\"21\"></line><line x1=\"8\" y1=\"13\" x2=\"8\" y2=\"15\"></line><line x1=\"16\" y1=\"19\" x2=\"16\" y2=\"21\"></line><line x1=\"16\" y1=\"13\" x2=\"16\" y2=\"15\"></line><line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"23\"></line><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"17\"></line><path d=\"M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25\"></path>",
    	"cloud-lightning": "<path d=\"M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9\"></path><polyline points=\"13 11 9 17 15 17 11 23\"></polyline>",
    	"cloud-off": "<path d=\"M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3\"></path><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"></line>",
    	"cloud-rain": "<line x1=\"16\" y1=\"13\" x2=\"16\" y2=\"21\"></line><line x1=\"8\" y1=\"13\" x2=\"8\" y2=\"21\"></line><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"23\"></line><path d=\"M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25\"></path>",
    	"cloud-snow": "<path d=\"M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25\"></path><line x1=\"8\" y1=\"16\" x2=\"8\" y2=\"16\"></line><line x1=\"8\" y1=\"20\" x2=\"8\" y2=\"20\"></line><line x1=\"12\" y1=\"18\" x2=\"12\" y2=\"18\"></line><line x1=\"12\" y1=\"22\" x2=\"12\" y2=\"22\"></line><line x1=\"16\" y1=\"16\" x2=\"16\" y2=\"16\"></line><line x1=\"16\" y1=\"20\" x2=\"16\" y2=\"20\"></line>",
    	"corner-down-left": "<polyline points=\"9 10 4 15 9 20\"></polyline><path d=\"M20 4v7a4 4 0 0 1-4 4H4\"></path>",
    	"corner-down-right": "<polyline points=\"15 10 20 15 15 20\"></polyline><path d=\"M4 4v7a4 4 0 0 0 4 4h12\"></path>",
    	"corner-left-down": "<polyline points=\"14 15 9 20 4 15\"></polyline><path d=\"M20 4h-7a4 4 0 0 0-4 4v12\"></path>",
    	"corner-left-up": "<polyline points=\"14 9 9 4 4 9\"></polyline><path d=\"M20 20h-7a4 4 0 0 1-4-4V4\"></path>",
    	"corner-right-down": "<polyline points=\"10 15 15 20 20 15\"></polyline><path d=\"M4 4h7a4 4 0 0 1 4 4v12\"></path>",
    	"corner-right-up": "<polyline points=\"10 9 15 4 20 9\"></polyline><path d=\"M4 20h7a4 4 0 0 0 4-4V4\"></path>",
    	"corner-up-left": "<polyline points=\"9 14 4 9 9 4\"></polyline><path d=\"M20 20v-7a4 4 0 0 0-4-4H4\"></path>",
    	"corner-up-right": "<polyline points=\"15 14 20 9 15 4\"></polyline><path d=\"M4 20v-7a4 4 0 0 1 4-4h12\"></path>",
    	"credit-card": "<rect x=\"1\" y=\"4\" width=\"22\" height=\"16\" rx=\"2\" ry=\"2\"></rect><line x1=\"1\" y1=\"10\" x2=\"23\" y2=\"10\"></line>",
    	"delete": "<path d=\"M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z\"></path><line x1=\"18\" y1=\"9\" x2=\"12\" y2=\"15\"></line><line x1=\"12\" y1=\"9\" x2=\"18\" y2=\"15\"></line>",
    	"dollar-sign": "<line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"23\"></line><path d=\"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6\"></path>",
    	"download-cloud": "<polyline points=\"8 17 12 21 16 17\"></polyline><line x1=\"12\" y1=\"12\" x2=\"12\" y2=\"21\"></line><path d=\"M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29\"></path>",
    	"edit-2": "<polygon points=\"16 3 21 8 8 21 3 21 3 16 16 3\"></polygon>",
    	"edit-3": "<polygon points=\"14 2 18 6 7 17 3 17 3 13 14 2\"></polygon><line x1=\"3\" y1=\"22\" x2=\"21\" y2=\"22\"></line>",
    	"external-link": "<path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"></path><polyline points=\"15 3 21 3 21 9\"></polyline><line x1=\"10\" y1=\"14\" x2=\"21\" y2=\"3\"></line>",
    	"eye-off": "<path d=\"M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24\"></path><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"></line>",
    	"fast-forward": "<polygon points=\"13 19 22 12 13 5 13 19\"></polygon><polygon points=\"2 19 11 12 2 5 2 19\"></polygon>",
    	"file-minus": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path><polyline points=\"14 2 14 8 20 8\"></polyline><line x1=\"9\" y1=\"15\" x2=\"15\" y2=\"15\"></line>",
    	"file-plus": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path><polyline points=\"14 2 14 8 20 8\"></polyline><line x1=\"12\" y1=\"18\" x2=\"12\" y2=\"12\"></line><line x1=\"9\" y1=\"15\" x2=\"15\" y2=\"15\"></line>",
    	"file-text": "<path d=\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\"></path><polyline points=\"14 2 14 8 20 8\"></polyline><line x1=\"16\" y1=\"13\" x2=\"8\" y2=\"13\"></line><line x1=\"16\" y1=\"17\" x2=\"8\" y2=\"17\"></line><polyline points=\"10 9 9 9 8 9\"></polyline>",
    	"folder-minus": "<path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"></path><line x1=\"9\" y1=\"14\" x2=\"15\" y2=\"14\"></line>",
    	"folder-plus": "<path d=\"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z\"></path><line x1=\"12\" y1=\"11\" x2=\"12\" y2=\"17\"></line><line x1=\"9\" y1=\"14\" x2=\"15\" y2=\"14\"></line>",
    	"git-branch": "<line x1=\"6\" y1=\"3\" x2=\"6\" y2=\"15\"></line><circle cx=\"18\" cy=\"6\" r=\"3\"></circle><circle cx=\"6\" cy=\"18\" r=\"3\"></circle><path d=\"M18 9a9 9 0 0 1-9 9\"></path>",
    	"git-commit": "<circle cx=\"12\" cy=\"12\" r=\"4\"></circle><line x1=\"1.05\" y1=\"12\" x2=\"7\" y2=\"12\"></line><line x1=\"17.01\" y1=\"12\" x2=\"22.96\" y2=\"12\"></line>",
    	"git-merge": "<circle cx=\"18\" cy=\"18\" r=\"3\"></circle><circle cx=\"6\" cy=\"6\" r=\"3\"></circle><path d=\"M6 21V9a9 9 0 0 0 9 9\"></path>",
    	"git-pull-request": "<circle cx=\"18\" cy=\"18\" r=\"3\"></circle><circle cx=\"6\" cy=\"6\" r=\"3\"></circle><path d=\"M13 6h3a2 2 0 0 1 2 2v7\"></path><line x1=\"6\" y1=\"9\" x2=\"6\" y2=\"21\"></line>",
    	"hard-drive": "<line x1=\"22\" y1=\"12\" x2=\"2\" y2=\"12\"></line><path d=\"M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z\"></path><line x1=\"6\" y1=\"16\" x2=\"6\" y2=\"16\"></line><line x1=\"10\" y1=\"16\" x2=\"10\" y2=\"16\"></line>",
    	"help-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><path d=\"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3\"></path><line x1=\"12\" y1=\"17\" x2=\"12\" y2=\"17\"></line>",
    	"life-buoy": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><circle cx=\"12\" cy=\"12\" r=\"4\"></circle><line x1=\"4.93\" y1=\"4.93\" x2=\"9.17\" y2=\"9.17\"></line><line x1=\"14.83\" y1=\"14.83\" x2=\"19.07\" y2=\"19.07\"></line><line x1=\"14.83\" y1=\"9.17\" x2=\"19.07\" y2=\"4.93\"></line><line x1=\"14.83\" y1=\"9.17\" x2=\"18.36\" y2=\"5.64\"></line><line x1=\"4.93\" y1=\"19.07\" x2=\"9.17\" y2=\"14.83\"></line>",
    	"link-2": "<path d=\"M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3\"></path><line x1=\"8\" y1=\"12\" x2=\"16\" y2=\"12\"></line>",
    	"log-in": "<path d=\"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4\"></path><polyline points=\"10 17 15 12 10 7\"></polyline><line x1=\"15\" y1=\"12\" x2=\"3\" y2=\"12\"></line>",
    	"log-out": "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"></path><polyline points=\"16 17 21 12 16 7\"></polyline><line x1=\"21\" y1=\"12\" x2=\"9\" y2=\"12\"></line>",
    	"map-pin": "<path d=\"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z\"></path><circle cx=\"12\" cy=\"10\" r=\"3\"></circle>",
    	"maximize-2": "<polyline points=\"15 3 21 3 21 9\"></polyline><polyline points=\"9 21 3 21 3 15\"></polyline><line x1=\"21\" y1=\"3\" x2=\"14\" y2=\"10\"></line><line x1=\"3\" y1=\"21\" x2=\"10\" y2=\"14\"></line>",
    	"message-circle": "<path d=\"M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z\"></path>",
    	"message-square": "<path d=\"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z\"></path>",
    	"mic-off": "<line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"></line><path d=\"M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6\"></path><path d=\"M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23\"></path><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"23\"></line><line x1=\"8\" y1=\"23\" x2=\"16\" y2=\"23\"></line>",
    	"minimize-2": "<polyline points=\"4 14 10 14 10 20\"></polyline><polyline points=\"20 10 14 10 14 4\"></polyline><line x1=\"14\" y1=\"10\" x2=\"21\" y2=\"3\"></line><line x1=\"3\" y1=\"21\" x2=\"10\" y2=\"14\"></line>",
    	"minus-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"8\" y1=\"12\" x2=\"16\" y2=\"12\"></line>",
    	"minus-square": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><line x1=\"8\" y1=\"12\" x2=\"16\" y2=\"12\"></line>",
    	"more-horizontal": "<circle cx=\"12\" cy=\"12\" r=\"1\"></circle><circle cx=\"19\" cy=\"12\" r=\"1\"></circle><circle cx=\"5\" cy=\"12\" r=\"1\"></circle>",
    	"more-vertical": "<circle cx=\"12\" cy=\"12\" r=\"1\"></circle><circle cx=\"12\" cy=\"5\" r=\"1\"></circle><circle cx=\"12\" cy=\"19\" r=\"1\"></circle>",
    	"navigation-2": "<polygon points=\"12 2 19 21 12 17 5 21 12 2\"></polygon>",
    	"package": "<path d=\"M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4a2 2 0 0 1-1.1-1.8V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z\"></path><polyline points=\"2.32 6.16 12 11 21.68 6.16\"></polyline><line x1=\"12\" y1=\"22.76\" x2=\"12\" y2=\"11\"></line><line x1=\"7\" y1=\"3.5\" x2=\"17\" y2=\"8.5\"></line>",
    	"pause-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"10\" y1=\"15\" x2=\"10\" y2=\"9\"></line><line x1=\"14\" y1=\"15\" x2=\"14\" y2=\"9\"></line>",
    	"phone-call": "<path d=\"M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"></path>",
    	"phone-forwarded": "<polyline points=\"19 1 23 5 19 9\"></polyline><line x1=\"15\" y1=\"5\" x2=\"23\" y2=\"5\"></line><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"></path>",
    	"phone-incoming": "<polyline points=\"16 2 16 8 22 8\"></polyline><line x1=\"23\" y1=\"1\" x2=\"16\" y2=\"8\"></line><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"></path>",
    	"phone-missed": "<line x1=\"23\" y1=\"1\" x2=\"17\" y2=\"7\"></line><line x1=\"17\" y1=\"1\" x2=\"23\" y2=\"7\"></line><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"></path>",
    	"phone-off": "<path d=\"M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91\"></path><line x1=\"23\" y1=\"1\" x2=\"1\" y2=\"23\"></line>",
    	"phone-outgoing": "<polyline points=\"23 7 23 1 17 1\"></polyline><line x1=\"16\" y1=\"8\" x2=\"23\" y2=\"1\"></line><path d=\"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z\"></path>",
    	"pie-chart": "<path d=\"M21.21 15.89A10 10 0 1 1 8 2.83\"></path><path d=\"M22 12A10 10 0 0 0 12 2v10z\"></path>",
    	"play-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><polygon points=\"10 8 16 12 10 16 10 8\"></polygon>",
    	"plus-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"16\"></line><line x1=\"8\" y1=\"12\" x2=\"16\" y2=\"12\"></line>",
    	"plus-square": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"16\"></line><line x1=\"8\" y1=\"12\" x2=\"16\" y2=\"12\"></line>",
    	"refresh-ccw": "<polyline points=\"1 4 1 10 7 10\"></polyline><polyline points=\"23 20 23 14 17 14\"></polyline><path d=\"M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15\"></path>",
    	"refresh-cw": "<polyline points=\"23 4 23 10 17 10\"></polyline><polyline points=\"1 20 1 14 7 14\"></polyline><path d=\"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15\"></path>",
    	"rotate-ccw": "<polyline points=\"1 4 1 10 7 10\"></polyline><path d=\"M3.51 15a9 9 0 1 0 2.13-9.36L1 10\"></path>",
    	"rotate-cw": "<polyline points=\"23 4 23 10 17 10\"></polyline><path d=\"M20.49 15a9 9 0 1 1-2.12-9.36L23 10\"></path>",
    	"share-2": "<circle cx=\"18\" cy=\"5\" r=\"3\"></circle><circle cx=\"6\" cy=\"12\" r=\"3\"></circle><circle cx=\"18\" cy=\"19\" r=\"3\"></circle><line x1=\"8.59\" y1=\"13.51\" x2=\"15.42\" y2=\"17.49\"></line><line x1=\"15.41\" y1=\"6.51\" x2=\"8.59\" y2=\"10.49\"></line>",
    	"shield-off": "<path d=\"M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18\"></path><path d=\"M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38\"></path><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"></line>",
    	"shopping-bag": "<path d=\"M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z\"></path><line x1=\"3\" y1=\"6\" x2=\"21\" y2=\"6\"></line><path d=\"M16 10a4 4 0 0 1-8 0\"></path>",
    	"shopping-cart": "<circle cx=\"9\" cy=\"21\" r=\"1\"></circle><circle cx=\"20\" cy=\"21\" r=\"1\"></circle><path d=\"M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6\"></path>",
    	"skip-back": "<polygon points=\"19 20 9 12 19 4 19 20\"></polygon><line x1=\"5\" y1=\"19\" x2=\"5\" y2=\"5\"></line>",
    	"skip-forward": "<polygon points=\"5 4 15 12 5 20 5 4\"></polygon><line x1=\"19\" y1=\"5\" x2=\"19\" y2=\"19\"></line>",
    	"stop-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><rect x=\"9\" y=\"9\" width=\"6\" height=\"6\"></rect>",
    	"thumbs-down": "<path d=\"M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17\"></path>",
    	"thumbs-up": "<path d=\"M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3\"></path>",
    	"toggle-left": "<rect x=\"1\" y=\"5\" width=\"22\" height=\"14\" rx=\"7\" ry=\"7\"></rect><circle cx=\"8\" cy=\"12\" r=\"3\"></circle>",
    	"toggle-right": "<rect x=\"1\" y=\"5\" width=\"22\" height=\"14\" rx=\"7\" ry=\"7\"></rect><circle cx=\"16\" cy=\"12\" r=\"3\"></circle>",
    	"trash-2": "<polyline points=\"3 6 5 6 21 6\"></polyline><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path><line x1=\"10\" y1=\"11\" x2=\"10\" y2=\"17\"></line><line x1=\"14\" y1=\"11\" x2=\"14\" y2=\"17\"></line>",
    	"trending-down": "<polyline points=\"23 18 13.5 8.5 8.5 13.5 1 6\"></polyline><polyline points=\"17 18 23 18 23 12\"></polyline>",
    	"trending-up": "<polyline points=\"23 6 13.5 15.5 8.5 10.5 1 18\"></polyline><polyline points=\"17 6 23 6 23 12\"></polyline>",
    	"upload-cloud": "<polyline points=\"16 16 12 12 8 16\"></polyline><line x1=\"12\" y1=\"12\" x2=\"12\" y2=\"21\"></line><path d=\"M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3\"></path><polyline points=\"16 16 12 12 8 16\"></polyline>",
    	"user-check": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"></path><circle cx=\"8.5\" cy=\"7\" r=\"4\"></circle><polyline points=\"17 11 19 13 23 9\"></polyline>",
    	"user-minus": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"></path><circle cx=\"8.5\" cy=\"7\" r=\"4\"></circle><line x1=\"23\" y1=\"11\" x2=\"17\" y2=\"11\"></line>",
    	"user-plus": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"></path><circle cx=\"8.5\" cy=\"7\" r=\"4\"></circle><line x1=\"20\" y1=\"8\" x2=\"20\" y2=\"14\"></line><line x1=\"23\" y1=\"11\" x2=\"17\" y2=\"11\"></line>",
    	"user-x": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2\"></path><circle cx=\"8.5\" cy=\"7\" r=\"4\"></circle><line x1=\"18\" y1=\"8\" x2=\"23\" y2=\"13\"></line><line x1=\"23\" y1=\"8\" x2=\"18\" y2=\"13\"></line>",
    	"video-off": "<path d=\"M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10\"></path><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"></line>",
    	"volume-1": "<polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"></polygon><path d=\"M15.54 8.46a5 5 0 0 1 0 7.07\"></path>",
    	"volume-2": "<polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"></polygon><path d=\"M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07\"></path>",
    	"volume-x": "<polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\"></polygon><line x1=\"23\" y1=\"9\" x2=\"17\" y2=\"15\"></line><line x1=\"17\" y1=\"9\" x2=\"23\" y2=\"15\"></line>",
    	"wifi-off": "<line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"></line><path d=\"M16.72 11.06A10.94 10.94 0 0 1 19 12.55\"></path><path d=\"M5 12.55a10.94 10.94 0 0 1 5.17-2.39\"></path><path d=\"M10.71 5.05A16 16 0 0 1 22.58 9\"></path><path d=\"M1.42 9a15.91 15.91 0 0 1 4.7-2.88\"></path><path d=\"M8.53 16.11a6 6 0 0 1 6.95 0\"></path><line x1=\"12\" y1=\"20\" x2=\"12\" y2=\"20\"></line>",
    	"x-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"15\" y1=\"9\" x2=\"9\" y2=\"15\"></line><line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"15\"></line>",
    	"x-square": "<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" ry=\"2\"></rect><line x1=\"9\" y1=\"9\" x2=\"15\" y2=\"15\"></line><line x1=\"15\" y1=\"9\" x2=\"9\" y2=\"15\"></line>",
    	"zap-off": "<polyline points=\"12.41 6.75 13 2 10.57 4.92\"></polyline><polyline points=\"18.57 12.91 21 10 15.66 10\"></polyline><polyline points=\"8 8 3 14 12 14 11 22 16 16\"></polyline><line x1=\"1\" y1=\"1\" x2=\"23\" y2=\"23\"></line>",
    	"zoom-in": "<circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line><line x1=\"11\" y1=\"8\" x2=\"11\" y2=\"14\"></line><line x1=\"8\" y1=\"11\" x2=\"14\" y2=\"11\"></line>",
    	"zoom-out": "<circle cx=\"11\" cy=\"11\" r=\"8\"></circle><line x1=\"21\" y1=\"21\" x2=\"16.65\" y2=\"16.65\"></line><line x1=\"8\" y1=\"11\" x2=\"14\" y2=\"11\"></line>"
    };

    const icons = {
        //  map icon name to svg src
        //  by default use feather icons
        default: 'droplet',
        svg: feather$1,
        width: 24,
        height: 24,

        src (name) {
            return `https://unpkg.com/feather-icons/dist/icons/${name}.svg`;
        },

        install (vm) {
            vm.addComponent('icon', icon);
        }
    };


    //
    //  Icon component
    const icon = {

        props: {
            width: null,
            height: null,
            name: null,
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 2,
            linecup: "round",
            linejoin: "round",
            src: null
        },

        render () {
            const props = this.props;
            if (props.src)
                return this.createElement('img', true).attr('alt', props.name || '').attr('src', props.src);

            const width = props.width || icons.width,
                height = props.height || icons.height,
                name = props.name || icons.default;
            if (!name) return '<i/>';
            const svg = icons.svg[name];
            if (!svg) return '<i/>';
            return this.createElement('div', true)
                .append('svg')
                .attr('height', height)
                .attr('width', width)
                .attr('fill', props.fill)
                .attr('stroke', props.stroke)
                .attr('stroke-width', props.strokeWidth)
                .attr('stroke-linecup', props.linecup)
                .attr('stroke-linejoin', props.linejoin)
                .attr('version', '1.1')
                .attr('viewBox', `0 0 ${width} ${height}`)
                .classed('view-icon', true)
                .html(svg);
        }
    };

    var viewMarked = {
        components: {icon},

        props: {
            source: null,
            anchorIcon: 'link'
        },

        render (el) {
            let marked, hl, markedOptions;

            const
                props = this.props,
                compile = source => {
                    source = source ? marked(source, markedOptions) : '';
                    return this.createElement('div', true).classed('markdown', true).html(source);
                };

            return Promise.all([this.require('marked'), this.require('highlightjs')]).then(libs => {
                [marked, hl] = libs;
                markedOptions = this.markedOptions(props, marked, hl);
                if (props.source)
                    return this.fetchText(props.source).then(response => compile(response.data));
                else
                    return compile(this.select(el).html());
            });
        },

        markedOptions (props, marked, hl) {
            var renderer = new marked.Renderer(),
                icon$$1 = props.anchorIcon;

            renderer.heading = heading;

            return {
                renderer,
                highlight,
                langPrefix: "hljs "
            };

            function heading (text, level) {
                var id = d3View.viewSlugify(text);
                return (`<h${level}>
                <a href="#${id}" aria-hidden="true" class="anchor" id="content-${id}">
                <icon name="${icon$$1}"></icon>
                </a>
                ${text}
                </h${level}>
            `);
            }

            function highlight (code, lang) {
                lang = hl.getLanguage(lang) ? [lang] : undefined;
                return hl.highlightAuto(code, lang).value;
            }
        }

    };

    var modalHeader = {
        render (el) {
            return (`
            <div class="modal-header">
                <h5 class="modal-title">${el.innerHTML}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `);
        }
    };

    var modalBody = {
        render (el) {
            return (`
            <div class="modal-body">
                ${el.innerHTML}
            </div>
        `);
        }
    };

    var modalFooter = {
        render (el) {
            return (`
            <div class="modal-footer">
                ${el.innerHTML}
            </div>
        `);
        }
    };

    const ESCAPE_KEY = 27;


    const modalComponent = {
        components: {
            modalHeader,
            modalBody,
            modalFooter
        },

        props: {
            transitionDuration: 300
        },

        model: {
            showModal: false,
            innerHtml: '',
            $showModal (innerHtml) {
                if (innerHtml) this.innerHtml = innerHtml;
                this.showModal = true;
            },
            $hideModal () {
                this.showModal = false;
            }
        },

        render () {
            var props = this.props;
            this.on(this.ownerDocument, 'keydown.modal', this.maybeHide.bind(this));
            return (`
            <div id="d3-view-modal">
                <div class="modal" tabindex="-1" role="dialog" d3-modal="showModal" data-transition-duration="${props.transitionDuration}">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content" d3-html="innerHtml">
                        </div>
                    </div>
                </div>
                <div class="modal-backdrop fade" d3-modal="showModal" data-transition-duration="${props.transitionDuration}"></div>
            </div>
        `);
        },

        maybeHide (e) {
            switch(e.keyCode) {
            case ESCAPE_KEY:
                this.model.$hideModal();
                break;
            default:
                break;
            }
        }
    };


    const modalDirective = {
        refresh (model, show) {
            if (!this.passes) return;
            var sel = this.sel,
                modal = sel.classed('modal');
            let height;
            if (show) {
                sel.style('display', 'block').classed('show', true);
                if (modal) {
                    height = sel.style('height');
                    sel.style('top', '-' + height);
                    this.transition(sel).ease(d3Ease.easeExpOut).style('top', '0px');
                }
            }
            else {
                var op = sel.style('opacity'),
                    t = this.transition(sel);
                sel.classed('show', false);
                if (modal) {
                    height = sel.style('height');
                    t.style('top', '-' + height).on('end', function () {
                        sel.style('display', 'none');
                    });
                } else
                    t.style('opacity', 0);
                t.on('end', function () {
                    sel.style('display', 'none').style('opacity', op);
                });
            }
        }
    };


    const viewModal = {
        modalComponent,
        modalDirective,
        modalOpen (innerHtml) {
            const vm = this.$$view;
            const se = vm.select(innerHtml);
            if (se.size()) innerHtml = se.html();
            var modal = vm.select('#d3-view-modal');
            if (!modal.size())
                vm.sel.append('modal').mount().then(() => {
                    vm.select('#d3-view-modal').model().$showModal(innerHtml);
                });
            else
                modal.model().$showModal(innerHtml);
        },

        install (vm) {
            vm.addComponent('modal', viewModal.modalComponent);
            vm.addDirective('modal', viewModal.modalDirective);
            vm.model.$openModal = viewModal.modalOpen;
        }
    };

    var tpl$1 = "<div id=\"{{ id }}-container\" class=\"sidebar\">\n  <div id=\"{{ id }}\" class=\"sidebar-wrapper d-print-none width collapse show\" data-container=\"padding-left\">\n    <ul class=\"list-group\">\n      <a class=\"sidebar-brand\" href=\"{{ brandUrl }}\">{{ brand }}</a>\n      <group d3-for=\"item in primaryItems\"></group>\n    </ul>\n    <div class=\"list-group bottom\">\n      <a d3-for=\"item in secondaryItems\"\n        class='list-group-item list-group-item-action compact'\n        d3-attr-href=\"item.href\"\n        d3-html=\"item.name\"\n        d3-link>\n      </a>\n    </div>\n  </div>\n  <div class=\"content-wrapper\">\n    <nav class=\"sidebar-navbar navbar {{ classes }}\">\n      <a class=\"navbar-toggler btn btn-default mr-2\" href=\"#\"\n        aria-controls=\"{{ id }}\"\n        aria-expanded=\"true\"\n        aria-label=\"toggle sidebar\"\n        d3-if=\"sidebarToggle\"\n        d3-html=\"sidebarToggle\"\n        d3-collapse></a>\n      <a class=\"navbar-brand mr-auto\"\n        d3-if=\"navbarTitle\"\n        d3-attr-href=\"navbarTitleUrl\"\n        d3-html=\"navbarTitle\"\n        data-transition-duration=150></a>\n      <ul class=\"nav navbar-nav\">\n        <li d3-for=\"item in navbarItems\" class=\"nav-item\">\n          <a class=\"nav-link\"\n            d3-attr-href=\"item.href || '#'\"\n            d3-html=\"item.title\"\n            d3-if=\"item.show ? item.show() : true\"\n            d3-on-click=\"item.click ? item.click() : null\"\n            d3-active>\n            <i d3-class=\"item.icon\" aria-hidden=\"true\"></i>\n            <span d3-html=\"item.label || item.name\" d3-if=\"item.showLabel !== false\"></span>\n          </a>\n        </li>\n      </ul>\n    </nav>\n    <div class=\"content-main\">\n    {{{sidebarContent}}}\n    </div>\n  </div>\n</div>\n";

    var groupTpl = "<li class=\"list-group-entry\">\n  <a class=\"list-group-item list-group-item-action\" d3-attr-href=\"item.href\" d3-link>\n    <icon d3-prop-name=\"item.icon\"></icon>\n    <span d3-html=\"item.label || item.name\"></span>\n  </a>\n  <ul class=\"list-group\" d3-if=\"item.items\">\n    <li class=\"list-group-entry\" d3-for=\"entry in item.items\">\n      <a class=\"list-group-item list-group-item-action\" d3-attr-href=\"entry.href\" d3-link d3-active>\n        <icon d3-prop-name=\"entry.icon\"></icon>\n        <span d3-html=\"entry.label || entry.name\"></span>\n      </a>\n    </li>\n  </ul>\n</li>\n";

    const group = {

        render () {
            return groupTpl;
        }
    };
    //
    //  Reusable Sidebar component
    //  ================================
    //
    //  Requires:
    //
    //  * collapse directive
    //  * active directive (Optional)
    //
    var viewSidebar = {
        components: {group, icon},
        directives: {active: viewActive, collapse: viewCollapse},

        props: {
            id: 'sidebar',
            brand: 'sidebar',
            classes: 'sticky-top navbar-dark bg-primary',
            brandUrl: '/',
            itemAttr: ''
        },

        model() {
            return {
                primaryItems: [],
                secondaryItems: [],
                sidebarToggle: '<icon data-name="menu"></icon>',
                // sidebar
                sectionCollapse: false,  //  allow sections in sidebar to be collapsible
                // top navbar attributes
                navbarItems: [],
                navbarTitle: "",
                navbarTitleUrl: "/"
            };
        },

        render (el) {
            var model = this.model;
            asItems(model, model.primaryItems);
            asItems(model, model.secondaryItems);
            asItems(model, model.navbarItems);
            this.props.sidebarContent = this.select(el).html();
            return tpl$1;
        }
    };


    const asItems = (model, items) => {
        let item;
        for (let i=0; i<items.length; ++i) {
            item = items[i];
            if (typeof item === 'string')
                item = {
                    name: item
                };
            if (!(item instanceof d3View.viewModel)) item = model.$new(item);
            if (!item.href) item.$set('href', item.name);
            if (!item.items) item.items = [];
            items[i] = item;
        }
    };

    //
    //  Directive for navigating
    var link$1 = {

        mount (model) {
            var self = this;
            let href;
            this.on(this.sel, `click.${this.uid}`, (event) => {
                href = self.sel.attr('href') || '';
                if (d3View.isAbsoluteUrl(href)) return;
                self.navigate(model, href, event);
            });
        },

        navigate (model, href, event) {
            var router = model.$$view.router;
            if (router._usePushState) {
                let to = router._getRoot() + '/' + href.replace(/^\/+/, '/');
                to = to.replace(/([^:])(\/{2,})/g, '$1/');
                window.history[router._historyAPIUpdateMethod]({}, '', to);
                if (router.resolve(to))
                    event.preventDefault();
            } else router.navigate(href);
        },

        destroy () {
            this.on(this.sel, `click.${this.uid}`, null);
        }
    };

    var routes = {

        render (el) {
            let r, path;
            const
                router = this.router,
                self = this,
                container = this.createElement('div', true);

            this.selectChildren(el).each(function () {
                r = self.select(this);
                path = r.attr('path') || r.attr('data-path');
                if (path)
                    router.on(path, component(this.tagName, container));
                else
                    router.on(component(this.tagName, container));
            });

            return container;
        }
    };


    function component (tag, container) {

        return render;

        function render (params, query) {
            container.html(`<${tag} />`).mount({params, query});
        }
    }

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

    function isPushStateAvailable() {
      return !!(typeof window !== 'undefined' && window.history && window.history.pushState);
    }

    function Navigo(r, useHash, hash) {
      this.root = null;
      this._routes = [];
      this._useHash = useHash;
      this._hash = typeof hash === 'undefined' ? '#' : hash;
      this._paused = false;
      this._destroyed = false;
      this._lastRouteResolved = null;
      this._notFoundHandler = null;
      this._defaultHandler = null;
      this._usePushState = !useHash && isPushStateAvailable();
      this._onLocationChange = this._onLocationChange.bind(this);
      this._genericHooks = null;
      this._historyAPIUpdateMethod = 'pushState';

      if (r) {
        this.root = useHash ? r.replace(/\/$/, '/' + this._hash) : r.replace(/\/$/, '');
      } else if (useHash) {
        this.root = this._cLoc().split(this._hash)[0].replace(/\/$/, '/' + this._hash);
      }

      this._listen();
      this.updatePageLinks();
    }

    function clean(s) {
      if (s instanceof RegExp) return s;
      return s.replace(/\/+$/, '').replace(/^\/+/, '^/');
    }

    function regExpResultToParams(match, names) {
      if (names.length === 0) return null;
      if (!match) return null;
      return match.slice(1, match.length).reduce(function (params, value, index) {
        if (params === null) params = {};
        params[names[index]] = decodeURIComponent(value);
        return params;
      }, null);
    }

    function replaceDynamicURLParts(route) {
      var paramNames = [],
          regexp;

      if (route instanceof RegExp) {
        regexp = route;
      } else {
        regexp = new RegExp(route.replace(Navigo.PARAMETER_REGEXP, function (full, dots, name) {
          paramNames.push(name);
          return Navigo.REPLACE_VARIABLE_REGEXP;
        }).replace(Navigo.WILDCARD_REGEXP, Navigo.REPLACE_WILDCARD) + Navigo.FOLLOWED_BY_SLASH_REGEXP, Navigo.MATCH_REGEXP_FLAGS);
      }
      return { regexp: regexp, paramNames: paramNames };
    }

    function getUrlDepth(url) {
      return url.replace(/\/$/, '').split('/').length;
    }

    function compareUrlDepth(urlA, urlB) {
      return getUrlDepth(urlB) - getUrlDepth(urlA);
    }

    function findMatchedRoutes(url) {
      var routes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      return routes.map(function (route) {
        var _replaceDynamicURLPar = replaceDynamicURLParts(clean(route.route)),
            regexp = _replaceDynamicURLPar.regexp,
            paramNames = _replaceDynamicURLPar.paramNames;

        var match = url.replace(/^\/+/, '/').match(regexp);
        var params = regExpResultToParams(match, paramNames);

        return match ? { match: match, route: route, params: params } : false;
      }).filter(function (m) {
        return m;
      });
    }

    function match(url, routes) {
      return findMatchedRoutes(url, routes)[0] || false;
    }

    function root(url, routes) {
      var matched = routes.map(function (route) {
        return route.route === '' || route.route === '*' ? url : url.split(new RegExp(route.route + '($|\/)'))[0];
      });
      var fallbackURL = clean(url);

      if (matched.length > 1) {
        return matched.reduce(function (result, url) {
          if (result.length > url.length) result = url;
          return result;
        }, matched[0]);
      } else if (matched.length === 1) {
        return matched[0];
      }
      return fallbackURL;
    }

    function isHashChangeAPIAvailable() {
      return typeof window !== 'undefined' && 'onhashchange' in window;
    }

    function extractGETParameters(url) {
      return url.split(/\?(.*)?$/).slice(1).join('');
    }

    function getOnlyURL(url, useHash, hash) {
      var onlyURL = url,
          split;
      var cleanGETParam = function cleanGETParam(str) {
        return str.split(/\?(.*)?$/)[0];
      };

      if (typeof hash === 'undefined') {
        // To preserve BC
        hash = '#';
      }

      if (isPushStateAvailable() && !useHash) {
        onlyURL = cleanGETParam(url).split(hash)[0];
      } else {
        split = url.split(hash);
        onlyURL = split.length > 1 ? cleanGETParam(split[1]) : cleanGETParam(split[0]);
      }

      return onlyURL;
    }

    function manageHooks(handler, hooks, params) {
      if (hooks && (typeof hooks === 'undefined' ? 'undefined' : _typeof(hooks)) === 'object') {
        if (hooks.before) {
          hooks.before(function () {
            var shouldRoute = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            if (!shouldRoute) return;
            handler();
            hooks.after && hooks.after(params);
          }, params);
          return;
        } else if (hooks.after) {
          handler();
          hooks.after && hooks.after(params);
          return;
        }
      }
      handler();
    }

    function isHashedRoot(url, useHash, hash) {
      if (isPushStateAvailable() && !useHash) {
        return false;
      }

      if (!url.match(hash)) {
        return false;
      }

      var split = url.split(hash);

      return split.length < 2 || split[1] === '';
    }

    Navigo.prototype = {
      helpers: {
        match: match,
        root: root,
        clean: clean,
        getOnlyURL: getOnlyURL
      },
      navigate: function navigate(path, absolute) {
        var to;

        path = path || '';
        if (this._usePushState) {
          to = (!absolute ? this._getRoot() + '/' : '') + path.replace(/^\/+/, '/');
          to = to.replace(/([^:])(\/{2,})/g, '$1/');
          history[this._historyAPIUpdateMethod]({}, '', to);
          this.resolve();
        } else if (typeof window !== 'undefined') {
          path = path.replace(new RegExp('^' + this._hash), '');
          window.location.href = window.location.href.replace(/#$/, '').replace(new RegExp(this._hash + '.*$'), '') + this._hash + path;
        }
        return this;
      },
      on: function on() {
        var _this = this;

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        if (typeof args[0] === 'function') {
          this._defaultHandler = { handler: args[0], hooks: args[1] };
        } else if (args.length >= 2) {
          if (args[0] === '/') {
            var func = args[1];

            if (_typeof(args[1]) === 'object') {
              func = args[1].uses;
            }

            this._defaultHandler = { handler: func, hooks: args[2] };
          } else {
            this._add(args[0], args[1], args[2]);
          }
        } else if (_typeof(args[0]) === 'object') {
          var orderedRoutes = Object.keys(args[0]).sort(compareUrlDepth);

          orderedRoutes.forEach(function (route) {
            _this.on(route, args[0][route]);
          });
        }
        return this;
      },
      off: function off(handler) {
        if (this._defaultHandler !== null && handler === this._defaultHandler.handler) {
          this._defaultHandler = null;
        } else if (this._notFoundHandler !== null && handler === this._notFoundHandler.handler) {
          this._notFoundHandler = null;
        }
        this._routes = this._routes.reduce(function (result, r) {
          if (r.handler !== handler) result.push(r);
          return result;
        }, []);
        return this;
      },
      notFound: function notFound(handler, hooks) {
        this._notFoundHandler = { handler: handler, hooks: hooks };
        return this;
      },
      resolve: function resolve(current) {
        var _this2 = this;

        var handler, m;
        var url = (current || this._cLoc()).replace(this._getRoot(), '');

        if (this._useHash) {
          url = url.replace(new RegExp('^\/' + this._hash), '/');
        }

        var GETParameters = extractGETParameters(current || this._cLoc());
        var onlyURL = getOnlyURL(url, this._useHash, this._hash);

        if (this._paused) return false;

        if (this._lastRouteResolved && onlyURL === this._lastRouteResolved.url && GETParameters === this._lastRouteResolved.query) {
          if (this._lastRouteResolved.hooks && this._lastRouteResolved.hooks.already) {
            this._lastRouteResolved.hooks.already(this._lastRouteResolved.params);
          }
          return false;
        }

        m = match(onlyURL, this._routes);

        if (m) {
          this._callLeave();
          this._lastRouteResolved = {
            url: onlyURL,
            query: GETParameters,
            hooks: m.route.hooks,
            params: m.params,
            name: m.route.name
          };
          handler = m.route.handler;
          manageHooks(function () {
            manageHooks(function () {
              m.route.route instanceof RegExp ? handler.apply(undefined, m.match.slice(1, m.match.length)) : handler(m.params, GETParameters);
            }, m.route.hooks, m.params, _this2._genericHooks);
          }, this._genericHooks, m.params);
          return m;
        } else if (this._defaultHandler && (onlyURL === '' || onlyURL === '/' || onlyURL === this._hash || isHashedRoot(onlyURL, this._useHash, this._hash))) {
          manageHooks(function () {
            manageHooks(function () {
              _this2._callLeave();
              _this2._lastRouteResolved = { url: onlyURL, query: GETParameters, hooks: _this2._defaultHandler.hooks };
              _this2._defaultHandler.handler(GETParameters);
            }, _this2._defaultHandler.hooks);
          }, this._genericHooks);
          return true;
        } else if (this._notFoundHandler) {
          manageHooks(function () {
            manageHooks(function () {
              _this2._callLeave();
              _this2._lastRouteResolved = { url: onlyURL, query: GETParameters, hooks: _this2._notFoundHandler.hooks };
              _this2._notFoundHandler.handler(GETParameters);
            }, _this2._notFoundHandler.hooks);
          }, this._genericHooks);
        }
        return false;
      },
      destroy: function destroy() {
        this._routes = [];
        this._destroyed = true;
        this._lastRouteResolved = null;
        this._genericHooks = null;
        clearTimeout(this._listeningInterval);
        if (typeof window !== 'undefined') {
          window.removeEventListener('popstate', this._onLocationChange);
          window.removeEventListener('hashchange', this._onLocationChange);
        }
      },
      updatePageLinks: function updatePageLinks() {
        var self = this;

        if (typeof document === 'undefined') return;

        this._findLinks().forEach(function (link) {
          if (!link.hasListenerAttached) {
            link.addEventListener('click', function (e) {
              var location = self.getLinkPath(link);

              if (!self._destroyed) {
                e.preventDefault();
                self.navigate(location.replace(/\/+$/, '').replace(/^\/+/, '/'));
              }
            });
            link.hasListenerAttached = true;
          }
        });
      },
      generate: function generate(name) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        var result = this._routes.reduce(function (result, route) {
          var key;

          if (route.name === name) {
            result = route.route;
            for (key in data) {
              result = result.toString().replace(':' + key, data[key]);
            }
          }
          return result;
        }, '');

        return this._useHash ? this._hash + result : result;
      },
      link: function link(path) {
        return this._getRoot() + path;
      },
      pause: function pause() {
        var status = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

        this._paused = status;
        if (status) {
          this._historyAPIUpdateMethod = 'replaceState';
        } else {
          this._historyAPIUpdateMethod = 'pushState';
        }
      },
      resume: function resume() {
        this.pause(false);
      },
      historyAPIUpdateMethod: function historyAPIUpdateMethod(value) {
        if (typeof value === 'undefined') return this._historyAPIUpdateMethod;
        this._historyAPIUpdateMethod = value;
        return value;
      },
      disableIfAPINotAvailable: function disableIfAPINotAvailable() {
        if (!isPushStateAvailable()) {
          this.destroy();
        }
      },
      lastRouteResolved: function lastRouteResolved() {
        return this._lastRouteResolved;
      },
      getLinkPath: function getLinkPath(link) {
        return link.getAttribute('href');
      },
      hooks: function hooks(_hooks) {
        this._genericHooks = _hooks;
      },

      _add: function _add(route) {
        var handler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var hooks = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

        if (typeof route === 'string') {
          route = encodeURI(route);
        }
        this._routes.push((typeof handler === 'undefined' ? 'undefined' : _typeof(handler)) === 'object' ? {
          route: route,
          handler: handler.uses,
          name: handler.as,
          hooks: hooks || handler.hooks
        } : { route: route, handler: handler, hooks: hooks });

        return this._add;
      },
      _getRoot: function _getRoot() {
        if (this.root !== null) return this.root;
        this.root = root(this._cLoc().split('?')[0], this._routes);
        return this.root;
      },
      _listen: function _listen() {
        var _this3 = this;

        if (this._usePushState) {
          window.addEventListener('popstate', this._onLocationChange);
        } else if (isHashChangeAPIAvailable()) {
          window.addEventListener('hashchange', this._onLocationChange);
        } else {
          var cached = this._cLoc(),
              current = void 0,
              _check = void 0;

          _check = function check() {
            current = _this3._cLoc();
            if (cached !== current) {
              cached = current;
              _this3.resolve();
            }
            _this3._listeningInterval = setTimeout(_check, 200);
          };
          _check();
        }
      },
      _cLoc: function _cLoc() {
        if (typeof window !== 'undefined') {
          if (typeof window.__NAVIGO_WINDOW_LOCATION_MOCK__ !== 'undefined') {
            return window.__NAVIGO_WINDOW_LOCATION_MOCK__;
          }
          return clean(window.location.href);
        }
        return '';
      },
      _findLinks: function _findLinks() {
        return [].slice.call(document.querySelectorAll('[data-navigo]'));
      },
      _onLocationChange: function _onLocationChange() {
        this.resolve();
      },
      _callLeave: function _callLeave() {
        var lastRouteResolved = this._lastRouteResolved;

        if (lastRouteResolved && lastRouteResolved.hooks && lastRouteResolved.hooks.leave) {
          lastRouteResolved.hooks.leave(lastRouteResolved.params);
        }
      }
    };

    Navigo.PARAMETER_REGEXP = /([:*])(\w+)/g;
    Navigo.WILDCARD_REGEXP = /\*/g;
    Navigo.REPLACE_VARIABLE_REGEXP = '([^\/]+)';
    Navigo.REPLACE_WILDCARD = '(?:.*)';
    Navigo.FOLLOWED_BY_SLASH_REGEXP = '(?:\/$|$)';
    Navigo.MATCH_REGEXP_FLAGS = '';

    var viewRouter = {

        install (vm) {
            const config = vm.props.routerConfig || {};
            var events = d3Dispatch.dispatch('before', 'after', 'leave'),
                baseUrl = vm.providers.resolve(config.basePath || '/'),
                router = new Navigo(baseUrl);

            // d3 link directive
            vm.addDirective('link', link$1);
            // routes component
            vm.addComponent('routes', routes);
            //
            vm.router = router;
            vm.routerEvents = events;
            if (config.routes) config.routes(vm);

            router.hooks({
                before (done, params) {
                    events.call('before', undefined, vm, params);
                    done();
                },
                after (params) {
                    // var url = router.lastRouteResolved().url;
                    var url = vm.providers.location.href;
                    vm.model.$set('currentUrl', url);
                    events.call('after', undefined, vm, params);
                },
                leave (params) {
                    events.call('leave', undefined, vm, params);
                }
            });

            // Add router to all components which are part of the vm view
            vm.events.on('mount.router', cm => {
                cm.router = router;
            });

            // auto resolve
            if (config.autoResolve !== false)
                vm.events.on('mounted.router', () => {
                    vm.logDebug('Resolve route with router');
                    vm.router.resolve();
                });
        },

        with (obj) {
            obj = objectAssign({}, obj);
            if (!obj.props) obj.props = {};
            obj.props.routeParams = {};
            obj.props.routeQuery = '';
            return obj;
        }
    };

    d3View.viewProviders.compileTemplate = Handlebars.compile;

    function viewComponents (vm) {
        vm.use(d3View.viewForms)
            .use(d3View.viewBootstrapForms)
            .use(viewModal)
            .use(viewRouter)
            .use(viewAlert)
            .use(icons);

        vm.addComponent('markdown', viewMarked);
    }

    function template (ctx) {
        return (`
        <sidebar id="main"
            data-model="sidenav"
            data-brand="title"
            data-brand-url="/"
            data-navbar-title="title"
            data-navbar-title-Url="currentUrl">
            <routes>
                <markdown-route path="/components/:name">
                    <markdown>${ctx.content}</markdown>
                </markdown-route>
            </routes>
            ${ctx.footer}
        </sidebar>
    `);
    }


    const markdownRoute = {
        render () {
            const url = this.router.lastRouteResolved().url;
            return this.json(`${url}.json`).then(response => {
                const data = response.data;
                return `<markdown>${data.content}</markdown>`;
            });
        }
    };


    var sidenav = {
        components: {
            markdownRoute,
            sidebar: viewSidebar
        },

        directives: {
            collapse: viewCollapse,
            active: viewActive
        },

        render (el) {
            let
                content = this.select(el).html(),
                sidenav = this.model[this.name],
                footer = '';
            if (!sidenav) {
                sidenav =  this.model.$new();
                this.model[this.name] = sidenav;
            }
            if (!sidenav.primaryItems)
                return this.json('nav.json').then(response => {
                    sidenav.$set('primaryItems', response.data);
                    return template({content, footer, path: this.props.path});
                });
            else
                return template({content, footer});
        }
    };

    var metadata = {

        install (vm, metadata) {
            var head = vm.select('head');
            metadata = objectAssign(metadata || {}, head.attr('data-meta'));
            if (!metadata.title) {
                var t = head.select('title');
                metadata.title = t.size() === 1 ? t.text() : '';
            }
            vm.model.metadata = metadata;
            vm.events.on('mounted.metadata', bindMeta);
        }
    };


    function bindMeta (vm) {
        if (vm.parent) return;
        var head = vm.select('head');

        vm.model.metadata.$on(() => {
            let meta;
            var data = vm.model.metadata.$data();
            Object.keys(data).forEach(key => {
                meta = metaHandlers[key] || metaHandlers.content;
                meta(head, key, data[key]);
            });
        });
    }


    const metaHandlers = {
        title (head, key, value) {

            var el = head.select(key);
            if (!el.node) el = head.insert(key, ":first-child");
            el.text(value);
        },

        content (head, key, value) {
            var el = head.select(`meta name="${key}"`);
            if (!el.node()) el.head.append('meta').attr('name', key);
            el.attr('content', value);
        }
    };

    var card = {
        props: {
            title: '',
            titleTag: 'h5',
            image: null,
            imageHeight: null
        },

        render (props, attrs, el) {
            var sel = this.select(el),
                body = sel.text(),
                card = this.createElement('div').classed('card', true);

            if (body) body = `<p>${body}</p>`;
            else body = sel.html();

            if (props.image) {
                const img = card.append('img')
                    .classed("card-img-top", true)
                    .attr("src", props.image)
                    .attr("alt", props.imageAlt || props.title);
                if (props.imageHeight) img.attr("height", props.imageHeight);
            }
            const main = card.append('div').classed("card-body", true);
            if (props.title) main.append(props.titleTag).classed("card-title", true).text(props.title);
            main.append('div').html(body);
            return card;
        }
    };

    //
    // Live code
    // idea from https://github.com/FormidableLabs/react-live
    var viewLive = {

        render (props, attrs, el) {
            this._code = this.select(el).text();
            this._mountPoint = `live-${this.uid}`;
            el = this.createElement('div').classed('row', true);

            el.append('div').classed('col-md-6', true);
            el.append('div').classed('col-md-6', true).attr('id', this._mountPoint);

            return el;
        },

        mounted () {
            const scope = {
                mountPoint: `#${this._mountPoint}`
            };
            evalCode(this._code, scope);
        }
    };


    function evalCode (code, scope) {
        const scopeKeys = Object.keys(scope);
        const scopeValues = scopeKeys.map(key => scope[key]);
        //const res = new Function('_poly', 'React', ...scopeKeys, code);
        //return res(_poly, React, ...scopeValues);
        return scopeValues;
    }

    const template$1 = ctx => {
        var nav =  ctx.navigationRight.map(item => {
            return (`
            <li class="nav-item">
                <a class="nav-link" href="${item.href}">${item.name}</a>
            </li>
        `);
        }).join('\n');

        return (`
        <div class="d3-fluid">
            <nav class="navbar navbar-expand-${ctx.collapse} ${ctx.theme}">
                <a class="navbar-brand" href="/" html="${ctx.brand}"></a>
                <ul class="navbar-nav ml-auto">${nav}</ul>
            </nav>
            <markdown>${ctx.content}</markdown>
            ${ctx.footer}
        </div>
    `);
    };


    var topnav = {
        props: {
            theme: 'navbar-dark bg-dark',
            collapse: 'sm',
            brand: '',
            navigationRight: []
        },

        render (el) {
            const
                content = this.select(el).html(),
                footer = '',
                ctx = objectAssign({content, footer}, this.props);
            return template$1(ctx);
        }
    };

    var dev = vm => {
        // Enable LiveReload
        vm.select('head')
            .append('script')
            .attr('src', `http://${(location.host || 'localhost').split(':')[0]}:35729/livereload.js?snipver=1`);
    };

    const components = {
        'view-live': viewLive,
        card,
        sidenav,
        topnav
    };

    //  Create View
    //
    function start (root) {
        if (!root) root = window;
        const model = root.config || {},
            props = pop(model, 'meta') || {};

        // Build the model-view pair
        var vm = d3View.view({props, model, components}).use(viewComponents).use(metadata);

        root.fluid = vm;
        //
        var el = root.document.getElementById('root');
        vm.mount(el).then(() => {
            if (vm.props.env === 'dev') dev(vm);
            vm.sel.transition(150).style('opacity', 1);
        });
    }

    exports.version = version;
    exports.start = start;
    exports.metadata = metadata;
    exports.sidenav = sidenav;
    exports.live = viewLive;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=d3-fluid-app.js.map
