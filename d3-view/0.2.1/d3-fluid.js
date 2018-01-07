(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('remarkable'), require('highlightjs'), require('d3-let'), require('d3-view')) :
	typeof define === 'function' && define.amd ? define(['exports', 'remarkable', 'highlightjs', 'd3-let', 'd3-view'], factory) :
	(factory((global.d3 = global.d3 || {}),global.remarkable,global.highlightjs,global.d3,global.d3));
}(this, (function (exports,Markdown,highlightjs,d3Let,d3View) { 'use strict';

Markdown = Markdown && Markdown.hasOwnProperty('default') ? Markdown['default'] : Markdown;

var version = "0.2.1";

var markdown = {

    props: {
        lang: null
    },

    render: function render(props, attrs, el) {
        var source = this.select(el).text();

        var md = new Markdown({
            langPrefix: 'hljs css ',
            highlight: function highlight$$1(str, lang) {
                lang = lang || props.lang;
                if (lang && highlightjs.getLanguage(lang)) {
                    try {
                        return highlightjs.highlight(lang, str).value;
                    } catch (err) {
                        // do nothing
                    }
                }
                try {
                    return highlightjs.highlightAuto(str).value;
                } catch (err) {
                    // do nothing
                }
                return '';
            },
            html: true,
            linkify: true
        });

        source = md.render(source);
        return this.createElement('div').classed('content', true).html(source);
    }
};

var metadata = {
    install: function install(vm, metadata) {
        metadata = d3Let.assign(metadata || {}, vm.select('head').attr('data-meta'));
        vm.model.metadata = metadata;
        vm.events.on('mounted.metadata', bindMeta);
    }
};

function bindMeta(vm) {
    var head = vm.select('head');

    vm.model.metadata.$on(function () {
        var meta = void 0;
        var data = vm.model.metadata.$data();
        Object.keys(data).forEach(function (key) {
            meta = metaHandlers[key] || metaHandlers.content;
            meta(head, key, data[key]);
        });
    });
}

var metaHandlers = {
    title: function title(head, key, value) {

        var el = head.select(key);
        if (!el.node) el = head.insert(key, ":first-child");
        el.text(value);
    },
    content: function content(head, key, value) {
        var el = head.select('meta name="' + key + '"');
        if (!el.node()) el.head.append('meta').attr('name', key);
        el.attr('content', value);
    }
};

//  Create View
//
function start () {

    // Build the model-view pair
    var vm = d3View.view({
        components: {
            markdown: markdown
        }
    });
    vm.use(metadata);
    //
    var el = document.getElementById('root');
    vm.mount(el);
}

exports.fluidVersion = version;
exports.fluidMarkdown = markdown;
exports.fluidMetadata = metadata;
exports.fluidStart = start;

Object.defineProperty(exports, '__esModule', { value: true });

})));
