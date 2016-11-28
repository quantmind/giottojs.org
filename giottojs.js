(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('d3-view'), require('d3-transition'), require('d3-let')) :
    typeof define === 'function' && define.amd ? define(['d3-view', 'd3-transition', 'd3-let'], factory) :
    (factory(global.giotto,global.giotto,global.giotto));
}(this, (function (d3View,d3Transition,d3Let) { 'use strict';

var navbarTpl = "<nav class=\"navbar\" d3-class=\"[theme, ['navbar-fixed-top', fixedTop]]\">\n    <a class=\"navbar-brand\" d3-if=\"brand.title || brand.image\" d3-attr-href=\"brand.href || '#'\" d3-html=\"brand.title\">\n        <img d3-if=\"brand.image\" d3-attr-src=\"brand.image\" d3-attr-alt=\"brand.title\">\n    </a>\n    <ul class=\"nav navbar-nav\">\n        <li d3-for=\"item in items\" class=\"nav-item\" d3-active>\n            <a class=\"nav-link\"\n                d3-attr-href=\"item.href || '#'\"\n                d3-html=\"item.title\"\n                d3-if=\"item.show ? item.show() : true\"\n                d3-on-click=\"item.click ? item.click() : null\"></a>\n        </li>\n    </ul>\n</nav>";

var navbar = {

    model: {
        fixedTop: true,
        theme: "navbar-light bg-faded",
        brand: {},
        items: []
    },

    render: function render() {
        return d3View.viewElement(navbarTpl);
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

    return d3View.viewElement(messagesTpl);
};

function messageEl(data) {

    var level = data.level;
    if (!level) {
        if (data.error) level = 'error';else if (data.success) level = 'success';
    }
    level = levels[level] || level || 'info';
    return d3View.viewElement('<div class="alert alert-' + level + '" role="alert" style="opacity: 0">\n' + data.message + '\n</div>');
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
        if (d3Let.isString(json)) {
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

var modelApp = function () {

    var model = {

        mainNavbar: {
            brand: {
                href: '/',
                image: '/giotto-banner.svg'
            },
            theme: 'navbar-dark bg-inverse'
        }
    };

    return model;
};

d3View.viewReady(start);

// Start the application
function start() {

    // Build the model-view pair
    var vm = d3View.view({
        model: modelApp()
    });

    //
    // Mount the UI
    vm.use(components).mount('body');
}

})));
