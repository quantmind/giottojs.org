# d3-fluid
Reactive data visualization components

[![CircleCI](https://circleci.com/gh/quantmind/d3-fluid.svg?style=svg&circle-token=a224bfec44b5c4ea2457d374283302b0902418f5)](https://circleci.com/gh/quantmind/d3-fluid)
[![Dependency Status](https://david-dm.org/quantmind/d3-fluid.svg)](https://david-dm.org/quantmind/d3-fluid)
[![devDependency Status](https://david-dm.org/quantmind/d3-fluid/dev-status.svg)](https://david-dm.org/quantmind/d3-fluid#info=devDependencies)

[Coverage][]

This is a [d3 plugin](https://bost.ocks.org/mike/d3-plugin/) containing
reactive data visualization components.

## Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installing](#installing)
- [Graphics Grammar](#graphics-grammar)
  - [Paper](#paper)
  - [Layer](#layer)
- [API Reference](#api-reference)
  - [Components](#components)
  - [dataStore](#datastore)
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

## Layout

### Rows

A row is a layout component and it is only used to store information
about the dashboard layout.

### Columns

A row is composed by one or more columns.


## Paper

The paper is another name for a container of data visualizations.
The following components make up a paper:

* A default data serie name from the [dataStore][] container
* One background layer for plot annotation such as *background* and *grid*
* One or more layers
* One foreground layer for user interactions (canvas paper only)

### Layer
A layer is defined by:

* Data, specifically the name of the serie in the [dataStore][] container
* Marks (aestetics) - data mapping

## API Reference

### Components

### dataStore

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

## References

* [A Layered Grammar of Graphics](https://assets.fluidily.com/references/wickham-layered-grammar.pdf)


[Coverage]: https://circleci.com/api/v1/project/quantmind/d3-fluid/latest/artifacts/0/$CIRCLE_ARTIFACTS/coverage/index.html?branch=master&filter=successful
[Promise]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
[dataStore]: #dataStore
