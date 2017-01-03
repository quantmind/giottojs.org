
[TOC]

# Components

## Plot

* One or more layers
* One scale for each aesthetic mapping used
* A coordinate system

## Layer

One or more layers define a [plot][] and each layer is defined by:

* Data, specifically the **name** of the serie in the [dataStore][] container
* Aesthetics and data mapping
* A statistical transformation (**stat**)
* A geometric object (**geom**)

For example a scatterplot layer requires:

* Data
* Aesthetics and mapping: *x*, *y*, *size* (optional), *color* (optional)
* **stat** (default *identity*)
* **geom** (default *circle*)

#### Geometric objects

Controls the type of plot that you create.
These objects are abstract components and can be rendered in different
ways. They are general purpose, but they do require certain output from
a **stat**. They can be divided into groups according to their dimensionality:

* 0d: point, text
* 1d: path, line (ordered path)
* 2d: polygon, interval

Each **geom** has an associated default **stat** and each stat as an
associated default geom.

#### Statistical transformation

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

## Data Store

The data is what turns abstract plots into actual visualizations. The data store
is a mapping of names with array-like data structures. Usually, given an
input of data, the grammar adds additional data structures via statistical transform.

## Paper

The paper is another name for a container of data visualizations.
The following components make up a paper:

* A default data serie name from the [dataStore][] container
* One background layer for plot annotation such as *background* and *grid*
* One or more layers
* One foreground layer for user interactions (canvas paper only)


# API Reference

## Layer

A layer exposes the following API

### layer.draw(plot, paper)

Method called by the plot every time it needs to draw the layer into a **paper**.

### fluidLayers.add(name, prototype)

Add a new layer to library, The new layer is accessed via
```javascript
fluidLayers.get(name)
```

## Plot


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

## References

* [A Layered Grammar of Graphics](https://assets.fluidily.com/references/wickham-layered-grammar.pdf)


[dataStore]: #dataStore
[d3-array]: https://github.com/d3/d3-array
