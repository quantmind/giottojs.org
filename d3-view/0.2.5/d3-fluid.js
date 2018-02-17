(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-view'), require('d3-view-components'), require('d3-let')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3-view', 'd3-view-components', 'd3-let'], factory) :
	(factory((global.d3 = global.d3 || {}),global.d3,global.d3,global.d3));
}(this, (function (exports,d3View,d3ViewComponents,d3Let) { 'use strict';

var version = "0.2.5";

function viewComponents (vm) {
    vm.use(d3View.viewForms)
        .use(d3View.viewBootstrapForms)
        .use(d3ViewComponents.viewModal)
        .use(d3ViewComponents.viewRouter)
        .use(d3ViewComponents.viewIcons);

    vm.addComponent('markdown', d3ViewComponents.viewMarked);
    vm.addComponent('alerts', d3ViewComponents.viewAlert);
}

function template (ctx) {
    return (`
        <sidebar id="main"
            data-brand="title"
            data-brand-url="/"
            data-sidebar-toggle='sidebarToggle'
            data-primary-items='primaryItems'
            data-navbar-items='[]'
            data-navbar-title="title"
            data-navbar-title-Url="currentUrl">
            <markdown>${ctx.content}</markdown>
            ${ctx.footer}
        </sidebar>
    `);
}


var sidenav = {
    components: {
        sidebar: d3ViewComponents.viewSidebar
    },

    directives: {
        collapse: d3ViewComponents.viewCollapse,
        active: d3ViewComponents.viewActive
    },

    render (props, attrs, el) {
        const
            content = this.select(el).html(),
            sidenav = this.model[this.name] || this.model.$new(),
            footer = '';
        if (!sidenav.primaryItems)
            return this.json('nav.json').then(response => {
                sidenav.$set('primaryItems', response.data);
                return template({content, footer});
            });
        else
            return template({content, footer});
    }
};

var metadata = {

    install (vm, metadata) {
        var head = vm.select('head');
        metadata = d3Let.assign(metadata || {}, head.attr('data-meta'));
        if (!metadata.title) {
            var t = head.select('title');
            metadata.title = t.size() === 1 ? t.text() : '';
        }
        vm.model.metadata = metadata;
        vm.events.on('mounted.metadata', bindMeta);
    }
};


function bindMeta (vm) {
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

function template$1 (ctx) {
    return (`
        <div class="d3-fluid">
            <nav class="navbar navbar-expand-${ctx.collapse}">
                <a class="navbar-brand" href="/" d3-html="navbarBrand"></a>
                <ul class="navbar-nav ml-auto">
                    <li d3-for="item in navigationRight" class="nav-item">
                        <a class="nav-link" d3-attr-href="item.href" d3-html="item.name"></a>
                    </li>
                </ul>
            </nav>
            <markdown>${ctx.content}</markdown>
            ${ctx.footer}
        </div>
    `);
}


var topnav = {
    props: {
        collapse: 'sm'
    },

    render (props, attrs, el) {
        const
            content = this.select(el).html(),
            footer = '',
            ctx = d3Let.assign({content, footer}, props);
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
    const model = root.config ? JSON.parse(root.config) : {},
        props = d3Let.pop(model, 'meta') || {};

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
//# sourceMappingURL=d3-fluid.js.map
