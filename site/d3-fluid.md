# d3-fluid
Reactive data visualization components

[![CircleCI](https://circleci.com/gh/quantmind/d3-fluid.svg?style=svg&circle-token=a224bfec44b5c4ea2457d374283302b0902418f5)](https://circleci.com/gh/quantmind/d3-fluid)
[![Dependency Status](https://david-dm.org/quantmind/d3-fluid.svg)](https://david-dm.org/quantmind/d3-fluid)
[![devDependency Status](https://david-dm.org/quantmind/d3-fluid/dev-status.svg)](https://david-dm.org/quantmind/d3-fluid#info=devDependencies)

[Coverage][]

**PRE ALPHA - DONT USE IT**

This is a [d3 plugin](https://bost.ocks.org/mike/d3-plugin/) containing
reactive data visualization components.

## Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installing](#installing)
- [Design](#design)
  - [Plot design](#plot-design)
  - [Layer design](#layer-design)
  - [Geometric objects](#geometric-objects)
  - [Statistical transformation](#statistical-transformation)
- [dataStore](#datastore)
- [Javascript API](#javascript-api)
  - [Paper](#paper)
    - [paper.size](#papersize)
    - [paper.height](#paperheight)
    - [paper.width](#paperwidth)
    - [paper.addPlot(options)](#paperaddplotoptions)
    - [paper.clear()](#paperclear)
    - [paper.draw()](#paperdraw)
    - [paper.resize([size])](#paperresizesize)
  - [Plot](#plot)
    - [plot.coord](#plotcoord)
    - [plot.layers](#plotlayers)
    - [plot.name](#plotname)
    - [plot.paper](#plotpaper)
    - [plot.scales](#plotscales)
    - [plot.type](#plottype)
    - [plot.addLayer(options)](#plotaddlayeroptions)
    - [plot.addScale(options)](#plotaddscaleoptions)
    - [plot.scaled(mapping, data, scale)](#plotscaledmapping-data-scale)
    - [fluidPlots.add(type, options)](#fluidplotsaddtype-options)
  - [Layer](#layer)
    - [layer.draw(plot, series)](#layerdrawplot-series)
    - [fluidLayers.add(name, prototype)](#fluidlayersaddname-prototype)
  - [dataStore](#datastore-1)
    - [store.series](#storeseries)
    - [store.size()](#storesize)
- [References](#references)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Installing

If you use [NPM](https://www.npmjs.com/package/d3-fluid), ``npm install d3-fluid``.
Otherwise, download the latest release.
AMD, CommonJS, and vanilla environments are supported. In vanilla, a d3 global is exported.
Try [d3-fluid](https://runkit.com/npm/d3-fluid) in your browser.
```javascript
<script src="https://d3js.org/d3-array.v1.min.js"></script>
<script src="https://d3js.org/d3-collection.v1.min.js"></script>
<script src="https://d3js.org/d3-color.v1.min.js"></script>
<script src="https://d3js.org/d3-dispatch.v1.min.js"></script>
<script src="https://d3js.org/d3-ease.v1.min.js"></script>
<script src="https://d3js.org/d3-selection.v1.min.js"></script>
<script src="https://d3js.org/d3-timer.v1.min.js"></script>
<script src="https://d3js.org/d3-array.v1.min.js"></script>
<script src="https://d3js.org/d3-interpolate.v1.min.js"></script>
<script src="https://d3js.org/d3-transition.v1.min.js"></script>
<script src="https://giottojs.org/latest/d3-let.min.js"></script>
<script src="https://giottojs.org/latest/d3-view.min.js"></script>
<script src="https://giottojs.org/latest/d3-fluid.min.js"></script>
```

## Design

The paper is a container of plots.
The following components make up a paper:

* A default data serie name from the [dataStore][] container
* One background layer for plot annotation such as *background* and *grid*
* One or more layers
* One foreground layer for user interactions (canvas paper only)

### Plot design

* One or more layers
* One scale for each aesthetic mapping used
* A coordinate system

A **scale** controls the mapping from data to aesthetic attributes, and so we need one scale
for each aesthetic property used in a layer. Scales are common across layers to ensure a
consistent mapping from data to aesthetics.

A plot JSON document:
```javascript
{
    "layers": [],
    "coord": "cartesian"
}
```

### Layer design

A layer is defined by:

* Data, specifically the name of the serie in the [dataStore][] container
* Aesthetics and data mapping
* A statistical transformation (**stat**)
* A geometric object (**geom**)

For example a scatterplot layer requires:

* Data
* Aesthetics and mapping: *x*, *y*, *size* (optional), *color* (optional)
* **stat** (default *identity*)
* **geom** (default *circle*)

### Geometric objects

Controls the type of plot that you create.
These objects are abstract components and can be rendered in different
ways. They are general purpose, but they do require certain output from
a **stat**. They can be divided into groups according to their dimensionality:

* 0d: point, text
* 1d: path, line (ordered path)
* 2d: polygon, interval

Each **geom** has an associated default **stat** and each stat as an
associated default geom.

### Statistical transformation

| Stat | default geom | description |
|---|---|---|
| bin | bar | Divide a range into bins and and perform a weighted count of points in each |
| identity | point | Identity transformation f(x) = x |
| smooth | line | Smoothed conditional mean of y (r) given x (theta) |
| summary | bar | Aggregate values of y for given x |

A stat must be location-scale invariant:
```
f(x+a) = f(x)+a and f(bx) = b f(x)
```
A stat takes a dataset as input and returns a dataset as output, and so a stat can add new
variables to the original dataset.

A source of many statistics is the [d3-array][] library.

## dataStore

The datastore object is at the core of the data retrieval and manipulation:
```javascript
var ds = d3.dataStore();
```
It contains a mapping of data provided by one or more data providers.

<a name="user-content-datastore-size" href="#datastore-size">#</a> dataStore.<b>size</b>()

Number of data providers registered with this data store.

<a name="user-content-datastore-provider" href="#datastore-provider">#</a> dataStore.<b>provider</b>(<i>name</i>, [<i>provider</i>])

If *provider* is specified, sets a new provider for the specified *name* and return this dataStore.
If a provider was already registered for the same *name*, the existing provider is removed. If
*provider* is *null*, removes the current provider for the specified *name*, if any.
If *provider* is not specified, returns the provider registered with *name* if any.

<a name="user-content-datastore-getList" href="#datastore-getlist">#</a> dataStore.<b>getlist</b>(<i>name</i>, [<i>params</i>])

Fetch data from a registered data provider at *name* and return a [Promise][].
If no data provider is registered for the given name, the promise resolve in an empty list.

## Javascript API

### Paper

#### paper.size

Size of the paper ``[width, height]`` in pixels.

#### paper.height

Width of the paper in pixels, same as ``paper.size[1]``.

#### paper.width

Width of the paper in pixels, same as ``paper.size[0]``.


#### paper.addPlot(options)

#### paper.clear()

Clear the paper, always called when re-drawing the paper

#### paper.draw()

Draw or re-draw the paper

#### paper.resize([size])

Resize the paper if it needs resizing


### Plot

#### plot.coord

The coordinate system of the plot.

#### plot.layers

Array of [layers](#layer) which define the plot.

#### plot.name

Name of the plot

#### plot.paper

The [paper][] the plot belongs to

#### plot.scales

A map of scales available in the plot.
```javascript
plot.scales.get('x');       //  x scale
plot.scales.get('color');   //  color scale
```

#### plot.type

Type of plot: `scatter`, `line`, `linesp`, `bar`, `pie`, `area`

#### plot.addLayer(options)

Add a new layer object to the plot

#### plot.addScale(options)

Add a new scale object to the plot

#### plot.scaled(mapping, data, scale)

Calculate a ``mapping`` from the ``data`` and apply a given ``scale``.

#### fluidPlots.add(type, options)

Add a new custom plot to the plot collections, *type* is string identifying
the new plot type while `options` is an object used for customising the
new plot type.


### Layer

#### layer.draw(plot, series)

Method called by the **plot** every time it needs to redraw the layer.

#### fluidLayers.add(name, prototype)

Add a new layer to library, The new layer is accessed via
```javascript
fluidLayers.get(name)
```

### dataStore

#### store.series

A d3-map of series (data providers)

#### store.size()

Number of series (data providers) in the data store


## References

* [A Layered Grammar of Graphics](https://assets.fluidily.com/references/wickham-layered-grammar.pdf)


[Coverage]: https://circleci.com/api/v1/project/quantmind/d3-fluid/latest/artifacts/0/$CIRCLE_ARTIFACTS/coverage/index.html?branch=master&filter=successful
[Promise]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
[dataStore]: #dataStore
[d3-array]: https://github.com/d3/d3-array
[paper]: #paper
