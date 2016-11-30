(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('d3'), require('d3'), require('d3'), require('d3')) :
    typeof define === 'function' && define.amd ? define('giottojs', ['d3', 'd3', 'd3', 'd3'], factory) :
    (factory(global.d3,global.d3$1,global.d3$2,global.d3$3));
}(this, (function (d3,d3$1,d3$2,d3$3) { 'use strict';

var navbarTpl = "<nav class=\"navbar\" d3-class=\"[theme, ['navbar-fixed-top', fixedTop]]\">\n    <a class=\"navbar-brand\" d3-if=\"brand.title || brand.image\" d3-attr-href=\"brand.href || '#'\" d3-html=\"brand.title\">\n        <img d3-if=\"brand.image\" d3-attr-src=\"brand.image\" d3-attr-alt=\"brand.title\">\n    </a>\n    <ul class=\"nav navbar-nav\">\n        <li d3-for=\"item in items\" class=\"nav-item\" d3-class=\"item.class\" d3-active>\n            <a class=\"nav-link\"\n                d3-attr-href=\"item.href || '#'\"\n                d3-html=\"item.title\"\n                d3-if=\"item.show ? item.show() : true\"\n                d3-on-click=\"item.click ? item.click() : null\"></a>\n        </li>\n    </ul>\n</nav>";

var navbar = {

    model: {
        fixedTop: true,
        theme: "navbar-light bg-faded",
        brand: {},
        items: []
    },

    render: function render() {
        return d3.viewElement(navbarTpl);
    }
};

var messagesTpl = '<div class="messages"></div>';

var levels = {
    error: 'danger'
};

// component render function
var messages = function () {

    var self = this;
    this.root.events.on('message', function (data) {
        self.sel.append(function () {
            return messageEl(data);
        }).call(fadeIn);
    });

    return d3.viewElement(messagesTpl);
};

function messageEl(data) {

    var level = data.level;
    if (!level) {
        if (data.error) level = 'error';else if (data.success) level = 'success';
    }
    level = levels[level] || level || 'info';
    return d3.viewElement('<div class="alert alert-' + level + '" role="alert" style="opacity: 0">\n' + data.message + '\n</div>');
}

function fadeIn(selection) {
    return selection.transition().duration(300).style("opacity", 1);
}

var year = {
    render: function render() {
        var year = new Date().getFullYear();
        return this.viewElement("<span>" + year + "</span>");
    }
};

var grid = {
    props: ['json'],

    render: function render(data) {
        var json = data.json,
            container = this.createElement('div').classed('d3-grid', true),
            self = this;

        // grid properties are remote
        if (d3$2.isString(json)) {
            this.fetch(json).then(self.build);
        }
        return container;
    },
    build: function build(data) {
        if (data.target) this.fetch(data.target);
    }
};

var components = {
    install: function install(vm) {
        vm.addComponent('navbar', navbar);
        vm.addComponent('messages', messages);
        vm.addComponent('year', year);
        vm.addComponent('d3grid', grid);
    }
};

var fullpage = {
    create: function create(expression) {
        return expression;
    },
    refresh: function refresh() {
        var height = d3$3.window(this.el).style('height');
        this.el.style('min-height', height);
    }
};

var highlight = {
    create: function create(expression) {
        return expression;
    },
    refresh: function refresh() {
        var el = this.el;

        require(['highlight'], function () {
            highlight$1(el);
        });
    }
};

function highlight$1(elem) {
    d3$3.select(elem).selectAll('code').selectAll(highlightBlock);
    d3$3.select(elem).selectAll('.highlight pre').selectAll(highlightSphinx);
}

function highlightBlock() {
    var elem = d3$3.select(this),
        parent = elem.parent();

    parent.classed('hljs', true);
    if (parent.tagName === 'PRE') {
        d3$3.window.hljs.highlightBlock(this);
        parent.classed('hljs', true);
    } else {
        elem.classed('hljs inline', true);
    }
}

function highlightSphinx() {
    var elem = d3$3.select(this),
        div = elem.parent(),
        parent = div.parent().node();

    elem.classed('hljs', true);

    if (parent && parent.className.substring(0, 10) === 'highlight-') div.classed('language-' + parent.className.substring(10), true);
    d3$3.window.hljs.highlightBlock(this);
}

var directives = {
    install: function install(vm) {
        vm.addDirective('fullpage', fullpage);
        vm.addDirective('highlight', highlight);
    }
};

var modelApp = function () {

    var model = {

        mainNavbar: {
            brand: {
                href: '/',
                image: '/giotto-banner.svg'
            },
            theme: 'navbar-dark bg-inverse',
            items: [{
                href: '/examples',
                title: 'examples',
                'class': 'float-xs-right'
            }]
        }
    };

    return model;
};

d3.viewReady(start);

// Start the application
function start() {

    // Build the model-view pair
    var vm = d3.view({
        model: modelApp()
    });
    //
    // Mount the UI
    vm.use(components).use(directives).mount('body');
}

})));
