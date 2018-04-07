'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var debug = _interopDefault(require('debug'));
var fs = require('fs');
var path = require('path');
var express = _interopDefault(require('express'));
var mime = _interopDefault(require('mime-types'));
var fsExtra = require('fs-extra');
var handlebars = require('handlebars');
var d3View = require('d3-view');
var d3Let = require('d3-let');
var sitemap = require('sitemap');
var glob = _interopDefault(require('glob'));
var program = _interopDefault(require('commander'));
var tcpPortUsed = _interopDefault(require('tcp-port-used'));
var dotenv = _interopDefault(require('dotenv'));

var version = "0.3.1";
var name = "d3-fluid";

const levels = new Map;

levels.add = function (name, config) {
    config.name = name;
    this.set(name, config);
    return this;
};

levels.add('debug', {
    color: 81,
    level: 10
}).add('info', {
    color: 76,
    level: 20
}).add('warning', {
    color: 149,
    level: 220
}).add('error', {
    color: 161,
    level: 161
}).add('critical', {
    color: 38,
    level: 129
});


var getLogger = (name, level) => {
    level = levels.get(level) || levels.get('info');
    const logger = {};
    let db;

    levels.forEach(l => {
        db = debug(`${name} - ${l.name} -`);
        db.color = l.color;
        db.enabled = l.level >= level.level;
        logger[l.name] = db;
    });

    return logger;
};

const CWD = process.cwd();


const defaults = {
    name,
    env: process.env.NODE_ENV || 'production',
    sitemap: true,
    static: ['static'],
    scripts: ['/static/site.js'],
    bodyExtra: [],
    stylesheets: ['/static/site.css']
};


var readConfig = file => {
    let cfg = {},
        path$$1;

    if (file) {
        const filePath = `${CWD}/${file}`;
        if (!fs.existsSync(filePath))
            getLogger(name).error(`No ${file} file found in website folder!`);
        else {
            path$$1 = path.dirname(filePath);
            cfg = require(filePath);
        }
    }

    if (!path$$1) path$$1 = CWD;

    return Object.assign({}, defaults, cfg, {path: path$$1});
};

var map = obj => {
    if (obj && obj.constructor === Object) obj = Object.entries(obj);
    return new Map(obj);
};

function algolia (app) {
    if (!app.config.algolia.apiKey) {
        app.logger.error('algolia apiKey not available');
        return;
    }
}

var github = {

    context (app, ctx) {
        ctx.meta.github = app.config.github;
    }
};

function tpl(id) {
    return (`
        <!-- Global site tag (gtag.js) - Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${id}');
        </script>
    `);
}


//
//  Add google analytics if required
var google = app => {

    if (app.config.google.analyticsId) {
        app.config.bodyExtra.push(tpl(app.config.google.analyticsId));
    }
};

function icons (app) {
    if (!app.config.icons) return;
}

//
//  Original implementation from https://github.com/facebook/Docusaurus
//
//  MIT License
//  Copyright (c) 2017-present, Facebook, Inc.

// Extract markdown metadata header
function extractMetadata (content) {
    const metadata = {};
    const both = splitHeader(content);
    if (Object.keys(both).length === 0) {
        return {
            metadata, content
        };
    }
    const lines = both.header.split('\n');
    for (let i = 0; i < lines.length - 1; ++i) {
        const keyvalue = lines[i].split(':');
        const key = keyvalue[0].trim();
        let value = keyvalue.slice(1)
            .join(':')
            .trim();
        try {
            value = JSON.parse(value);
        } catch (e) {
            // do nothing
        }
        metadata[key] = value;
    }
    return {
        metadata, content: both.content
    };
}


// split markdown header
function splitHeader(content) {
    // New line characters need to handle all operating systems.
    const lines = content.split(/\r?\n/);
    if (lines[0] !== '---') {
        return {};
    }
    let i = 1;
    for (; i < lines.length - 1; ++i) {
        if (lines[i] === '---') {
            break;
        }
    }
    return {
        header: lines.slice(1, i + 1).join('\n'),
        content: lines.slice(i + 1).join('\n'),
    };
}

//
//  Serve markdown pages matching a pattern
var markdown = {

    init (app) {
        const
            plugins = app.config.markdown.plugins,
            paths = app.config.markdown.paths || [];

        paths.forEach(cfg => {
            const slug = cfg.meta.slug || '';
            app.use(`/${slug}`, markdown$1(app, cfg, plugins));
        });
    },

    context (app, ctx, cfg) {
        if (ctx.name == cfg.meta.index) ctx.title = cfg.title || app.config.title;
        else ctx.title = ctx.name;
        if (ctx.meta) ctx.meta.env = app.config.env;
    }
};


function docTemplate (app, ctx) {
    const css = app.config.stylesheets.slice(),
        scripts = app.config.scripts.map(script => `<script src="${script}"></script>`).join('\n'),
        bodyExtra = app.config.bodyExtra.join('\n'),
        tag = d3Let.pop(ctx.meta, 'template') || 'markdown',
        content = d3Let.pop(ctx, 'content').trim(),
        highlightTheme = d3Let.pop(ctx, 'highlightTheme'),
        ctxStr = JSON.stringify(ctx);
    //
    if (highlightTheme) css.push(`https://unpkg.com/highlightjs/styles/${highlightTheme}.css`);

    const styles = css.map(stylesheet => `<link href="${stylesheet}" media="all" rel="stylesheet" />`).join('\n');

    return (`
<!DOCTYPE html>
<html>
<head>
    <title>${ctx.meta.title}</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${styles}
    <script>var config=${ctxStr}</script>
</head>
<body>
    <div id="root" class="${ctx.meta.slug}">
        <${tag} data-props="${tag}">${content}</${tag}>
    </div>
    ${scripts}
    ${bodyExtra}
</body>
</html>
    `);
}


function renderDoc (app, ctx) {
    ctx.metadata = JSON.stringify(ctx.metadata);
    return docTemplate(app, ctx);
    //const dom = new JSDOM(
    //    docTemplate(ctx),
    //    {runScripts: "dangerously"}
    //);
    //return dom.serialize();
}


//
//  Markdown micro site
function markdown$1 (app, cfg) {
    const mdApp = express().disable('x-powered-by'),
        index = cfg.meta.index;

    mdApp.get('/', async (req, res, next) => {
        await tryFile(index, res, next);
    });

    mdApp.use('/*', async (req, res, next) => {
        await tryFile(req.params[0], res, next);
    });

    app.logger.debug('Markdown micro-site');
    if (app.config.debug) app.logger.debug(JSON.stringify(cfg, null, 4));

    return mdApp;

    async function tryFile (name, res, next) {
        let path$$1 = cfg.meta.path,
            file = path.join(path$$1, name),
            json = false;

        if (!(await fsExtra.exists(file))) {
            const bits = file.split('.');
            json = bits.length > 1 ? bits.pop() === 'json' : false;
            if (json) file = bits.join('');
        }

        if (await fsExtra.exists(file)) {
            const stat = await fsExtra.lstat(file);
            if (stat.isDirectory()) file = path.join(file, index);
        }

        if (app.config.debug)
            app.logger.debug(`try loading from "${file}"`);

        if (!(await fsExtra.exists(file))) {
            file = `${file}.md`;
            if (!(await fsExtra.exists(file))) {
                next();
                return;
            }
        }

        const bits = file.split('.');
        const ext = bits.length > 1 ? bits.pop() : 'txt';
        let text = await fsExtra.readFile(file, 'utf8');

        if (ext === 'md') {
            let context = Object.assign({name}, extractMetadata(text));
            if (!json) {
                context = JSON.parse(JSON.stringify(Object.assign({}, cfg, context)));
                d3Let.pop(context.meta, 'path');
                d3Let.pop(context.meta, 'index');
            } else context.meta = {};

            app.config.plugins.forEach(plugin => {
                if (plugin.context) plugin.context(app, context, cfg);
            });

            // generate table of contents if appropriate
            if (context.content) {
                context.content = handlebars.compile(context.content)(context);

                if (context.content.indexOf(TABLE_OF_CONTENTS_TOKEN) !== -1)
                    context.content = insertTableOfContents(context.content);
            }
            if (!json) text = renderDoc(app, context);
            else {
                res.setHeader('Content-Type', 'application/json');
                text = JSON.stringify(context);
            }
        } else {
            const ct = mime.lookup(ext);
            if (!ct) {
                res.status(404);
                text = 'Not found';
            } else
                res.setHeader('Content-Type', ct);
        }
        return res.send(text);
    }
}


const TABLE_OF_CONTENTS_TOKEN = '<AUTOGENERATED_TABLE_OF_CONTENTS>';


function insertTableOfContents (rawContent) {
    const regexp = /\n###\s+(`.*`.*)\n/g;
    let match;
    const headers = [];
    while ((match = regexp.exec(rawContent))) {
        headers.push(match[1]);
    }

    const tableOfContents = headers
        .map(header => `  - [${header}](#${d3View.viewSlugify(header)})`)
        .join('\n');

    return rawContent.replace(TABLE_OF_CONTENTS_TOKEN, tableOfContents);
}

function resolve (base, path$$1) {
    path$$1 = path.resolve(base, path$$1);
    return clean(`${path$$1}/`);
}


function clean (path$$1) {
    return path$$1.replace(/^\/+/, '/');
}

const mdDefaults = {
    index: 'readme',
    highlightTheme: 'github'
};


function sitemap$1 (app) {

    buildNavigations(app);

    app.get('/sitemap.xml', (req, res) => {
        res.set('Content-Type', 'application/xml');

        sitemap$2(app, xml => {
            res.send(xml);
        });
    });

}

//
//  Build JSON files for site navigation
const buildNavigations = app => {
    var paths = app.config.markdown ? app.config.markdown.paths || [] : [];

    paths.forEach(cfg => {
        cfg.meta = Object.assign({}, mdDefaults, cfg.meta);
        cfg.meta.path = resolve(app.config.path, cfg.meta.path);
        const index = cfg.meta.index || 'readme',
            nav = [];

        fs.readdirSync(cfg.meta.path).forEach(name => {
            var n = name.length-3;
            let file = path.join(cfg.meta.path, name),
                url, meta;

            if (name.substring(n) === '.md') {
                name = name.substring(0, n);
                if (name === index) name = null;
            } else if (fs.lstatSync(file).isDirectory()) {
                file = path.join(file, `${index}.md`);
                if (!fs.existsSync(file)) name = null;
            } else
                name = null;

            if (name) {
                meta = extractMetadata(fs.readFileSync(file, 'utf8')).metadata;
                url = clean("/" + cfg.meta.slug + "/" + name);

                nav.push({
                    href: url,
                    name: name,
                    label: meta.title || name
                });
            }
        });

        fs.writeFileSync(`${cfg.meta.path}nav.json`, JSON.stringify(nav, null, 4));
    });
};


const sitemap$2 = (app, callback) => {
    var paths = app.config.markdown ? app.config.markdown.paths || [] : [];
    app.logger.info('sitemap triggered');
    let urls = [];

    paths.forEach(cfg => {
        var path$$1 = resolve(app.config.path, cfg.meta.path);
        app.logger.debug(path$$1);
        let files = glob.sync(path$$1 + '*.md'),
            url;

        files.forEach(file => {
            file = file.substring(path$$1.length, file.length-3);
            if (file === 'index') file = '';
            url = "/" + cfg.meta.slug + "/" + file;
            url = app.config.baseUrl + url.replace(/^\/+/, '/');
            app.logger.debug(url);
            urls.push({
                url,
                changefreq: 'weekly',
                priority: 0.5
            });
        });
    });

    const sm = sitemap.createSitemap({
        hostname: app.config.url,
        cacheTime: 600 * 1000, // 600 sec - cache purge period
        urls: urls,
    });

    sm.toXML((err, xml) => {
        if (err) {
            app.logger.error(err);
            callback('An error has occured.');
        }
        callback(xml);
    });
};

var static_ = app => {
    app.config.static.forEach(path$$1  => {
        if (typeof path$$1 === 'string')
            app.use(express.static(path$$1));
        else
            app.use(path$$1[0], express.static(path$$1[1]));
    });
};

//
//  Create d3-fluid server application
var createApp = cfg => {
    if (!cfg) cfg = {};
    const app = express().disable('x-powered-by');
    // default plugins
    const plugins = map({static: static_, algolia, github, google, icons, sitemap: sitemap$1, markdown});
    app.config = readConfig(cfg.config);
    app.config.debug = cfg.debug || false;
    app.logger = getLogger(app.config.name, cfg.logLevel);
    if (app.config.debug)
        app.logger.debug(JSON.stringify(app.config, null, 4));

    if (app.config.plugins)
        Object.entries(app.config.plugins).forEach(e => {
            plugins.set(e[0], e[1]);
        });

    app.config.plugins = [];

    plugins.forEach((plugin, name) => {
        if (app.config[name]) {
            if (typeof plugin === 'function') plugin = {init: plugin};
            app.config.plugins.push(plugin);
            if (plugin.init) plugin.init(app);
        }
    });

    return app;
};

var cli = config => {
    dotenv.config();

    config = Object.assign({
        version,
        configFile: process.env.D3_FLUID_CONFIG || 'siteConfig.js',
        plugins: [serve]
    }, config);

    program
        .version(config.version)
        .usage("[COMMAND] [options]");

    config.plugins.forEach(plugin => {
        plugin(config);
    });

    return program;
};

//
//  Serve command
const serve = config => {

    config = Object.assign({
        port: +(process.env.D3_FLUID_PORT || 9020)
    }, config);

    program
        .command('serve')
        .usage("[options] [file]")
        .description("starts the web server")
        .option('-p, --port <number>', 'Specify port number', config.port)
        .option('-c, --config <file>', 'Specify config file', config.configFile)
        .option("--log-level <name>", "logging level", "info")
        .option("--debug", "debug mode", false)
        .action(function () {
            const app = createApp(this);
            tcpPortUsed.check(this.port, 'localhost').then(inUse => {
                if (inUse) {
                    app.logger.error(`port ${this.port} is in use`);
                    process.exit(1);
                } else {
                    app.listen(this.port, () => {
                        app.logger.warning(`starting ${app.config.name} server on port ${this.port}`);
                    });
                }
            }).catch(err => {
                app.logger.error(err);
            });
        });
};

exports.cli = cli;
exports.createApp = createApp;
//# sourceMappingURL=d3-fluid-server.js.map
