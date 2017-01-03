// https://github.com/quantmind/giotto Version 0.1.3. Copyright 2016 quantmind.com.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define('d3', ['exports'], factory) :
	(factory((global.d3 = global.d3 || {})));
}(this, (function (exports) { 'use strict';

var ascending = function (a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};

var bisector = function (compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function left(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;else hi = mid;
      }
      return lo;
    },
    right: function right(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;else lo = mid + 1;
      }
      return lo;
    }
  };
};

function ascendingComparator(f) {
  return function (d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;

var descending = function (a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};

var number = function (x) {
  return x === null ? NaN : +x;
};

var variance = function (array, f) {
  var n = array.length,
      m = 0,
      a,
      d,
      s = 0,
      i = -1,
      j = 0;

  if (f == null) {
    while (++i < n) {
      if (!isNaN(a = number(array[i]))) {
        d = a - m;
        m += d / ++j;
        s += d * (a - m);
      }
    }
  } else {
    while (++i < n) {
      if (!isNaN(a = number(f(array[i], i, array)))) {
        d = a - m;
        m += d / ++j;
        s += d * (a - m);
      }
    }
  }

  if (j > 1) return s / (j - 1);
};

var deviation = function (array, f) {
  var v = variance(array, f);
  return v ? Math.sqrt(v) : v;
};

var extent = function (array, f) {
  var i = -1,
      n = array.length,
      a,
      b,
      c;

  if (f == null) {
    while (++i < n) {
      if ((b = array[i]) != null && b >= b) {
        a = c = b;break;
      }
    }while (++i < n) {
      if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
  } else {
    while (++i < n) {
      if ((b = f(array[i], i, array)) != null && b >= b) {
        a = c = b;break;
      }
    }while (++i < n) {
      if ((b = f(array[i], i, array)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
  }

  return [a, c];
};

var array = Array.prototype;

var slice = array.slice;
var map = array.map;

var constant$1 = function (x) {
  return function () {
    return x;
  };
};

var identity = function (x) {
  return x;
};

var sequence = function (start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
};

var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);

var ticks = function (start, stop, count) {
  var step = tickStep(start, stop, count);
  return sequence(Math.ceil(start / step) * step, Math.floor(stop / step) * step + step / 2, // inclusive
  step);
};

function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10) step1 *= 10;else if (error >= e5) step1 *= 5;else if (error >= e2) step1 *= 2;
  return stop < start ? -step1 : step1;
}

var sturges = function (values) {
  return Math.ceil(Math.log(values.length) / Math.LN2) + 1;
};

var histogram = function () {
  var value = identity,
      domain = extent,
      threshold = sturges;

  function histogram(data) {
    var i,
        n = data.length,
        x,
        values = new Array(n);

    for (i = 0; i < n; ++i) {
      values[i] = value(data[i], i, data);
    }

    var xz = domain(values),
        x0 = xz[0],
        x1 = xz[1],
        tz = threshold(values, x0, x1);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) tz = ticks(x0, x1, tz);

    // Remove any thresholds outside the domain.
    var m = tz.length;
    while (tz[0] <= x0) {
      tz.shift(), --m;
    }while (tz[m - 1] >= x1) {
      tz.pop(), --m;
    }var bins = new Array(m + 1),
        bin;

    // Initialize bins.
    for (i = 0; i <= m; ++i) {
      bin = bins[i] = [];
      bin.x0 = i > 0 ? tz[i - 1] : x0;
      bin.x1 = i < m ? tz[i] : x1;
    }

    // Assign data to bins by value, ignoring any outside the domain.
    for (i = 0; i < n; ++i) {
      x = values[i];
      if (x0 <= x && x <= x1) {
        bins[bisectRight(tz, x, 0, m)].push(data[i]);
      }
    }

    return bins;
  }

  histogram.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$1(_), histogram) : value;
  };

  histogram.domain = function (_) {
    return arguments.length ? (domain = typeof _ === "function" ? _ : constant$1([_[0], _[1]]), histogram) : domain;
  };

  histogram.thresholds = function (_) {
    return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant$1(slice.call(_)) : constant$1(_), histogram) : threshold;
  };

  return histogram;
};

var threshold = function (array, p, f) {
  if (f == null) f = number;
  if (!(n = array.length)) return;
  if ((p = +p) <= 0 || n < 2) return +f(array[0], 0, array);
  if (p >= 1) return +f(array[n - 1], n - 1, array);
  var n,
      h = (n - 1) * p,
      i = Math.floor(h),
      a = +f(array[i], i, array),
      b = +f(array[i + 1], i + 1, array);
  return a + (b - a) * (h - i);
};

var freedmanDiaconis = function (values, min, max) {
  values = map.call(values, number).sort(ascending);
  return Math.ceil((max - min) / (2 * (threshold(values, 0.75) - threshold(values, 0.25)) * Math.pow(values.length, -1 / 3)));
};

var scott = function (values, min, max) {
  return Math.ceil((max - min) / (3.5 * deviation(values) * Math.pow(values.length, -1 / 3)));
};

var max = function (array, f) {
  var i = -1,
      n = array.length,
      a,
      b;

  if (f == null) {
    while (++i < n) {
      if ((b = array[i]) != null && b >= b) {
        a = b;break;
      }
    }while (++i < n) {
      if ((b = array[i]) != null && b > a) a = b;
    }
  } else {
    while (++i < n) {
      if ((b = f(array[i], i, array)) != null && b >= b) {
        a = b;break;
      }
    }while (++i < n) {
      if ((b = f(array[i], i, array)) != null && b > a) a = b;
    }
  }

  return a;
};

var mean = function (array, f) {
  var s = 0,
      n = array.length,
      a,
      i = -1,
      j = n;

  if (f == null) {
    while (++i < n) {
      if (!isNaN(a = number(array[i]))) s += a;else --j;
    }
  } else {
    while (++i < n) {
      if (!isNaN(a = number(f(array[i], i, array)))) s += a;else --j;
    }
  }

  if (j) return s / j;
};

var median = function (array, f) {
  var numbers = [],
      n = array.length,
      a,
      i = -1;

  if (f == null) {
    while (++i < n) {
      if (!isNaN(a = number(array[i]))) numbers.push(a);
    }
  } else {
    while (++i < n) {
      if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
    }
  }

  return threshold(numbers.sort(ascending), 0.5);
};

var merge = function (arrays) {
  var n = arrays.length,
      m,
      i = -1,
      j = 0,
      merged,
      array;

  while (++i < n) {
    j += arrays[i].length;
  }merged = new Array(j);

  while (--n >= 0) {
    array = arrays[n];
    m = array.length;
    while (--m >= 0) {
      merged[--j] = array[m];
    }
  }

  return merged;
};

var min = function (array, f) {
  var i = -1,
      n = array.length,
      a,
      b;

  if (f == null) {
    while (++i < n) {
      if ((b = array[i]) != null && b >= b) {
        a = b;break;
      }
    }while (++i < n) {
      if ((b = array[i]) != null && a > b) a = b;
    }
  } else {
    while (++i < n) {
      if ((b = f(array[i], i, array)) != null && b >= b) {
        a = b;break;
      }
    }while (++i < n) {
      if ((b = f(array[i], i, array)) != null && a > b) a = b;
    }
  }

  return a;
};

var pairs = function (array) {
  var i = 0,
      n = array.length - 1,
      p = array[0],
      pairs = new Array(n < 0 ? 0 : n);
  while (i < n) {
    pairs[i] = [p, p = array[++i]];
  }return pairs;
};

var permute = function (array, indexes) {
  var i = indexes.length,
      permutes = new Array(i);
  while (i--) {
    permutes[i] = array[indexes[i]];
  }return permutes;
};

var scan = function (array, compare) {
    if (!(n = array.length)) return;
    var i = 0,
        n,
        j = 0,
        xi,
        xj = array[j];

    if (!compare) compare = ascending;

    while (++i < n) {
        if (compare(xi = array[i], xj) < 0 || compare(xj, xj) !== 0) xj = xi, j = i;
    }if (compare(xj, xj) === 0) return j;
};

var shuffle = function (array, i0, i1) {
  var m = (i1 == null ? array.length : i1) - (i0 = i0 == null ? 0 : +i0),
      t,
      i;

  while (m) {
    i = Math.random() * m-- | 0;
    t = array[m + i0];
    array[m + i0] = array[i + i0];
    array[i + i0] = t;
  }

  return array;
};

var sum = function (array, f) {
  var s = 0,
      n = array.length,
      a,
      i = -1;

  if (f == null) {
    while (++i < n) {
      if (a = +array[i]) s += a;
    } // Note: zero and null are equivalent.
  } else {
    while (++i < n) {
      if (a = +f(array[i], i, array)) s += a;
    }
  }

  return s;
};

var transpose = function (matrix) {
  if (!(n = matrix.length)) return [];
  for (var i = -1, m = min(matrix, length), transpose = new Array(m); ++i < m;) {
    for (var j = -1, n, row = transpose[i] = new Array(n); ++j < n;) {
      row[j] = matrix[j][i];
    }
  }
  return transpose;
};

function length(d) {
  return d.length;
}

var zip = function () {
  return transpose(arguments);
};

var prefix = "$";

function Map() {}

Map.prototype = map$1.prototype = {
  constructor: Map,
  has: function has(key) {
    return prefix + key in this;
  },
  get: function get(key) {
    return this[prefix + key];
  },
  set: function set(key, value) {
    this[prefix + key] = value;
    return this;
  },
  remove: function remove(key) {
    var property = prefix + key;
    return property in this && delete this[property];
  },
  clear: function clear() {
    for (var property in this) {
      if (property[0] === prefix) delete this[property];
    }
  },
  keys: function keys() {
    var keys = [];
    for (var property in this) {
      if (property[0] === prefix) keys.push(property.slice(1));
    }return keys;
  },
  values: function values() {
    var values = [];
    for (var property in this) {
      if (property[0] === prefix) values.push(this[property]);
    }return values;
  },
  entries: function entries() {
    var entries = [];
    for (var property in this) {
      if (property[0] === prefix) entries.push({ key: property.slice(1), value: this[property] });
    }return entries;
  },
  size: function size() {
    var size = 0;
    for (var property in this) {
      if (property[0] === prefix) ++size;
    }return size;
  },
  empty: function empty() {
    for (var property in this) {
      if (property[0] === prefix) return false;
    }return true;
  },
  each: function each(f) {
    for (var property in this) {
      if (property[0] === prefix) f(this[property], property.slice(1), this);
    }
  }
};

function map$1(object, f) {
  var map = new Map();

  // Copy constructor.
  if (object instanceof Map) object.each(function (value, key) {
    map.set(key, value);
  });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) {
        map.set(i, object[i]);
      } else while (++i < n) {
        map.set(f(o = object[i], i, object), o);
      }
    }

    // Convert object to map.
    else if (object) for (var key in object) {
        map.set(key, object[key]);
      }return map;
}

var nest = function () {
  var keys = [],
      _sortKeys = [],
      _sortValues,
      _rollup,
      nest;

  function apply(array, depth, createResult, setResult) {
    if (depth >= keys.length) return _rollup != null ? _rollup(array) : _sortValues != null ? array.sort(_sortValues) : array;

    var i = -1,
        n = array.length,
        key = keys[depth++],
        keyValue,
        value,
        valuesByKey = map$1(),
        values,
        result = createResult();

    while (++i < n) {
      if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
        values.push(value);
      } else {
        valuesByKey.set(keyValue, [value]);
      }
    }

    valuesByKey.each(function (values, key) {
      setResult(result, key, apply(values, depth, createResult, setResult));
    });

    return result;
  }

  function _entries(map, depth) {
    if (++depth > keys.length) return map;
    var array,
        sortKey = _sortKeys[depth - 1];
    if (_rollup != null && depth >= keys.length) array = map.entries();else array = [], map.each(function (v, k) {
      array.push({ key: k, values: _entries(v, depth) });
    });
    return sortKey != null ? array.sort(function (a, b) {
      return sortKey(a.key, b.key);
    }) : array;
  }

  return nest = {
    object: function object(array) {
      return apply(array, 0, createObject, setObject);
    },
    map: function map$1(array) {
      return apply(array, 0, createMap, setMap);
    },
    entries: function entries(array) {
      return _entries(apply(array, 0, createMap, setMap), 0);
    },
    key: function key(d) {
      keys.push(d);return nest;
    },
    sortKeys: function sortKeys(order) {
      _sortKeys[keys.length - 1] = order;return nest;
    },
    sortValues: function sortValues(order) {
      _sortValues = order;return nest;
    },
    rollup: function rollup(f) {
      _rollup = f;return nest;
    }
  };
};

function createObject() {
  return {};
}

function setObject(object, key, value) {
  object[key] = value;
}

function createMap() {
  return map$1();
}

function setMap(map, key, value) {
  map.set(key, value);
}

function Set() {}

var proto = map$1.prototype;

Set.prototype = set$1.prototype = {
  constructor: Set,
  has: proto.has,
  add: function add(value) {
    value += "";
    this[prefix + value] = value;
    return this;
  },
  remove: proto.remove,
  clear: proto.clear,
  values: proto.keys,
  size: proto.size,
  empty: proto.empty,
  each: proto.each
};

function set$1(object, f) {
  var set = new Set();

  // Copy constructor.
  if (object instanceof Set) object.each(function (value) {
    set.add(value);
  });

  // Otherwise, assume it’s an array.
  else if (object) {
      var i = -1,
          n = object.length;
      if (f == null) while (++i < n) {
        set.add(object[i]);
      } else while (++i < n) {
        set.add(f(object[i], i, object));
      }
    }

  return set;
}

var keys$1 = function (map) {
  var keys = [];
  for (var key in map) {
    keys.push(key);
  }return keys;
};

var values$1 = function (map) {
  var values = [];
  for (var key in map) {
    values.push(map[key]);
  }return values;
};

var entries$1 = function (map) {
  var entries = [];
  for (var key in map) {
    entries.push({ key: key, value: map[key] });
  }return entries;
};

var uniform = function (min, max) {
  min = min == null ? 0 : +min;
  max = max == null ? 1 : +max;
  if (arguments.length === 1) max = min, min = 0;else max -= min;
  return function () {
    return Math.random() * max + min;
  };
};

var normal = function (mu, sigma) {
  var x, r;
  mu = mu == null ? 0 : +mu;
  sigma = sigma == null ? 1 : +sigma;
  return function () {
    var y;

    // If available, use the second previously-generated uniform random.
    if (x != null) y = x, x = null;

    // Otherwise, generate a new x and y.
    else do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        r = x * x + y * y;
      } while (!r || r > 1);

    return mu + sigma * y * Math.sqrt(-2 * Math.log(r) / r);
  };
};

var logNormal = function () {
  var randomNormal = normal.apply(this, arguments);
  return function () {
    return Math.exp(randomNormal());
  };
};

var irwinHall = function (n) {
  return function () {
    for (var sum = 0, i = 0; i < n; ++i) {
      sum += Math.random();
    }return sum;
  };
};

var bates = function (n) {
  var randomIrwinHall = irwinHall(n);
  return function () {
    return randomIrwinHall() / n;
  };
};

var exponential = function (lambda) {
  return function () {
    return -Math.log(1 - Math.random()) / lambda;
  };
};

function linear(t) {
  return +t;
}

function quadIn(t) {
  return t * t;
}

function quadOut(t) {
  return t * (2 - t);
}

function quadInOut(t) {
  return ((t *= 2) <= 1 ? t * t : --t * (2 - t) + 1) / 2;
}

function cubicIn(t) {
  return t * t * t;
}

function cubicOut(t) {
  return --t * t * t + 1;
}

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var exponent = 3;

var polyIn = function custom(e) {
  e = +e;

  function polyIn(t) {
    return Math.pow(t, e);
  }

  polyIn.exponent = custom;

  return polyIn;
}(exponent);

var polyOut = function custom(e) {
  e = +e;

  function polyOut(t) {
    return 1 - Math.pow(1 - t, e);
  }

  polyOut.exponent = custom;

  return polyOut;
}(exponent);

var polyInOut = function custom(e) {
  e = +e;

  function polyInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
  }

  polyInOut.exponent = custom;

  return polyInOut;
}(exponent);

var pi = Math.PI;
var halfPi = pi / 2;

function sinIn(t) {
  return 1 - Math.cos(t * halfPi);
}

function sinOut(t) {
  return Math.sin(t * halfPi);
}

function sinInOut(t) {
  return (1 - Math.cos(pi * t)) / 2;
}

function expIn(t) {
  return Math.pow(2, 10 * t - 10);
}

function expOut(t) {
  return 1 - Math.pow(2, -10 * t);
}

function expInOut(t) {
  return ((t *= 2) <= 1 ? Math.pow(2, 10 * t - 10) : 2 - Math.pow(2, 10 - 10 * t)) / 2;
}

function circleIn(t) {
  return 1 - Math.sqrt(1 - t * t);
}

function circleOut(t) {
  return Math.sqrt(1 - --t * t);
}

function circleInOut(t) {
  return ((t *= 2) <= 1 ? 1 - Math.sqrt(1 - t * t) : Math.sqrt(1 - (t -= 2) * t) + 1) / 2;
}

var b1 = 4 / 11;
var b2 = 6 / 11;
var b3 = 8 / 11;
var b4 = 3 / 4;
var b5 = 9 / 11;
var b6 = 10 / 11;
var b7 = 15 / 16;
var b8 = 21 / 22;
var b9 = 63 / 64;
var b0 = 1 / b1 / b1;

function bounceIn(t) {
  return 1 - bounceOut(1 - t);
}

function bounceOut(t) {
  return (t = +t) < b1 ? b0 * t * t : t < b3 ? b0 * (t -= b2) * t + b4 : t < b6 ? b0 * (t -= b5) * t + b7 : b0 * (t -= b8) * t + b9;
}

function bounceInOut(t) {
  return ((t *= 2) <= 1 ? 1 - bounceOut(1 - t) : bounceOut(t - 1) + 1) / 2;
}

var overshoot = 1.70158;

var backIn = function custom(s) {
  s = +s;

  function backIn(t) {
    return t * t * ((s + 1) * t - s);
  }

  backIn.overshoot = custom;

  return backIn;
}(overshoot);

var backOut = function custom(s) {
  s = +s;

  function backOut(t) {
    return --t * t * ((s + 1) * t + s) + 1;
  }

  backOut.overshoot = custom;

  return backOut;
}(overshoot);

var backInOut = function custom(s) {
  s = +s;

  function backInOut(t) {
    return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
  }

  backInOut.overshoot = custom;

  return backInOut;
}(overshoot);

var tau = 2 * Math.PI;
var amplitude = 1;
var period = 0.3;

var elasticIn = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticIn(t) {
    return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
  }

  elasticIn.amplitude = function (a) {
    return custom(a, p * tau);
  };
  elasticIn.period = function (p) {
    return custom(a, p);
  };

  return elasticIn;
}(amplitude, period);

var elasticOut = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function (a) {
    return custom(a, p * tau);
  };
  elasticOut.period = function (p) {
    return custom(a, p);
  };

  return elasticOut;
}(amplitude, period);

var elasticInOut = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticInOut(t) {
    return ((t = t * 2 - 1) < 0 ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p) : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
  }

  elasticInOut.amplitude = function (a) {
    return custom(a, p * tau);
  };
  elasticInOut.period = function (p) {
    return custom(a, p);
  };

  return elasticInOut;
}(amplitude, period);

var area = function (polygon) {
  var i = -1,
      n = polygon.length,
      a,
      b = polygon[n - 1],
      area = 0;

  while (++i < n) {
    a = b;
    b = polygon[i];
    area += a[1] * b[0] - a[0] * b[1];
  }

  return area / 2;
};

var centroid = function (polygon) {
  var i = -1,
      n = polygon.length,
      x = 0,
      y = 0,
      a,
      b = polygon[n - 1],
      c,
      k = 0;

  while (++i < n) {
    a = b;
    b = polygon[i];
    k += c = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * c;
    y += (a[1] + b[1]) * c;
  }

  return k *= 3, [x / k, y / k];
};

// Returns the 2D cross product of AB and AC vectors, i.e., the z-component of
// the 3D cross product in a quadrant I Cartesian coordinate system (+x is
// right, +y is up). Returns a positive value if ABC is counter-clockwise,
// negative if clockwise, and zero if the points are collinear.
var cross = function (a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
};

function lexicographicOrder(a, b) {
    return a[0] - b[0] || a[1] - b[1];
}

// Computes the upper convex hull per the monotone chain algorithm.
// Assumes points.length >= 3, is sorted by x, unique in y.
// Returns an array of indices into points in left-to-right order.
function computeUpperHullIndexes(points) {
    var n = points.length,
        indexes = [0, 1],
        size = 2;

    for (var i = 2; i < n; ++i) {
        while (size > 1 && cross(points[indexes[size - 2]], points[indexes[size - 1]], points[i]) <= 0) {
            --size;
        }indexes[size++] = i;
    }

    return indexes.slice(0, size); // remove popped points
}

var hull = function (points) {
    if ((n = points.length) < 3) return null;

    var i,
        n,
        sortedPoints = new Array(n),
        flippedPoints = new Array(n);

    for (i = 0; i < n; ++i) {
        sortedPoints[i] = [+points[i][0], +points[i][1], i];
    }sortedPoints.sort(lexicographicOrder);
    for (i = 0; i < n; ++i) {
        flippedPoints[i] = [sortedPoints[i][0], -sortedPoints[i][1]];
    }var upperIndexes = computeUpperHullIndexes(sortedPoints),
        lowerIndexes = computeUpperHullIndexes(flippedPoints);

    // Construct the hull polygon, removing possible duplicate endpoints.
    var skipLeft = lowerIndexes[0] === upperIndexes[0],
        skipRight = lowerIndexes[lowerIndexes.length - 1] === upperIndexes[upperIndexes.length - 1],
        hull = [];

    // Add upper hull in right-to-l order.
    // Then add lower hull in left-to-right order.
    for (i = upperIndexes.length - 1; i >= 0; --i) {
        hull.push(points[sortedPoints[upperIndexes[i]][2]]);
    }for (i = +skipLeft; i < lowerIndexes.length - skipRight; ++i) {
        hull.push(points[sortedPoints[lowerIndexes[i]][2]]);
    }return hull;
};

var contains$1 = function (polygon, point) {
  var n = polygon.length,
      p = polygon[n - 1],
      x = point[0],
      y = point[1],
      x0 = p[0],
      y0 = p[1],
      x1,
      y1,
      inside = false;

  for (var i = 0; i < n; ++i) {
    p = polygon[i], x1 = p[0], y1 = p[1];
    if (y1 > y !== y0 > y && x < (x0 - x1) * (y - y1) / (y0 - y1) + x1) inside = !inside;
    x0 = x1, y0 = y1;
  }

  return inside;
};

var length$1 = function (polygon) {
  var i = -1,
      n = polygon.length,
      b = polygon[n - 1],
      xa,
      ya,
      xb = b[0],
      yb = b[1],
      perimeter = 0;

  while (++i < n) {
    xa = xb;
    ya = yb;
    b = polygon[i];
    xb = b[0];
    yb = b[1];
    xa -= xb;
    ya -= yb;
    perimeter += Math.sqrt(xa * xa + ya * ya);
  }

  return perimeter;
};

var pi$1 = Math.PI;
var tau$1 = 2 * pi$1;
var epsilon = 1e-6;
var tauEpsilon = tau$1 - epsilon;

function Path() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null; // end of current subpath
  this._ = "";
}

function path() {
  return new Path();
}

Path.prototype = path.prototype = {
  constructor: Path,
  moveTo: function moveTo(x, y) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
  },
  closePath: function closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._ += "Z";
    }
  },
  lineTo: function lineTo(x, y) {
    this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  quadraticCurveTo: function quadraticCurveTo(x1, y1, x, y) {
    this._ += "Q" + +x1 + "," + +y1 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  bezierCurveTo: function bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._ += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  arcTo: function arcTo(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
    var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon)) {}

      // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
      // Equivalently, is (x1,y1) coincident with (x2,y2)?
      // Or, is the radius zero? Line to (x1,y1).
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
          this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Otherwise, draw an arc!
        else {
            var x20 = x2 - x0,
                y20 = y2 - y0,
                l21_2 = x21 * x21 + y21 * y21,
                l20_2 = x20 * x20 + y20 * y20,
                l21 = Math.sqrt(l21_2),
                l01 = Math.sqrt(l01_2),
                l = r * Math.tan((pi$1 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
                t01 = l / l01,
                t21 = l / l21;

            // If the start tangent is not coincident with (x0,y0), line to.
            if (Math.abs(t01 - 1) > epsilon) {
              this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
            }

            this._ += "A" + r + "," + r + ",0,0," + +(y01 * x20 > x01 * y20) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
          }
  },
  arc: function arc(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r;
    var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._ += "M" + x0 + "," + y0;
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
        this._ += "L" + x0 + "," + y0;
      }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
    }

    // Otherwise, draw an arc!
    else {
        if (da < 0) da = da % tau$1 + tau$1;
        this._ += "A" + r + "," + r + ",0," + +(da >= pi$1) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
      }
  },
  rect: function rect(x, y, w, h) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + +w + "v" + +h + "h" + -w + "Z";
  },
  toString: function toString() {
    return this._;
  }
};

var tree_add = function (d) {
  var x = +this._x.call(null, d),
      y = +this._y.call(null, d);
  return add$1(this.cover(x, y), x, y, d);
};

function add$1(tree, x, y, d) {
  if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

  var parent,
      node = tree._root,
      leaf = { data: d },
      x0 = tree._x0,
      y0 = tree._y0,
      x1 = tree._x1,
      y1 = tree._y1,
      xm,
      ym,
      xp,
      yp,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return tree._root = leaf, tree;

  // Find the existing leaf for the new point, or add it.
  while (node.length) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm;else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym;else y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
  }

  // Is the new point is exactly coincident with the existing point?
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

  // Otherwise, split the leaf node until the old and new point are separated.
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm;else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym;else y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | xp >= xm));
  return parent[j] = node, parent[i] = leaf, tree;
}

function addAll(data) {
  var d,
      i,
      n = data.length,
      x,
      y,
      xz = new Array(n),
      yz = new Array(n),
      x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

  // Compute the points and their extent.
  for (i = 0; i < n; ++i) {
    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
    xz[i] = x;
    yz[i] = y;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  // If there were no (valid) points, inherit the existing extent.
  if (x1 < x0) x0 = this._x0, x1 = this._x1;
  if (y1 < y0) y0 = this._y0, y1 = this._y1;

  // Expand the tree to cover the new points.
  this.cover(x0, y0).cover(x1, y1);

  // Add the new points.
  for (i = 0; i < n; ++i) {
    add$1(this, xz[i], yz[i], data[i]);
  }

  return this;
}

var tree_cover = function (x, y) {
  if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

  var x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1;

  // If the quadtree has no extent, initialize them.
  // Integer extent are necessary so that if we later double the extent,
  // the existing quadrant boundaries don’t change due to floating point error!
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x)) + 1;
    y1 = (y0 = Math.floor(y)) + 1;
  }

  // Otherwise, double repeatedly to cover.
  else if (x0 > x || x > x1 || y0 > y || y > y1) {
      var z = x1 - x0,
          node = this._root,
          parent,
          i;

      switch (i = (y < (y0 + y1) / 2) << 1 | x < (x0 + x1) / 2) {
        case 0:
          {
            do {
              parent = new Array(4), parent[i] = node, node = parent;
            } while ((z *= 2, x1 = x0 + z, y1 = y0 + z, x > x1 || y > y1));
            break;
          }
        case 1:
          {
            do {
              parent = new Array(4), parent[i] = node, node = parent;
            } while ((z *= 2, x0 = x1 - z, y1 = y0 + z, x0 > x || y > y1));
            break;
          }
        case 2:
          {
            do {
              parent = new Array(4), parent[i] = node, node = parent;
            } while ((z *= 2, x1 = x0 + z, y0 = y1 - z, x > x1 || y0 > y));
            break;
          }
        case 3:
          {
            do {
              parent = new Array(4), parent[i] = node, node = parent;
            } while ((z *= 2, x0 = x1 - z, y0 = y1 - z, x0 > x || y0 > y));
            break;
          }
      }

      if (this._root && this._root.length) this._root = node;
    }

    // If the quadtree covers the point already, just return.
    else return this;

  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
};

var tree_data = function () {
  var data = [];
  this.visit(function (node) {
    if (!node.length) do {
      data.push(node.data);
    } while (node = node.next);
  });
  return data;
};

var tree_extent = function (_) {
    return arguments.length ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1]) : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
};

var Quad = function (node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
};

var tree_find = function (x, y, radius) {
  var data,
      x0 = this._x0,
      y0 = this._y0,
      x1,
      y1,
      x2,
      y2,
      x3 = this._x1,
      y3 = this._y1,
      quads = [],
      node = this._root,
      q,
      i;

  if (node) quads.push(new Quad(node, x0, y0, x3, y3));
  if (radius == null) radius = Infinity;else {
    x0 = x - radius, y0 = y - radius;
    x3 = x + radius, y3 = y + radius;
    radius *= radius;
  }

  while (q = quads.pop()) {

    // Stop searching if this quadrant can’t contain a closer node.
    if (!(node = q.node) || (x1 = q.x0) > x3 || (y1 = q.y0) > y3 || (x2 = q.x1) < x0 || (y2 = q.y1) < y0) continue;

    // Bisect the current quadrant.
    if (node.length) {
      var xm = (x1 + x2) / 2,
          ym = (y1 + y2) / 2;

      quads.push(new Quad(node[3], xm, ym, x2, y2), new Quad(node[2], x1, ym, xm, y2), new Quad(node[1], xm, y1, x2, ym), new Quad(node[0], x1, y1, xm, ym));

      // Visit the closest quadrant first.
      if (i = (y >= ym) << 1 | x >= xm) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    }

    // Visit this point. (Visiting coincident points isn’t necessary!)
    else {
        var dx = x - +this._x.call(null, node.data),
            dy = y - +this._y.call(null, node.data),
            d2 = dx * dx + dy * dy;
        if (d2 < radius) {
          var d = Math.sqrt(radius = d2);
          x0 = x - d, y0 = y - d;
          x3 = x + d, y3 = y + d;
          data = node.data;
        }
      }
  }

  return data;
};

var tree_remove = function (d) {
  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

  var parent,
      node = this._root,
      retainer,
      previous,
      next,
      x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1,
      x,
      y,
      xm,
      ym,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return this;

  // Find the leaf node for the point.
  // While descending, also retain the deepest parent with a non-removed sibling.
  if (node.length) while (true) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm;else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym;else y1 = ym;
    if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
    if (!node.length) break;
    if (parent[i + 1 & 3] || parent[i + 2 & 3] || parent[i + 3 & 3]) retainer = parent, j = i;
  }

  // Find the point to remove.
  while (node.data !== d) {
    if (!(previous = node, node = node.next)) return this;
  }if (next = node.next) delete node.next;

  // If there are multiple coincident points, remove just the point.
  if (previous) return next ? previous.next = next : delete previous.next, this;

  // If this is the root point, remove it.
  if (!parent) return this._root = next, this;

  // Remove this leaf.
  next ? parent[i] = next : delete parent[i];

  // If the parent now contains exactly one leaf, collapse superfluous parents.
  if ((node = parent[0] || parent[1] || parent[2] || parent[3]) && node === (parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
    if (retainer) retainer[j] = node;else this._root = node;
  }

  return this;
};

function removeAll(data) {
  for (var i = 0, n = data.length; i < n; ++i) {
    this.remove(data[i]);
  }return this;
}

var tree_root = function () {
  return this._root;
};

var tree_size = function () {
  var size = 0;
  this.visit(function (node) {
    if (!node.length) do {
      ++size;
    } while (node = node.next);
  });
  return size;
};

var tree_visit = function (callback) {
  var quads = [],
      q,
      node = this._root,
      child,
      x0,
      y0,
      x1,
      y1;
  if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2,
          ym = (y0 + y1) / 2;
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
    }
  }
  return this;
};

var tree_visitAfter = function (callback) {
  var quads = [],
      next = [],
      q;
  if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child,
          x0 = q.x0,
          y0 = q.y0,
          x1 = q.x1,
          y1 = q.y1,
          xm = (x0 + x1) / 2,
          ym = (y0 + y1) / 2;
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
};

function defaultX(d) {
  return d[0];
}

var tree_x = function (_) {
  return arguments.length ? (this._x = _, this) : this._x;
};

function defaultY(d) {
  return d[1];
}

var tree_y = function (_) {
  return arguments.length ? (this._y = _, this) : this._y;
};

function quadtree(nodes, x, y) {
  var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}

function Quadtree(x, y, x0, y0, x1, y1) {
  this._x = x;
  this._y = y;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = undefined;
}

function leaf_copy(leaf) {
  var copy = { data: leaf.data },
      next = copy;
  while (leaf = leaf.next) {
    next = next.next = { data: leaf.data };
  }return copy;
}

var treeProto = quadtree.prototype = Quadtree.prototype;

treeProto.copy = function () {
  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
      node = this._root,
      nodes,
      child;

  if (!node) return copy;

  if (!node.length) return copy._root = leaf_copy(node), copy;

  nodes = [{ source: node, target: copy._root = new Array(4) }];
  while (node = nodes.pop()) {
    for (var i = 0; i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length) nodes.push({ source: child, target: node.target[i] = new Array(4) });else node.target[i] = leaf_copy(child);
      }
    }
  }

  return copy;
};

treeProto.add = tree_add;
treeProto.addAll = addAll;
treeProto.cover = tree_cover;
treeProto.data = tree_data;
treeProto.extent = tree_extent;
treeProto.find = tree_find;
treeProto.remove = tree_remove;
treeProto.removeAll = removeAll;
treeProto.root = tree_root;
treeProto.size = tree_size;
treeProto.visit = tree_visit;
treeProto.visitAfter = tree_visitAfter;
treeProto.x = tree_x;
treeProto.y = tree_y;

var constant$2 = function (x) {
  return function constant() {
    return x;
  };
};

var epsilon$1 = 1e-12;
var pi$2 = Math.PI;
var halfPi$1 = pi$2 / 2;
var tau$2 = 2 * pi$2;

function arcInnerRadius(d) {
  return d.innerRadius;
}

function arcOuterRadius(d) {
  return d.outerRadius;
}

function arcStartAngle(d) {
  return d.startAngle;
}

function arcEndAngle(d) {
  return d.endAngle;
}

function arcPadAngle(d) {
  return d && d.padAngle; // Note: optional!
}

function asin(x) {
  return x >= 1 ? halfPi$1 : x <= -1 ? -halfPi$1 : Math.asin(x);
}

function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0,
      y10 = y1 - y0,
      x32 = x3 - x2,
      y32 = y3 - y2,
      t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / (y32 * x10 - x32 * y10);
  return [x0 + t * x10, y0 + t * y10];
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1,
      y01 = y0 - y1,
      lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01),
      ox = lo * y01,
      oy = -lo * x01,
      x11 = x0 + ox,
      y11 = y0 + oy,
      x10 = x1 + ox,
      y10 = y1 + oy,
      x00 = (x11 + x10) / 2,
      y00 = (y11 + y10) / 2,
      dx = x10 - x11,
      dy = y10 - y11,
      d2 = dx * dx + dy * dy,
      r = r1 - rc,
      D = x11 * y10 - x10 * y11,
      d = (dy < 0 ? -1 : 1) * Math.sqrt(Math.max(0, r * r * d2 - D * D)),
      cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2,
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx0 = cx0 - x00,
      dy0 = cy0 - y00,
      dx1 = cx1 - x00,
      dy1 = cy1 - y00;

  // Pick the closer of the two intersection points.
  // TODO Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1)
  };
}

var arc$1 = function () {
  var innerRadius = arcInnerRadius,
      outerRadius = arcOuterRadius,
      cornerRadius = constant$2(0),
      padRadius = null,
      startAngle = arcStartAngle,
      endAngle = arcEndAngle,
      padAngle = arcPadAngle,
      context = null;

  function arc() {
    var buffer,
        r,
        r0 = +innerRadius.apply(this, arguments),
        r1 = +outerRadius.apply(this, arguments),
        a0 = startAngle.apply(this, arguments) - halfPi$1,
        a1 = endAngle.apply(this, arguments) - halfPi$1,
        da = Math.abs(a1 - a0),
        cw = a1 > a0;

    if (!context) context = buffer = path();

    // Ensure that the outer radius is always larger than the inner radius.
    if (r1 < r0) r = r1, r1 = r0, r0 = r;

    // Is it a point?
    if (!(r1 > epsilon$1)) context.moveTo(0, 0);

    // Or is it a circle or annulus?
    else if (da > tau$2 - epsilon$1) {
        context.moveTo(r1 * Math.cos(a0), r1 * Math.sin(a0));
        context.arc(0, 0, r1, a0, a1, !cw);
        if (r0 > epsilon$1) {
          context.moveTo(r0 * Math.cos(a1), r0 * Math.sin(a1));
          context.arc(0, 0, r0, a1, a0, cw);
        }
      }

      // Or is it a circular or annular sector?
      else {
          var a01 = a0,
              a11 = a1,
              a00 = a0,
              a10 = a1,
              da0 = da,
              da1 = da,
              ap = padAngle.apply(this, arguments) / 2,
              rp = ap > epsilon$1 && (padRadius ? +padRadius.apply(this, arguments) : Math.sqrt(r0 * r0 + r1 * r1)),
              rc = Math.min(Math.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
              rc0 = rc,
              rc1 = rc,
              t0,
              t1;

          // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
          if (rp > epsilon$1) {
            var p0 = asin(rp / r0 * Math.sin(ap)),
                p1 = asin(rp / r1 * Math.sin(ap));
            if ((da0 -= p0 * 2) > epsilon$1) p0 *= cw ? 1 : -1, a00 += p0, a10 -= p0;else da0 = 0, a00 = a10 = (a0 + a1) / 2;
            if ((da1 -= p1 * 2) > epsilon$1) p1 *= cw ? 1 : -1, a01 += p1, a11 -= p1;else da1 = 0, a01 = a11 = (a0 + a1) / 2;
          }

          var x01 = r1 * Math.cos(a01),
              y01 = r1 * Math.sin(a01),
              x10 = r0 * Math.cos(a10),
              y10 = r0 * Math.sin(a10);

          // Apply rounded corners?
          if (rc > epsilon$1) {
            var x11 = r1 * Math.cos(a11),
                y11 = r1 * Math.sin(a11),
                x00 = r0 * Math.cos(a00),
                y00 = r0 * Math.sin(a00);

            // Restrict the corner radius according to the sector angle.
            if (da < pi$2) {
              var oc = da0 > epsilon$1 ? intersect(x01, y01, x00, y00, x11, y11, x10, y10) : [x10, y10],
                  ax = x01 - oc[0],
                  ay = y01 - oc[1],
                  bx = x11 - oc[0],
                  by = y11 - oc[1],
                  kc = 1 / Math.sin(Math.acos((ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))) / 2),
                  lc = Math.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
              rc0 = Math.min(rc, (r0 - lc) / (kc - 1));
              rc1 = Math.min(rc, (r1 - lc) / (kc + 1));
            }
          }

          // Is the sector collapsed to a line?
          if (!(da1 > epsilon$1)) context.moveTo(x01, y01);

          // Does the sector’s outer ring have rounded corners?
          else if (rc1 > epsilon$1) {
              t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
              t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

              context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

              // Have the corners merged?
              if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, Math.atan2(t0.y01, t0.x01), Math.atan2(t1.y01, t1.x01), !cw);

              // Otherwise, draw the two corners and the ring.
              else {
                  context.arc(t0.cx, t0.cy, rc1, Math.atan2(t0.y01, t0.x01), Math.atan2(t0.y11, t0.x11), !cw);
                  context.arc(0, 0, r1, Math.atan2(t0.cy + t0.y11, t0.cx + t0.x11), Math.atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
                  context.arc(t1.cx, t1.cy, rc1, Math.atan2(t1.y11, t1.x11), Math.atan2(t1.y01, t1.x01), !cw);
                }
            }

            // Or is the outer ring just a circular arc?
            else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

          // Is there no inner ring, and it’s a circular sector?
          // Or perhaps it’s an annular sector collapsed due to padding?
          if (!(r0 > epsilon$1) || !(da0 > epsilon$1)) context.lineTo(x10, y10);

          // Does the sector’s inner ring (or point) have rounded corners?
          else if (rc0 > epsilon$1) {
              t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
              t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

              context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

              // Have the corners merged?
              if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, Math.atan2(t0.y01, t0.x01), Math.atan2(t1.y01, t1.x01), !cw);

              // Otherwise, draw the two corners and the ring.
              else {
                  context.arc(t0.cx, t0.cy, rc0, Math.atan2(t0.y01, t0.x01), Math.atan2(t0.y11, t0.x11), !cw);
                  context.arc(0, 0, r0, Math.atan2(t0.cy + t0.y11, t0.cx + t0.x11), Math.atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
                  context.arc(t1.cx, t1.cy, rc0, Math.atan2(t1.y11, t1.x11), Math.atan2(t1.y01, t1.x01), !cw);
                }
            }

            // Or is the inner ring just a circular arc?
            else context.arc(0, 0, r0, a10, a00, cw);
        }

    context.closePath();

    if (buffer) return context = null, buffer + "" || null;
  }

  arc.centroid = function () {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
        a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$2 / 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };

  arc.innerRadius = function (_) {
    return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$2(+_), arc) : innerRadius;
  };

  arc.outerRadius = function (_) {
    return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$2(+_), arc) : outerRadius;
  };

  arc.cornerRadius = function (_) {
    return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$2(+_), arc) : cornerRadius;
  };

  arc.padRadius = function (_) {
    return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), arc) : padRadius;
  };

  arc.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$2(+_), arc) : startAngle;
  };

  arc.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$2(+_), arc) : endAngle;
  };

  arc.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$2(+_), arc) : padAngle;
  };

  arc.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, arc) : context;
  };

  return arc;
};

function Linear(context) {
  this._context = context;
}

Linear.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2; // proceed
      default:
        this._context.lineTo(x, y);break;
    }
  }
};

var curveLinear = function (context) {
  return new Linear(context);
};

function x$1(p) {
  return p[0];
}

function y(p) {
  return p[1];
}

var line = function () {
  var x$$1 = x$1,
      y$$1 = y,
      defined = constant$2(true),
      context = null,
      curve = curveLinear,
      output = null;

  function line(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();else output.lineEnd();
      }
      if (defined0) output.point(+x$$1(d, i, data), +y$$1(d, i, data));
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  line.x = function (_) {
    return arguments.length ? (x$$1 = typeof _ === "function" ? _ : constant$2(+_), line) : x$$1;
  };

  line.y = function (_) {
    return arguments.length ? (y$$1 = typeof _ === "function" ? _ : constant$2(+_), line) : y$$1;
  };

  line.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$2(!!_), line) : defined;
  };

  line.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };

  line.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };

  return line;
};

var area$1 = function () {
  var x0 = x$1,
      x1 = null,
      y0 = constant$2(0),
      y1 = y,
      defined = constant$2(true),
      context = null,
      curve = curveLinear,
      output = null;

  function area(data) {
    var i,
        j,
        k,
        n = data.length,
        d,
        defined0 = false,
        buffer,
        x0z = new Array(n),
        y0z = new Array(n);

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  function arealine() {
    return line().defined(defined).curve(curve).context(context);
  }

  area.x = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$2(+_), x1 = null, area) : x0;
  };

  area.x0 = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$2(+_), area) : x0;
  };

  area.x1 = function (_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), area) : x1;
  };

  area.y = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$2(+_), y1 = null, area) : y0;
  };

  area.y0 = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$2(+_), area) : y0;
  };

  area.y1 = function (_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$2(+_), area) : y1;
  };

  area.lineX0 = area.lineY0 = function () {
    return arealine().x(x0).y(y0);
  };

  area.lineY1 = function () {
    return arealine().x(x0).y(y1);
  };

  area.lineX1 = function () {
    return arealine().x(x1).y(y0);
  };

  area.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$2(!!_), area) : defined;
  };

  area.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };

  area.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };

  return area;
};

var descending$1 = function (a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};

var identity$1 = function (d) {
  return d;
};

var pie = function () {
  var value = identity$1,
      sortValues = descending$1,
      sort = null,
      startAngle = constant$2(0),
      endAngle = constant$2(tau$2),
      padAngle = constant$2(0);

  function pie(data) {
    var i,
        n = data.length,
        j,
        k,
        sum = 0,
        index = new Array(n),
        arcs = new Array(n),
        a0 = +startAngle.apply(this, arguments),
        da = Math.min(tau$2, Math.max(-tau$2, endAngle.apply(this, arguments) - a0)),
        a1,
        p = Math.min(Math.abs(da) / n, padAngle.apply(this, arguments)),
        pa = p * (da < 0 ? -1 : 1),
        v;

    for (i = 0; i < n; ++i) {
      if ((v = arcs[index[i] = i] = +value(data[i], i, data)) > 0) {
        sum += v;
      }
    }

    // Optionally sort the arcs by previously-computed values or by data.
    if (sortValues != null) index.sort(function (i, j) {
      return sortValues(arcs[i], arcs[j]);
    });else if (sort != null) index.sort(function (i, j) {
      return sort(data[i], data[j]);
    });

    // Compute the arcs! They are stored in the original data's order.
    for (i = 0, k = sum ? (da - n * pa) / sum : 0; i < n; ++i, a0 = a1) {
      j = index[i], v = arcs[j], a1 = a0 + (v > 0 ? v * k : 0) + pa, arcs[j] = {
        data: data[j],
        index: i,
        value: v,
        startAngle: a0,
        endAngle: a1,
        padAngle: p
      };
    }

    return arcs;
  }

  pie.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$2(+_), pie) : value;
  };

  pie.sortValues = function (_) {
    return arguments.length ? (sortValues = _, sort = null, pie) : sortValues;
  };

  pie.sort = function (_) {
    return arguments.length ? (sort = _, sortValues = null, pie) : sort;
  };

  pie.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$2(+_), pie) : startAngle;
  };

  pie.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$2(+_), pie) : endAngle;
  };

  pie.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$2(+_), pie) : padAngle;
  };

  return pie;
};

var curveRadialLinear = curveRadial(curveLinear);

function Radial(curve) {
  this._curve = curve;
}

Radial.prototype = {
  areaStart: function areaStart() {
    this._curve.areaStart();
  },
  areaEnd: function areaEnd() {
    this._curve.areaEnd();
  },
  lineStart: function lineStart() {
    this._curve.lineStart();
  },
  lineEnd: function lineEnd() {
    this._curve.lineEnd();
  },
  point: function point(a, r) {
    this._curve.point(r * Math.sin(a), r * -Math.cos(a));
  }
};

function curveRadial(curve) {

  function radial(context) {
    return new Radial(curve(context));
  }

  radial._curve = curve;

  return radial;
}

function radialLine(l) {
  var c = l.curve;

  l.angle = l.x, delete l.x;
  l.radius = l.y, delete l.y;

  l.curve = function (_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve;
  };

  return l;
}

var radialLine$1 = function () {
  return radialLine(line().curve(curveRadialLinear));
};

var radialArea = function () {
  var a = area$1().curve(curveRadialLinear),
      c = a.curve,
      x0 = a.lineX0,
      x1 = a.lineX1,
      y0 = a.lineY0,
      y1 = a.lineY1;

  a.angle = a.x, delete a.x;
  a.startAngle = a.x0, delete a.x0;
  a.endAngle = a.x1, delete a.x1;
  a.radius = a.y, delete a.y;
  a.innerRadius = a.y0, delete a.y0;
  a.outerRadius = a.y1, delete a.y1;
  a.lineStartAngle = function () {
    return radialLine(x0());
  }, delete a.lineX0;
  a.lineEndAngle = function () {
    return radialLine(x1());
  }, delete a.lineX1;
  a.lineInnerRadius = function () {
    return radialLine(y0());
  }, delete a.lineY0;
  a.lineOuterRadius = function () {
    return radialLine(y1());
  }, delete a.lineY1;

  a.curve = function (_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve;
  };

  return a;
};

var circle = {
  draw: function draw(context, size) {
    var r = Math.sqrt(size / pi$2);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, tau$2);
  }
};

var cross$1 = {
  draw: function draw(context, size) {
    var r = Math.sqrt(size / 5) / 2;
    context.moveTo(-3 * r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, -3 * r);
    context.lineTo(r, -3 * r);
    context.lineTo(r, -r);
    context.lineTo(3 * r, -r);
    context.lineTo(3 * r, r);
    context.lineTo(r, r);
    context.lineTo(r, 3 * r);
    context.lineTo(-r, 3 * r);
    context.lineTo(-r, r);
    context.lineTo(-3 * r, r);
    context.closePath();
  }
};

var tan30 = Math.sqrt(1 / 3);
var tan30_2 = tan30 * 2;

var diamond = {
  draw: function draw(context, size) {
    var y = Math.sqrt(size / tan30_2),
        x = y * tan30;
    context.moveTo(0, -y);
    context.lineTo(x, 0);
    context.lineTo(0, y);
    context.lineTo(-x, 0);
    context.closePath();
  }
};

var ka = 0.89081309152928522810;
var kr = Math.sin(pi$2 / 10) / Math.sin(7 * pi$2 / 10);
var kx = Math.sin(tau$2 / 10) * kr;
var ky = -Math.cos(tau$2 / 10) * kr;

var star = {
    draw: function draw(context, size) {
        var r = Math.sqrt(size * ka),
            x = kx * r,
            y = ky * r;
        context.moveTo(0, -r);
        context.lineTo(x, y);
        for (var i = 1; i < 5; ++i) {
            var a = tau$2 * i / 5,
                c = Math.cos(a),
                s = Math.sin(a);
            context.lineTo(s * r, -c * r);
            context.lineTo(c * x - s * y, s * x + c * y);
        }
        context.closePath();
    }
};

var square = {
  draw: function draw(context, size) {
    var w = Math.sqrt(size),
        x = -w / 2;
    context.rect(x, x, w, w);
  }
};

var sqrt3 = Math.sqrt(3);

var triangle = {
  draw: function draw(context, size) {
    var y = -Math.sqrt(size / (sqrt3 * 3));
    context.moveTo(0, y * 2);
    context.lineTo(-sqrt3 * y, -y);
    context.lineTo(sqrt3 * y, -y);
    context.closePath();
  }
};

var c$1 = -0.5;
var s = Math.sqrt(3) / 2;
var k = 1 / Math.sqrt(12);
var a = (k / 2 + 1) * 3;

var wye = {
    draw: function draw(context, size) {
        var r = Math.sqrt(size / a),
            x0 = r / 2,
            y0 = r * k,
            x1 = x0,
            y1 = r * k + r,
            x2 = -x1,
            y2 = y1;
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.lineTo(x2, y2);
        context.lineTo(c$1 * x0 - s * y0, s * x0 + c$1 * y0);
        context.lineTo(c$1 * x1 - s * y1, s * x1 + c$1 * y1);
        context.lineTo(c$1 * x2 - s * y2, s * x2 + c$1 * y2);
        context.lineTo(c$1 * x0 + s * y0, c$1 * y0 - s * x0);
        context.lineTo(c$1 * x1 + s * y1, c$1 * y1 - s * x1);
        context.lineTo(c$1 * x2 + s * y2, c$1 * y2 - s * x2);
        context.closePath();
    }
};

var symbols = [circle, cross$1, diamond, square, star, triangle, wye];

var symbol = function () {
  var type = constant$2(circle),
      size = constant$2(64),
      context = null;

  function symbol() {
    var buffer;
    if (!context) context = buffer = path();
    type.apply(this, arguments).draw(context, +size.apply(this, arguments));
    if (buffer) return context = null, buffer + "" || null;
  }

  symbol.type = function (_) {
    return arguments.length ? (type = typeof _ === "function" ? _ : constant$2(_), symbol) : type;
  };

  symbol.size = function (_) {
    return arguments.length ? (size = typeof _ === "function" ? _ : constant$2(+_), symbol) : size;
  };

  symbol.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, symbol) : context;
  };

  return symbol;
};

var noop = function () {};

function _point(that, x, y) {
  that._context.bezierCurveTo((2 * that._x0 + that._x1) / 3, (2 * that._y0 + that._y1) / 3, (that._x0 + 2 * that._x1) / 3, (that._y0 + 2 * that._y1) / 3, (that._x0 + 4 * that._x1 + x) / 6, (that._y0 + 4 * that._y1 + y) / 6);
}

function Basis(context) {
  this._context = context;
}

Basis.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 3:
        _point(this, this._x1, this._y1); // proceed
      case 2:
        this._context.lineTo(this._x1, this._y1);break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6); // proceed
      default:
        _point(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var basis = function (context) {
  return new Basis(context);
};

function BasisClosed(context) {
  this._context = context;
}

BasisClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x2, this._y2);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
          this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x2, this._y2);
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._x2 = x, this._y2 = y;break;
      case 1:
        this._point = 2;this._x3 = x, this._y3 = y;break;
      case 2:
        this._point = 3;this._x4 = x, this._y4 = y;this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6);break;
      default:
        _point(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var basisClosed = function (context) {
  return new BasisClosed(context);
};

function BasisOpen(context) {
  this._context = context;
}

BasisOpen.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;var x0 = (this._x0 + 4 * this._x1 + x) / 6,
            y0 = (this._y0 + 4 * this._y1 + y) / 6;this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0);break;
      case 3:
        this._point = 4; // proceed
      default:
        _point(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var basisOpen = function (context) {
  return new BasisOpen(context);
};

function Bundle(context, beta) {
  this._basis = new Basis(context);
  this._beta = beta;
}

Bundle.prototype = {
  lineStart: function lineStart() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function lineEnd() {
    var x = this._x,
        y = this._y,
        j = x.length - 1;

    if (j > 0) {
      var x0 = x[0],
          y0 = y[0],
          dx = x[j] - x0,
          dy = y[j] - y0,
          i = -1,
          t;

      while (++i <= j) {
        t = i / j;
        this._basis.point(this._beta * x[i] + (1 - this._beta) * (x0 + t * dx), this._beta * y[i] + (1 - this._beta) * (y0 + t * dy));
      }
    }

    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function point(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

var bundle = (function custom(beta) {

  function bundle(context) {
    return beta === 1 ? new Basis(context) : new Bundle(context, beta);
  }

  bundle.beta = function (beta) {
    return custom(+beta);
  };

  return bundle;
})(0.85);

function _point$1(that, x, y) {
  that._context.bezierCurveTo(that._x1 + that._k * (that._x2 - that._x0), that._y1 + that._k * (that._y2 - that._y0), that._x2 + that._k * (that._x1 - x), that._y2 + that._k * (that._y1 - y), that._x2, that._y2);
}

function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

Cardinal.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);break;
      case 3:
        _point$1(this, this._x1, this._y1);break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;this._x1 = x, this._y1 = y;break;
      case 2:
        this._point = 3; // proceed
      default:
        _point$1(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var cardinal = (function custom(tension) {

  function cardinal(context) {
    return new Cardinal(context, tension);
  }

  cardinal.tension = function (tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._x3 = x, this._y3 = y;break;
      case 1:
        this._point = 2;this._context.moveTo(this._x4 = x, this._y4 = y);break;
      case 2:
        this._point = 3;this._x5 = x, this._y5 = y;break;
      default:
        _point$1(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var cardinalClosed = (function custom(tension) {

  function cardinal(context) {
    return new CardinalClosed(context, tension);
  }

  cardinal.tension = function (tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalOpen.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);break;
      case 3:
        this._point = 4; // proceed
      default:
        _point$1(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var cardinalOpen = (function custom(tension) {

  function cardinal(context) {
    return new CardinalOpen(context, tension);
  }

  cardinal.tension = function (tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function _point$2(that, x, y) {
  var x1 = that._x1,
      y1 = that._y1,
      x2 = that._x2,
      y2 = that._y2;

  if (that._l01_a > epsilon$1) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
        n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }

  if (that._l23_a > epsilon$1) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
        m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
  }

  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
}

function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRom.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);break;
      case 3:
        this.point(this._x2, this._y2);break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3; // proceed
      default:
        _point$2(this, x, y);break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRom = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
  }

  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0:
        this._point = 1;this._x3 = x, this._y3 = y;break;
      case 1:
        this._point = 2;this._context.moveTo(this._x4 = x, this._y4 = y);break;
      case 2:
        this._point = 3;this._x5 = x, this._y5 = y;break;
      default:
        _point$2(this, x, y);break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRomClosed = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
  }

  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomOpen.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0:
        this._point = 1;break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);break;
      case 3:
        this._point = 4; // proceed
      default:
        _point$2(this, x, y);break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRomOpen = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
  }

  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function LinearClosed(context) {
  this._context = context;
}

LinearClosed.prototype = {
  areaStart: noop,
  areaEnd: noop,
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._point) this._context.closePath();
  },
  point: function point(x, y) {
    x = +x, y = +y;
    if (this._point) this._context.lineTo(x, y);else this._point = 1, this._context.moveTo(x, y);
  }
};

var linearClosed = function (context) {
  return new LinearClosed(context);
};

function sign(x) {
  return x < 0 ? -1 : 1;
}

// Calculate the slopes of the tangents (Hermite-type interpolation) based on
// the following paper: Steffen, M. 1990. A Simple Method for Monotonic
// Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
// NOV(II), P. 443, 1990.
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0,
      h1 = x2 - that._x1,
      s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
      s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
      p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

// Calculate a one-sided slope.
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}

// According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
// "you can express cubic Hermite interpolation in terms of cubic Bézier curves
// with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
function _point$3(that, t0, t1) {
  var x0 = that._x0,
      y0 = that._y0,
      x1 = that._x1,
      y1 = that._y1,
      dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}

function MonotoneX(context) {
  this._context = context;
}

MonotoneX.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);break;
      case 3:
        _point$3(this, this._t0, slope2(this, this._t0));break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    var t1 = NaN;

    x = +x, y = +y;
    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;_point$3(this, slope2(this, t1 = slope3(this, x, y)), t1);break;
      default:
        _point$3(this, this._t0, t1 = slope3(this, x, y));break;
    }

    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
    this._t0 = t1;
  }
};

function MonotoneY(context) {
  this._context = new ReflectContext(context);
}

(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function (x, y) {
  MonotoneX.prototype.point.call(this, y, x);
};

function ReflectContext(context) {
  this._context = context;
}

ReflectContext.prototype = {
  moveTo: function moveTo(x, y) {
    this._context.moveTo(y, x);
  },
  closePath: function closePath() {
    this._context.closePath();
  },
  lineTo: function lineTo(x, y) {
    this._context.lineTo(y, x);
  },
  bezierCurveTo: function bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._context.bezierCurveTo(y1, x1, y2, x2, y, x);
  }
};

function monotoneX(context) {
  return new MonotoneX(context);
}

function monotoneY(context) {
  return new MonotoneY(context);
}

function Natural(context) {
  this._context = context;
}

Natural.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function lineEnd() {
    var x = this._x,
        y = this._y,
        n = x.length;

    if (n) {
      this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
      if (n === 2) {
        this._context.lineTo(x[1], y[1]);
      } else {
        var px = controlPoints(x),
            py = controlPoints(y);
        for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
        }
      }
    }

    if (this._line || this._line !== 0 && n === 1) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function point(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

// See https://www.particleincell.com/2012/bezier-splines/ for derivation.
function controlPoints(x) {
  var i,
      n = x.length - 1,
      m,
      a = new Array(n),
      b = new Array(n),
      r = new Array(n);
  a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
  for (i = 1; i < n - 1; ++i) {
    a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
  }a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
  for (i = 1; i < n; ++i) {
    m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
  }a[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) {
    a[i] = (r[i] - a[i + 1]) / b[i];
  }b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) {
    b[i] = 2 * x[i + 1] - a[i + 1];
  }return [a, b];
}

var natural = function (context) {
  return new Natural(context);
};

function Step(context, t) {
  this._context = context;
  this._t = t;
}

Step.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2; // proceed
      default:
        {
          if (this._t <= 0) {
            this._context.lineTo(this._x, y);
            this._context.lineTo(x, y);
          } else {
            var x1 = this._x * (1 - this._t) + x * this._t;
            this._context.lineTo(x1, this._y);
            this._context.lineTo(x1, y);
          }
          break;
        }
    }
    this._x = x, this._y = y;
  }
};

var step = function (context) {
  return new Step(context, 0.5);
};

function stepBefore(context) {
  return new Step(context, 0);
}

function stepAfter(context) {
  return new Step(context, 1);
}

var slice$1 = Array.prototype.slice;

var none = function (series, order) {
  if (!((n = series.length) > 1)) return;
  for (var i = 1, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
    s0 = s1, s1 = series[order[i]];
    for (var j = 0; j < m; ++j) {
      s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
    }
  }
};

var none$1 = function (series) {
  var n = series.length,
      o = new Array(n);
  while (--n >= 0) {
    o[n] = n;
  }return o;
};

function stackValue(d, key) {
  return d[key];
}

var stack = function () {
  var keys = constant$2([]),
      order = none$1,
      offset = none,
      value = stackValue;

  function stack(data) {
    var kz = keys.apply(this, arguments),
        i,
        m = data.length,
        n = kz.length,
        sz = new Array(n),
        oz;

    for (i = 0; i < n; ++i) {
      for (var ki = kz[i], si = sz[i] = new Array(m), j = 0, sij; j < m; ++j) {
        si[j] = sij = [0, +value(data[j], ki, j, data)];
        sij.data = data[j];
      }
      si.key = ki;
    }

    for (i = 0, oz = order(sz); i < n; ++i) {
      sz[oz[i]].index = i;
    }

    offset(sz, oz);
    return sz;
  }

  stack.keys = function (_) {
    return arguments.length ? (keys = typeof _ === "function" ? _ : constant$2(slice$1.call(_)), stack) : keys;
  };

  stack.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$2(+_), stack) : value;
  };

  stack.order = function (_) {
    return arguments.length ? (order = _ == null ? none$1 : typeof _ === "function" ? _ : constant$2(slice$1.call(_)), stack) : order;
  };

  stack.offset = function (_) {
    return arguments.length ? (offset = _ == null ? none : _, stack) : offset;
  };

  return stack;
};

var expand = function (series, order) {
  if (!((n = series.length) > 0)) return;
  for (var i, n, j = 0, m = series[0].length, y; j < m; ++j) {
    for (y = i = 0; i < n; ++i) {
      y += series[i][j][1] || 0;
    }if (y) for (i = 0; i < n; ++i) {
      series[i][j][1] /= y;
    }
  }
  none(series, order);
};

var silhouette = function (series, order) {
  if (!((n = series.length) > 0)) return;
  for (var j = 0, s0 = series[order[0]], n, m = s0.length; j < m; ++j) {
    for (var i = 0, y = 0; i < n; ++i) {
      y += series[i][j][1] || 0;
    }s0[j][1] += s0[j][0] = -y / 2;
  }
  none(series, order);
};

var wiggle = function (series, order) {
  if (!((n = series.length) > 0) || !((m = (s0 = series[order[0]]).length) > 0)) return;
  for (var y = 0, j = 1, s0, m, n; j < m; ++j) {
    for (var i = 0, s1 = 0, s2 = 0; i < n; ++i) {
      var si = series[order[i]],
          sij0 = si[j][1] || 0,
          sij1 = si[j - 1][1] || 0,
          s3 = (sij0 - sij1) / 2;
      for (var k = 0; k < i; ++k) {
        var sk = series[order[k]],
            skj0 = sk[j][1] || 0,
            skj1 = sk[j - 1][1] || 0;
        s3 += skj0 - skj1;
      }
      s1 += sij0, s2 += s3 * sij0;
    }
    s0[j - 1][1] += s0[j - 1][0] = y;
    if (s1) y -= s2 / s1;
  }
  s0[j - 1][1] += s0[j - 1][0] = y;
  none(series, order);
};

var ascending$1 = function (series) {
  var sums = series.map(sum$1);
  return none$1(series).sort(function (a, b) {
    return sums[a] - sums[b];
  });
};

function sum$1(series) {
  var s = 0,
      i = -1,
      n = series.length,
      v;
  while (++i < n) {
    if (v = +series[i][1]) s += v;
  }return s;
}

var descending$2 = function (series) {
  return ascending$1(series).reverse();
};

var insideOut = function (series) {
  var n = series.length,
      i,
      j,
      sums = series.map(sum$1),
      order = none$1(series).sort(function (a, b) {
    return sums[b] - sums[a];
  }),
      top = 0,
      bottom = 0,
      tops = [],
      bottoms = [];

  for (i = 0; i < n; ++i) {
    j = order[i];
    if (top < bottom) {
      top += sums[j];
      tops.push(j);
    } else {
      bottom += sums[j];
      bottoms.push(j);
    }
  }

  return bottoms.reverse().concat(tops);
};

var reverse = function (series) {
  return none$1(series).reverse();
};

var define = function (constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) {
    prototype[key] = definition[key];
  }return prototype;
}

function Color() {}

var _darker = 0.7;
var _brighter = 1 / _darker;

var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3 = /^#([0-9a-f]{3})$/;
var reHex6 = /^#([0-9a-f]{6})$/;
var reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$");
var reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$");
var reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$");
var reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$");
var reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$");
var reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  displayable: function displayable() {
    return this.rgb().displayable();
  },
  toString: function toString() {
    return this.rgb() + "";
  }
});

function color(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb(m >> 8 & 0xf | m >> 4 & 0x0f0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
  ) : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
  : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
  : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
  : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
  : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
  : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
  : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
  : named.hasOwnProperty(format) ? rgbn(named[format]) : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb();
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb$1(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb$1, extend(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function rgb$1() {
    return this;
  },
  displayable: function displayable() {
    return 0 <= this.r && this.r <= 255 && 0 <= this.g && this.g <= 255 && 0 <= this.b && this.b <= 255 && 0 <= this.opacity && this.opacity <= 1;
  },
  toString: function toString() {
    var a = this.opacity;a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(") + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.b) || 0)) + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl();
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb$1() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb(h, m1, m2), hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
  },
  displayable: function displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}

var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;

var Kn = 18;
var Xn = 0.950470;
var Yn = 1;
var Zn = 1.088830;
var t0 = 4 / 29;
var t1 = 6 / 29;
var t2 = 3 * t1 * t1;
var t3 = t1 * t1 * t1;

function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) {
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var b = rgb2xyz(o.r),
      a = rgb2xyz(o.g),
      l = rgb2xyz(o.b),
      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}

function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define(Lab, lab, extend(Color, {
  brighter: function brighter(k) {
    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function darker(k) {
    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function rgb() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Rgb(xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
    xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z), xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z), this.opacity);
  }
}));

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  var h = Math.atan2(o.b, o.a) * rad2deg;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hcl, hcl, extend(Color, {
  brighter: function brighter(k) {
    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
  },
  darker: function darker(k) {
    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
  },
  rgb: function rgb() {
    return labConvert(this).rgb();
  }
}));

var A = -0.14861;
var B = +1.78277;
var C = -0.29227;
var D = -0.90649;
var E = +1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;

function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)),
      // NaN if l=0 or l=1
  h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Cubehelix, cubehelix, extend(Color, {
  brighter: function brighter(k) {
    k = k == null ? _brighter : Math.pow(_brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker : Math.pow(_darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(255 * (l + a * (A * cosh + B * sinh)), 255 * (l + a * (C * cosh + D * sinh)), 255 * (l + a * (E * cosh)), this.opacity);
  }
}));

function basis$1(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1,
      t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}

var basis$2 = function (values) {
  var n = values.length - 1;
  return function (t) {
    var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
        v1 = values[i],
        v2 = values[i + 1],
        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis$1((t - i / n) * n, v0, v1, v2, v3);
  };
};

var basisClosed$1 = function (values) {
  var n = values.length;
  return function (t) {
    var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n),
        v0 = values[(i + n - 1) % n],
        v1 = values[i % n],
        v2 = values[(i + 1) % n],
        v3 = values[(i + 2) % n];
    return basis$1((t - i / n) * n, v0, v1, v2, v3);
  };
};

var constant$3 = function (x) {
  return function () {
    return x;
  };
};

function linear$1(a, d) {
  return function (t) {
    return a + t * d;
  };
}

function exponential$1(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear$1(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$3(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function (a, b) {
    return b - a ? exponential$1(a, b, y) : constant$3(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$3(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color$$1 = gamma(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb$1(start)).r, (end = rgb$1(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = color$$1(start.opacity, end.opacity);
    return function (t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

function rgbSpline(spline) {
  return function (colors) {
    var n = colors.length,
        r = new Array(n),
        g = new Array(n),
        b = new Array(n),
        i,
        color$$1;
    for (i = 0; i < n; ++i) {
      color$$1 = rgb$1(colors[i]);
      r[i] = color$$1.r || 0;
      g[i] = color$$1.g || 0;
      b[i] = color$$1.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color$$1.opacity = 1;
    return function (t) {
      color$$1.r = r(t);
      color$$1.g = g(t);
      color$$1.b = b(t);
      return color$$1 + "";
    };
  };
}

var rgbBasis = rgbSpline(basis$2);
var rgbBasisClosed = rgbSpline(basisClosed$1);

var array$1 = function (a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) {
    x[i] = interpolateValue(a[i], b[i]);
  }for (; i < nb; ++i) {
    c[i] = b[i];
  }return function (t) {
    for (i = 0; i < na; ++i) {
      c[i] = x[i](t);
    }return c;
  };
};

var date = function (a, b) {
  var d = new Date();
  return a = +a, b -= a, function (t) {
    return d.setTime(a + b * t), d;
  };
};

var interpolateNumber = function (a, b) {
  return a = +a, b -= a, function (t) {
    return a + b * t;
  };
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get$1 = function get$1(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get$1(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};



var set$3 = function set$3(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set$3(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

var object$1 = function (a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || (typeof a === "undefined" ? "undefined" : _typeof(a)) !== "object") a = {};
  if (b === null || (typeof b === "undefined" ? "undefined" : _typeof(b)) !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolateValue(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function (t) {
    for (k in i) {
      c[k] = i[k](t);
    }return c;
  };
};

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");

function zero(b) {
  return function () {
    return b;
  };
}

function one(b) {
  return function (t) {
    return b(t) + "";
  };
}

var interpolateString = function (a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0,
      // scan index for next number in b
  am,
      // current match in a
  bm,
      // current match in b
  bs,
      // string preceding current number in b, if any
  i = -1,
      // index in s
  s = [],
      // string constants and placeholders
  q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a)) && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) {
      // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else {
      // interpolate non-matching numbers
      s[++i] = null;
      q.push({ i: i, x: interpolateNumber(am, bm) });
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function (t) {
    for (var i = 0, o; i < b; ++i) {
      s[(o = q[i]).i] = o.x(t);
    }return s.join("");
  });
};

var interpolateValue = function (a, b) {
    var t = typeof b === "undefined" ? "undefined" : _typeof(b),
        c;
    return b == null || t === "boolean" ? constant$3(b) : (t === "number" ? interpolateNumber : t === "string" ? (c = color(b)) ? (b = c, interpolateRgb) : interpolateString : b instanceof color ? interpolateRgb : b instanceof Date ? date : Array.isArray(b) ? array$1 : isNaN(b) ? object$1 : interpolateNumber)(a, b);
};

var interpolateRound = function (a, b) {
  return a = +a, b -= a, function (t) {
    return Math.round(a + b * t);
  };
};

var degrees = 180 / Math.PI;

var identity$2 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

var decompose = function (a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
};

var cssNode;
var cssRoot;
var cssView;
var svgNode;

function parseCss(value) {
  if (value === "none") return identity$2;
  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
  cssNode.style.transform = value;
  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
  cssRoot.removeChild(cssNode);
  value = value.slice(7, -1).split(",");
  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg(value) {
  if (value == null) return identity$2;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$2;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: interpolateNumber(xa, xb) }, { i: i - 2, x: interpolateNumber(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360;else if (b - a > 180) a += 360; // shortest path
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b) });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b) });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: interpolateNumber(xa, xb) }, { i: i - 2, x: interpolateNumber(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function (a, b) {
    var s = [],
        // string constants and placeholders
    q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function (t) {
      var i = -1,
          n = q.length,
          o;
      while (++i < n) {
        s[(o = q[i]).i] = o.x(t);
      }return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

var rho = Math.SQRT2;
var rho2 = 2;
var rho4 = 4;
var epsilon2 = 1e-12;

function cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

// p0 = [ux0, uy0, w0]
// p1 = [ux1, uy1, w1]
var zoom = function (p0, p1) {
  var ux0 = p0[0],
      uy0 = p0[1],
      w0 = p0[2],
      ux1 = p1[0],
      uy1 = p1[1],
      w1 = p1[2],
      dx = ux1 - ux0,
      dy = uy1 - uy0,
      d2 = dx * dx + dy * dy,
      i,
      S;

  // Special case for u0 ≅ u1.
  if (d2 < epsilon2) {
    S = Math.log(w1 / w0) / rho;
    i = function i(t) {
      return [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(rho * t * S)];
    };
  }

  // General case.
  else {
      var d1 = Math.sqrt(d2),
          b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
          b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
          r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
          r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function i(t) {
        var s = t * S,
            coshr0 = cosh(r0),
            u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
        return [ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / cosh(rho * s + r0)];
      };
    }

  i.duration = S * 1000;

  return i;
};

function hsl$1(hue$$1) {
  return function (start, end) {
    var h = hue$$1((start = hsl(start)).h, (end = hsl(end)).h),
        s = nogamma(start.s, end.s),
        l = nogamma(start.l, end.l),
        opacity = nogamma(start.opacity, end.opacity);
    return function (t) {
      start.h = h(t);
      start.s = s(t);
      start.l = l(t);
      start.opacity = opacity(t);
      return start + "";
    };
  };
}

var hsl$2 = hsl$1(hue);
var hslLong = hsl$1(nogamma);

function lab$1(start, end) {
  var l = nogamma((start = lab(start)).l, (end = lab(end)).l),
      a = nogamma(start.a, end.a),
      b = nogamma(start.b, end.b),
      opacity = nogamma(start.opacity, end.opacity);
  return function (t) {
    start.l = l(t);
    start.a = a(t);
    start.b = b(t);
    start.opacity = opacity(t);
    return start + "";
  };
}

function hcl$1(hue$$1) {
  return function (start, end) {
    var h = hue$$1((start = hcl(start)).h, (end = hcl(end)).h),
        c = nogamma(start.c, end.c),
        l = nogamma(start.l, end.l),
        opacity = nogamma(start.opacity, end.opacity);
    return function (t) {
      start.h = h(t);
      start.c = c(t);
      start.l = l(t);
      start.opacity = opacity(t);
      return start + "";
    };
  };
}

var hcl$2 = hcl$1(hue);
var hclLong = hcl$1(nogamma);

function cubehelix$1(hue$$1) {
  return function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function (t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  }(1);
}

var cubehelix$2 = cubehelix$1(hue);
var cubehelixLong = cubehelix$1(nogamma);

var quantize = function (interpolator, n) {
  var samples = new Array(n);
  for (var i = 0; i < n; ++i) {
    samples[i] = interpolator(i / (n - 1));
  }return samples;
};

var noop$1 = { value: function value() {} };

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return { type: t, name: name };
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function on(typename, callback) {
    var _ = this._,
        T = parseTypenames(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) {
        if ((t = (typename = T[i]).type) && (t = get$2(_[t], typename.name))) return t;
      }return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$4(_[t], typename.name, callback);else if (callback == null) for (t in _) {
        _[t] = set$4(_[t], typename.name, null);
      }
    }

    return this;
  },
  copy: function copy() {
    var copy = {},
        _ = this._;
    for (var t in _) {
      copy[t] = _[t].slice();
    }return new Dispatch(copy);
  },
  call: function call(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) {
      args[i] = arguments[i + 2];
    }if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  },
  apply: function apply(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  }
};

function get$2(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$4(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop$1, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({ name: name, value: callback });
  return type;
}

function objectConverter(columns) {
  return new Function("d", "return {" + columns.map(function (name, i) {
    return JSON.stringify(name) + ": d[" + i + "]";
  }).join(",") + "}");
}

function customConverter(columns, f) {
  var object = objectConverter(columns);
  return function (row, i) {
    return f(object(row), i, columns);
  };
}

// Compute unique columns in order of discovery.
function inferColumns(rows) {
  var columnSet = Object.create(null),
      columns = [];

  rows.forEach(function (row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });

  return columns;
}

var dsv = function (delimiter) {
  var reFormat = new RegExp("[\"" + delimiter + "\n]"),
      delimiterCode = delimiter.charCodeAt(0);

  function parse(text, f) {
    var convert,
        columns,
        rows = parseRows(text, function (row, i) {
      if (convert) return convert(row, i - 1);
      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
    });
    rows.columns = columns;
    return rows;
  }

  function parseRows(text, f) {
    var EOL = {},
        // sentinel value for end-of-line
    EOF = {},
        // sentinel value for end-of-file
    rows = [],
        // output rows
    N = text.length,
        I = 0,
        // current character index
    n = 0,
        // the current line number
    t,
        // the current token
    eol; // is the current token followed by EOL?

    function token() {
      if (I >= N) return EOF; // special case: end of file
      if (eol) return eol = false, EOL; // special case: end of line

      // special case: quotes
      var j = I,
          c;
      if (text.charCodeAt(j) === 34) {
        var i = j;
        while (i++ < N) {
          if (text.charCodeAt(i) === 34) {
            if (text.charCodeAt(i + 1) !== 34) break;
            ++i;
          }
        }
        I = i + 2;
        c = text.charCodeAt(i + 1);
        if (c === 13) {
          eol = true;
          if (text.charCodeAt(i + 2) === 10) ++I;
        } else if (c === 10) {
          eol = true;
        }
        return text.slice(j + 1, i).replace(/""/g, "\"");
      }

      // common case: find next delimiter or newline
      while (I < N) {
        var k = 1;
        c = text.charCodeAt(I++);
        if (c === 10) eol = true; // \n
        else if (c === 13) {
            eol = true;if (text.charCodeAt(I) === 10) ++I, ++k;
          } // \r|\r\n
          else if (c !== delimiterCode) continue;
        return text.slice(j, I - k);
      }

      // special case: last token before EOF
      return text.slice(j);
    }

    while ((t = token()) !== EOF) {
      var a = [];
      while (t !== EOL && t !== EOF) {
        a.push(t);
        t = token();
      }
      if (f && (a = f(a, n++)) == null) continue;
      rows.push(a);
    }

    return rows;
  }

  function format(rows, columns) {
    if (columns == null) columns = inferColumns(rows);
    return [columns.map(formatValue).join(delimiter)].concat(rows.map(function (row) {
      return columns.map(function (column) {
        return formatValue(row[column]);
      }).join(delimiter);
    })).join("\n");
  }

  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }

  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }

  function formatValue(text) {
    return text == null ? "" : reFormat.test(text += "") ? "\"" + text.replace(/\"/g, "\"\"") + "\"" : text;
  }

  return {
    parse: parse,
    parseRows: parseRows,
    format: format,
    formatRows: formatRows
  };
};

var csv = dsv(",");

var csvParse = csv.parse;
var csvParseRows = csv.parseRows;
var csvFormat = csv.format;
var csvFormatRows = csv.formatRows;

var tsv = dsv("\t");

var tsvParse = tsv.parse;
var tsvParseRows = tsv.parseRows;
var tsvFormat = tsv.format;
var tsvFormatRows = tsv.formatRows;

var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = (typeof performance === "undefined" ? "undefined" : _typeof(performance)) === "object" && performance.now ? performance : Date;
var setFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function (f) {
  setTimeout(f, 17);
};

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call = this._time = this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function restart(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function stop() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer();
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead,
      e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(),
      delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0,
      t1 = taskHead,
      t2,
      time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout) timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity) timeout = setTimeout(wake, delay);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

var timeout$1 = function (callback, delay, time) {
  var t = new Timer();
  delay = delay == null ? 0 : +delay;
  t.restart(function (elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
};

var interval$1 = function (callback, delay, time) {
  var t = new Timer(),
      total = delay;
  if (delay == null) return t.restart(callback, delay, time), t;
  delay = +delay, time = time == null ? now() : +time;
  t.restart(function tick(elapsed) {
    elapsed += total;
    t.restart(tick, total += delay, time);
    callback(elapsed);
  }, delay, time);
  return t;
};

var t0$1 = new Date();
var t1$1 = new Date();

function newInterval(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = new Date(+date)), date;
  }

  interval.floor = interval;

  interval.ceil = function (date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = function (date) {
    var d0 = interval(date),
        d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = function (date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = function (start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    do {
      range.push(new Date(+start));
    } while ((offseti(start, step), floori(start), start < stop));
    return range;
  };

  interval.filter = function (test) {
    return newInterval(function (date) {
      if (date >= date) while (floori(date), !test(date)) {
        date.setTime(date - 1);
      }
    }, function (date, step) {
      if (date >= date) while (--step >= 0) {
        while (offseti(date, 1), !test(date)) {}
      } // eslint-disable-line no-empty
    });
  };

  if (count) {
    interval.count = function (start, end) {
      t0$1.setTime(+start), t1$1.setTime(+end);
      floori(t0$1), floori(t1$1);
      return Math.floor(count(t0$1, t1$1));
    };

    interval.every = function (step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval : interval.filter(field ? function (d) {
        return field(d) % step === 0;
      } : function (d) {
        return interval.count(0, d) % step === 0;
      });
    };
  }

  return interval;
}

var millisecond = newInterval(function () {
  // noop
}, function (date, step) {
  date.setTime(+date + step);
}, function (start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
millisecond.every = function (k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond;
  return newInterval(function (date) {
    date.setTime(Math.floor(date / k) * k);
  }, function (date, step) {
    date.setTime(+date + step * k);
  }, function (start, end) {
    return (end - start) / k;
  });
};

var milliseconds = millisecond.range;

var durationSecond = 1e3;
var durationMinute = 6e4;
var durationHour = 36e5;
var durationDay = 864e5;
var durationWeek = 6048e5;

var second = newInterval(function (date) {
  date.setTime(Math.floor(date / durationSecond) * durationSecond);
}, function (date, step) {
  date.setTime(+date + step * durationSecond);
}, function (start, end) {
  return (end - start) / durationSecond;
}, function (date) {
  return date.getUTCSeconds();
});

var seconds = second.range;

var minute = newInterval(function (date) {
  date.setTime(Math.floor(date / durationMinute) * durationMinute);
}, function (date, step) {
  date.setTime(+date + step * durationMinute);
}, function (start, end) {
  return (end - start) / durationMinute;
}, function (date) {
  return date.getMinutes();
});

var minutes = minute.range;

var hour = newInterval(function (date) {
  var offset = date.getTimezoneOffset() * durationMinute % durationHour;
  if (offset < 0) offset += durationHour;
  date.setTime(Math.floor((+date - offset) / durationHour) * durationHour + offset);
}, function (date, step) {
  date.setTime(+date + step * durationHour);
}, function (start, end) {
  return (end - start) / durationHour;
}, function (date) {
  return date.getHours();
});

var hours = hour.range;

var day = newInterval(function (date) {
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setDate(date.getDate() + step);
}, function (start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
}, function (date) {
  return date.getDate() - 1;
});

var days = day.range;

function weekday(i) {
  return newInterval(function (date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function (start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}

var sunday = weekday(0);
var monday = weekday(1);
var tuesday = weekday(2);
var wednesday = weekday(3);
var thursday = weekday(4);
var friday = weekday(5);
var saturday = weekday(6);

var sundays = sunday.range;
var mondays = monday.range;
var tuesdays = tuesday.range;
var wednesdays = wednesday.range;
var thursdays = thursday.range;
var fridays = friday.range;
var saturdays = saturday.range;

var month = newInterval(function (date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setMonth(date.getMonth() + step);
}, function (start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function (date) {
  return date.getMonth();
});

var months = month.range;

var year = newInterval(function (date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function (start, end) {
  return end.getFullYear() - start.getFullYear();
}, function (date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
year.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function (date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

var years = year.range;

var utcMinute = newInterval(function (date) {
  date.setUTCSeconds(0, 0);
}, function (date, step) {
  date.setTime(+date + step * durationMinute);
}, function (start, end) {
  return (end - start) / durationMinute;
}, function (date) {
  return date.getUTCMinutes();
});

var utcMinutes = utcMinute.range;

var utcHour = newInterval(function (date) {
  date.setUTCMinutes(0, 0, 0);
}, function (date, step) {
  date.setTime(+date + step * durationHour);
}, function (start, end) {
  return (end - start) / durationHour;
}, function (date) {
  return date.getUTCHours();
});

var utcHours = utcHour.range;

var utcDay = newInterval(function (date) {
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function (start, end) {
  return (end - start) / durationDay;
}, function (date) {
  return date.getUTCDate() - 1;
});

var utcDays = utcDay.range;

function utcWeekday(i) {
  return newInterval(function (date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function (start, end) {
    return (end - start) / durationWeek;
  });
}

var utcSunday = utcWeekday(0);
var utcMonday = utcWeekday(1);
var utcTuesday = utcWeekday(2);
var utcWednesday = utcWeekday(3);
var utcThursday = utcWeekday(4);
var utcFriday = utcWeekday(5);
var utcSaturday = utcWeekday(6);

var utcSundays = utcSunday.range;
var utcMondays = utcMonday.range;
var utcTuesdays = utcTuesday.range;
var utcWednesdays = utcWednesday.range;
var utcThursdays = utcThursday.range;
var utcFridays = utcFriday.range;
var utcSaturdays = utcSaturday.range;

var utcMonth = newInterval(function (date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function (start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function (date) {
  return date.getUTCMonth();
});

var utcMonths = utcMonth.range;

var utcYear = newInterval(function (date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function (start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function (date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function (date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

var utcYears = utcYear.range;

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
var formatDecimal = function (x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i,
      coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient, +x.slice(i + 1)];
};

var exponent$1 = function (x) {
  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
};

var formatGroup = function (grouping, thousands) {
  return function (value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
};

var formatDefault = function (x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".":
        i0 = i1 = i;break;
      case "0":
        if (i0 === 0) i0 = i;i1 = i;break;
      case "e":
        break out;
      default:
        if (i0 > 0) i0 = 0;break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
};

var prefixExponent;

var formatPrefixAuto = function (x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
};

var formatRounded = function (x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
};

var formatTypes = {
  "": formatDefault,
  "%": function _(x, p) {
    return (x * 100).toFixed(p);
  },
  "b": function b(x) {
    return Math.round(x).toString(2);
  },
  "c": function c(x) {
    return x + "";
  },
  "d": function d(x) {
    return Math.round(x).toString(10);
  },
  "e": function e(x, p) {
    return x.toExponential(p);
  },
  "f": function f(x, p) {
    return x.toFixed(p);
  },
  "g": function g(x, p) {
    return x.toPrecision(p);
  },
  "o": function o(x) {
    return Math.round(x).toString(8);
  },
  "p": function p(x, _p) {
    return formatRounded(x * 100, _p);
  },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function X(x) {
    return Math.round(x).toString(16).toUpperCase();
  },
  "x": function x(_x) {
    return Math.round(_x).toString(16);
  }
};

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

var formatSpecifier = function (specifier) {
  return new FormatSpecifier(specifier);
};

function FormatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") comma = true, type = "g";

  // Map invalid types to the default format.
  else if (!formatTypes[type]) type = "";

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || fill === "0" && align === "=") zero = true, fill = "0", align = "=";

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier.prototype.toString = function () {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width == null ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0)) + this.type;
};

var prefixes = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];

function identity$3(x) {
  return x;
}

var formatLocale = function (locale) {
  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$3,
      currency = locale.currency,
      decimal = locale.decimal;

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? type ? 6 : 12 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i,
          n,
          c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Convert negative to positive, and compute the prefix.
        // Note that -0 is not less than 0, but 1 / -0 is!
        var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

        // Perform the initial formatting.
        value = formatType(value, precision);

        // If the original value was negative, it may be rounded to zero during
        // formatting; treat this as (positive) zero.
        if (valueNegative) {
          i = -1, n = value.length;
          valueNegative = false;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 < c && c < 58 || type === "x" && 96 < c && c < 103 || type === "X" && 64 < c && c < 71) {
              valueNegative = true;
              break;
            }
          }
        }

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? sign === "(" ? sign : "-" : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<":
          return valuePrefix + value + valueSuffix + padding;
        case "=":
          return valuePrefix + padding + value + valueSuffix;
        case "^":
          return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
      }
      return padding + valuePrefix + value + valueSuffix;
    }

    format.toString = function () {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function (value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
};

var locale$1;



defaultLocale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  locale$1 = formatLocale(definition);
  exports.format = locale$1.format;
  exports.formatPrefix = locale$1.formatPrefix;
  return locale$1;
}

var precisionFixed = function (step) {
  return Math.max(0, -exponent$1(Math.abs(step)));
};

var precisionPrefix = function (step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent$1(value) / 3))) * 3 - exponent$1(Math.abs(step)));
};

var precisionRound = function (step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent$1(max) - exponent$1(step)) + 1;
};

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newYear(y) {
  return { y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0 };
}

function formatLocale$1(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "S": formatSeconds,
    "U": formatWeekNumberSunday,
    "w": formatWeekdayNumber,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "S": formatUTCSeconds,
    "U": formatUTCWeekNumberSunday,
    "w": formatUTCWeekdayNumber,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "S": parseSeconds,
    "U": parseWeekNumberSunday,
    "w": parseWeekdayNumber,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function (date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) date = new Date(+date);

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, newDate) {
    return function (string) {
      var d = newYear(1900),
          i = parseSpecifier(d, specifier, string += "", 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "W" in d ? 1 : 0;
        var day$$1 = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$$1 + 5) % 7 : d.w + d.U * 7 - (day$$1 + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return newDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || (j = parse(d, string, j)) < 0) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  return {
    format: function format(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    parse: function parse(specifier) {
      var p = newParse(specifier += "", localDate);
      p.toString = function () {
        return specifier;
      };
      return p;
    },
    utcFormat: function utcFormat(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    utcParse: function utcParse(specifier) {
      var p = newParse(specifier, utcDate);
      p.toString = function () {
        return specifier;
      };
      return p;
    }
  };
}

var pads = { "-": "", "_": " ", "0": "0" };
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

function pad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote(s) {
  return s.replace(requoteRe, "\\$&");
}

function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}

function formatLookup(names) {
  var map = {},
      i = -1,
      n = names.length;
  while (++i < n) {
    map[names[i].toLowerCase()] = i;
  }return map;
}

function parseWeekdayNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function formatDayOfMonth(d, p) {
  return pad(d.getDate(), p, 2);
}

function formatHour24(d, p) {
  return pad(d.getHours(), p, 2);
}

function formatHour12(d, p) {
  return pad(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear(d, p) {
  return pad(1 + day.count(year(d), d), p, 3);
}

function formatMilliseconds(d, p) {
  return pad(d.getMilliseconds(), p, 3);
}

function formatMonthNumber(d, p) {
  return pad(d.getMonth() + 1, p, 2);
}

function formatMinutes(d, p) {
  return pad(d.getMinutes(), p, 2);
}

function formatSeconds(d, p) {
  return pad(d.getSeconds(), p, 2);
}

function formatWeekNumberSunday(d, p) {
  return pad(sunday.count(year(d), d), p, 2);
}

function formatWeekdayNumber(d) {
  return d.getDay();
}

function formatWeekNumberMonday(d, p) {
  return pad(monday.count(year(d), d), p, 2);
}

function formatYear(d, p) {
  return pad(d.getFullYear() % 100, p, 2);
}

function formatFullYear(d, p) {
  return pad(d.getFullYear() % 10000, p, 4);
}

function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+")) + pad(z / 60 | 0, "0", 2) + pad(z % 60, "0", 2);
}

function formatUTCDayOfMonth(d, p) {
  return pad(d.getUTCDate(), p, 2);
}

function formatUTCHour24(d, p) {
  return pad(d.getUTCHours(), p, 2);
}

function formatUTCHour12(d, p) {
  return pad(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear(d, p) {
  return pad(1 + utcDay.count(utcYear(d), d), p, 3);
}

function formatUTCMilliseconds(d, p) {
  return pad(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMonthNumber(d, p) {
  return pad(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes(d, p) {
  return pad(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds(d, p) {
  return pad(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekNumberSunday(d, p) {
  return pad(utcSunday.count(utcYear(d), d), p, 2);
}

function formatUTCWeekdayNumber(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday(d, p) {
  return pad(utcMonday.count(utcYear(d), d), p, 2);
}

function formatUTCYear(d, p) {
  return pad(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear(d, p) {
  return pad(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone() {
  return "+0000";
}

function formatLiteralPercent() {
  return "%";
}

var locale$2;





defaultLocale$1({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale$1(definition) {
  locale$2 = formatLocale$1(definition);
  exports.timeFormat = locale$2.format;
  exports.timeParse = locale$2.parse;
  exports.utcFormat = locale$2.utcFormat;
  exports.utcParse = locale$2.utcParse;
  return locale$2;
}

var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative(date) {
    return date.toISOString();
}

var formatIso = Date.prototype.toISOString ? formatIsoNative : exports.utcFormat(isoSpecifier);

function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso = +new Date("2000-01-01T00:00:00.000Z") ? parseIsoNative : exports.utcParse(isoSpecifier);

var array$2 = Array.prototype;

var map$3 = array$2.map;
var slice$2 = array$2.slice;

var implicit = { name: "implicit" };

function ordinal(range) {
  var index = map$1(),
      domain = [],
      unknown = implicit;

  range = range == null ? [] : slice$2.call(range);

  function scale(d) {
    var key = d + "",
        i = index.get(key);
    if (!i) {
      if (unknown !== implicit) return unknown;
      index.set(key, i = domain.push(d));
    }
    return range[(i - 1) % range.length];
  }

  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = map$1();
    var i = -1,
        n = _.length,
        d,
        key;
    while (++i < n) {
      if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
    }return scale;
  };

  scale.range = function (_) {
    return arguments.length ? (range = slice$2.call(_), scale) : range.slice();
  };

  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function () {
    return ordinal().domain(domain).range(range).unknown(unknown);
  };

  return scale;
}

function band() {
  var scale = ordinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range$$1 = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = range$$1[1] < range$$1[0],
        start = range$$1[reverse - 0],
        stop = range$$1[1 - reverse];
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = sequence(n).map(function (i) {
      return start + step * i;
    });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function (_) {
    return arguments.length ? (range$$1 = [+_[0], +_[1]], rescale()) : range$$1.slice();
  };

  scale.rangeRound = function (_) {
    return range$$1 = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = function () {
    return bandwidth;
  };

  scale.step = function () {
    return step;
  };

  scale.round = function (_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function (_) {
    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingInner = function (_) {
    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingOuter = function (_) {
    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
  };

  scale.align = function (_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.copy = function () {
    return band().domain(domain()).range(range$$1).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  };

  return rescale();
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;

  scale.copy = function () {
    return pointish(copy());
  };

  return scale;
}

function point$1() {
  return pointish(band().paddingInner(1));
}

var constant$4 = function (x) {
  return function () {
    return x;
  };
};

var number$1 = function (x) {
  return +x;
};

var unit = [0, 1];

function deinterpolateLinear(a, b) {
  return (b -= a = +a) ? function (x) {
    return (x - a) / b;
  } : constant$4(b);
}

function deinterpolateClamp(deinterpolate) {
  return function (a, b) {
    var d = deinterpolate(a = +a, b = +b);
    return function (x) {
      return x <= a ? 0 : x >= b ? 1 : d(x);
    };
  };
}

function reinterpolateClamp(reinterpolate) {
  return function (a, b) {
    var r = reinterpolate(a = +a, b = +b);
    return function (t) {
      return t <= 0 ? a : t >= 1 ? b : r(t);
    };
  };
}

function bimap(domain, range$$1, deinterpolate, reinterpolate) {
  var d0 = domain[0],
      d1 = domain[1],
      r0 = range$$1[0],
      r1 = range$$1[1];
  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);else d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
  return function (x) {
    return r0(d0(x));
  };
}

function polymap(domain, range$$1, deinterpolate, reinterpolate) {
  var j = Math.min(domain.length, range$$1.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range$$1 = range$$1.slice().reverse();
  }

  while (++i < j) {
    d[i] = deinterpolate(domain[i], domain[i + 1]);
    r[i] = reinterpolate(range$$1[i], range$$1[i + 1]);
  }

  return function (x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp());
}

// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
function continuous(deinterpolate, reinterpolate) {
  var domain = unit,
      range$$1 = unit,
      interpolate$$1 = interpolateValue,
      clamp = false,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range$$1.length) > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return (output || (output = piecewise(domain, range$$1, clamp ? deinterpolateClamp(deinterpolate) : deinterpolate, interpolate$$1)))(+x);
  }

  scale.invert = function (y) {
    return (input || (input = piecewise(range$$1, domain, deinterpolateLinear, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
  };

  scale.domain = function (_) {
    return arguments.length ? (domain = map$3.call(_, number$1), rescale()) : domain.slice();
  };

  scale.range = function (_) {
    return arguments.length ? (range$$1 = slice$2.call(_), rescale()) : range$$1.slice();
  };

  scale.rangeRound = function (_) {
    return range$$1 = slice$2.call(_), interpolate$$1 = interpolateRound, rescale();
  };

  scale.clamp = function (_) {
    return arguments.length ? (clamp = !!_, rescale()) : clamp;
  };

  scale.interpolate = function (_) {
    return arguments.length ? (interpolate$$1 = _, rescale()) : interpolate$$1;
  };

  return rescale();
}

var tickFormat = function (domain, count, specifier) {
  var start = domain[0],
      stop = domain[domain.length - 1],
      step = tickStep(start, stop, count == null ? 10 : count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s":
      {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
        return exports.formatPrefix(specifier, value);
      }
    case "":
    case "e":
    case "g":
    case "p":
    case "r":
      {
        if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
    case "f":
    case "%":
      {
        if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
  }
  return exports.format(specifier);
};

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function (count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function (count, specifier) {
    return tickFormat(domain(), count, specifier);
  };

  scale.nice = function (count) {
    var d = domain(),
        i = d.length - 1,
        n = count == null ? 10 : count,
        start = d[0],
        stop = d[i],
        step = tickStep(start, stop, n);

    if (step) {
      step = tickStep(Math.floor(start / step) * step, Math.ceil(stop / step) * step, n);
      d[0] = Math.floor(start / step) * step;
      d[i] = Math.ceil(stop / step) * step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear$2() {
  var scale = continuous(deinterpolateLinear, interpolateNumber);

  scale.copy = function () {
    return copy(scale, linear$2());
  };

  return linearish(scale);
}

function identity$4() {
  var domain = [0, 1];

  function scale(x) {
    return +x;
  }

  scale.invert = scale;

  scale.domain = scale.range = function (_) {
    return arguments.length ? (domain = map$3.call(_, number$1), scale) : domain.slice();
  };

  scale.copy = function () {
    return identity$4().domain(domain);
  };

  return linearish(scale);
}

var nice = function (domain, interval) {
  domain = domain.slice();

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }

  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
};

function deinterpolate(a, b) {
  return (b = Math.log(b / a)) ? function (x) {
    return Math.log(x / a) / b;
  } : constant$4(b);
}

function reinterpolate(a, b) {
  return a < 0 ? function (t) {
    return -Math.pow(-b, t) * Math.pow(-a, 1 - t);
  } : function (t) {
    return Math.pow(b, t) * Math.pow(a, 1 - t);
  };
}

function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}

function powp(base) {
  return base === 10 ? pow10 : base === Math.E ? Math.exp : function (x) {
    return Math.pow(base, x);
  };
}

function logp(base) {
  return base === Math.E ? Math.log : base === 10 && Math.log10 || base === 2 && Math.log2 || (base = Math.log(base), function (x) {
    return Math.log(x) / base;
  });
}

function reflect(f) {
  return function (x) {
    return -f(-x);
  };
}

function log() {
  var scale = continuous(deinterpolate, reinterpolate).domain([1, 10]),
      domain = scale.domain,
      base = 10,
      logs = logp(10),
      pows = powp(10);

  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) logs = reflect(logs), pows = reflect(pows);
    return scale;
  }

  scale.base = function (_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };

  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.ticks = function (count) {
    var d = domain(),
        u = d[0],
        v = d[d.length - 1],
        r;

    if (r = v < u) i = u, u = v, v = i;

    var i = logs(u),
        j = logs(v),
        p,
        k,
        t,
        n = count == null ? 10 : +count,
        z = [];

    if (!(base % 1) && j - i < n) {
      i = Math.round(i) - 1, j = Math.round(j) + 1;
      if (u > 0) for (; i < j; ++i) {
        for (k = 1, p = pows(i); k < base; ++k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      } else for (; i < j; ++i) {
        for (k = base - 1, p = pows(i); k >= 1; --k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      }
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(pows);
    }

    return r ? z.reverse() : z;
  };

  scale.tickFormat = function (count, specifier) {
    if (specifier == null) specifier = base === 10 ? ".0e" : ",";
    if (typeof specifier !== "function") specifier = exports.format(specifier);
    if (count === Infinity) return specifier;
    if (count == null) count = 10;
    var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
    return function (d) {
      var i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? specifier(d) : "";
    };
  };

  scale.nice = function () {
    return domain(nice(domain(), {
      floor: function floor(x) {
        return pows(Math.floor(logs(x)));
      },
      ceil: function ceil(x) {
        return pows(Math.ceil(logs(x)));
      }
    }));
  };

  scale.copy = function () {
    return copy(scale, log().base(base));
  };

  return scale;
}

function raise(x, exponent) {
  return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
}

function pow() {
  var exponent = 1,
      scale = continuous(deinterpolate, reinterpolate),
      domain = scale.domain;

  function deinterpolate(a, b) {
    return (b = raise(b, exponent) - (a = raise(a, exponent))) ? function (x) {
      return (raise(x, exponent) - a) / b;
    } : constant$4(b);
  }

  function reinterpolate(a, b) {
    b = raise(b, exponent) - (a = raise(a, exponent));
    return function (t) {
      return raise(a + b * t, 1 / exponent);
    };
  }

  scale.exponent = function (_) {
    return arguments.length ? (exponent = +_, domain(domain())) : exponent;
  };

  scale.copy = function () {
    return copy(scale, pow().exponent(exponent));
  };

  return linearish(scale);
}

function sqrt() {
  return pow().exponent(0.5);
}

function quantile$$1() {
  var domain = [],
      range$$1 = [],
      thresholds = [];

  function rescale() {
    var i = 0,
        n = Math.max(1, range$$1.length);
    thresholds = new Array(n - 1);
    while (++i < n) {
      thresholds[i - 1] = threshold(domain, i / n);
    }return scale;
  }

  function scale(x) {
    if (!isNaN(x = +x)) return range$$1[bisectRight(thresholds, x)];
  }

  scale.invertExtent = function (y) {
    var i = range$$1.indexOf(y);
    return i < 0 ? [NaN, NaN] : [i > 0 ? thresholds[i - 1] : domain[0], i < thresholds.length ? thresholds[i] : domain[domain.length - 1]];
  };

  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [];
    for (var i = 0, n = _.length, d; i < n; ++i) {
      if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
    }domain.sort(ascending);
    return rescale();
  };

  scale.range = function (_) {
    return arguments.length ? (range$$1 = slice$2.call(_), rescale()) : range$$1.slice();
  };

  scale.quantiles = function () {
    return thresholds.slice();
  };

  scale.copy = function () {
    return quantile$$1().domain(domain).range(range$$1);
  };

  return scale;
}

function quantize$1() {
  var x0 = 0,
      x1 = 1,
      n = 1,
      domain = [0.5],
      range$$1 = [0, 1];

  function scale(x) {
    if (x <= x) return range$$1[bisectRight(domain, x, 0, n)];
  }

  function rescale() {
    var i = -1;
    domain = new Array(n);
    while (++i < n) {
      domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1);
    }return scale;
  }

  scale.domain = function (_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], rescale()) : [x0, x1];
  };

  scale.range = function (_) {
    return arguments.length ? (n = (range$$1 = slice$2.call(_)).length - 1, rescale()) : range$$1.slice();
  };

  scale.invertExtent = function (y) {
    var i = range$$1.indexOf(y);
    return i < 0 ? [NaN, NaN] : i < 1 ? [x0, domain[0]] : i >= n ? [domain[n - 1], x1] : [domain[i - 1], domain[i]];
  };

  scale.copy = function () {
    return quantize$1().domain([x0, x1]).range(range$$1);
  };

  return linearish(scale);
}

function threshold$1() {
  var domain = [0.5],
      range$$1 = [0, 1],
      n = 1;

  function scale(x) {
    if (x <= x) return range$$1[bisectRight(domain, x, 0, n)];
  }

  scale.domain = function (_) {
    return arguments.length ? (domain = slice$2.call(_), n = Math.min(domain.length, range$$1.length - 1), scale) : domain.slice();
  };

  scale.range = function (_) {
    return arguments.length ? (range$$1 = slice$2.call(_), n = Math.min(domain.length, range$$1.length - 1), scale) : range$$1.slice();
  };

  scale.invertExtent = function (y) {
    var i = range$$1.indexOf(y);
    return [domain[i - 1], domain[i]];
  };

  scale.copy = function () {
    return threshold$1().domain(domain).range(range$$1);
  };

  return scale;
}

var durationSecond$1 = 1000;
var durationMinute$1 = durationSecond$1 * 60;
var durationHour$1 = durationMinute$1 * 60;
var durationDay$1 = durationHour$1 * 24;
var durationWeek$1 = durationDay$1 * 7;
var durationMonth = durationDay$1 * 30;
var durationYear = durationDay$1 * 365;

function date$1(t) {
  return new Date(t);
}

function number$2(t) {
  return t instanceof Date ? +t : +new Date(+t);
}

function calendar(year$$1, month$$1, week, day$$1, hour$$1, minute$$1, second$$1, millisecond$$1, format) {
  var scale = continuous(deinterpolateLinear, interpolateNumber),
      invert = scale.invert,
      domain = scale.domain;

  var formatMillisecond = format(".%L"),
      formatSecond = format(":%S"),
      formatMinute = format("%I:%M"),
      formatHour = format("%I %p"),
      formatDay = format("%a %d"),
      formatWeek = format("%b %d"),
      formatMonth = format("%B"),
      formatYear = format("%Y");

  var tickIntervals = [[second$$1, 1, durationSecond$1], [second$$1, 5, 5 * durationSecond$1], [second$$1, 15, 15 * durationSecond$1], [second$$1, 30, 30 * durationSecond$1], [minute$$1, 1, durationMinute$1], [minute$$1, 5, 5 * durationMinute$1], [minute$$1, 15, 15 * durationMinute$1], [minute$$1, 30, 30 * durationMinute$1], [hour$$1, 1, durationHour$1], [hour$$1, 3, 3 * durationHour$1], [hour$$1, 6, 6 * durationHour$1], [hour$$1, 12, 12 * durationHour$1], [day$$1, 1, durationDay$1], [day$$1, 2, 2 * durationDay$1], [week, 1, durationWeek$1], [month$$1, 1, durationMonth], [month$$1, 3, 3 * durationMonth], [year$$1, 1, durationYear]];

  function tickFormat(date) {
    return (second$$1(date) < date ? formatMillisecond : minute$$1(date) < date ? formatSecond : hour$$1(date) < date ? formatMinute : day$$1(date) < date ? formatHour : month$$1(date) < date ? week(date) < date ? formatDay : formatWeek : year$$1(date) < date ? formatMonth : formatYear)(date);
  }

  function tickInterval(interval, start, stop, step) {
    if (interval == null) interval = 10;

    // If a desired tick count is specified, pick a reasonable tick interval
    // based on the extent of the domain and a rough estimate of tick size.
    // Otherwise, assume interval is already a time interval and use it.
    if (typeof interval === "number") {
      var target = Math.abs(stop - start) / interval,
          i = bisector(function (i) {
        return i[2];
      }).right(tickIntervals, target);
      if (i === tickIntervals.length) {
        step = tickStep(start / durationYear, stop / durationYear, interval);
        interval = year$$1;
      } else if (i) {
        i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
        step = i[1];
        interval = i[0];
      } else {
        step = tickStep(start, stop, interval);
        interval = millisecond$$1;
      }
    }

    return step == null ? interval : interval.every(step);
  }

  scale.invert = function (y) {
    return new Date(invert(y));
  };

  scale.domain = function (_) {
    return arguments.length ? domain(map$3.call(_, number$2)) : domain().map(date$1);
  };

  scale.ticks = function (interval, step) {
    var d = domain(),
        t0 = d[0],
        t1 = d[d.length - 1],
        r = t1 < t0,
        t;
    if (r) t = t0, t0 = t1, t1 = t;
    t = tickInterval(interval, t0, t1, step);
    t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
    return r ? t.reverse() : t;
  };

  scale.tickFormat = function (count, specifier) {
    return specifier == null ? tickFormat : format(specifier);
  };

  scale.nice = function (interval, step) {
    var d = domain();
    return (interval = tickInterval(interval, d[0], d[d.length - 1], step)) ? domain(nice(d, interval)) : scale;
  };

  scale.copy = function () {
    return copy(scale, calendar(year$$1, month$$1, week, day$$1, hour$$1, minute$$1, second$$1, millisecond$$1, format));
  };

  return scale;
}

var time = function () {
  return calendar(year, month, sunday, day, hour, minute, second, millisecond, exports.timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]);
};

var utcTime = function () {
  return calendar(utcYear, utcMonth, utcSunday, utcDay, utcHour, utcMinute, second, millisecond, exports.utcFormat).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]);
};

var colors = function (s) {
  return s.match(/.{6}/g).map(function (x) {
    return "#" + x;
  });
};

var category10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

var category20b = colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

var category20c = colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

var category20 = colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

var cubehelix$3 = cubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

var warm = cubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var cool = cubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var rainbow = cubehelix();

var rainbow$1 = function (t) {
  if (t < 0 || t > 1) t -= Math.floor(t);
  var ts = Math.abs(t - 0.5);
  rainbow.h = 360 * t - 100;
  rainbow.s = 1.5 - 1.5 * ts;
  rainbow.l = 0.8 - 0.9 * ts;
  return rainbow + "";
};

function ramp(range) {
  var n = range.length;
  return function (t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

var viridis = ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var magma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var inferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var plasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

function sequential(interpolator) {
  var x0 = 0,
      x1 = 1,
      clamp = false;

  function scale(x) {
    var t = (x - x0) / (x1 - x0);
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }

  scale.domain = function (_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], scale) : [x0, x1];
  };

  scale.clamp = function (_) {
    return arguments.length ? (clamp = !!_, scale) : clamp;
  };

  scale.interpolator = function (_) {
    return arguments.length ? (interpolator = _, scale) : interpolator;
  };

  scale.copy = function () {
    return sequential(interpolator).domain([x0, x1]).clamp(clamp);
  };

  return linearish(scale);
}

var ostring = Object.prototype.toString;
var inBrowser = typeof window !== 'undefined' && ostring.call(window) !== '[object Object]';

var logger = inBrowser ? window.console : require('console');

// From https://github.com/sindresorhus/object-assign
// The MIT License (MIT)
//
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

var assign = assign$1();

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
		var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
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
		if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

function assign$1() {
	return shouldUseNative() ? Object.assign : function (target) {
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

			if (Object.getOwnPropertySymbols) {
				symbols = Object.getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};
}

// Simulate a WeekMap for now
var self$1 = {
    get: function get(obj) {
        return obj._self;
    },
    set: function set(obj, value) {
        obj._self = value;
    }
};

function isObject(value) {
    return ostring.call(value) === '[object Object]';
}

function isString(value) {
    return ostring.call(value) === '[object String]';
}

function isFunction(value) {
    return ostring.call(value) === '[object Function]';
}

function isArray(value) {
    return ostring.call(value) === '[object Array]';
}

function isDate(value) {
    return ostring.call(value) === '[object Date]';
}

function isNumber(value) {
    return ostring.call(value) === '[object Number]';
}

function isPromise(value) {
    return ostring.call(value) === '[object Promise]';
}

var pop$1 = function (obj, prop) {
    var value = void 0;
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
};

var prefix$1 = "$";

function Map$1() {
    this._array = [];
}

Map$1.prototype = map$4.prototype = {
    constructor: Map$1,

    size: function size() {
        return this._array.length;
    },
    get: function get(key) {
        return this[prefix$1 + key];
    },
    set: function set(key, value) {
        if (!this.has(key)) this._array.push(key);
        this[prefix$1 + key] = value;
        return this;
    },
    has: function has(key) {
        return prefix$1 + key in this;
    },
    clear: function clear() {
        var self = this;
        this.each(function (_, property) {
            delete self[prefix$1 + property];
        });
        this._array.splice(0);
    },
    keys: function keys() {
        var entries = [];
        this.each(function (_, key) {
            entries.push(key);
        });
        return entries;
    },
    values: function values() {
        var entries = [];
        this.each(function (v) {
            entries.push(v);
        });
        return entries;
    },
    each: function each(callback) {
        var a = this._array,
            key;
        for (var i = 0; i < a.length; ++i) {
            key = a[i];
            callback(this.get(key), key, i);
        }
    }
};

function map$4(object, f) {
    var map = new Map$1();

    // Copy constructor.
    if (object instanceof Map$1) object.each(function (value, key) {
        map.set(key, value);
    });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
            var i = -1,
                n = object.length,
                o;
            if (f == null) while (++i < n) {
                map.set(i, object[i]);
            } else while (++i < n) {
                map.set(f(o = object[i], i, object), o);
            }
        }

        // Convert object to map.
        else if (object) for (var key in object) {
                map.set(key, object[key]);
            }return map;
}

var version = "0.2.3";

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace = function (name) {
  var prefix = name += "",
      i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? { space: namespaces[prefix], local: name } : name;
};

function creatorInherit(name) {
  return function () {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml ? document.createElement(name) : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator = function (name) {
  var fullname = namespace(name);
  return (fullname.local ? creatorFixed : creatorInherit)(fullname);
};

var nextId = 0;

var matcher = function matcher(selector) {
  return function () {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element = document.documentElement;
  if (!element.matches) {
    var vendorMatches = element.webkitMatchesSelector || element.msMatchesSelector || element.mozMatchesSelector || element.oMatchesSelector;
    matcher = function matcher(selector) {
      return function () {
        return vendorMatches.call(this, selector);
      };
    };
  }
}

var matcher$1 = matcher;

var filterEvents = {};

exports.event = null;

if (typeof document !== "undefined") {
  var element$1 = document.documentElement;
  if (!("onmouseenter" in element$1)) {
    filterEvents = { mouseenter: "mouseover", mouseleave: "mouseout" };
  }
}

function filterContextListener(listener, index, group) {
  listener = contextListener(listener, index, group);
  return function (event) {
    var related = event.relatedTarget;
    if (!related || related !== this && !(related.compareDocumentPosition(this) & 8)) {
      listener.call(this, event);
    }
  };
}

function contextListener(listener, index, group) {
  return function (event1) {
    var event0 = exports.event; // Events can be reentrant (e.g., focus).
    exports.event = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      exports.event = event0;
    }
  };
}

function parseTypenames$1(typenames) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name: name };
  });
}

function onRemove(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;else delete this.__on;
  };
}

function onAdd(typename, value, capture) {
  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
  return function (d, i, group) {
    var on = this.__on,
        o,
        listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = { type: typename.type, name: typename.name, value: value, listener: listener, capture: capture };
    if (!on) this.__on = [o];else on.push(o);
  };
}

var selection_on = function (typename, value, capture) {
  var typenames = parseTypenames$1(typename + ""),
      i,
      n = typenames.length,
      t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) {
    this.each(on(typenames[i], value, capture));
  }return this;
};

var sourceEvent = function () {
  var current = exports.event,
      source;
  while (source = current.sourceEvent) {
    current = source;
  }return current;
};

var point$2 = function (node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
};

var mouse = function (node) {
  var event = sourceEvent();
  if (event.changedTouches) event = event.changedTouches[0];
  return point$2(node, event);
};

function none$2() {}

var selector = function (selector) {
  return selector == null ? none$2 : function () {
    return this.querySelector(selector);
  };
};

var selection_select = function (select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

function empty$1() {
  return [];
}

var selectorAll = function (selector) {
  return selector == null ? empty$1 : function () {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll = function (select) {
  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection(subgroups, parents);
};

var selection_filter = function (match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

var sparse = function (update) {
  return new Array(update.length);
};

var selection_enter = function () {
  return new Selection(this._enter || this._groups.map(sparse), this._parents);
};

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function appendChild(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function insertBefore(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function querySelector(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function querySelectorAll(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

var constant$5 = function (x) {
  return function () {
    return x;
  };
};

var keyPrefix = "$"; // Protect against keys like “__proto__”.

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue[keyValues[i]] === node) {
      exit[i] = node;
    }
  }
}

var selection_data = function (value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function (d) {
      data[++j] = d;
    });
    return data;
  }

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$5(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) {}
        previous._next = next || null;
      }
    }
  }

  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit = function () {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
};

var selection_merge = function (selection) {

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection(merges, this._parents);
};

var selection_order = function () {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
};

var selection_sort = function (compare) {
  if (!compare) compare = ascending$2;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection(sortgroups, this._parents).order();
};

function ascending$2(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call = function () {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes = function () {
  var nodes = new Array(this.size()),
      i = -1;
  this.each(function () {
    nodes[++i] = this;
  });
  return nodes;
};

var selection_node = function () {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
};

var selection_size = function () {
  var size = 0;
  this.each(function () {
    ++size;
  });
  return size;
};

var selection_empty = function () {
  return !this.node();
};

var selection_each = function (callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
};

function attrRemove(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}

function attrConstantNS(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);else this.setAttribute(name, v);
  };
}

function attrFunctionNS(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

var selection_attr = function (name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }

  return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
};

var window$1 = function (node) {
    return node.ownerDocument && node.ownerDocument.defaultView || // node is a Node
    node.document && node // node is a Window
    || node.defaultView; // node is a Document
};

function styleRemove(name) {
  return function () {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);else this.style.setProperty(name, v, priority);
  };
}

var selection_style = function (name, value, priority) {
  var node;
  return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : window$1(node = this.node()).getComputedStyle(node, null).getPropertyValue(name);
};

function propertyRemove(name) {
  return function () {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function () {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];else this[name] = v;
  };
}

var selection_property = function (name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
};

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function add(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function remove(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function contains(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.add(names[i]);
  }
}

function classedRemove(node, names) {
  var list = classList(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.remove(names[i]);
  }
}

function classedTrue(names) {
  return function () {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function () {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

var selection_classed = function (name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()),
        i = -1,
        n = names.length;
    while (++i < n) {
      if (!list.contains(names[i])) return false;
    }return true;
  }

  return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
};

function textRemove() {
  this.textContent = "";
}

function textConstant(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text = function (value) {
  return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
};

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function () {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html = function (value) {
  return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
};

function raise$1() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

var selection_raise = function () {
  return this.each(raise$1);
};

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

var selection_lower = function () {
  return this.each(lower);
};

var selection_append = function (name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull() {
  return null;
}

var selection_insert = function (name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
};

function remove$1() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

var selection_remove = function () {
  return this.each(remove$1);
};

var selection_datum = function (value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
};

function dispatchEvent(node, type, params) {
  var window = window$1(node),
      event = window.CustomEvent;

  if (event) {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function () {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function () {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch = function (type, params) {
  return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type, params));
};

var root = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root);
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  merge: selection_merge,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch
};

var select = function (selector) {
    return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
};

var selectAll = function (selector) {
    return typeof selector === "string" ? new Selection([document.querySelectorAll(selector)], [document.documentElement]) : new Selection([selector == null ? [] : selector], root);
};

var touch = function (node, touches, identifier) {
  if (arguments.length < 3) identifier = touches, touches = sourceEvent().changedTouches;

  for (var i = 0, n = touches ? touches.length : 0, touch; i < n; ++i) {
    if ((touch = touches[i]).identifier === identifier) {
      return point$2(node, touch);
    }
  }

  return null;
};

var touches = function (node, touches) {
  if (touches == null) touches = sourceEvent().touches;

  for (var i = 0, n = touches ? touches.length : 0, points = new Array(n); i < n; ++i) {
    points[i] = point$2(node, touches[i]);
  }

  return points;
};

var emptyOn = dispatch("start", "end", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

var schedule = function (node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};else if (id in schedules) return;
  create$1(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
};

function init$1(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED) throw new Error("too late");
  return schedule;
}

function set$5(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING) throw new Error("too late");
  return schedule;
}

function get$3(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
  return schedule;
}

function create$1(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout$1(start);

      // Interrupt the active transition, if any.
      // Dispatch the interrupt event.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions. No interrupt event is dispatched
      // because the cancelled transitions never started. Note that this also
      // removes this transition from the pending list!
      else if (+i < id) {
          o.state = ENDED;
          o.timer.stop();
          delete schedules[i];
        }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout$1(function () {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(null, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) {
      return;
    } // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

var interrupt = function (node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) {
      empty = false;continue;
    }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    if (active) schedule.on.call("interrupt", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
};

var selection_interrupt = function (name) {
  return this.each(function () {
    interrupt(this, name);
  });
};

function tweenRemove(id, name) {
  var tween0, tween1;
  return function () {
    var schedule = set$5(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error();
  return function () {
    var schedule = set$5(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name: name, value: value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

var transition_tween = function (name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get$3(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
};

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function () {
    var schedule = set$5(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function (node) {
    return get$3(node, id).value[name];
  };
}

var interpolate$$1 = function (a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber : b instanceof color ? interpolateRgb : (c = color(b)) ? (b = c, interpolateRgb) : interpolateString)(a, b);
};

function attrRemove$1(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrConstantNS$1(fullname, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrFunction$1(name, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttribute(name);
    value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

function attrFunctionNS$1(fullname, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

var transition_attr = function (name, value) {
  var fullname = namespace(name),
      i = fullname === "transform" ? interpolateTransformSvg : interpolate$$1;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname) : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
};

function attrTweenNS(fullname, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttributeNS(fullname.space, fullname.local, i(t));
    };
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttribute(name, i(t));
    };
  }
  tween._value = value;
  return tween;
}

var transition_attrTween = function (name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
};

function delayFunction(id, value) {
  return function () {
    init$1(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function () {
    init$1(this, id).delay = value;
  };
}

var transition_delay = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id, value)) : get$3(this.node(), id).delay;
};

function durationFunction(id, value) {
  return function () {
    set$5(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function () {
    set$5(this, id).duration = value;
  };
}

var transition_duration = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id, value)) : get$3(this.node(), id).duration;
};

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error();
  return function () {
    set$5(this, id).ease = value;
  };
}

var transition_ease = function (value) {
  var id = this._id;

  return arguments.length ? this.each(easeConstant(id, value)) : get$3(this.node(), id).ease;
};

var transition_filter = function (match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
};

var transition_merge = function (transition) {
  if (transition._id !== this._id) throw new Error();

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
};

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function (t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0,
      on1,
      sit = start(name) ? init$1 : set$5;
  return function () {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

var transition_on = function (name, listener) {
  var id = this._id;

  return arguments.length < 2 ? get$3(this.node(), id).on.on(name) : this.each(onFunction(id, name, listener));
};

function removeFunction(id) {
  return function () {
    var parent = this.parentNode;
    for (var i in this.__transition) {
      if (+i !== id) return;
    }if (parent) parent.removeChild(this);
  };
}

var transition_remove = function () {
  return this.on("end.remove", removeFunction(this._id));
};

var transition_select = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selector(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get$3(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
};

var transition_selectAll = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selectorAll(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select$$1.call(node, node.__data__, i, group), child, inherit = get$3(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
};

var Selection$1 = selection.prototype.constructor;

var transition_selection = function () {
  return new Selection$1(this._groups, this._parents);
};

function styleRemove$1(name, interpolate$$2) {
    var value00, value10, interpolate0;
    return function () {
        var style = window$1(this).getComputedStyle(this, null),
            value0 = style.getPropertyValue(name),
            value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$2(value00 = value0, value10 = value1);
    };
}

function styleRemoveEnd(name) {
    return function () {
        this.style.removeProperty(name);
    };
}

function styleConstant$1(name, interpolate$$2, value1) {
    var value00, interpolate0;
    return function () {
        var value0 = window$1(this).getComputedStyle(this, null).getPropertyValue(name);
        return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$2(value00 = value0, value1);
    };
}

function styleFunction$1(name, interpolate$$2, value) {
    var value00, value10, interpolate0;
    return function () {
        var style = window$1(this).getComputedStyle(this, null),
            value0 = style.getPropertyValue(name),
            value1 = value(this);
        if (value1 == null) value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$2(value00 = value0, value10 = value1);
    };
}

var transition_style = function (name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss : interpolate$$1;
    return value == null ? this.styleTween(name, styleRemove$1(name, i)).on("end.style." + name, styleRemoveEnd(name)) : this.styleTween(name, typeof value === "function" ? styleFunction$1(name, i, tweenValue(this, "style." + name, value)) : styleConstant$1(name, i, value), priority);
};

function styleTween(name, value, priority) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.style.setProperty(name, i(t), priority);
    };
  }
  tween._value = value;
  return tween;
}

var transition_styleTween = function (name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
};

function textConstant$1(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function () {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

var transition_text = function (value) {
  return this.tween("text", typeof value === "function" ? textFunction$1(tweenValue(this, "text", value)) : textConstant$1(value == null ? "" : value + ""));
};

var transition_transition = function () {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get$3(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
};

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition$1(name) {
  return selection().transition(name);
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = transition$1.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease
};

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming.time = now(), defaultTiming;
    }
  }
  return timing;
}

var selection_transition = function (name) {
  var id, timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
};

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

var root$1 = [null];

// import {active} from 'd3-transition';


var SymbolTransition = function () {
    function SymbolTransition(factor) {
        classCallCheck(this, SymbolTransition);

        this.factor = factor || 1;
        this.time = Infinity;
        this.data1 = [];
    }

    createClass(SymbolTransition, [{
        key: 'update',
        value: function update(value) {
            this.pen = value.pen;
            this.time = value.time;
            this.current = value.data;
        }
    }, {
        key: 'draw',
        value: function draw(node) {
            node.context.beginPath();
            this.pen.context(node.context)();
        }
    }, {
        key: 'accessor',
        value: function accessor(f, j) {
            var factor = this.factor,
                data0 = this.data0,
                data1 = this.data1,
                time = this.time,
                prev,
                curr;
            return function (d, i) {
                prev = data0[i][j];
                if (prev === undefined) curr = factor * f(d);else curr = factor * (time * f(d) + (1 - time) * prev);
                data1[i][j] = curr;
                return curr;
            };
        }
    }]);
    return SymbolTransition;
}();

var PathTransition = function (_SymbolTransition) {
    inherits(PathTransition, _SymbolTransition);

    function PathTransition() {
        classCallCheck(this, PathTransition);
        return possibleConstructorReturn(this, (PathTransition.__proto__ || Object.getPrototypeOf(PathTransition)).apply(this, arguments));
    }

    createClass(PathTransition, [{
        key: 'update',
        value: function update(value) {
            if (value.time < this.time) {
                var data1 = this.data1;
                while (data1.length < value.data.length) {
                    data1.push(new Array(2));
                }this.data0 = this.data1;
                this.x = value.pen.x();
                this.y = value.pen.y();
            }
            get$1(PathTransition.prototype.__proto__ || Object.getPrototypeOf(PathTransition.prototype), 'update', this).call(this, value);
        }
    }, {
        key: 'draw',
        value: function draw(node) {
            node.context.beginPath();
            this.pen.context(node.context).x(this.accessor(this.x, 0)).y(this.accessor(this.y, 1))(this.current);
        }
    }]);
    return PathTransition;
}(SymbolTransition);

var shapeTransitions = {
    symbol: SymbolTransition,
    line: PathTransition,
    arc: PathTransition,
    area: PathTransition
};

var _setAttribute = function (node, attr, value) {
    var current = node.attrs.get(attr);
    if (current === value) return false;

    if (attr === 'd' && value && value.pen) {

        if (!current) {
            var Constructor = shapeTransitions[value.pen.name];
            current = new Constructor(node.factor);
            node.attrs.set(attr, current);
        }

        current.update(value);
        return true;
    } else {
        node.attrs.set(attr, value);
        return true;
    }
};

function pen(p, t, d, i) {
    return {
        pen: p,
        time: t,
        data: d,
        index: i || 0
    };
}

pen.test = function (name, value) {
    return name === 'd' && value && typeof value.context === 'function';
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

var namespace$1 = 'canvas';
var tag_line = 'line';
var tag_text = 'text';
var defaultBaseline = 'middle';
var textAlign = {
    start: 'start',
    middle: 'center',
    end: 'end'
};

var fontProperties = ['style', 'variant', 'weight', 'size', 'family'];

/**
 * A proxy for a data entry on canvas
 *
 * It partially implements the Node Api
 * https://developer.mozilla.org/en-US/docs/Web/API/Node
 *
 * It allow the use the d3-select and d3-transition libraries
 * on canvas joins
 */
var CanvasElement = function () {
    function CanvasElement(context, factor) {
        classCallCheck(this, CanvasElement);

        this.context = context;
        this.factor = factor || 1;
    }

    // API


    createClass(CanvasElement, [{
        key: 'querySelectorAll',
        value: function querySelectorAll(selector) {
            if (this._deque) {
                if (selector === '*') return this.childNodes;
                return select$1(selector, this._deque, []);
            } else return [];
        }
    }, {
        key: 'querySelector',
        value: function querySelector(selector) {
            if (this._deque) {
                if (selector === '*') return this._deque._head;
                return select$1(selector, this._deque);
            }
        }
    }, {
        key: 'createElementNS',
        value: function createElementNS(namespaceURI, qualifiedName) {
            var elem = new CanvasElement(this.context, this.factor);
            elem.tag = qualifiedName;
            return elem;
        }
    }, {
        key: 'hasChildNodes',
        value: function hasChildNodes() {
            return this._deque ? this._deque.length > 0 : false;
        }
    }, {
        key: 'contains',
        value: function contains(child) {
            while (child) {
                if (child._parent == this) return true;
                child = child._parent;
            }
            return false;
        }
    }, {
        key: 'appendChild',
        value: function appendChild(child) {
            return this.insertBefore(child);
        }
    }, {
        key: 'insertBefore',
        value: function insertBefore(child, refChild) {
            if (child === this) throw Error('inserting self into children');
            if (!(child instanceof CanvasElement)) throw Error('Cannot insert a non canvas element into a canvas element');
            if (child._parent) child._parent.removeChild(child);
            if (!this._deque) this._deque = deque();
            this._deque.prepend(child, refChild);
            child._parent = this;
            touch$1(this.root, 1);
            return child;
        }
    }, {
        key: 'removeChild',
        value: function removeChild(child) {
            if (child._parent === this) {
                delete child._parent;
                this._deque.remove(child);
                touch$1(this.root, 1);
                return child;
            }
        }
    }, {
        key: 'setAttribute',
        value: function setAttribute(attr, value) {
            if (attr === 'class') {
                this.class = value;
            } else if (attr === 'id') {
                this.id = value;
            } else {
                if (!this.attrs) this.attrs = map$1();
                if (_setAttribute(this, attr, value)) touch$1(this.root, 1);
            }
        }
    }, {
        key: 'removeAttribute',
        value: function removeAttribute(attr) {
            if (this.attrs) {
                this.attrs.remove(attr);
                touch$1(this.root, 1);
            }
        }
    }, {
        key: 'getAttribute',
        value: function getAttribute(attr) {
            if (this.attrs) return this.attrs.get(attr);
        }
    }, {
        key: 'draw',
        value: function draw(t) {
            var ctx = this.context,
                attrs = this.attrs;

            if (attrs) {
                ctx.save();
                transform(this, this.attrs.get('transform'));
                ctx.save();
                if (this.tag === tag_line) drawLine(this);else if (this.tag === tag_text) drawText(this);else path$2(this, attrs.get('d'), t);
                fillStyle(this);
                strokeStyle(this);
                ctx.restore();
            }

            if (this._deque) this._deque.each(function (child) {
                child.draw(t);
            });

            if (attrs) ctx.restore();
        }
    }, {
        key: 'each',
        value: function each(f) {
            if (this._deque) this._deque.each(f);
        }
    }, {
        key: 'getValue',
        value: function getValue(attr) {
            var value = this.getAttribute(attr);
            if (value === undefined && this._parent) return this._parent.getValue(attr);
            return value;
        }

        // Additional attribute functions

    }, {
        key: 'removeProperty',
        value: function removeProperty(name) {
            this.removeAttribute(name);
        }
    }, {
        key: 'setProperty',
        value: function setProperty(name, value) {
            this.setAttribute(name, value);
        }
    }, {
        key: 'getProperty',
        value: function getProperty(name) {
            return this.getAttribute(name);
        }
    }, {
        key: 'getPropertyValue',
        value: function getPropertyValue(name) {
            return this.getAttribute(name);
        }

        // Proxies to this object

    }, {
        key: 'getComputedStyle',
        value: function getComputedStyle() {
            return this;
        }
    }, {
        key: 'onStart',

        //
        value: function onStart() {
            return;
        }
    }, {
        key: 'childNodes',
        get: function get() {
            return this._deque ? this._deque.list() : [];
        }
    }, {
        key: 'firstChild',
        get: function get() {
            return this._deque ? this._deque._head : null;
        }
    }, {
        key: 'lastChild',
        get: function get() {
            return this._deque ? this._deque._tail : null;
        }
    }, {
        key: 'parentNode',
        get: function get() {
            return this._parent;
        }
    }, {
        key: 'previousSibling',
        get: function get() {
            return this._prev;
        }
    }, {
        key: 'nextSibling',
        get: function get() {
            return this._next;
        }
    }, {
        key: 'namespaceURI',
        get: function get() {
            return namespace$1;
        }

        // Canvas methods

    }, {
        key: 'countNodes',
        get: function get() {
            return this._deque ? this._deque._length : 0;
        }
    }, {
        key: 'root',
        get: function get() {
            if (this._parent) return this._parent.root;
            return this;
        }
    }, {
        key: 'ownerDocument',
        get: function get() {
            return this;
        }
    }, {
        key: 'style',
        get: function get() {
            return this;
        }
    }, {
        key: 'defaultView',
        get: function get() {
            return this;
        }
    }, {
        key: 'document',
        get: function get() {
            return this;
        }
    }]);
    return CanvasElement;
}();

function select$1(selector, deque$$1, selections) {

    var selectors = selector.split(' ');

    for (var s = 0; s < selectors.length; ++s) {
        selector = selectors[s];
        var bits = selector.split('.'),
            tag = bits[0],
            classes = bits.splice(1).join(' '),
            child = deque$$1._head;

        while (child) {
            if (!tag || child.tag === tag) {
                if (classes && child.class !== classes) {
                    // nothing to do
                } else if (selections) selections.push(child);else return child;
            }
            child = child._next;
        }
    }

    return selections;
}

function strokeStyle(node) {
    var stroke = node.attrs.get('stroke');
    if (stroke && stroke !== 'none') {
        stroke = color(stroke);
        var opacity = node.getValue('stroke-opacity');
        if (opacity || opacity === 0) stroke.opacity = opacity;
        node.context.strokeStyle = '' + stroke;
        node.context.lineWidth = node.factor * (node.getValue('stroke-width') || 1);
        node.context.stroke();
        return stroke;
    }
}

function fillStyle(node) {
    var fill = node.attrs.get('fill');
    if (fill && fill !== 'none') {
        fill = color(fill);
        var opacity = node.getValue('fill-opacity');
        if (opacity || opacity === 0) fill.opacity = opacity;
        node.context.fillStyle = '' + fill;
        node.context.fill();
        return fill;
    }
}

function transform(node, trans) {
    if (!trans) return;
    var index1 = trans.indexOf('translate('),
        index2,
        s,
        bits;
    if (index1 > -1) {
        s = trans.substring(index1 + 10);
        index2 = s.indexOf(')');
        bits = s.substring(0, index2).split(',');
        node.context.translate(node.factor * bits[0], node.factor * bits[1]);
    }
    return true;
}

function drawLine(node) {
    var attrs = node.attrs;
    node.context.moveTo(node.factor * (attrs.get('x1') || 0), node.factor * (attrs.get('y1') || 0));
    node.context.lineTo(node.factor * attrs.get('x2'), node.factor * attrs.get('y2'));
}

function drawText(node) {
    var size = fontString(node);
    node.context.textAlign = textAlign[node.getValue('text-anchor')] || textAlign.middle;
    node.context.textBaseline = node.getValue('text-baseline') || defaultBaseline;
    node.context.fillText(node.textContent || '', fontLocation(node, 'x', size), fontLocation(node, 'y', size));
}

function path$2(node, path) {
    if (path) {
        if (typeof path.draw === 'function') path.draw(node);else if (path.context) path.context(node.context)();
    }
}

function fontString(node) {
    var bits = [],
        size = 0,
        key = void 0,
        v = void 0;
    for (var i = 0; i < fontProperties.length; ++i) {
        key = fontProperties[i];
        v = node.getValue('font-' + key);
        if (v) {
            if (key === 'size') {
                size = node.factor * v;
                v = size + 'px';
            }
            bits.push(v);
        }
    }
    if (size) node.context.font = bits.join(' ');
    return size;
}

function fontLocation(node, d, size) {
    var p = node.attrs.get(d) || 0,
        dp = node.attrs.get('d' + d) || 0;
    if (dp) {
        if (dp.substring(dp.length - 2) == 'em') dp = size * dp.substring(0, dp.length - 2);else if (dp.substring(dp.length - 2) == 'px') dp = +dp.substring(0, dp.length - 2);
    }
    return node.factor * (p + dp);
}

function touch$1(node, v) {
    if (!node._touches) node._touches = 0;
    node._touches += v;
    if (!node._touches || node._inloop) return;
    node._inloop = timeout$1(redraw(node));
}

function redraw(node) {

    return function () {
        var ctx = node.context;
        node._touches = 0;
        ctx.beginPath();
        ctx.closePath();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        node.draw();
        node._inloop = false;
        touch$1(node, 0);
    };
}

var originalAttr = transition$1.prototype.attr;

function tweenAttr(name, value) {
    var node = this.node();
    if (node instanceof CanvasElement && pen.test(name, value)) {
        return transition$1.prototype.attrTween.call(this, name, wrapPath(value));
    } else return originalAttr.call(this, name, value);
}

transition$1.prototype.attr = tweenAttr;

function wrapPath(p) {
    return function (d, i) {
        return function (t) {
            return pen(p, t, d, i);
        };
    };
}

var resolution = function (factor) {
    return factor || window.devicePixelRatio || 1;
};

function canvasSelection(context, factor) {
    if (!factor) factor = resolution();
    var s = selection();
    s._groups[0][0] = new CanvasElement(context, factor);
    return s;
}

canvasSelection.prototype = selection.prototype;

var originalAttr$1 = canvasSelection.prototype.attr;

function selectAttr(name, value) {
    if (arguments.length > 1) {
        var ref = this._parents[0] || this.node();
        if (ref instanceof CanvasElement && pen.test(name, value)) arguments[1] = pen(value, 1);
    }
    return originalAttr$1.apply(this, arguments);
}

canvasSelection.prototype.attr = selectAttr;

var slice$3 = Array.prototype.slice;

function identity$5(d) {
    return d;
}

var top = 1;
var right$1 = 2;
var bottom = 3;
var left$1 = 4;
var epsilon$2 = 1e-6;

function translateX(scale0, scale1, d) {
    var x = scale0(d);
    return 'translate(' + (isFinite(x) ? x : scale1(d)) + ',0)';
}

function translateY(scale0, scale1, d) {
    var y = scale0(d);
    return 'translate(0,' + (isFinite(y) ? y : scale1(d)) + ')';
}

function center(scale) {
    var width = scale.bandwidth() / 2;
    return function (d) {
        return scale(d) + width;
    };
}

function axis(orient, scale) {
    var tickArguments = [],
        tickValues = null,
        tickFormat = null,
        tickSizeInner = 6,
        tickSizeOuter = 6,
        tickPadding = 3;

    function axis(context) {
        var values = tickValues == null ? scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain() : tickValues,
            format = tickFormat == null ? scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity$5 : tickFormat,
            spacing = Math.max(tickSizeInner, 0) + tickPadding,
            transform = orient === top || orient === bottom ? translateX : translateY,
            range = scale.range(),
            range0 = range[0],
            range1 = range[range.length - 1],
            position = (scale.bandwidth ? center : identity$5)(scale.copy()),
            selection = context.selection ? context.selection() : context,
            path = selection.selectAll('.domain').data([null]),
            tick = selection.selectAll('.tick').data(values, scale).order(),
            tickExit = tick.exit(),
            tickEnter = tick.enter().append('g', '.domain').attr('class', 'tick'),
            line = tick.select('line'),
            text = tick.select('text');

        path = path.merge(path.enter().append('line').attr('class', 'domain'));
        tick = tick.merge(tickEnter);
        line = line.merge(tickEnter.append('line'));
        text = text.merge(tickEnter.append('text'));

        if (context !== selection) {
            path = path.transition(context);
            tick = tick.transition(context);
            tickExit = tickExit.transition(context).style('opacity', epsilon$2).attr('transform', function (d) {
                return transform(position, this.parentNode.__axis || position, d);
            });
            tickEnter.style('opacity', epsilon$2).attr('transform', function (d) {
                return transform(this.parentNode.__axis || position, position, d);
            });
            line = line.transition(context);
            text = text.transition(context);
        }

        tick.style('opacity', 1).attr('transform', function (d) {
            return transform(position, position, d);
        });
        tickExit.remove();
        text.text(format);

        switch (orient) {
            case top:
                {
                    path.attr('x1', range0).attr('y1', -tickSizeOuter).attr('x2', range1).attr('y2', -tickSizeOuter);
                    line.attr('x2', 0).attr('y2', -tickSizeInner);
                    text.attr('x', 0).attr('y', -spacing).attr('dy', '0em').style('text-anchor', 'middle');
                    break;
                }
            case right$1:
                {
                    path.attr('x1', tickSizeOuter).attr('y1', range0).attr('x2', tickSizeOuter).attr('y2', range1);
                    line.attr('y2', 0).attr('x2', tickSizeInner);
                    text.attr('y', 0).attr('x', spacing).attr('dy', '.32em').style('text-anchor', 'start');
                    break;
                }
            case bottom:
                {
                    path.attr('x1', range0).attr('y1', tickSizeOuter).attr('x2', range1).attr('y2', tickSizeOuter);
                    line.attr('x2', 0).attr('y2', tickSizeInner);
                    text.attr('x', 0).attr('y', spacing).attr('dy', '.71em').style('text-anchor', 'middle');
                    break;
                }
            case left$1:
                {
                    path.attr('x1', -tickSizeOuter).attr('y1', range0).attr('x2', -tickSizeOuter).attr('y2', range1);
                    line.attr('y2', 0).attr('x2', -tickSizeInner);
                    text.attr('y', 0).attr('x', -spacing).attr('dy', '.32em').style('text-anchor', 'end');
                    break;
                }
        }

        selection.each(function () {
            this.__axis = position;
        });
    }

    axis.scale = function (_) {
        return arguments.length ? (scale = _, axis) : scale;
    };

    axis.ticks = function () {
        return tickArguments = slice$3.call(arguments), axis;
    };

    axis.tickArguments = function (_) {
        return arguments.length ? (tickArguments = _ == null ? [] : slice$3.call(_), axis) : tickArguments.slice();
    };

    axis.tickValues = function (_) {
        return arguments.length ? (tickValues = _ == null ? null : slice$3.call(_), axis) : tickValues && tickValues.slice();
    };

    axis.tickFormat = function (_) {
        return arguments.length ? (tickFormat = _, axis) : tickFormat;
    };

    axis.tickSize = function (_) {
        return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
    };

    axis.tickSizeInner = function (_) {
        return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
    };

    axis.tickSizeOuter = function (_) {
        return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
    };

    axis.tickPadding = function (_) {
        return arguments.length ? (tickPadding = +_, axis) : tickPadding;
    };

    return axis;
}

function axisTop(scale) {
    return axis(top, scale);
}

function axisRight(scale) {
    return axis(right$1, scale);
}

function axisBottom(scale) {
    return axis(bottom, scale);
}

function axisLeft(scale) {
    return axis(left$1, scale);
}

var version$1 = "0.2.1";

var ostring$1 = Object.prototype.toString;
var inBrowser$1 = typeof window !== 'undefined' && ostring$1.call(window) !== '[object Object]';

var logger$1 = inBrowser$1 ? window.console : require('console');

// From https://github.com/sindresorhus/object-assign
// The MIT License (MIT)
//
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
var hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var propIsEnumerable$1 = Object.prototype.propertyIsEnumerable;

var assign$2 = assign$3();

function toObject$1(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative$1() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
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
		if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

function assign$3() {
	return shouldUseNative$1() ? Object.assign : function (target) {
		var from;
		var to = toObject$1(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty$1.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (Object.getOwnPropertySymbols) {
				symbols = Object.getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable$1.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};
}

// Simulate a WeekMap for now

function isObject$1(value) {
    return ostring$1.call(value) === '[object Object]';
}

function isString$1(value) {
    return ostring$1.call(value) === '[object String]';
}

function isFunction$1(value) {
    return ostring$1.call(value) === '[object Function]';
}

function isArray$1(value) {
    return ostring$1.call(value) === '[object Array]';
}





function isPromise$1(value) {
    return ostring$1.call(value) === '[object Promise]';
}

var pop$2 = function (obj, prop) {
    var value = void 0;
    if (isObject$1(obj)) {
        value = obj[prop];
        delete obj[prop];
        return value;
    } else if (isArray$1(obj)) {
        var index = +prop;
        if (index === index) return obj.splice(index, 1)[0];
        value = obj[prop];
        delete obj[prop];
        return value;
    }
};

var prefix$2 = "$";

function Map$2() {
    this._array = [];
}

Map$2.prototype = map$6.prototype = {
    constructor: Map$2,

    size: function size() {
        return this._array.length;
    },
    get: function get(key) {
        return this[prefix$2 + key];
    },
    set: function set(key, value) {
        if (!this.has(key)) this._array.push(key);
        this[prefix$2 + key] = value;
        return this;
    },
    has: function has(key) {
        return prefix$2 + key in this;
    },
    clear: function clear() {
        var self = this;
        this.each(function (_, property) {
            delete self[prefix$2 + property];
        });
        this._array.splice(0);
    },
    keys: function keys() {
        var entries = [];
        this.each(function (_, key) {
            entries.push(key);
        });
        return entries;
    },
    values: function values() {
        var entries = [];
        this.each(function (v) {
            entries.push(v);
        });
        return entries;
    },
    each: function each(callback) {
        var a = this._array,
            key;
        for (var i = 0; i < a.length; ++i) {
            key = a[i];
            callback(this.get(key), key, i);
        }
    }
};

function map$6(object, f) {
    var map = new Map$2();

    // Copy constructor.
    if (object instanceof Map$2) object.each(function (value, key) {
        map.set(key, value);
    });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
            var i = -1,
                n = object.length,
                o;

            if (f == null) while (++i < n) {
                map.set(i, object[i]);
            } else while (++i < n) {
                map.set(f(o = object[i], i, object), o);
            }
        }

        // Convert object to map.
        else if (object) for (var key in object) {
                map.set(key, object[key]);
            }return map;
}

var xhtml$1 = "http://www.w3.org/1999/xhtml";

var namespaces$1 = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml$1,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace$2 = function (name) {
  var prefix = name += "",
      i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces$1.hasOwnProperty(prefix) ? { space: namespaces$1[prefix], local: name } : name;
};

function creatorInherit$1(name) {
  return function () {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml$1 && document.documentElement.namespaceURI === xhtml$1 ? document.createElement(name) : document.createElementNS(uri, name);
  };
}

function creatorFixed$1(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator$1 = function (name) {
  var fullname = namespace$2(name);
  return (fullname.local ? creatorFixed$1 : creatorInherit$1)(fullname);
};

var nextId$1 = 0;

var matcher$2 = function matcher$2(selector) {
  return function () {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element$3 = document.documentElement;
  if (!element$3.matches) {
    var vendorMatches$1 = element$3.webkitMatchesSelector || element$3.msMatchesSelector || element$3.mozMatchesSelector || element$3.oMatchesSelector;
    matcher$2 = function matcher$2(selector) {
      return function () {
        return vendorMatches$1.call(this, selector);
      };
    };
  }
}

var matcher$3 = matcher$2;

var filterEvents$1 = {};

var event$1 = null;

if (typeof document !== "undefined") {
  var element$4 = document.documentElement;
  if (!("onmouseenter" in element$4)) {
    filterEvents$1 = { mouseenter: "mouseover", mouseleave: "mouseout" };
  }
}

function filterContextListener$1(listener, index, group) {
  listener = contextListener$1(listener, index, group);
  return function (event) {
    var related = event.relatedTarget;
    if (!related || related !== this && !(related.compareDocumentPosition(this) & 8)) {
      listener.call(this, event);
    }
  };
}

function contextListener$1(listener, index, group) {
  return function (event1) {
    var event0 = event$1; // Events can be reentrant (e.g., focus).
    event$1 = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event$1 = event0;
    }
  };
}

function parseTypenames$2(typenames) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name: name };
  });
}

function onRemove$1(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;else delete this.__on;
  };
}

function onAdd$1(typename, value, capture) {
  var wrap = filterEvents$1.hasOwnProperty(typename.type) ? filterContextListener$1 : contextListener$1;
  return function (d, i, group) {
    var on = this.__on,
        o,
        listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = { type: typename.type, name: typename.name, value: value, listener: listener, capture: capture };
    if (!on) this.__on = [o];else on.push(o);
  };
}

var selection_on$1 = function (typename, value, capture) {
  var typenames = parseTypenames$2(typename + ""),
      i,
      n = typenames.length,
      t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd$1 : onRemove$1;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) {
    this.each(on(typenames[i], value, capture));
  }return this;
};

var sourceEvent$1 = function () {
  var current = event$1,
      source;
  while (source = current.sourceEvent) {
    current = source;
  }return current;
};

var point$3 = function (node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
};

function none$3() {}

var selector$1 = function (selector) {
  return selector == null ? none$3 : function () {
    return this.querySelector(selector);
  };
};

var selection_select$1 = function (select) {
  if (typeof select !== "function") select = selector$1(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$2(subgroups, this._parents);
};

function empty$2() {
  return [];
}

var selectorAll$1 = function (selector) {
  return selector == null ? empty$2 : function () {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll$1 = function (select) {
  if (typeof select !== "function") select = selectorAll$1(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$2(subgroups, parents);
};

var selection_filter$1 = function (match) {
  if (typeof match !== "function") match = matcher$3(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$2(subgroups, this._parents);
};

var sparse$1 = function (update) {
  return new Array(update.length);
};

var selection_enter$1 = function () {
  return new Selection$2(this._enter || this._groups.map(sparse$1), this._parents);
};

function EnterNode$1(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode$1.prototype = {
  constructor: EnterNode$1,
  appendChild: function appendChild(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function insertBefore(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function querySelector(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function querySelectorAll(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

var constant$6 = function (x) {
  return function () {
    return x;
  };
};

var keyPrefix$1 = "$"; // Protect against keys like “__proto__”.

function bindIndex$1(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode$1(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey$1(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix$1 + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix$1 + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode$1(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue[keyValues[i]] === node) {
      exit[i] = node;
    }
  }
}

var selection_data$1 = function (value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function (d) {
      data[++j] = d;
    });
    return data;
  }

  var bind = key ? bindKey$1 : bindIndex$1,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$6(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) {}
        previous._next = next || null;
      }
    }
  }

  update = new Selection$2(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit$1 = function () {
  return new Selection$2(this._exit || this._groups.map(sparse$1), this._parents);
};

var selection_merge$1 = function (selection) {

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$2(merges, this._parents);
};

var selection_order$1 = function () {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
};

var selection_sort$1 = function (compare) {
  if (!compare) compare = ascending$3;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$2(sortgroups, this._parents).order();
};

function ascending$3(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call$1 = function () {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes$1 = function () {
  var nodes = new Array(this.size()),
      i = -1;
  this.each(function () {
    nodes[++i] = this;
  });
  return nodes;
};

var selection_node$1 = function () {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
};

var selection_size$1 = function () {
  var size = 0;
  this.each(function () {
    ++size;
  });
  return size;
};

var selection_empty$1 = function () {
  return !this.node();
};

var selection_each$1 = function (callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
};

function attrRemove$2(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$2(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$2(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$2(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$2(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);else this.setAttribute(name, v);
  };
}

function attrFunctionNS$2(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

var selection_attr$1 = function (name, value) {
  var fullname = namespace$2(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }

  return this.each((value == null ? fullname.local ? attrRemoveNS$2 : attrRemove$2 : typeof value === "function" ? fullname.local ? attrFunctionNS$2 : attrFunction$2 : fullname.local ? attrConstantNS$2 : attrConstant$2)(fullname, value));
};

var window$2 = function (node) {
    return node.ownerDocument && node.ownerDocument.defaultView || // node is a Node
    node.document && node // node is a Window
    || node.defaultView; // node is a Document
};

function styleRemove$2(name) {
  return function () {
    this.style.removeProperty(name);
  };
}

function styleConstant$2(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$2(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);else this.style.setProperty(name, v, priority);
  };
}

var selection_style$1 = function (name, value, priority) {
  var node;
  return arguments.length > 1 ? this.each((value == null ? styleRemove$2 : typeof value === "function" ? styleFunction$2 : styleConstant$2)(name, value, priority == null ? "" : priority)) : window$2(node = this.node()).getComputedStyle(node, null).getPropertyValue(name);
};

function propertyRemove$1(name) {
  return function () {
    delete this[name];
  };
}

function propertyConstant$1(name, value) {
  return function () {
    this[name] = value;
  };
}

function propertyFunction$1(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];else this[name] = v;
  };
}

var selection_property$1 = function (name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove$1 : typeof value === "function" ? propertyFunction$1 : propertyConstant$1)(name, value)) : this.node()[name];
};

function classArray$1(string) {
  return string.trim().split(/^|\s+/);
}

function classList$1(node) {
  return node.classList || new ClassList$1(node);
}

function ClassList$1(node) {
  this._node = node;
  this._names = classArray$1(node.getAttribute("class") || "");
}

ClassList$1.prototype = {
  add: function add(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function remove(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function contains(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd$1(node, names) {
  var list = classList$1(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.add(names[i]);
  }
}

function classedRemove$1(node, names) {
  var list = classList$1(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.remove(names[i]);
  }
}

function classedTrue$1(names) {
  return function () {
    classedAdd$1(this, names);
  };
}

function classedFalse$1(names) {
  return function () {
    classedRemove$1(this, names);
  };
}

function classedFunction$1(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd$1 : classedRemove$1)(this, names);
  };
}

var selection_classed$1 = function (name, value) {
  var names = classArray$1(name + "");

  if (arguments.length < 2) {
    var list = classList$1(this.node()),
        i = -1,
        n = names.length;
    while (++i < n) {
      if (!list.contains(names[i])) return false;
    }return true;
  }

  return this.each((typeof value === "function" ? classedFunction$1 : value ? classedTrue$1 : classedFalse$1)(names, value));
};

function textRemove$1() {
  this.textContent = "";
}

function textConstant$2(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction$2(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text$1 = function (value) {
  return arguments.length ? this.each(value == null ? textRemove$1 : (typeof value === "function" ? textFunction$2 : textConstant$2)(value)) : this.node().textContent;
};

function htmlRemove$1() {
  this.innerHTML = "";
}

function htmlConstant$1(value) {
  return function () {
    this.innerHTML = value;
  };
}

function htmlFunction$1(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html$1 = function (value) {
  return arguments.length ? this.each(value == null ? htmlRemove$1 : (typeof value === "function" ? htmlFunction$1 : htmlConstant$1)(value)) : this.node().innerHTML;
};

function raise$2() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

var selection_raise$1 = function () {
  return this.each(raise$2);
};

function lower$1() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

var selection_lower$1 = function () {
  return this.each(lower$1);
};

var selection_append$1 = function (name) {
  var create = typeof name === "function" ? name : creator$1(name);
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull$1() {
  return null;
}

var selection_insert$1 = function (name, before) {
  var create = typeof name === "function" ? name : creator$1(name),
      select = before == null ? constantNull$1 : typeof before === "function" ? before : selector$1(before);
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
};

function remove$2() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

var selection_remove$1 = function () {
  return this.each(remove$2);
};

var selection_datum$1 = function (value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
};

function dispatchEvent$1(node, type, params) {
  var window = window$2(node),
      event = window.CustomEvent;

  if (event) {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant$1(type, params) {
  return function () {
    return dispatchEvent$1(this, type, params);
  };
}

function dispatchFunction$1(type, params) {
  return function () {
    return dispatchEvent$1(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch$1 = function (type, params) {
  return this.each((typeof params === "function" ? dispatchFunction$1 : dispatchConstant$1)(type, params));
};

var root$2 = [null];

function Selection$2(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection$2() {
  return new Selection$2([[document.documentElement]], root$2);
}

Selection$2.prototype = selection$2.prototype = {
  constructor: Selection$2,
  select: selection_select$1,
  selectAll: selection_selectAll$1,
  filter: selection_filter$1,
  data: selection_data$1,
  enter: selection_enter$1,
  exit: selection_exit$1,
  merge: selection_merge$1,
  order: selection_order$1,
  sort: selection_sort$1,
  call: selection_call$1,
  nodes: selection_nodes$1,
  node: selection_node$1,
  size: selection_size$1,
  empty: selection_empty$1,
  each: selection_each$1,
  attr: selection_attr$1,
  style: selection_style$1,
  property: selection_property$1,
  classed: selection_classed$1,
  text: selection_text$1,
  html: selection_html$1,
  raise: selection_raise$1,
  lower: selection_lower$1,
  append: selection_append$1,
  insert: selection_insert$1,
  remove: selection_remove$1,
  datum: selection_datum$1,
  on: selection_on$1,
  dispatch: selection_dispatch$1
};

var select$2 = function (selector) {
    return typeof selector === "string" ? new Selection$2([[document.querySelector(selector)]], [document.documentElement]) : new Selection$2([[selector]], root$2);
};

var selectAll$1 = function (selector) {
    return typeof selector === "string" ? new Selection$2([document.querySelectorAll(selector)], [document.documentElement]) : new Selection$2([selector == null ? [] : selector], root$2);
};

var prefix$3 = "$";

function Map$3() {}

Map$3.prototype = map$8.prototype = {
  constructor: Map$3,
  has: function has(key) {
    return prefix$3 + key in this;
  },
  get: function get(key) {
    return this[prefix$3 + key];
  },
  set: function set(key, value) {
    this[prefix$3 + key] = value;
    return this;
  },
  remove: function remove(key) {
    var property = prefix$3 + key;
    return property in this && delete this[property];
  },
  clear: function clear() {
    for (var property in this) {
      if (property[0] === prefix$3) delete this[property];
    }
  },
  keys: function keys() {
    var keys = [];
    for (var property in this) {
      if (property[0] === prefix$3) keys.push(property.slice(1));
    }return keys;
  },
  values: function values() {
    var values = [];
    for (var property in this) {
      if (property[0] === prefix$3) values.push(this[property]);
    }return values;
  },
  entries: function entries() {
    var entries = [];
    for (var property in this) {
      if (property[0] === prefix$3) entries.push({ key: property.slice(1), value: this[property] });
    }return entries;
  },
  size: function size() {
    var size = 0;
    for (var property in this) {
      if (property[0] === prefix$3) ++size;
    }return size;
  },
  empty: function empty() {
    for (var property in this) {
      if (property[0] === prefix$3) return false;
    }return true;
  },
  each: function each(f) {
    for (var property in this) {
      if (property[0] === prefix$3) f(this[property], property.slice(1), this);
    }
  }
};

function map$8(object, f) {
  var map = new Map$3();

  // Copy constructor.
  if (object instanceof Map$3) object.each(function (value, key) {
    map.set(key, value);
  });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) {
        map.set(i, object[i]);
      } else while (++i < n) {
        map.set(f(o = object[i], i, object), o);
      }
    }

    // Convert object to map.
    else if (object) for (var key in object) {
        map.set(key, object[key]);
      }return map;
}

function createObject$1() {
  return {};
}

function setObject$1(object, key, value) {
  object[key] = value;
}

function createMap$1() {
  return map$8();
}

function setMap$1(map, key, value) {
  map.set(key, value);
}

function Set$1() {}

var proto$1 = map$8.prototype;

Set$1.prototype = set$6.prototype = {
  constructor: Set$1,
  has: proto$1.has,
  add: function add(value) {
    value += "";
    this[prefix$3 + value] = value;
    return this;
  },
  remove: proto$1.remove,
  clear: proto$1.clear,
  values: proto$1.keys,
  size: proto$1.size,
  empty: proto$1.empty,
  each: proto$1.each
};

function set$6(object, f) {
  var set = new Set$1();

  // Copy constructor.
  if (object instanceof Set$1) object.each(function (value) {
    set.add(value);
  });

  // Otherwise, assume it’s an array.
  else if (object) {
      var i = -1,
          n = object.length;
      if (f == null) while (++i < n) {
        set.add(object[i]);
      } else while (++i < n) {
        set.add(f(object[i], i, object));
      }
    }

  return set;
}

var noop$2 = { value: function value() {} };

function dispatch$2() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch$1(_);
}

function Dispatch$1(_) {
  this._ = _;
}

function parseTypenames$3(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return { type: t, name: name };
  });
}

Dispatch$1.prototype = dispatch$2.prototype = {
  constructor: Dispatch$1,
  on: function on(typename, callback) {
    var _ = this._,
        T = parseTypenames$3(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) {
        if ((t = (typename = T[i]).type) && (t = get$4(_[t], typename.name))) return t;
      }return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$8(_[t], typename.name, callback);else if (callback == null) for (t in _) {
        _[t] = set$8(_[t], typename.name, null);
      }
    }

    return this;
  },
  copy: function copy() {
    var copy = {},
        _ = this._;
    for (var t in _) {
      copy[t] = _[t].slice();
    }return new Dispatch$1(copy);
  },
  call: function call(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) {
      args[i] = arguments[i + 2];
    }if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  },
  apply: function apply(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  }
};

function get$4(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$8(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop$2, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({ name: name, value: callback });
  return type;
}

// Code originally from https://github.com/soney/jsep
// Copyright (c) 2013 Stephen Oney, http://jsep.from.so/

// This is the full set of types that any JSEP node can be.
// Store them here to save space when minified
var code = {
    COMPOUND: 'Compound',
    IDENTIFIER: 'Identifier',
    MEMBER_EXP: 'MemberExpression',
    LITERAL: 'Literal',
    THIS_EXP: 'ThisExpression',
    CALL_EXP: 'CallExpression',
    UNARY_EXP: 'UnaryExpression',
    BINARY_EXP: 'BinaryExpression',
    LOGICAL_EXP: 'LogicalExpression',
    CONDITIONAL_EXP: 'ConditionalExpression',
    ARRAY_EXP: 'ArrayExpression'
};

var PERIOD_CODE = 46;
var COMMA_CODE = 44;
var SQUOTE_CODE = 39;
var DQUOTE_CODE = 34;
var OPAREN_CODE = 40;
var CPAREN_CODE = 41;
var OBRACK_CODE = 91;
var CBRACK_CODE = 93;
var QUMARK_CODE = 63;
var SEMCOL_CODE = 59;
var COLON_CODE = 58;
var throwError = function throwError(message, index) {
    var error = new Error(message + ' at character ' + index);
    error.index = index;
    error.description = message;
    throw error;
};
var t = true;
var unary_ops = { '-': t, '!': t, '~': t, '+': t };
var binary_ops = {
    '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
    '==': 6, '!=': 6, '===': 6, '!==': 6,
    '<': 7, '>': 7, '<=': 7, '>=': 7,
    '<<': 8, '>>': 8, '>>>': 8,
    '+': 9, '-': 9,
    '*': 10, '/': 10, '%': 10
};
var getMaxKeyLen = function getMaxKeyLen(obj) {
    var max_len = 0,
        len;
    for (var key in obj) {
        if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
            max_len = len;
        }
    }
    return max_len;
};
var max_unop_len = getMaxKeyLen(unary_ops);
var max_binop_len = getMaxKeyLen(binary_ops);
var literals = {
    'true': true,
    'false': false,
    'null': null
};
var this_str = 'this';
var binaryPrecedence = function binaryPrecedence(op_val) {
    return binary_ops[op_val] || 0;
};
var createBinaryExpression = function createBinaryExpression(operator, left, right) {
    var type = operator === '||' || operator === '&&' ? code.LOGICAL_EXP : code.BINARY_EXP;
    return {
        type: type,
        operator: operator,
        left: left,
        right: right
    };
};
var isDecimalDigit = function isDecimalDigit(ch) {
    return ch >= 48 && ch <= 57; // 0...9
};
var isIdentifierStart = function isIdentifierStart(ch) {
    return ch === 36 || ch === 95 || // `$` and `_`
    ch >= 65 && ch <= 90 || // A...Z
    ch >= 97 && ch <= 122 || // a...z
    ch >= 128 && !binary_ops[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
};
var isIdentifierPart = function isIdentifierPart(ch) {
    return ch === 36 || ch === 95 || // `$` and `_`
    ch >= 65 && ch <= 90 || // A...Z
    ch >= 97 && ch <= 122 || // a...z
    ch >= 48 && ch <= 57 || // 0...9
    ch >= 128 && !binary_ops[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
};
var jsep = function jsep(expr) {
    // `index` stores the character number we are currently at while `length` is a constant
    // All of the gobbles below will modify `index` as we move along
    var index = 0,
        charAtFunc = expr.charAt,
        charCodeAtFunc = expr.charCodeAt,
        exprI = function exprI(i) {
        return charAtFunc.call(expr, i);
    },
        exprICode = function exprICode(i) {
        return charCodeAtFunc.call(expr, i);
    },
        length = expr.length,


    // Push `index` up to the next non-space character
    gobbleSpaces = function gobbleSpaces() {
        var ch = exprICode(index);
        // space or tab
        while (ch === 32 || ch === 9) {
            ch = exprICode(++index);
        }
    },


    // The main parsing function. Much of this code is dedicated to ternary expressions
    gobbleExpression = function gobbleExpression() {
        var test = gobbleBinaryExpression(),
            consequent,
            alternate;
        gobbleSpaces();
        if (exprICode(index) === QUMARK_CODE) {
            // Ternary expression: test ? consequent : alternate
            index++;
            consequent = gobbleExpression();
            if (!consequent) {
                throwError('Expected expression', index);
            }
            gobbleSpaces();
            if (exprICode(index) === COLON_CODE) {
                index++;
                alternate = gobbleExpression();
                if (!alternate) {
                    throwError('Expected expression', index);
                }
                return {
                    type: code.CONDITIONAL_EXP,
                    test: test,
                    consequent: consequent,
                    alternate: alternate
                };
            } else {
                throwError('Expected :', index);
            }
        } else {
            return test;
        }
    },


    // Search for the operation portion of the string (e.g. `+`, `===`)
    // Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
    // and move down from 3 to 2 to 1 character until a matching binary operation is found
    // then, return that binary operation
    gobbleBinaryOp = function gobbleBinaryOp() {
        gobbleSpaces();
        var to_check = expr.substr(index, max_binop_len),
            tc_len = to_check.length;
        while (tc_len > 0) {
            if (binary_ops.hasOwnProperty(to_check)) {
                index += tc_len;
                return to_check;
            }
            to_check = to_check.substr(0, --tc_len);
        }
        return false;
    },


    // This function is responsible for gobbling an individual expression,
    // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
    gobbleBinaryExpression = function gobbleBinaryExpression() {
        var node, biop, prec, stack, biop_info, left, right, i;

        // First, try to get the leftmost thing
        // Then, check to see if there's a binary operator operating on that leftmost thing
        left = gobbleToken();
        biop = gobbleBinaryOp();

        // If there wasn't a binary operator, just return the leftmost node
        if (!biop) {
            return left;
        }

        // Otherwise, we need to start a stack to properly place the binary operations in their
        // precedence structure
        biop_info = { value: biop, prec: binaryPrecedence(biop) };

        right = gobbleToken();
        if (!right) {
            throwError("Expected expression after " + biop, index);
        }
        stack = [left, biop_info, right];

        // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
        while (biop = gobbleBinaryOp()) {
            prec = binaryPrecedence(biop);

            if (prec === 0) {
                break;
            }
            biop_info = { value: biop, prec: prec };

            // Reduce: make a binary expression from the three topmost entries.
            while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
                right = stack.pop();
                biop = stack.pop().value;
                left = stack.pop();
                node = createBinaryExpression(biop, left, right);
                stack.push(node);
            }

            node = gobbleToken();
            if (!node) {
                throwError("Expected expression after " + biop, index);
            }
            stack.push(biop_info, node);
        }

        i = stack.length - 1;
        node = stack[i];
        while (i > 1) {
            node = createBinaryExpression(stack[i - 1].value, stack[i - 2], node);
            i -= 2;
        }
        return node;
    },


    // An individual part of a binary expression:
    // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
    gobbleToken = function gobbleToken() {
        var ch, to_check, tc_len;

        gobbleSpaces();
        ch = exprICode(index);

        if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
            // Char code 46 is a dot `.` which can start off a numeric literal
            return gobbleNumericLiteral();
        } else if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
            // Single or double quotes
            return gobbleStringLiteral();
        } else if (isIdentifierStart(ch) || ch === OPAREN_CODE) {
            // open parenthesis
            // `foo`, `bar.baz`
            return gobbleVariable();
        } else if (ch === OBRACK_CODE) {
            return gobbleArray();
        } else {
            to_check = expr.substr(index, max_unop_len);
            tc_len = to_check.length;
            while (tc_len > 0) {
                if (unary_ops.hasOwnProperty(to_check)) {
                    index += tc_len;
                    return {
                        type: code.UNARY_EXP,
                        operator: to_check,
                        argument: gobbleToken(),
                        prefix: true
                    };
                }
                to_check = to_check.substr(0, --tc_len);
            }

            return false;
        }
    },

    // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
    // keep track of everything in the numeric literal and then calling `parseFloat` on that string
    gobbleNumericLiteral = function gobbleNumericLiteral() {
        var number = '',
            ch,
            chCode;
        while (isDecimalDigit(exprICode(index))) {
            number += exprI(index++);
        }

        if (exprICode(index) === PERIOD_CODE) {
            // can start with a decimal marker
            number += exprI(index++);

            while (isDecimalDigit(exprICode(index))) {
                number += exprI(index++);
            }
        }

        ch = exprI(index);
        if (ch === 'e' || ch === 'E') {
            // exponent marker
            number += exprI(index++);
            ch = exprI(index);
            if (ch === '+' || ch === '-') {
                // exponent sign
                number += exprI(index++);
            }
            while (isDecimalDigit(exprICode(index))) {
                //exponent itself
                number += exprI(index++);
            }
            if (!isDecimalDigit(exprICode(index - 1))) {
                throwError('Expected exponent (' + number + exprI(index) + ')', index);
            }
        }

        chCode = exprICode(index);
        // Check to make sure this isn't a variable name that start with a number (123abc)
        if (isIdentifierStart(chCode)) {
            throwError('Variable names cannot start with a number (' + number + exprI(index) + ')', index);
        } else if (chCode === PERIOD_CODE) {
            throwError('Unexpected period', index);
        }

        return {
            type: code.LITERAL,
            value: parseFloat(number),
            raw: number
        };
    },


    // Parses a string literal, staring with single or double quotes with basic support for escape codes
    // e.g. `"hello world"`, `'this is\nJSEP'`
    gobbleStringLiteral = function gobbleStringLiteral() {
        var str = '',
            quote = exprI(index++),
            closed = false,
            ch;

        while (index < length) {
            ch = exprI(index++);
            if (ch === quote) {
                closed = true;
                break;
            } else if (ch === '\\') {
                // Check for all of the common escape codes
                ch = exprI(index++);
                switch (ch) {
                    case 'n':
                        str += '\n';break;
                    case 'r':
                        str += '\r';break;
                    case 't':
                        str += '\t';break;
                    case 'b':
                        str += '\b';break;
                    case 'f':
                        str += '\f';break;
                    case 'v':
                        str += '\x0B';break;
                    default:
                        str += '\\' + ch;
                }
            } else {
                str += ch;
            }
        }

        if (!closed) {
            throwError('Unclosed quote after "' + str + '"', index);
        }

        return {
            type: code.LITERAL,
            value: str,
            raw: quote + str + quote
        };
    },


    // Gobbles only identifiers
    // e.g.: `foo`, `_value`, `$x1`
    // Also, this function checks if that identifier is a literal:
    // (e.g. `true`, `false`, `null`) or `this`
    gobbleIdentifier = function gobbleIdentifier() {
        var ch = exprICode(index),
            start = index,
            identifier;

        if (isIdentifierStart(ch)) {
            index++;
        } else {
            throwError('Unexpected ' + exprI(index), index);
        }

        while (index < length) {
            ch = exprICode(index);
            if (isIdentifierPart(ch)) {
                index++;
            } else {
                break;
            }
        }
        identifier = expr.slice(start, index);

        if (literals.hasOwnProperty(identifier)) {
            return {
                type: code.LITERAL,
                value: literals[identifier],
                raw: identifier
            };
        } else if (identifier === this_str) {
            return { type: code.THIS_EXP };
        } else {
            return {
                type: code.IDENTIFIER,
                name: identifier
            };
        }
    },


    // Gobbles a list of arguments within the context of a function call
    // or array literal. This function also assumes that the opening character
    // `(` or `[` has already been gobbled, and gobbles expressions and commas
    // until the terminator character `)` or `]` is encountered.
    // e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
    gobbleArguments = function gobbleArguments(termination) {
        var ch_i,
            args = [],
            node,
            closed = false;
        while (index < length) {
            gobbleSpaces();
            ch_i = exprICode(index);
            if (ch_i === termination) {
                // done parsing
                closed = true;
                index++;
                break;
            } else if (ch_i === COMMA_CODE) {
                // between expressions
                index++;
            } else {
                node = gobbleExpression();
                if (!node || node.type === code.COMPOUND) {
                    throwError('Expected comma', index);
                }
                args.push(node);
            }
        }
        if (!closed) {
            throwError('Expected ' + String.fromCharCode(termination), index);
        }
        return args;
    },


    // Gobble a non-literal variable name. This variable name may include properties
    // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
    // It also gobbles function calls:
    // e.g. `Math.acos(obj.angle)`
    gobbleVariable = function gobbleVariable() {
        var ch_i, node;
        ch_i = exprICode(index);

        if (ch_i === OPAREN_CODE) {
            node = gobbleGroup();
        } else {
            node = gobbleIdentifier();
        }
        gobbleSpaces();
        ch_i = exprICode(index);
        while (ch_i === PERIOD_CODE || ch_i === OBRACK_CODE || ch_i === OPAREN_CODE) {
            index++;
            if (ch_i === PERIOD_CODE) {
                gobbleSpaces();
                node = {
                    type: code.MEMBER_EXP,
                    computed: false,
                    object: node,
                    property: gobbleIdentifier()
                };
            } else if (ch_i === OBRACK_CODE) {
                node = {
                    type: code.MEMBER_EXP,
                    computed: true,
                    object: node,
                    property: gobbleExpression()
                };
                gobbleSpaces();
                ch_i = exprICode(index);
                if (ch_i !== CBRACK_CODE) {
                    throwError('Unclosed [', index);
                }
                index++;
            } else if (ch_i === OPAREN_CODE) {
                // A function call is being made; gobble all the arguments
                node = {
                    type: code.CALL_EXP,
                    'arguments': gobbleArguments(CPAREN_CODE),
                    callee: node
                };
            }
            gobbleSpaces();
            ch_i = exprICode(index);
        }
        return node;
    },


    // Responsible for parsing a group of things within parentheses `()`
    // This function assumes that it needs to gobble the opening parenthesis
    // and then tries to gobble everything within that parenthesis, assuming
    // that the next thing it should see is the close parenthesis. If not,
    // then the expression probably doesn't have a `)`
    gobbleGroup = function gobbleGroup() {
        index++;
        var node = gobbleExpression();
        gobbleSpaces();
        if (exprICode(index) === CPAREN_CODE) {
            index++;
            return node;
        } else {
            throwError('Unclosed (', index);
        }
    },


    // Responsible for parsing Array literals `[1, 2, 3]`
    // This function assumes that it needs to gobble the opening bracket
    // and then tries to gobble the expressions as arguments.
    gobbleArray = function gobbleArray() {
        index++;
        return {
            type: code.ARRAY_EXP,
            elements: gobbleArguments(CBRACK_CODE)
        };
    },
        nodes = [],
        ch_i,
        node;

    while (index < length) {
        ch_i = exprICode(index);

        // Expressions can be separated by semicolons, commas, or just inferred without any
        // separators
        if (ch_i === SEMCOL_CODE || ch_i === COMMA_CODE) {
            index++; // ignore separators
        } else {
            // Try to gobble each expression individually
            if (node = gobbleExpression()) {
                nodes.push(node);
                // If we weren't able to find a binary expression and are out of room, then
                // the expression passed in probably has too much
            } else if (index < length) {
                throwError('Unexpected "' + exprI(index) + '"', index);
            }
        }
    }

    // If there's only one expression just try returning the expression
    if (nodes.length === 1) {
        return nodes[0];
    } else {
        return {
            type: code.COMPOUND,
            body: nodes
        };
    }
};

/**
 * @method jsep.addUnaryOp
 * @param {string} op_name The name of the unary op to add
 * @return jsep
 */
jsep.addUnaryOp = function (op_name) {
    max_unop_len = Math.max(op_name.length, max_unop_len);
    unary_ops[op_name] = t;return this;
};

/**
 * @method jsep.addBinaryOp
 * @param {string} op_name The name of the binary op to add
 * @param {number} precedence The precedence of the binary op (can be a float)
 * @return jsep
 */
jsep.addBinaryOp = function (op_name, precedence) {
    max_binop_len = Math.max(op_name.length, max_binop_len);
    binary_ops[op_name] = precedence;
    return this;
};

/**
 * @method jsep.addLiteral
 * @param {string} literal_name The name of the literal to add
 * @param {*} literal_value The value of the literal
 * @return jsep
 */
jsep.addLiteral = function (literal_name, literal_value) {
    literals[literal_name] = literal_value;
    return this;
};

/**
 * @method jsep.removeUnaryOp
 * @param {string} op_name The name of the unary op to remove
 * @return jsep
 */
jsep.removeUnaryOp = function (op_name) {
    delete unary_ops[op_name];
    if (op_name.length === max_unop_len) {
        max_unop_len = getMaxKeyLen(unary_ops);
    }
    return this;
};

/**
 * @method jsep.removeBinaryOp
 * @param {string} op_name The name of the binary op to remove
 * @return jsep
 */
jsep.removeBinaryOp = function (op_name) {
    delete binary_ops[op_name];
    if (op_name.length === max_binop_len) {
        max_binop_len = getMaxKeyLen(binary_ops);
    }
    return this;
};

/**
 * @method jsep.removeLiteral
 * @param {string} literal_name The name of the literal to remove
 * @return jsep
 */
jsep.removeLiteral = function (literal_name) {
    delete literals[literal_name];
    return this;
};

function evaluate(self, expr) {

    switch (expr.type) {
        case code.IDENTIFIER:
            return self[expr.name];
        case code.LITERAL:
            return expr.value;
        case code.ARRAY_EXP:
            return expr.elements.map(function (elem) {
                return evaluate(self, elem);
            });
        case code.LOGICAL_EXP:
        case code.BINARY_EXP:
            return binaryExp(expr.operator, evaluate(self, expr.left), evaluate(self, expr.right));
        case code.CALL_EXP:
            return callExpression(self, expr.callee, expr.arguments);
        case code.MEMBER_EXP:
            return evaluate(evaluate(self, expr.object), expr.property);
        case code.CONDITIONAL_EXP:
            return evaluate(self, expr.test) ? evaluate(self, expr.consequent) : evaluate(self, expr.alternate);
        case code.UNARY_EXP:
            return unaryExp(expr.operator, evaluate(self, expr.argument));
    }
}

function identifiers$1(expr, all) {
    if (arguments.length === 1) all = set$6();
    switch (expr.type) {
        case code.IDENTIFIER:
            all.add(expr.name);break;
        case code.ARRAY_EXP:
            expr.elements.forEach(function (elem) {
                identifiers$1(elem, all);
            });break;
        case code.BINARY_EXP:
            identifiers$1(expr.left, all);identifiers$1(expr.right, all);break;
        case code.CALL_EXP:
            identifiers$1(expr.arguments, all);break;
        case code.MEMBER_EXP:
            identifiers$1(expr.object, all);break;
        case code.CONDITIONAL_EXP:
            identifiers$1(expr.test, all);identifiers$1(expr.consequent, all);evaluate(expr.alternate, all);break;
    }
    return all;
}

function callExpression(self, callee, args) {
    var func;

    args = args.map(function (arg) {
        return evaluate(self, arg);
    });

    if (callee.type !== code.IDENTIFIER) {
        self = evaluate(self, callee.object);
        callee = callee.property;
    }

    func = self[callee.name];
    if (!func) throw new EvalError('callable "' + callee.name + '" not found in context');
    return func.apply(self, args);
}

function unaryExp(op, arg) {
    if (!unaryFunctions[op]) unaryFunctions[op] = new Function("arg", 'return ' + op + ' arg');
    return unaryFunctions[op](arg);
}

function binaryExp(op, a, b) {
    if (!binaryFunctions[op]) binaryFunctions[op] = new Function("a", "b", 'return a ' + op + ' b');
    return binaryFunctions[op](a, b);
}

var unaryFunctions = {};
var binaryFunctions = {};

var providers = {
    logger: logger$1,
    fetch: fetch()
};

function fetch() {
    if (inBrowser$1) return window.fetch;
}

var prefix$4 = '[d3-view]';

var warn = function (msg) {
    providers.logger.warn(prefix$4 + ' ' + msg);
};

// tiny javascript expression parser
var proto$2 = {

    eval: function _eval(model) {
        return evaluate(model, this.parsed);
    },

    safeEval: function safeEval(model) {
        try {
            return evaluate(model, this.parsed);
        } catch (msg) {
            warn('Could not evaluate <<' + this.expr + '>> expression: ' + msg);
        }
    },

    identifiers: function identifiers() {
        return identifiers$1(this.parsed).values();
    }
};

function Expression(expr) {
    this.codes = code;
    this.expr = expr;
    this.parsed = jsep(expr);
}

Expression.prototype = proto$2;

var viewExpression = function (expr) {
    try {
        return new Expression(expr);
    } catch (msg) {
        warn('Could not parse <<' + expr + '>> expression: ' + msg);
    }
};

var UID = 0;
var prefix$5 = 'd3v';

// Add a unique identifier to an object
var uid = function (o) {
    var uid = prefix$5 + ++UID;

    if (arguments.length) {
        Object.defineProperty(o, 'uid', {
            get: function get() {
                return uid;
            }
        });

        return o;
    } else return uid;
};

var sel = function (o) {

    Object.defineProperty(o, 'sel', {
        get: function get() {
            return select$2(this.el);
        }
    });

    return o;
};

//
// Directive Prototype
//
// Directives are special attributes with the d3- prefix.
// Directive attribute values are expected to be binding expressions.
// A directive’s job is to reactively apply special behavior to the DOM
// when the value of its expression changes.
//
// A directive can implement one or more of the directive methods:
//
//  * create
//  * mount
//  * refresh
//  * destroy
//
var prototype = {
    priority: 1,

    // hooks
    create: function create(expression) {
        return expression;
    },

    mount: function mount(model) {
        return model;
    },

    refresh: function refresh() {},

    destroy: function destroy() {},

    removeAttribute: function removeAttribute() {
        this.el.removeAttribute(this.name);
    },

    // Execute directive
    execute: function execute(model) {
        var _this = this;

        // No binding expression - nothing to do
        if (!this.expression) return;
        this.removeAttribute();

        model = this.mount(model);
        // No model returned - abort execution
        if (!model) return;

        var dir = this,
            sel$$1 = this.sel,
            refresh = function refresh() {
            try {
                dir.refresh(model, dir.expression.eval(model));
            } catch (msg) {
                warn('Error while refreshing "' + dir.name + '" directive: ' + msg);
            }
        };

        // Bind expression identifiers with model
        this.identifiers = this.expression.identifiers().map(function (id) {
            var event = id + '.' + dir.uid;
            model.$on(event, refresh);
            return id;
        });

        sel$$1.on('remove.' + dir.uid, function () {
            _this.identifiers.forEach(function (id) {
                model.$off(id + '.' + dir.uid);
            });
            dir.destroy(model);
        });

        refresh();
    }
};

// Directive constructor
var createDirective = function (obj) {

    function Directive(el, attr, arg) {
        this.el = el;
        this.name = attr.name;
        this.arg = arg;
        var expr = sel(uid(this)).create(attr.value);
        if (expr) this.expression = viewExpression(expr);
    }

    Directive.prototype = assign$2({}, prototype, obj);

    function directive(el, attr, arg) {
        return new Directive(el, attr, arg);
    }

    directive.prototype = Directive.prototype;
    return directive;
};

selection$2.prototype.model = model$1;

//
// Initialise a model
function asModel(model, initials) {
    var events = map$8(),
        children = [],
        Child = null;

    // event handler for any change in the model
    events.set('', dispatch$2('change'));

    Object.defineProperties(uid(model), {
        $events: {
            get: function get() {
                return events;
            }
        },
        $children: {
            get: function get() {
                return children;
            }
        }
    });
    model.$child = $child;
    model.$update(initials);

    function $child(o) {
        if (Child === null) Child = createChildConstructor(model);
        return new Child(o);
    }
}

function createChildConstructor(model) {

    function Child(initials) {
        asModel(this, initials);
        model.$children.push(this);
        Object.defineProperty(this, 'parent', {
            get: function get() {
                return model;
            }
        });
    }

    Child.prototype = model;
    return Child;
}



function model$1(value) {
    return arguments.length ? this.property("__model__", value) : this.node().__model__;
}

//  $get method for a Model
//
//  attribute is a dotted string
var $get = function (attribute) {

    var bits = attribute.split('.'),
        key = bits.splice(0, 1),
        model = getModel(this, key);

    if (!(key in model)) return;

    var value = model[key];

    while (value && bits.length) {
        value = value[bits.splice(0, 1)];
    }return value;
};

function getModel(model, key) {

    while (!(key in model) && model.$parent) {
        model = model.$parent;
    }return model;
}

var frame$1 = 0;
var timeout$2 = 0;
var interval$2 = 0;
var pokeDelay$1 = 1000;
var taskHead$1;
var taskTail$1;
var clockLast$1 = 0;
var clockNow$1 = 0;
var clockSkew$1 = 0;
var clock$1 = (typeof performance === "undefined" ? "undefined" : _typeof(performance)) === "object" && performance.now ? performance : Date;
var setFrame$1 = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function (f) {
  setTimeout(f, 17);
};

function now$1() {
  return clockNow$1 || (setFrame$1(clearNow$1), clockNow$1 = clock$1.now() + clockSkew$1);
}

function clearNow$1() {
  clockNow$1 = 0;
}

function Timer$1() {
  this._call = this._time = this._next = null;
}

Timer$1.prototype = timer$1.prototype = {
  constructor: Timer$1,
  restart: function restart(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now$1() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail$1 !== this) {
      if (taskTail$1) taskTail$1._next = this;else taskHead$1 = this;
      taskTail$1 = this;
    }
    this._call = callback;
    this._time = time;
    sleep$1();
  },
  stop: function stop() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep$1();
    }
  }
};

function timer$1(callback, delay, time) {
  var t = new Timer$1();
  t.restart(callback, delay, time);
  return t;
}

function timerFlush$1() {
  now$1(); // Get the current time, if not already set.
  ++frame$1; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead$1,
      e;
  while (t) {
    if ((e = clockNow$1 - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame$1;
}

function wake$1() {
  clockNow$1 = (clockLast$1 = clock$1.now()) + clockSkew$1;
  frame$1 = timeout$2 = 0;
  try {
    timerFlush$1();
  } finally {
    frame$1 = 0;
    nap$1();
    clockNow$1 = 0;
  }
}

function poke$1() {
  var now = clock$1.now(),
      delay = now - clockLast$1;
  if (delay > pokeDelay$1) clockSkew$1 -= delay, clockLast$1 = now;
}

function nap$1() {
  var t0,
      t1 = taskHead$1,
      t2,
      time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead$1 = t2;
    }
  }
  taskTail$1 = t0;
  sleep$1(time);
}

function sleep$1(time) {
  if (frame$1) return; // Soonest alarm already set, or will be.
  if (timeout$2) timeout$2 = clearTimeout(timeout$2);
  var delay = time - clockNow$1;
  if (delay > 24) {
    if (time < Infinity) timeout$2 = setTimeout(wake$1, delay);
    if (interval$2) interval$2 = clearInterval(interval$2);
  } else {
    if (!interval$2) interval$2 = setInterval(poke$1, pokeDelay$1);
    frame$1 = 1, setFrame$1(wake$1);
  }
}

var timeout$3 = function (callback, delay, time) {
  var t = new Timer$1();
  delay = delay == null ? 0 : +delay;
  t.restart(function (elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
};

var debounce = function (callback, delay) {
    var queued = false;
    return function () {
        if (!queued) {
            var args = Array.prototype.slice.call(arguments);
            queued = true;
            timeout$3(function () {
                queued = false;
                callback.apply(undefined, args);
            }, delay);
        }
    };
};

//  $set a reactive attribute for a Model
//
//  Set the value of a dotted attribute in the model or its parents
//  If the attribute is not already reactive make it as such.
//
var $set = function (key, value) {
    // property not reactive - make it as such
    if (!this.$events.get(key)) reactive(this, key, value);else this[key] = value;
};

function reactive(model, key, value) {
    var events = model.$events,
        oldValue,
        lazy;

    events.set(key, dispatch$2('change'));

    Object.defineProperty(model, key, property());

    // the event is fired at the next tick of the event loop
    // Cannot use the () => notation here otherwise arguments are incorrect
    var trigger = debounce(function () {
        oldValue = arguments[0];
        events.get(key).call('change', model, value, oldValue);
        // trigger model change event only when not a lazy property
        if (!lazy) events.get('').call('change', model, key);
    });

    // Trigger the callback once for initialization
    trigger();

    function update(newValue) {
        if (lazy) newValue = lazy.get.call(model);
        if (newValue === value) return;
        // trigger lazy callbacks
        trigger(value);
        // update the value
        value = newValue;
    }

    function property() {
        var prop = {
            get: function get() {
                return value;
            }
        };

        if (isFunction$1(value)) value = { get: value };

        // calculated attribute
        if (isObject$1(value) && isFunction$1(value.get)) {
            lazy = value;
            value = lazy.get.call(model);

            if (lazy.reactOn) lazy.reactOn.forEach(function (name) {
                model.$on(name + '.' + key, update);
            });else model.$on('.' + key, update);

            if (isFunction$1(lazy.set)) prop.set = lazy.set;
        } else prop.set = update;

        return prop;
    }
}

// Add change callback to a model reactive attribute
var $on = function (name, callback) {

    // When no name is provided, whait for changes on this model - no its parents
    if (arguments.length === 1 && isFunction$1(name)) {
        callback = name;
        name = '';
    }

    var bits = name.split('.'),
        key = bits[0],
        event = getEvent(this, key);

    if (!event) return warn('Cannot bind to "' + key + '" - no such reactive property');

    // event from a parent model, add model uid to distinguish it from other child callbacks
    if (!this.$events.get(name)) bits.push(this.uid);

    bits[0] = 'change';
    return event.on(bits.join('.'), callback);
};

function getEvent(model, name) {
    var event = model.$events.get(name);
    if (!event && model.parent) return getEvent(model.parent, name);
    return event;
}

// Update a model with reactive model data
var $update = function (data, replace) {
    if (data) {
        replace = arguments.length === 2 ? replace : true;
        for (var key in data) {
            if (replace || this[key] === undefined) {
                if (key.substring(0, 1) === '$') {
                    if (this.constructor.prototype[key]) warn('Cannot set attribute method ' + key + ', it is protected');else this[key] = data[key];
                } else this.$set(key, data[key]);
            }
        }
    }
    return this;
};

function setbase(key, value) {
    if (!this.$events.has(key) && this.$parent) return setbase.call(this.$parent, key, value);
    this.$set(key, value);
}

// remove event handlers
var $off = function (attr) {
    if (attr === undefined) this.$events.each(function (event) {
        event.on('change', null);
    });else {
        var event = this.$events.get(attr);
        if (event) event.on('change', null);
    }

    this.$children.forEach(function (child) {
        child.$off(attr);
    });
};

//
//  Model class
//
//  The model is at the core of d3-view reactive data component
function Model(initials) {
    asModel(this, initials);
}

function model(initials) {
    return new Model(initials);
}

model.prototype = Model.prototype;

// Public API methods
Model.prototype.$on = $on;
Model.prototype.$update = $update;
Model.prototype.$get = $get;
Model.prototype.$set = $set;
Model.prototype.$new = $new;
Model.prototype.$setbase = setbase;
Model.prototype.$off = $off;

function $new(initials) {

    var parent = this,
        child = model(initials);

    parent.$children.push(child);

    Object.defineProperty(child, 'parent', {
        get: function get() {
            return parent;
        }
    });

    return child;
}

// Model factory function
var createModel = function (directives, defaults, parent) {
    // model directive
    var dir = directives.pop('model');

    // For loop directive not permitted in the root view
    if (directives.get('for') && !parent) {
        warn('Cannot have a "d3-for" directive in the root view element');
        directives.pop('for');
    }

    if (!parent) {
        if (dir) warn('Cannot have a d3-model directive in the root element');
        return model(defaults);
    }

    // Execute model directive
    if (dir) {
        dir.execute(parent);
        var model$$1 = dir.sel.model();
        if (model$$1) model$$1.$update(defaults, false);
        return model$$1;
    } else if (defaults) return parent.$child(defaults);else return parent;
};

// No value, it has its own directive
var attributes = ['name', 'class', 'disabled', 'readonly', 'required'];

selection$2.prototype.directives = directives;

function directives(value) {
    return arguments.length ? this.property("__directives__", value) : this.node().__directives__;
}

var getdirs = function (element, directives) {
    var sel = select$2(element),
        dirs = sel.directives();
    if (dirs) return dirs;
    dirs = new Directives();
    sel.directives(dirs);

    if (!directives) return dirs;

    for (var i = 0; i < element.attributes.length; ++i) {
        var attr = element.attributes[i],
            bits = attr.name.split('-'),
            arg = bits[2],
            dirName = bits[0] === 'd3' ? bits[1] : null;

        if (dirName) {
            if (!arg && attributes.indexOf(dirName) > -1) {
                arg = dirName;
                dirName = 'attr';
            }
            var directive = directives.get(dirName);
            if (directive) dirs.add(dirName, directive(element, attr, arg));else warn(element.tagName + ' cannot find directive "' + dirName + '". Did you forget to register it?');
        }
        dirs.attrs[attr.name] = attr.value;
    }
    return dirs.sorted();
};

// Directives container
function Directives() {
    this.attrs = {};
    this._dirs = {};
    this._all = [];
}

Directives.prototype = {
    size: function size() {
        return this._all.length;
    },

    get: function get(name) {
        return this._dirs[name];
    },

    pop: function pop(name) {
        var dir = this._dirs[name];
        if (dir) {
            delete this._dirs[name];
            dir.removeAttribute();
            var index = this._all.indexOf(dir);
            if (index > -1) this._all.splice(index, 1);
        }
        return dir;
    },

    add: function add(name, dir) {
        this._dirs[name] = dir;
        this._all.push(dir);
    },

    sorted: function sorted() {
        this._all.sort(function (d) {
            return -d.priority;
        });
        return this;
    },

    forEach: function forEach(callback) {
        this._all.forEach(callback);
    }
};

// Mount a model into an element
function mount$1(model, el) {
    var sel = select$2(el),
        directives = sel.directives();

    // directives not available, this is a mount from
    // a directive/loop and requires a new model
    if (!directives) {
        directives = getdirs(el, model.$vm ? model.$vm.directives : null);
        model = createModel(directives, null, model);
    }

    // Loop directive is special
    var loop = directives.pop('for');

    if (loop) {
        loop.execute(model);
        return true; // Important - skip mounting a component
    } else {
        if (!sel.model()) sel.model(model);
        mountChildren(sel, directives);
    }
}

function mountChildren(sel, directives) {
    var model = sel.model(),
        vm = model.$vm;

    sel.selectAll(function () {
        return this.children;
    }).each(function () {
        var component = vm ? vm.components.get(this.tagName.toLowerCase()) : null;

        if (component) component({ parent: vm }).mount(this);else {
            // vanilla element
            mount$1(model, this);
            var child = select$2(this);
            // cleanup model if not needed
            if (child.model() === model) child.model(null);
        }
    });

    // Execute directives
    if (directives.size()) {
        directives.forEach(function (d) {
            d.execute(model);
        });
    } else
        // no directives - remove property
        sel.directives(null);
}

//
//  d3-model directive
//  ===================
//
//  Create a new model on the element based on data from parent models
//  This is a special directive and the first to be mounted
var model$2 = {

    mount: function mount(model) {
        var expr = this.expression;
        if (expr.parsed.type !== expr.codes.IDENTIFIER) return warn('d3-model expression support identifiers only, got "' + expr.parsed.type + '": ' + this.expression);
        var newModel = model.$child(expr.eval(model));
        this.sel.model(newModel);
        model.$setbase(this.expression.expr, newModel);
    }

};

var properties = ['disabled', 'readonly', 'required'];

//
//  d3-attr-<attr> directive
//  ==============================
//
//  Create a one-way binding between a model and a HTML element attribute
//
var attr = {

    create: function create(expression) {
        if (!this.arg) return warn('Cannot bind to empty attribute. Specify :<attr-name>');
        return expression;
    },

    refresh: function refresh(model, value) {
        if (this.arg === 'class') return this.refreshClass(value);
        if (isArray$1(value)) return warn('Cannot apply array to attribute ' + this.arg);
        if (properties.indexOf(this.arg) > -1) this.sel.property(this.arg, value || null);else this.sel.attr(this.arg, value);
    },

    refreshClass: function refreshClass(value) {
        var sel = this.sel;

        if (!isArray$1(value)) value = [value];

        if (this.oldValue) this.oldValue.forEach(function (entry) {
            if (entry) sel.classed(entry, false);
        });

        this.oldValue = value.map(function (entry) {
            var exist = true;
            if (isArray$1(entry)) {
                exist = entry[1];
                entry = entry[0];
            }
            if (entry) sel.classed(entry, exist);
            return entry;
        });
    }

};

//
//  d3-html
//  =============
//  attach html or text to the innerHtml property
//
//  Usage:
//      <div id="foo" d3-html="output"></div>
var html = {

    refresh: function refresh(model, html) {
        if (isString$1(html)) this.sel.html(html);
    }
};

var base = {

    on: function on(model, attrName) {
        var refresh = refreshFunction(this, model, attrName);

        // DOM => model binding
        select$2(this.el).on('input', refresh).on('change', refresh);
    }
};

function createTag(proto) {

    function Tag(el) {
        this.el = el;
    }

    Tag.prototype = assign$2({}, base, proto);

    function tag(el) {
        var t = new Tag(el);

        Object.defineProperty(t, 'value', {
            get: function get() {
                return select$2(t.el).property('value');
            },
            set: function set(v) {
                select$2(t.el).property('value', v);
            }
        });

        return t;
    }

    tag.prototype = Tag.prototype;

    return tag;
}

function refreshFunction(dom, model, attrName) {

    return debounce(function () {
        model.$set(attrName, dom.value);
    });
}

var input = createTag();

var textarea = createTag();

var tags = {
    input: input,
    textarea: textarea
};

//
//  d3-value directive
//  ===================
//
//  Two-way data binding for HTML elements supporting the value property
var value$1 = {

    create: function create(expression) {
        var type = this.sel.attr('type'),
            tag = this.el.tagName.toLowerCase(),
            Tag = tags[type] || tags[tag];

        if (!Tag) return warn('Cannot apply d3-value directive to ' + tag);
        this.tag = new Tag(this.el);
        return expression;
    },

    mount: function mount(model) {
        var expr = this.expression;
        // TODO: relax this constraint
        if (expr.parsed.type !== expr.codes.IDENTIFIER) return warn('d3-value expression support identifiers only, got "' + expr.parsed.type + '": ' + this.expression);
        var attrName = this.expression.expr;
        //
        // Create the model reactive attribute
        model.$set(attrName, this.tag.value);

        this.tag.on(model, attrName);
        return model;
    },

    refresh: function refresh(model, value) {
        this.tag.value = value;
    },

    destroy: function destroy() {
        this.tag.off();
    }
};

//
//  d3-show
//  =============
//  Show or hide an element
//
var show = {

    mount: function mount(model) {
        this.display = this.sel.style('display');
        if (!this.display || this.display === 'none') this.display = 'block';
        return model;
    },

    refresh: function refresh(model, value) {
        if (value) this.sel.style('display', this.display);else this.sel.style('display', 'none');
    }
};

//
//  d3-on directive
var on$1 = {

    mount: function mount(model) {
        var event = this.arg || 'click',
            expr = this.expression;

        // DOM event => model binding
        this.sel.on(event + '.' + this.uid, function () {
            expr.eval(model);
        });
    }
};

var emptyOn$1 = dispatch$2("start", "end", "interrupt");
var emptyTween$1 = [];

var CREATED$1 = 0;
var SCHEDULED$1 = 1;
var STARTING$1 = 2;
var STARTED$1 = 3;
var RUNNING$1 = 4;
var ENDING$1 = 5;
var ENDED$1 = 6;

var schedule$1 = function (node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};else if (id in schedules) return;
  create$2(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn$1,
    tween: emptyTween$1,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED$1
  });
};

function init$2(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED$1) throw new Error("too late");
  return schedule;
}

function set$9(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING$1) throw new Error("too late");
  return schedule;
}

function get$5(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
  return schedule;
}

function create$2(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer$1(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED$1;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED$1) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED$1) return timeout$3(start);

      // Interrupt the active transition, if any.
      // Dispatch the interrupt event.
      if (o.state === RUNNING$1) {
        o.state = ENDED$1;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions. No interrupt event is dispatched
      // because the cancelled transitions never started. Note that this also
      // removes this transition from the pending list!
      else if (+i < id) {
          o.state = ENDED$1;
          o.timer.stop();
          delete schedules[i];
        }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout$3(function () {
      if (self.state === STARTED$1) {
        self.state = RUNNING$1;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING$1;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING$1) return; // interrupted
    self.state = STARTED$1;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING$1, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(null, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING$1) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED$1;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) {
      return;
    } // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

var interrupt$1 = function (node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) {
      empty = false;continue;
    }
    active = schedule.state > STARTING$1 && schedule.state < ENDING$1;
    schedule.state = ENDED$1;
    schedule.timer.stop();
    if (active) schedule.on.call("interrupt", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
};

var selection_interrupt$1 = function (name) {
  return this.each(function () {
    interrupt$1(this, name);
  });
};

var define$1 = function (constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend$1(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) {
    prototype[key] = definition[key];
  }return prototype;
}

function Color$1() {}

var _darker$1 = 0.7;
var _brighter$1 = 1 / _darker$1;

var reI$1 = "\\s*([+-]?\\d+)\\s*";
var reN$1 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP$1 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3$1 = /^#([0-9a-f]{3})$/;
var reHex6$1 = /^#([0-9a-f]{6})$/;
var reRgbInteger$1 = new RegExp("^rgb\\(" + [reI$1, reI$1, reI$1] + "\\)$");
var reRgbPercent$1 = new RegExp("^rgb\\(" + [reP$1, reP$1, reP$1] + "\\)$");
var reRgbaInteger$1 = new RegExp("^rgba\\(" + [reI$1, reI$1, reI$1, reN$1] + "\\)$");
var reRgbaPercent$1 = new RegExp("^rgba\\(" + [reP$1, reP$1, reP$1, reN$1] + "\\)$");
var reHslPercent$1 = new RegExp("^hsl\\(" + [reN$1, reP$1, reP$1] + "\\)$");
var reHslaPercent$1 = new RegExp("^hsla\\(" + [reN$1, reP$1, reP$1, reN$1] + "\\)$");

var named$1 = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define$1(Color$1, color$1, {
  displayable: function displayable() {
    return this.rgb().displayable();
  },
  toString: function toString() {
    return this.rgb() + "";
  }
});

function color$1(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3$1.exec(format)) ? (m = parseInt(m[1], 16), new Rgb$1(m >> 8 & 0xf | m >> 4 & 0x0f0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
  ) : (m = reHex6$1.exec(format)) ? rgbn$1(parseInt(m[1], 16)) // #ff0000
  : (m = reRgbInteger$1.exec(format)) ? new Rgb$1(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
  : (m = reRgbPercent$1.exec(format)) ? new Rgb$1(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
  : (m = reRgbaInteger$1.exec(format)) ? rgba$1(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
  : (m = reRgbaPercent$1.exec(format)) ? rgba$1(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
  : (m = reHslPercent$1.exec(format)) ? hsla$1(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
  : (m = reHslaPercent$1.exec(format)) ? hsla$1(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
  : named$1.hasOwnProperty(format) ? rgbn$1(named$1[format]) : format === "transparent" ? new Rgb$1(NaN, NaN, NaN, 0) : null;
}

function rgbn$1(n) {
  return new Rgb$1(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba$1(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb$1(r, g, b, a);
}

function rgbConvert$1(o) {
  if (!(o instanceof Color$1)) o = color$1(o);
  if (!o) return new Rgb$1();
  o = o.rgb();
  return new Rgb$1(o.r, o.g, o.b, o.opacity);
}

function rgb$2(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert$1(r) : new Rgb$1(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb$1(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define$1(Rgb$1, rgb$2, extend$1(Color$1, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$1 : Math.pow(_brighter$1, k);
    return new Rgb$1(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$1 : Math.pow(_darker$1, k);
    return new Rgb$1(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function rgb$2() {
    return this;
  },
  displayable: function displayable() {
    return 0 <= this.r && this.r <= 255 && 0 <= this.g && this.g <= 255 && 0 <= this.b && this.b <= 255 && 0 <= this.opacity && this.opacity <= 1;
  },
  toString: function toString() {
    var a = this.opacity;a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(") + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.b) || 0)) + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla$1(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
  return new Hsl$1(h, s, l, a);
}

function hslConvert$1(o) {
  if (o instanceof Hsl$1) return new Hsl$1(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color$1)) o = color$1(o);
  if (!o) return new Hsl$1();
  if (o instanceof Hsl$1) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl$1(h, s, l, o.opacity);
}

function hsl$3(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert$1(h) : new Hsl$1(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl$1(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$1(Hsl$1, hsl$3, extend$1(Color$1, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$1 : Math.pow(_brighter$1, k);
    return new Hsl$1(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$1 : Math.pow(_darker$1, k);
    return new Hsl$1(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb$2() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb$1(hsl2rgb$1(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb$1(h, m1, m2), hsl2rgb$1(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
  },
  displayable: function displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb$1(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}

var deg2rad$1 = Math.PI / 180;
var rad2deg$1 = 180 / Math.PI;

var Kn$1 = 18;
var Xn$1 = 0.950470;
var Yn$1 = 1;
var Zn$1 = 1.088830;
var t0$2 = 4 / 29;
var t1$2 = 6 / 29;
var t2$1 = 3 * t1$2 * t1$2;
var t3$1 = t1$2 * t1$2 * t1$2;

function labConvert$1(o) {
  if (o instanceof Lab$1) return new Lab$1(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl$1) {
    var h = o.h * deg2rad$1;
    return new Lab$1(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb$1)) o = rgbConvert$1(o);
  var b = rgb2xyz$1(o.r),
      a = rgb2xyz$1(o.g),
      l = rgb2xyz$1(o.b),
      x = xyz2lab$1((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn$1),
      y = xyz2lab$1((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn$1),
      z = xyz2lab$1((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn$1);
  return new Lab$1(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab$2(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert$1(l) : new Lab$1(l, a, b, opacity == null ? 1 : opacity);
}

function Lab$1(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define$1(Lab$1, lab$2, extend$1(Color$1, {
  brighter: function brighter(k) {
    return new Lab$1(this.l + Kn$1 * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function darker(k) {
    return new Lab$1(this.l - Kn$1 * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function rgb() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn$1 * lab2xyz$1(y);
    x = Xn$1 * lab2xyz$1(x);
    z = Zn$1 * lab2xyz$1(z);
    return new Rgb$1(xyz2rgb$1(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
    xyz2rgb$1(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z), xyz2rgb$1(0.0556434 * x - 0.2040259 * y + 1.0572252 * z), this.opacity);
  }
}));

function xyz2lab$1(t) {
  return t > t3$1 ? Math.pow(t, 1 / 3) : t / t2$1 + t0$2;
}

function lab2xyz$1(t) {
  return t > t1$2 ? t * t * t : t2$1 * (t - t0$2);
}

function xyz2rgb$1(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz$1(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert$1(o) {
  if (o instanceof Hcl$1) return new Hcl$1(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab$1)) o = labConvert$1(o);
  var h = Math.atan2(o.b, o.a) * rad2deg$1;
  return new Hcl$1(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl$3(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert$1(h) : new Hcl$1(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl$1(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define$1(Hcl$1, hcl$3, extend$1(Color$1, {
  brighter: function brighter(k) {
    return new Hcl$1(this.h, this.c, this.l + Kn$1 * (k == null ? 1 : k), this.opacity);
  },
  darker: function darker(k) {
    return new Hcl$1(this.h, this.c, this.l - Kn$1 * (k == null ? 1 : k), this.opacity);
  },
  rgb: function rgb() {
    return labConvert$1(this).rgb();
  }
}));

var A$1 = -0.14861;
var B$1 = +1.78277;
var C$1 = -0.29227;
var D$1 = -0.90649;
var E$1 = +1.97294;
var ED$1 = E$1 * D$1;
var EB$1 = E$1 * B$1;
var BC_DA$1 = B$1 * C$1 - D$1 * A$1;

function cubehelixConvert$1(o) {
  if (o instanceof Cubehelix$1) return new Cubehelix$1(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb$1)) o = rgbConvert$1(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA$1 * b + ED$1 * r - EB$1 * g) / (BC_DA$1 + ED$1 - EB$1),
      bl = b - l,
      k = (E$1 * (g - l) - C$1 * bl) / D$1,
      s = Math.sqrt(k * k + bl * bl) / (E$1 * l * (1 - l)),
      // NaN if l=0 or l=1
  h = s ? Math.atan2(k, bl) * rad2deg$1 - 120 : NaN;
  return new Cubehelix$1(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix$4(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert$1(h) : new Cubehelix$1(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix$1(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$1(Cubehelix$1, cubehelix$4, extend$1(Color$1, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$1 : Math.pow(_brighter$1, k);
    return new Cubehelix$1(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$1 : Math.pow(_darker$1, k);
    return new Cubehelix$1(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad$1,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb$1(255 * (l + a * (A$1 * cosh + B$1 * sinh)), 255 * (l + a * (C$1 * cosh + D$1 * sinh)), 255 * (l + a * (E$1 * cosh)), this.opacity);
  }
}));

function basis$3(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1,
      t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}

var constant$7 = function (x) {
  return function () {
    return x;
  };
};

function linear$3(a, d) {
  return function (t) {
    return a + t * d;
  };
}

function exponential$2(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
    return Math.pow(a + t * b, y);
  };
}

function hue$1(a, b) {
  var d = b - a;
  return d ? linear$3(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$7(isNaN(a) ? b : a);
}

function gamma$1(y) {
  return (y = +y) === 1 ? nogamma$1 : function (a, b) {
    return b - a ? exponential$2(a, b, y) : constant$7(isNaN(a) ? b : a);
  };
}

function nogamma$1(a, b) {
  var d = b - a;
  return d ? linear$3(a, d) : constant$7(isNaN(a) ? b : a);
}

var interpolateRgb$1 = (function rgbGamma(y) {
  var color$$1 = gamma$1(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb$2(start)).r, (end = rgb$2(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = color$$1(start.opacity, end.opacity);
    return function (t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

var array$3 = function (a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) {
    x[i] = value$2(a[i], b[i]);
  }for (; i < nb; ++i) {
    c[i] = b[i];
  }return function (t) {
    for (i = 0; i < na; ++i) {
      c[i] = x[i](t);
    }return c;
  };
};

var date$2 = function (a, b) {
  var d = new Date();
  return a = +a, b -= a, function (t) {
    return d.setTime(a + b * t), d;
  };
};

var interpolateNumber$1 = function (a, b) {
  return a = +a, b -= a, function (t) {
    return a + b * t;
  };
};

var object$2 = function (a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || (typeof a === "undefined" ? "undefined" : _typeof(a)) !== "object") a = {};
  if (b === null || (typeof b === "undefined" ? "undefined" : _typeof(b)) !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = value$2(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function (t) {
    for (k in i) {
      c[k] = i[k](t);
    }return c;
  };
};

var reA$1 = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB$1 = new RegExp(reA$1.source, "g");

function zero$1(b) {
  return function () {
    return b;
  };
}

function one$1(b) {
  return function (t) {
    return b(t) + "";
  };
}

var interpolateString$1 = function (a, b) {
  var bi = reA$1.lastIndex = reB$1.lastIndex = 0,
      // scan index for next number in b
  am,
      // current match in a
  bm,
      // current match in b
  bs,
      // string preceding current number in b, if any
  i = -1,
      // index in s
  s = [],
      // string constants and placeholders
  q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA$1.exec(a)) && (bm = reB$1.exec(b))) {
    if ((bs = bm.index) > bi) {
      // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else {
      // interpolate non-matching numbers
      s[++i] = null;
      q.push({ i: i, x: interpolateNumber$1(am, bm) });
    }
    bi = reB$1.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? q[0] ? one$1(q[0].x) : zero$1(b) : (b = q.length, function (t) {
    for (var i = 0, o; i < b; ++i) {
      s[(o = q[i]).i] = o.x(t);
    }return s.join("");
  });
};

var value$2 = function (a, b) {
    var t = typeof b === "undefined" ? "undefined" : _typeof(b),
        c;
    return b == null || t === "boolean" ? constant$7(b) : (t === "number" ? interpolateNumber$1 : t === "string" ? (c = color$1(b)) ? (b = c, interpolateRgb$1) : interpolateString$1 : b instanceof color$1 ? interpolateRgb$1 : b instanceof Date ? date$2 : Array.isArray(b) ? array$3 : isNaN(b) ? object$2 : interpolateNumber$1)(a, b);
};

var degrees$1 = 180 / Math.PI;

var identity$6 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

var decompose$1 = function (a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees$1,
    skewX: Math.atan(skewX) * degrees$1,
    scaleX: scaleX,
    scaleY: scaleY
  };
};

var cssNode$1;
var cssRoot$1;
var cssView$1;
var svgNode$1;

function parseCss$1(value) {
  if (value === "none") return identity$6;
  if (!cssNode$1) cssNode$1 = document.createElement("DIV"), cssRoot$1 = document.documentElement, cssView$1 = document.defaultView;
  cssNode$1.style.transform = value;
  value = cssView$1.getComputedStyle(cssRoot$1.appendChild(cssNode$1), null).getPropertyValue("transform");
  cssRoot$1.removeChild(cssNode$1);
  value = value.slice(7, -1).split(",");
  return decompose$1(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg$1(value) {
  if (value == null) return identity$6;
  if (!svgNode$1) svgNode$1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode$1.setAttribute("transform", value);
  if (!(value = svgNode$1.transform.baseVal.consolidate())) return identity$6;
  value = value.matrix;
  return decompose$1(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform$1(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: interpolateNumber$1(xa, xb) }, { i: i - 2, x: interpolateNumber$1(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360;else if (b - a > 180) a += 360; // shortest path
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber$1(a, b) });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber$1(a, b) });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: interpolateNumber$1(xa, xb) }, { i: i - 2, x: interpolateNumber$1(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function (a, b) {
    var s = [],
        // string constants and placeholders
    q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function (t) {
      var i = -1,
          n = q.length,
          o;
      while (++i < n) {
        s[(o = q[i]).i] = o.x(t);
      }return s.join("");
    };
  };
}

var interpolateTransformCss$1 = interpolateTransform$1(parseCss$1, "px, ", "px)", "deg)");
var interpolateTransformSvg$1 = interpolateTransform$1(parseSvg$1, ", ", ")", ")");

var rho$1 = Math.SQRT2;
var rho2$1 = 2;
var rho4$1 = 4;
var epsilon2$1 = 1e-12;

function cosh$1(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function sinh$1(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function tanh$1(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

// p0 = [ux0, uy0, w0]
// p1 = [ux1, uy1, w1]

function cubehelix$5(hue$$1) {
  return function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix$4(start)).h, (end = cubehelix$4(end)).h),
          s = nogamma$1(start.s, end.s),
          l = nogamma$1(start.l, end.l),
          opacity = nogamma$1(start.opacity, end.opacity);
      return function (t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  }(1);
}

cubehelix$5(hue$1);
var cubehelixLong$1 = cubehelix$5(nogamma$1);

function tweenRemove$1(id, name) {
  var tween0, tween1;
  return function () {
    var schedule = set$9(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction$1(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error();
  return function () {
    var schedule = set$9(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name: name, value: value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

var transition_tween$1 = function (name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get$5(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove$1 : tweenFunction$1)(id, name, value));
};

function tweenValue$1(transition, name, value) {
  var id = transition._id;

  transition.each(function () {
    var schedule = set$9(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function (node) {
    return get$5(node, id).value[name];
  };
}

var interpolate$1 = function (a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber$1 : b instanceof color$1 ? interpolateRgb$1 : (c = color$1(b)) ? (b = c, interpolateRgb$1) : interpolateString$1)(a, b);
};

function attrRemove$3(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$3(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$3(name, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrConstantNS$3(fullname, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrFunction$3(name, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttribute(name);
    value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

function attrFunctionNS$3(fullname, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

var transition_attr$1 = function (name, value) {
  var fullname = namespace$2(name),
      i = fullname === "transform" ? interpolateTransformSvg$1 : interpolate$1;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS$3 : attrFunction$3)(fullname, i, tweenValue$1(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS$3 : attrRemove$3)(fullname) : (fullname.local ? attrConstantNS$3 : attrConstant$3)(fullname, i, value));
};

function attrTweenNS$1(fullname, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttributeNS(fullname.space, fullname.local, i(t));
    };
  }
  tween._value = value;
  return tween;
}

function attrTween$1(name, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttribute(name, i(t));
    };
  }
  tween._value = value;
  return tween;
}

var transition_attrTween$1 = function (name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  var fullname = namespace$2(name);
  return this.tween(key, (fullname.local ? attrTweenNS$1 : attrTween$1)(fullname, value));
};

function delayFunction$1(id, value) {
  return function () {
    init$2(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant$1(id, value) {
  return value = +value, function () {
    init$2(this, id).delay = value;
  };
}

var transition_delay$1 = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? delayFunction$1 : delayConstant$1)(id, value)) : get$5(this.node(), id).delay;
};

function durationFunction$1(id, value) {
  return function () {
    set$9(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant$1(id, value) {
  return value = +value, function () {
    set$9(this, id).duration = value;
  };
}

var transition_duration$1 = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? durationFunction$1 : durationConstant$1)(id, value)) : get$5(this.node(), id).duration;
};

function easeConstant$1(id, value) {
  if (typeof value !== "function") throw new Error();
  return function () {
    set$9(this, id).ease = value;
  };
}

var transition_ease$1 = function (value) {
  var id = this._id;

  return arguments.length ? this.each(easeConstant$1(id, value)) : get$5(this.node(), id).ease;
};

var transition_filter$1 = function (match) {
  if (typeof match !== "function") match = matcher$3(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition$1(subgroups, this._parents, this._name, this._id);
};

var transition_merge$1 = function (transition) {
  if (transition._id !== this._id) throw new Error();

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition$1(merges, this._parents, this._name, this._id);
};

function start$1(name) {
  return (name + "").trim().split(/^|\s+/).every(function (t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction$1(id, name, listener) {
  var on0,
      on1,
      sit = start$1(name) ? init$2 : set$9;
  return function () {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

var transition_on$1 = function (name, listener) {
  var id = this._id;

  return arguments.length < 2 ? get$5(this.node(), id).on.on(name) : this.each(onFunction$1(id, name, listener));
};

function removeFunction$1(id) {
  return function () {
    var parent = this.parentNode;
    for (var i in this.__transition) {
      if (+i !== id) return;
    }if (parent) parent.removeChild(this);
  };
}

var transition_remove$1 = function () {
  return this.on("end.remove", removeFunction$1(this._id));
};

var transition_select$1 = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selector$1(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule$1(subgroup[i], name, id, i, subgroup, get$5(node, id));
      }
    }
  }

  return new Transition$1(subgroups, this._parents, name, id);
};

var transition_selectAll$1 = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selectorAll$1(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select$$1.call(node, node.__data__, i, group), child, inherit = get$5(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule$1(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition$1(subgroups, parents, name, id);
};

var Selection$3 = selection$2.prototype.constructor;

var transition_selection$1 = function () {
  return new Selection$3(this._groups, this._parents);
};

function styleRemove$3(name, interpolate$$1) {
    var value00, value10, interpolate0;
    return function () {
        var style = window$2(this).getComputedStyle(this, null),
            value0 = style.getPropertyValue(name),
            value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
}

function styleRemoveEnd$1(name) {
    return function () {
        this.style.removeProperty(name);
    };
}

function styleConstant$3(name, interpolate$$1, value1) {
    var value00, interpolate0;
    return function () {
        var value0 = window$2(this).getComputedStyle(this, null).getPropertyValue(name);
        return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
    };
}

function styleFunction$3(name, interpolate$$1, value) {
    var value00, value10, interpolate0;
    return function () {
        var style = window$2(this).getComputedStyle(this, null),
            value0 = style.getPropertyValue(name),
            value1 = value(this);
        if (value1 == null) value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
}

var transition_style$1 = function (name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss$1 : interpolate$1;
    return value == null ? this.styleTween(name, styleRemove$3(name, i)).on("end.style." + name, styleRemoveEnd$1(name)) : this.styleTween(name, typeof value === "function" ? styleFunction$3(name, i, tweenValue$1(this, "style." + name, value)) : styleConstant$3(name, i, value), priority);
};

function styleTween$1(name, value, priority) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.style.setProperty(name, i(t), priority);
    };
  }
  tween._value = value;
  return tween;
}

var transition_styleTween$1 = function (name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, styleTween$1(name, value, priority == null ? "" : priority));
};

function textConstant$3(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction$3(value) {
  return function () {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

var transition_text$1 = function (value) {
  return this.tween("text", typeof value === "function" ? textFunction$3(tweenValue$1(this, "text", value)) : textConstant$3(value == null ? "" : value + ""));
};

var transition_transition$1 = function () {
  var name = this._name,
      id0 = this._id,
      id1 = newId$1();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get$5(node, id0);
        schedule$1(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition$1(groups, this._parents, name, id1);
};

var id$1 = 0;

function Transition$1(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition$3(name) {
  return selection$2().transition(name);
}

function newId$1() {
  return ++id$1;
}

var selection_prototype$1 = selection$2.prototype;

Transition$1.prototype = transition$3.prototype = {
  constructor: Transition$1,
  select: transition_select$1,
  selectAll: transition_selectAll$1,
  filter: transition_filter$1,
  merge: transition_merge$1,
  selection: transition_selection$1,
  transition: transition_transition$1,
  call: selection_prototype$1.call,
  nodes: selection_prototype$1.nodes,
  node: selection_prototype$1.node,
  size: selection_prototype$1.size,
  empty: selection_prototype$1.empty,
  each: selection_prototype$1.each,
  on: transition_on$1,
  attr: transition_attr$1,
  attrTween: transition_attrTween$1,
  style: transition_style$1,
  styleTween: transition_styleTween$1,
  text: transition_text$1,
  remove: transition_remove$1,
  tween: transition_tween$1,
  delay: transition_delay$1,
  duration: transition_duration$1,
  ease: transition_ease$1
};

function cubicInOut$1(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var exponent$2 = 3;

var polyIn$1 = function custom(e) {
  e = +e;

  function polyIn(t) {
    return Math.pow(t, e);
  }

  polyIn.exponent = custom;

  return polyIn;
}(exponent$2);

var polyOut$1 = function custom(e) {
  e = +e;

  function polyOut(t) {
    return 1 - Math.pow(1 - t, e);
  }

  polyOut.exponent = custom;

  return polyOut;
}(exponent$2);

var polyInOut$1 = function custom(e) {
  e = +e;

  function polyInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
  }

  polyInOut.exponent = custom;

  return polyInOut;
}(exponent$2);

var b1$1 = 4 / 11;
var b2$1 = 6 / 11;
var b3$1 = 8 / 11;
var b4$1 = 3 / 4;
var b5$1 = 9 / 11;
var b6$1 = 10 / 11;
var b7$1 = 15 / 16;
var b8$1 = 21 / 22;
var b9$1 = 63 / 64;
var b0$1 = 1 / b1$1 / b1$1;



function bounceOut$1(t) {
  return (t = +t) < b1$1 ? b0$1 * t * t : t < b3$1 ? b0$1 * (t -= b2$1) * t + b4$1 : t < b6$1 ? b0$1 * (t -= b5$1) * t + b7$1 : b0$1 * (t -= b8$1) * t + b9$1;
}

var overshoot$1 = 1.70158;

var backIn$1 = function custom(s) {
  s = +s;

  function backIn(t) {
    return t * t * ((s + 1) * t - s);
  }

  backIn.overshoot = custom;

  return backIn;
}(overshoot$1);

var backOut$1 = function custom(s) {
  s = +s;

  function backOut(t) {
    return --t * t * ((s + 1) * t + s) + 1;
  }

  backOut.overshoot = custom;

  return backOut;
}(overshoot$1);

var backInOut$1 = function custom(s) {
  s = +s;

  function backInOut(t) {
    return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
  }

  backInOut.overshoot = custom;

  return backInOut;
}(overshoot$1);

var tau$3 = 2 * Math.PI;
var amplitude$1 = 1;
var period$1 = 0.3;

var elasticIn$1 = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau$3);

  function elasticIn(t) {
    return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
  }

  elasticIn.amplitude = function (a) {
    return custom(a, p * tau$3);
  };
  elasticIn.period = function (p) {
    return custom(a, p);
  };

  return elasticIn;
}(amplitude$1, period$1);

var elasticOut$1 = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau$3);

  function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function (a) {
    return custom(a, p * tau$3);
  };
  elasticOut.period = function (p) {
    return custom(a, p);
  };

  return elasticOut;
}(amplitude$1, period$1);

var elasticInOut$1 = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau$3);

  function elasticInOut(t) {
    return ((t = t * 2 - 1) < 0 ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p) : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
  }

  elasticInOut.amplitude = function (a) {
    return custom(a, p * tau$3);
  };
  elasticInOut.period = function (p) {
    return custom(a, p);
  };

  return elasticInOut;
}(amplitude$1, period$1);

var defaultTiming$1 = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut$1
};

function inherit$1(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming$1.time = now$1(), defaultTiming$1;
    }
  }
  return timing;
}

var selection_transition$1 = function (name) {
  var id, timing;

  if (name instanceof Transition$1) {
    id = name._id, name = name._name;
  } else {
    id = newId$1(), (timing = defaultTiming$1).time = now$1(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule$1(node, name, id, i, group, timing || inherit$1(node, id));
      }
    }
  }

  return new Transition$1(groups, this._parents, name, id);
};

selection$2.prototype.interrupt = selection_interrupt$1;
selection$2.prototype.transition = selection_transition$1;

var root$3 = [null];

//
//  d3-transition
//  =============
var transition$2 = {

    refresh: function refresh(model) {
        transition$3(model);
    }
};

//
//  d3-for directive
//  ======================
//
//  Repeat a element over an array of items and establish
//  a one way binding between the array and the Dom
var d3For = {

    create: function create(expression) {
        var bits = [];
        expression.trim().split(' ').forEach(function (v) {
            v ? bits.push(v) : null;
        });
        if (bits.length !== 3 || bits[1] != 'in') return warn('d3-for directive requires "item in expression" template, got "' + expression + '"');
        this.itemName = bits[0];
        this.itemClass = 'for' + this.uid;
        return bits[2];
    },

    mount: function mount$1(model) {
        this.creator = this.el;
        this.el = this.creator.parentNode;
        // remove the creator from the DOM
        select$2(this.creator).remove();
        return model;
    },

    refresh: function refresh(model, items) {
        if (!isArray$1(items)) return;

        var creator$$1 = this.creator,
            selector$$1 = creator$$1.tagName + '.' + this.itemClass,
            itemName = this.itemName,
            entries = this.sel.selectAll(selector$$1).data(items);

        entries.enter().append(function () {
            return creator$$1.cloneNode(true);
        }).classed(this.itemClass, true).each(function (d, index) {
            var x = { index: index };
            x[itemName] = d;
            mount$1(model.$child(x), this);
        });

        entries.exit().remove();
    }
};

//
//  d3-if
//  =============
//
//  Remove an element if the condition is not satisfied
//
var d3If = {

    refresh: function refresh(model, value) {
        if (value) this.sel.style('display', null);else this.sel.style('display', 'none');
    }
};

var directives$1 = {
    model: model$2,
    attr: attr,
    html: html,
    value: value$1,
    show: show,
    on: on$1,
    transition: transition$2,
    'for': d3For,
    'if': d3If
};

var asSelect = function (el) {
    if (el && !isFunction$1(el.size)) return select$2(el);
    return el;
};

var maybeJson = function (value) {
    if (isString$1(value)) {
        try {
            return JSON.parse(value);
        } catch (msg) {
            return value;
        }
    }
    return value;
};

// require handlebar
function compile$1(text) {
    var handlebars = inBrowser$1 ? window.handlebars : require('handlebars');
    if (handlebars) return handlebars.compile(text);
    warn('compile function requires handlebars');
}

function html$1(source, context) {
    if (isString$1(source)) {
        if (context) {
            var s = compile$1(source);
            if (!s) return source;
        } else return source;
    }
    return source(context);
}

function htmlElement(source, context) {
    var el = select$2(document.createElement('div'));
    el.html(html$1(source, context));
    var children = el.node().children;
    if (children.length !== 1) warn('HtmlElement function should return one root element only, got ' + children.length);
    return children[0];
}

// Core Directives
var coreDirectives = extendDirectives(map$8(), directives$1);

// prototype for both views and components
var protoComponent = {
    isd3: true,
    providers: providers,
    htmlElement: htmlElement,
    // same as export
    viewElement: htmlElement,

    init: function init() {},

    mounted: function mounted$1() {},

    createElement: function createElement(tag) {
        return select$2(document.createElement(tag));
    },

    responseError: function responseError(response) {
        var self$$1 = this;
        response.json().then(function (data) {
            self$$1.error(data, response);
        });
    },
    error: function error(data) {
        data.level = 'error';
        this.message(data);
    },
    message: function message(data) {
        var self$$1 = this;
        this.root.events.call('message', self$$1, data);
    },


    // Shortcut for fetch function in providers
    fetch: function fetch(url, options) {
        var fetch = providers.fetch;
        return arguments.length == 1 ? fetch(url) : fetch(url, options);
    },


    render: function render() {},

    mount: function mount(el) {
        if (mounted$1(this)) warn('already mounted');else {
            var parent = this.parent ? this.parent.model : null,
                directives = getdirs(el, this.directives),
                model = createModel(directives, this.model, parent);
            //
            this.model = model;
            //
            // When a for d3-for loop is active we abort mounting this component
            // The component will be mounted as many times the the for loop requires
            if (mount$1(this.model, el)) return;

            var data = select$2(el).datum() || {};

            if (isArray$1(this.props)) {
                var key, value;
                this.props.forEach(function (prop) {
                    key = directives.attrs[prop];
                    if (model[key]) value = model[key];else value = maybeJson(key);
                    data[prop] = value;
                });
            }
            //
            // create the new element from the render function
            var newEl = this.render(data, directives.attrs);
            if (isPromise$1(newEl)) {
                var self$$1 = this;
                newEl.then(function (element) {
                    compile$$1(self$$1, el, element);
                });
            } else compile$$1(this, el, newEl);
        }
        return this;
    }
};

// factory of View and Component constructors
function createComponent(o, prototype) {
    if (isFunction$1(o)) o = { render: o };

    var obj = assign$2({}, o),
        classComponents = extendComponents(map$8(), pop$2(obj, 'components')),
        classDirectives = extendDirectives(map$8(), pop$2(obj, 'directives')),
        model = pop$2(obj, 'model'),
        props = pop$2(obj, 'props');

    function Component(options) {
        var parent = pop$2(options, 'parent'),
            components = map$8(parent ? parent.components : null),
            directives = map$8(parent ? parent.directives : coreDirectives),
            events = dispatch$2('message');

        classComponents.each(function (comp, key) {
            components.set(key, comp);
        });
        classDirectives.each(function (comp, key) {
            directives.set(key, comp);
        });
        extendComponents(components, pop$2(options, 'components'));
        extendDirectives(directives, pop$2(options, 'directives'));

        Object.defineProperties(this, {
            components: {
                get: function get() {
                    return components;
                }
            },
            directives: {
                get: function get() {
                    return directives;
                }
            },
            parent: {
                get: function get() {
                    return parent;
                }
            },
            root: {
                get: function get() {
                    return parent ? parent.root : this;
                }
            },
            props: {
                get: function get() {
                    return props;
                }
            },
            uid: {
                get: function get() {
                    return this.model.uid;
                }
            },
            events: {
                get: function get() {
                    return events;
                }
            }
        });
        this.model = assign$2({}, model, pop$2(options, 'model'));
        this.init(options);
    }

    Component.prototype = assign$2({}, prototype, obj);

    function component(options) {
        return new Component(options);
    }

    component.prototype = Component.prototype;

    return component;
}

function mounted$1(view) {
    var mounted = view.isMounted;
    if (!mounted) Object.defineProperty(view, 'isMounted', {
        get: function get() {
            return true;
        }
    });
    return mounted;
}

function extendComponents(container, components) {
    map$8(components).each(function (obj, key) {
        container.set(key, createComponent(obj, protoComponent));
    });
    return container;
}

function extendDirectives(container, directives) {
    map$8(directives).each(function (obj, key) {
        container.set(key, createDirective(obj));
    });
    return container;
}

function asView(vm, element) {
    var model = vm.model;

    Object.defineProperty(sel(vm), 'el', {
        get: function get() {
            return element;
        }
    });

    Object.defineProperty(model, '$vm', {
        get: function get() {
            return vm;
        }
    });

    // Apply model to element
    select$2(element).model(model);

    mount$1(model, element);
}

// Compile a component model
// This function is called once a component has rendered the component element
function compile$$1(cm, el, element) {
    if (!element) return warn('render function must return a single HTML node. It returned nothing!');
    element = asSelect(element);
    if (element.size() !== 1) warn('render function must return a single HTML node');
    element = element.node();
    //
    // Insert before the component element
    el.parentNode.insertBefore(element, el);
    // remove the component element
    select$2(el).remove();
    //
    asView(cm, element);
    //
    // mounted hook
    cm.mounted();
}

//
// prototype for views
var protoView = assign$2({}, protoComponent, {

    use: function use(plugin) {
        if (isObject$1(plugin)) plugin.install(this);else plugin(this);
        return this;
    },

    addComponent: function addComponent(name, obj) {
        if (this.isMounted) return warn('already mounted, cannot add component');
        var component = createComponent(obj, protoComponent);
        this.components.set(name, component);
        return component;
    },

    addDirective: function addDirective(name, obj) {
        if (this.isMounted) return warn('already mounted, cannot add directive');
        var directive = createDirective(obj);
        this.directives.set(name, directive);
        return directive;
    },

    mount: function mount(el) {
        if (mounted$1(this)) warn('already mounted');else {
            el = element$2(el);
            if (el) {
                var parent = this.parent ? this.parent.model : null;
                this.model = createModel(getdirs(el, this.directives), this.model, parent);
                asView(this, el);
            }
        }
        return this;
    }
});

// the view constructor
var view = createComponent(null, protoView);

function element$2(el) {
    if (!el) return warn('element not defined, pass an identifier or an HTMLElement object');
    var d3el = isFunction$1(el.node) ? el : select$2(el),
        element = d3el.node();
    if (!element) warn('could not find ' + el + ' element');else return element;
}

// Add callback to execute when the DOM is ready
var dom = function (callback) {
    readyCallbacks.push(callback);
    if (document.readyState !== 'complete') {
        document.addEventListener('DOMContentLoaded', _completed);
        // A fallback to window.onload, that will always work
        window.addEventListener('load', _completed);
    } else domReady();
};

var readyCallbacks = [];

function _completed() {
    document.removeEventListener('DOMContentLoaded', _completed);
    window.removeEventListener('load', _completed);
    domReady();
}

function domReady() {
    var callback = void 0;
    while (readyCallbacks.length) {
        callback = readyCallbacks.shift();
        timeout$3(callback);
    }
}

//
// Promise enabled require function
var require$1 = function (libs) {
    var self$$1 = this;

    return new Promise(function (resolve, reject) {
        try {
            if (inBrowser$1) {
                window.require(libs, function () {
                    resolve.apply(this, arguments);
                });
            } else {
                resolve.apply(self$$1, require(libs));
            }
        } catch (err) {
            reject(err);
        }
    });
};

var providers$1 = {
    logger: logger$1
};

var prefix$6 = '[d3-form]';

var warn$1 = function (msg) {
    providers$1.logger.warn(prefix$6 + ' ' + msg);
};

var modelDataKeys = ['labelSrOnly', 'layout'];

var componentsFromType = {
    'text': 'input',
    'password': 'input',
    'number': 'input'
};

// return A promise which execute a callback at the next event Loop cycle
function nextTick(callback) {
    var self$$1 = this;
    return new Promise(function (resolve) {
        resolve();
    }).then(function () {
        return callback.call(self$$1);
    });
}

function formComponent(child) {
    var type = child.type || 'text';
    return componentsFromType[type] || type;
}

function addChildren(sel) {
    var children = this.data.children;
    if (children) {
        if (!isArray$1(children)) {
            warn$1('children should be an array of fields, for ' + (typeof children === 'undefined' ? 'undefined' : _typeof(children)));
            return sel;
        }
        sel.selectAll('.d3form').data(children).enter().append(formChild).classed('d3form', true);
    }
    return sel;
}

function modelData(data) {
    if (!data) data = {};
    this.data = data;
    var model = this.model;
    modelDataKeys.forEach(function (key) {
        if (key in data) model.$set(key, data[key]);
    });
    return data;
}

function formChild(child) {
    var component = formComponent(child);
    if (!component) {
        warn$1('Could not find form component ' + child.type);
        component = 'input';
        child.type = 'hidden';
    }
    return document.createElement('d3' + component);
}

//
// Fieldset element
var fieldset = {

    render: function render(data) {
        var el = this.createElement('fieldset');
        modelData.call(this, data);
        return addChildren.call(this, el);
    }

};

var formElement = {
    wrap: function wrap(sel) {
        var field = this,
            theme = getTheme(field),
            wrappers = theme ? theme[sel.attr('type')] || theme[sel.node().tagName.toLowerCase()] : null;
        if (!wrappers || !theme.wrappers) return sel;

        var wrapped = sel,
            wrap;

        wrappers.forEach(function (wrapper) {
            wrap = theme.wrappers[wrapper];
            if (wrap) wrapped = wrap.call(field, wrapped, sel);else warn$1('Could not find form field wrapper ' + wrapper);
        });

        return wrapped;
    },
    wrapTemplate: function wrapTemplate(sel, template) {
        var div = document.createElement('div'),
            outer = select$2(div).html(template),
            slot = outer.select('slot');

        if (!slot.size()) {
            warn$1('template does not provide a slot element');
            return sel;
        }
        var target = select$2(slot.node().parentNode);
        sel.nodes().forEach(function (node) {
            target.insert(function () {
                return node;
            }, 'slot');
        });
        slot.remove();
        return selectAll$1(div.children);
    }
};

// A mixin for all form field components
var field = assign$2({

    model: {
        error: '',
        isDirty: false,
        showError: {
            reactOn: ['error', 'isDirty', 'formSubmitted'],
            get: function get() {
                if (this.error) return this.isDirty || this.formSubmitted;
                return false;
            }
        }
    },

    mounted: function mounted() {
        this.model.$on('value', function () {
            this.isDirty = true;
        });
    },
    inputData: function inputData(data) {
        data = modelData.call(this, data);
        if (!data.name) warn$1('Input field without a name');
        data.placeholder = data.placeholder || data.label || data.name;
        data.id = data.id || 'd3f' + this.uid;
        this.model.inputs[data.name] = this.model;
        return data;
    }
}, formElement);

function getTheme(component) {
    var theme = component.formTheme;
    if (!theme && component.parent) return getTheme(component.parent);else return theme;
}

var required = {
    set: function set(el, data) {
        var value = data.required;
        if (isString$1(value)) el.attr('d3-required', value);else el.property('required', value || null);
    },
    validate: function validate(el, value) {
        if (el.property('required')) {
            if (!value) return 'required';
        } else if (value === '') return true;
    }
};

var minlength = {
    set: function set(el, data) {
        var value = data.minlength;
        if (isString$1(value)) el.attr('d3-attr-minlength', value);else if (value !== undefined) el.attr('minlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('minlength');
        if (l === l && l > 0 && value.length < l) return 'too short - ' + l + ' characters or more expected';
    }
};

var maxlength = {
    set: function set(el, data) {
        var value = data.maxlength;
        if (isString$1(value)) el.attr('d3-attr-maxlength', value);else if (value !== undefined) el.attr('maxlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('maxlength');
        if (l === l && l > 0 && value.length > l) return 'too long - ' + l + ' characters or less expected';
    }
};

var min$1 = {
    set: function set(el, data) {
        var value = data.min;
        if (isString$1(value)) el.attr('d3-attr-min', value);else if (value !== undefined) el.attr('min', value);
    },
    validate: function validate(el, value) {
        var r = range$1(el);
        if (r && +value < r[0]) return 'must be greater or equal ' + r[0];
    }
};

var max$1 = {
    set: function set(el, data) {
        var value = data.max;
        if (isString$1(value)) el.attr('d3-attr-max', value);else if (value !== undefined) el.attr('max', value);
    },
    validate: function validate(el, value) {
        var r = range$1(el);
        if (r && +value > r[1]) return 'must be less or equal ' + r[1];
    }
};

var validators = {
    get: function get(model, custom) {
        var validators = this.all.slice(0);
        if (isObject$1(custom)) for (var key in custom) {
            validators.push(customValidator(key, custom[key]));
        }return validators;
    },
    set: function set(vm, el) {
        vm.model.validators.forEach(function (validator) {
            validator.set(el, vm.data);
        });

        vm.model.$on(this.validate);
    },
    validate: function validate(property) {
        if (property !== 'value') return;

        var vm = this.$vm,
            validators = this.validators,
            el = vm.sel.attr('id') === vm.data.id ? vm.sel : vm.sel.select('#' + vm.data.id),
            value = this.value,
            validator,
            msg;

        for (var i = 0; i < validators.length; ++i) {
            validator = validators[i];
            msg = validator.validate(el, value);
            if (msg) {
                if (msg === true) msg = '';
                break;
            }
        }

        this.error = msg || '';
    },


    all: [required, minlength, maxlength, min$1, max$1]
};

function range$1(el) {
    var l0 = el.attr('min'),
        l1 = el.attr('max');
    l0 = l0 === null ? -Infinity : +l0;
    l1 = l1 === null ? Infinity : +l1;
    return [l0, l1];
}

function customValidator(key, method) {

    return {
        set: function set(el, data) {
            var value = data[key];
            if (!value) return;
        },
        validate: function validate(el, value) {
            return method(el, value);
        }
    };
}

//
// Input element
var input$1 = assign$2({

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('input').attr('id', data.id).attr('type', data.type || 'text').attr('name', data.name).attr('d3-value', 'value').attr('placeholder', data.placeholder);

        validators.set(this, el);
        return this.wrap(el);
    }
}, field);

//
// Textarea element
var textarea$1 = assign$2({

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('textarea').attr('id', data.id).attr('name', data.name).attr('placeholder', data.placeholder).attr('d3-value', 'value').attr('d3-validate', 'validators');

        validators.set(this, el);
        return this.wrap(el);
    }

}, field);

//
// Select element
var select$3 = assign$2({}, field, {

    model: assign$2({
        options: [],
        $optionLabel: optionLabel,
        $optionValue: optionValue
    }, field.model),

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('select').attr('id', data.id).attr('name', data.name).attr('d3-value', 'value').attr('placeholder', data.placeholder);

        this.model.options = data.options;

        el.append('option').attr('d3-for', 'option in options').attr('d3-html', '$optionLabel()').attr('d3-attr-value', '$optionValue()');

        validators.set(this, el);
        return this.wrap(el);
    }
});

function optionValue() {
    if (isArray$1(this.option)) return this.option[0];
    return this.option;
}

function optionLabel() {
    if (isArray$1(this.option)) return this.option[1] || this.option[0];
    return this.option;
}

//
// Submit element
var submit = assign$2({

    render: function render(data) {
        data = modelData.call(this, data);
        data.type = data.type || 'submit';
        this.model.$set('error', false);
        if (!isString$1(data.disabled)) {
            this.model.$set('disabled', data.disabled || null);
            data.disabled = 'disabled';
        }
        if (!data.click) data.click = '$vm.click()';

        var el = this.createElement('button').attr('type', data.type).attr('name', data.name).attr('d3-attr-disabled', data.disabled).attr('d3-on-click', data.click).html(data.label || 'submit');

        return this.wrap(el);
    },

    click: function click() {
        this.model.form.actions.submit.call(this, event$1);
    }
}, formElement);

// Form Responses
var responses = {
    "default": defaultResponse,
    redirect: redirect
};

function defaultResponse(response) {
    var data = response.json();
    this.message(data);
}

function redirect() {
    window.location.href = this.data.redirectTo || '/';
}

// Form Actions
var actions = {
    submit: submit$1
};

function submit$1(e) {
    var form = this && this.model ? this.model.form : null;

    if (!form) {
        warn$1('form not available, cannot submit');
        return;
    }

    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    var fetch = providers$1.fetch,
        ct = (form.data.enctype || '').split(';')[0],
        action = form.data.action,
        url = isObject$1(action) ? action.url : action,
        data = form.inputData(),
        options = {};

    if (!fetch) {
        warn$1('fetch provider not available, cannot submit');
        return;
    }

    if (!url) {
        warn$1('No url, cannot submit');
        return;
    }

    if (ct === 'application/json') {
        options.headers = {
            'Content-Type': form.data.enctype
        };
        options.body = JSON.stringify(data);
    } else {
        options.body = new FormData();
        for (var key in data) {
            options.body.set(key, data[key]);
        }
    }

    // Flag the form as submitted
    form.setSubmit();
    options.method = form.method || 'post';
    fetch(url, options).then(success, failure);

    function success(response) {
        form.setSubmitDone();
        form.response(response);
    }

    function failure() {
        form.setSubmitDone();
    }
}

// Main form component
var form = {

    // make sure a new model is created for this component
    props: ['json'],

    model: {
        formSubmitted: false,
        formPending: false
    },

    components: {
        'd3fieldset': fieldset,
        'd3input': input$1,
        'd3textarea': textarea$1,
        'd3select': select$3,
        'd3submit': submit
    },

    render: function render(data) {
        var model = this.model,
            form = this.createElement('form').attr('novalidate', ''),
            self$$1 = this;
        //
        model.inputs = {};
        model.form = this;
        //
        var json = data['json'];
        if (isString$1(json)) {
            var fetch = providers$1.fetch;
            return fetch(json, { method: 'GET' }).then(function (response) {
                if (response.status === 200) return response.json().then(build);else warn$1('Could not load form from ' + json + ': status ' + response.status);
            });
        } else return build(json);

        function build(formData) {
            modelData.call(self$$1, formData);
            //
            // Form validations
            model.validators = validators.get(model, data.validators);
            //
            // Form actions
            self$$1.actions = {};
            for (var key in actions) {
                var action = self$$1.data[key];
                if (isString$1(action)) action = self$$1.model.$get(action);
                self$$1.actions[key] = action || actions[key];
            }
            addChildren.call(self$$1, form);
            return form;
        }
    },

    inputData: function inputData() {
        var inputs = this.model.inputs,
            data = {},
            value;
        for (var key in inputs) {
            value = inputs[key].value;
            if (value !== undefined) data[key] = value;
        }

        return data;
    },

    setSubmit: function setSubmit() {
        var _this = this;

        this.model.formSubmitted = true;
        this.model.formPending = true;
        return nextTick.call(this, function () {
            return _this.isValid();
        });
    },

    setSubmitDone: function setSubmitDone() {
        this.model.formPending = false;
    },

    isValid: function isValid() {
        var inp;
        for (var key in this.model.inputs) {
            inp = this.model.inputs[key];
            if (inp.error) return false;
        }
        return true;
    },
    inputError: function inputError(error) {
        var input = this.model.inputs[error.name];
        if (!input) {
            warn$1('Unknown input, cannot set input error');
            this.error(error);
        }
    },
    response: function response(_response) {
        if (!_response) return;
        var handler;

        if (_response.status) {
            if (_response.status < 300) {
                if (this.data.resultHandler) {
                    handler = responses[this.data.resultHandler];
                    if (!handler) warn$1('Could not find ' + this.data.resultHandler + ' result handler');else handler.call(this, _response);
                } else {
                    responses.default.call(this, _response);
                }
            } else this.responseError(_response);
        } else if (_response.error) {
            this.error(_response.error);
        } else if (isArray$1(_response.errors)) {
            var self$$1 = this;
            _response.errors.forEach(function (error) {
                self$$1.inputError(error);
            });
        } else {
            if (this.data.resultHandler) {
                handler = responses[this.data.resultHandler];
                if (!handler) warn$1('Could not find ' + this.data.resultHandler + ' result handler');else handler.call(this, _response);
            } else {
                responses.default.call(this, _response);
            }
        }
    }
};

// Forms plugin
var plugin = {

    install: function install(view) {
        view.addComponent('d3form', form);
        for (var key in view.providers) {
            providers$1[key] = view.providers[key];
        }
    },

    actions: actions,

    responses: responses
};

var label = function (el) {
    return this.wrapTemplate(el, labelTpl(this.data));
};

function labelTpl(data) {
    var label = data.label || data.name;

    return "<label for=" + data.id + " class=\"control-label\" d3-class=\"[required, labelSrOnly ? 'sr-only' : null]\">" + label + "</label>\n<slot></slot>";
}

var groupTpl = '<div class="form-group" d3-class=\'showError ? "has-danger" : null\'>\n<slot></slot>\n<p d3-if="showError" class="text-danger error-block" d3-html="error"></p>\n</div>';

var formGroup = function (el, formEl) {
    formEl.classed('form-control', true).attr('d3-class', 'showError ? "form-control-danger" : null');
    return this.wrapTemplate(el, groupTpl);
};

var inputGroup = function (el, formEl) {
    var ig = this.data['group'];
    if (!ig) return el;
    var gid = 'g' + formEl.attr('id');
    formEl.attr('aria-describedby', gid);
    return this.wrapTemplate(el, groupTpl$1(gid, ig));
};

function groupTpl$1(gid, group) {
    return '<div class="input-group" :class="bootstrapStatus()">\n<span class="input-group-addon" id="' + gid + '">' + group + '</span>\n<slot></slot>\n</div>';
}

var groupTpl$2 = '<div class="form-group">\n<slot></slot>\n</div>';

var submit$2 = function (el, formEl) {
    var theme = this.data.theme || 'primary';
    formEl.classed('btn', true).classed('btn-' + theme, true);
    return this.wrapTemplate(el, groupTpl$2);
};

var bootstrap = {

    input: ['inputGroup', 'label', 'formGroup'],
    textarea: ['label', 'formGroup'],
    select: ['label', 'formGroup'],
    submit: ['submit'],
    wrappers: {
        label: label,
        formGroup: formGroup,
        inputGroup: inputGroup,
        submit: submit$2
    }
};

// Bootstrap theme
var plugin$1 = {

    install: function install(view) {
        var d3form = view.components.get('d3form');
        if (d3form) d3form.prototype.formTheme = bootstrap;
    }
};

var version$3 = "0.2.0";

var prefix$7 = "$";

function Map$4() {}

Map$4.prototype = map$10.prototype = {
  constructor: Map$4,
  has: function has(key) {
    return prefix$7 + key in this;
  },
  get: function get(key) {
    return this[prefix$7 + key];
  },
  set: function set(key, value) {
    this[prefix$7 + key] = value;
    return this;
  },
  remove: function remove(key) {
    var property = prefix$7 + key;
    return property in this && delete this[property];
  },
  clear: function clear() {
    for (var property in this) {
      if (property[0] === prefix$7) delete this[property];
    }
  },
  keys: function keys() {
    var keys = [];
    for (var property in this) {
      if (property[0] === prefix$7) keys.push(property.slice(1));
    }return keys;
  },
  values: function values() {
    var values = [];
    for (var property in this) {
      if (property[0] === prefix$7) values.push(this[property]);
    }return values;
  },
  entries: function entries() {
    var entries = [];
    for (var property in this) {
      if (property[0] === prefix$7) entries.push({ key: property.slice(1), value: this[property] });
    }return entries;
  },
  size: function size() {
    var size = 0;
    for (var property in this) {
      if (property[0] === prefix$7) ++size;
    }return size;
  },
  empty: function empty() {
    for (var property in this) {
      if (property[0] === prefix$7) return false;
    }return true;
  },
  each: function each(f) {
    for (var property in this) {
      if (property[0] === prefix$7) f(this[property], property.slice(1), this);
    }
  }
};

function map$10(object, f) {
  var map = new Map$4();

  // Copy constructor.
  if (object instanceof Map$4) object.each(function (value, key) {
    map.set(key, value);
  });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) {
        map.set(i, object[i]);
      } else while (++i < n) {
        map.set(f(o = object[i], i, object), o);
      }
    }

    // Convert object to map.
    else if (object) for (var key in object) {
        map.set(key, object[key]);
      }return map;
}

function createObject$2() {
  return {};
}

function setObject$2(object, key, value) {
  object[key] = value;
}

function createMap$2() {
  return map$10();
}

function setMap$2(map, key, value) {
  map.set(key, value);
}

function Set$2() {}

var proto$3 = map$10.prototype;

Set$2.prototype = set$10.prototype = {
  constructor: Set$2,
  has: proto$3.has,
  add: function add(value) {
    value += "";
    this[prefix$7 + value] = value;
    return this;
  },
  remove: proto$3.remove,
  clear: proto$3.clear,
  values: proto$3.keys,
  size: proto$3.size,
  empty: proto$3.empty,
  each: proto$3.each
};

function set$10(object, f) {
  var set = new Set$2();

  // Copy constructor.
  if (object instanceof Set$2) object.each(function (value) {
    set.add(value);
  });

  // Otherwise, assume it’s an array.
  else if (object) {
      var i = -1,
          n = object.length;
      if (f == null) while (++i < n) {
        set.add(object[i]);
      } else while (++i < n) {
        set.add(f(object[i], i, object));
      }
    }

  return set;
}

var ostring$2 = Object.prototype.toString;
var inBrowser$2 = typeof window !== 'undefined' && ostring$2.call(window) !== '[object Object]';

var logger$2 = inBrowser$2 ? window.console : require('console');

// From https://github.com/sindresorhus/object-assign
// The MIT License (MIT)
//
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
var hasOwnProperty$2 = Object.prototype.hasOwnProperty;
var propIsEnumerable$2 = Object.prototype.propertyIsEnumerable;

var assign$4 = assign$5();

function toObject$2(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative$2() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
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
		if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

function assign$5() {
	return shouldUseNative$2() ? Object.assign : function (target) {
		var from;
		var to = toObject$2(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty$2.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (Object.getOwnPropertySymbols) {
				symbols = Object.getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable$2.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};
}

// Simulate a WeekMap for now

function isObject$2(value) {
    return ostring$2.call(value) === '[object Object]';
}

function isString$2(value) {
    return ostring$2.call(value) === '[object String]';
}

function isFunction$2(value) {
    return ostring$2.call(value) === '[object Function]';
}

function isArray$2(value) {
    return ostring$2.call(value) === '[object Array]';
}





function isPromise$2(value) {
    return ostring$2.call(value) === '[object Promise]';
}

var pop$3 = function (obj, prop) {
    var value = void 0;
    if (isObject$2(obj)) {
        value = obj[prop];
        delete obj[prop];
        return value;
    } else if (isArray$2(obj)) {
        var index = +prop;
        if (index === index) return obj.splice(index, 1)[0];
        value = obj[prop];
        delete obj[prop];
        return value;
    }
};

var prefix$8 = "$";

function Map$5() {
    this._array = [];
}

Map$5.prototype = map$12.prototype = {
    constructor: Map$5,

    size: function size() {
        return this._array.length;
    },
    get: function get(key) {
        return this[prefix$8 + key];
    },
    set: function set(key, value) {
        if (!this.has(key)) this._array.push(key);
        this[prefix$8 + key] = value;
        return this;
    },
    has: function has(key) {
        return prefix$8 + key in this;
    },
    clear: function clear() {
        var self = this;
        this.each(function (_, property) {
            delete self[prefix$8 + property];
        });
        this._array.splice(0);
    },
    keys: function keys() {
        var entries = [];
        this.each(function (_, key) {
            entries.push(key);
        });
        return entries;
    },
    values: function values() {
        var entries = [];
        this.each(function (v) {
            entries.push(v);
        });
        return entries;
    },
    each: function each(callback) {
        var a = this._array,
            key;
        for (var i = 0; i < a.length; ++i) {
            key = a[i];
            callback(this.get(key), key, i);
        }
    }
};

function map$12(object, f) {
    var map = new Map$5();

    // Copy constructor.
    if (object instanceof Map$5) object.each(function (value, key) {
        map.set(key, value);
    });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
            var i = -1,
                n = object.length,
                o;
            if (f == null) while (++i < n) {
                map.set(i, object[i]);
            } else while (++i < n) {
                map.set(f(o = object[i], i, object), o);
            }
        }

        // Convert object to map.
        else if (object) for (var key in object) {
                map.set(key, object[key]);
            }return map;
}

var ostring$3 = Object.prototype.toString;
var inBrowser$3 = typeof window !== 'undefined' && ostring$3.call(window) !== '[object Object]';

var logger$3 = inBrowser$3 ? window.console : require('console');

// From https://github.com/sindresorhus/object-assign
// The MIT License (MIT)
//
// Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)
var hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var propIsEnumerable$3 = Object.prototype.propertyIsEnumerable;

var assign$6 = assign$7();

function toObject$3(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative$3() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc'); // eslint-disable-line no-new-wrappers
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
		if (Object.keys(Object.assign({}, test3)).join('') !== 'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

function assign$7() {
	return shouldUseNative$3() ? Object.assign : function (target) {
		var from;
		var to = toObject$3(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty$3.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (Object.getOwnPropertySymbols) {
				symbols = Object.getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable$3.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};
}

// Simulate a WeekMap for now

function isObject$3(value) {
    return ostring$3.call(value) === '[object Object]';
}

function isString$3(value) {
    return ostring$3.call(value) === '[object String]';
}

function isFunction$3(value) {
    return ostring$3.call(value) === '[object Function]';
}

function isArray$3(value) {
    return ostring$3.call(value) === '[object Array]';
}





function isPromise$3(value) {
    return ostring$3.call(value) === '[object Promise]';
}

var pop$4 = function (obj, prop) {
    var value = void 0;
    if (isObject$3(obj)) {
        value = obj[prop];
        delete obj[prop];
        return value;
    } else if (isArray$3(obj)) {
        var index = +prop;
        if (index === index) return obj.splice(index, 1)[0];
        value = obj[prop];
        delete obj[prop];
        return value;
    }
};

var prefix$9 = "$";

function Map$6() {
    this._array = [];
}

Map$6.prototype = map$14.prototype = {
    constructor: Map$6,

    size: function size() {
        return this._array.length;
    },
    get: function get(key) {
        return this[prefix$9 + key];
    },
    set: function set(key, value) {
        if (!this.has(key)) this._array.push(key);
        this[prefix$9 + key] = value;
        return this;
    },
    has: function has(key) {
        return prefix$9 + key in this;
    },
    clear: function clear() {
        var self = this;
        this.each(function (_, property) {
            delete self[prefix$9 + property];
        });
        this._array.splice(0);
    },
    keys: function keys() {
        var entries = [];
        this.each(function (_, key) {
            entries.push(key);
        });
        return entries;
    },
    values: function values() {
        var entries = [];
        this.each(function (v) {
            entries.push(v);
        });
        return entries;
    },
    each: function each(callback) {
        var a = this._array,
            key;
        for (var i = 0; i < a.length; ++i) {
            key = a[i];
            callback(this.get(key), key, i);
        }
    }
};

function map$14(object, f) {
    var map = new Map$6();

    // Copy constructor.
    if (object instanceof Map$6) object.each(function (value, key) {
        map.set(key, value);
    });

    // Index array by numeric index or specified key function.
    else if (Array.isArray(object)) {
            var i = -1,
                n = object.length,
                o;

            if (f == null) while (++i < n) {
                map.set(i, object[i]);
            } else while (++i < n) {
                map.set(f(o = object[i], i, object), o);
            }
        }

        // Convert object to map.
        else if (object) for (var key in object) {
                map.set(key, object[key]);
            }return map;
}

var xhtml$2 = "http://www.w3.org/1999/xhtml";

var namespaces$2 = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml$2,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace$3 = function (name) {
  var prefix = name += "",
      i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces$2.hasOwnProperty(prefix) ? { space: namespaces$2[prefix], local: name } : name;
};

function creatorInherit$2(name) {
  return function () {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml$2 && document.documentElement.namespaceURI === xhtml$2 ? document.createElement(name) : document.createElementNS(uri, name);
  };
}

function creatorFixed$2(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator$2 = function (name) {
  var fullname = namespace$3(name);
  return (fullname.local ? creatorFixed$2 : creatorInherit$2)(fullname);
};

var nextId$2 = 0;

var matcher$4 = function matcher$4(selector) {
  return function () {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element$6 = document.documentElement;
  if (!element$6.matches) {
    var vendorMatches$2 = element$6.webkitMatchesSelector || element$6.msMatchesSelector || element$6.mozMatchesSelector || element$6.oMatchesSelector;
    matcher$4 = function matcher$4(selector) {
      return function () {
        return vendorMatches$2.call(this, selector);
      };
    };
  }
}

var matcher$5 = matcher$4;

var filterEvents$2 = {};

var event$2 = null;

if (typeof document !== "undefined") {
  var element$7 = document.documentElement;
  if (!("onmouseenter" in element$7)) {
    filterEvents$2 = { mouseenter: "mouseover", mouseleave: "mouseout" };
  }
}

function filterContextListener$2(listener, index, group) {
  listener = contextListener$2(listener, index, group);
  return function (event) {
    var related = event.relatedTarget;
    if (!related || related !== this && !(related.compareDocumentPosition(this) & 8)) {
      listener.call(this, event);
    }
  };
}

function contextListener$2(listener, index, group) {
  return function (event1) {
    var event0 = event$2; // Events can be reentrant (e.g., focus).
    event$2 = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event$2 = event0;
    }
  };
}

function parseTypenames$4(typenames) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name: name };
  });
}

function onRemove$2(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;else delete this.__on;
  };
}

function onAdd$2(typename, value, capture) {
  var wrap = filterEvents$2.hasOwnProperty(typename.type) ? filterContextListener$2 : contextListener$2;
  return function (d, i, group) {
    var on = this.__on,
        o,
        listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = { type: typename.type, name: typename.name, value: value, listener: listener, capture: capture };
    if (!on) this.__on = [o];else on.push(o);
  };
}

var selection_on$2 = function (typename, value, capture) {
  var typenames = parseTypenames$4(typename + ""),
      i,
      n = typenames.length,
      t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd$2 : onRemove$2;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) {
    this.each(on(typenames[i], value, capture));
  }return this;
};

var sourceEvent$2 = function () {
  var current = event$2,
      source;
  while (source = current.sourceEvent) {
    current = source;
  }return current;
};

var point$4 = function (node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
};

function none$4() {}

var selector$2 = function (selector) {
  return selector == null ? none$4 : function () {
    return this.querySelector(selector);
  };
};

var selection_select$2 = function (select) {
  if (typeof select !== "function") select = selector$2(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$4(subgroups, this._parents);
};

function empty$3() {
  return [];
}

var selectorAll$2 = function (selector) {
  return selector == null ? empty$3 : function () {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll$2 = function (select) {
  if (typeof select !== "function") select = selectorAll$2(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$4(subgroups, parents);
};

var selection_filter$2 = function (match) {
  if (typeof match !== "function") match = matcher$5(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$4(subgroups, this._parents);
};

var sparse$2 = function (update) {
  return new Array(update.length);
};

var selection_enter$2 = function () {
  return new Selection$4(this._enter || this._groups.map(sparse$2), this._parents);
};

function EnterNode$2(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode$2.prototype = {
  constructor: EnterNode$2,
  appendChild: function appendChild(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function insertBefore(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function querySelector(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function querySelectorAll(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

var constant$8 = function (x) {
  return function () {
    return x;
  };
};

var keyPrefix$2 = "$"; // Protect against keys like “__proto__”.

function bindIndex$2(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode$2(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey$2(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix$2 + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix$2 + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode$2(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue[keyValues[i]] === node) {
      exit[i] = node;
    }
  }
}

var selection_data$2 = function (value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function (d) {
      data[++j] = d;
    });
    return data;
  }

  var bind = key ? bindKey$2 : bindIndex$2,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$8(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) {}
        previous._next = next || null;
      }
    }
  }

  update = new Selection$4(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit$2 = function () {
  return new Selection$4(this._exit || this._groups.map(sparse$2), this._parents);
};

var selection_merge$2 = function (selection) {

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$4(merges, this._parents);
};

var selection_order$2 = function () {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
};

var selection_sort$2 = function (compare) {
  if (!compare) compare = ascending$4;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$4(sortgroups, this._parents).order();
};

function ascending$4(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call$2 = function () {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes$2 = function () {
  var nodes = new Array(this.size()),
      i = -1;
  this.each(function () {
    nodes[++i] = this;
  });
  return nodes;
};

var selection_node$2 = function () {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
};

var selection_size$2 = function () {
  var size = 0;
  this.each(function () {
    ++size;
  });
  return size;
};

var selection_empty$2 = function () {
  return !this.node();
};

var selection_each$2 = function (callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
};

function attrRemove$4(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$4(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$4(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$4(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$4(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);else this.setAttribute(name, v);
  };
}

function attrFunctionNS$4(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

var selection_attr$2 = function (name, value) {
  var fullname = namespace$3(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }

  return this.each((value == null ? fullname.local ? attrRemoveNS$4 : attrRemove$4 : typeof value === "function" ? fullname.local ? attrFunctionNS$4 : attrFunction$4 : fullname.local ? attrConstantNS$4 : attrConstant$4)(fullname, value));
};

var window$3 = function (node) {
    return node.ownerDocument && node.ownerDocument.defaultView || // node is a Node
    node.document && node // node is a Window
    || node.defaultView; // node is a Document
};

function styleRemove$4(name) {
  return function () {
    this.style.removeProperty(name);
  };
}

function styleConstant$4(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$4(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);else this.style.setProperty(name, v, priority);
  };
}

var selection_style$2 = function (name, value, priority) {
  var node;
  return arguments.length > 1 ? this.each((value == null ? styleRemove$4 : typeof value === "function" ? styleFunction$4 : styleConstant$4)(name, value, priority == null ? "" : priority)) : window$3(node = this.node()).getComputedStyle(node, null).getPropertyValue(name);
};

function propertyRemove$2(name) {
  return function () {
    delete this[name];
  };
}

function propertyConstant$2(name, value) {
  return function () {
    this[name] = value;
  };
}

function propertyFunction$2(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];else this[name] = v;
  };
}

var selection_property$2 = function (name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove$2 : typeof value === "function" ? propertyFunction$2 : propertyConstant$2)(name, value)) : this.node()[name];
};

function classArray$2(string) {
  return string.trim().split(/^|\s+/);
}

function classList$2(node) {
  return node.classList || new ClassList$2(node);
}

function ClassList$2(node) {
  this._node = node;
  this._names = classArray$2(node.getAttribute("class") || "");
}

ClassList$2.prototype = {
  add: function add(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function remove(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function contains(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd$2(node, names) {
  var list = classList$2(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.add(names[i]);
  }
}

function classedRemove$2(node, names) {
  var list = classList$2(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.remove(names[i]);
  }
}

function classedTrue$2(names) {
  return function () {
    classedAdd$2(this, names);
  };
}

function classedFalse$2(names) {
  return function () {
    classedRemove$2(this, names);
  };
}

function classedFunction$2(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd$2 : classedRemove$2)(this, names);
  };
}

var selection_classed$2 = function (name, value) {
  var names = classArray$2(name + "");

  if (arguments.length < 2) {
    var list = classList$2(this.node()),
        i = -1,
        n = names.length;
    while (++i < n) {
      if (!list.contains(names[i])) return false;
    }return true;
  }

  return this.each((typeof value === "function" ? classedFunction$2 : value ? classedTrue$2 : classedFalse$2)(names, value));
};

function textRemove$2() {
  this.textContent = "";
}

function textConstant$4(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction$4(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text$2 = function (value) {
  return arguments.length ? this.each(value == null ? textRemove$2 : (typeof value === "function" ? textFunction$4 : textConstant$4)(value)) : this.node().textContent;
};

function htmlRemove$2() {
  this.innerHTML = "";
}

function htmlConstant$2(value) {
  return function () {
    this.innerHTML = value;
  };
}

function htmlFunction$2(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html$2 = function (value) {
  return arguments.length ? this.each(value == null ? htmlRemove$2 : (typeof value === "function" ? htmlFunction$2 : htmlConstant$2)(value)) : this.node().innerHTML;
};

function raise$3() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

var selection_raise$2 = function () {
  return this.each(raise$3);
};

function lower$2() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

var selection_lower$2 = function () {
  return this.each(lower$2);
};

var selection_append$2 = function (name) {
  var create = typeof name === "function" ? name : creator$2(name);
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull$2() {
  return null;
}

var selection_insert$2 = function (name, before) {
  var create = typeof name === "function" ? name : creator$2(name),
      select = before == null ? constantNull$2 : typeof before === "function" ? before : selector$2(before);
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
};

function remove$3() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

var selection_remove$2 = function () {
  return this.each(remove$3);
};

var selection_datum$2 = function (value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
};

function dispatchEvent$2(node, type, params) {
  var window = window$3(node),
      event = window.CustomEvent;

  if (event) {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant$2(type, params) {
  return function () {
    return dispatchEvent$2(this, type, params);
  };
}

function dispatchFunction$2(type, params) {
  return function () {
    return dispatchEvent$2(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch$2 = function (type, params) {
  return this.each((typeof params === "function" ? dispatchFunction$2 : dispatchConstant$2)(type, params));
};

var root$4 = [null];

function Selection$4(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection$4() {
  return new Selection$4([[document.documentElement]], root$4);
}

Selection$4.prototype = selection$4.prototype = {
  constructor: Selection$4,
  select: selection_select$2,
  selectAll: selection_selectAll$2,
  filter: selection_filter$2,
  data: selection_data$2,
  enter: selection_enter$2,
  exit: selection_exit$2,
  merge: selection_merge$2,
  order: selection_order$2,
  sort: selection_sort$2,
  call: selection_call$2,
  nodes: selection_nodes$2,
  node: selection_node$2,
  size: selection_size$2,
  empty: selection_empty$2,
  each: selection_each$2,
  attr: selection_attr$2,
  style: selection_style$2,
  property: selection_property$2,
  classed: selection_classed$2,
  text: selection_text$2,
  html: selection_html$2,
  raise: selection_raise$2,
  lower: selection_lower$2,
  append: selection_append$2,
  insert: selection_insert$2,
  remove: selection_remove$2,
  datum: selection_datum$2,
  on: selection_on$2,
  dispatch: selection_dispatch$2
};

var select$4 = function (selector) {
    return typeof selector === "string" ? new Selection$4([[document.querySelector(selector)]], [document.documentElement]) : new Selection$4([[selector]], root$4);
};

var selectAll$2 = function (selector) {
    return typeof selector === "string" ? new Selection$4([document.querySelectorAll(selector)], [document.documentElement]) : new Selection$4([selector == null ? [] : selector], root$4);
};

var prefix$10 = "$";

function Map$7() {}

Map$7.prototype = map$16.prototype = {
  constructor: Map$7,
  has: function has(key) {
    return prefix$10 + key in this;
  },
  get: function get(key) {
    return this[prefix$10 + key];
  },
  set: function set(key, value) {
    this[prefix$10 + key] = value;
    return this;
  },
  remove: function remove(key) {
    var property = prefix$10 + key;
    return property in this && delete this[property];
  },
  clear: function clear() {
    for (var property in this) {
      if (property[0] === prefix$10) delete this[property];
    }
  },
  keys: function keys() {
    var keys = [];
    for (var property in this) {
      if (property[0] === prefix$10) keys.push(property.slice(1));
    }return keys;
  },
  values: function values() {
    var values = [];
    for (var property in this) {
      if (property[0] === prefix$10) values.push(this[property]);
    }return values;
  },
  entries: function entries() {
    var entries = [];
    for (var property in this) {
      if (property[0] === prefix$10) entries.push({ key: property.slice(1), value: this[property] });
    }return entries;
  },
  size: function size() {
    var size = 0;
    for (var property in this) {
      if (property[0] === prefix$10) ++size;
    }return size;
  },
  empty: function empty() {
    for (var property in this) {
      if (property[0] === prefix$10) return false;
    }return true;
  },
  each: function each(f) {
    for (var property in this) {
      if (property[0] === prefix$10) f(this[property], property.slice(1), this);
    }
  }
};

function map$16(object, f) {
  var map = new Map$7();

  // Copy constructor.
  if (object instanceof Map$7) object.each(function (value, key) {
    map.set(key, value);
  });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) {
        map.set(i, object[i]);
      } else while (++i < n) {
        map.set(f(o = object[i], i, object), o);
      }
    }

    // Convert object to map.
    else if (object) for (var key in object) {
        map.set(key, object[key]);
      }return map;
}

function createObject$3() {
  return {};
}

function setObject$3(object, key, value) {
  object[key] = value;
}

function createMap$3() {
  return map$16();
}

function setMap$3(map, key, value) {
  map.set(key, value);
}

function Set$3() {}

var proto$4 = map$16.prototype;

Set$3.prototype = set$12.prototype = {
  constructor: Set$3,
  has: proto$4.has,
  add: function add(value) {
    value += "";
    this[prefix$10 + value] = value;
    return this;
  },
  remove: proto$4.remove,
  clear: proto$4.clear,
  values: proto$4.keys,
  size: proto$4.size,
  empty: proto$4.empty,
  each: proto$4.each
};

function set$12(object, f) {
  var set = new Set$3();

  // Copy constructor.
  if (object instanceof Set$3) object.each(function (value) {
    set.add(value);
  });

  // Otherwise, assume it’s an array.
  else if (object) {
      var i = -1,
          n = object.length;
      if (f == null) while (++i < n) {
        set.add(object[i]);
      } else while (++i < n) {
        set.add(f(object[i], i, object));
      }
    }

  return set;
}

var noop$3 = { value: function value() {} };

function dispatch$4() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch$2(_);
}

function Dispatch$2(_) {
  this._ = _;
}

function parseTypenames$5(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return { type: t, name: name };
  });
}

Dispatch$2.prototype = dispatch$4.prototype = {
  constructor: Dispatch$2,
  on: function on(typename, callback) {
    var _ = this._,
        T = parseTypenames$5(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) {
        if ((t = (typename = T[i]).type) && (t = get$6(_[t], typename.name))) return t;
      }return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$14(_[t], typename.name, callback);else if (callback == null) for (t in _) {
        _[t] = set$14(_[t], typename.name, null);
      }
    }

    return this;
  },
  copy: function copy() {
    var copy = {},
        _ = this._;
    for (var t in _) {
      copy[t] = _[t].slice();
    }return new Dispatch$2(copy);
  },
  call: function call(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) {
      args[i] = arguments[i + 2];
    }if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  },
  apply: function apply(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  }
};

function get$6(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$14(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop$3, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({ name: name, value: callback });
  return type;
}

// Code originally from https://github.com/soney/jsep
// Copyright (c) 2013 Stephen Oney, http://jsep.from.so/

// This is the full set of types that any JSEP node can be.
// Store them here to save space when minified
var code$1 = {
    COMPOUND: 'Compound',
    IDENTIFIER: 'Identifier',
    MEMBER_EXP: 'MemberExpression',
    LITERAL: 'Literal',
    THIS_EXP: 'ThisExpression',
    CALL_EXP: 'CallExpression',
    UNARY_EXP: 'UnaryExpression',
    BINARY_EXP: 'BinaryExpression',
    LOGICAL_EXP: 'LogicalExpression',
    CONDITIONAL_EXP: 'ConditionalExpression',
    ARRAY_EXP: 'ArrayExpression'
};

var PERIOD_CODE$1 = 46;
var COMMA_CODE$1 = 44;
var SQUOTE_CODE$1 = 39;
var DQUOTE_CODE$1 = 34;
var OPAREN_CODE$1 = 40;
var CPAREN_CODE$1 = 41;
var OBRACK_CODE$1 = 91;
var CBRACK_CODE$1 = 93;
var QUMARK_CODE$1 = 63;
var SEMCOL_CODE$1 = 59;
var COLON_CODE$1 = 58;
var throwError$1 = function throwError$1(message, index) {
    var error = new Error(message + ' at character ' + index);
    error.index = index;
    error.description = message;
    throw error;
};
var t$1 = true;
var unary_ops$1 = { '-': t$1, '!': t$1, '~': t$1, '+': t$1 };
var binary_ops$1 = {
    '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5,
    '==': 6, '!=': 6, '===': 6, '!==': 6,
    '<': 7, '>': 7, '<=': 7, '>=': 7,
    '<<': 8, '>>': 8, '>>>': 8,
    '+': 9, '-': 9,
    '*': 10, '/': 10, '%': 10
};
var getMaxKeyLen$1 = function getMaxKeyLen$1(obj) {
    var max_len = 0,
        len;
    for (var key in obj) {
        if ((len = key.length) > max_len && obj.hasOwnProperty(key)) {
            max_len = len;
        }
    }
    return max_len;
};
var max_unop_len$1 = getMaxKeyLen$1(unary_ops$1);
var max_binop_len$1 = getMaxKeyLen$1(binary_ops$1);
var literals$1 = {
    'true': true,
    'false': false,
    'null': null
};
var this_str$1 = 'this';
var binaryPrecedence$1 = function binaryPrecedence$1(op_val) {
    return binary_ops$1[op_val] || 0;
};
var createBinaryExpression$1 = function createBinaryExpression$1(operator, left, right) {
    var type = operator === '||' || operator === '&&' ? code$1.LOGICAL_EXP : code$1.BINARY_EXP;
    return {
        type: type,
        operator: operator,
        left: left,
        right: right
    };
};
var isDecimalDigit$1 = function isDecimalDigit$1(ch) {
    return ch >= 48 && ch <= 57; // 0...9
};
var isIdentifierStart$1 = function isIdentifierStart$1(ch) {
    return ch === 36 || ch === 95 || // `$` and `_`
    ch >= 65 && ch <= 90 || // A...Z
    ch >= 97 && ch <= 122 || // a...z
    ch >= 128 && !binary_ops$1[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
};
var isIdentifierPart$1 = function isIdentifierPart$1(ch) {
    return ch === 36 || ch === 95 || // `$` and `_`
    ch >= 65 && ch <= 90 || // A...Z
    ch >= 97 && ch <= 122 || // a...z
    ch >= 48 && ch <= 57 || // 0...9
    ch >= 128 && !binary_ops$1[String.fromCharCode(ch)]; // any non-ASCII that is not an operator
};
var jsep$2 = function jsep$2(expr) {
    // `index` stores the character number we are currently at while `length` is a constant
    // All of the gobbles below will modify `index` as we move along
    var index = 0,
        charAtFunc = expr.charAt,
        charCodeAtFunc = expr.charCodeAt,
        exprI = function exprI(i) {
        return charAtFunc.call(expr, i);
    },
        exprICode = function exprICode(i) {
        return charCodeAtFunc.call(expr, i);
    },
        length = expr.length,


    // Push `index` up to the next non-space character
    gobbleSpaces = function gobbleSpaces() {
        var ch = exprICode(index);
        // space or tab
        while (ch === 32 || ch === 9) {
            ch = exprICode(++index);
        }
    },


    // The main parsing function. Much of this code is dedicated to ternary expressions
    gobbleExpression = function gobbleExpression() {
        var test = gobbleBinaryExpression(),
            consequent,
            alternate;
        gobbleSpaces();
        if (exprICode(index) === QUMARK_CODE$1) {
            // Ternary expression: test ? consequent : alternate
            index++;
            consequent = gobbleExpression();
            if (!consequent) {
                throwError$1('Expected expression', index);
            }
            gobbleSpaces();
            if (exprICode(index) === COLON_CODE$1) {
                index++;
                alternate = gobbleExpression();
                if (!alternate) {
                    throwError$1('Expected expression', index);
                }
                return {
                    type: code$1.CONDITIONAL_EXP,
                    test: test,
                    consequent: consequent,
                    alternate: alternate
                };
            } else {
                throwError$1('Expected :', index);
            }
        } else {
            return test;
        }
    },


    // Search for the operation portion of the string (e.g. `+`, `===`)
    // Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
    // and move down from 3 to 2 to 1 character until a matching binary operation is found
    // then, return that binary operation
    gobbleBinaryOp = function gobbleBinaryOp() {
        gobbleSpaces();
        var to_check = expr.substr(index, max_binop_len$1),
            tc_len = to_check.length;
        while (tc_len > 0) {
            if (binary_ops$1.hasOwnProperty(to_check)) {
                index += tc_len;
                return to_check;
            }
            to_check = to_check.substr(0, --tc_len);
        }
        return false;
    },


    // This function is responsible for gobbling an individual expression,
    // e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
    gobbleBinaryExpression = function gobbleBinaryExpression() {
        var node, biop, prec, stack, biop_info, left, right, i;

        // First, try to get the leftmost thing
        // Then, check to see if there's a binary operator operating on that leftmost thing
        left = gobbleToken();
        biop = gobbleBinaryOp();

        // If there wasn't a binary operator, just return the leftmost node
        if (!biop) {
            return left;
        }

        // Otherwise, we need to start a stack to properly place the binary operations in their
        // precedence structure
        biop_info = { value: biop, prec: binaryPrecedence$1(biop) };

        right = gobbleToken();
        if (!right) {
            throwError$1("Expected expression after " + biop, index);
        }
        stack = [left, biop_info, right];

        // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
        while (biop = gobbleBinaryOp()) {
            prec = binaryPrecedence$1(biop);

            if (prec === 0) {
                break;
            }
            biop_info = { value: biop, prec: prec };

            // Reduce: make a binary expression from the three topmost entries.
            while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
                right = stack.pop();
                biop = stack.pop().value;
                left = stack.pop();
                node = createBinaryExpression$1(biop, left, right);
                stack.push(node);
            }

            node = gobbleToken();
            if (!node) {
                throwError$1("Expected expression after " + biop, index);
            }
            stack.push(biop_info, node);
        }

        i = stack.length - 1;
        node = stack[i];
        while (i > 1) {
            node = createBinaryExpression$1(stack[i - 1].value, stack[i - 2], node);
            i -= 2;
        }
        return node;
    },


    // An individual part of a binary expression:
    // e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
    gobbleToken = function gobbleToken() {
        var ch, to_check, tc_len;

        gobbleSpaces();
        ch = exprICode(index);

        if (isDecimalDigit$1(ch) || ch === PERIOD_CODE$1) {
            // Char code 46 is a dot `.` which can start off a numeric literal
            return gobbleNumericLiteral();
        } else if (ch === SQUOTE_CODE$1 || ch === DQUOTE_CODE$1) {
            // Single or double quotes
            return gobbleStringLiteral();
        } else if (isIdentifierStart$1(ch) || ch === OPAREN_CODE$1) {
            // open parenthesis
            // `foo`, `bar.baz`
            return gobbleVariable();
        } else if (ch === OBRACK_CODE$1) {
            return gobbleArray();
        } else {
            to_check = expr.substr(index, max_unop_len$1);
            tc_len = to_check.length;
            while (tc_len > 0) {
                if (unary_ops$1.hasOwnProperty(to_check)) {
                    index += tc_len;
                    return {
                        type: code$1.UNARY_EXP,
                        operator: to_check,
                        argument: gobbleToken(),
                        prefix: true
                    };
                }
                to_check = to_check.substr(0, --tc_len);
            }

            return false;
        }
    },

    // Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
    // keep track of everything in the numeric literal and then calling `parseFloat` on that string
    gobbleNumericLiteral = function gobbleNumericLiteral() {
        var number = '',
            ch,
            chCode;
        while (isDecimalDigit$1(exprICode(index))) {
            number += exprI(index++);
        }

        if (exprICode(index) === PERIOD_CODE$1) {
            // can start with a decimal marker
            number += exprI(index++);

            while (isDecimalDigit$1(exprICode(index))) {
                number += exprI(index++);
            }
        }

        ch = exprI(index);
        if (ch === 'e' || ch === 'E') {
            // exponent marker
            number += exprI(index++);
            ch = exprI(index);
            if (ch === '+' || ch === '-') {
                // exponent sign
                number += exprI(index++);
            }
            while (isDecimalDigit$1(exprICode(index))) {
                //exponent itself
                number += exprI(index++);
            }
            if (!isDecimalDigit$1(exprICode(index - 1))) {
                throwError$1('Expected exponent (' + number + exprI(index) + ')', index);
            }
        }

        chCode = exprICode(index);
        // Check to make sure this isn't a variable name that start with a number (123abc)
        if (isIdentifierStart$1(chCode)) {
            throwError$1('Variable names cannot start with a number (' + number + exprI(index) + ')', index);
        } else if (chCode === PERIOD_CODE$1) {
            throwError$1('Unexpected period', index);
        }

        return {
            type: code$1.LITERAL,
            value: parseFloat(number),
            raw: number
        };
    },


    // Parses a string literal, staring with single or double quotes with basic support for escape codes
    // e.g. `"hello world"`, `'this is\nJSEP'`
    gobbleStringLiteral = function gobbleStringLiteral() {
        var str = '',
            quote = exprI(index++),
            closed = false,
            ch;

        while (index < length) {
            ch = exprI(index++);
            if (ch === quote) {
                closed = true;
                break;
            } else if (ch === '\\') {
                // Check for all of the common escape codes
                ch = exprI(index++);
                switch (ch) {
                    case 'n':
                        str += '\n';break;
                    case 'r':
                        str += '\r';break;
                    case 't':
                        str += '\t';break;
                    case 'b':
                        str += '\b';break;
                    case 'f':
                        str += '\f';break;
                    case 'v':
                        str += '\x0B';break;
                    default:
                        str += '\\' + ch;
                }
            } else {
                str += ch;
            }
        }

        if (!closed) {
            throwError$1('Unclosed quote after "' + str + '"', index);
        }

        return {
            type: code$1.LITERAL,
            value: str,
            raw: quote + str + quote
        };
    },


    // Gobbles only identifiers
    // e.g.: `foo`, `_value`, `$x1`
    // Also, this function checks if that identifier is a literal:
    // (e.g. `true`, `false`, `null`) or `this`
    gobbleIdentifier = function gobbleIdentifier() {
        var ch = exprICode(index),
            start = index,
            identifier;

        if (isIdentifierStart$1(ch)) {
            index++;
        } else {
            throwError$1('Unexpected ' + exprI(index), index);
        }

        while (index < length) {
            ch = exprICode(index);
            if (isIdentifierPart$1(ch)) {
                index++;
            } else {
                break;
            }
        }
        identifier = expr.slice(start, index);

        if (literals$1.hasOwnProperty(identifier)) {
            return {
                type: code$1.LITERAL,
                value: literals$1[identifier],
                raw: identifier
            };
        } else if (identifier === this_str$1) {
            return { type: code$1.THIS_EXP };
        } else {
            return {
                type: code$1.IDENTIFIER,
                name: identifier
            };
        }
    },


    // Gobbles a list of arguments within the context of a function call
    // or array literal. This function also assumes that the opening character
    // `(` or `[` has already been gobbled, and gobbles expressions and commas
    // until the terminator character `)` or `]` is encountered.
    // e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
    gobbleArguments = function gobbleArguments(termination) {
        var ch_i,
            args = [],
            node,
            closed = false;
        while (index < length) {
            gobbleSpaces();
            ch_i = exprICode(index);
            if (ch_i === termination) {
                // done parsing
                closed = true;
                index++;
                break;
            } else if (ch_i === COMMA_CODE$1) {
                // between expressions
                index++;
            } else {
                node = gobbleExpression();
                if (!node || node.type === code$1.COMPOUND) {
                    throwError$1('Expected comma', index);
                }
                args.push(node);
            }
        }
        if (!closed) {
            throwError$1('Expected ' + String.fromCharCode(termination), index);
        }
        return args;
    },


    // Gobble a non-literal variable name. This variable name may include properties
    // e.g. `foo`, `bar.baz`, `foo['bar'].baz`
    // It also gobbles function calls:
    // e.g. `Math.acos(obj.angle)`
    gobbleVariable = function gobbleVariable() {
        var ch_i, node;
        ch_i = exprICode(index);

        if (ch_i === OPAREN_CODE$1) {
            node = gobbleGroup();
        } else {
            node = gobbleIdentifier();
        }
        gobbleSpaces();
        ch_i = exprICode(index);
        while (ch_i === PERIOD_CODE$1 || ch_i === OBRACK_CODE$1 || ch_i === OPAREN_CODE$1) {
            index++;
            if (ch_i === PERIOD_CODE$1) {
                gobbleSpaces();
                node = {
                    type: code$1.MEMBER_EXP,
                    computed: false,
                    object: node,
                    property: gobbleIdentifier()
                };
            } else if (ch_i === OBRACK_CODE$1) {
                node = {
                    type: code$1.MEMBER_EXP,
                    computed: true,
                    object: node,
                    property: gobbleExpression()
                };
                gobbleSpaces();
                ch_i = exprICode(index);
                if (ch_i !== CBRACK_CODE$1) {
                    throwError$1('Unclosed [', index);
                }
                index++;
            } else if (ch_i === OPAREN_CODE$1) {
                // A function call is being made; gobble all the arguments
                node = {
                    type: code$1.CALL_EXP,
                    'arguments': gobbleArguments(CPAREN_CODE$1),
                    callee: node
                };
            }
            gobbleSpaces();
            ch_i = exprICode(index);
        }
        return node;
    },


    // Responsible for parsing a group of things within parentheses `()`
    // This function assumes that it needs to gobble the opening parenthesis
    // and then tries to gobble everything within that parenthesis, assuming
    // that the next thing it should see is the close parenthesis. If not,
    // then the expression probably doesn't have a `)`
    gobbleGroup = function gobbleGroup() {
        index++;
        var node = gobbleExpression();
        gobbleSpaces();
        if (exprICode(index) === CPAREN_CODE$1) {
            index++;
            return node;
        } else {
            throwError$1('Unclosed (', index);
        }
    },


    // Responsible for parsing Array literals `[1, 2, 3]`
    // This function assumes that it needs to gobble the opening bracket
    // and then tries to gobble the expressions as arguments.
    gobbleArray = function gobbleArray() {
        index++;
        return {
            type: code$1.ARRAY_EXP,
            elements: gobbleArguments(CBRACK_CODE$1)
        };
    },
        nodes = [],
        ch_i,
        node;

    while (index < length) {
        ch_i = exprICode(index);

        // Expressions can be separated by semicolons, commas, or just inferred without any
        // separators
        if (ch_i === SEMCOL_CODE$1 || ch_i === COMMA_CODE$1) {
            index++; // ignore separators
        } else {
            // Try to gobble each expression individually
            if (node = gobbleExpression()) {
                nodes.push(node);
                // If we weren't able to find a binary expression and are out of room, then
                // the expression passed in probably has too much
            } else if (index < length) {
                throwError$1('Unexpected "' + exprI(index) + '"', index);
            }
        }
    }

    // If there's only one expression just try returning the expression
    if (nodes.length === 1) {
        return nodes[0];
    } else {
        return {
            type: code$1.COMPOUND,
            body: nodes
        };
    }
};

/**
 * @method jsep.addUnaryOp
 * @param {string} op_name The name of the unary op to add
 * @return jsep
 */
jsep$2.addUnaryOp = function (op_name) {
    max_unop_len$1 = Math.max(op_name.length, max_unop_len$1);
    unary_ops$1[op_name] = t$1;return this;
};

/**
 * @method jsep.addBinaryOp
 * @param {string} op_name The name of the binary op to add
 * @param {number} precedence The precedence of the binary op (can be a float)
 * @return jsep
 */
jsep$2.addBinaryOp = function (op_name, precedence) {
    max_binop_len$1 = Math.max(op_name.length, max_binop_len$1);
    binary_ops$1[op_name] = precedence;
    return this;
};

/**
 * @method jsep.addLiteral
 * @param {string} literal_name The name of the literal to add
 * @param {*} literal_value The value of the literal
 * @return jsep
 */
jsep$2.addLiteral = function (literal_name, literal_value) {
    literals$1[literal_name] = literal_value;
    return this;
};

/**
 * @method jsep.removeUnaryOp
 * @param {string} op_name The name of the unary op to remove
 * @return jsep
 */
jsep$2.removeUnaryOp = function (op_name) {
    delete unary_ops$1[op_name];
    if (op_name.length === max_unop_len$1) {
        max_unop_len$1 = getMaxKeyLen$1(unary_ops$1);
    }
    return this;
};

/**
 * @method jsep.removeBinaryOp
 * @param {string} op_name The name of the binary op to remove
 * @return jsep
 */
jsep$2.removeBinaryOp = function (op_name) {
    delete binary_ops$1[op_name];
    if (op_name.length === max_binop_len$1) {
        max_binop_len$1 = getMaxKeyLen$1(binary_ops$1);
    }
    return this;
};

/**
 * @method jsep.removeLiteral
 * @param {string} literal_name The name of the literal to remove
 * @return jsep
 */
jsep$2.removeLiteral = function (literal_name) {
    delete literals$1[literal_name];
    return this;
};

function evaluate$1(self, expr) {

    switch (expr.type) {
        case code$1.IDENTIFIER:
            return self[expr.name];
        case code$1.LITERAL:
            return expr.value;
        case code$1.ARRAY_EXP:
            return expr.elements.map(function (elem) {
                return evaluate$1(self, elem);
            });
        case code$1.LOGICAL_EXP:
        case code$1.BINARY_EXP:
            return binaryExp$1(expr.operator, evaluate$1(self, expr.left), evaluate$1(self, expr.right));
        case code$1.CALL_EXP:
            return callExpression$1(self, expr.callee, expr.arguments);
        case code$1.MEMBER_EXP:
            return evaluate$1(evaluate$1(self, expr.object), expr.property);
        case code$1.CONDITIONAL_EXP:
            return evaluate$1(self, expr.test) ? evaluate$1(self, expr.consequent) : evaluate$1(self, expr.alternate);
        case code$1.UNARY_EXP:
            return unaryExp$1(expr.operator, evaluate$1(self, expr.argument));
    }
}

function identifiers$2(expr, all) {
    if (arguments.length === 1) all = set$12();
    switch (expr.type) {
        case code$1.IDENTIFIER:
            all.add(expr.name);break;
        case code$1.ARRAY_EXP:
            expr.elements.forEach(function (elem) {
                identifiers$2(elem, all);
            });break;
        case code$1.BINARY_EXP:
            identifiers$2(expr.left, all);identifiers$2(expr.right, all);break;
        case code$1.CALL_EXP:
            identifiers$2(expr.arguments, all);break;
        case code$1.MEMBER_EXP:
            identifiers$2(expr.object, all);break;
        case code$1.CONDITIONAL_EXP:
            identifiers$2(expr.test, all);identifiers$2(expr.consequent, all);evaluate$1(expr.alternate, all);break;
    }
    return all;
}

function callExpression$1(self, callee, args) {
    var func;

    args = args.map(function (arg) {
        return evaluate$1(self, arg);
    });

    if (callee.type !== code$1.IDENTIFIER) {
        self = evaluate$1(self, callee.object);
        callee = callee.property;
    }

    func = self[callee.name];
    if (!func) throw new EvalError('callable "' + callee.name + '" not found in context');
    return func.apply(self, args);
}

function unaryExp$1(op, arg) {
    if (!unaryFunctions$1[op]) unaryFunctions$1[op] = new Function("arg", 'return ' + op + ' arg');
    return unaryFunctions$1[op](arg);
}

function binaryExp$1(op, a, b) {
    if (!binaryFunctions$1[op]) binaryFunctions$1[op] = new Function("a", "b", 'return a ' + op + ' b');
    return binaryFunctions$1[op](a, b);
}

var unaryFunctions$1 = {};
var binaryFunctions$1 = {};

var viewProviders = {
    logger: logger$3,
    fetch: fetch$1()
};

function fetch$1() {
    if (inBrowser$3) return window.fetch;
}

var prefix$11 = '[d3-view]';

var warn$2 = function (msg) {
    viewProviders.logger.warn(prefix$11 + ' ' + msg);
};

// tiny javascript expression parser
var proto$5 = {

    eval: function _eval(model) {
        return evaluate$1(model, this.parsed);
    },

    safeEval: function safeEval(model) {
        try {
            return evaluate$1(model, this.parsed);
        } catch (msg) {
            warn$2('Could not evaluate <<' + this.expr + '>> expression: ' + msg);
        }
    },

    identifiers: function identifiers() {
        return identifiers$2(this.parsed).values();
    }
};

function Expression$1(expr) {
    this.codes = code$1;
    this.expr = expr;
    this.parsed = jsep$2(expr);
}

Expression$1.prototype = proto$5;

var viewExpression$1 = function (expr) {
    try {
        return new Expression$1(expr);
    } catch (msg) {
        warn$2('Could not parse <<' + expr + '>> expression: ' + msg);
    }
};

var UID$1 = 0;
var prefix$12 = 'd3v';

// Add a unique identifier to an object
var viewUid = function (o) {
    var uid = prefix$12 + ++UID$1;

    if (arguments.length) {
        Object.defineProperty(o, 'uid', {
            get: function get() {
                return uid;
            }
        });

        return o;
    } else return uid;
};

var sel$1 = function (o) {

    Object.defineProperty(o, 'sel', {
        get: function get() {
            return select$4(this.el);
        }
    });

    return o;
};

//
// Directive Prototype
//
// Directives are special attributes with the d3- prefix.
// Directive attribute values are expected to be binding expressions.
// A directive’s job is to reactively apply special behavior to the DOM
// when the value of its expression changes.
//
// A directive can implement one or more of the directive methods:
//
//  * create
//  * mount
//  * refresh
//  * destroy
//
var prototype$1 = {
    priority: 1,

    // hooks
    create: function create(expression) {
        return expression;
    },

    mount: function mount(model) {
        return model;
    },

    refresh: function refresh() {},

    destroy: function destroy() {},

    removeAttribute: function removeAttribute() {
        this.el.removeAttribute(this.name);
    },

    // Execute directive
    execute: function execute(model) {
        var _this = this;

        // No binding expression - nothing to do
        if (!this.expression) return;
        this.removeAttribute();

        model = this.mount(model);
        // No model returned - abort execution
        if (!model) return;

        var dir = this,
            sel = this.sel,
            refresh = function refresh() {
            try {
                dir.refresh(model, dir.expression.eval(model));
            } catch (msg) {
                warn$2('Error while refreshing "' + dir.name + '" directive: ' + msg);
            }
        };

        // Bind expression identifiers with model
        this.identifiers = this.expression.identifiers().map(function (id) {
            var event = id + '.' + dir.uid;
            model.$on(event, refresh);
            return id;
        });

        sel.on('remove.' + dir.uid, function () {
            _this.identifiers.forEach(function (id) {
                model.$off(id + '.' + dir.uid);
            });
            dir.destroy(model);
        });

        refresh();
    }
};

// Directive constructor
var createDirective$1 = function (obj) {

    function Directive(el, attr, arg) {
        this.el = el;
        this.name = attr.name;
        this.arg = arg;
        var expr = sel$1(viewUid(this)).create(attr.value);
        if (expr) this.expression = viewExpression$1(expr);
    }

    Directive.prototype = assign$6({}, prototype$1, obj);

    function directive(el, attr, arg) {
        return new Directive(el, attr, arg);
    }

    directive.prototype = Directive.prototype;
    return directive;
};

selection$4.prototype.model = model$4;

//
// Initialise a model
function asModel$1(model, initials) {
    var events = map$16(),
        children = [],
        Child = null;

    // event handler for any change in the model
    events.set('', dispatch$4('change'));

    Object.defineProperties(viewUid(model), {
        $events: {
            get: function get() {
                return events;
            }
        },
        $children: {
            get: function get() {
                return children;
            }
        }
    });
    model.$child = $child;
    model.$update(initials);

    function $child(o) {
        if (Child === null) Child = createChildConstructor$1(model);
        return new Child(o);
    }
}

function createChildConstructor$1(model) {

    function Child(initials) {
        asModel$1(this, initials);
        model.$children.push(this);
        Object.defineProperty(this, 'parent', {
            get: function get() {
                return model;
            }
        });
    }

    Child.prototype = model;
    return Child;
}



function model$4(value) {
    return arguments.length ? this.property("__model__", value) : this.node().__model__;
}

//  $get method for a Model
//
//  attribute is a dotted string
var $get$1 = function (attribute) {

    var bits = attribute.split('.'),
        key = bits.splice(0, 1),
        model = getModel$1(this, key);

    if (!(key in model)) return;

    var value = model[key];

    while (value && bits.length) {
        value = value[bits.splice(0, 1)];
    }return value;
};

function getModel$1(model, key) {

    while (!(key in model) && model.$parent) {
        model = model.$parent;
    }return model;
}

var frame$2 = 0;
var timeout$4 = 0;
var interval$4 = 0;
var pokeDelay$2 = 1000;
var taskHead$2;
var taskTail$2;
var clockLast$2 = 0;
var clockNow$2 = 0;
var clockSkew$2 = 0;
var clock$2 = (typeof performance === "undefined" ? "undefined" : _typeof(performance)) === "object" && performance.now ? performance : Date;
var setFrame$2 = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function (f) {
  setTimeout(f, 17);
};

function now$2() {
  return clockNow$2 || (setFrame$2(clearNow$2), clockNow$2 = clock$2.now() + clockSkew$2);
}

function clearNow$2() {
  clockNow$2 = 0;
}

function Timer$2() {
  this._call = this._time = this._next = null;
}

Timer$2.prototype = timer$2.prototype = {
  constructor: Timer$2,
  restart: function restart(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now$2() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail$2 !== this) {
      if (taskTail$2) taskTail$2._next = this;else taskHead$2 = this;
      taskTail$2 = this;
    }
    this._call = callback;
    this._time = time;
    sleep$2();
  },
  stop: function stop() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep$2();
    }
  }
};

function timer$2(callback, delay, time) {
  var t = new Timer$2();
  t.restart(callback, delay, time);
  return t;
}

function timerFlush$2() {
  now$2(); // Get the current time, if not already set.
  ++frame$2; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead$2,
      e;
  while (t) {
    if ((e = clockNow$2 - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame$2;
}

function wake$2() {
  clockNow$2 = (clockLast$2 = clock$2.now()) + clockSkew$2;
  frame$2 = timeout$4 = 0;
  try {
    timerFlush$2();
  } finally {
    frame$2 = 0;
    nap$2();
    clockNow$2 = 0;
  }
}

function poke$2() {
  var now = clock$2.now(),
      delay = now - clockLast$2;
  if (delay > pokeDelay$2) clockSkew$2 -= delay, clockLast$2 = now;
}

function nap$2() {
  var t0,
      t1 = taskHead$2,
      t2,
      time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead$2 = t2;
    }
  }
  taskTail$2 = t0;
  sleep$2(time);
}

function sleep$2(time) {
  if (frame$2) return; // Soonest alarm already set, or will be.
  if (timeout$4) timeout$4 = clearTimeout(timeout$4);
  var delay = time - clockNow$2;
  if (delay > 24) {
    if (time < Infinity) timeout$4 = setTimeout(wake$2, delay);
    if (interval$4) interval$4 = clearInterval(interval$4);
  } else {
    if (!interval$4) interval$4 = setInterval(poke$2, pokeDelay$2);
    frame$2 = 1, setFrame$2(wake$2);
  }
}

var timeout$5 = function (callback, delay, time) {
  var t = new Timer$2();
  delay = delay == null ? 0 : +delay;
  t.restart(function (elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
};

var viewDebounce = function (callback, delay) {
    var queued = false;
    return function () {
        if (!queued) {
            var args = Array.prototype.slice.call(arguments);
            queued = true;
            timeout$5(function () {
                queued = false;
                callback.apply(undefined, args);
            }, delay);
        }
    };
};

//  $set a reactive attribute for a Model
//
//  Set the value of a dotted attribute in the model or its parents
//  If the attribute is not already reactive make it as such.
//
var $set$1 = function (key, value) {
    // property not reactive - make it as such
    if (!this.$events.get(key)) reactive$1(this, key, value);else this[key] = value;
};

function reactive$1(model, key, value) {
    var events = model.$events,
        oldValue,
        lazy;

    events.set(key, dispatch$4('change'));

    Object.defineProperty(model, key, property());

    // the event is fired at the next tick of the event loop
    // Cannot use the () => notation here otherwise arguments are incorrect
    var trigger = viewDebounce(function () {
        oldValue = arguments[0];
        events.get(key).call('change', model, value, oldValue);
        // trigger model change event only when not a lazy property
        if (!lazy) events.get('').call('change', model, key);
    });

    // Trigger the callback once for initialization
    trigger();

    function update(newValue) {
        if (lazy) newValue = lazy.get.call(model);
        if (newValue === value) return;
        // trigger lazy callbacks
        trigger(value);
        // update the value
        value = newValue;
    }

    function property() {
        var prop = {
            get: function get() {
                return value;
            }
        };

        if (isFunction$3(value)) value = { get: value };

        // calculated attribute
        if (isObject$3(value) && isFunction$3(value.get)) {
            lazy = value;
            value = lazy.get.call(model);

            if (lazy.reactOn) lazy.reactOn.forEach(function (name) {
                model.$on(name + '.' + key, update);
            });else model.$on('.' + key, update);

            if (isFunction$3(lazy.set)) prop.set = lazy.set;
        } else prop.set = update;

        return prop;
    }
}

// Add change callback to a model reactive attribute
var $on$1 = function (name, callback) {

    // When no name is provided, whait for changes on this model - no its parents
    if (arguments.length === 1 && isFunction$3(name)) {
        callback = name;
        name = '';
    }

    var bits = name.split('.'),
        key = bits[0],
        event = getEvent$1(this, key);

    if (!event) return warn$2('Cannot bind to "' + key + '" - no such reactive property');

    // event from a parent model, add model uid to distinguish it from other child callbacks
    if (!this.$events.get(name)) bits.push(this.uid);

    bits[0] = 'change';
    return event.on(bits.join('.'), callback);
};

function getEvent$1(model, name) {
    var event = model.$events.get(name);
    if (!event && model.parent) return getEvent$1(model.parent, name);
    return event;
}

// Update a model with reactive model data
var $update$1 = function (data, replace) {
    if (data) {
        replace = arguments.length === 2 ? replace : true;
        for (var key in data) {
            if (replace || this[key] === undefined) {
                if (key.substring(0, 1) === '$') {
                    if (this.constructor.prototype[key]) warn$2('Cannot set attribute method ' + key + ', it is protected');else this[key] = data[key];
                } else this.$set(key, data[key]);
            }
        }
    }
    return this;
};

function setbase$1(key, value) {
    if (!this.$events.has(key) && this.$parent) return setbase$1.call(this.$parent, key, value);
    this.$set(key, value);
}

// remove event handlers
var $off$1 = function (attr) {
    if (attr === undefined) this.$events.each(function (event) {
        event.on('change', null);
    });else {
        var event = this.$events.get(attr);
        if (event) event.on('change', null);
    }

    this.$children.forEach(function (child) {
        child.$off(attr);
    });
};

//
//  Model class
//
//  The model is at the core of d3-view reactive data component
function Model$1(initials) {
    asModel$1(this, initials);
}

function model$3(initials) {
    return new Model$1(initials);
}

model$3.prototype = Model$1.prototype;

// Public API methods
Model$1.prototype.$on = $on$1;
Model$1.prototype.$update = $update$1;
Model$1.prototype.$get = $get$1;
Model$1.prototype.$set = $set$1;
Model$1.prototype.$new = $new$1;
Model$1.prototype.$setbase = setbase$1;
Model$1.prototype.$off = $off$1;

function $new$1(initials) {

    var parent = this,
        child = model$3(initials);

    parent.$children.push(child);

    Object.defineProperty(child, 'parent', {
        get: function get() {
            return parent;
        }
    });

    return child;
}

// Model factory function
var createModel$1 = function (directives, defaults, parent) {
    // model directive
    var dir = directives.pop('model');

    // For loop directive not permitted in the root view
    if (directives.get('for') && !parent) {
        warn$2('Cannot have a "d3-for" directive in the root view element');
        directives.pop('for');
    }

    if (!parent) {
        if (dir) warn$2('Cannot have a d3-model directive in the root element');
        return model$3(defaults);
    }

    // Execute model directive
    if (dir) {
        dir.execute(parent);
        var model = dir.sel.model();
        if (model) model.$update(defaults, false);
        return model;
    } else if (defaults) return parent.$child(defaults);else return parent;
};

// No value, it has its own directive
var attributes$1 = ['name', 'class', 'disabled', 'readonly', 'required'];

selection$4.prototype.directives = directives$2;

function directives$2(value) {
    return arguments.length ? this.property("__directives__", value) : this.node().__directives__;
}

var getdirs$1 = function (element, directives) {
    var sel = select$4(element),
        dirs = sel.directives();
    if (dirs) return dirs;
    dirs = new Directives$1();
    sel.directives(dirs);

    if (!directives) return dirs;

    for (var i = 0; i < element.attributes.length; ++i) {
        var attr = element.attributes[i],
            bits = attr.name.split('-'),
            arg = bits[2],
            dirName = bits[0] === 'd3' ? bits[1] : null;

        if (dirName) {
            if (!arg && attributes$1.indexOf(dirName) > -1) {
                arg = dirName;
                dirName = 'attr';
            }
            var directive = directives.get(dirName);
            if (directive) dirs.add(dirName, directive(element, attr, arg));else warn$2(element.tagName + ' cannot find directive "' + dirName + '". Did you forget to register it?');
        }
        dirs.attrs[attr.name] = attr.value;
    }
    return dirs.sorted();
};

// Directives container
function Directives$1() {
    this.attrs = {};
    this._dirs = {};
    this._all = [];
}

Directives$1.prototype = {
    size: function size() {
        return this._all.length;
    },

    get: function get(name) {
        return this._dirs[name];
    },

    pop: function pop(name) {
        var dir = this._dirs[name];
        if (dir) {
            delete this._dirs[name];
            dir.removeAttribute();
            var index = this._all.indexOf(dir);
            if (index > -1) this._all.splice(index, 1);
        }
        return dir;
    },

    add: function add(name, dir) {
        this._dirs[name] = dir;
        this._all.push(dir);
    },

    sorted: function sorted() {
        this._all.sort(function (d) {
            return -d.priority;
        });
        return this;
    },

    forEach: function forEach(callback) {
        this._all.forEach(callback);
    }
};

// Mount a model into an element
function mount$2(model, el) {
    var sel = select$4(el),
        directives = sel.directives();

    // directives not available, this is a mount from
    // a directive/loop and requires a new model
    if (!directives) {
        directives = getdirs$1(el, model.$vm ? model.$vm.directives : null);
        model = createModel$1(directives, null, model);
    }

    // Loop directive is special
    var loop = directives.pop('for');

    if (loop) {
        loop.execute(model);
        return true; // Important - skip mounting a component
    } else {
        if (!sel.model()) sel.model(model);
        mountChildren$1(sel, directives);
    }
}

function mountChildren$1(sel, directives) {
    var model = sel.model(),
        vm = model.$vm;

    sel.selectAll(function () {
        return this.children;
    }).each(function () {
        var component = vm ? vm.components.get(this.tagName.toLowerCase()) : null;

        if (component) component({ parent: vm }).mount(this);else {
            // vanilla element
            mount$2(model, this);
            var child = select$4(this);
            // cleanup model if not needed
            if (child.model() === model) child.model(null);
        }
    });

    // Execute directives
    if (directives.size()) {
        directives.forEach(function (d) {
            d.execute(model);
        });
    } else
        // no directives - remove property
        sel.directives(null);
}

//
//  d3-model directive
//  ===================
//
//  Create a new model on the element based on data from parent models
//  This is a special directive and the first to be mounted
var model$5 = {

    mount: function mount(model) {
        var expr = this.expression;
        if (expr.parsed.type !== expr.codes.IDENTIFIER) return warn$2('d3-model expression support identifiers only, got "' + expr.parsed.type + '": ' + this.expression);
        var newModel = model.$child(expr.eval(model));
        this.sel.model(newModel);
        model.$setbase(this.expression.expr, newModel);
    }

};

var properties$1 = ['disabled', 'readonly', 'required'];

//
//  d3-attr-<attr> directive
//  ==============================
//
//  Create a one-way binding between a model and a HTML element attribute
//
var attr$1 = {

    create: function create(expression) {
        if (!this.arg) return warn$2('Cannot bind to empty attribute. Specify :<attr-name>');
        return expression;
    },

    refresh: function refresh(model, value) {
        if (this.arg === 'class') return this.refreshClass(value);
        if (isArray$3(value)) return warn$2('Cannot apply array to attribute ' + this.arg);
        if (properties$1.indexOf(this.arg) > -1) this.sel.property(this.arg, value || null);else this.sel.attr(this.arg, value);
    },

    refreshClass: function refreshClass(value) {
        var sel = this.sel;

        if (!isArray$3(value)) value = [value];

        if (this.oldValue) this.oldValue.forEach(function (entry) {
            if (entry) sel.classed(entry, false);
        });

        this.oldValue = value.map(function (entry) {
            var exist = true;
            if (isArray$3(entry)) {
                exist = entry[1];
                entry = entry[0];
            }
            if (entry) sel.classed(entry, exist);
            return entry;
        });
    }

};

//
//  d3-html
//  =============
//  attach html or text to the innerHtml property
//
//  Usage:
//      <div id="foo" d3-html="output"></div>
var html$2 = {

    refresh: function refresh(model, html) {
        if (isString$3(html)) this.sel.html(html);
    }
};

var base$1 = {

    on: function on(model, attrName) {
        var refresh = refreshFunction$1(this, model, attrName);

        // DOM => model binding
        select$4(this.el).on('input', refresh).on('change', refresh);
    }
};

function createTag$1(proto) {

    function Tag(el) {
        this.el = el;
    }

    Tag.prototype = assign$6({}, base$1, proto);

    function tag(el) {
        var t = new Tag(el);

        Object.defineProperty(t, 'value', {
            get: function get() {
                return select$4(t.el).property('value');
            },
            set: function set(v) {
                select$4(t.el).property('value', v);
            }
        });

        return t;
    }

    tag.prototype = Tag.prototype;

    return tag;
}

function refreshFunction$1(dom, model, attrName) {

    return viewDebounce(function () {
        model.$set(attrName, dom.value);
    });
}

var input$2 = createTag$1();

var textarea$2 = createTag$1();

var tags$1 = {
    input: input$2,
    textarea: textarea$2
};

//
//  d3-value directive
//  ===================
//
//  Two-way data binding for HTML elements supporting the value property
var value$3 = {

    create: function create(expression) {
        var type = this.sel.attr('type'),
            tag = this.el.tagName.toLowerCase(),
            Tag = tags$1[type] || tags$1[tag];

        if (!Tag) return warn$2('Cannot apply d3-value directive to ' + tag);
        this.tag = new Tag(this.el);
        return expression;
    },

    mount: function mount(model) {
        var expr = this.expression;
        // TODO: relax this constraint
        if (expr.parsed.type !== expr.codes.IDENTIFIER) return warn$2('d3-value expression support identifiers only, got "' + expr.parsed.type + '": ' + this.expression);
        var attrName = this.expression.expr;
        //
        // Create the model reactive attribute
        model.$set(attrName, this.tag.value);

        this.tag.on(model, attrName);
        return model;
    },

    refresh: function refresh(model, value) {
        this.tag.value = value;
    },

    destroy: function destroy() {
        this.tag.off();
    }
};

//
//  d3-show
//  =============
//  Show or hide an element
//
var show$1 = {

    mount: function mount(model) {
        this.display = this.sel.style('display');
        if (!this.display || this.display === 'none') this.display = 'block';
        return model;
    },

    refresh: function refresh(model, value) {
        if (value) this.sel.style('display', this.display);else this.sel.style('display', 'none');
    }
};

//
//  d3-on directive
var on$2 = {

    mount: function mount(model) {
        var event = this.arg || 'click',
            expr = this.expression;

        // DOM event => model binding
        this.sel.on(event + '.' + this.uid, function () {
            expr.eval(model);
        });
    }
};

var emptyOn$2 = dispatch$4("start", "end", "interrupt");
var emptyTween$2 = [];

var CREATED$2 = 0;
var SCHEDULED$2 = 1;
var STARTING$2 = 2;
var STARTED$2 = 3;
var RUNNING$2 = 4;
var ENDING$2 = 5;
var ENDED$2 = 6;

var schedule$2 = function (node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};else if (id in schedules) return;
  create$3(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn$2,
    tween: emptyTween$2,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED$2
  });
};

function init$3(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED$2) throw new Error("too late");
  return schedule;
}

function set$15(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING$2) throw new Error("too late");
  return schedule;
}

function get$7(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
  return schedule;
}

function create$3(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer$2(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED$2;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED$2) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED$2) return timeout$5(start);

      // Interrupt the active transition, if any.
      // Dispatch the interrupt event.
      if (o.state === RUNNING$2) {
        o.state = ENDED$2;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions. No interrupt event is dispatched
      // because the cancelled transitions never started. Note that this also
      // removes this transition from the pending list!
      else if (+i < id) {
          o.state = ENDED$2;
          o.timer.stop();
          delete schedules[i];
        }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout$5(function () {
      if (self.state === STARTED$2) {
        self.state = RUNNING$2;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING$2;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING$2) return; // interrupted
    self.state = STARTED$2;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING$2, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(null, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING$2) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED$2;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) {
      return;
    } // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

var interrupt$2 = function (node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) {
      empty = false;continue;
    }
    active = schedule.state > STARTING$2 && schedule.state < ENDING$2;
    schedule.state = ENDED$2;
    schedule.timer.stop();
    if (active) schedule.on.call("interrupt", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
};

var selection_interrupt$2 = function (name) {
  return this.each(function () {
    interrupt$2(this, name);
  });
};

var define$2 = function (constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend$2(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) {
    prototype[key] = definition[key];
  }return prototype;
}

function Color$2() {}

var _darker$2 = 0.7;
var _brighter$2 = 1 / _darker$2;

var reI$2 = "\\s*([+-]?\\d+)\\s*";
var reN$2 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP$2 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3$2 = /^#([0-9a-f]{3})$/;
var reHex6$2 = /^#([0-9a-f]{6})$/;
var reRgbInteger$2 = new RegExp("^rgb\\(" + [reI$2, reI$2, reI$2] + "\\)$");
var reRgbPercent$2 = new RegExp("^rgb\\(" + [reP$2, reP$2, reP$2] + "\\)$");
var reRgbaInteger$2 = new RegExp("^rgba\\(" + [reI$2, reI$2, reI$2, reN$2] + "\\)$");
var reRgbaPercent$2 = new RegExp("^rgba\\(" + [reP$2, reP$2, reP$2, reN$2] + "\\)$");
var reHslPercent$2 = new RegExp("^hsl\\(" + [reN$2, reP$2, reP$2] + "\\)$");
var reHslaPercent$2 = new RegExp("^hsla\\(" + [reN$2, reP$2, reP$2, reN$2] + "\\)$");

var named$2 = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define$2(Color$2, color$2, {
  displayable: function displayable() {
    return this.rgb().displayable();
  },
  toString: function toString() {
    return this.rgb() + "";
  }
});

function color$2(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3$2.exec(format)) ? (m = parseInt(m[1], 16), new Rgb$2(m >> 8 & 0xf | m >> 4 & 0x0f0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
  ) : (m = reHex6$2.exec(format)) ? rgbn$2(parseInt(m[1], 16)) // #ff0000
  : (m = reRgbInteger$2.exec(format)) ? new Rgb$2(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
  : (m = reRgbPercent$2.exec(format)) ? new Rgb$2(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
  : (m = reRgbaInteger$2.exec(format)) ? rgba$2(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
  : (m = reRgbaPercent$2.exec(format)) ? rgba$2(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
  : (m = reHslPercent$2.exec(format)) ? hsla$2(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
  : (m = reHslaPercent$2.exec(format)) ? hsla$2(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
  : named$2.hasOwnProperty(format) ? rgbn$2(named$2[format]) : format === "transparent" ? new Rgb$2(NaN, NaN, NaN, 0) : null;
}

function rgbn$2(n) {
  return new Rgb$2(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba$2(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb$2(r, g, b, a);
}

function rgbConvert$2(o) {
  if (!(o instanceof Color$2)) o = color$2(o);
  if (!o) return new Rgb$2();
  o = o.rgb();
  return new Rgb$2(o.r, o.g, o.b, o.opacity);
}

function rgb$3(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert$2(r) : new Rgb$2(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb$2(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define$2(Rgb$2, rgb$3, extend$2(Color$2, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$2 : Math.pow(_brighter$2, k);
    return new Rgb$2(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$2 : Math.pow(_darker$2, k);
    return new Rgb$2(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function rgb$3() {
    return this;
  },
  displayable: function displayable() {
    return 0 <= this.r && this.r <= 255 && 0 <= this.g && this.g <= 255 && 0 <= this.b && this.b <= 255 && 0 <= this.opacity && this.opacity <= 1;
  },
  toString: function toString() {
    var a = this.opacity;a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(") + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.b) || 0)) + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla$2(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
  return new Hsl$2(h, s, l, a);
}

function hslConvert$2(o) {
  if (o instanceof Hsl$2) return new Hsl$2(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color$2)) o = color$2(o);
  if (!o) return new Hsl$2();
  if (o instanceof Hsl$2) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl$2(h, s, l, o.opacity);
}

function hsl$6(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert$2(h) : new Hsl$2(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl$2(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$2(Hsl$2, hsl$6, extend$2(Color$2, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$2 : Math.pow(_brighter$2, k);
    return new Hsl$2(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$2 : Math.pow(_darker$2, k);
    return new Hsl$2(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb$3() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb$2(hsl2rgb$2(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb$2(h, m1, m2), hsl2rgb$2(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
  },
  displayable: function displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb$2(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}

var deg2rad$2 = Math.PI / 180;
var rad2deg$2 = 180 / Math.PI;

var Kn$2 = 18;
var Xn$2 = 0.950470;
var Yn$2 = 1;
var Zn$2 = 1.088830;
var t0$3 = 4 / 29;
var t1$3 = 6 / 29;
var t2$2 = 3 * t1$3 * t1$3;
var t3$2 = t1$3 * t1$3 * t1$3;

function labConvert$2(o) {
  if (o instanceof Lab$2) return new Lab$2(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl$2) {
    var h = o.h * deg2rad$2;
    return new Lab$2(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb$2)) o = rgbConvert$2(o);
  var b = rgb2xyz$2(o.r),
      a = rgb2xyz$2(o.g),
      l = rgb2xyz$2(o.b),
      x = xyz2lab$2((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn$2),
      y = xyz2lab$2((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn$2),
      z = xyz2lab$2((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn$2);
  return new Lab$2(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab$4(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert$2(l) : new Lab$2(l, a, b, opacity == null ? 1 : opacity);
}

function Lab$2(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define$2(Lab$2, lab$4, extend$2(Color$2, {
  brighter: function brighter(k) {
    return new Lab$2(this.l + Kn$2 * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function darker(k) {
    return new Lab$2(this.l - Kn$2 * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function rgb() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn$2 * lab2xyz$2(y);
    x = Xn$2 * lab2xyz$2(x);
    z = Zn$2 * lab2xyz$2(z);
    return new Rgb$2(xyz2rgb$2(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
    xyz2rgb$2(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z), xyz2rgb$2(0.0556434 * x - 0.2040259 * y + 1.0572252 * z), this.opacity);
  }
}));

function xyz2lab$2(t) {
  return t > t3$2 ? Math.pow(t, 1 / 3) : t / t2$2 + t0$3;
}

function lab2xyz$2(t) {
  return t > t1$3 ? t * t * t : t2$2 * (t - t0$3);
}

function xyz2rgb$2(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz$2(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert$2(o) {
  if (o instanceof Hcl$2) return new Hcl$2(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab$2)) o = labConvert$2(o);
  var h = Math.atan2(o.b, o.a) * rad2deg$2;
  return new Hcl$2(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl$6(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert$2(h) : new Hcl$2(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl$2(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define$2(Hcl$2, hcl$6, extend$2(Color$2, {
  brighter: function brighter(k) {
    return new Hcl$2(this.h, this.c, this.l + Kn$2 * (k == null ? 1 : k), this.opacity);
  },
  darker: function darker(k) {
    return new Hcl$2(this.h, this.c, this.l - Kn$2 * (k == null ? 1 : k), this.opacity);
  },
  rgb: function rgb() {
    return labConvert$2(this).rgb();
  }
}));

var A$2 = -0.14861;
var B$2 = +1.78277;
var C$2 = -0.29227;
var D$2 = -0.90649;
var E$2 = +1.97294;
var ED$2 = E$2 * D$2;
var EB$2 = E$2 * B$2;
var BC_DA$2 = B$2 * C$2 - D$2 * A$2;

function cubehelixConvert$2(o) {
  if (o instanceof Cubehelix$2) return new Cubehelix$2(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb$2)) o = rgbConvert$2(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA$2 * b + ED$2 * r - EB$2 * g) / (BC_DA$2 + ED$2 - EB$2),
      bl = b - l,
      k = (E$2 * (g - l) - C$2 * bl) / D$2,
      s = Math.sqrt(k * k + bl * bl) / (E$2 * l * (1 - l)),
      // NaN if l=0 or l=1
  h = s ? Math.atan2(k, bl) * rad2deg$2 - 120 : NaN;
  return new Cubehelix$2(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix$7(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert$2(h) : new Cubehelix$2(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix$2(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$2(Cubehelix$2, cubehelix$7, extend$2(Color$2, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$2 : Math.pow(_brighter$2, k);
    return new Cubehelix$2(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$2 : Math.pow(_darker$2, k);
    return new Cubehelix$2(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad$2,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb$2(255 * (l + a * (A$2 * cosh + B$2 * sinh)), 255 * (l + a * (C$2 * cosh + D$2 * sinh)), 255 * (l + a * (E$2 * cosh)), this.opacity);
  }
}));

function basis$5(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1,
      t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}

var constant$9 = function (x) {
  return function () {
    return x;
  };
};

function linear$5(a, d) {
  return function (t) {
    return a + t * d;
  };
}

function exponential$3(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
    return Math.pow(a + t * b, y);
  };
}

function hue$2(a, b) {
  var d = b - a;
  return d ? linear$5(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$9(isNaN(a) ? b : a);
}

function gamma$2(y) {
  return (y = +y) === 1 ? nogamma$2 : function (a, b) {
    return b - a ? exponential$3(a, b, y) : constant$9(isNaN(a) ? b : a);
  };
}

function nogamma$2(a, b) {
  var d = b - a;
  return d ? linear$5(a, d) : constant$9(isNaN(a) ? b : a);
}

var interpolateRgb$2 = (function rgbGamma(y) {
  var color$$1 = gamma$2(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb$3(start)).r, (end = rgb$3(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = color$$1(start.opacity, end.opacity);
    return function (t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

var array$4 = function (a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) {
    x[i] = value$4(a[i], b[i]);
  }for (; i < nb; ++i) {
    c[i] = b[i];
  }return function (t) {
    for (i = 0; i < na; ++i) {
      c[i] = x[i](t);
    }return c;
  };
};

var date$3 = function (a, b) {
  var d = new Date();
  return a = +a, b -= a, function (t) {
    return d.setTime(a + b * t), d;
  };
};

var interpolateNumber$2 = function (a, b) {
  return a = +a, b -= a, function (t) {
    return a + b * t;
  };
};

var object$3 = function (a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || (typeof a === "undefined" ? "undefined" : _typeof(a)) !== "object") a = {};
  if (b === null || (typeof b === "undefined" ? "undefined" : _typeof(b)) !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = value$4(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function (t) {
    for (k in i) {
      c[k] = i[k](t);
    }return c;
  };
};

var reA$2 = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB$2 = new RegExp(reA$2.source, "g");

function zero$2(b) {
  return function () {
    return b;
  };
}

function one$2(b) {
  return function (t) {
    return b(t) + "";
  };
}

var interpolateString$2 = function (a, b) {
  var bi = reA$2.lastIndex = reB$2.lastIndex = 0,
      // scan index for next number in b
  am,
      // current match in a
  bm,
      // current match in b
  bs,
      // string preceding current number in b, if any
  i = -1,
      // index in s
  s = [],
      // string constants and placeholders
  q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA$2.exec(a)) && (bm = reB$2.exec(b))) {
    if ((bs = bm.index) > bi) {
      // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else {
      // interpolate non-matching numbers
      s[++i] = null;
      q.push({ i: i, x: interpolateNumber$2(am, bm) });
    }
    bi = reB$2.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? q[0] ? one$2(q[0].x) : zero$2(b) : (b = q.length, function (t) {
    for (var i = 0, o; i < b; ++i) {
      s[(o = q[i]).i] = o.x(t);
    }return s.join("");
  });
};

var value$4 = function (a, b) {
    var t = typeof b === "undefined" ? "undefined" : _typeof(b),
        c;
    return b == null || t === "boolean" ? constant$9(b) : (t === "number" ? interpolateNumber$2 : t === "string" ? (c = color$2(b)) ? (b = c, interpolateRgb$2) : interpolateString$2 : b instanceof color$2 ? interpolateRgb$2 : b instanceof Date ? date$3 : Array.isArray(b) ? array$4 : isNaN(b) ? object$3 : interpolateNumber$2)(a, b);
};

var degrees$2 = 180 / Math.PI;

var identity$7 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

var decompose$2 = function (a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees$2,
    skewX: Math.atan(skewX) * degrees$2,
    scaleX: scaleX,
    scaleY: scaleY
  };
};

var cssNode$2;
var cssRoot$2;
var cssView$2;
var svgNode$2;

function parseCss$2(value) {
  if (value === "none") return identity$7;
  if (!cssNode$2) cssNode$2 = document.createElement("DIV"), cssRoot$2 = document.documentElement, cssView$2 = document.defaultView;
  cssNode$2.style.transform = value;
  value = cssView$2.getComputedStyle(cssRoot$2.appendChild(cssNode$2), null).getPropertyValue("transform");
  cssRoot$2.removeChild(cssNode$2);
  value = value.slice(7, -1).split(",");
  return decompose$2(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg$2(value) {
  if (value == null) return identity$7;
  if (!svgNode$2) svgNode$2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode$2.setAttribute("transform", value);
  if (!(value = svgNode$2.transform.baseVal.consolidate())) return identity$7;
  value = value.matrix;
  return decompose$2(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform$2(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: interpolateNumber$2(xa, xb) }, { i: i - 2, x: interpolateNumber$2(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360;else if (b - a > 180) a += 360; // shortest path
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber$2(a, b) });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber$2(a, b) });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: interpolateNumber$2(xa, xb) }, { i: i - 2, x: interpolateNumber$2(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function (a, b) {
    var s = [],
        // string constants and placeholders
    q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function (t) {
      var i = -1,
          n = q.length,
          o;
      while (++i < n) {
        s[(o = q[i]).i] = o.x(t);
      }return s.join("");
    };
  };
}

var interpolateTransformCss$2 = interpolateTransform$2(parseCss$2, "px, ", "px)", "deg)");
var interpolateTransformSvg$2 = interpolateTransform$2(parseSvg$2, ", ", ")", ")");

var rho$2 = Math.SQRT2;
var rho2$2 = 2;
var rho4$2 = 4;
var epsilon2$2 = 1e-12;

function cosh$2(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function sinh$2(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function tanh$2(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

// p0 = [ux0, uy0, w0]
// p1 = [ux1, uy1, w1]

function cubehelix$8(hue$$1) {
  return function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix$7(start)).h, (end = cubehelix$7(end)).h),
          s = nogamma$2(start.s, end.s),
          l = nogamma$2(start.l, end.l),
          opacity = nogamma$2(start.opacity, end.opacity);
      return function (t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  }(1);
}

cubehelix$8(hue$2);
var cubehelixLong$2 = cubehelix$8(nogamma$2);

function tweenRemove$2(id, name) {
  var tween0, tween1;
  return function () {
    var schedule = set$15(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction$2(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error();
  return function () {
    var schedule = set$15(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name: name, value: value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

var transition_tween$2 = function (name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get$7(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove$2 : tweenFunction$2)(id, name, value));
};

function tweenValue$2(transition, name, value) {
  var id = transition._id;

  transition.each(function () {
    var schedule = set$15(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function (node) {
    return get$7(node, id).value[name];
  };
}

var interpolate$2 = function (a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber$2 : b instanceof color$2 ? interpolateRgb$2 : (c = color$2(b)) ? (b = c, interpolateRgb$2) : interpolateString$2)(a, b);
};

function attrRemove$5(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$5(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$5(name, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrConstantNS$5(fullname, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrFunction$5(name, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttribute(name);
    value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

function attrFunctionNS$5(fullname, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

var transition_attr$2 = function (name, value) {
  var fullname = namespace$3(name),
      i = fullname === "transform" ? interpolateTransformSvg$2 : interpolate$2;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS$5 : attrFunction$5)(fullname, i, tweenValue$2(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS$5 : attrRemove$5)(fullname) : (fullname.local ? attrConstantNS$5 : attrConstant$5)(fullname, i, value));
};

function attrTweenNS$2(fullname, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttributeNS(fullname.space, fullname.local, i(t));
    };
  }
  tween._value = value;
  return tween;
}

function attrTween$2(name, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttribute(name, i(t));
    };
  }
  tween._value = value;
  return tween;
}

var transition_attrTween$2 = function (name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  var fullname = namespace$3(name);
  return this.tween(key, (fullname.local ? attrTweenNS$2 : attrTween$2)(fullname, value));
};

function delayFunction$2(id, value) {
  return function () {
    init$3(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant$2(id, value) {
  return value = +value, function () {
    init$3(this, id).delay = value;
  };
}

var transition_delay$2 = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? delayFunction$2 : delayConstant$2)(id, value)) : get$7(this.node(), id).delay;
};

function durationFunction$2(id, value) {
  return function () {
    set$15(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant$2(id, value) {
  return value = +value, function () {
    set$15(this, id).duration = value;
  };
}

var transition_duration$2 = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? durationFunction$2 : durationConstant$2)(id, value)) : get$7(this.node(), id).duration;
};

function easeConstant$2(id, value) {
  if (typeof value !== "function") throw new Error();
  return function () {
    set$15(this, id).ease = value;
  };
}

var transition_ease$2 = function (value) {
  var id = this._id;

  return arguments.length ? this.each(easeConstant$2(id, value)) : get$7(this.node(), id).ease;
};

var transition_filter$2 = function (match) {
  if (typeof match !== "function") match = matcher$5(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition$2(subgroups, this._parents, this._name, this._id);
};

var transition_merge$2 = function (transition) {
  if (transition._id !== this._id) throw new Error();

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition$2(merges, this._parents, this._name, this._id);
};

function start$2(name) {
  return (name + "").trim().split(/^|\s+/).every(function (t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction$2(id, name, listener) {
  var on0,
      on1,
      sit = start$2(name) ? init$3 : set$15;
  return function () {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

var transition_on$2 = function (name, listener) {
  var id = this._id;

  return arguments.length < 2 ? get$7(this.node(), id).on.on(name) : this.each(onFunction$2(id, name, listener));
};

function removeFunction$2(id) {
  return function () {
    var parent = this.parentNode;
    for (var i in this.__transition) {
      if (+i !== id) return;
    }if (parent) parent.removeChild(this);
  };
}

var transition_remove$2 = function () {
  return this.on("end.remove", removeFunction$2(this._id));
};

var transition_select$2 = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selector$2(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule$2(subgroup[i], name, id, i, subgroup, get$7(node, id));
      }
    }
  }

  return new Transition$2(subgroups, this._parents, name, id);
};

var transition_selectAll$2 = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selectorAll$2(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select$$1.call(node, node.__data__, i, group), child, inherit = get$7(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule$2(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition$2(subgroups, parents, name, id);
};

var Selection$5 = selection$4.prototype.constructor;

var transition_selection$2 = function () {
  return new Selection$5(this._groups, this._parents);
};

function styleRemove$5(name, interpolate$$1) {
    var value00, value10, interpolate0;
    return function () {
        var style = window$3(this).getComputedStyle(this, null),
            value0 = style.getPropertyValue(name),
            value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
}

function styleRemoveEnd$2(name) {
    return function () {
        this.style.removeProperty(name);
    };
}

function styleConstant$5(name, interpolate$$1, value1) {
    var value00, interpolate0;
    return function () {
        var value0 = window$3(this).getComputedStyle(this, null).getPropertyValue(name);
        return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
    };
}

function styleFunction$5(name, interpolate$$1, value) {
    var value00, value10, interpolate0;
    return function () {
        var style = window$3(this).getComputedStyle(this, null),
            value0 = style.getPropertyValue(name),
            value1 = value(this);
        if (value1 == null) value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
}

var transition_style$2 = function (name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss$2 : interpolate$2;
    return value == null ? this.styleTween(name, styleRemove$5(name, i)).on("end.style." + name, styleRemoveEnd$2(name)) : this.styleTween(name, typeof value === "function" ? styleFunction$5(name, i, tweenValue$2(this, "style." + name, value)) : styleConstant$5(name, i, value), priority);
};

function styleTween$2(name, value, priority) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.style.setProperty(name, i(t), priority);
    };
  }
  tween._value = value;
  return tween;
}

var transition_styleTween$2 = function (name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, styleTween$2(name, value, priority == null ? "" : priority));
};

function textConstant$5(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction$5(value) {
  return function () {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

var transition_text$2 = function (value) {
  return this.tween("text", typeof value === "function" ? textFunction$5(tweenValue$2(this, "text", value)) : textConstant$5(value == null ? "" : value + ""));
};

var transition_transition$2 = function () {
  var name = this._name,
      id0 = this._id,
      id1 = newId$2();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get$7(node, id0);
        schedule$2(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition$2(groups, this._parents, name, id1);
};

var id$2 = 0;

function Transition$2(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition$5(name) {
  return selection$4().transition(name);
}

function newId$2() {
  return ++id$2;
}

var selection_prototype$2 = selection$4.prototype;

Transition$2.prototype = transition$5.prototype = {
  constructor: Transition$2,
  select: transition_select$2,
  selectAll: transition_selectAll$2,
  filter: transition_filter$2,
  merge: transition_merge$2,
  selection: transition_selection$2,
  transition: transition_transition$2,
  call: selection_prototype$2.call,
  nodes: selection_prototype$2.nodes,
  node: selection_prototype$2.node,
  size: selection_prototype$2.size,
  empty: selection_prototype$2.empty,
  each: selection_prototype$2.each,
  on: transition_on$2,
  attr: transition_attr$2,
  attrTween: transition_attrTween$2,
  style: transition_style$2,
  styleTween: transition_styleTween$2,
  text: transition_text$2,
  remove: transition_remove$2,
  tween: transition_tween$2,
  delay: transition_delay$2,
  duration: transition_duration$2,
  ease: transition_ease$2
};

function cubicInOut$2(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var exponent$3 = 3;

var polyIn$2 = function custom(e) {
  e = +e;

  function polyIn(t) {
    return Math.pow(t, e);
  }

  polyIn.exponent = custom;

  return polyIn;
}(exponent$3);

var polyOut$2 = function custom(e) {
  e = +e;

  function polyOut(t) {
    return 1 - Math.pow(1 - t, e);
  }

  polyOut.exponent = custom;

  return polyOut;
}(exponent$3);

var polyInOut$2 = function custom(e) {
  e = +e;

  function polyInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
  }

  polyInOut.exponent = custom;

  return polyInOut;
}(exponent$3);

var b1$2 = 4 / 11;
var b2$2 = 6 / 11;
var b3$2 = 8 / 11;
var b4$2 = 3 / 4;
var b5$2 = 9 / 11;
var b6$2 = 10 / 11;
var b7$2 = 15 / 16;
var b8$2 = 21 / 22;
var b9$2 = 63 / 64;
var b0$2 = 1 / b1$2 / b1$2;



function bounceOut$2(t) {
  return (t = +t) < b1$2 ? b0$2 * t * t : t < b3$2 ? b0$2 * (t -= b2$2) * t + b4$2 : t < b6$2 ? b0$2 * (t -= b5$2) * t + b7$2 : b0$2 * (t -= b8$2) * t + b9$2;
}

var overshoot$2 = 1.70158;

var backIn$2 = function custom(s) {
  s = +s;

  function backIn(t) {
    return t * t * ((s + 1) * t - s);
  }

  backIn.overshoot = custom;

  return backIn;
}(overshoot$2);

var backOut$2 = function custom(s) {
  s = +s;

  function backOut(t) {
    return --t * t * ((s + 1) * t + s) + 1;
  }

  backOut.overshoot = custom;

  return backOut;
}(overshoot$2);

var backInOut$2 = function custom(s) {
  s = +s;

  function backInOut(t) {
    return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
  }

  backInOut.overshoot = custom;

  return backInOut;
}(overshoot$2);

var tau$4 = 2 * Math.PI;
var amplitude$2 = 1;
var period$2 = 0.3;

var elasticIn$2 = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau$4);

  function elasticIn(t) {
    return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
  }

  elasticIn.amplitude = function (a) {
    return custom(a, p * tau$4);
  };
  elasticIn.period = function (p) {
    return custom(a, p);
  };

  return elasticIn;
}(amplitude$2, period$2);

var elasticOut$2 = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau$4);

  function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function (a) {
    return custom(a, p * tau$4);
  };
  elasticOut.period = function (p) {
    return custom(a, p);
  };

  return elasticOut;
}(amplitude$2, period$2);

var elasticInOut$2 = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau$4);

  function elasticInOut(t) {
    return ((t = t * 2 - 1) < 0 ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p) : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
  }

  elasticInOut.amplitude = function (a) {
    return custom(a, p * tau$4);
  };
  elasticInOut.period = function (p) {
    return custom(a, p);
  };

  return elasticInOut;
}(amplitude$2, period$2);

var defaultTiming$2 = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut$2
};

function inherit$2(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming$2.time = now$2(), defaultTiming$2;
    }
  }
  return timing;
}

var selection_transition$2 = function (name) {
  var id, timing;

  if (name instanceof Transition$2) {
    id = name._id, name = name._name;
  } else {
    id = newId$2(), (timing = defaultTiming$2).time = now$2(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule$2(node, name, id, i, group, timing || inherit$2(node, id));
      }
    }
  }

  return new Transition$2(groups, this._parents, name, id);
};

selection$4.prototype.interrupt = selection_interrupt$2;
selection$4.prototype.transition = selection_transition$2;

var root$5 = [null];

//
//  d3-transition
//  =============
var transition$4 = {

    refresh: function refresh(model) {
        transition$5(model);
    }
};

//
//  d3-for directive
//  ======================
//
//  Repeat a element over an array of items and establish
//  a one way binding between the array and the Dom
var d3For$1 = {

    create: function create(expression) {
        var bits = [];
        expression.trim().split(' ').forEach(function (v) {
            v ? bits.push(v) : null;
        });
        if (bits.length !== 3 || bits[1] != 'in') return warn$2('d3-for directive requires "item in expression" template, got "' + expression + '"');
        this.itemName = bits[0];
        this.itemClass = 'for' + this.uid;
        return bits[2];
    },

    mount: function mount$2(model) {
        this.creator = this.el;
        this.el = this.creator.parentNode;
        // remove the creator from the DOM
        select$4(this.creator).remove();
        return model;
    },

    refresh: function refresh(model, items) {
        if (!isArray$3(items)) return;

        var creator$$1 = this.creator,
            selector$$1 = creator$$1.tagName + '.' + this.itemClass,
            itemName = this.itemName,
            entries = this.sel.selectAll(selector$$1).data(items);

        entries.enter().append(function () {
            return creator$$1.cloneNode(true);
        }).classed(this.itemClass, true).each(function (d, index) {
            var x = { index: index };
            x[itemName] = d;
            mount$2(model.$child(x), this);
        });

        entries.exit().remove();
    }
};

//
//  d3-if
//  =============
//
//  Remove an element if the condition is not satisfied
//
var d3If$1 = {

    refresh: function refresh(model, value) {
        if (value) this.sel.style('display', null);else this.sel.style('display', 'none');
    }
};

var directives$3 = {
    model: model$5,
    attr: attr$1,
    html: html$2,
    value: value$3,
    show: show$1,
    on: on$2,
    transition: transition$4,
    'for': d3For$1,
    'if': d3If$1
};

var asSelect$1 = function (el) {
    if (el && !isFunction$3(el.size)) return select$4(el);
    return el;
};

var maybeJson$1 = function (value) {
    if (isString$3(value)) {
        try {
            return JSON.parse(value);
        } catch (msg) {
            return value;
        }
    }
    return value;
};

// require handlebar
function compile$3(text) {
    var handlebars = inBrowser$3 ? window.handlebars : require('handlebars');
    if (handlebars) return handlebars.compile(text);
    warn$2('compile function requires handlebars');
}

function html$3(source, context) {
    if (isString$3(source)) {
        if (context) {
            var s = compile$3(source);
            if (!s) return source;
        } else return source;
    }
    return source(context);
}

function htmlElement$1(source, context) {
    var el = select$4(document.createElement('div'));
    el.html(html$3(source, context));
    var children = el.node().children;
    if (children.length !== 1) warn$2('HtmlElement function should return one root element only, got ' + children.length);
    return children[0];
}

// Core Directives
var coreDirectives$1 = extendDirectives$1(map$16(), directives$3);

// prototype for both views and components
var protoComponent$1 = {
    isd3: true,
    providers: viewProviders,
    htmlElement: htmlElement$1,
    // same as export
    viewElement: htmlElement$1,

    init: function init() {},

    mounted: function mounted$2() {},

    createElement: function createElement(tag) {
        return select$4(document.createElement(tag));
    },

    responseError: function responseError(response) {
        var self$$1 = this;
        response.json().then(function (data) {
            self$$1.error(data, response);
        });
    },
    error: function error(data) {
        data.level = 'error';
        this.message(data);
    },
    message: function message(data) {
        var self$$1 = this;
        this.root.events.call('message', self$$1, data);
    },


    // Shortcut for fetch function in providers
    fetch: function fetch(url, options) {
        var fetch = viewProviders.fetch;
        return arguments.length == 1 ? fetch(url) : fetch(url, options);
    },


    render: function render() {},

    mount: function mount(el) {
        if (mounted$2(this)) warn$2('already mounted');else {
            var parent = this.parent ? this.parent.model : null,
                directives = getdirs$1(el, this.directives),
                model = createModel$1(directives, this.model, parent);
            //
            this.model = model;
            //
            // When a for d3-for loop is active we abort mounting this component
            // The component will be mounted as many times the the for loop requires
            if (mount$2(this.model, el)) return;

            var data = select$4(el).datum() || {};

            if (isArray$3(this.props)) {
                var key, value;
                this.props.forEach(function (prop) {
                    key = directives.attrs[prop];
                    if (model[key]) value = model[key];else value = maybeJson$1(key);
                    data[prop] = value;
                });
            }
            //
            // create the new element from the render function
            var newEl = this.render(data, directives.attrs);
            if (isPromise$3(newEl)) {
                var self$$1 = this;
                newEl.then(function (element) {
                    compile$2(self$$1, el, element);
                });
            } else compile$2(this, el, newEl);
        }
        return this;
    }
};

// factory of View and Component constructors
function createComponent$1(o, prototype) {
    if (isFunction$3(o)) o = { render: o };

    var obj = assign$6({}, o),
        classComponents = extendComponents$1(map$16(), pop$4(obj, 'components')),
        classDirectives = extendDirectives$1(map$16(), pop$4(obj, 'directives')),
        model = pop$4(obj, 'model'),
        props = pop$4(obj, 'props');

    function Component(options) {
        var parent = pop$4(options, 'parent'),
            components = map$16(parent ? parent.components : null),
            directives = map$16(parent ? parent.directives : coreDirectives$1),
            events = dispatch$4('message');

        classComponents.each(function (comp, key) {
            components.set(key, comp);
        });
        classDirectives.each(function (comp, key) {
            directives.set(key, comp);
        });
        extendComponents$1(components, pop$4(options, 'components'));
        extendDirectives$1(directives, pop$4(options, 'directives'));

        Object.defineProperties(this, {
            components: {
                get: function get() {
                    return components;
                }
            },
            directives: {
                get: function get() {
                    return directives;
                }
            },
            parent: {
                get: function get() {
                    return parent;
                }
            },
            root: {
                get: function get() {
                    return parent ? parent.root : this;
                }
            },
            props: {
                get: function get() {
                    return props;
                }
            },
            uid: {
                get: function get() {
                    return this.model.uid;
                }
            },
            events: {
                get: function get() {
                    return events;
                }
            }
        });
        this.model = assign$6({}, model, pop$4(options, 'model'));
        this.init(options);
    }

    Component.prototype = assign$6({}, prototype, obj);

    function component(options) {
        return new Component(options);
    }

    component.prototype = Component.prototype;

    return component;
}

function mounted$2(view) {
    var mounted = view.isMounted;
    if (!mounted) Object.defineProperty(view, 'isMounted', {
        get: function get() {
            return true;
        }
    });
    return mounted;
}

function extendComponents$1(container, components) {
    map$16(components).each(function (obj, key) {
        container.set(key, createComponent$1(obj, protoComponent$1));
    });
    return container;
}

function extendDirectives$1(container, directives) {
    map$16(directives).each(function (obj, key) {
        container.set(key, createDirective$1(obj));
    });
    return container;
}

function asView$1(vm, element) {
    var model = vm.model;

    Object.defineProperty(sel$1(vm), 'el', {
        get: function get() {
            return element;
        }
    });

    Object.defineProperty(model, '$vm', {
        get: function get() {
            return vm;
        }
    });

    // Apply model to element
    select$4(element).model(model);

    mount$2(model, element);
}

// Compile a component model
// This function is called once a component has rendered the component element
function compile$2(cm, el, element) {
    if (!element) return warn$2('render function must return a single HTML node. It returned nothing!');
    element = asSelect$1(element);
    if (element.size() !== 1) warn$2('render function must return a single HTML node');
    element = element.node();
    //
    // Insert before the component element
    el.parentNode.insertBefore(element, el);
    // remove the component element
    select$4(el).remove();
    //
    asView$1(cm, element);
    //
    // mounted hook
    cm.mounted();
}

//
// prototype for views
var protoView$1 = assign$6({}, protoComponent$1, {

    use: function use(plugin) {
        if (isObject$3(plugin)) plugin.install(this);else plugin(this);
        return this;
    },

    addComponent: function addComponent(name, obj) {
        if (this.isMounted) return warn$2('already mounted, cannot add component');
        var component = createComponent$1(obj, protoComponent$1);
        this.components.set(name, component);
        return component;
    },

    addDirective: function addDirective(name, obj) {
        if (this.isMounted) return warn$2('already mounted, cannot add directive');
        var directive = createDirective$1(obj);
        this.directives.set(name, directive);
        return directive;
    },

    mount: function mount(el) {
        if (mounted$2(this)) warn$2('already mounted');else {
            el = element$5(el);
            if (el) {
                var parent = this.parent ? this.parent.model : null;
                this.model = createModel$1(getdirs$1(el, this.directives), this.model, parent);
                asView$1(this, el);
            }
        }
        return this;
    }
});

// the view constructor
createComponent$1(null, protoView$1);

function element$5(el) {
    if (!el) return warn$2('element not defined, pass an identifier or an HTMLElement object');
    var d3el = isFunction$3(el.node) ? el : select$4(el),
        element = d3el.node();
    if (!element) warn$2('could not find ' + el + ' element');else return element;
}

// Add callback to execute when the DOM is ready
var readyCallbacks$1 = [];

//
// Promise enabled require function
var viewRequire = function (libs) {
    var self$$1 = this;

    return new Promise(function (resolve, reject) {
        try {
            if (inBrowser$3) {
                window.require(libs, function () {
                    resolve.apply(this, arguments);
                });
            } else {
                resolve.apply(self$$1, require(libs));
            }
        } catch (err) {
            reject(err);
        }
    });
};

var providers$2 = {
    logger: logger$3
};

var prefix$13 = '[d3-form]';

var warn$3 = function (msg) {
    providers$2.logger.warn(prefix$13 + ' ' + msg);
};

var modelDataKeys$1 = ['labelSrOnly', 'layout'];

var componentsFromType$1 = {
    'text': 'input',
    'password': 'input',
    'number': 'input'
};

// return A promise which execute a callback at the next event Loop cycle
function nextTick$1(callback) {
    var self$$1 = this;
    return new Promise(function (resolve) {
        resolve();
    }).then(function () {
        return callback.call(self$$1);
    });
}

function formComponent$1(child) {
    var type = child.type || 'text';
    return componentsFromType$1[type] || type;
}

function addChildren$1(sel) {
    var children = this.data.children;
    if (children) {
        if (!isArray$3(children)) {
            warn$3('children should be an array of fields, for ' + (typeof children === 'undefined' ? 'undefined' : _typeof(children)));
            return sel;
        }
        sel.selectAll('.d3form').data(children).enter().append(formChild$1).classed('d3form', true);
    }
    return sel;
}

function modelData$1(data) {
    if (!data) data = {};
    this.data = data;
    var model = this.model;
    modelDataKeys$1.forEach(function (key) {
        if (key in data) model.$set(key, data[key]);
    });
    return data;
}

function formChild$1(child) {
    var component = formComponent$1(child);
    if (!component) {
        warn$3('Could not find form component ' + child.type);
        component = 'input';
        child.type = 'hidden';
    }
    return document.createElement('d3' + component);
}

//
// Fieldset element
var fieldset$1 = {

    render: function render(data) {
        var el = this.createElement('fieldset');
        modelData$1.call(this, data);
        return addChildren$1.call(this, el);
    }

};

var formElement$1 = {
    wrap: function wrap(sel) {
        var field = this,
            theme = getTheme$1(field),
            wrappers = theme ? theme[sel.attr('type')] || theme[sel.node().tagName.toLowerCase()] : null;
        if (!wrappers || !theme.wrappers) return sel;

        var wrapped = sel,
            wrap;

        wrappers.forEach(function (wrapper) {
            wrap = theme.wrappers[wrapper];
            if (wrap) wrapped = wrap.call(field, wrapped, sel);else warn$3('Could not find form field wrapper ' + wrapper);
        });

        return wrapped;
    },
    wrapTemplate: function wrapTemplate(sel, template) {
        var div = document.createElement('div'),
            outer = select$4(div).html(template),
            slot = outer.select('slot');

        if (!slot.size()) {
            warn$3('template does not provide a slot element');
            return sel;
        }
        var target = select$4(slot.node().parentNode);
        sel.nodes().forEach(function (node) {
            target.insert(function () {
                return node;
            }, 'slot');
        });
        slot.remove();
        return selectAll$2(div.children);
    }
};

// A mixin for all form field components
var field$1 = assign$6({

    model: {
        error: '',
        isDirty: false,
        showError: {
            reactOn: ['error', 'isDirty', 'formSubmitted'],
            get: function get() {
                if (this.error) return this.isDirty || this.formSubmitted;
                return false;
            }
        }
    },

    mounted: function mounted() {
        this.model.$on('value', function () {
            this.isDirty = true;
        });
    },
    inputData: function inputData(data) {
        data = modelData$1.call(this, data);
        if (!data.name) warn$3('Input field without a name');
        data.placeholder = data.placeholder || data.label || data.name;
        data.id = data.id || 'd3f' + this.uid;
        this.model.inputs[data.name] = this.model;
        return data;
    }
}, formElement$1);

function getTheme$1(component) {
    var theme = component.formTheme;
    if (!theme && component.parent) return getTheme$1(component.parent);else return theme;
}

var required$1 = {
    set: function set(el, data) {
        var value = data.required;
        if (isString$3(value)) el.attr('d3-required', value);else el.property('required', value || null);
    },
    validate: function validate(el, value) {
        if (el.property('required')) {
            if (!value) return 'required';
        } else if (value === '') return true;
    }
};

var minlength$1 = {
    set: function set(el, data) {
        var value = data.minlength;
        if (isString$3(value)) el.attr('d3-attr-minlength', value);else if (value !== undefined) el.attr('minlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('minlength');
        if (l === l && l > 0 && value.length < l) return 'too short - ' + l + ' characters or more expected';
    }
};

var maxlength$1 = {
    set: function set(el, data) {
        var value = data.maxlength;
        if (isString$3(value)) el.attr('d3-attr-maxlength', value);else if (value !== undefined) el.attr('maxlength', value);
    },
    validate: function validate(el, value) {
        var l = +el.attr('maxlength');
        if (l === l && l > 0 && value.length > l) return 'too long - ' + l + ' characters or less expected';
    }
};

var min$2 = {
    set: function set(el, data) {
        var value = data.min;
        if (isString$3(value)) el.attr('d3-attr-min', value);else if (value !== undefined) el.attr('min', value);
    },
    validate: function validate(el, value) {
        var r = range$2(el);
        if (r && +value < r[0]) return 'must be greater or equal ' + r[0];
    }
};

var max$2 = {
    set: function set(el, data) {
        var value = data.max;
        if (isString$3(value)) el.attr('d3-attr-max', value);else if (value !== undefined) el.attr('max', value);
    },
    validate: function validate(el, value) {
        var r = range$2(el);
        if (r && +value > r[1]) return 'must be less or equal ' + r[1];
    }
};

var validators$1 = {
    get: function get(model, custom) {
        var validators = this.all.slice(0);
        if (isObject$3(custom)) for (var key in custom) {
            validators.push(customValidator$1(key, custom[key]));
        }return validators;
    },
    set: function set(vm, el) {
        vm.model.validators.forEach(function (validator) {
            validator.set(el, vm.data);
        });

        vm.model.$on(this.validate);
    },
    validate: function validate(property) {
        if (property !== 'value') return;

        var vm = this.$vm,
            validators = this.validators,
            el = vm.sel.attr('id') === vm.data.id ? vm.sel : vm.sel.select('#' + vm.data.id),
            value = this.value,
            validator,
            msg;

        for (var i = 0; i < validators.length; ++i) {
            validator = validators[i];
            msg = validator.validate(el, value);
            if (msg) {
                if (msg === true) msg = '';
                break;
            }
        }

        this.error = msg || '';
    },


    all: [required$1, minlength$1, maxlength$1, min$2, max$2]
};

function range$2(el) {
    var l0 = el.attr('min'),
        l1 = el.attr('max');
    l0 = l0 === null ? -Infinity : +l0;
    l1 = l1 === null ? Infinity : +l1;
    return [l0, l1];
}

function customValidator$1(key, method) {

    return {
        set: function set(el, data) {
            var value = data[key];
            if (!value) return;
        },
        validate: function validate(el, value) {
            return method(el, value);
        }
    };
}

//
// Input element
var input$3 = assign$6({

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('input').attr('id', data.id).attr('type', data.type || 'text').attr('name', data.name).attr('d3-value', 'value').attr('placeholder', data.placeholder);

        validators$1.set(this, el);
        return this.wrap(el);
    }
}, field$1);

//
// Textarea element
var textarea$3 = assign$6({

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('textarea').attr('id', data.id).attr('name', data.name).attr('placeholder', data.placeholder).attr('d3-value', 'value').attr('d3-validate', 'validators');

        validators$1.set(this, el);
        return this.wrap(el);
    }

}, field$1);

//
// Select element
var select$5 = assign$6({}, field$1, {

    model: assign$6({
        options: [],
        $optionLabel: optionLabel$1,
        $optionValue: optionValue$1
    }, field$1.model),

    render: function render(data) {
        data = this.inputData(data);
        var el = this.createElement('select').attr('id', data.id).attr('name', data.name).attr('d3-value', 'value').attr('placeholder', data.placeholder);

        this.model.options = data.options;

        el.append('option').attr('d3-for', 'option in options').attr('d3-html', '$optionLabel()').attr('d3-attr-value', '$optionValue()');

        validators$1.set(this, el);
        return this.wrap(el);
    }
});

function optionValue$1() {
    if (isArray$3(this.option)) return this.option[0];
    return this.option;
}

function optionLabel$1() {
    if (isArray$3(this.option)) return this.option[1] || this.option[0];
    return this.option;
}

//
// Submit element
var submit$3 = assign$6({

    render: function render(data) {
        data = modelData$1.call(this, data);
        data.type = data.type || 'submit';
        this.model.$set('error', false);
        if (!isString$3(data.disabled)) {
            this.model.$set('disabled', data.disabled || null);
            data.disabled = 'disabled';
        }
        if (!data.click) data.click = '$vm.click()';

        var el = this.createElement('button').attr('type', data.type).attr('name', data.name).attr('d3-attr-disabled', data.disabled).attr('d3-on-click', data.click).html(data.label || 'submit');

        return this.wrap(el);
    },

    click: function click() {
        this.model.form.actions.submit.call(this, event$2);
    }
}, formElement$1);

// Form Responses
var responses$1 = {
    "default": defaultResponse$1,
    redirect: redirect$1
};

function defaultResponse$1(response) {
    var data = response.json();
    this.message(data);
}

function redirect$1() {
    window.location.href = this.data.redirectTo || '/';
}

// Form Actions
var actions$1 = {
    submit: submit$4
};

function submit$4(e) {
    var form = this && this.model ? this.model.form : null;

    if (!form) {
        warn$3('form not available, cannot submit');
        return;
    }

    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    var fetch = providers$2.fetch,
        ct = (form.data.enctype || '').split(';')[0],
        action = form.data.action,
        url = isObject$3(action) ? action.url : action,
        data = form.inputData(),
        options = {};

    if (!fetch) {
        warn$3('fetch provider not available, cannot submit');
        return;
    }

    if (!url) {
        warn$3('No url, cannot submit');
        return;
    }

    if (ct === 'application/json') {
        options.headers = {
            'Content-Type': form.data.enctype
        };
        options.body = JSON.stringify(data);
    } else {
        options.body = new FormData();
        for (var key in data) {
            options.body.set(key, data[key]);
        }
    }

    // Flag the form as submitted
    form.setSubmit();
    options.method = form.method || 'post';
    fetch(url, options).then(success, failure);

    function success(response) {
        form.setSubmitDone();
        form.response(response);
    }

    function failure() {
        form.setSubmitDone();
    }
}

// Main form component
var form$1 = {

    // make sure a new model is created for this component
    props: ['json'],

    model: {
        formSubmitted: false,
        formPending: false
    },

    components: {
        'd3fieldset': fieldset$1,
        'd3input': input$3,
        'd3textarea': textarea$3,
        'd3select': select$5,
        'd3submit': submit$3
    },

    render: function render(data) {
        var model = this.model,
            form = this.createElement('form').attr('novalidate', ''),
            self$$1 = this;
        //
        model.inputs = {};
        model.form = this;
        //
        var json = data['json'];
        if (isString$3(json)) {
            var fetch = providers$2.fetch;
            return fetch(json, { method: 'GET' }).then(function (response) {
                if (response.status === 200) return response.json().then(build);else warn$3('Could not load form from ' + json + ': status ' + response.status);
            });
        } else return build(json);

        function build(formData) {
            modelData$1.call(self$$1, formData);
            //
            // Form validations
            model.validators = validators$1.get(model, data.validators);
            //
            // Form actions
            self$$1.actions = {};
            for (var key in actions$1) {
                var action = self$$1.data[key];
                if (isString$3(action)) action = self$$1.model.$get(action);
                self$$1.actions[key] = action || actions$1[key];
            }
            addChildren$1.call(self$$1, form);
            return form;
        }
    },

    inputData: function inputData() {
        var inputs = this.model.inputs,
            data = {},
            value;
        for (var key in inputs) {
            value = inputs[key].value;
            if (value !== undefined) data[key] = value;
        }

        return data;
    },

    setSubmit: function setSubmit() {
        var _this = this;

        this.model.formSubmitted = true;
        this.model.formPending = true;
        return nextTick$1.call(this, function () {
            return _this.isValid();
        });
    },

    setSubmitDone: function setSubmitDone() {
        this.model.formPending = false;
    },

    isValid: function isValid() {
        var inp;
        for (var key in this.model.inputs) {
            inp = this.model.inputs[key];
            if (inp.error) return false;
        }
        return true;
    },
    inputError: function inputError(error) {
        var input = this.model.inputs[error.name];
        if (!input) {
            warn$3('Unknown input, cannot set input error');
            this.error(error);
        }
    },
    response: function response(_response) {
        if (!_response) return;
        var handler;

        if (_response.status) {
            if (_response.status < 300) {
                if (this.data.resultHandler) {
                    handler = responses$1[this.data.resultHandler];
                    if (!handler) warn$3('Could not find ' + this.data.resultHandler + ' result handler');else handler.call(this, _response);
                } else {
                    responses$1.default.call(this, _response);
                }
            } else this.responseError(_response);
        } else if (_response.error) {
            this.error(_response.error);
        } else if (isArray$3(_response.errors)) {
            var self$$1 = this;
            _response.errors.forEach(function (error) {
                self$$1.inputError(error);
            });
        } else {
            if (this.data.resultHandler) {
                handler = responses$1[this.data.resultHandler];
                if (!handler) warn$3('Could not find ' + this.data.resultHandler + ' result handler');else handler.call(this, _response);
            } else {
                responses$1.default.call(this, _response);
            }
        }
    }
};

// Forms plugin

var label$1 = function (el) {
    return this.wrapTemplate(el, labelTpl$1(this.data));
};

function labelTpl$1(data) {
    var label = data.label || data.name;

    return "<label for=" + data.id + " class=\"control-label\" d3-class=\"[required, labelSrOnly ? 'sr-only' : null]\">" + label + "</label>\n<slot></slot>";
}

var groupTpl$3 = '<div class="form-group" d3-class=\'showError ? "has-danger" : null\'>\n<slot></slot>\n<p d3-if="showError" class="text-danger error-block" d3-html="error"></p>\n</div>';

var formGroup$1 = function (el, formEl) {
    formEl.classed('form-control', true).attr('d3-class', 'showError ? "form-control-danger" : null');
    return this.wrapTemplate(el, groupTpl$3);
};

var inputGroup$1 = function (el, formEl) {
    var ig = this.data['group'];
    if (!ig) return el;
    var gid = 'g' + formEl.attr('id');
    formEl.attr('aria-describedby', gid);
    return this.wrapTemplate(el, groupTpl$4(gid, ig));
};

function groupTpl$4(gid, group) {
    return '<div class="input-group" :class="bootstrapStatus()">\n<span class="input-group-addon" id="' + gid + '">' + group + '</span>\n<slot></slot>\n</div>';
}

var groupTpl$5 = '<div class="form-group">\n<slot></slot>\n</div>';

var submit$5 = function (el, formEl) {
    var theme = this.data.theme || 'primary';
    formEl.classed('btn', true).classed('btn-' + theme, true);
    return this.wrapTemplate(el, groupTpl$5);
};

var bootstrap$1 = {

    input: ['inputGroup', 'label', 'formGroup'],
    textarea: ['label', 'formGroup'],
    select: ['label', 'formGroup'],
    submit: ['submit'],
    wrappers: {
        label: label$1,
        formGroup: formGroup$1,
        inputGroup: inputGroup$1,
        submit: submit$5
    }
};

// Bootstrap theme

var noop$4 = { value: function value() {} };

function dispatch$6() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch$3(_);
}

function Dispatch$3(_) {
  this._ = _;
}

function parseTypenames$6(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return { type: t, name: name };
  });
}

Dispatch$3.prototype = dispatch$6.prototype = {
  constructor: Dispatch$3,
  on: function on(typename, callback) {
    var _ = this._,
        T = parseTypenames$6(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) {
        if ((t = (typename = T[i]).type) && (t = get$8(_[t], typename.name))) return t;
      }return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$16(_[t], typename.name, callback);else if (callback == null) for (t in _) {
        _[t] = set$16(_[t], typename.name, null);
      }
    }

    return this;
  },
  copy: function copy() {
    var copy = {},
        _ = this._;
    for (var t in _) {
      copy[t] = _[t].slice();
    }return new Dispatch$3(copy);
  },
  call: function call(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) {
      args[i] = arguments[i + 2];
    }if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  },
  apply: function apply(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  }
};

function get$8(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$16(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop$4, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({ name: name, value: callback });
  return type;
}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var crossfilter$1 = createCommonjsModule(function (module, exports) {
(function (exports) {
  crossfilter.version = "1.3.12";
  function crossfilter_identity(d) {
    return d;
  }
  crossfilter.permute = permute;

  function permute(array, index) {
    for (var i = 0, n = index.length, copy = new Array(n); i < n; ++i) {
      copy[i] = array[index[i]];
    }
    return copy;
  }
  var bisect = crossfilter.bisect = bisect_by(crossfilter_identity);

  bisect.by = bisect_by;

  function bisect_by(f) {

    // Locate the insertion point for x in a to maintain sorted order. The
    // arguments lo and hi may be used to specify a subset of the array which
    // should be considered; by default the entire array is used. If x is already
    // present in a, the insertion point will be before (to the left of) any
    // existing entries. The return value is suitable for use as the first
    // argument to `array.splice` assuming that a is already sorted.
    //
    // The returned insertion point i partitions the array a into two halves so
    // that all v < x for v in a[lo:i] for the left side and all v >= x for v in
    // a[i:hi] for the right side.
    function bisectLeft(a, x, lo, hi) {
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (f(a[mid]) < x) lo = mid + 1;else hi = mid;
      }
      return lo;
    }

    // Similar to bisectLeft, but returns an insertion point which comes after (to
    // the right of) any existing entries of x in a.
    //
    // The returned insertion point i partitions the array into two halves so that
    // all v <= x for v in a[lo:i] for the left side and all v > x for v in
    // a[i:hi] for the right side.
    function bisectRight(a, x, lo, hi) {
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (x < f(a[mid])) hi = mid;else lo = mid + 1;
      }
      return lo;
    }

    bisectRight.right = bisectRight;
    bisectRight.left = bisectLeft;
    return bisectRight;
  }
  var heap = crossfilter.heap = heap_by(crossfilter_identity);

  heap.by = heap_by;

  function heap_by(f) {

    // Builds a binary heap within the specified array a[lo:hi]. The heap has the
    // property such that the parent a[lo+i] is always less than or equal to its
    // two children: a[lo+2*i+1] and a[lo+2*i+2].
    function heap(a, lo, hi) {
      var n = hi - lo,
          i = (n >>> 1) + 1;
      while (--i > 0) {
        sift(a, i, n, lo);
      }return a;
    }

    // Sorts the specified array a[lo:hi] in descending order, assuming it is
    // already a heap.
    function sort(a, lo, hi) {
      var n = hi - lo,
          t;
      while (--n > 0) {
        t = a[lo], a[lo] = a[lo + n], a[lo + n] = t, sift(a, 1, n, lo);
      }return a;
    }

    // Sifts the element a[lo+i-1] down the heap, where the heap is the contiguous
    // slice of array a[lo:lo+n]. This method can also be used to update the heap
    // incrementally, without incurring the full cost of reconstructing the heap.
    function sift(a, i, n, lo) {
      var d = a[--lo + i],
          x = f(d),
          child;
      while ((child = i << 1) <= n) {
        if (child < n && f(a[lo + child]) > f(a[lo + child + 1])) child++;
        if (x <= f(a[lo + child])) break;
        a[lo + i] = a[lo + child];
        i = child;
      }
      a[lo + i] = d;
    }

    heap.sort = sort;
    return heap;
  }
  var heapselect = crossfilter.heapselect = heapselect_by(crossfilter_identity);

  heapselect.by = heapselect_by;

  function heapselect_by(f) {
    var heap = heap_by(f);

    // Returns a new array containing the top k elements in the array a[lo:hi].
    // The returned array is not sorted, but maintains the heap property. If k is
    // greater than hi - lo, then fewer than k elements will be returned. The
    // order of elements in a is unchanged by this operation.
    function heapselect(a, lo, hi, k) {
      var queue = new Array(k = Math.min(hi - lo, k)),
          min,
          i,
          x,
          d;

      for (i = 0; i < k; ++i) {
        queue[i] = a[lo++];
      }heap(queue, 0, k);

      if (lo < hi) {
        min = f(queue[0]);
        do {
          if (x = f(d = a[lo]) > min) {
            queue[0] = d;
            min = f(heap(queue, 0, k)[0]);
          }
        } while (++lo < hi);
      }

      return queue;
    }

    return heapselect;
  }
  var insertionsort = crossfilter.insertionsort = insertionsort_by(crossfilter_identity);

  insertionsort.by = insertionsort_by;

  function insertionsort_by(f) {

    function insertionsort(a, lo, hi) {
      for (var i = lo + 1; i < hi; ++i) {
        for (var j = i, t = a[i], x = f(t); j > lo && f(a[j - 1]) > x; --j) {
          a[j] = a[j - 1];
        }
        a[j] = t;
      }
      return a;
    }

    return insertionsort;
  }
  // Algorithm designed by Vladimir Yaroslavskiy.
  // Implementation based on the Dart project; see lib/dart/LICENSE for details.

  var quicksort = crossfilter.quicksort = quicksort_by(crossfilter_identity);

  quicksort.by = quicksort_by;

  function quicksort_by(f) {
    var insertionsort = insertionsort_by(f);

    function sort(a, lo, hi) {
      return (hi - lo < quicksort_sizeThreshold ? insertionsort : quicksort)(a, lo, hi);
    }

    function quicksort(a, lo, hi) {
      // Compute the two pivots by looking at 5 elements.
      var sixth = (hi - lo) / 6 | 0,
          i1 = lo + sixth,
          i5 = hi - 1 - sixth,
          i3 = lo + hi - 1 >> 1,
          // The midpoint.
      i2 = i3 - sixth,
          i4 = i3 + sixth;

      var e1 = a[i1],
          x1 = f(e1),
          e2 = a[i2],
          x2 = f(e2),
          e3 = a[i3],
          x3 = f(e3),
          e4 = a[i4],
          x4 = f(e4),
          e5 = a[i5],
          x5 = f(e5);

      var t;

      // Sort the selected 5 elements using a sorting network.
      if (x1 > x2) t = e1, e1 = e2, e2 = t, t = x1, x1 = x2, x2 = t;
      if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;
      if (x1 > x3) t = e1, e1 = e3, e3 = t, t = x1, x1 = x3, x3 = t;
      if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
      if (x1 > x4) t = e1, e1 = e4, e4 = t, t = x1, x1 = x4, x4 = t;
      if (x3 > x4) t = e3, e3 = e4, e4 = t, t = x3, x3 = x4, x4 = t;
      if (x2 > x5) t = e2, e2 = e5, e5 = t, t = x2, x2 = x5, x5 = t;
      if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
      if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;

      var pivot1 = e2,
          pivotValue1 = x2,
          pivot2 = e4,
          pivotValue2 = x4;

      // e2 and e4 have been saved in the pivot variables. They will be written
      // back, once the partitioning is finished.
      a[i1] = e1;
      a[i2] = a[lo];
      a[i3] = e3;
      a[i4] = a[hi - 1];
      a[i5] = e5;

      var less = lo + 1,
          // First element in the middle partition.
      great = hi - 2; // Last element in the middle partition.

      // Note that for value comparison, <, <=, >= and > coerce to a primitive via
      // Object.prototype.valueOf; == and === do not, so in order to be consistent
      // with natural order (such as for Date objects), we must do two compares.
      var pivotsEqual = pivotValue1 <= pivotValue2 && pivotValue1 >= pivotValue2;
      if (pivotsEqual) {

        // Degenerated case where the partitioning becomes a dutch national flag
        // problem.
        //
        // [ |  < pivot  | == pivot | unpartitioned | > pivot  | ]
        //  ^             ^          ^             ^            ^
        // left         less         k           great         right
        //
        // a[left] and a[right] are undefined and are filled after the
        // partitioning.
        //
        // Invariants:
        //   1) for x in ]left, less[ : x < pivot.
        //   2) for x in [less, k[ : x == pivot.
        //   3) for x in ]great, right[ : x > pivot.
        for (var k = less; k <= great; ++k) {
          var ek = a[k],
              xk = f(ek);
          if (xk < pivotValue1) {
            if (k !== less) {
              a[k] = a[less];
              a[less] = ek;
            }
            ++less;
          } else if (xk > pivotValue1) {

            // Find the first element <= pivot in the range [k - 1, great] and
            // put [:ek:] there. We know that such an element must exist:
            // When k == less, then el3 (which is equal to pivot) lies in the
            // interval. Otherwise a[k - 1] == pivot and the search stops at k-1.
            // Note that in the latter case invariant 2 will be violated for a
            // short amount of time. The invariant will be restored when the
            // pivots are put into their final positions.
            while (true) {
              var greatValue = f(a[great]);
              if (greatValue > pivotValue1) {
                great--;
                // This is the only location in the while-loop where a new
                // iteration is started.
                continue;
              } else if (greatValue < pivotValue1) {
                // Triple exchange.
                a[k] = a[less];
                a[less++] = a[great];
                a[great--] = ek;
                break;
              } else {
                a[k] = a[great];
                a[great--] = ek;
                // Note: if great < k then we will exit the outer loop and fix
                // invariant 2 (which we just violated).
                break;
              }
            }
          }
        }
      } else {

        // We partition the list into three parts:
        //  1. < pivot1
        //  2. >= pivot1 && <= pivot2
        //  3. > pivot2
        //
        // During the loop we have:
        // [ | < pivot1 | >= pivot1 && <= pivot2 | unpartitioned  | > pivot2  | ]
        //  ^            ^                        ^              ^             ^
        // left         less                     k              great        right
        //
        // a[left] and a[right] are undefined and are filled after the
        // partitioning.
        //
        // Invariants:
        //   1. for x in ]left, less[ : x < pivot1
        //   2. for x in [less, k[ : pivot1 <= x && x <= pivot2
        //   3. for x in ]great, right[ : x > pivot2
        for (var k = less; k <= great; k++) {
          var ek = a[k],
              xk = f(ek);
          if (xk < pivotValue1) {
            if (k !== less) {
              a[k] = a[less];
              a[less] = ek;
            }
            ++less;
          } else {
            if (xk > pivotValue2) {
              while (true) {
                var greatValue = f(a[great]);
                if (greatValue > pivotValue2) {
                  great--;
                  if (great < k) break;
                  // This is the only location inside the loop where a new
                  // iteration is started.
                  continue;
                } else {
                  // a[great] <= pivot2.
                  if (greatValue < pivotValue1) {
                    // Triple exchange.
                    a[k] = a[less];
                    a[less++] = a[great];
                    a[great--] = ek;
                  } else {
                    // a[great] >= pivot1.
                    a[k] = a[great];
                    a[great--] = ek;
                  }
                  break;
                }
              }
            }
          }
        }
      }

      // Move pivots into their final positions.
      // We shrunk the list from both sides (a[left] and a[right] have
      // meaningless values in them) and now we move elements from the first
      // and third partition into these locations so that we can store the
      // pivots.
      a[lo] = a[less - 1];
      a[less - 1] = pivot1;
      a[hi - 1] = a[great + 1];
      a[great + 1] = pivot2;

      // The list is now partitioned into three partitions:
      // [ < pivot1   | >= pivot1 && <= pivot2   |  > pivot2   ]
      //  ^            ^                        ^             ^
      // left         less                     great        right

      // Recursive descent. (Don't include the pivot values.)
      sort(a, lo, less - 1);
      sort(a, great + 2, hi);

      if (pivotsEqual) {
        // All elements in the second partition are equal to the pivot. No
        // need to sort them.
        return a;
      }

      // In theory it should be enough to call _doSort recursively on the second
      // partition.
      // The Android source however removes the pivot elements from the recursive
      // call if the second partition is too large (more than 2/3 of the list).
      if (less < i1 && great > i5) {
        var lessValue, greatValue;
        while ((lessValue = f(a[less])) <= pivotValue1 && lessValue >= pivotValue1) {
          ++less;
        }while ((greatValue = f(a[great])) <= pivotValue2 && greatValue >= pivotValue2) {
          --great;
        } // Copy paste of the previous 3-way partitioning with adaptions.
        //
        // We partition the list into three parts:
        //  1. == pivot1
        //  2. > pivot1 && < pivot2
        //  3. == pivot2
        //
        // During the loop we have:
        // [ == pivot1 | > pivot1 && < pivot2 | unpartitioned  | == pivot2 ]
        //              ^                      ^              ^
        //            less                     k              great
        //
        // Invariants:
        //   1. for x in [ *, less[ : x == pivot1
        //   2. for x in [less, k[ : pivot1 < x && x < pivot2
        //   3. for x in ]great, * ] : x == pivot2
        for (var k = less; k <= great; k++) {
          var ek = a[k],
              xk = f(ek);
          if (xk <= pivotValue1 && xk >= pivotValue1) {
            if (k !== less) {
              a[k] = a[less];
              a[less] = ek;
            }
            less++;
          } else {
            if (xk <= pivotValue2 && xk >= pivotValue2) {
              while (true) {
                var greatValue = f(a[great]);
                if (greatValue <= pivotValue2 && greatValue >= pivotValue2) {
                  great--;
                  if (great < k) break;
                  // This is the only location inside the loop where a new
                  // iteration is started.
                  continue;
                } else {
                  // a[great] < pivot2.
                  if (greatValue < pivotValue1) {
                    // Triple exchange.
                    a[k] = a[less];
                    a[less++] = a[great];
                    a[great--] = ek;
                  } else {
                    // a[great] == pivot1.
                    a[k] = a[great];
                    a[great--] = ek;
                  }
                  break;
                }
              }
            }
          }
        }
      }

      // The second partition has now been cleared of pivot elements and looks
      // as follows:
      // [  *  |  > pivot1 && < pivot2  | * ]
      //        ^                      ^
      //       less                  great
      // Sort the second partition using recursive descent.

      // The second partition looks as follows:
      // [  *  |  >= pivot1 && <= pivot2  | * ]
      //        ^                        ^
      //       less                    great
      // Simply sort it by recursive descent.

      return sort(a, less, great + 1);
    }

    return sort;
  }

  var quicksort_sizeThreshold = 32;
  var crossfilter_array8 = crossfilter_arrayUntyped,
      crossfilter_array16 = crossfilter_arrayUntyped,
      crossfilter_array32 = crossfilter_arrayUntyped,
      crossfilter_arrayLengthen = crossfilter_arrayLengthenUntyped,
      crossfilter_arrayWiden = crossfilter_arrayWidenUntyped;

  if (typeof Uint8Array !== "undefined") {
    crossfilter_array8 = function crossfilter_array8(n) {
      return new Uint8Array(n);
    };
    crossfilter_array16 = function crossfilter_array16(n) {
      return new Uint16Array(n);
    };
    crossfilter_array32 = function crossfilter_array32(n) {
      return new Uint32Array(n);
    };

    crossfilter_arrayLengthen = function crossfilter_arrayLengthen(array, length) {
      if (array.length >= length) return array;
      var copy = new array.constructor(length);
      copy.set(array);
      return copy;
    };

    crossfilter_arrayWiden = function crossfilter_arrayWiden(array, width) {
      var copy;
      switch (width) {
        case 16:
          copy = crossfilter_array16(array.length);break;
        case 32:
          copy = crossfilter_array32(array.length);break;
        default:
          throw new Error("invalid array width!");
      }
      copy.set(array);
      return copy;
    };
  }

  function crossfilter_arrayUntyped(n) {
    var array = new Array(n),
        i = -1;
    while (++i < n) {
      array[i] = 0;
    }return array;
  }

  function crossfilter_arrayLengthenUntyped(array, length) {
    var n = array.length;
    while (n < length) {
      array[n++] = 0;
    }return array;
  }

  function crossfilter_arrayWidenUntyped(array, width) {
    if (width > 32) throw new Error("invalid array width!");
    return array;
  }
  function crossfilter_filterExact(bisect, value) {
    return function (values) {
      var n = values.length;
      return [bisect.left(values, value, 0, n), bisect.right(values, value, 0, n)];
    };
  }

  function crossfilter_filterRange(bisect, range) {
    var min = range[0],
        max = range[1];
    return function (values) {
      var n = values.length;
      return [bisect.left(values, min, 0, n), bisect.left(values, max, 0, n)];
    };
  }

  function crossfilter_filterAll(values) {
    return [0, values.length];
  }
  function crossfilter_null() {
    return null;
  }
  function crossfilter_zero() {
    return 0;
  }
  function crossfilter_reduceIncrement(p) {
    return p + 1;
  }

  function crossfilter_reduceDecrement(p) {
    return p - 1;
  }

  function crossfilter_reduceAdd(f) {
    return function (p, v) {
      return p + +f(v);
    };
  }

  function crossfilter_reduceSubtract(f) {
    return function (p, v) {
      return p - f(v);
    };
  }
  exports.crossfilter = crossfilter;

  function crossfilter() {
    var crossfilter = {
      add: add,
      remove: removeData,
      dimension: dimension,
      groupAll: groupAll,
      size: size
    };

    var data = [],
        // the records
    n = 0,
        // the number of records; data.length
    m = 0,
        // a bit mask representing which dimensions are in use
    M = 8,
        // number of dimensions that can fit in `filters`
    filters = crossfilter_array8(0),
        // M bits per record; 1 is filtered out
    filterListeners = [],
        // when the filters change
    dataListeners = [],
        // when data is added
    removeDataListeners = []; // when data is removed

    // Adds the specified new records to this crossfilter.
    function add(newData) {
      var n0 = n,
          n1 = newData.length;

      // If there's actually new data to add…
      // Merge the new data into the existing data.
      // Lengthen the filter bitset to handle the new records.
      // Notify listeners (dimensions and groups) that new data is available.
      if (n1) {
        data = data.concat(newData);
        filters = crossfilter_arrayLengthen(filters, n += n1);
        dataListeners.forEach(function (l) {
          l(newData, n0, n1);
        });
      }

      return crossfilter;
    }

    // Removes all records that match the current filters.
    function removeData() {
      var newIndex = crossfilter_index(n, n),
          removed = [];
      for (var i = 0, j = 0; i < n; ++i) {
        if (filters[i]) newIndex[i] = j++;else removed.push(i);
      }

      // Remove all matching records from groups.
      filterListeners.forEach(function (l) {
        l(0, [], removed);
      });

      // Update indexes.
      removeDataListeners.forEach(function (l) {
        l(newIndex);
      });

      // Remove old filters and data by overwriting.
      for (var i = 0, j = 0, k; i < n; ++i) {
        if (k = filters[i]) {
          if (i !== j) filters[j] = k, data[j] = data[i];
          ++j;
        }
      }
      data.length = j;
      while (n > j) {
        filters[--n] = 0;
      }
    }

    // Adds a new dimension with the specified value accessor function.
    function dimension(value) {
      var dimension = {
        filter: filter,
        filterExact: filterExact,
        filterRange: filterRange,
        filterFunction: filterFunction,
        filterAll: filterAll,
        top: top,
        bottom: bottom,
        group: group,
        groupAll: groupAll,
        dispose: dispose,
        remove: dispose // for backwards-compatibility
      };

      var one = ~m & -~m,
          // lowest unset bit as mask, e.g., 00001000
      zero = ~one,
          // inverted one, e.g., 11110111
      values,
          // sorted, cached array
      index,
          // value rank ↦ object id
      newValues,
          // temporary array storing newly-added values
      newIndex,
          // temporary array storing newly-added index
      sort = quicksort_by(function (i) {
        return newValues[i];
      }),
          refilter = crossfilter_filterAll,
          // for recomputing filter
      refilterFunction,
          // the custom filter function in use
      indexListeners = [],
          // when data is added
      dimensionGroups = [],
          lo0 = 0,
          hi0 = 0;

      // Updating a dimension is a two-stage process. First, we must update the
      // associated filters for the newly-added records. Once all dimensions have
      // updated their filters, the groups are notified to update.
      dataListeners.unshift(preAdd);
      dataListeners.push(postAdd);

      removeDataListeners.push(removeData);

      // Incorporate any existing data into this dimension, and make sure that the
      // filter bitset is wide enough to handle the new dimension.
      m |= one;
      if (M >= 32 ? !one : m & -(1 << M)) {
        filters = crossfilter_arrayWiden(filters, M <<= 1);
      }
      preAdd(data, 0, n);
      postAdd(data, 0, n);

      // Incorporates the specified new records into this dimension.
      // This function is responsible for updating filters, values, and index.
      function preAdd(newData, n0, n1) {

        // Permute new values into natural order using a sorted index.
        newValues = newData.map(value);
        newIndex = sort(crossfilter_range(n1), 0, n1);
        newValues = permute(newValues, newIndex);

        // Bisect newValues to determine which new records are selected.
        var bounds = refilter(newValues),
            lo1 = bounds[0],
            hi1 = bounds[1],
            i;
        if (refilterFunction) {
          for (i = 0; i < n1; ++i) {
            if (!refilterFunction(newValues[i], i)) filters[newIndex[i] + n0] |= one;
          }
        } else {
          for (i = 0; i < lo1; ++i) {
            filters[newIndex[i] + n0] |= one;
          }for (i = hi1; i < n1; ++i) {
            filters[newIndex[i] + n0] |= one;
          }
        }

        // If this dimension previously had no data, then we don't need to do the
        // more expensive merge operation; use the new values and index as-is.
        if (!n0) {
          values = newValues;
          index = newIndex;
          lo0 = lo1;
          hi0 = hi1;
          return;
        }

        var oldValues = values,
            oldIndex = index,
            i0 = 0,
            i1 = 0;

        // Otherwise, create new arrays into which to merge new and old.
        values = new Array(n);
        index = crossfilter_index(n, n);

        // Merge the old and new sorted values, and old and new index.
        for (i = 0; i0 < n0 && i1 < n1; ++i) {
          if (oldValues[i0] < newValues[i1]) {
            values[i] = oldValues[i0];
            index[i] = oldIndex[i0++];
          } else {
            values[i] = newValues[i1];
            index[i] = newIndex[i1++] + n0;
          }
        }

        // Add any remaining old values.
        for (; i0 < n0; ++i0, ++i) {
          values[i] = oldValues[i0];
          index[i] = oldIndex[i0];
        }

        // Add any remaining new values.
        for (; i1 < n1; ++i1, ++i) {
          values[i] = newValues[i1];
          index[i] = newIndex[i1] + n0;
        }

        // Bisect again to recompute lo0 and hi0.
        bounds = refilter(values), lo0 = bounds[0], hi0 = bounds[1];
      }

      // When all filters have updated, notify index listeners of the new values.
      function postAdd(newData, n0, n1) {
        indexListeners.forEach(function (l) {
          l(newValues, newIndex, n0, n1);
        });
        newValues = newIndex = null;
      }

      function removeData(reIndex) {
        for (var i = 0, j = 0, k; i < n; ++i) {
          if (filters[k = index[i]]) {
            if (i !== j) values[j] = values[i];
            index[j] = reIndex[k];
            ++j;
          }
        }
        values.length = j;
        while (j < n) {
          index[j++] = 0;
        } // Bisect again to recompute lo0 and hi0.
        var bounds = refilter(values);
        lo0 = bounds[0], hi0 = bounds[1];
      }

      // Updates the selected values based on the specified bounds [lo, hi].
      // This implementation is used by all the public filter methods.
      function filterIndexBounds(bounds) {
        var lo1 = bounds[0],
            hi1 = bounds[1];

        if (refilterFunction) {
          refilterFunction = null;
          filterIndexFunction(function (d, i) {
            return lo1 <= i && i < hi1;
          });
          lo0 = lo1;
          hi0 = hi1;
          return dimension;
        }

        var i,
            j,
            k,
            added = [],
            removed = [];

        // Fast incremental update based on previous lo index.
        if (lo1 < lo0) {
          for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
            filters[k = index[i]] ^= one;
            added.push(k);
          }
        } else if (lo1 > lo0) {
          for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
            filters[k = index[i]] ^= one;
            removed.push(k);
          }
        }

        // Fast incremental update based on previous hi index.
        if (hi1 > hi0) {
          for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
            filters[k = index[i]] ^= one;
            added.push(k);
          }
        } else if (hi1 < hi0) {
          for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
            filters[k = index[i]] ^= one;
            removed.push(k);
          }
        }

        lo0 = lo1;
        hi0 = hi1;
        filterListeners.forEach(function (l) {
          l(one, added, removed);
        });
        return dimension;
      }

      // Filters this dimension using the specified range, value, or null.
      // If the range is null, this is equivalent to filterAll.
      // If the range is an array, this is equivalent to filterRange.
      // Otherwise, this is equivalent to filterExact.
      function filter(range) {
        return range == null ? filterAll() : Array.isArray(range) ? filterRange(range) : typeof range === "function" ? filterFunction(range) : filterExact(range);
      }

      // Filters this dimension to select the exact value.
      function filterExact(value) {
        return filterIndexBounds((refilter = crossfilter_filterExact(bisect, value))(values));
      }

      // Filters this dimension to select the specified range [lo, hi].
      // The lower bound is inclusive, and the upper bound is exclusive.
      function filterRange(range) {
        return filterIndexBounds((refilter = crossfilter_filterRange(bisect, range))(values));
      }

      // Clears any filters on this dimension.
      function filterAll() {
        return filterIndexBounds((refilter = crossfilter_filterAll)(values));
      }

      // Filters this dimension using an arbitrary function.
      function filterFunction(f) {
        refilter = crossfilter_filterAll;

        filterIndexFunction(refilterFunction = f);

        lo0 = 0;
        hi0 = n;

        return dimension;
      }

      function filterIndexFunction(f) {
        var i,
            k,
            x,
            added = [],
            removed = [];

        for (i = 0; i < n; ++i) {
          if (!(filters[k = index[i]] & one) ^ !!(x = f(values[i], i))) {
            if (x) filters[k] &= zero, added.push(k);else filters[k] |= one, removed.push(k);
          }
        }
        filterListeners.forEach(function (l) {
          l(one, added, removed);
        });
      }

      // Returns the top K selected records based on this dimension's order.
      // Note: observes this dimension's filter, unlike group and groupAll.
      function top(k) {
        var array = [],
            i = hi0,
            j;

        while (--i >= lo0 && k > 0) {
          if (!filters[j = index[i]]) {
            array.push(data[j]);
            --k;
          }
        }

        return array;
      }

      // Returns the bottom K selected records based on this dimension's order.
      // Note: observes this dimension's filter, unlike group and groupAll.
      function bottom(k) {
        var array = [],
            i = lo0,
            j;

        while (i < hi0 && k > 0) {
          if (!filters[j = index[i]]) {
            array.push(data[j]);
            --k;
          }
          i++;
        }

        return array;
      }

      // Adds a new group to this dimension, using the specified key function.
      function group(key) {
        var group = {
          top: top,
          all: all,
          reduce: reduce,
          reduceCount: reduceCount,
          reduceSum: reduceSum,
          order: order,
          orderNatural: orderNatural,
          size: size,
          dispose: dispose,
          remove: dispose // for backwards-compatibility
        };

        // Ensure that this group will be removed when the dimension is removed.
        dimensionGroups.push(group);

        var groups,
            // array of {key, value}
        groupIndex,
            // object id ↦ group id
        groupWidth = 8,
            groupCapacity = crossfilter_capacity(groupWidth),
            k = 0,
            // cardinality
        select,
            heap,
            reduceAdd,
            reduceRemove,
            reduceInitial,
            update = crossfilter_null,
            reset = crossfilter_null,
            resetNeeded = true,
            groupAll = key === crossfilter_null;

        if (arguments.length < 1) key = crossfilter_identity;

        // The group listens to the crossfilter for when any dimension changes, so
        // that it can update the associated reduce values. It must also listen to
        // the parent dimension for when data is added, and compute new keys.
        filterListeners.push(update);
        indexListeners.push(add);
        removeDataListeners.push(removeData);

        // Incorporate any existing data into the grouping.
        add(values, index, 0, n);

        // Incorporates the specified new values into this group.
        // This function is responsible for updating groups and groupIndex.
        function add(newValues, newIndex, n0, n1) {
          var oldGroups = groups,
              reIndex = crossfilter_index(k, groupCapacity),
              add = reduceAdd,
              initial = reduceInitial,
              k0 = k,
              // old cardinality
          i0 = 0,
              // index of old group
          i1 = 0,
              // index of new record
          j,
              // object id
          g0,
              // old group
          x0,
              // old key
          x1,
              // new key
          g,
              // group to add
          x; // key of group to add

          // If a reset is needed, we don't need to update the reduce values.
          if (resetNeeded) add = initial = crossfilter_null;

          // Reset the new groups (k is a lower bound).
          // Also, make sure that groupIndex exists and is long enough.
          groups = new Array(k), k = 0;
          groupIndex = k0 > 1 ? crossfilter_arrayLengthen(groupIndex, n) : crossfilter_index(n, groupCapacity);

          // Get the first old key (x0 of g0), if it exists.
          if (k0) x0 = (g0 = oldGroups[0]).key;

          // Find the first new key (x1), skipping NaN keys.
          while (i1 < n1 && !((x1 = key(newValues[i1])) >= x1)) {
            ++i1;
          } // While new keys remain…
          while (i1 < n1) {

            // Determine the lesser of the two current keys; new and old.
            // If there are no old keys remaining, then always add the new key.
            if (g0 && x0 <= x1) {
              g = g0, x = x0;

              // Record the new index of the old group.
              reIndex[i0] = k;

              // Retrieve the next old key.
              if (g0 = oldGroups[++i0]) x0 = g0.key;
            } else {
              g = { key: x1, value: initial() }, x = x1;
            }

            // Add the lesser group.
            groups[k] = g;

            // Add any selected records belonging to the added group, while
            // advancing the new key and populating the associated group index.
            while (!(x1 > x)) {
              groupIndex[j = newIndex[i1] + n0] = k;
              if (!(filters[j] & zero)) g.value = add(g.value, data[j]);
              if (++i1 >= n1) break;
              x1 = key(newValues[i1]);
            }

            groupIncrement();
          }

          // Add any remaining old groups that were greater than all new keys.
          // No incremental reduce is needed; these groups have no new records.
          // Also record the new index of the old group.
          while (i0 < k0) {
            groups[reIndex[i0] = k] = oldGroups[i0++];
            groupIncrement();
          }

          // If we added any new groups before any old groups,
          // update the group index of all the old records.
          if (k > i0) for (i0 = 0; i0 < n0; ++i0) {
            groupIndex[i0] = reIndex[groupIndex[i0]];
          }

          // Modify the update and reset behavior based on the cardinality.
          // If the cardinality is less than or equal to one, then the groupIndex
          // is not needed. If the cardinality is zero, then there are no records
          // and therefore no groups to update or reset. Note that we also must
          // change the registered listener to point to the new method.
          j = filterListeners.indexOf(update);
          if (k > 1) {
            update = updateMany;
            reset = resetMany;
          } else {
            if (!k && groupAll) {
              k = 1;
              groups = [{ key: null, value: initial() }];
            }
            if (k === 1) {
              update = updateOne;
              reset = resetOne;
            } else {
              update = crossfilter_null;
              reset = crossfilter_null;
            }
            groupIndex = null;
          }
          filterListeners[j] = update;

          // Count the number of added groups,
          // and widen the group index as needed.
          function groupIncrement() {
            if (++k === groupCapacity) {
              reIndex = crossfilter_arrayWiden(reIndex, groupWidth <<= 1);
              groupIndex = crossfilter_arrayWiden(groupIndex, groupWidth);
              groupCapacity = crossfilter_capacity(groupWidth);
            }
          }
        }

        function removeData() {
          if (k > 1) {
            var oldK = k,
                oldGroups = groups,
                seenGroups = crossfilter_index(oldK, oldK);

            // Filter out non-matches by copying matching group index entries to
            // the beginning of the array.
            for (var i = 0, j = 0; i < n; ++i) {
              if (filters[i]) {
                seenGroups[groupIndex[j] = groupIndex[i]] = 1;
                ++j;
              }
            }

            // Reassemble groups including only those groups that were referred
            // to by matching group index entries.  Note the new group index in
            // seenGroups.
            groups = [], k = 0;
            for (i = 0; i < oldK; ++i) {
              if (seenGroups[i]) {
                seenGroups[i] = k++;
                groups.push(oldGroups[i]);
              }
            }

            if (k > 1) {
              // Reindex the group index using seenGroups to find the new index.
              for (var i = 0; i < j; ++i) {
                groupIndex[i] = seenGroups[groupIndex[i]];
              }
            } else {
              groupIndex = null;
            }
            filterListeners[filterListeners.indexOf(update)] = k > 1 ? (reset = resetMany, update = updateMany) : k === 1 ? (reset = resetOne, update = updateOne) : reset = update = crossfilter_null;
          } else if (k === 1) {
            if (groupAll) return;
            for (var i = 0; i < n; ++i) {
              if (filters[i]) return;
            }groups = [], k = 0;
            filterListeners[filterListeners.indexOf(update)] = update = reset = crossfilter_null;
          }
        }

        // Reduces the specified selected or deselected records.
        // This function is only used when the cardinality is greater than 1.
        function updateMany(filterOne, added, removed) {
          if (filterOne === one || resetNeeded) return;

          var i, k, n, g;

          // Add the added values.
          for (i = 0, n = added.length; i < n; ++i) {
            if (!(filters[k = added[i]] & zero)) {
              g = groups[groupIndex[k]];
              g.value = reduceAdd(g.value, data[k]);
            }
          }

          // Remove the removed values.
          for (i = 0, n = removed.length; i < n; ++i) {
            if ((filters[k = removed[i]] & zero) === filterOne) {
              g = groups[groupIndex[k]];
              g.value = reduceRemove(g.value, data[k]);
            }
          }
        }

        // Reduces the specified selected or deselected records.
        // This function is only used when the cardinality is 1.
        function updateOne(filterOne, added, removed) {
          if (filterOne === one || resetNeeded) return;

          var i,
              k,
              n,
              g = groups[0];

          // Add the added values.
          for (i = 0, n = added.length; i < n; ++i) {
            if (!(filters[k = added[i]] & zero)) {
              g.value = reduceAdd(g.value, data[k]);
            }
          }

          // Remove the removed values.
          for (i = 0, n = removed.length; i < n; ++i) {
            if ((filters[k = removed[i]] & zero) === filterOne) {
              g.value = reduceRemove(g.value, data[k]);
            }
          }
        }

        // Recomputes the group reduce values from scratch.
        // This function is only used when the cardinality is greater than 1.
        function resetMany() {
          var i, g;

          // Reset all group values.
          for (i = 0; i < k; ++i) {
            groups[i].value = reduceInitial();
          }

          // Add any selected records.
          for (i = 0; i < n; ++i) {
            if (!(filters[i] & zero)) {
              g = groups[groupIndex[i]];
              g.value = reduceAdd(g.value, data[i]);
            }
          }
        }

        // Recomputes the group reduce values from scratch.
        // This function is only used when the cardinality is 1.
        function resetOne() {
          var i,
              g = groups[0];

          // Reset the singleton group values.
          g.value = reduceInitial();

          // Add any selected records.
          for (i = 0; i < n; ++i) {
            if (!(filters[i] & zero)) {
              g.value = reduceAdd(g.value, data[i]);
            }
          }
        }

        // Returns the array of group values, in the dimension's natural order.
        function all() {
          if (resetNeeded) reset(), resetNeeded = false;
          return groups;
        }

        // Returns a new array containing the top K group values, in reduce order.
        function top(k) {
          var top = select(all(), 0, groups.length, k);
          return heap.sort(top, 0, top.length);
        }

        // Sets the reduce behavior for this group to use the specified functions.
        // This method lazily recomputes the reduce values, waiting until needed.
        function reduce(add, remove, initial) {
          reduceAdd = add;
          reduceRemove = remove;
          reduceInitial = initial;
          resetNeeded = true;
          return group;
        }

        // A convenience method for reducing by count.
        function reduceCount() {
          return reduce(crossfilter_reduceIncrement, crossfilter_reduceDecrement, crossfilter_zero);
        }

        // A convenience method for reducing by sum(value).
        function reduceSum(value) {
          return reduce(crossfilter_reduceAdd(value), crossfilter_reduceSubtract(value), crossfilter_zero);
        }

        // Sets the reduce order, using the specified accessor.
        function order(value) {
          select = heapselect_by(valueOf);
          heap = heap_by(valueOf);
          function valueOf(d) {
            return value(d.value);
          }
          return group;
        }

        // A convenience method for natural ordering by reduce value.
        function orderNatural() {
          return order(crossfilter_identity);
        }

        // Returns the cardinality of this group, irrespective of any filters.
        function size() {
          return k;
        }

        // Removes this group and associated event listeners.
        function dispose() {
          var i = filterListeners.indexOf(update);
          if (i >= 0) filterListeners.splice(i, 1);
          i = indexListeners.indexOf(add);
          if (i >= 0) indexListeners.splice(i, 1);
          i = removeDataListeners.indexOf(removeData);
          if (i >= 0) removeDataListeners.splice(i, 1);
          return group;
        }

        return reduceCount().orderNatural();
      }

      // A convenience function for generating a singleton group.
      function groupAll() {
        var g = group(crossfilter_null),
            all = g.all;
        delete g.all;
        delete g.top;
        delete g.order;
        delete g.orderNatural;
        delete g.size;
        g.value = function () {
          return all()[0].value;
        };
        return g;
      }

      // Removes this dimension and associated groups and event listeners.
      function dispose() {
        dimensionGroups.forEach(function (group) {
          group.dispose();
        });
        var i = dataListeners.indexOf(preAdd);
        if (i >= 0) dataListeners.splice(i, 1);
        i = dataListeners.indexOf(postAdd);
        if (i >= 0) dataListeners.splice(i, 1);
        i = removeDataListeners.indexOf(removeData);
        if (i >= 0) removeDataListeners.splice(i, 1);
        m &= zero;
        return filterAll();
      }

      return dimension;
    }

    // A convenience method for groupAll on a dummy dimension.
    // This implementation can be optimized since it always has cardinality 1.
    function groupAll() {
      var group = {
        reduce: reduce,
        reduceCount: reduceCount,
        reduceSum: reduceSum,
        value: value,
        dispose: dispose,
        remove: dispose // for backwards-compatibility
      };

      var reduceValue,
          reduceAdd,
          reduceRemove,
          reduceInitial,
          resetNeeded = true;

      // The group listens to the crossfilter for when any dimension changes, so
      // that it can update the reduce value. It must also listen to the parent
      // dimension for when data is added.
      filterListeners.push(update);
      dataListeners.push(add);

      // For consistency; actually a no-op since resetNeeded is true.
      add(data, 0, n);

      // Incorporates the specified new values into this group.
      function add(newData, n0) {
        var i;

        if (resetNeeded) return;

        // Add the added values.
        for (i = n0; i < n; ++i) {
          if (!filters[i]) {
            reduceValue = reduceAdd(reduceValue, data[i]);
          }
        }
      }

      // Reduces the specified selected or deselected records.
      function update(filterOne, added, removed) {
        var i, k, n;

        if (resetNeeded) return;

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (!filters[k = added[i]]) {
            reduceValue = reduceAdd(reduceValue, data[k]);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if (filters[k = removed[i]] === filterOne) {
            reduceValue = reduceRemove(reduceValue, data[k]);
          }
        }
      }

      // Recomputes the group reduce value from scratch.
      function reset() {
        var i;

        reduceValue = reduceInitial();

        for (i = 0; i < n; ++i) {
          if (!filters[i]) {
            reduceValue = reduceAdd(reduceValue, data[i]);
          }
        }
      }

      // Sets the reduce behavior for this group to use the specified functions.
      // This method lazily recomputes the reduce value, waiting until needed.
      function reduce(add, remove, initial) {
        reduceAdd = add;
        reduceRemove = remove;
        reduceInitial = initial;
        resetNeeded = true;
        return group;
      }

      // A convenience method for reducing by count.
      function reduceCount() {
        return reduce(crossfilter_reduceIncrement, crossfilter_reduceDecrement, crossfilter_zero);
      }

      // A convenience method for reducing by sum(value).
      function reduceSum(value) {
        return reduce(crossfilter_reduceAdd(value), crossfilter_reduceSubtract(value), crossfilter_zero);
      }

      // Returns the computed reduce value.
      function value() {
        if (resetNeeded) reset(), resetNeeded = false;
        return reduceValue;
      }

      // Removes this group and associated event listeners.
      function dispose() {
        var i = filterListeners.indexOf(update);
        if (i >= 0) filterListeners.splice(i);
        i = dataListeners.indexOf(add);
        if (i >= 0) dataListeners.splice(i);
        return group;
      }

      return reduceCount();
    }

    // Returns the number of records in this crossfilter, irrespective of any filters.
    function size() {
      return n;
    }

    return arguments.length ? add(arguments[0]) : crossfilter;
  }

  // Returns an array of size n, big enough to store ids up to m.
  function crossfilter_index(n, m) {
    return (m < 0x101 ? crossfilter_array8 : m < 0x10001 ? crossfilter_array16 : crossfilter_array32)(n);
  }

  // Constructs a new array of size n, with sequential values from 0 to n - 1.
  function crossfilter_range(n) {
    var range = crossfilter_index(n, n);
    for (var i = -1; ++i < n;) {
      range[i] = i;
    }return range;
  }

  function crossfilter_capacity(w) {
    return w === 8 ? 0x100 : w === 16 ? 0x10000 : 0x100000000;
  }
})(typeof exports !== 'undefined' && exports || commonjsGlobal);
});

var index = crossfilter$1.crossfilter;

var dataCount = 0;

var dataEvents = dispatch$6('init', 'data');

var providerProto = {
    init: function init() {},
    size: function size() {
        return this.cf.size();
    },
    load: function load() {},
    data: function data(cfg, _data) {
        if (arguments.length === 2) return this.add(_data);else {
            var self$$1 = this;
            _data = this.load();
            if (isPromise$2(_data)) return _data.then(function (d) {
                self$$1.data(cfg, d);
            });
            return this.data(cfg, _data);
        }
    },


    // add data to the serie
    add: function add(data) {
        if (!data) return this;
        var size = this.size();
        data = data.map(function (entry) {
            if ((typeof entry === 'undefined' ? 'undefined' : _typeof(entry)) === 'object') entry._id = ++size;else entry = { _id: ++size, data: entry };
            return entry;
        });
        this.cf.add(data);
        dataEvents.call('data', this, data);
        return this;
    }
};

// Data providers container
var providers$3 = assign$4(map$10(), {
    events: dataEvents,

    add: function add(type, provider) {

        function Provider(store, config) {
            initProvider(this, type, store, config);
        }

        Provider.prototype = assign$4({}, providerProto, provider);

        this.set(type, Provider);
        return Provider;
    },


    // Create a provider for a dataStore
    create: function create(store, config) {
        var providers = this.values(),
            cfg;
        for (var i = 0; i < providers.length; ++i) {
            cfg = providers[i].prototype.init(config);
            if (cfg) return new providers[i](store, cfg);
        }
    }
});

function initProvider(provider, type, store, config) {

    var name = dataName(store, pop$3(config, 'name')),
        cf = index();

    provider.natural = cf.dimension(function (d) {
        return d._id;
    });

    Object.defineProperties(provider, {
        cf: {
            get: function get() {
                return cf;
            }
        },
        name: {
            get: function get() {
                return name;
            }
        },
        store: {
            get: function get() {
                return store;
            }
        },
        type: {
            get: function get() {
                return type;
            }
        },
        config: {
            get: function get() {
                return config;
            }
        }
    });

    store.series.set(name, provider);

    dataEvents.call('init', provider, config);
    provider.data();
}

function dataName(store, name) {
    ++dataCount;
    if (name) return '' + name;
    var def = store.serie('default');
    if (!def) return 'default';
    return 'serie' + dataCount;
}

function DataStore(model) {
    var series = map$10();

    Object.defineProperties(this, {
        series: {
            get: function get() {
                return series;
            }
        }
    });

    this.model = model;
}

DataStore.prototype = {
    size: function size() {
        return this.series.size();
    },


    // Add a new serie from a provider
    add: function add(config) {
        return providers$3.create(this, config);
    },


    // set, get or remove a data provider
    serie: function serie(name, _serie) {
        if (arguments.length === 1) return this.series.get(name);
        if (_serie === null) {
            var p = this.series.get(name);
            this.series.remove(name);
            return p;
        }
        this.series.set(name, _serie);
        return this;
    },
    getList: function getList(name, params) {
        var serie = this.series.get(name),
            result = serie ? serie.getList(params) : [];

        if (!isPromise$2(result)) {
            result = new Promise(function (resolve) {
                resolve(result);
            });
            if (!serie) {
                warn$2('Serie "' + name + ' not available');
                return result;
            }
        }

        return result.then(function (data) {
            if (!isArray$2(data)) {
                warn$2('Excepted an array, got ' + (typeof data === 'undefined' ? 'undefined' : _typeof(data)));
                data = [];
            }
            serie.add(data);
            return data;
        });
    }
};

var arrayDataProvider = {
    init: function init(config) {
        if (isArray$2(config)) return { data: config };else if (isObject$2(config) && isArray$2(config.data)) return config;
    },
    load: function load() {
        return pop$3(this.config, 'data');
    }
};

var schemes = ['http', 'https', 'ws', 'wss'];

var isUrl = function (value) {
    return isString$2(value) && schemes.indexOf(value.split('://')[0]) > -1;
};

var remoteDataProvider = {
    init: function init(config) {
        if (isUrl(config)) return { url: config };else if (isObject$2(config) && config.url) return config;
    },
    load: function load() {
        var fetch = viewProviders.fetch;
        if (!fetch) {
            warn$2('fetch provider not available, cannot submit');
            return;
        }
        return fetch(this.url);
    }
};

var expressionDataProvider = {
    init: function init(config) {
        var opts;
        if (isUrl(config)) return;else if (isString$2(config)) return { expression: config };else if (isObject$2(config) && config.type === 'expression') return config;
        opts = config;
        if (opts) {
            this.name = opts.name || this.dataName();
            this.expression = viewExpression$1(opts.expression);
            return this;
        }
    },
    load: function load() {
        if (!this.expression) this.expression = viewExpression$1(this.config.expression);
        var model = this.store.model;
        return this.expression.eval(model);
    }
};

var random = function (size) {
    var serie = [];
    for (var i = 0; i < size; ++i) {
        var o = {};
        for (var j = 1; j < arguments.length; ++j) {
            o[arguments[j]] = Math.random();
        }
        serie.push(o);
    }
    return serie;
};

var ascending$5 = function (a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
};

var bisector$1 = function (compare) {
  if (compare.length === 1) compare = ascendingComparator$1(compare);
  return {
    left: function left(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;else hi = mid;
      }
      return lo;
    },
    right: function right(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;else lo = mid + 1;
      }
      return lo;
    }
  };
};

function ascendingComparator$1(f) {
  return function (d, x) {
    return ascending$5(f(d), x);
  };
}

var ascendingBisect$1 = bisector$1(ascending$5);
var bisectRight$1 = ascendingBisect$1.right;

var number$3 = function (x) {
  return x === null ? NaN : +x;
};

var extent$1 = function (array, f) {
  var i = -1,
      n = array.length,
      a,
      b,
      c;

  if (f == null) {
    while (++i < n) {
      if ((b = array[i]) != null && b >= b) {
        a = c = b;break;
      }
    }while (++i < n) {
      if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
  } else {
    while (++i < n) {
      if ((b = f(array[i], i, array)) != null && b >= b) {
        a = c = b;break;
      }
    }while (++i < n) {
      if ((b = f(array[i], i, array)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
  }

  return [a, c];
};

var array$5 = Array.prototype;

var slice$4 = array$5.slice;
var map$18 = array$5.map;

var constant$10 = function (x) {
  return function () {
    return x;
  };
};

var identity$8 = function (x) {
  return x;
};

var sequence$1 = function (start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
};

var e10$1 = Math.sqrt(50);
var e5$1 = Math.sqrt(10);
var e2$1 = Math.sqrt(2);

var ticks$1 = function (start, stop, count) {
  var step = tickStep$1(start, stop, count);
  return sequence$1(Math.ceil(start / step) * step, Math.floor(stop / step) * step + step / 2, // inclusive
  step);
};

function tickStep$1(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10$1) step1 *= 10;else if (error >= e5$1) step1 *= 5;else if (error >= e2$1) step1 *= 2;
  return stop < start ? -step1 : step1;
}

var sturges$1 = function (values) {
  return Math.ceil(Math.log(values.length) / Math.LN2) + 1;
};

var threshold$2 = function (array, p, f) {
  if (f == null) f = number$3;
  if (!(n = array.length)) return;
  if ((p = +p) <= 0 || n < 2) return +f(array[0], 0, array);
  if (p >= 1) return +f(array[n - 1], n - 1, array);
  var n,
      h = (n - 1) * p,
      i = Math.floor(h),
      a = +f(array[i], i, array),
      b = +f(array[i + 1], i + 1, array);
  return a + (b - a) * (h - i);
};

var min$3 = function (array, f) {
  var i = -1,
      n = array.length,
      a,
      b;

  if (f == null) {
    while (++i < n) {
      if ((b = array[i]) != null && b >= b) {
        a = b;break;
      }
    }while (++i < n) {
      if ((b = array[i]) != null && a > b) a = b;
    }
  } else {
    while (++i < n) {
      if ((b = f(array[i], i, array)) != null && b >= b) {
        a = b;break;
      }
    }while (++i < n) {
      if ((b = f(array[i], i, array)) != null && a > b) a = b;
    }
  }

  return a;
};

function length$2(d) {
  return d.length;
}

var normal$1 = function (mu, sigma) {
  var x, r;
  mu = mu == null ? 0 : +mu;
  sigma = sigma == null ? 1 : +sigma;
  return function () {
    var y;

    // If available, use the second previously-generated uniform random.
    if (x != null) y = x, x = null;

    // Otherwise, generate a new x and y.
    else do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        r = x * x + y * y;
      } while (!r || r > 1);

    return mu + sigma * y * Math.sqrt(-2 * Math.log(r) / r);
  };
};

var defaults$1 = {
    sigma: 0.1,
    drift: 0
};

var randomPath = function (size, options) {
    options = assign$4({}, defaults$1, options);
    var t = sequence$1(0, +size, 1),
        S = options.sigma,
        drift = options.drift,
        data = [{ x: 0, y: 0 }],
        norm = normal$1(0, 1),
        dx;

    for (var i = 1; i < t.length; i++) {
        dx = drift + S * norm();
        data[i] = {
            x: i,
            y: data[i - 1].y + dx
        };
    }

    return data;
};

// Create a new fluidStore
// If the view-model is given, check if a store is already available
function fluidStore(model) {
    if (model instanceof DataStore) return model;
    var store, vm;
    if (model && model.isd3) {
        vm = model.root;
        model = vm.model;
        store = vm._fluidStore;
        if (store) return store;
    }
    store = new DataStore(model);
    if (vm) vm._fluidStore = store;
    return store;
}

fluidStore.prototype = DataStore.prototype;
fluidStore.providers = providers$3;
fluidStore.events = providers$3.events;
fluidStore.random = random;
fluidStore.randomPath = randomPath;

providers$3.add('array', arrayDataProvider);
providers$3.add('remote', remoteDataProvider);
providers$3.add('expression', expressionDataProvider);

var xhtml$3 = "http://www.w3.org/1999/xhtml";

var namespaces$3 = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml$3,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace$4 = function (name) {
  var prefix = name += "",
      i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces$3.hasOwnProperty(prefix) ? { space: namespaces$3[prefix], local: name } : name;
};

function creatorInherit$3(name) {
  return function () {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml$3 && document.documentElement.namespaceURI === xhtml$3 ? document.createElement(name) : document.createElementNS(uri, name);
  };
}

function creatorFixed$3(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator$3 = function (name) {
  var fullname = namespace$4(name);
  return (fullname.local ? creatorFixed$3 : creatorInherit$3)(fullname);
};

var nextId$3 = 0;

var matcher$6 = function matcher$6(selector) {
  return function () {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element$8 = document.documentElement;
  if (!element$8.matches) {
    var vendorMatches$3 = element$8.webkitMatchesSelector || element$8.msMatchesSelector || element$8.mozMatchesSelector || element$8.oMatchesSelector;
    matcher$6 = function matcher$6(selector) {
      return function () {
        return vendorMatches$3.call(this, selector);
      };
    };
  }
}

var matcher$7 = matcher$6;

var filterEvents$3 = {};

var event$3 = null;

if (typeof document !== "undefined") {
  var element$9 = document.documentElement;
  if (!("onmouseenter" in element$9)) {
    filterEvents$3 = { mouseenter: "mouseover", mouseleave: "mouseout" };
  }
}

function filterContextListener$3(listener, index, group) {
  listener = contextListener$3(listener, index, group);
  return function (event) {
    var related = event.relatedTarget;
    if (!related || related !== this && !(related.compareDocumentPosition(this) & 8)) {
      listener.call(this, event);
    }
  };
}

function contextListener$3(listener, index, group) {
  return function (event1) {
    var event0 = event$3; // Events can be reentrant (e.g., focus).
    event$3 = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event$3 = event0;
    }
  };
}

function parseTypenames$7(typenames) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name: name };
  });
}

function onRemove$3(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;else delete this.__on;
  };
}

function onAdd$3(typename, value, capture) {
  var wrap = filterEvents$3.hasOwnProperty(typename.type) ? filterContextListener$3 : contextListener$3;
  return function (d, i, group) {
    var on = this.__on,
        o,
        listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = { type: typename.type, name: typename.name, value: value, listener: listener, capture: capture };
    if (!on) this.__on = [o];else on.push(o);
  };
}

var selection_on$3 = function (typename, value, capture) {
  var typenames = parseTypenames$7(typename + ""),
      i,
      n = typenames.length,
      t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd$3 : onRemove$3;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) {
    this.each(on(typenames[i], value, capture));
  }return this;
};

var sourceEvent$3 = function () {
  var current = event$3,
      source;
  while (source = current.sourceEvent) {
    current = source;
  }return current;
};

var point$5 = function (node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
};

function none$5() {}

var selector$3 = function (selector) {
  return selector == null ? none$5 : function () {
    return this.querySelector(selector);
  };
};

var selection_select$3 = function (select) {
  if (typeof select !== "function") select = selector$3(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$6(subgroups, this._parents);
};

function empty$4() {
  return [];
}

var selectorAll$3 = function (selector) {
  return selector == null ? empty$4 : function () {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll$3 = function (select) {
  if (typeof select !== "function") select = selectorAll$3(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$6(subgroups, parents);
};

var selection_filter$3 = function (match) {
  if (typeof match !== "function") match = matcher$7(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$6(subgroups, this._parents);
};

var sparse$3 = function (update) {
  return new Array(update.length);
};

var selection_enter$3 = function () {
  return new Selection$6(this._enter || this._groups.map(sparse$3), this._parents);
};

function EnterNode$3(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode$3.prototype = {
  constructor: EnterNode$3,
  appendChild: function appendChild(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function insertBefore(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function querySelector(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function querySelectorAll(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

var constant$11 = function (x) {
  return function () {
    return x;
  };
};

var keyPrefix$3 = "$"; // Protect against keys like “__proto__”.

function bindIndex$3(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode$3(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey$3(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix$3 + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix$3 + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode$3(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue[keyValues[i]] === node) {
      exit[i] = node;
    }
  }
}

var selection_data$3 = function (value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function (d) {
      data[++j] = d;
    });
    return data;
  }

  var bind = key ? bindKey$3 : bindIndex$3,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$11(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) {}
        previous._next = next || null;
      }
    }
  }

  update = new Selection$6(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit$3 = function () {
  return new Selection$6(this._exit || this._groups.map(sparse$3), this._parents);
};

var selection_merge$3 = function (selection) {

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$6(merges, this._parents);
};

var selection_order$3 = function () {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
};

var selection_sort$3 = function (compare) {
  if (!compare) compare = ascending$6;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$6(sortgroups, this._parents).order();
};

function ascending$6(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call$3 = function () {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes$3 = function () {
  var nodes = new Array(this.size()),
      i = -1;
  this.each(function () {
    nodes[++i] = this;
  });
  return nodes;
};

var selection_node$3 = function () {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
};

var selection_size$3 = function () {
  var size = 0;
  this.each(function () {
    ++size;
  });
  return size;
};

var selection_empty$3 = function () {
  return !this.node();
};

var selection_each$3 = function (callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
};

function attrRemove$6(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$6(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$6(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$6(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$6(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);else this.setAttribute(name, v);
  };
}

function attrFunctionNS$6(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

var selection_attr$3 = function (name, value) {
  var fullname = namespace$4(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }

  return this.each((value == null ? fullname.local ? attrRemoveNS$6 : attrRemove$6 : typeof value === "function" ? fullname.local ? attrFunctionNS$6 : attrFunction$6 : fullname.local ? attrConstantNS$6 : attrConstant$6)(fullname, value));
};

var defaultView = function (node) {
    return node.ownerDocument && node.ownerDocument.defaultView || // node is a Node
    node.document && node // node is a Window
    || node.defaultView; // node is a Document
};

function styleRemove$6(name) {
  return function () {
    this.style.removeProperty(name);
  };
}

function styleConstant$6(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$6(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);else this.style.setProperty(name, v, priority);
  };
}

var selection_style$3 = function (name, value, priority) {
  var node;
  return arguments.length > 1 ? this.each((value == null ? styleRemove$6 : typeof value === "function" ? styleFunction$6 : styleConstant$6)(name, value, priority == null ? "" : priority)) : defaultView(node = this.node()).getComputedStyle(node, null).getPropertyValue(name);
};

function propertyRemove$3(name) {
  return function () {
    delete this[name];
  };
}

function propertyConstant$3(name, value) {
  return function () {
    this[name] = value;
  };
}

function propertyFunction$3(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];else this[name] = v;
  };
}

var selection_property$3 = function (name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove$3 : typeof value === "function" ? propertyFunction$3 : propertyConstant$3)(name, value)) : this.node()[name];
};

function classArray$3(string) {
  return string.trim().split(/^|\s+/);
}

function classList$3(node) {
  return node.classList || new ClassList$3(node);
}

function ClassList$3(node) {
  this._node = node;
  this._names = classArray$3(node.getAttribute("class") || "");
}

ClassList$3.prototype = {
  add: function add(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function remove(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function contains(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd$3(node, names) {
  var list = classList$3(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.add(names[i]);
  }
}

function classedRemove$3(node, names) {
  var list = classList$3(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.remove(names[i]);
  }
}

function classedTrue$3(names) {
  return function () {
    classedAdd$3(this, names);
  };
}

function classedFalse$3(names) {
  return function () {
    classedRemove$3(this, names);
  };
}

function classedFunction$3(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd$3 : classedRemove$3)(this, names);
  };
}

var selection_classed$3 = function (name, value) {
  var names = classArray$3(name + "");

  if (arguments.length < 2) {
    var list = classList$3(this.node()),
        i = -1,
        n = names.length;
    while (++i < n) {
      if (!list.contains(names[i])) return false;
    }return true;
  }

  return this.each((typeof value === "function" ? classedFunction$3 : value ? classedTrue$3 : classedFalse$3)(names, value));
};

function textRemove$3() {
  this.textContent = "";
}

function textConstant$6(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction$6(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text$3 = function (value) {
  return arguments.length ? this.each(value == null ? textRemove$3 : (typeof value === "function" ? textFunction$6 : textConstant$6)(value)) : this.node().textContent;
};

function htmlRemove$3() {
  this.innerHTML = "";
}

function htmlConstant$3(value) {
  return function () {
    this.innerHTML = value;
  };
}

function htmlFunction$3(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html$3 = function (value) {
  return arguments.length ? this.each(value == null ? htmlRemove$3 : (typeof value === "function" ? htmlFunction$3 : htmlConstant$3)(value)) : this.node().innerHTML;
};

function raise$4() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

var selection_raise$3 = function () {
  return this.each(raise$4);
};

function lower$3() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

var selection_lower$3 = function () {
  return this.each(lower$3);
};

var selection_append$3 = function (name) {
  var create = typeof name === "function" ? name : creator$3(name);
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull$3() {
  return null;
}

var selection_insert$3 = function (name, before) {
  var create = typeof name === "function" ? name : creator$3(name),
      select = before == null ? constantNull$3 : typeof before === "function" ? before : selector$3(before);
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
};

function remove$4() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

var selection_remove$3 = function () {
  return this.each(remove$4);
};

var selection_datum$3 = function (value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
};

function dispatchEvent$3(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (event) {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant$3(type, params) {
  return function () {
    return dispatchEvent$3(this, type, params);
  };
}

function dispatchFunction$3(type, params) {
  return function () {
    return dispatchEvent$3(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch$3 = function (type, params) {
  return this.each((typeof params === "function" ? dispatchFunction$3 : dispatchConstant$3)(type, params));
};

var root$6 = [null];

function Selection$6(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection$6() {
  return new Selection$6([[document.documentElement]], root$6);
}

Selection$6.prototype = selection$6.prototype = {
  constructor: Selection$6,
  select: selection_select$3,
  selectAll: selection_selectAll$3,
  filter: selection_filter$3,
  data: selection_data$3,
  enter: selection_enter$3,
  exit: selection_exit$3,
  merge: selection_merge$3,
  order: selection_order$3,
  sort: selection_sort$3,
  call: selection_call$3,
  nodes: selection_nodes$3,
  node: selection_node$3,
  size: selection_size$3,
  empty: selection_empty$3,
  each: selection_each$3,
  attr: selection_attr$3,
  style: selection_style$3,
  property: selection_property$3,
  classed: selection_classed$3,
  text: selection_text$3,
  html: selection_html$3,
  raise: selection_raise$3,
  lower: selection_lower$3,
  append: selection_append$3,
  insert: selection_insert$3,
  remove: selection_remove$3,
  datum: selection_datum$3,
  on: selection_on$3,
  dispatch: selection_dispatch$3
};

var select$6 = function (selector) {
    return typeof selector === "string" ? new Selection$6([[document.querySelector(selector)]], [document.documentElement]) : new Selection$6([[selector]], root$6);
};

var tpl = '<ul class="d3-list">\n<li d3-for="entry in data">\n</li>\n</ul>';

var ul = function () {
    return htmlElement$1(tpl);
};

// d3-view component to list data
// tags supported: table, ul & div
//
// Some ideas taken from
//  * list.js (https://github.com/javve/list.js)
//  *
var tags$2 = {
    ul: ul
};

var list = {
    render: function render(data, attrs) {
        var tag = data.tag || 'ul',
            id = attrs.id || 'list-' + this.uid,
            html = tags$2[tag],
            store;

        if (attrs.source) {
            store = this.model.$dataStore.serie(attrs.source);
            if (!store) warn$2('source "' + attrs.source + '" not available, cannot retrieve serie');
        } else warn$2('source not specified, cannot retrieve serie');

        var el = this.htmlElement('<div id="' + id + '"></div>');

        if (!html) warn$2('Could not find html builder for "' + tag + '" tag');else select$6(el).append(html);

        return el;
    }
};

var xhtml$4 = "http://www.w3.org/1999/xhtml";

var namespaces$4 = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml$4,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace$5 = function (name) {
  var prefix = name += "",
      i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces$4.hasOwnProperty(prefix) ? { space: namespaces$4[prefix], local: name } : name;
};

function creatorInherit$4(name) {
  return function () {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml$4 && document.documentElement.namespaceURI === xhtml$4 ? document.createElement(name) : document.createElementNS(uri, name);
  };
}

function creatorFixed$4(fullname) {
  return function () {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator$4 = function (name) {
  var fullname = namespace$5(name);
  return (fullname.local ? creatorFixed$4 : creatorInherit$4)(fullname);
};

var nextId$4 = 0;

var matcher$8 = function matcher$8(selector) {
  return function () {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element$10 = document.documentElement;
  if (!element$10.matches) {
    var vendorMatches$4 = element$10.webkitMatchesSelector || element$10.msMatchesSelector || element$10.mozMatchesSelector || element$10.oMatchesSelector;
    matcher$8 = function matcher$8(selector) {
      return function () {
        return vendorMatches$4.call(this, selector);
      };
    };
  }
}

var matcher$9 = matcher$8;

var filterEvents$4 = {};

var event$4 = null;

if (typeof document !== "undefined") {
  var element$11 = document.documentElement;
  if (!("onmouseenter" in element$11)) {
    filterEvents$4 = { mouseenter: "mouseover", mouseleave: "mouseout" };
  }
}

function filterContextListener$4(listener, index, group) {
  listener = contextListener$4(listener, index, group);
  return function (event) {
    var related = event.relatedTarget;
    if (!related || related !== this && !(related.compareDocumentPosition(this) & 8)) {
      listener.call(this, event);
    }
  };
}

function contextListener$4(listener, index, group) {
  return function (event1) {
    var event0 = event$4; // Events can be reentrant (e.g., focus).
    event$4 = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event$4 = event0;
    }
  };
}

function parseTypenames$8(typenames) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return { type: t, name: name };
  });
}

function onRemove$4(typename) {
  return function () {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;else delete this.__on;
  };
}

function onAdd$4(typename, value, capture) {
  var wrap = filterEvents$4.hasOwnProperty(typename.type) ? filterContextListener$4 : contextListener$4;
  return function (d, i, group) {
    var on = this.__on,
        o,
        listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = { type: typename.type, name: typename.name, value: value, listener: listener, capture: capture };
    if (!on) this.__on = [o];else on.push(o);
  };
}

var selection_on$4 = function (typename, value, capture) {
  var typenames = parseTypenames$8(typename + ""),
      i,
      n = typenames.length,
      t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd$4 : onRemove$4;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) {
    this.each(on(typenames[i], value, capture));
  }return this;
};

var sourceEvent$4 = function () {
  var current = event$4,
      source;
  while (source = current.sourceEvent) {
    current = source;
  }return current;
};

var point$6 = function (node, event) {
  var svg = node.ownerSVGElement || node;

  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    point.x = event.clientX, point.y = event.clientY;
    point = point.matrixTransform(node.getScreenCTM().inverse());
    return [point.x, point.y];
  }

  var rect = node.getBoundingClientRect();
  return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
};

function none$6() {}

var selector$4 = function (selector) {
  return selector == null ? none$6 : function () {
    return this.querySelector(selector);
  };
};

var selection_select$4 = function (select) {
  if (typeof select !== "function") select = selector$4(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$7(subgroups, this._parents);
};

function empty$5() {
  return [];
}

var selectorAll$4 = function (selector) {
  return selector == null ? empty$5 : function () {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll$4 = function (select) {
  if (typeof select !== "function") select = selectorAll$4(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$7(subgroups, parents);
};

var selection_filter$4 = function (match) {
  if (typeof match !== "function") match = matcher$9(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$7(subgroups, this._parents);
};

var sparse$4 = function (update) {
  return new Array(update.length);
};

var selection_enter$4 = function () {
  return new Selection$7(this._enter || this._groups.map(sparse$4), this._parents);
};

function EnterNode$4(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode$4.prototype = {
  constructor: EnterNode$4,
  appendChild: function appendChild(child) {
    return this._parent.insertBefore(child, this._next);
  },
  insertBefore: function insertBefore(child, next) {
    return this._parent.insertBefore(child, next);
  },
  querySelector: function querySelector(selector) {
    return this._parent.querySelector(selector);
  },
  querySelectorAll: function querySelectorAll(selector) {
    return this._parent.querySelectorAll(selector);
  }
};

var constant$12 = function (x) {
  return function () {
    return x;
  };
};

var keyPrefix$4 = "$"; // Protect against keys like “__proto__”.

function bindIndex$4(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode$4(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey$4(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix$4 + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix$4 + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode$4(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && nodeByKeyValue[keyValues[i]] === node) {
      exit[i] = node;
    }
  }
}

var selection_data$4 = function (value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function (d) {
      data[++j] = d;
    });
    return data;
  }

  var bind = key ? bindKey$4 : bindIndex$4,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$12(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength) {}
        previous._next = next || null;
      }
    }
  }

  update = new Selection$7(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit$4 = function () {
  return new Selection$7(this._exit || this._groups.map(sparse$4), this._parents);
};

var selection_merge$4 = function (selection) {

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$7(merges, this._parents);
};

var selection_order$4 = function () {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
};

var selection_sort$4 = function (compare) {
  if (!compare) compare = ascending$7;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$7(sortgroups, this._parents).order();
};

function ascending$7(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call$4 = function () {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes$4 = function () {
  var nodes = new Array(this.size()),
      i = -1;
  this.each(function () {
    nodes[++i] = this;
  });
  return nodes;
};

var selection_node$4 = function () {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
};

var selection_size$4 = function () {
  var size = 0;
  this.each(function () {
    ++size;
  });
  return size;
};

var selection_empty$4 = function () {
  return !this.node();
};

var selection_each$4 = function (callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
};

function attrRemove$7(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$7(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$7(name, value) {
  return function () {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$7(fullname, value) {
  return function () {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$7(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);else this.setAttribute(name, v);
  };
}

function attrFunctionNS$7(fullname, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

var selection_attr$4 = function (name, value) {
  var fullname = namespace$5(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
  }

  return this.each((value == null ? fullname.local ? attrRemoveNS$7 : attrRemove$7 : typeof value === "function" ? fullname.local ? attrFunctionNS$7 : attrFunction$7 : fullname.local ? attrConstantNS$7 : attrConstant$7)(fullname, value));
};

var window$4 = function (node) {
    return node.ownerDocument && node.ownerDocument.defaultView || // node is a Node
    node.document && node // node is a Window
    || node.defaultView; // node is a Document
};

function styleRemove$7(name) {
  return function () {
    this.style.removeProperty(name);
  };
}

function styleConstant$7(name, value, priority) {
  return function () {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$7(name, value, priority) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);else this.style.setProperty(name, v, priority);
  };
}

var selection_style$4 = function (name, value, priority) {
  var node;
  return arguments.length > 1 ? this.each((value == null ? styleRemove$7 : typeof value === "function" ? styleFunction$7 : styleConstant$7)(name, value, priority == null ? "" : priority)) : window$4(node = this.node()).getComputedStyle(node, null).getPropertyValue(name);
};

function propertyRemove$4(name) {
  return function () {
    delete this[name];
  };
}

function propertyConstant$4(name, value) {
  return function () {
    this[name] = value;
  };
}

function propertyFunction$4(name, value) {
  return function () {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];else this[name] = v;
  };
}

var selection_property$4 = function (name, value) {
  return arguments.length > 1 ? this.each((value == null ? propertyRemove$4 : typeof value === "function" ? propertyFunction$4 : propertyConstant$4)(name, value)) : this.node()[name];
};

function classArray$4(string) {
  return string.trim().split(/^|\s+/);
}

function classList$4(node) {
  return node.classList || new ClassList$4(node);
}

function ClassList$4(node) {
  this._node = node;
  this._names = classArray$4(node.getAttribute("class") || "");
}

ClassList$4.prototype = {
  add: function add(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function remove(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function contains(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd$4(node, names) {
  var list = classList$4(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.add(names[i]);
  }
}

function classedRemove$4(node, names) {
  var list = classList$4(node),
      i = -1,
      n = names.length;
  while (++i < n) {
    list.remove(names[i]);
  }
}

function classedTrue$4(names) {
  return function () {
    classedAdd$4(this, names);
  };
}

function classedFalse$4(names) {
  return function () {
    classedRemove$4(this, names);
  };
}

function classedFunction$4(names, value) {
  return function () {
    (value.apply(this, arguments) ? classedAdd$4 : classedRemove$4)(this, names);
  };
}

var selection_classed$4 = function (name, value) {
  var names = classArray$4(name + "");

  if (arguments.length < 2) {
    var list = classList$4(this.node()),
        i = -1,
        n = names.length;
    while (++i < n) {
      if (!list.contains(names[i])) return false;
    }return true;
  }

  return this.each((typeof value === "function" ? classedFunction$4 : value ? classedTrue$4 : classedFalse$4)(names, value));
};

function textRemove$4() {
  this.textContent = "";
}

function textConstant$7(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction$7(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text$4 = function (value) {
  return arguments.length ? this.each(value == null ? textRemove$4 : (typeof value === "function" ? textFunction$7 : textConstant$7)(value)) : this.node().textContent;
};

function htmlRemove$4() {
  this.innerHTML = "";
}

function htmlConstant$4(value) {
  return function () {
    this.innerHTML = value;
  };
}

function htmlFunction$4(value) {
  return function () {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html$4 = function (value) {
  return arguments.length ? this.each(value == null ? htmlRemove$4 : (typeof value === "function" ? htmlFunction$4 : htmlConstant$4)(value)) : this.node().innerHTML;
};

function raise$5() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

var selection_raise$4 = function () {
  return this.each(raise$5);
};

function lower$4() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

var selection_lower$4 = function () {
  return this.each(lower$4);
};

var selection_append$4 = function (name) {
  var create = typeof name === "function" ? name : creator$4(name);
  return this.select(function () {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull$4() {
  return null;
}

var selection_insert$4 = function (name, before) {
  var create = typeof name === "function" ? name : creator$4(name),
      select = before == null ? constantNull$4 : typeof before === "function" ? before : selector$4(before);
  return this.select(function () {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
};

function remove$5() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

var selection_remove$4 = function () {
  return this.each(remove$5);
};

var selection_datum$4 = function (value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
};

function dispatchEvent$4(node, type, params) {
  var window = window$4(node),
      event = window.CustomEvent;

  if (event) {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant$4(type, params) {
  return function () {
    return dispatchEvent$4(this, type, params);
  };
}

function dispatchFunction$4(type, params) {
  return function () {
    return dispatchEvent$4(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch$4 = function (type, params) {
  return this.each((typeof params === "function" ? dispatchFunction$4 : dispatchConstant$4)(type, params));
};

var root$7 = [null];

function Selection$7(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection$8() {
  return new Selection$7([[document.documentElement]], root$7);
}

Selection$7.prototype = selection$8.prototype = {
  constructor: Selection$7,
  select: selection_select$4,
  selectAll: selection_selectAll$4,
  filter: selection_filter$4,
  data: selection_data$4,
  enter: selection_enter$4,
  exit: selection_exit$4,
  merge: selection_merge$4,
  order: selection_order$4,
  sort: selection_sort$4,
  call: selection_call$4,
  nodes: selection_nodes$4,
  node: selection_node$4,
  size: selection_size$4,
  empty: selection_empty$4,
  each: selection_each$4,
  attr: selection_attr$4,
  style: selection_style$4,
  property: selection_property$4,
  classed: selection_classed$4,
  text: selection_text$4,
  html: selection_html$4,
  raise: selection_raise$4,
  lower: selection_lower$4,
  append: selection_append$4,
  insert: selection_insert$4,
  remove: selection_remove$4,
  datum: selection_datum$4,
  on: selection_on$4,
  dispatch: selection_dispatch$4
};

var select$7 = function (selector) {
    return typeof selector === "string" ? new Selection$7([[document.querySelector(selector)]], [document.documentElement]) : new Selection$7([[selector]], root$7);
};

var noop$5 = { value: function value() {} };

function dispatch$8() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || t in _) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch$4(_);
}

function Dispatch$4(_) {
  this._ = _;
}

function parseTypenames$9(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function (t) {
    var name = "",
        i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return { type: t, name: name };
  });
}

Dispatch$4.prototype = dispatch$8.prototype = {
  constructor: Dispatch$4,
  on: function on(typename, callback) {
    var _ = this._,
        T = parseTypenames$9(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) {
        if ((t = (typename = T[i]).type) && (t = get$10(_[t], typename.name))) return t;
      }return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$18(_[t], typename.name, callback);else if (callback == null) for (t in _) {
        _[t] = set$18(_[t], typename.name, null);
      }
    }

    return this;
  },
  copy: function copy() {
    var copy = {},
        _ = this._;
    for (var t in _) {
      copy[t] = _[t].slice();
    }return new Dispatch$4(copy);
  },
  call: function call(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) {
      args[i] = arguments[i + 2];
    }if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  },
  apply: function apply(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) {
      t[i].value.apply(that, args);
    }
  }
};

function get$10(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$18(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop$5, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({ name: name, value: callback });
  return type;
}

var frame$3 = 0;
var timeout$6 = 0;
var interval$6 = 0;
var pokeDelay$3 = 1000;
var taskHead$3;
var taskTail$3;
var clockLast$3 = 0;
var clockNow$3 = 0;
var clockSkew$3 = 0;
var clock$3 = (typeof performance === "undefined" ? "undefined" : _typeof(performance)) === "object" && performance.now ? performance : Date;
var setFrame$3 = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function (f) {
  setTimeout(f, 17);
};

function now$3() {
  return clockNow$3 || (setFrame$3(clearNow$3), clockNow$3 = clock$3.now() + clockSkew$3);
}

function clearNow$3() {
  clockNow$3 = 0;
}

function Timer$3() {
  this._call = this._time = this._next = null;
}

Timer$3.prototype = timer$3.prototype = {
  constructor: Timer$3,
  restart: function restart(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now$3() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail$3 !== this) {
      if (taskTail$3) taskTail$3._next = this;else taskHead$3 = this;
      taskTail$3 = this;
    }
    this._call = callback;
    this._time = time;
    sleep$3();
  },
  stop: function stop() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep$3();
    }
  }
};

function timer$3(callback, delay, time) {
  var t = new Timer$3();
  t.restart(callback, delay, time);
  return t;
}

function timerFlush$3() {
  now$3(); // Get the current time, if not already set.
  ++frame$3; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead$3,
      e;
  while (t) {
    if ((e = clockNow$3 - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame$3;
}

function wake$3() {
  clockNow$3 = (clockLast$3 = clock$3.now()) + clockSkew$3;
  frame$3 = timeout$6 = 0;
  try {
    timerFlush$3();
  } finally {
    frame$3 = 0;
    nap$3();
    clockNow$3 = 0;
  }
}

function poke$3() {
  var now = clock$3.now(),
      delay = now - clockLast$3;
  if (delay > pokeDelay$3) clockSkew$3 -= delay, clockLast$3 = now;
}

function nap$3() {
  var t0,
      t1 = taskHead$3,
      t2,
      time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead$3 = t2;
    }
  }
  taskTail$3 = t0;
  sleep$3(time);
}

function sleep$3(time) {
  if (frame$3) return; // Soonest alarm already set, or will be.
  if (timeout$6) timeout$6 = clearTimeout(timeout$6);
  var delay = time - clockNow$3;
  if (delay > 24) {
    if (time < Infinity) timeout$6 = setTimeout(wake$3, delay);
    if (interval$6) interval$6 = clearInterval(interval$6);
  } else {
    if (!interval$6) interval$6 = setInterval(poke$3, pokeDelay$3);
    frame$3 = 1, setFrame$3(wake$3);
  }
}

var timeout$7 = function (callback, delay, time) {
  var t = new Timer$3();
  delay = delay == null ? 0 : +delay;
  t.restart(function (elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
};

var emptyOn$3 = dispatch$8("start", "end", "interrupt");
var emptyTween$3 = [];

var CREATED$3 = 0;
var SCHEDULED$3 = 1;
var STARTING$3 = 2;
var STARTED$3 = 3;
var RUNNING$3 = 4;
var ENDING$3 = 5;
var ENDED$3 = 6;

var schedule$3 = function (node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};else if (id in schedules) return;
  create$4(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn$3,
    tween: emptyTween$3,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED$3
  });
};

function init$4(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > CREATED$3) throw new Error("too late");
  return schedule;
}

function set$17(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id]) || schedule.state > STARTING$3) throw new Error("too late");
  return schedule;
}

function get$9(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("too late");
  return schedule;
}

function create$4(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer$3(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED$3;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED$3) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED$3) return timeout$7(start);

      // Interrupt the active transition, if any.
      // Dispatch the interrupt event.
      if (o.state === RUNNING$3) {
        o.state = ENDED$3;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions. No interrupt event is dispatched
      // because the cancelled transitions never started. Note that this also
      // removes this transition from the pending list!
      else if (+i < id) {
          o.state = ENDED$3;
          o.timer.stop();
          delete schedules[i];
        }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout$7(function () {
      if (self.state === STARTED$3) {
        self.state = RUNNING$3;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING$3;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING$3) return; // interrupted
    self.state = STARTED$3;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING$3, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(null, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING$3) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED$3;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) {
      return;
    } // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

var interrupt$3 = function (node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) {
      empty = false;continue;
    }
    active = schedule.state === STARTED$3;
    schedule.state = ENDED$3;
    schedule.timer.stop();
    if (active) schedule.on.call("interrupt", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
};

var selection_interrupt$3 = function (name) {
  return this.each(function () {
    interrupt$3(this, name);
  });
};

var define$3 = function (constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend$3(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) {
    prototype[key] = definition[key];
  }return prototype;
}

function Color$3() {}

var _darker$3 = 0.7;
var _brighter$3 = 1 / _darker$3;

var reHex3$3 = /^#([0-9a-f]{3})$/;
var reHex6$3 = /^#([0-9a-f]{6})$/;
var reRgbInteger$3 = /^rgb\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*\)$/;
var reRgbPercent$3 = /^rgb\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
var reRgbaInteger$3 = /^rgba\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
var reRgbaPercent$3 = /^rgba\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
var reHslPercent$3 = /^hsl\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
var reHslaPercent$3 = /^hsla\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;

var named$3 = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define$3(Color$3, color$3, {
  displayable: function displayable() {
    return this.rgb().displayable();
  },
  toString: function toString() {
    return this.rgb() + "";
  }
});

function color$3(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3$3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb$3(m >> 8 & 0xf | m >> 4 & 0x0f0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
  ) : (m = reHex6$3.exec(format)) ? rgbn$3(parseInt(m[1], 16)) // #ff0000
  : (m = reRgbInteger$3.exec(format)) ? new Rgb$3(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
  : (m = reRgbPercent$3.exec(format)) ? new Rgb$3(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
  : (m = reRgbaInteger$3.exec(format)) ? rgba$3(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
  : (m = reRgbaPercent$3.exec(format)) ? rgba$3(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
  : (m = reHslPercent$3.exec(format)) ? hsla$3(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
  : (m = reHslaPercent$3.exec(format)) ? hsla$3(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
  : named$3.hasOwnProperty(format) ? rgbn$3(named$3[format]) : format === "transparent" ? new Rgb$3(NaN, NaN, NaN, 0) : null;
}

function rgbn$3(n) {
  return new Rgb$3(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba$3(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb$3(r, g, b, a);
}

function rgbConvert$3(o) {
  if (!(o instanceof Color$3)) o = color$3(o);
  if (!o) return new Rgb$3();
  o = o.rgb();
  return new Rgb$3(o.r, o.g, o.b, o.opacity);
}

function rgb$4(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert$3(r) : new Rgb$3(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb$3(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define$3(Rgb$3, rgb$4, extend$3(Color$3, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$3 : Math.pow(_brighter$3, k);
    return new Rgb$3(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$3 : Math.pow(_darker$3, k);
    return new Rgb$3(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function rgb$4() {
    return this;
  },
  displayable: function displayable() {
    return 0 <= this.r && this.r <= 255 && 0 <= this.g && this.g <= 255 && 0 <= this.b && this.b <= 255 && 0 <= this.opacity && this.opacity <= 1;
  },
  toString: function toString() {
    var a = this.opacity;a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(") + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.b) || 0)) + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla$3(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
  return new Hsl$3(h, s, l, a);
}

function hslConvert$3(o) {
  if (o instanceof Hsl$3) return new Hsl$3(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color$3)) o = color$3(o);
  if (!o) return new Hsl$3();
  if (o instanceof Hsl$3) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl$3(h, s, l, o.opacity);
}

function hsl$9(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert$3(h) : new Hsl$3(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl$3(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$3(Hsl$3, hsl$9, extend$3(Color$3, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$3 : Math.pow(_brighter$3, k);
    return new Hsl$3(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$3 : Math.pow(_darker$3, k);
    return new Hsl$3(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb$4() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb$3(hsl2rgb$3(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb$3(h, m1, m2), hsl2rgb$3(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
  },
  displayable: function displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb$3(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}

var deg2rad$3 = Math.PI / 180;
var rad2deg$3 = 180 / Math.PI;

var Kn$3 = 18;
var Xn$3 = 0.950470;
var Yn$3 = 1;
var Zn$3 = 1.088830;
var t0$4 = 4 / 29;
var t1$4 = 6 / 29;
var t2$3 = 3 * t1$4 * t1$4;
var t3$3 = t1$4 * t1$4 * t1$4;

function labConvert$3(o) {
  if (o instanceof Lab$3) return new Lab$3(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl$3) {
    var h = o.h * deg2rad$3;
    return new Lab$3(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb$3)) o = rgbConvert$3(o);
  var b = rgb2xyz$3(o.r),
      a = rgb2xyz$3(o.g),
      l = rgb2xyz$3(o.b),
      x = xyz2lab$3((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn$3),
      y = xyz2lab$3((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn$3),
      z = xyz2lab$3((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn$3);
  return new Lab$3(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab$6(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert$3(l) : new Lab$3(l, a, b, opacity == null ? 1 : opacity);
}

function Lab$3(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define$3(Lab$3, lab$6, extend$3(Color$3, {
  brighter: function brighter(k) {
    return new Lab$3(this.l + Kn$3 * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function darker(k) {
    return new Lab$3(this.l - Kn$3 * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function rgb() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn$3 * lab2xyz$3(y);
    x = Xn$3 * lab2xyz$3(x);
    z = Zn$3 * lab2xyz$3(z);
    return new Rgb$3(xyz2rgb$3(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
    xyz2rgb$3(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z), xyz2rgb$3(0.0556434 * x - 0.2040259 * y + 1.0572252 * z), this.opacity);
  }
}));

function xyz2lab$3(t) {
  return t > t3$3 ? Math.pow(t, 1 / 3) : t / t2$3 + t0$4;
}

function lab2xyz$3(t) {
  return t > t1$4 ? t * t * t : t2$3 * (t - t0$4);
}

function xyz2rgb$3(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz$3(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert$3(o) {
  if (o instanceof Hcl$3) return new Hcl$3(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab$3)) o = labConvert$3(o);
  var h = Math.atan2(o.b, o.a) * rad2deg$3;
  return new Hcl$3(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl$9(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert$3(h) : new Hcl$3(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl$3(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define$3(Hcl$3, hcl$9, extend$3(Color$3, {
  brighter: function brighter(k) {
    return new Hcl$3(this.h, this.c, this.l + Kn$3 * (k == null ? 1 : k), this.opacity);
  },
  darker: function darker(k) {
    return new Hcl$3(this.h, this.c, this.l - Kn$3 * (k == null ? 1 : k), this.opacity);
  },
  rgb: function rgb() {
    return labConvert$3(this).rgb();
  }
}));

var A$3 = -0.14861;
var B$3 = +1.78277;
var C$3 = -0.29227;
var D$3 = -0.90649;
var E$3 = +1.97294;
var ED$3 = E$3 * D$3;
var EB$3 = E$3 * B$3;
var BC_DA$3 = B$3 * C$3 - D$3 * A$3;

function cubehelixConvert$3(o) {
  if (o instanceof Cubehelix$3) return new Cubehelix$3(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb$3)) o = rgbConvert$3(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA$3 * b + ED$3 * r - EB$3 * g) / (BC_DA$3 + ED$3 - EB$3),
      bl = b - l,
      k = (E$3 * (g - l) - C$3 * bl) / D$3,
      s = Math.sqrt(k * k + bl * bl) / (E$3 * l * (1 - l)),
      // NaN if l=0 or l=1
  h = s ? Math.atan2(k, bl) * rad2deg$3 - 120 : NaN;
  return new Cubehelix$3(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix$10(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert$3(h) : new Cubehelix$3(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix$3(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$3(Cubehelix$3, cubehelix$10, extend$3(Color$3, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$3 : Math.pow(_brighter$3, k);
    return new Cubehelix$3(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$3 : Math.pow(_darker$3, k);
    return new Cubehelix$3(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad$3,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb$3(255 * (l + a * (A$3 * cosh + B$3 * sinh)), 255 * (l + a * (C$3 * cosh + D$3 * sinh)), 255 * (l + a * (E$3 * cosh)), this.opacity);
  }
}));

function basis$7(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1,
      t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}

var constant$13 = function (x) {
  return function () {
    return x;
  };
};

function linear$7(a, d) {
  return function (t) {
    return a + t * d;
  };
}

function exponential$5(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
    return Math.pow(a + t * b, y);
  };
}

function hue$3(a, b) {
  var d = b - a;
  return d ? linear$7(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$13(isNaN(a) ? b : a);
}

function gamma$3(y) {
  return (y = +y) === 1 ? nogamma$3 : function (a, b) {
    return b - a ? exponential$5(a, b, y) : constant$13(isNaN(a) ? b : a);
  };
}

function nogamma$3(a, b) {
  var d = b - a;
  return d ? linear$7(a, d) : constant$13(isNaN(a) ? b : a);
}

var interpolateRgb$3 = (function rgbGamma(y) {
  var color$$1 = gamma$3(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb$4(start)).r, (end = rgb$4(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = color$$1(start.opacity, end.opacity);
    return function (t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

var array$6 = function (a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) {
    x[i] = value$5(a[i], b[i]);
  }for (; i < nb; ++i) {
    c[i] = b[i];
  }return function (t) {
    for (i = 0; i < na; ++i) {
      c[i] = x[i](t);
    }return c;
  };
};

var date$4 = function (a, b) {
  var d = new Date();
  return a = +a, b -= a, function (t) {
    return d.setTime(a + b * t), d;
  };
};

var interpolateNumber$3 = function (a, b) {
  return a = +a, b -= a, function (t) {
    return a + b * t;
  };
};

var object$4 = function (a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || (typeof a === "undefined" ? "undefined" : _typeof(a)) !== "object") a = {};
  if (b === null || (typeof b === "undefined" ? "undefined" : _typeof(b)) !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = value$5(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function (t) {
    for (k in i) {
      c[k] = i[k](t);
    }return c;
  };
};

var reA$3 = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB$3 = new RegExp(reA$3.source, "g");

function zero$3(b) {
  return function () {
    return b;
  };
}

function one$3(b) {
  return function (t) {
    return b(t) + "";
  };
}

var interpolateString$3 = function (a, b) {
  var bi = reA$3.lastIndex = reB$3.lastIndex = 0,
      // scan index for next number in b
  am,
      // current match in a
  bm,
      // current match in b
  bs,
      // string preceding current number in b, if any
  i = -1,
      // index in s
  s = [],
      // string constants and placeholders
  q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA$3.exec(a)) && (bm = reB$3.exec(b))) {
    if ((bs = bm.index) > bi) {
      // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else {
      // interpolate non-matching numbers
      s[++i] = null;
      q.push({ i: i, x: interpolateNumber$3(am, bm) });
    }
    bi = reB$3.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? q[0] ? one$3(q[0].x) : zero$3(b) : (b = q.length, function (t) {
    for (var i = 0, o; i < b; ++i) {
      s[(o = q[i]).i] = o.x(t);
    }return s.join("");
  });
};

var value$5 = function (a, b) {
    var t = typeof b === "undefined" ? "undefined" : _typeof(b),
        c;
    return b == null || t === "boolean" ? constant$13(b) : (t === "number" ? interpolateNumber$3 : t === "string" ? (c = color$3(b)) ? (b = c, interpolateRgb$3) : interpolateString$3 : b instanceof color$3 ? interpolateRgb$3 : b instanceof Date ? date$4 : Array.isArray(b) ? array$6 : isNaN(b) ? object$4 : interpolateNumber$3)(a, b);
};

var degrees$3 = 180 / Math.PI;

var identity$9 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

var decompose$3 = function (a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees$3,
    skewX: Math.atan(skewX) * degrees$3,
    scaleX: scaleX,
    scaleY: scaleY
  };
};

var cssNode$3;
var cssRoot$3;
var cssView$3;
var svgNode$3;

function parseCss$3(value) {
  if (value === "none") return identity$9;
  if (!cssNode$3) cssNode$3 = document.createElement("DIV"), cssRoot$3 = document.documentElement, cssView$3 = document.defaultView;
  cssNode$3.style.transform = value;
  value = cssView$3.getComputedStyle(cssRoot$3.appendChild(cssNode$3), null).getPropertyValue("transform");
  cssRoot$3.removeChild(cssNode$3);
  value = value.slice(7, -1).split(",");
  return decompose$3(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg$3(value) {
  if (value == null) return identity$9;
  if (!svgNode$3) svgNode$3 = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode$3.setAttribute("transform", value);
  if (!(value = svgNode$3.transform.baseVal.consolidate())) return identity$9;
  value = value.matrix;
  return decompose$3(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform$3(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({ i: i - 4, x: interpolateNumber$3(xa, xb) }, { i: i - 2, x: interpolateNumber$3(ya, yb) });
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360;else if (b - a > 180) a += 360; // shortest path
      q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber$3(a, b) });
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber$3(a, b) });
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({ i: i - 4, x: interpolateNumber$3(xa, xb) }, { i: i - 2, x: interpolateNumber$3(ya, yb) });
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function (a, b) {
    var s = [],
        // string constants and placeholders
    q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function (t) {
      var i = -1,
          n = q.length,
          o;
      while (++i < n) {
        s[(o = q[i]).i] = o.x(t);
      }return s.join("");
    };
  };
}

var interpolateTransformCss$3 = interpolateTransform$3(parseCss$3, "px, ", "px)", "deg)");
var interpolateTransformSvg$3 = interpolateTransform$3(parseSvg$3, ", ", ")", ")");

var rho$3 = Math.SQRT2;
var rho2$3 = 2;
var rho4$3 = 4;
var epsilon2$3 = 1e-12;

function cosh$3(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function sinh$3(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function tanh$3(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

// p0 = [ux0, uy0, w0]
// p1 = [ux1, uy1, w1]

function cubehelix$11(hue$$1) {
  return function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix$10(start)).h, (end = cubehelix$10(end)).h),
          s = nogamma$3(start.s, end.s),
          l = nogamma$3(start.l, end.l),
          opacity = nogamma$3(start.opacity, end.opacity);
      return function (t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  }(1);
}

cubehelix$11(hue$3);
var cubehelixLong$3 = cubehelix$11(nogamma$3);

function tweenRemove$3(id, name) {
  var tween0, tween1;
  return function () {
    var schedule = set$17(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction$3(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error();
  return function () {
    var schedule = set$17(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = { name: name, value: value }, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

var transition_tween$3 = function (name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get$9(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove$3 : tweenFunction$3)(id, name, value));
};

function tweenValue$3(transition, name, value) {
  var id = transition._id;

  transition.each(function () {
    var schedule = set$17(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function (node) {
    return get$9(node, id).value[name];
  };
}

var interpolate$3 = function (a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber$3 : b instanceof color$3 ? interpolateRgb$3 : (c = color$3(b)) ? (b = c, interpolateRgb$3) : interpolateString$3)(a, b);
};

function attrRemove$8(name) {
  return function () {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$8(fullname) {
  return function () {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$8(name, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrConstantNS$8(fullname, interpolate$$1, value1) {
  var value00, interpolate0;
  return function () {
    var value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrFunction$8(name, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttribute(name);
    value0 = this.getAttribute(name);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

function attrFunctionNS$8(fullname, interpolate$$1, value) {
  var value00, value10, interpolate0;
  return function () {
    var value0,
        value1 = value(this);
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

var transition_attr$3 = function (name, value) {
  var fullname = namespace$5(name),
      i = fullname === "transform" ? interpolateTransformSvg$3 : interpolate$3;
  return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS$8 : attrFunction$8)(fullname, i, tweenValue$3(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS$8 : attrRemove$8)(fullname) : (fullname.local ? attrConstantNS$8 : attrConstant$8)(fullname, i, value));
};

function attrTweenNS$3(fullname, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttributeNS(fullname.space, fullname.local, i(t));
    };
  }
  tween._value = value;
  return tween;
}

function attrTween$3(name, value) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.setAttribute(name, i(t));
    };
  }
  tween._value = value;
  return tween;
}

var transition_attrTween$3 = function (name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  var fullname = namespace$5(name);
  return this.tween(key, (fullname.local ? attrTweenNS$3 : attrTween$3)(fullname, value));
};

function delayFunction$3(id, value) {
  return function () {
    init$4(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant$3(id, value) {
  return value = +value, function () {
    init$4(this, id).delay = value;
  };
}

var transition_delay$3 = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? delayFunction$3 : delayConstant$3)(id, value)) : get$9(this.node(), id).delay;
};

function durationFunction$3(id, value) {
  return function () {
    set$17(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant$3(id, value) {
  return value = +value, function () {
    set$17(this, id).duration = value;
  };
}

var transition_duration$3 = function (value) {
  var id = this._id;

  return arguments.length ? this.each((typeof value === "function" ? durationFunction$3 : durationConstant$3)(id, value)) : get$9(this.node(), id).duration;
};

function easeConstant$3(id, value) {
  if (typeof value !== "function") throw new Error();
  return function () {
    set$17(this, id).ease = value;
  };
}

var transition_ease$3 = function (value) {
  var id = this._id;

  return arguments.length ? this.each(easeConstant$3(id, value)) : get$9(this.node(), id).ease;
};

var transition_filter$3 = function (match) {
  if (typeof match !== "function") match = matcher$9(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition$3(subgroups, this._parents, this._name, this._id);
};

var transition_merge$3 = function (transition) {
  if (transition._id !== this._id) throw new Error();

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition$3(merges, this._parents, this._name, this._id);
};

function start$3(name) {
  return (name + "").trim().split(/^|\s+/).every(function (t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction$3(id, name, listener) {
  var on0,
      on1,
      sit = start$3(name) ? init$4 : set$17;
  return function () {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

var transition_on$3 = function (name, listener) {
  var id = this._id;

  return arguments.length < 2 ? get$9(this.node(), id).on.on(name) : this.each(onFunction$3(id, name, listener));
};

function removeFunction$3(id) {
  return function () {
    var parent = this.parentNode;
    for (var i in this.__transition) {
      if (+i !== id) return;
    }if (parent) parent.removeChild(this);
  };
}

var transition_remove$3 = function () {
  return this.on("end.remove", removeFunction$3(this._id));
};

var transition_select$3 = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selector$4(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule$3(subgroup[i], name, id, i, subgroup, get$9(node, id));
      }
    }
  }

  return new Transition$3(subgroups, this._parents, name, id);
};

var transition_selectAll$3 = function (select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selectorAll$4(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select$$1.call(node, node.__data__, i, group), child, inherit = get$9(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule$3(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition$3(subgroups, parents, name, id);
};

var Selection$8 = selection$8.prototype.constructor;

var transition_selection$3 = function () {
  return new Selection$8(this._groups, this._parents);
};

function styleRemove$8(name, interpolate$$1) {
    var value00, value10, interpolate0;
    return function () {
        var style = window$4(this).getComputedStyle(this, null),
            value0 = style.getPropertyValue(name),
            value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
}

function styleRemoveEnd$3(name) {
    return function () {
        this.style.removeProperty(name);
    };
}

function styleConstant$8(name, interpolate$$1, value1) {
    var value00, interpolate0;
    return function () {
        var value0 = window$4(this).getComputedStyle(this, null).getPropertyValue(name);
        return value0 === value1 ? null : value0 === value00 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value1);
    };
}

function styleFunction$8(name, interpolate$$1, value) {
    var value00, value10, interpolate0;
    return function () {
        var style = window$4(this).getComputedStyle(this, null),
            value0 = style.getPropertyValue(name),
            value1 = value(this);
        if (value1 == null) value1 = (this.style.removeProperty(name), style.getPropertyValue(name));
        return value0 === value1 ? null : value0 === value00 && value1 === value10 ? interpolate0 : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
    };
}

var transition_style$3 = function (name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss$3 : interpolate$3;
    return value == null ? this.styleTween(name, styleRemove$8(name, i)).on("end.style." + name, styleRemoveEnd$3(name)) : this.styleTween(name, typeof value === "function" ? styleFunction$8(name, i, tweenValue$3(this, "style." + name, value)) : styleConstant$8(name, i, value), priority);
};

function styleTween$3(name, value, priority) {
  function tween() {
    var node = this,
        i = value.apply(node, arguments);
    return i && function (t) {
      node.style.setProperty(name, i(t), priority);
    };
  }
  tween._value = value;
  return tween;
}

var transition_styleTween$3 = function (name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error();
  return this.tween(key, styleTween$3(name, value, priority == null ? "" : priority));
};

function textConstant$8(value) {
  return function () {
    this.textContent = value;
  };
}

function textFunction$8(value) {
  return function () {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

var transition_text$3 = function (value) {
  return this.tween("text", typeof value === "function" ? textFunction$8(tweenValue$3(this, "text", value)) : textConstant$8(value == null ? "" : value + ""));
};

var transition_transition$3 = function () {
  var name = this._name,
      id0 = this._id,
      id1 = newId$3();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get$9(node, id0);
        schedule$3(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition$3(groups, this._parents, name, id1);
};

var id$3 = 0;

function Transition$3(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition$6(name) {
  return selection$8().transition(name);
}

function newId$3() {
  return ++id$3;
}

var selection_prototype$3 = selection$8.prototype;

Transition$3.prototype = transition$6.prototype = {
  constructor: Transition$3,
  select: transition_select$3,
  selectAll: transition_selectAll$3,
  filter: transition_filter$3,
  merge: transition_merge$3,
  selection: transition_selection$3,
  transition: transition_transition$3,
  call: selection_prototype$3.call,
  nodes: selection_prototype$3.nodes,
  node: selection_prototype$3.node,
  size: selection_prototype$3.size,
  empty: selection_prototype$3.empty,
  each: selection_prototype$3.each,
  on: transition_on$3,
  attr: transition_attr$3,
  attrTween: transition_attrTween$3,
  style: transition_style$3,
  styleTween: transition_styleTween$3,
  text: transition_text$3,
  remove: transition_remove$3,
  tween: transition_tween$3,
  delay: transition_delay$3,
  duration: transition_duration$3,
  ease: transition_ease$3
};

function cubicInOut$3(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var exponent$4 = 3;

var polyIn$3 = function custom(e) {
  e = +e;

  function polyIn(t) {
    return Math.pow(t, e);
  }

  polyIn.exponent = custom;

  return polyIn;
}(exponent$4);

var polyOut$3 = function custom(e) {
  e = +e;

  function polyOut(t) {
    return 1 - Math.pow(1 - t, e);
  }

  polyOut.exponent = custom;

  return polyOut;
}(exponent$4);

var polyInOut$3 = function custom(e) {
  e = +e;

  function polyInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
  }

  polyInOut.exponent = custom;

  return polyInOut;
}(exponent$4);

var b1$3 = 4 / 11;
var b2$3 = 6 / 11;
var b3$3 = 8 / 11;
var b4$3 = 3 / 4;
var b5$3 = 9 / 11;
var b6$3 = 10 / 11;
var b7$3 = 15 / 16;
var b8$3 = 21 / 22;
var b9$3 = 63 / 64;
var b0$3 = 1 / b1$3 / b1$3;



function bounceOut$3(t) {
  return (t = +t) < b1$3 ? b0$3 * t * t : t < b3$3 ? b0$3 * (t -= b2$3) * t + b4$3 : t < b6$3 ? b0$3 * (t -= b5$3) * t + b7$3 : b0$3 * (t -= b8$3) * t + b9$3;
}

var overshoot$3 = 1.70158;

var backIn$3 = function custom(s) {
  s = +s;

  function backIn(t) {
    return t * t * ((s + 1) * t - s);
  }

  backIn.overshoot = custom;

  return backIn;
}(overshoot$3);

var backOut$3 = function custom(s) {
  s = +s;

  function backOut(t) {
    return --t * t * ((s + 1) * t + s) + 1;
  }

  backOut.overshoot = custom;

  return backOut;
}(overshoot$3);

var backInOut$3 = function custom(s) {
  s = +s;

  function backInOut(t) {
    return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
  }

  backInOut.overshoot = custom;

  return backInOut;
}(overshoot$3);

var tau$5 = 2 * Math.PI;
var amplitude$3 = 1;
var period$3 = 0.3;

var elasticIn$3 = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau$5);

  function elasticIn(t) {
    return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
  }

  elasticIn.amplitude = function (a) {
    return custom(a, p * tau$5);
  };
  elasticIn.period = function (p) {
    return custom(a, p);
  };

  return elasticIn;
}(amplitude$3, period$3);

var elasticOut$3 = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau$5);

  function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function (a) {
    return custom(a, p * tau$5);
  };
  elasticOut.period = function (p) {
    return custom(a, p);
  };

  return elasticOut;
}(amplitude$3, period$3);

var elasticInOut$3 = function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau$5);

  function elasticInOut(t) {
    return ((t = t * 2 - 1) < 0 ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p) : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
  }

  elasticInOut.amplitude = function (a) {
    return custom(a, p * tau$5);
  };
  elasticInOut.period = function (p) {
    return custom(a, p);
  };

  return elasticInOut;
}(amplitude$3, period$3);

var defaultTiming$3 = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut$3
};

function inherit$3(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming$3.time = now$3(), defaultTiming$3;
    }
  }
  return timing;
}

var selection_transition$3 = function (name) {
  var id, timing;

  if (name instanceof Transition$3) {
    id = name._id, name = name._name;
  } else {
    id = newId$3(), (timing = defaultTiming$3).time = now$3(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule$3(node, name, id, i, group, timing || inherit$3(node, id));
      }
    }
  }

  return new Transition$3(groups, this._parents, name, id);
};

selection$8.prototype.interrupt = selection_interrupt$3;
selection$8.prototype.transition = selection_transition$3;

var root$8 = [null];

var prefix$14 = "$";

function Map$8() {}

Map$8.prototype = map$19.prototype = {
  constructor: Map$8,
  has: function has(key) {
    return prefix$14 + key in this;
  },
  get: function get(key) {
    return this[prefix$14 + key];
  },
  set: function set(key, value) {
    this[prefix$14 + key] = value;
    return this;
  },
  remove: function remove(key) {
    var property = prefix$14 + key;
    return property in this && delete this[property];
  },
  clear: function clear() {
    for (var property in this) {
      if (property[0] === prefix$14) delete this[property];
    }
  },
  keys: function keys() {
    var keys = [];
    for (var property in this) {
      if (property[0] === prefix$14) keys.push(property.slice(1));
    }return keys;
  },
  values: function values() {
    var values = [];
    for (var property in this) {
      if (property[0] === prefix$14) values.push(this[property]);
    }return values;
  },
  entries: function entries() {
    var entries = [];
    for (var property in this) {
      if (property[0] === prefix$14) entries.push({ key: property.slice(1), value: this[property] });
    }return entries;
  },
  size: function size() {
    var size = 0;
    for (var property in this) {
      if (property[0] === prefix$14) ++size;
    }return size;
  },
  empty: function empty() {
    for (var property in this) {
      if (property[0] === prefix$14) return false;
    }return true;
  },
  each: function each(f) {
    for (var property in this) {
      if (property[0] === prefix$14) f(this[property], property.slice(1), this);
    }
  }
};

function map$19(object, f) {
  var map = new Map$8();

  // Copy constructor.
  if (object instanceof Map$8) object.each(function (value, key) {
    map.set(key, value);
  });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
      var i = -1,
          n = object.length,
          o;

      if (f == null) while (++i < n) {
        map.set(i, object[i]);
      } else while (++i < n) {
        map.set(f(o = object[i], i, object), o);
      }
    }

    // Convert object to map.
    else if (object) for (var key in object) {
        map.set(key, object[key]);
      }return map;
}

function createObject$4() {
  return {};
}

function setObject$4(object, key, value) {
  object[key] = value;
}

function createMap$4() {
  return map$19();
}

function setMap$4(map, key, value) {
  map.set(key, value);
}

function Set$4() {}

var proto$6 = map$19.prototype;

Set$4.prototype = set$19.prototype = {
  constructor: Set$4,
  has: proto$6.has,
  add: function add(value) {
    value += "";
    this[prefix$14 + value] = value;
    return this;
  },
  remove: proto$6.remove,
  clear: proto$6.clear,
  values: proto$6.keys,
  size: proto$6.size,
  empty: proto$6.empty,
  each: proto$6.each
};

function set$19(object, f) {
  var set = new Set$4();

  // Copy constructor.
  if (object instanceof Set$4) object.each(function (value) {
    set.add(value);
  });

  // Otherwise, assume it’s an array.
  else if (object) {
      var i = -1,
          n = object.length;
      if (f == null) while (++i < n) {
        set.add(object[i]);
      } else while (++i < n) {
        set.add(f(object[i], i, object));
      }
    }

  return set;
}

function strokeStyle$1(node) {
    var stroke = getColor(node.attrs.get('stroke'));
    if (stroke) {
        var opacity = node.getValue('stroke-opacity');
        if (opacity || opacity === 0) stroke.opacity = opacity;
        node.context.strokeStyle = '' + stroke;
        node.context.lineWidth = node.factor * (node.getValue('stroke-width') || 1);
        node.context.stroke();
        return stroke;
    }
}

function fillStyle$1(node) {
    var fill = getColor(node.attrs.get('fill'));
    if (fill) {
        var opacity = node.getValue('fill-opacity');
        if (opacity || opacity === 0) fill.opacity = opacity;
        node.context.fillStyle = '' + fill;
        node.context.fill();
        return fill;
    }
}

function getColor(value) {
    if (value && value !== 'none') return color$3(value);
}

// import {active} from 'd3-transition';


var SymbolTransition$1 = function () {
    function SymbolTransition(factor) {
        classCallCheck(this, SymbolTransition);

        this.factor = factor || 1;
        this.time = Infinity;
        this.data1 = [];
    }

    createClass(SymbolTransition, [{
        key: 'update',
        value: function update(value) {
            this.pen = value.pen;
            this.time = value.time;
            this.current = value.data;
        }
    }, {
        key: 'draw',
        value: function draw(node) {
            node.context.beginPath();
            this.pen.context(node.context)();
        }
    }, {
        key: 'accessor',
        value: function accessor(f, j) {
            var factor = this.factor,
                data0 = this.data0,
                data1 = this.data1,
                time = this.time,
                prev,
                curr;
            return function (d, i) {
                prev = data0[i][j];
                if (prev === undefined) curr = factor * f(d);else curr = factor * (time * f(d) + (1 - time) * prev);
                data1[i][j] = curr;
                return curr;
            };
        }
    }]);
    return SymbolTransition;
}();

var PathTransition$1 = function (_SymbolTransition) {
    inherits(PathTransition, _SymbolTransition);

    function PathTransition() {
        classCallCheck(this, PathTransition);
        return possibleConstructorReturn(this, (PathTransition.__proto__ || Object.getPrototypeOf(PathTransition)).apply(this, arguments));
    }

    createClass(PathTransition, [{
        key: 'update',
        value: function update(value) {
            if (value.time < this.time) {
                var data1 = this.data1;
                while (data1.length < value.data.length) {
                    data1.push(new Array(2));
                }this.data0 = this.data1;
                this.x = value.pen.x();
                this.y = value.pen.y();
            }
            get$1(PathTransition.prototype.__proto__ || Object.getPrototypeOf(PathTransition.prototype), 'update', this).call(this, value);
        }
    }, {
        key: 'draw',
        value: function draw(node) {
            node.context.beginPath();
            this.pen.context(node.context).x(this.accessor(this.x, 0)).y(this.accessor(this.y, 1))(this.current);
        }
    }]);
    return PathTransition;
}(SymbolTransition$1);

var shapeTransitions$1 = {
    symbol: SymbolTransition$1,
    line: PathTransition$1,
    arc: PathTransition$1,
    area: PathTransition$1
};

var _setAttribute$1 = function (node, attr, value) {
    var current = node.attrs.get(attr);
    if (current === value) return false;

    if (attr === 'd' && value && value.pen) {

        if (!current) {
            var Constructor = shapeTransitions$1[value.pen.name];
            current = new Constructor(node.factor);
            node.attrs.set(attr, current);
        }

        current.update(value);
        return true;
    } else {
        node.attrs.set(attr, value);
        return true;
    }
};

function deque$1() {
    return new Deque$1();
}

function Deque$1() {
    this._head = null;
    this._tail = null;
    this._length = 0;

    Object.defineProperty(this, 'length', {
        get: function get() {
            return this._length;
        }
    });
}

Deque$1.prototype = deque$1.prototype = {
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

var namespace$6 = 'canvas';

var tagDraws = map$19();
var attributes$2 = map$19();
/**
 * A proxy for a data entry on canvas
 *
 * It partially implements the Node Api
 * https://developer.mozilla.org/en-US/docs/Web/API/Node
 *
 * It allow the use the d3-select and d3-transition libraries
 * on canvas joins
 */
var CanvasElement$1 = function () {
    function CanvasElement(context, factor, tag) {
        classCallCheck(this, CanvasElement);

        this.context = context;
        this.factor = factor || 1;
        this.tagName = tag || 'canvas';
    }

    // API


    createClass(CanvasElement, [{
        key: 'querySelectorAll',
        value: function querySelectorAll(selector) {
            if (this._deque) {
                if (selector === '*') return this.childNodes;
                return select$8(selector, this._deque, []);
            } else return [];
        }
    }, {
        key: 'querySelector',
        value: function querySelector(selector) {
            if (this._deque) {
                if (selector === '*') return this._deque._head;
                return select$8(selector, this._deque);
            }
        }
    }, {
        key: 'createElementNS',
        value: function createElementNS(namespaceURI, qualifiedName) {
            return new CanvasElement(this.context, this.factor, qualifiedName);
        }
    }, {
        key: 'hasChildNodes',
        value: function hasChildNodes() {
            return this._deque ? this._deque.length > 0 : false;
        }
    }, {
        key: 'contains',
        value: function contains(child) {
            while (child) {
                if (child._parent == this) return true;
                child = child._parent;
            }
            return false;
        }
    }, {
        key: 'appendChild',
        value: function appendChild(child) {
            return this.insertBefore(child);
        }
    }, {
        key: 'insertBefore',
        value: function insertBefore(child, refChild) {
            if (child === this) throw Error('inserting self into children');
            if (!(child instanceof CanvasElement)) throw Error('Cannot insert a non canvas element into a canvas element');
            if (child._parent) child._parent.removeChild(child);
            if (!this._deque) this._deque = deque$1();
            this._deque.prepend(child, refChild);
            child._parent = this;
            touch$6(this.root, 1);
            return child;
        }
    }, {
        key: 'removeChild',
        value: function removeChild(child) {
            if (child._parent === this) {
                delete child._parent;
                this._deque.remove(child);
                touch$6(this.root, 1);
                return child;
            }
        }
    }, {
        key: 'setAttribute',
        value: function setAttribute(attr, value) {
            if (attr === 'class') {
                this.class = value;
            } else if (attr === 'id') {
                this.id = value;
            } else {
                if (!this.attrs) this.attrs = map$19();
                if (_setAttribute$1(this, attr, value)) touch$6(this.root, 1);
            }
        }
    }, {
        key: 'removeAttribute',
        value: function removeAttribute(attr) {
            if (this.attrs) {
                this.attrs.remove(attr);
                touch$6(this.root, 1);
            }
        }
    }, {
        key: 'getAttribute',
        value: function getAttribute(attr) {
            if (this.attrs) return this.attrs.get(attr);
        }
    }, {
        key: 'each',
        value: function each(f) {
            if (this._deque) this._deque.each(f);
        }
    }, {
        key: 'getValue',
        value: function getValue(attr) {
            var value = this.getAttribute(attr);
            if (value === undefined && this._parent) return this._parent.getValue(attr);
            return value;
        }

        // Additional attribute functions

    }, {
        key: 'removeProperty',
        value: function removeProperty(name) {
            this.removeAttribute(name);
        }
    }, {
        key: 'setProperty',
        value: function setProperty(name, value) {
            this.setAttribute(name, value);
        }
    }, {
        key: 'getProperty',
        value: function getProperty(name) {
            return this.getAttribute(name);
        }
    }, {
        key: 'getPropertyValue',
        value: function getPropertyValue(name) {
            return this.getAttribute(name);
        }

        // Proxies to this object

    }, {
        key: 'getComputedStyle',
        value: function getComputedStyle() {
            return this;
        }
    }, {
        key: 'onStart',

        //
        value: function onStart() {
            return;
        }
    }, {
        key: 'childNodes',
        get: function get() {
            return this._deque ? this._deque.list() : [];
        }
    }, {
        key: 'firstChild',
        get: function get() {
            return this._deque ? this._deque._head : null;
        }
    }, {
        key: 'lastChild',
        get: function get() {
            return this._deque ? this._deque._tail : null;
        }
    }, {
        key: 'parentNode',
        get: function get() {
            return this._parent;
        }
    }, {
        key: 'previousSibling',
        get: function get() {
            return this._prev;
        }
    }, {
        key: 'nextSibling',
        get: function get() {
            return this._next;
        }
    }, {
        key: 'namespaceURI',
        get: function get() {
            return namespace$6;
        }

        // Canvas methods

    }, {
        key: 'countNodes',
        get: function get() {
            return this._deque ? this._deque._length : 0;
        }
    }, {
        key: 'root',
        get: function get() {
            if (this._parent) return this._parent.root;
            return this;
        }
    }, {
        key: 'ownerDocument',
        get: function get() {
            return this;
        }
    }, {
        key: 'style',
        get: function get() {
            return this;
        }
    }, {
        key: 'defaultView',
        get: function get() {
            return this;
        }
    }, {
        key: 'document',
        get: function get() {
            return this;
        }
    }]);
    return CanvasElement;
}();

function select$8(selector, deque, selections) {

    var selectors = selector.split(' '),
        bits,
        tag,
        child;

    for (var s = 0; s < selectors.length; ++s) {
        var classes, id;

        child = deque._head;
        selector = selectors[s];

        if (selector.indexOf('#') > -1) {
            bits = selector.split('#');
            tag = bits[0];
            id = bits[1];
        } else if (selector.indexOf('.') > -1) {
            bits = selector.split('.');
            tag = bits[0];
            classes = bits.splice(1).join(' ');
        } else tag = selector;

        while (child) {
            if (!tag || child.tagName === tag) {
                if (id && child.id !== id || classes && child.class !== classes) {
                    // nothing to do
                } else if (selections) selections.push(child);else return child;
            }
            child = child._next;
        }
    }

    return selections;
}

function touch$6(node, v) {
    if (!node._touches) node._touches = 0;
    node._touches += v;
    if (!node._touches || node._scheduled) return;
    node._scheduled = timeout$7(redraw$1(node));
}

function draw$1(node, t) {
    if (node.attrs) {
        var ctx = node.context,
            drawer = tagDraws.get(node.tagName);

        attributes$2.each(function (attr) {
            return attr(node, t);
        });
        ctx.save();
        if (drawer) drawer(node, t);
        fillStyle$1(node, t);
        strokeStyle$1(node, t);
        ctx.restore();
    }
    if (node._deque) node._deque.each(function (child) {
        return draw$1(child, t);
    });
    if (node.attrs) ctx.restore();
}

function redraw$1(node) {

    return function () {
        var ctx = node.context;
        node._touches = 0;
        ctx.beginPath();
        ctx.closePath();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        draw$1(node);
        node._scheduled = false;
        touch$6(node, 0);
    };
}

var resolution$1 = function (factor) {
    return factor || window.devicePixelRatio || 1;
};

// import {pen} from './path';
function canvasSelection$1(context, factor) {
    var s = selection$8();
    if (arguments.length) {
        if (!factor) factor = resolution$1();
        s._groups[0][0] = new CanvasElement$1(context, factor);
    }
    return s;
}

canvasSelection$1.prototype = selection$8.prototype;

var slice$5 = Array.prototype.slice;

function identity$10(d) {
    return d;
}

var top$1 = 1;
var right$2 = 2;
var bottom$1 = 3;
var left$2 = 4;
var epsilon$3 = 1e-6;

function translateX$1(scale0, scale1, d) {
    var x = scale0(d);
    return 'translate(' + (isFinite(x) ? x : scale1(d)) + ',0)';
}

function translateY$1(scale0, scale1, d) {
    var y = scale0(d);
    return 'translate(0,' + (isFinite(y) ? y : scale1(d)) + ')';
}

function center$1(scale) {
    var width = scale.bandwidth() / 2;
    return function (d) {
        return scale(d) + width;
    };
}

var line$1 = function (node) {
    var attrs = node.attrs;
    node.context.moveTo(node.factor * (attrs.get('x1') || 0), node.factor * (attrs.get('y1') || 0));
    node.context.lineTo(node.factor * attrs.get('x2'), node.factor * attrs.get('y2'));
};

var path$3 = function (node) {
    var path = node.attrs.get('d');
    if (path) {
        if (typeof path.draw === 'function') path.draw(node);else if (path.context) path.context(node.context)();
    }
};

var fontProperties$1 = ['style', 'variant', 'weight', 'size', 'family'];
var defaultBaseline$1 = 'middle';
var textAlign$1 = {
    start: 'start',
    middle: 'center',
    end: 'end'
};

var text = function (node) {
    var size = fontString$1(node);
    node.context.textAlign = textAlign$1[node.getValue('text-anchor')] || textAlign$1.middle;
    node.context.textBaseline = node.getValue('text-baseline') || defaultBaseline$1;
    node.context.fillText(node.textContent || '', fontLocation$1(node, 'x', size), fontLocation$1(node, 'y', size));
};

function fontString$1(node) {
    var bits = [],
        size = 0,
        key = void 0,
        v = void 0;
    for (var i = 0; i < fontProperties$1.length; ++i) {
        key = fontProperties$1[i];
        v = node.getValue('font-' + key);
        if (v) {
            if (key === 'size') {
                size = node.factor * v;
                v = size + 'px';
            }
            bits.push(v);
        }
    }
    if (size) node.context.font = bits.join(' ');
    return size;
}

function fontLocation$1(node, d, size) {
    var p = node.attrs.get(d) || 0,
        dp = node.attrs.get('d' + d) || 0;
    if (dp) {
        if (dp.substring(dp.length - 2) == 'em') dp = size * dp.substring(0, dp.length - 2);else if (dp.substring(dp.length - 2) == 'px') dp = +dp.substring(0, dp.length - 2);
    }
    return node.factor * (p + dp);
}

var transform$1 = function (node) {
    var x = node.attrs.get('transform') || 0,
        y = node.attrs.get('transform') || 0,
        trans = node.attrs.get('transform');
    if (trans) {
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
    }
    if (x || y) {
        node.context.save();
        node.context.translate(node.factor * x, node.factor * y);
    }
};

tagDraws.set('line', line$1);
tagDraws.set('path', path$3);
tagDraws.set('text', text);

attributes$2.set('transform', transform$1);

var round$3 = function (x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
};

var WIDTH = 400;
var HEIGHT = '75%';

// Internal function for evaluating paper dom size
function getSize(element, options) {
    var size = {
        width: options.width,
        height: options.height
    };

    if (!size.width) {
        size.width = getWidth(element);
        if (size.width) size.widthElement = getWidthElement(element);else size.width = WIDTH;
    }

    if (!size.height) {
        size.height = getHeight(element);
        if (size.height) size.heightElement = getHeightElement(element);else size.height = HEIGHT;
    }

    // Allow to specify height as a percentage of width
    if (typeof size.height === "string" && size.height.indexOf('%') === size.height.length - 1) {
        size.heightPercentage = 0.01 * parseFloat(size.height);
        size.height = round$3(size.heightPercentage * size.width);
    }

    return size;
}

function getWidth(element) {
    var el = getParentElementRect(element, 'width');
    if (el) return elementWidth(el);
}

function getHeight(element) {
    var el = getParentElementRect(element, 'width');
    if (el) return elementHeight(el);
}

function getWidthElement(element) {
    return getParentElementRect(element, 'width');
}

function getHeightElement(element) {
    return getParentElementRect(element, 'height');
}

function elementWidth(el) {
    var w = el.getBoundingClientRect()['width'],
        s = select$7(el),
        left = padding(s.style('padding-left')),
        right = padding(s.style('padding-right'));
    return w - left - right;
}

function elementHeight(el) {
    var w = el.getBoundingClientRect()['height'],
        s = select$7(el),
        top = padding(s.style('padding-top')),
        bottom = padding(s.style('padding-bottom'));
    return w - top - bottom;
}

function getParentElementRect(element, key) {
    var parent = element.node ? element.node() : element,
        v = void 0;
    while (parent && parent.tagName !== 'BODY') {
        v = parent.getBoundingClientRect()[key];
        if (v) return parent;
        parent = parent.parentNode;
    }
}

function padding(value) {
    if (value && value.substring(value.length - 2) == 'px') return +value.substring(0, value.length - 2);
    return 0;
}

function boundingBox(size) {
    var w = size.widthElement ? getWidth(size.widthElement) : size.width,
        h;
    if (size.heightPercentage) h = round$3(w * size.heightPercentage, 0);else h = size.heightElement ? getHeight(size.heightElement) : size.height;
    if (size.minHeight) h = Math.max(h, size.minHeight);
    return [round$3(w), round$3(h)];
}

var layerEvents = dispatch$6('init', 'before-draw', 'after-draw');

var layerProto = {
    canDraw: function canDraw(serie) {
        return serie ? true : false;
    },


    // must be implemented by layers
    draw: function draw() {}
};

var layers = assign$4(map$10(), {
    events: layerEvents,

    add: function add(type, layer) {

        function Layer(plot, options) {
            initLayer(this, type, plot, options);
        }

        Layer.prototype = assign$4({}, layerProto, layer);

        this.set(type, Layer);
        return this.get(type);
    }
});

// A Plot is the combination is a visualisation on a paper
function initLayer(layer, type, plot, options) {
    var visible = true,
        config = plot.config.layers[type].$child(options);

    Object.defineProperties(viewUid(layer), {
        type: {
            get: function get() {
                return type;
            }
        },
        plot: {
            get: function get() {
                return plot;
            }
        },
        config: {
            get: function get() {
                return config;
            }
        },
        visible: {
            get: function get() {
                return visible;
            },
            set: function set(value) {
                if (value !== visible) {
                    visible = value;
                }
            }
        }
    });

    layerEvents.call('init', layer, options);
}

var array$7 = Array.prototype;

var map$21 = array$7.map;
var slice$6 = array$7.slice;

var implicit$1 = { name: "implicit" };

function ordinal$1(range) {
  var index = map$10(),
      domain = [],
      unknown = implicit$1;

  range = range == null ? [] : slice$6.call(range);

  function scale(d) {
    var key = d + "",
        i = index.get(key);
    if (!i) {
      if (unknown !== implicit$1) return unknown;
      index.set(key, i = domain.push(d));
    }
    return range[(i - 1) % range.length];
  }

  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = map$10();
    var i = -1,
        n = _.length,
        d,
        key;
    while (++i < n) {
      if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
    }return scale;
  };

  scale.range = function (_) {
    return arguments.length ? (range = slice$6.call(_), scale) : range.slice();
  };

  scale.unknown = function (_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function () {
    return ordinal$1().domain(domain).range(range).unknown(unknown);
  };

  return scale;
}

function band$1() {
  var scale = ordinal$1().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range$$1 = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = range$$1[1] < range$$1[0],
        start = range$$1[reverse - 0],
        stop = range$$1[1 - reverse];
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = sequence$1(n).map(function (i) {
      return start + step * i;
    });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function (_) {
    return arguments.length ? (range$$1 = [+_[0], +_[1]], rescale()) : range$$1.slice();
  };

  scale.rangeRound = function (_) {
    return range$$1 = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = function () {
    return bandwidth;
  };

  scale.step = function () {
    return step;
  };

  scale.round = function (_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function (_) {
    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingInner = function (_) {
    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingOuter = function (_) {
    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
  };

  scale.align = function (_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.copy = function () {
    return band$1().domain(domain()).range(range$$1).round(round).paddingInner(paddingInner).paddingOuter(paddingOuter).align(align);
  };

  return rescale();
}

function pointish$1(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;

  scale.copy = function () {
    return pointish$1(copy());
  };

  return scale;
}

function point$7() {
  return pointish$1(band$1().paddingInner(1));
}

var define$4 = function (constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend$4(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) {
    prototype[key] = definition[key];
  }return prototype;
}

function Color$4() {}

var _darker$4 = 0.7;
var _brighter$4 = 1 / _darker$4;

var reI$3 = "\\s*([+-]?\\d+)\\s*";
var reN$3 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP$3 = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3$4 = /^#([0-9a-f]{3})$/;
var reHex6$4 = /^#([0-9a-f]{6})$/;
var reRgbInteger$4 = new RegExp("^rgb\\(" + [reI$3, reI$3, reI$3] + "\\)$");
var reRgbPercent$4 = new RegExp("^rgb\\(" + [reP$3, reP$3, reP$3] + "\\)$");
var reRgbaInteger$4 = new RegExp("^rgba\\(" + [reI$3, reI$3, reI$3, reN$3] + "\\)$");
var reRgbaPercent$4 = new RegExp("^rgba\\(" + [reP$3, reP$3, reP$3, reN$3] + "\\)$");
var reHslPercent$4 = new RegExp("^hsl\\(" + [reN$3, reP$3, reP$3] + "\\)$");
var reHslaPercent$4 = new RegExp("^hsla\\(" + [reN$3, reP$3, reP$3, reN$3] + "\\)$");

var named$4 = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define$4(Color$4, color$4, {
  displayable: function displayable() {
    return this.rgb().displayable();
  },
  toString: function toString() {
    return this.rgb() + "";
  }
});

function color$4(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3$4.exec(format)) ? (m = parseInt(m[1], 16), new Rgb$4(m >> 8 & 0xf | m >> 4 & 0x0f0, m >> 4 & 0xf | m & 0xf0, (m & 0xf) << 4 | m & 0xf, 1) // #f00
  ) : (m = reHex6$4.exec(format)) ? rgbn$4(parseInt(m[1], 16)) // #ff0000
  : (m = reRgbInteger$4.exec(format)) ? new Rgb$4(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
  : (m = reRgbPercent$4.exec(format)) ? new Rgb$4(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
  : (m = reRgbaInteger$4.exec(format)) ? rgba$4(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
  : (m = reRgbaPercent$4.exec(format)) ? rgba$4(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
  : (m = reHslPercent$4.exec(format)) ? hsla$4(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
  : (m = reHslaPercent$4.exec(format)) ? hsla$4(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
  : named$4.hasOwnProperty(format) ? rgbn$4(named$4[format]) : format === "transparent" ? new Rgb$4(NaN, NaN, NaN, 0) : null;
}

function rgbn$4(n) {
  return new Rgb$4(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba$4(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb$4(r, g, b, a);
}

function rgbConvert$4(o) {
  if (!(o instanceof Color$4)) o = color$4(o);
  if (!o) return new Rgb$4();
  o = o.rgb();
  return new Rgb$4(o.r, o.g, o.b, o.opacity);
}

function rgb$5(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert$4(r) : new Rgb$4(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb$4(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define$4(Rgb$4, rgb$5, extend$4(Color$4, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$4 : Math.pow(_brighter$4, k);
    return new Rgb$4(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$4 : Math.pow(_darker$4, k);
    return new Rgb$4(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function rgb$5() {
    return this;
  },
  displayable: function displayable() {
    return 0 <= this.r && this.r <= 255 && 0 <= this.g && this.g <= 255 && 0 <= this.b && this.b <= 255 && 0 <= this.opacity && this.opacity <= 1;
  },
  toString: function toString() {
    var a = this.opacity;a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(") + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", " + Math.max(0, Math.min(255, Math.round(this.b) || 0)) + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla$4(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;else if (l <= 0 || l >= 1) h = s = NaN;else if (s <= 0) h = NaN;
  return new Hsl$4(h, s, l, a);
}

function hslConvert$4(o) {
  if (o instanceof Hsl$4) return new Hsl$4(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color$4)) o = color$4(o);
  if (!o) return new Hsl$4();
  if (o instanceof Hsl$4) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;else if (g === max) h = (b - r) / s + 2;else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl$4(h, s, l, o.opacity);
}

function hsl$12(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert$4(h) : new Hsl$4(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl$4(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$4(Hsl$4, hsl$12, extend$4(Color$4, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$4 : Math.pow(_brighter$4, k);
    return new Hsl$4(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$4 : Math.pow(_darker$4, k);
    return new Hsl$4(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb$5() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb$4(hsl2rgb$4(h >= 240 ? h - 240 : h + 120, m1, m2), hsl2rgb$4(h, m1, m2), hsl2rgb$4(h < 120 ? h + 240 : h - 120, m1, m2), this.opacity);
  },
  displayable: function displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && 0 <= this.l && this.l <= 1 && 0 <= this.opacity && this.opacity <= 1;
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb$4(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
}

var deg2rad$4 = Math.PI / 180;
var rad2deg$4 = 180 / Math.PI;

var Kn$4 = 18;
var Xn$4 = 0.950470;
var Yn$4 = 1;
var Zn$4 = 1.088830;
var t0$5 = 4 / 29;
var t1$5 = 6 / 29;
var t2$4 = 3 * t1$5 * t1$5;
var t3$4 = t1$5 * t1$5 * t1$5;

function labConvert$4(o) {
  if (o instanceof Lab$4) return new Lab$4(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl$4) {
    var h = o.h * deg2rad$4;
    return new Lab$4(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb$4)) o = rgbConvert$4(o);
  var b = rgb2xyz$4(o.r),
      a = rgb2xyz$4(o.g),
      l = rgb2xyz$4(o.b),
      x = xyz2lab$4((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn$4),
      y = xyz2lab$4((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn$4),
      z = xyz2lab$4((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn$4);
  return new Lab$4(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab$8(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert$4(l) : new Lab$4(l, a, b, opacity == null ? 1 : opacity);
}

function Lab$4(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define$4(Lab$4, lab$8, extend$4(Color$4, {
  brighter: function brighter(k) {
    return new Lab$4(this.l + Kn$4 * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function darker(k) {
    return new Lab$4(this.l - Kn$4 * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function rgb() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn$4 * lab2xyz$4(y);
    x = Xn$4 * lab2xyz$4(x);
    z = Zn$4 * lab2xyz$4(z);
    return new Rgb$4(xyz2rgb$4(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
    xyz2rgb$4(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z), xyz2rgb$4(0.0556434 * x - 0.2040259 * y + 1.0572252 * z), this.opacity);
  }
}));

function xyz2lab$4(t) {
  return t > t3$4 ? Math.pow(t, 1 / 3) : t / t2$4 + t0$5;
}

function lab2xyz$4(t) {
  return t > t1$5 ? t * t * t : t2$4 * (t - t0$5);
}

function xyz2rgb$4(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz$4(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert$4(o) {
  if (o instanceof Hcl$4) return new Hcl$4(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab$4)) o = labConvert$4(o);
  var h = Math.atan2(o.b, o.a) * rad2deg$4;
  return new Hcl$4(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl$12(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert$4(h) : new Hcl$4(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl$4(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define$4(Hcl$4, hcl$12, extend$4(Color$4, {
  brighter: function brighter(k) {
    return new Hcl$4(this.h, this.c, this.l + Kn$4 * (k == null ? 1 : k), this.opacity);
  },
  darker: function darker(k) {
    return new Hcl$4(this.h, this.c, this.l - Kn$4 * (k == null ? 1 : k), this.opacity);
  },
  rgb: function rgb() {
    return labConvert$4(this).rgb();
  }
}));

var A$4 = -0.14861;
var B$4 = +1.78277;
var C$4 = -0.29227;
var D$4 = -0.90649;
var E$4 = +1.97294;
var ED$4 = E$4 * D$4;
var EB$4 = E$4 * B$4;
var BC_DA$4 = B$4 * C$4 - D$4 * A$4;

function cubehelixConvert$4(o) {
  if (o instanceof Cubehelix$4) return new Cubehelix$4(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb$4)) o = rgbConvert$4(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA$4 * b + ED$4 * r - EB$4 * g) / (BC_DA$4 + ED$4 - EB$4),
      bl = b - l,
      k = (E$4 * (g - l) - C$4 * bl) / D$4,
      s = Math.sqrt(k * k + bl * bl) / (E$4 * l * (1 - l)),
      // NaN if l=0 or l=1
  h = s ? Math.atan2(k, bl) * rad2deg$4 - 120 : NaN;
  return new Cubehelix$4(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix$13(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert$4(h) : new Cubehelix$4(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix$4(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define$4(Cubehelix$4, cubehelix$13, extend$4(Color$4, {
  brighter: function brighter(k) {
    k = k == null ? _brighter$4 : Math.pow(_brighter$4, k);
    return new Cubehelix$4(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function darker(k) {
    k = k == null ? _darker$4 : Math.pow(_darker$4, k);
    return new Cubehelix$4(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function rgb() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad$4,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb$4(255 * (l + a * (A$4 * cosh + B$4 * sinh)), 255 * (l + a * (C$4 * cosh + D$4 * sinh)), 255 * (l + a * (E$4 * cosh)), this.opacity);
  }
}));

function basis$9(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1,
      t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
}

var constant$14 = function (x) {
  return function () {
    return x;
  };
};

function linear$10(a, d) {
  return function (t) {
    return a + t * d;
  };
}

function exponential$6(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function (t) {
    return Math.pow(a + t * b, y);
  };
}

function hue$4(a, b) {
  var d = b - a;
  return d ? linear$10(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$14(isNaN(a) ? b : a);
}

function gamma$4(y) {
  return (y = +y) === 1 ? nogamma$4 : function (a, b) {
    return b - a ? exponential$6(a, b, y) : constant$14(isNaN(a) ? b : a);
  };
}

function nogamma$4(a, b) {
  var d = b - a;
  return d ? linear$10(a, d) : constant$14(isNaN(a) ? b : a);
}

var rgb$6 = (function rgbGamma(y) {
  var color$$1 = gamma$4(y);

  function rgb$$1(start, end) {
    var r = color$$1((start = rgb$5(start)).r, (end = rgb$5(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = color$$1(start.opacity, end.opacity);
    return function (t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$1.gamma = rgbGamma;

  return rgb$$1;
})(1);

var array$8 = function (a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) {
    x[i] = interpolateValue$1(a[i], b[i]);
  }for (; i < nb; ++i) {
    c[i] = b[i];
  }return function (t) {
    for (i = 0; i < na; ++i) {
      c[i] = x[i](t);
    }return c;
  };
};

var date$5 = function (a, b) {
  var d = new Date();
  return a = +a, b -= a, function (t) {
    return d.setTime(a + b * t), d;
  };
};

var reinterpolate$1 = function (a, b) {
  return a = +a, b -= a, function (t) {
    return a + b * t;
  };
};

var object$5 = function (a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || (typeof a === "undefined" ? "undefined" : _typeof(a)) !== "object") a = {};
  if (b === null || (typeof b === "undefined" ? "undefined" : _typeof(b)) !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolateValue$1(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function (t) {
    for (k in i) {
      c[k] = i[k](t);
    }return c;
  };
};

var reA$4 = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB$4 = new RegExp(reA$4.source, "g");

function zero$4(b) {
  return function () {
    return b;
  };
}

function one$4(b) {
  return function (t) {
    return b(t) + "";
  };
}

var string = function (a, b) {
  var bi = reA$4.lastIndex = reB$4.lastIndex = 0,
      // scan index for next number in b
  am,
      // current match in a
  bm,
      // current match in b
  bs,
      // string preceding current number in b, if any
  i = -1,
      // index in s
  s = [],
      // string constants and placeholders
  q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA$4.exec(a)) && (bm = reB$4.exec(b))) {
    if ((bs = bm.index) > bi) {
      // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) {
      // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else {
      // interpolate non-matching numbers
      s[++i] = null;
      q.push({ i: i, x: reinterpolate$1(am, bm) });
    }
    bi = reB$4.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? q[0] ? one$4(q[0].x) : zero$4(b) : (b = q.length, function (t) {
    for (var i = 0, o; i < b; ++i) {
      s[(o = q[i]).i] = o.x(t);
    }return s.join("");
  });
};

var interpolateValue$1 = function (a, b) {
    var t = typeof b === "undefined" ? "undefined" : _typeof(b),
        c;
    return b == null || t === "boolean" ? constant$14(b) : (t === "number" ? reinterpolate$1 : t === "string" ? (c = color$4(b)) ? (b = c, rgb$6) : string : b instanceof color$4 ? rgb$6 : b instanceof Date ? date$5 : Array.isArray(b) ? array$8 : isNaN(b) ? object$5 : reinterpolate$1)(a, b);
};

var interpolateRound$1 = function (a, b) {
  return a = +a, b -= a, function (t) {
    return Math.round(a + b * t);
  };
};

var degrees$4 = 180 / Math.PI;

var identity$12 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

var decompose$4 = function (a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees$4,
    skewX: Math.atan(skewX) * degrees$4,
    scaleX: scaleX,
    scaleY: scaleY
  };
};

var cssNode$4;
var cssRoot$4;
var cssView$4;
var svgNode$4;

var rho$4 = Math.SQRT2;
var rho2$4 = 2;
var rho4$4 = 4;
var epsilon2$4 = 1e-12;

function cosh$4(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function sinh$4(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function tanh$4(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

// p0 = [ux0, uy0, w0]
// p1 = [ux1, uy1, w1]

function cubehelix$14(hue$$1) {
  return function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$1(start, end) {
      var h = hue$$1((start = cubehelix$13(start)).h, (end = cubehelix$13(end)).h),
          s = nogamma$4(start.s, end.s),
          l = nogamma$4(start.l, end.l),
          opacity = nogamma$4(start.opacity, end.opacity);
      return function (t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$1.gamma = cubehelixGamma;

    return cubehelix$$1;
  }(1);
}

cubehelix$14(hue$4);
var cubehelixLong$4 = cubehelix$14(nogamma$4);

var constant$15 = function (x) {
  return function () {
    return x;
  };
};

var number$4 = function (x) {
  return +x;
};

var unit$1 = [0, 1];

function deinterpolateLinear$1(a, b) {
  return (b -= a = +a) ? function (x) {
    return (x - a) / b;
  } : constant$15(b);
}

function deinterpolateClamp$1(deinterpolate) {
  return function (a, b) {
    var d = deinterpolate(a = +a, b = +b);
    return function (x) {
      return x <= a ? 0 : x >= b ? 1 : d(x);
    };
  };
}

function reinterpolateClamp$1(reinterpolate) {
  return function (a, b) {
    var r = reinterpolate(a = +a, b = +b);
    return function (t) {
      return t <= 0 ? a : t >= 1 ? b : r(t);
    };
  };
}

function bimap$1(domain, range$$1, deinterpolate, reinterpolate) {
  var d0 = domain[0],
      d1 = domain[1],
      r0 = range$$1[0],
      r1 = range$$1[1];
  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);else d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
  return function (x) {
    return r0(d0(x));
  };
}

function polymap$1(domain, range$$1, deinterpolate, reinterpolate) {
  var j = Math.min(domain.length, range$$1.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range$$1 = range$$1.slice().reverse();
  }

  while (++i < j) {
    d[i] = deinterpolate(domain[i], domain[i + 1]);
    r[i] = reinterpolate(range$$1[i], range$$1[i + 1]);
  }

  return function (x) {
    var i = bisectRight$1(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy$1(source, target) {
  return target.domain(source.domain()).range(source.range()).interpolate(source.interpolate()).clamp(source.clamp());
}

// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
function continuous$1(deinterpolate, reinterpolate) {
  var domain = unit$1,
      range$$1 = unit$1,
      interpolate$$1 = interpolateValue$1,
      clamp = false,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range$$1.length) > 2 ? polymap$1 : bimap$1;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return (output || (output = piecewise(domain, range$$1, clamp ? deinterpolateClamp$1(deinterpolate) : deinterpolate, interpolate$$1)))(+x);
  }

  scale.invert = function (y) {
    return (input || (input = piecewise(range$$1, domain, deinterpolateLinear$1, clamp ? reinterpolateClamp$1(reinterpolate) : reinterpolate)))(+y);
  };

  scale.domain = function (_) {
    return arguments.length ? (domain = map$21.call(_, number$4), rescale()) : domain.slice();
  };

  scale.range = function (_) {
    return arguments.length ? (range$$1 = slice$6.call(_), rescale()) : range$$1.slice();
  };

  scale.rangeRound = function (_) {
    return range$$1 = slice$6.call(_), interpolate$$1 = interpolateRound$1, rescale();
  };

  scale.clamp = function (_) {
    return arguments.length ? (clamp = !!_, rescale()) : clamp;
  };

  scale.interpolate = function (_) {
    return arguments.length ? (interpolate$$1 = _, rescale()) : interpolate$$1;
  };

  return rescale();
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
var formatDecimal$1 = function (x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i,
      coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient, +x.slice(i + 1)];
};

var exponent$5 = function (x) {
  return x = formatDecimal$1(Math.abs(x)), x ? x[1] : NaN;
};

var formatGroup$1 = function (grouping, thousands) {
  return function (value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
};

var formatDefault$1 = function (x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".":
        i0 = i1 = i;break;
      case "0":
        if (i0 === 0) i0 = i;i1 = i;break;
      case "e":
        break out;
      default:
        if (i0 > 0) i0 = 0;break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
};

var prefixExponent$1;

var formatPrefixAuto$1 = function (x, p) {
    var d = formatDecimal$1(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent$1 = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimal$1(x, Math.max(0, p + i - 1))[0]; // less than 1y!
};

var formatRounded$1 = function (x, p) {
    var d = formatDecimal$1(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
};

var formatTypes$1 = {
  "": formatDefault$1,
  "%": function _(x, p) {
    return (x * 100).toFixed(p);
  },
  "b": function b(x) {
    return Math.round(x).toString(2);
  },
  "c": function c(x) {
    return x + "";
  },
  "d": function d(x) {
    return Math.round(x).toString(10);
  },
  "e": function e(x, p) {
    return x.toExponential(p);
  },
  "f": function f(x, p) {
    return x.toFixed(p);
  },
  "g": function g(x, p) {
    return x.toPrecision(p);
  },
  "o": function o(x) {
    return Math.round(x).toString(8);
  },
  "p": function p(x, _p) {
    return formatRounded$1(x * 100, _p);
  },
  "r": formatRounded$1,
  "s": formatPrefixAuto$1,
  "X": function X(x) {
    return Math.round(x).toString(16).toUpperCase();
  },
  "x": function x(_x) {
    return Math.round(_x).toString(16);
  }
};

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re$1 = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

var formatSpecifier$1 = function (specifier) {
  return new FormatSpecifier$1(specifier);
};

function FormatSpecifier$1(specifier) {
  if (!(match = re$1.exec(specifier))) throw new Error("invalid format: " + specifier);

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") comma = true, type = "g";

  // Map invalid types to the default format.
  else if (!formatTypes$1[type]) type = "";

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || fill === "0" && align === "=") zero = true, fill = "0", align = "=";

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier$1.prototype.toString = function () {
  return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width == null ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0)) + this.type;
};

var prefixes$1 = ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];

function identity$13(x) {
  return x;
}

var formatLocale$2 = function (locale) {
  var group = locale.grouping && locale.thousands ? formatGroup$1(locale.grouping, locale.thousands) : identity$13,
      currency = locale.currency,
      decimal = locale.decimal;

  function newFormat(specifier) {
    specifier = formatSpecifier$1(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes$1[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? type ? 6 : 12 : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i,
          n,
          c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Convert negative to positive, and compute the prefix.
        // Note that -0 is not less than 0, but 1 / -0 is!
        var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

        // Perform the initial formatting.
        value = formatType(value, precision);

        // If the original value was negative, it may be rounded to zero during
        // formatting; treat this as (positive) zero.
        if (valueNegative) {
          i = -1, n = value.length;
          valueNegative = false;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 < c && c < 58 || type === "x" && 96 < c && c < 103 || type === "X" && 64 < c && c < 71) {
              valueNegative = true;
              break;
            }
          }
        }

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? sign === "(" ? sign : "-" : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes$1[8 + prefixExponent$1 / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<":
          return valuePrefix + value + valueSuffix + padding;
        case "=":
          return valuePrefix + padding + value + valueSuffix;
        case "^":
          return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
      }
      return padding + valuePrefix + value + valueSuffix;
    }

    format.toString = function () {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier$1(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent$5(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes$1[8 + e / 3];
    return function (value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
};

var locale$3;
var format$2;
var formatPrefix$1;

defaultLocale$2({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale$2(definition) {
  locale$3 = formatLocale$2(definition);
  format$2 = locale$3.format;
  formatPrefix$1 = locale$3.formatPrefix;
  return locale$3;
}

var precisionFixed$1 = function (step) {
  return Math.max(0, -exponent$5(Math.abs(step)));
};

var precisionPrefix$1 = function (step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent$5(value) / 3))) * 3 - exponent$5(Math.abs(step)));
};

var precisionRound$1 = function (step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent$5(max) - exponent$5(step)) + 1;
};

var tickFormat$1 = function (domain, count, specifier) {
  var start = domain[0],
      stop = domain[domain.length - 1],
      step = tickStep$1(start, stop, count == null ? 10 : count),
      precision;
  specifier = formatSpecifier$1(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s":
      {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix$1(step, value))) specifier.precision = precision;
        return formatPrefix$1(specifier, value);
      }
    case "":
    case "e":
    case "g":
    case "p":
    case "r":
      {
        if (specifier.precision == null && !isNaN(precision = precisionRound$1(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
    case "f":
    case "%":
      {
        if (specifier.precision == null && !isNaN(precision = precisionFixed$1(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
  }
  return format$2(specifier);
};

function linearish$1(scale) {
  var domain = scale.domain;

  scale.ticks = function (count) {
    var d = domain();
    return ticks$1(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function (count, specifier) {
    return tickFormat$1(domain(), count, specifier);
  };

  scale.nice = function (count) {
    var d = domain(),
        i = d.length - 1,
        n = count == null ? 10 : count,
        start = d[0],
        stop = d[i],
        step = tickStep$1(start, stop, n);

    if (step) {
      step = tickStep$1(Math.floor(start / step) * step, Math.ceil(stop / step) * step, n);
      d[0] = Math.floor(start / step) * step;
      d[i] = Math.ceil(stop / step) * step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear$9() {
  var scale = continuous$1(deinterpolateLinear$1, reinterpolate$1);

  scale.copy = function () {
    return copy$1(scale, linear$9());
  };

  return linearish$1(scale);
}

function identity$11() {
  var domain = [0, 1];

  function scale(x) {
    return +x;
  }

  scale.invert = scale;

  scale.domain = scale.range = function (_) {
    return arguments.length ? (domain = map$21.call(_, number$4), scale) : domain.slice();
  };

  scale.copy = function () {
    return identity$11().domain(domain);
  };

  return linearish$1(scale);
}

var nice$1 = function (domain, interval) {
  domain = domain.slice();

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }

  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
};

function deinterpolate$1(a, b) {
  return (b = Math.log(b / a)) ? function (x) {
    return Math.log(x / a) / b;
  } : constant$15(b);
}

function reinterpolate$2(a, b) {
  return a < 0 ? function (t) {
    return -Math.pow(-b, t) * Math.pow(-a, 1 - t);
  } : function (t) {
    return Math.pow(b, t) * Math.pow(a, 1 - t);
  };
}

function pow10$1(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}

function powp$1(base) {
  return base === 10 ? pow10$1 : base === Math.E ? Math.exp : function (x) {
    return Math.pow(base, x);
  };
}

function logp$1(base) {
  return base === Math.E ? Math.log : base === 10 && Math.log10 || base === 2 && Math.log2 || (base = Math.log(base), function (x) {
    return Math.log(x) / base;
  });
}

function reflect$1(f) {
  return function (x) {
    return -f(-x);
  };
}

function log$1() {
  var scale = continuous$1(deinterpolate$1, reinterpolate$2).domain([1, 10]),
      domain = scale.domain,
      base = 10,
      logs = logp$1(10),
      pows = powp$1(10);

  function rescale() {
    logs = logp$1(base), pows = powp$1(base);
    if (domain()[0] < 0) logs = reflect$1(logs), pows = reflect$1(pows);
    return scale;
  }

  scale.base = function (_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };

  scale.domain = function (_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.ticks = function (count) {
    var d = domain(),
        u = d[0],
        v = d[d.length - 1],
        r;

    if (r = v < u) i = u, u = v, v = i;

    var i = logs(u),
        j = logs(v),
        p,
        k,
        t,
        n = count == null ? 10 : +count,
        z = [];

    if (!(base % 1) && j - i < n) {
      i = Math.round(i) - 1, j = Math.round(j) + 1;
      if (u > 0) for (; i < j; ++i) {
        for (k = 1, p = pows(i); k < base; ++k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      } else for (; i < j; ++i) {
        for (k = base - 1, p = pows(i); k >= 1; --k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      }
    } else {
      z = ticks$1(i, j, Math.min(j - i, n)).map(pows);
    }

    return r ? z.reverse() : z;
  };

  scale.tickFormat = function (count, specifier) {
    if (specifier == null) specifier = base === 10 ? ".0e" : ",";
    if (typeof specifier !== "function") specifier = format$2(specifier);
    if (count === Infinity) return specifier;
    if (count == null) count = 10;
    var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
    return function (d) {
      var i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? specifier(d) : "";
    };
  };

  scale.nice = function () {
    return domain(nice$1(domain(), {
      floor: function floor(x) {
        return pows(Math.floor(logs(x)));
      },
      ceil: function ceil(x) {
        return pows(Math.ceil(logs(x)));
      }
    }));
  };

  scale.copy = function () {
    return copy$1(scale, log$1().base(base));
  };

  return scale;
}

function raise$6(x, exponent) {
  return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
}

function pow$1() {
  var exponent = 1,
      scale = continuous$1(deinterpolate, reinterpolate),
      domain = scale.domain;

  function deinterpolate(a, b) {
    return (b = raise$6(b, exponent) - (a = raise$6(a, exponent))) ? function (x) {
      return (raise$6(x, exponent) - a) / b;
    } : constant$15(b);
  }

  function reinterpolate(a, b) {
    b = raise$6(b, exponent) - (a = raise$6(a, exponent));
    return function (t) {
      return raise$6(a + b * t, 1 / exponent);
    };
  }

  scale.exponent = function (_) {
    return arguments.length ? (exponent = +_, domain(domain())) : exponent;
  };

  scale.copy = function () {
    return copy$1(scale, pow$1().exponent(exponent));
  };

  return linearish$1(scale);
}

function sqrt$1() {
  return pow$1().exponent(0.5);
}

function quantile$1() {
  var domain = [],
      range$$1 = [],
      thresholds = [];

  function rescale() {
    var i = 0,
        n = Math.max(1, range$$1.length);
    thresholds = new Array(n - 1);
    while (++i < n) {
      thresholds[i - 1] = threshold$2(domain, i / n);
    }return scale;
  }

  function scale(x) {
    if (!isNaN(x = +x)) return range$$1[bisectRight$1(thresholds, x)];
  }

  scale.invertExtent = function (y) {
    var i = range$$1.indexOf(y);
    return i < 0 ? [NaN, NaN] : [i > 0 ? thresholds[i - 1] : domain[0], i < thresholds.length ? thresholds[i] : domain[domain.length - 1]];
  };

  scale.domain = function (_) {
    if (!arguments.length) return domain.slice();
    domain = [];
    for (var i = 0, n = _.length, d; i < n; ++i) {
      if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
    }domain.sort(ascending$5);
    return rescale();
  };

  scale.range = function (_) {
    return arguments.length ? (range$$1 = slice$6.call(_), rescale()) : range$$1.slice();
  };

  scale.quantiles = function () {
    return thresholds.slice();
  };

  scale.copy = function () {
    return quantile$1().domain(domain).range(range$$1);
  };

  return scale;
}

function quantize$6() {
  var x0 = 0,
      x1 = 1,
      n = 1,
      domain = [0.5],
      range$$1 = [0, 1];

  function scale(x) {
    if (x <= x) return range$$1[bisectRight$1(domain, x, 0, n)];
  }

  function rescale() {
    var i = -1;
    domain = new Array(n);
    while (++i < n) {
      domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1);
    }return scale;
  }

  scale.domain = function (_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], rescale()) : [x0, x1];
  };

  scale.range = function (_) {
    return arguments.length ? (n = (range$$1 = slice$6.call(_)).length - 1, rescale()) : range$$1.slice();
  };

  scale.invertExtent = function (y) {
    var i = range$$1.indexOf(y);
    return i < 0 ? [NaN, NaN] : i < 1 ? [x0, domain[0]] : i >= n ? [domain[n - 1], x1] : [domain[i - 1], domain[i]];
  };

  scale.copy = function () {
    return quantize$6().domain([x0, x1]).range(range$$1);
  };

  return linearish$1(scale);
}

function threshold$3() {
  var domain = [0.5],
      range$$1 = [0, 1],
      n = 1;

  function scale(x) {
    if (x <= x) return range$$1[bisectRight$1(domain, x, 0, n)];
  }

  scale.domain = function (_) {
    return arguments.length ? (domain = slice$6.call(_), n = Math.min(domain.length, range$$1.length - 1), scale) : domain.slice();
  };

  scale.range = function (_) {
    return arguments.length ? (range$$1 = slice$6.call(_), n = Math.min(domain.length, range$$1.length - 1), scale) : range$$1.slice();
  };

  scale.invertExtent = function (y) {
    var i = range$$1.indexOf(y);
    return [domain[i - 1], domain[i]];
  };

  scale.copy = function () {
    return threshold$3().domain(domain).range(range$$1);
  };

  return scale;
}

var t0$6 = new Date();
var t1$6 = new Date();

function newInterval$1(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = new Date(+date)), date;
  }

  interval.floor = interval;

  interval.ceil = function (date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = function (date) {
    var d0 = interval(date),
        d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = function (date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = function (start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    do {
      range.push(new Date(+start));
    } while ((offseti(start, step), floori(start), start < stop));
    return range;
  };

  interval.filter = function (test) {
    return newInterval$1(function (date) {
      if (date >= date) while (floori(date), !test(date)) {
        date.setTime(date - 1);
      }
    }, function (date, step) {
      if (date >= date) while (--step >= 0) {
        while (offseti(date, 1), !test(date)) {}
      } // eslint-disable-line no-empty
    });
  };

  if (count) {
    interval.count = function (start, end) {
      t0$6.setTime(+start), t1$6.setTime(+end);
      floori(t0$6), floori(t1$6);
      return Math.floor(count(t0$6, t1$6));
    };

    interval.every = function (step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval : interval.filter(field ? function (d) {
        return field(d) % step === 0;
      } : function (d) {
        return interval.count(0, d) % step === 0;
      });
    };
  }

  return interval;
}

var millisecond$1 = newInterval$1(function () {
  // noop
}, function (date, step) {
  date.setTime(+date + step);
}, function (start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
millisecond$1.every = function (k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond$1;
  return newInterval$1(function (date) {
    date.setTime(Math.floor(date / k) * k);
  }, function (date, step) {
    date.setTime(+date + step * k);
  }, function (start, end) {
    return (end - start) / k;
  });
};

var durationSecond$3 = 1e3;
var durationMinute$3 = 6e4;
var durationHour$3 = 36e5;
var durationDay$3 = 864e5;
var durationWeek$3 = 6048e5;

var second$1 = newInterval$1(function (date) {
  date.setTime(Math.floor(date / durationSecond$3) * durationSecond$3);
}, function (date, step) {
  date.setTime(+date + step * durationSecond$3);
}, function (start, end) {
  return (end - start) / durationSecond$3;
}, function (date) {
  return date.getUTCSeconds();
});

var minute$1 = newInterval$1(function (date) {
  date.setTime(Math.floor(date / durationMinute$3) * durationMinute$3);
}, function (date, step) {
  date.setTime(+date + step * durationMinute$3);
}, function (start, end) {
  return (end - start) / durationMinute$3;
}, function (date) {
  return date.getMinutes();
});

var hour$1 = newInterval$1(function (date) {
  var offset = date.getTimezoneOffset() * durationMinute$3 % durationHour$3;
  if (offset < 0) offset += durationHour$3;
  date.setTime(Math.floor((+date - offset) / durationHour$3) * durationHour$3 + offset);
}, function (date, step) {
  date.setTime(+date + step * durationHour$3);
}, function (start, end) {
  return (end - start) / durationHour$3;
}, function (date) {
  return date.getHours();
});

var day$1 = newInterval$1(function (date) {
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setDate(date.getDate() + step);
}, function (start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$3) / durationDay$3;
}, function (date) {
  return date.getDate() - 1;
});

function weekday$1(i) {
  return newInterval$1(function (date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function (start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$3) / durationWeek$3;
  });
}

var sunday$1 = weekday$1(0);
var monday$1 = weekday$1(1);
var tuesday$1 = weekday$1(2);
var wednesday$1 = weekday$1(3);
var thursday$1 = weekday$1(4);
var friday$1 = weekday$1(5);
var saturday$1 = weekday$1(6);

var month$1 = newInterval$1(function (date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setMonth(date.getMonth() + step);
}, function (start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function (date) {
  return date.getMonth();
});

var year$1 = newInterval$1(function (date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function (date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function (start, end) {
  return end.getFullYear() - start.getFullYear();
}, function (date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
year$1.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval$1(function (date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

var utcMinute$2 = newInterval$1(function (date) {
  date.setUTCSeconds(0, 0);
}, function (date, step) {
  date.setTime(+date + step * durationMinute$3);
}, function (start, end) {
  return (end - start) / durationMinute$3;
}, function (date) {
  return date.getUTCMinutes();
});

var utcHour$2 = newInterval$1(function (date) {
  date.setUTCMinutes(0, 0, 0);
}, function (date, step) {
  date.setTime(+date + step * durationHour$3);
}, function (start, end) {
  return (end - start) / durationHour$3;
}, function (date) {
  return date.getUTCHours();
});

var utcDay$2 = newInterval$1(function (date) {
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function (start, end) {
  return (end - start) / durationDay$3;
}, function (date) {
  return date.getUTCDate() - 1;
});

function utcWeekday$1(i) {
  return newInterval$1(function (date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function (start, end) {
    return (end - start) / durationWeek$3;
  });
}

var utcSunday$1 = utcWeekday$1(0);
var utcMonday$1 = utcWeekday$1(1);
var utcTuesday$1 = utcWeekday$1(2);
var utcWednesday$1 = utcWeekday$1(3);
var utcThursday$1 = utcWeekday$1(4);
var utcFriday$1 = utcWeekday$1(5);
var utcSaturday$1 = utcWeekday$1(6);

var utcMonth$2 = newInterval$1(function (date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function (start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function (date) {
  return date.getUTCMonth();
});

var utcYear$2 = newInterval$1(function (date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function (start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function (date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear$2.every = function (k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval$1(function (date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function (date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

function localDate$1(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate$1(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newYear$1(y) {
  return { y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0 };
}

function formatLocale$3(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe$1(locale_periods),
      periodLookup = formatLookup$1(locale_periods),
      weekdayRe = formatRe$1(locale_weekdays),
      weekdayLookup = formatLookup$1(locale_weekdays),
      shortWeekdayRe = formatRe$1(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup$1(locale_shortWeekdays),
      monthRe = formatRe$1(locale_months),
      monthLookup = formatLookup$1(locale_months),
      shortMonthRe = formatRe$1(locale_shortMonths),
      shortMonthLookup = formatLookup$1(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth$1,
    "e": formatDayOfMonth$1,
    "H": formatHour24$1,
    "I": formatHour12$1,
    "j": formatDayOfYear$1,
    "L": formatMilliseconds$1,
    "m": formatMonthNumber$1,
    "M": formatMinutes$1,
    "p": formatPeriod,
    "S": formatSeconds$1,
    "U": formatWeekNumberSunday$1,
    "w": formatWeekdayNumber$1,
    "W": formatWeekNumberMonday$1,
    "x": null,
    "X": null,
    "y": formatYear$1,
    "Y": formatFullYear$1,
    "Z": formatZone$1,
    "%": formatLiteralPercent$1
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth$1,
    "e": formatUTCDayOfMonth$1,
    "H": formatUTCHour24$1,
    "I": formatUTCHour12$1,
    "j": formatUTCDayOfYear$1,
    "L": formatUTCMilliseconds$1,
    "m": formatUTCMonthNumber$1,
    "M": formatUTCMinutes$1,
    "p": formatUTCPeriod,
    "S": formatUTCSeconds$1,
    "U": formatUTCWeekNumberSunday$1,
    "w": formatUTCWeekdayNumber$1,
    "W": formatUTCWeekNumberMonday$1,
    "x": null,
    "X": null,
    "y": formatUTCYear$1,
    "Y": formatUTCFullYear$1,
    "Z": formatUTCZone$1,
    "%": formatLiteralPercent$1
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth$1,
    "e": parseDayOfMonth$1,
    "H": parseHour24$1,
    "I": parseHour24$1,
    "j": parseDayOfYear$1,
    "L": parseMilliseconds$1,
    "m": parseMonthNumber$1,
    "M": parseMinutes$1,
    "p": parsePeriod,
    "S": parseSeconds$1,
    "U": parseWeekNumberSunday$1,
    "w": parseWeekdayNumber$1,
    "W": parseWeekNumberMonday$1,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear$1,
    "Y": parseFullYear$1,
    "Z": parseZone$1,
    "%": parseLiteralPercent$1
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function (date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) date = new Date(+date);

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads$1[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, newDate) {
    return function (string) {
      var d = newYear$1(1900),
          i = parseSpecifier(d, specifier, string += "", 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "W" in d ? 1 : 0;
        var day = "Z" in d ? utcDate$1(newYear$1(d.y)).getUTCDay() : newDate(newYear$1(d.y)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate$1(d);
      }

      // Otherwise, all fields are in local time.
      return newDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads$1 ? specifier.charAt(i++) : c];
        if (!parse || (j = parse(d, string, j)) < 0) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  return {
    format: function format(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    parse: function parse(specifier) {
      var p = newParse(specifier += "", localDate$1);
      p.toString = function () {
        return specifier;
      };
      return p;
    },
    utcFormat: function utcFormat(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function () {
        return specifier;
      };
      return f;
    },
    utcParse: function utcParse(specifier) {
      var p = newParse(specifier, utcDate$1);
      p.toString = function () {
        return specifier;
      };
      return p;
    }
  };
}

var pads$1 = { "-": "", "_": " ", "0": "0" };
var numberRe$1 = /^\s*\d+/;
var percentRe$1 = /^%/;
var requoteRe$1 = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

function pad$1(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote$1(s) {
  return s.replace(requoteRe$1, "\\$&");
}

function formatRe$1(names) {
  return new RegExp("^(?:" + names.map(requote$1).join("|") + ")", "i");
}

function formatLookup$1(names) {
  var map = {},
      i = -1,
      n = names.length;
  while (++i < n) {
    map[names[i].toLowerCase()] = i;
  }return map;
}

function parseWeekdayNumber$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone$1(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseMonthNumber$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds$1(d, string, i) {
  var n = numberRe$1.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseLiteralPercent$1(d, string, i) {
  var n = percentRe$1.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function formatDayOfMonth$1(d, p) {
  return pad$1(d.getDate(), p, 2);
}

function formatHour24$1(d, p) {
  return pad$1(d.getHours(), p, 2);
}

function formatHour12$1(d, p) {
  return pad$1(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear$1(d, p) {
  return pad$1(1 + day$1.count(year$1(d), d), p, 3);
}

function formatMilliseconds$1(d, p) {
  return pad$1(d.getMilliseconds(), p, 3);
}

function formatMonthNumber$1(d, p) {
  return pad$1(d.getMonth() + 1, p, 2);
}

function formatMinutes$1(d, p) {
  return pad$1(d.getMinutes(), p, 2);
}

function formatSeconds$1(d, p) {
  return pad$1(d.getSeconds(), p, 2);
}

function formatWeekNumberSunday$1(d, p) {
  return pad$1(sunday$1.count(year$1(d), d), p, 2);
}

function formatWeekdayNumber$1(d) {
  return d.getDay();
}

function formatWeekNumberMonday$1(d, p) {
  return pad$1(monday$1.count(year$1(d), d), p, 2);
}

function formatYear$1(d, p) {
  return pad$1(d.getFullYear() % 100, p, 2);
}

function formatFullYear$1(d, p) {
  return pad$1(d.getFullYear() % 10000, p, 4);
}

function formatZone$1(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+")) + pad$1(z / 60 | 0, "0", 2) + pad$1(z % 60, "0", 2);
}

function formatUTCDayOfMonth$1(d, p) {
  return pad$1(d.getUTCDate(), p, 2);
}

function formatUTCHour24$1(d, p) {
  return pad$1(d.getUTCHours(), p, 2);
}

function formatUTCHour12$1(d, p) {
  return pad$1(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear$1(d, p) {
  return pad$1(1 + utcDay$2.count(utcYear$2(d), d), p, 3);
}

function formatUTCMilliseconds$1(d, p) {
  return pad$1(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMonthNumber$1(d, p) {
  return pad$1(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes$1(d, p) {
  return pad$1(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds$1(d, p) {
  return pad$1(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekNumberSunday$1(d, p) {
  return pad$1(utcSunday$1.count(utcYear$2(d), d), p, 2);
}

function formatUTCWeekdayNumber$1(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday$1(d, p) {
  return pad$1(utcMonday$1.count(utcYear$2(d), d), p, 2);
}

function formatUTCYear$1(d, p) {
  return pad$1(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear$1(d, p) {
  return pad$1(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone$1() {
  return "+0000";
}

function formatLiteralPercent$1() {
  return "%";
}

var locale$4;
var timeFormat$1;
var timeParse$1;
var utcFormat$2;
var utcParse$2;

defaultLocale$3({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale$3(definition) {
  locale$4 = formatLocale$3(definition);
  timeFormat$1 = locale$4.format;
  timeParse$1 = locale$4.parse;
  utcFormat$2 = locale$4.utcFormat;
  utcParse$2 = locale$4.utcParse;
  return locale$4;
}

var isoSpecifier$1 = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative$1(date) {
    return date.toISOString();
}

var formatIso$2 = Date.prototype.toISOString ? formatIsoNative$1 : utcFormat$2(isoSpecifier$1);

function parseIsoNative$1(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso$2 = +new Date("2000-01-01T00:00:00.000Z") ? parseIsoNative$1 : utcParse$2(isoSpecifier$1);

var durationSecond$2 = 1000;
var durationMinute$2 = durationSecond$2 * 60;
var durationHour$2 = durationMinute$2 * 60;
var durationDay$2 = durationHour$2 * 24;
var durationWeek$2 = durationDay$2 * 7;
var durationMonth$1 = durationDay$2 * 30;
var durationYear$1 = durationDay$2 * 365;

function date$6(t) {
  return new Date(t);
}

function number$5(t) {
  return t instanceof Date ? +t : +new Date(+t);
}

function calendar$1(year, month, week, day, hour, minute, second, millisecond, format) {
  var scale = continuous$1(deinterpolateLinear$1, reinterpolate$1),
      invert = scale.invert,
      domain = scale.domain;

  var formatMillisecond = format(".%L"),
      formatSecond = format(":%S"),
      formatMinute = format("%I:%M"),
      formatHour = format("%I %p"),
      formatDay = format("%a %d"),
      formatWeek = format("%b %d"),
      formatMonth = format("%B"),
      formatYear = format("%Y");

  var tickIntervals = [[second, 1, durationSecond$2], [second, 5, 5 * durationSecond$2], [second, 15, 15 * durationSecond$2], [second, 30, 30 * durationSecond$2], [minute, 1, durationMinute$2], [minute, 5, 5 * durationMinute$2], [minute, 15, 15 * durationMinute$2], [minute, 30, 30 * durationMinute$2], [hour, 1, durationHour$2], [hour, 3, 3 * durationHour$2], [hour, 6, 6 * durationHour$2], [hour, 12, 12 * durationHour$2], [day, 1, durationDay$2], [day, 2, 2 * durationDay$2], [week, 1, durationWeek$2], [month, 1, durationMonth$1], [month, 3, 3 * durationMonth$1], [year, 1, durationYear$1]];

  function tickFormat(date) {
    return (second(date) < date ? formatMillisecond : minute(date) < date ? formatSecond : hour(date) < date ? formatMinute : day(date) < date ? formatHour : month(date) < date ? week(date) < date ? formatDay : formatWeek : year(date) < date ? formatMonth : formatYear)(date);
  }

  function tickInterval(interval, start, stop, step) {
    if (interval == null) interval = 10;

    // If a desired tick count is specified, pick a reasonable tick interval
    // based on the extent of the domain and a rough estimate of tick size.
    // Otherwise, assume interval is already a time interval and use it.
    if (typeof interval === "number") {
      var target = Math.abs(stop - start) / interval,
          i = bisector$1(function (i) {
        return i[2];
      }).right(tickIntervals, target);
      if (i === tickIntervals.length) {
        step = tickStep$1(start / durationYear$1, stop / durationYear$1, interval);
        interval = year;
      } else if (i) {
        i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
        step = i[1];
        interval = i[0];
      } else {
        step = tickStep$1(start, stop, interval);
        interval = millisecond;
      }
    }

    return step == null ? interval : interval.every(step);
  }

  scale.invert = function (y) {
    return new Date(invert(y));
  };

  scale.domain = function (_) {
    return arguments.length ? domain(map$21.call(_, number$5)) : domain().map(date$6);
  };

  scale.ticks = function (interval, step) {
    var d = domain(),
        t0 = d[0],
        t1 = d[d.length - 1],
        r = t1 < t0,
        t;
    if (r) t = t0, t0 = t1, t1 = t;
    t = tickInterval(interval, t0, t1, step);
    t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
    return r ? t.reverse() : t;
  };

  scale.tickFormat = function (count, specifier) {
    return specifier == null ? tickFormat : format(specifier);
  };

  scale.nice = function (interval, step) {
    var d = domain();
    return (interval = tickInterval(interval, d[0], d[d.length - 1], step)) ? domain(nice$1(d, interval)) : scale;
  };

  scale.copy = function () {
    return copy$1(scale, calendar$1(year, month, week, day, hour, minute, second, millisecond, format));
  };

  return scale;
}

var time$1 = function () {
  return calendar$1(year$1, month$1, sunday$1, day$1, hour$1, minute$1, second$1, millisecond$1, timeFormat$1).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]);
};

var utcTime$1 = function () {
  return calendar$1(utcYear$2, utcMonth$2, utcSunday$1, utcDay$2, utcHour$2, utcMinute$2, second$1, millisecond$1, utcFormat$2).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]);
};

var colors$1 = function (s) {
  return s.match(/.{6}/g).map(function (x) {
    return "#" + x;
  });
};

var category10$1 = colors$1("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

var category20b$1 = colors$1("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

var category20c$1 = colors$1("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

var category20$1 = colors$1("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

var cubehelix$16 = cubehelixLong$4(cubehelix$13(300, 0.5, 0.0), cubehelix$13(-240, 0.5, 1.0));

var warm$1 = cubehelixLong$4(cubehelix$13(-100, 0.75, 0.35), cubehelix$13(80, 1.50, 0.8));

var cool$1 = cubehelixLong$4(cubehelix$13(260, 0.75, 0.35), cubehelix$13(80, 1.50, 0.8));

var rainbow$2 = cubehelix$13();

var rainbow$3 = function (t) {
  if (t < 0 || t > 1) t -= Math.floor(t);
  var ts = Math.abs(t - 0.5);
  rainbow$2.h = 360 * t - 100;
  rainbow$2.s = 1.5 - 1.5 * ts;
  rainbow$2.l = 0.8 - 0.9 * ts;
  return rainbow$2 + "";
};

function ramp$1(range) {
  var n = range.length;
  return function (t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

var viridis$1 = ramp$1(colors$1("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var magma$1 = ramp$1(colors$1("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var inferno$1 = ramp$1(colors$1("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var plasma$1 = ramp$1(colors$1("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

function sequential$1(interpolator) {
  var x0 = 0,
      x1 = 1,
      clamp = false;

  function scale(x) {
    var t = (x - x0) / (x1 - x0);
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }

  scale.domain = function (_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], scale) : [x0, x1];
  };

  scale.clamp = function (_) {
    return arguments.length ? (clamp = !!_, scale) : clamp;
  };

  scale.interpolator = function (_) {
    return arguments.length ? (interpolator = _, scale) : interpolator;
  };

  scale.copy = function () {
    return sequential$1(interpolator).domain([x0, x1]).clamp(clamp);
  };

  return linearish$1(scale);
}



var d3 = Object.freeze({
	scaleBand: band$1,
	scalePoint: point$7,
	scaleIdentity: identity$11,
	scaleLinear: linear$9,
	scaleLog: log$1,
	scaleOrdinal: ordinal$1,
	scaleImplicit: implicit$1,
	scalePow: pow$1,
	scaleSqrt: sqrt$1,
	scaleQuantile: quantile$1,
	scaleQuantize: quantize$6,
	scaleThreshold: threshold$3,
	scaleTime: time$1,
	scaleUtc: utcTime$1,
	schemeCategory10: category10$1,
	schemeCategory20b: category20b$1,
	schemeCategory20c: category20c$1,
	schemeCategory20: category20$1,
	interpolateCubehelixDefault: cubehelix$16,
	interpolateRainbow: rainbow$3,
	interpolateWarm: warm$1,
	interpolateCool: cool$1,
	interpolateViridis: viridis$1,
	interpolateMagma: magma$1,
	interpolateInferno: inferno$1,
	interpolatePlasma: plasma$1,
	scaleSequential: sequential$1
});

var capfirst = function (text) {
    text = '' + text;
    return text[0].toUpperCase() + text.substring(1);
};

var scaleProto = {
    scale: function scale() {
        var transform = this.transform || 'linear';
        var scaleFunction = d3['scale' + capfirst(transform)];
        var scale = scaleFunction();
        if (this.nice) scale.nice();
        return scale.range(this.range()).domain(this.domain());
    },


    // return the scale range, must be implemented by scales
    domain: function domain() {
        return this.plot.coord[this.type];
    },


    // return the scale range, must be implemented by scales
    range: function range() {}
};

// Scale factory container
var scales = assign$4(map$10(), {
    add: function add(type, scale) {

        function Scale(plot, options) {
            initScale(this, type, plot, options);
        }

        Scale.prototype = assign$4({}, scaleProto, scale);

        this.set(type, Scale);
        return this.get(type);
    }
});

function initScale(scale, type, plot, options) {
    scale.options = options || {};

    Object.defineProperties(scale, {
        type: {
            get: function get() {
                return type;
            }
        },
        plot: {
            get: function get() {
                return plot;
            }
        }
    });
}

// Coordinate system
var defaultSystem = 'cartesian';

var coordProto = {
    axes: [],

    domains: function domains(data) {
        var coord = this,
            plot = this.plot,
            done = {},
            domain,
            field;

        this.axes.forEach(function (axis) {
            domain = [+Infinity, -Infinity];

            plot.layers.forEach(function (layer) {
                field = layer.mapping[axis].from;

                if (field) {
                    if (!done[field]) done[field] = extent$1(data, function (d) {
                        return d[field];
                    });

                    domain[0] = Math.min(domain[0], done[field][0]);
                    domain[1] = Math.max(domain[1], done[field][1]);
                }
            });
            coord[axis] = domain;
        });
    }
};

// Scale factory container
var coords = assign$4(map$10(), {
    add: function add(type, coord) {

        function Coord(plot) {
            initCoord(this, type, plot);
        }

        Coord.prototype = assign$4({}, coordProto, coord);

        this.set(type, Coord);
        return this.get(type);
    },
    create: function create(plot, type) {
        type = type || defaultSystem;
        var Coord = this.get(type);
        if (!Coord) {
            warn$2('Coordinate system ' + type + ' not available');
            Coord = this.get(defaultSystem);
        }
        return new Coord(plot);
    }
});

function initCoord(coord, type, plot) {

    Object.defineProperties(coord, {
        type: {
            get: function get() {
                return type;
            }
        },
        plot: {
            get: function get() {
                return plot;
            }
        }
    });
}

var translate = function (x, y) {
    if (arguments.length === 2) return "translate(" + x + ", " + y + ")";else return "translate(" + x + ")";
};

var plotCount = 0;
var plotEvents = dispatch$6('init', 'before-draw', 'after-draw');

var plotProto = {
    layers: [],

    addLayer: function addLayer(options) {
        if (isString$2(options)) options = { type: options };

        var Layer = layers.get(options.type);
        if (!Layer) warn$2('Layer type "' + options.type + '" not available');else {
            addLayerConfig(this, options.type);
            var layer = new Layer(this, options);
            this.layers.push(layer);
            return layer;
        }
    },
    addScale: function addScale(type, options) {
        var Scale = scales.get(type);
        if (!Scale) warn$2('Scale type "' + type + '" not available');else {
            var scale = new Scale(this, options);
            this.scales.set(scale.type, scale);
            return scale;
        }
    },


    // Return a group element for a plot layer
    group: function group(layer, tag) {
        var sheet = this.paper.sheet(layer),
            group = sheet.sel.selectAll('#' + layer.uid).data([layer]);

        return group.enter().append(tag || 'g').attr('id', layer.uid).merge(group).attr('transform', translate(this.margin.left, this.margin.top));
    },


    // Draw a plot on a paper
    draw: function draw() {
        var plot = this,
            serie = plot.dataStore.serie(plot.config.dataSource);

        if (!serie) return;
        //
        // This is the data/filtering for the plot
        // TODO: Need to generalise this step
        var data = serie.natural.top(Infinity);

        // find domain of scales
        this.coord.domains(data);

        this.layers.forEach(function (layer) {
            if (layer.visible && layer.canDraw(data)) {
                layers.events.call('before-draw', layer, data);
                viewProviders.logger.info('Drawing ' + layer.type + ' layer from series ' + serie.name);
                layer.draw(data);
                layers.events.call('after-draw', layer, data);
            }
        });
    },
    mapper: function mapper(mapping, scale, def) {
        var plotScale,
            field = mapping ? mapping.from : null;

        if (scale) {
            plotScale = this.scales.get(scale);
            if (!plotScale) warn$2('plot scale "' + scale + '" not available');else plotScale = plotScale.scale();
        }
        return function (d) {
            var value = d[field];
            if (value === undefined) value = def;
            if (plotScale) value = plotScale(value);
            return value;
        };
    },
    translate: function translate(x, y) {
        return function (d) {
            var xt = x(d) || 0,
                yt = y(d) || 0;
            return 'translate(' + xt + ', ' + yt + ')';
        };
    },
    destroy: function destroy() {}
};

//
// Plot factory object
var plots = assign$4(map$10(), {
    events: plotEvents,
    proto: plotProto,
    //
    // add a new plot class to the factory
    add: function add(type, plot) {

        function Plot(paper, options) {
            initPlot(this, type, paper, options);
        }

        Plot.prototype = assign$4({}, this.proto, plot);

        this.set(type, Plot);
    }
});

// A Plot is the combination is a visualisation on a paper
function initPlot(plot, type, paper, options) {
    var protoLayers = plot.layers,
        plotLayers = [],
        plotScales = map$10(),
        config = paper.config.$child({ layers: {} }),
        coord = coords.create(plot, options.coord),
        name = options.name;

    ++plotCount;

    if (!name) name = 'plot' + plotCount;

    Object.defineProperties(viewUid(plot), {
        config: {
            get: function get() {
                return config;
            }
        },
        layers: {
            get: function get() {
                return plotLayers;
            }
        },
        name: {
            get: function get() {
                return name;
            }
        },
        paper: {
            get: function get() {
                return paper;
            }
        },
        scales: {
            get: function get() {
                return plotScales;
            }
        },
        coord: {
            get: function get() {
                return coord;
            }
        },
        type: {
            get: function get() {
                return type;
            }
        }
    });

    plotEvents.call('init', plot, options);

    addScales(plot, options.scales || {});

    protoLayers.forEach(function (opts) {
        if (isString$2(opts)) opts = { type: opts };
        // Add layer information in plot configuration
        addLayerConfig(plot, opts.type, options[opts.type]);
        plot.addLayer(opts);
    });
}

function addLayerConfig(plot, type, options) {
    var cfg = plot.config.layers[type];
    if (!cfg) plot.config.layers[type] = plot.paper.config.layers[type].$child(options);
}

function addScales(plot, options) {
    scales.each(function (scale, type) {
        plot.addScale(type, options[scale.type]);
    });
}

var newSheet = function (paper) {
    if (paper.type === 'svg') return new Svg(paper);else return new Canvas(paper);
};

function Svg(paper) {
    initSheet(this, paper);
}

function Canvas(paper) {
    initSheet(this, paper);
}

function initSheet(sheet, paper) {
    var c = paper.container,
        selection$$1 = c.append(paper.type).classed('d3-sheet', true),
        node = selection$$1.node(),
        position = c.select(paper.type).node() === node ? 'relative' : 'absolute',
        element = sheet.createElement(node, paper);

    selection$$1.style('position', position).style('top', 0).style('left', 0);

    Object.defineProperties(sheet, {
        paper: {
            get: function get() {
                return paper;
            }
        },
        type: {
            get: function get() {
                return paper.type;
            }
        },
        element: {
            get: function get() {
                return element;
            }
        },
        node: {
            get: function get() {
                return node;
            }
        },
        sel: {
            get: function get() {
                return select$7(this.element);
            }
        }
    });

    // make sure the size and definition are correct
    sheet.clear();
}

Svg.prototype = {
    createElement: function createElement(node) {
        return node;
    },
    clear: function clear() {
        this.sel.style('width', this.paper.width).style('height', this.paper.height);
        return this;
    },
    toJson: function toJson() {},
    gradient: function gradient() {}
};

Canvas.prototype = assign$4({}, Svg.prototype, {
    createElement: function createElement(node, paper) {
        return canvasSelection$1(node.getContext('2d'), paper.config.factor).node();
    },
    clear: function clear() {
        var ctx = this.element.context,
            width = this.paper.width,
            height = this.paper.height,
            factor = this.element.factor;
        ctx.beginPath();
        ctx.closePath();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.canvas.width = width;
        ctx.canvas.height = height;

        if (factor != 1) {
            ctx.canvas.style.width = width + "px";
            ctx.canvas.style.height = height + "px";
            ctx.canvas.width = width * window.devicePixelRatio;
            ctx.canvas.height = height * window.devicePixelRatio;
            ctx.scale(factor, factor);
        }
        return this;
    },
    gradient: function gradient() {}
});

var paperCount = 0;

function paper(element, options) {
    if (arguments.length === 1 && isObject$2(element)) {
        options = element;
        element = null;
    }
    return new Paper(element, options);
}

//
// Paper object is a container of plot objects
function Paper(element, options) {
    if (!options) options = {};
    element = getElement(element);
    ++paperCount;

    var type = options.type || 'canvas',
        plots$$1 = [],
        config = model$3({
        layers: {}
    }),
        sheets = [];

    select$7(element).append('div').attr('id', viewUid(this, 'p').uid).classed('d3-paper', true).classed('d3-paper-' + type, true);

    this.name = options.name || 'paper' + paperCount;

    // size of paper
    this.fitToElement = function () {
        assign$4(this, getSize(this.element, options));
    };

    Object.defineProperties(this, {
        plots: {
            get: function get() {
                return plots$$1;
            }
        },
        sheets: {
            get: function get() {
                return sheets;
            }
        },
        type: {
            get: function get() {
                return type;
            }
        },
        element: {
            get: function get() {
                return select$7(element);
            }
        },
        container: {
            get: function get() {
                return this.element.select('#' + this.uid);
            }
        },
        size: {
            get: function get() {
                return [this.width, this.height];
            }
        },
        config: {
            get: function get() {
                return config;
            }
        }
    });
    paper.live.push(this);
    paper.events.call('init', this, options);

    layers.each(function (Layer, type) {
        config.layers[type] = config.$new(Layer.prototype.defaults).$update(options[type]);
    });

    initPlots(this, options);
}

Paper.prototype = paper.prototype = {
    addPlot: function addPlot(options) {
        if (isString$2(options)) options = { type: options };
        var Plot = plots.get(options.type);
        if (!Plot) warn$2('Plot type "' + options.type + '" not available');else {
            var plot = new Plot(this, options);
            this.plots.push(plot);
            return plot;
        }
    },
    sheet: function sheet() {
        if (!this._mainSheet) this._mainSheet = this.addSheet();
        return this._mainSheet;
    },
    clear: function clear() {
        this.sheets.forEach(function (sheet) {
            sheet.clear();
        });
    },
    draw: function draw() {
        if (!this.drawCount) {
            this.drawCount = 1;
            this.fitToElement();
        } else {
            this.drawCount++;
            this.clear();
        }
        this.plots.forEach(function (plot) {
            plot.draw();
        });
    },
    toJson: function toJson() {
        var json = {
            name: this.name,
            sheets: []
        };
        this.sheets.forEach(function () {
            json.sheets.push(this.toJson());
        });
        paper.events.call('json', this, json);
        return json;
    },
    addSheet: function addSheet() {
        var sheet = newSheet(this);
        this.sheets.push(sheet);
        return sheet;
    },


    /**
     * Resize the paper if it needs resizing
     */
    resize: function resize(size) {
        if (!size) size = boundingBox(this);
        var currentSize = this.size;

        if (currentSize[0] !== size[0] || currentSize[1] !== size[1]) {
            this.width = size[0];
            this.height = size[1];
            paper.events.call('before-draw', this);
            this.draw();
            paper.events.call('after-draw', this);
        }
        return this;
    },
    destroy: function destroy() {
        var idx = paper.live.indexOf(this);
        if (idx > -1) {
            paper.live.splice(idx, 1);
            this.config.$off();
            this.plots.forEach(function (plot) {
                plot.destroy();
            });
        }
    }
};

// Paper globals
paper.events = dispatch$6('init', 'before-draw', 'after-draw');
paper.live = [];
paper.constants = (inBrowser$2 ? window.fluidPaper : null) || {};

function getElement(element) {
    if (!element) {
        element = document.createElement('div');
    }if (isFunction$2(element.node)) element = element.node();
    return element;
}

function initPlots(paper, options) {
    //
    // Initialise paper plots
    if (options && options.plots) {
        var plots$$1 = options.plots;
        if (!isArray$2(plots$$1)) plots$$1 = [plots$$1];
        plots$$1.forEach(function (opts) {
            paper.addPlot(opts);
        });
    }
}

var responseHandlers = {
    'application/json': function applicationJson(vm, response) {
        return response.json().then(function (data) {
            return vm.build(data);
        });
    }
};

function fetchBuild(vm, src, attr) {
    var fetch = viewProviders.fetch;

    if (src.substring(src.length - 3) === '.js') {
        return viewRequire([src]).then(function (data) {
            return vm.build(data, attr);
        });
    } else {
        return fetch(src, { method: 'GET' }).then(function (response) {
            if (response.status === 200) {
                var ct = response.headers.get('content-type'),
                    handler = responseHandlers[ct];

                if (handler) return handler(vm, response);else warn$2('No handler for ' + ct);
            } else warn$2('Could not load form from ' + src + ': status ' + response.status);
        });
    }
}

var fluid = {

    props: ["src"],

    model: {},

    render: function render(data, attr) {
        var src = data.src;
        if (isObject$2(src)) return this.build(src, attr);else if (src) return fetchBuild(this, src, attr);
    },
    build: function build(config) {
        var store = fluidStore(this);
        config = assign$4({}, config);
        if (config.data) {
            store.add(pop$3(config, 'data'));
        }
        var dashboard = pop$3(config, 'dashboard');
        if (!dashboard) {
            dashboard = {
                "paper": "paper"
            };
            config = {
                paper: config
            };
        }
        this.board = new Dashboard(dashboard, config, store);
        return this.board.container;
    },
    mounted: function mounted() {
        this.board.papers.each(function (paper$$1) {
            paper$$1.draw();
        });
    }
};

function Dashboard(layout, config, store) {
    this.container = htmlElement$1('<div class="container-fluid"></div>');
    this.papers = map$10();

    var container = select$7(this.container),
        papers = this.papers,
        options;

    if (!layout.rows) layout = { rows: [layout] };
    var rows = container.selectAll('.rows').data(layout.rows).enter().append('div').classed('row', true);

    rows.selectAll('.col').data(function () {
        var row = select$7(this).datum();
        var columns = row.columns;
        if (!columns) columns = [row];
        return columns;
    }).enter().append(function (col) {
        if (isString$2(col)) col = { paper: col };
        //
        var el = select$7(htmlElement$1('<div class="col"></div>'));
        if (col.class) el.classed(col.class, true);
        if (col.html) el.html(col.html);
        if (col.aspect) el.attr('data-aspect-ratio', col.aspect);
        if (col.paper) {
            options = assign$4({}, config[col.paper], {
                dataStore: store
            });
            papers.set(col.paper, paper(el, options));
        }
        return el.node();
    });
}

var plugin$4 = {
    install: function install(vm) {
        vm.addComponent('d3list', list);
        vm.addComponent('d3fluid', fluid);
    }
};

var version$8 = "0.1.2";

var pi$6 = Math.PI;
var tau$6 = 2 * pi$6;
var epsilon$4 = 1e-6;
var tauEpsilon$1 = tau$6 - epsilon$4;

function Path$1() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null; // end of current subpath
  this._ = "";
}

function path$4() {
  return new Path$1();
}

Path$1.prototype = path$4.prototype = {
  constructor: Path$1,
  moveTo: function moveTo(x, y) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y);
  },
  closePath: function closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._ += "Z";
    }
  },
  lineTo: function lineTo(x, y) {
    this._ += "L" + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  quadraticCurveTo: function quadraticCurveTo(x1, y1, x, y) {
    this._ += "Q" + +x1 + "," + +y1 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  bezierCurveTo: function bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._ += "C" + +x1 + "," + +y1 + "," + +x2 + "," + +y2 + "," + (this._x1 = +x) + "," + (this._y1 = +y);
  },
  arcTo: function arcTo(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
    var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._ += "M" + (this._x1 = x1) + "," + (this._y1 = y1);
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon$4)) {}

      // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
      // Equivalently, is (x1,y1) coincident with (x2,y2)?
      // Or, is the radius zero? Line to (x1,y1).
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon$4) || !r) {
          this._ += "L" + (this._x1 = x1) + "," + (this._y1 = y1);
        }

        // Otherwise, draw an arc!
        else {
            var x20 = x2 - x0,
                y20 = y2 - y0,
                l21_2 = x21 * x21 + y21 * y21,
                l20_2 = x20 * x20 + y20 * y20,
                l21 = Math.sqrt(l21_2),
                l01 = Math.sqrt(l01_2),
                l = r * Math.tan((pi$6 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
                t01 = l / l01,
                t21 = l / l21;

            // If the start tangent is not coincident with (x0,y0), line to.
            if (Math.abs(t01 - 1) > epsilon$4) {
              this._ += "L" + (x1 + t01 * x01) + "," + (y1 + t01 * y01);
            }

            this._ += "A" + r + "," + r + ",0,0," + +(y01 * x20 > x01 * y20) + "," + (this._x1 = x1 + t21 * x21) + "," + (this._y1 = y1 + t21 * y21);
          }
  },
  arc: function arc(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r;
    var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._ += "M" + x0 + "," + y0;
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon$4 || Math.abs(this._y1 - y0) > epsilon$4) {
        this._ += "L" + x0 + "," + y0;
      }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon$1) {
      this._ += "A" + r + "," + r + ",0,1," + cw + "," + (x - dx) + "," + (y - dy) + "A" + r + "," + r + ",0,1," + cw + "," + (this._x1 = x0) + "," + (this._y1 = y0);
    }

    // Otherwise, draw an arc!
    else {
        if (da < 0) da = da % tau$6 + tau$6;
        this._ += "A" + r + "," + r + ",0," + +(da >= pi$6) + "," + cw + "," + (this._x1 = x + r * Math.cos(a1)) + "," + (this._y1 = y + r * Math.sin(a1));
      }
  },
  rect: function rect(x, y, w, h) {
    this._ += "M" + (this._x0 = this._x1 = +x) + "," + (this._y0 = this._y1 = +y) + "h" + +w + "v" + +h + "h" + -w + "Z";
  },
  toString: function toString() {
    return this._;
  }
};

var constant$16 = function (x) {
  return function constant() {
    return x;
  };
};

var epsilon$5 = 1e-12;
var pi$7 = Math.PI;
var halfPi$5 = pi$7 / 2;
var tau$7 = 2 * pi$7;

function arcInnerRadius$1(d) {
  return d.innerRadius;
}

function arcOuterRadius$1(d) {
  return d.outerRadius;
}

function arcStartAngle$1(d) {
  return d.startAngle;
}

function arcEndAngle$1(d) {
  return d.endAngle;
}

function arcPadAngle$1(d) {
  return d && d.padAngle; // Note: optional!
}

function asin$1(x) {
  return x >= 1 ? halfPi$5 : x <= -1 ? -halfPi$5 : Math.asin(x);
}

function intersect$1(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0,
      y10 = y1 - y0,
      x32 = x3 - x2,
      y32 = y3 - y2,
      t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / (y32 * x10 - x32 * y10);
  return [x0 + t * x10, y0 + t * y10];
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function cornerTangents$1(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1,
      y01 = y0 - y1,
      lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01),
      ox = lo * y01,
      oy = -lo * x01,
      x11 = x0 + ox,
      y11 = y0 + oy,
      x10 = x1 + ox,
      y10 = y1 + oy,
      x00 = (x11 + x10) / 2,
      y00 = (y11 + y10) / 2,
      dx = x10 - x11,
      dy = y10 - y11,
      d2 = dx * dx + dy * dy,
      r = r1 - rc,
      D = x11 * y10 - x10 * y11,
      d = (dy < 0 ? -1 : 1) * Math.sqrt(Math.max(0, r * r * d2 - D * D)),
      cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2,
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx0 = cx0 - x00,
      dy0 = cy0 - y00,
      dx1 = cx1 - x00,
      dy1 = cy1 - y00;

  // Pick the closer of the two intersection points.
  // TODO Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1)
  };
}

var arc$2 = function () {
  var innerRadius = arcInnerRadius$1,
      outerRadius = arcOuterRadius$1,
      cornerRadius = constant$16(0),
      padRadius = null,
      startAngle = arcStartAngle$1,
      endAngle = arcEndAngle$1,
      padAngle = arcPadAngle$1,
      context = null;

  function arc() {
    var buffer,
        r,
        r0 = +innerRadius.apply(this, arguments),
        r1 = +outerRadius.apply(this, arguments),
        a0 = startAngle.apply(this, arguments) - halfPi$5,
        a1 = endAngle.apply(this, arguments) - halfPi$5,
        da = Math.abs(a1 - a0),
        cw = a1 > a0;

    if (!context) context = buffer = path$4();

    // Ensure that the outer radius is always larger than the inner radius.
    if (r1 < r0) r = r1, r1 = r0, r0 = r;

    // Is it a point?
    if (!(r1 > epsilon$5)) context.moveTo(0, 0);

    // Or is it a circle or annulus?
    else if (da > tau$7 - epsilon$5) {
        context.moveTo(r1 * Math.cos(a0), r1 * Math.sin(a0));
        context.arc(0, 0, r1, a0, a1, !cw);
        if (r0 > epsilon$5) {
          context.moveTo(r0 * Math.cos(a1), r0 * Math.sin(a1));
          context.arc(0, 0, r0, a1, a0, cw);
        }
      }

      // Or is it a circular or annular sector?
      else {
          var a01 = a0,
              a11 = a1,
              a00 = a0,
              a10 = a1,
              da0 = da,
              da1 = da,
              ap = padAngle.apply(this, arguments) / 2,
              rp = ap > epsilon$5 && (padRadius ? +padRadius.apply(this, arguments) : Math.sqrt(r0 * r0 + r1 * r1)),
              rc = Math.min(Math.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
              rc0 = rc,
              rc1 = rc,
              t0,
              t1;

          // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
          if (rp > epsilon$5) {
            var p0 = asin$1(rp / r0 * Math.sin(ap)),
                p1 = asin$1(rp / r1 * Math.sin(ap));
            if ((da0 -= p0 * 2) > epsilon$5) p0 *= cw ? 1 : -1, a00 += p0, a10 -= p0;else da0 = 0, a00 = a10 = (a0 + a1) / 2;
            if ((da1 -= p1 * 2) > epsilon$5) p1 *= cw ? 1 : -1, a01 += p1, a11 -= p1;else da1 = 0, a01 = a11 = (a0 + a1) / 2;
          }

          var x01 = r1 * Math.cos(a01),
              y01 = r1 * Math.sin(a01),
              x10 = r0 * Math.cos(a10),
              y10 = r0 * Math.sin(a10);

          // Apply rounded corners?
          if (rc > epsilon$5) {
            var x11 = r1 * Math.cos(a11),
                y11 = r1 * Math.sin(a11),
                x00 = r0 * Math.cos(a00),
                y00 = r0 * Math.sin(a00);

            // Restrict the corner radius according to the sector angle.
            if (da < pi$7) {
              var oc = da0 > epsilon$5 ? intersect$1(x01, y01, x00, y00, x11, y11, x10, y10) : [x10, y10],
                  ax = x01 - oc[0],
                  ay = y01 - oc[1],
                  bx = x11 - oc[0],
                  by = y11 - oc[1],
                  kc = 1 / Math.sin(Math.acos((ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))) / 2),
                  lc = Math.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
              rc0 = Math.min(rc, (r0 - lc) / (kc - 1));
              rc1 = Math.min(rc, (r1 - lc) / (kc + 1));
            }
          }

          // Is the sector collapsed to a line?
          if (!(da1 > epsilon$5)) context.moveTo(x01, y01);

          // Does the sector’s outer ring have rounded corners?
          else if (rc1 > epsilon$5) {
              t0 = cornerTangents$1(x00, y00, x01, y01, r1, rc1, cw);
              t1 = cornerTangents$1(x11, y11, x10, y10, r1, rc1, cw);

              context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

              // Have the corners merged?
              if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, Math.atan2(t0.y01, t0.x01), Math.atan2(t1.y01, t1.x01), !cw);

              // Otherwise, draw the two corners and the ring.
              else {
                  context.arc(t0.cx, t0.cy, rc1, Math.atan2(t0.y01, t0.x01), Math.atan2(t0.y11, t0.x11), !cw);
                  context.arc(0, 0, r1, Math.atan2(t0.cy + t0.y11, t0.cx + t0.x11), Math.atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
                  context.arc(t1.cx, t1.cy, rc1, Math.atan2(t1.y11, t1.x11), Math.atan2(t1.y01, t1.x01), !cw);
                }
            }

            // Or is the outer ring just a circular arc?
            else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

          // Is there no inner ring, and it’s a circular sector?
          // Or perhaps it’s an annular sector collapsed due to padding?
          if (!(r0 > epsilon$5) || !(da0 > epsilon$5)) context.lineTo(x10, y10);

          // Does the sector’s inner ring (or point) have rounded corners?
          else if (rc0 > epsilon$5) {
              t0 = cornerTangents$1(x10, y10, x11, y11, r0, -rc0, cw);
              t1 = cornerTangents$1(x01, y01, x00, y00, r0, -rc0, cw);

              context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

              // Have the corners merged?
              if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, Math.atan2(t0.y01, t0.x01), Math.atan2(t1.y01, t1.x01), !cw);

              // Otherwise, draw the two corners and the ring.
              else {
                  context.arc(t0.cx, t0.cy, rc0, Math.atan2(t0.y01, t0.x01), Math.atan2(t0.y11, t0.x11), !cw);
                  context.arc(0, 0, r0, Math.atan2(t0.cy + t0.y11, t0.cx + t0.x11), Math.atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
                  context.arc(t1.cx, t1.cy, rc0, Math.atan2(t1.y11, t1.x11), Math.atan2(t1.y01, t1.x01), !cw);
                }
            }

            // Or is the inner ring just a circular arc?
            else context.arc(0, 0, r0, a10, a00, cw);
        }

    context.closePath();

    if (buffer) return context = null, buffer + "" || null;
  }

  arc.centroid = function () {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
        a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$7 / 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };

  arc.innerRadius = function (_) {
    return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$16(+_), arc) : innerRadius;
  };

  arc.outerRadius = function (_) {
    return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$16(+_), arc) : outerRadius;
  };

  arc.cornerRadius = function (_) {
    return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$16(+_), arc) : cornerRadius;
  };

  arc.padRadius = function (_) {
    return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$16(+_), arc) : padRadius;
  };

  arc.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$16(+_), arc) : startAngle;
  };

  arc.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$16(+_), arc) : endAngle;
  };

  arc.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$16(+_), arc) : padAngle;
  };

  arc.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, arc) : context;
  };

  return arc;
};

function Linear$1(context) {
  this._context = context;
}

Linear$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2; // proceed
      default:
        this._context.lineTo(x, y);break;
    }
  }
};

var curveLinear$1 = function (context) {
  return new Linear$1(context);
};

function x$2(p) {
  return p[0];
}

function y$1(p) {
  return p[1];
}

var line$2 = function () {
  var x$$1 = x$2,
      y$$1 = y$1,
      defined = constant$16(true),
      context = null,
      curve = curveLinear$1,
      output = null;

  function line(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) output = curve(buffer = path$4());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();else output.lineEnd();
      }
      if (defined0) output.point(+x$$1(d, i, data), +y$$1(d, i, data));
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  line.x = function (_) {
    return arguments.length ? (x$$1 = typeof _ === "function" ? _ : constant$16(+_), line) : x$$1;
  };

  line.y = function (_) {
    return arguments.length ? (y$$1 = typeof _ === "function" ? _ : constant$16(+_), line) : y$$1;
  };

  line.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$16(!!_), line) : defined;
  };

  line.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };

  line.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };

  return line;
};

var area$2 = function () {
  var x0 = x$2,
      x1 = null,
      y0 = constant$16(0),
      y1 = y$1,
      defined = constant$16(true),
      context = null,
      curve = curveLinear$1,
      output = null;

  function area(data) {
    var i,
        j,
        k,
        n = data.length,
        d,
        defined0 = false,
        buffer,
        x0z = new Array(n),
        y0z = new Array(n);

    if (context == null) output = curve(buffer = path$4());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  function arealine() {
    return line$2().defined(defined).curve(curve).context(context);
  }

  area.x = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$16(+_), x1 = null, area) : x0;
  };

  area.x0 = function (_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$16(+_), area) : x0;
  };

  area.x1 = function (_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$16(+_), area) : x1;
  };

  area.y = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$16(+_), y1 = null, area) : y0;
  };

  area.y0 = function (_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$16(+_), area) : y0;
  };

  area.y1 = function (_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$16(+_), area) : y1;
  };

  area.lineX0 = area.lineY0 = function () {
    return arealine().x(x0).y(y0);
  };

  area.lineY1 = function () {
    return arealine().x(x0).y(y1);
  };

  area.lineX1 = function () {
    return arealine().x(x1).y(y0);
  };

  area.defined = function (_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$16(!!_), area) : defined;
  };

  area.curve = function (_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };

  area.context = function (_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };

  return area;
};

var descending$4 = function (a, b) {
  return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
};

var identity$14 = function (d) {
  return d;
};

var pie$1 = function () {
  var value = identity$14,
      sortValues = descending$4,
      sort = null,
      startAngle = constant$16(0),
      endAngle = constant$16(tau$7),
      padAngle = constant$16(0);

  function pie(data) {
    var i,
        n = data.length,
        j,
        k,
        sum = 0,
        index = new Array(n),
        arcs = new Array(n),
        a0 = +startAngle.apply(this, arguments),
        da = Math.min(tau$7, Math.max(-tau$7, endAngle.apply(this, arguments) - a0)),
        a1,
        p = Math.min(Math.abs(da) / n, padAngle.apply(this, arguments)),
        pa = p * (da < 0 ? -1 : 1),
        v;

    for (i = 0; i < n; ++i) {
      if ((v = arcs[index[i] = i] = +value(data[i], i, data)) > 0) {
        sum += v;
      }
    }

    // Optionally sort the arcs by previously-computed values or by data.
    if (sortValues != null) index.sort(function (i, j) {
      return sortValues(arcs[i], arcs[j]);
    });else if (sort != null) index.sort(function (i, j) {
      return sort(data[i], data[j]);
    });

    // Compute the arcs! They are stored in the original data's order.
    for (i = 0, k = sum ? (da - n * pa) / sum : 0; i < n; ++i, a0 = a1) {
      j = index[i], v = arcs[j], a1 = a0 + (v > 0 ? v * k : 0) + pa, arcs[j] = {
        data: data[j],
        index: i,
        value: v,
        startAngle: a0,
        endAngle: a1,
        padAngle: p
      };
    }

    return arcs;
  }

  pie.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$16(+_), pie) : value;
  };

  pie.sortValues = function (_) {
    return arguments.length ? (sortValues = _, sort = null, pie) : sortValues;
  };

  pie.sort = function (_) {
    return arguments.length ? (sort = _, sortValues = null, pie) : sort;
  };

  pie.startAngle = function (_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$16(+_), pie) : startAngle;
  };

  pie.endAngle = function (_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$16(+_), pie) : endAngle;
  };

  pie.padAngle = function (_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$16(+_), pie) : padAngle;
  };

  return pie;
};

var curveRadialLinear$1 = curveRadial$1(curveLinear$1);

function Radial$1(curve) {
  this._curve = curve;
}

Radial$1.prototype = {
  areaStart: function areaStart() {
    this._curve.areaStart();
  },
  areaEnd: function areaEnd() {
    this._curve.areaEnd();
  },
  lineStart: function lineStart() {
    this._curve.lineStart();
  },
  lineEnd: function lineEnd() {
    this._curve.lineEnd();
  },
  point: function point(a, r) {
    this._curve.point(r * Math.sin(a), r * -Math.cos(a));
  }
};

function curveRadial$1(curve) {

  function radial(context) {
    return new Radial$1(curve(context));
  }

  radial._curve = curve;

  return radial;
}

function radialLine$2(l) {
  var c = l.curve;

  l.angle = l.x, delete l.x;
  l.radius = l.y, delete l.y;

  l.curve = function (_) {
    return arguments.length ? c(curveRadial$1(_)) : c()._curve;
  };

  return l;
}

var radialLine$3 = function () {
  return radialLine$2(line$2().curve(curveRadialLinear$1));
};

var radialArea$1 = function () {
  var a = area$2().curve(curveRadialLinear$1),
      c = a.curve,
      x0 = a.lineX0,
      x1 = a.lineX1,
      y0 = a.lineY0,
      y1 = a.lineY1;

  a.angle = a.x, delete a.x;
  a.startAngle = a.x0, delete a.x0;
  a.endAngle = a.x1, delete a.x1;
  a.radius = a.y, delete a.y;
  a.innerRadius = a.y0, delete a.y0;
  a.outerRadius = a.y1, delete a.y1;
  a.lineStartAngle = function () {
    return radialLine$2(x0());
  }, delete a.lineX0;
  a.lineEndAngle = function () {
    return radialLine$2(x1());
  }, delete a.lineX1;
  a.lineInnerRadius = function () {
    return radialLine$2(y0());
  }, delete a.lineY0;
  a.lineOuterRadius = function () {
    return radialLine$2(y1());
  }, delete a.lineY1;

  a.curve = function (_) {
    return arguments.length ? c(curveRadial$1(_)) : c()._curve;
  };

  return a;
};

var circle$1 = {
  draw: function draw(context, size) {
    var r = Math.sqrt(size / pi$7);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, tau$7);
  }
};

var cross$2 = {
  draw: function draw(context, size) {
    var r = Math.sqrt(size / 5) / 2;
    context.moveTo(-3 * r, -r);
    context.lineTo(-r, -r);
    context.lineTo(-r, -3 * r);
    context.lineTo(r, -3 * r);
    context.lineTo(r, -r);
    context.lineTo(3 * r, -r);
    context.lineTo(3 * r, r);
    context.lineTo(r, r);
    context.lineTo(r, 3 * r);
    context.lineTo(-r, 3 * r);
    context.lineTo(-r, r);
    context.lineTo(-3 * r, r);
    context.closePath();
  }
};

var tan30$1 = Math.sqrt(1 / 3);
var tan30_2$1 = tan30$1 * 2;

var diamond$1 = {
  draw: function draw(context, size) {
    var y = Math.sqrt(size / tan30_2$1),
        x = y * tan30$1;
    context.moveTo(0, -y);
    context.lineTo(x, 0);
    context.lineTo(0, y);
    context.lineTo(-x, 0);
    context.closePath();
  }
};

var ka$1 = 0.89081309152928522810;
var kr$1 = Math.sin(pi$7 / 10) / Math.sin(7 * pi$7 / 10);
var kx$1 = Math.sin(tau$7 / 10) * kr$1;
var ky$1 = -Math.cos(tau$7 / 10) * kr$1;

var star$1 = {
    draw: function draw(context, size) {
        var r = Math.sqrt(size * ka$1),
            x = kx$1 * r,
            y = ky$1 * r;
        context.moveTo(0, -r);
        context.lineTo(x, y);
        for (var i = 1; i < 5; ++i) {
            var a = tau$7 * i / 5,
                c = Math.cos(a),
                s = Math.sin(a);
            context.lineTo(s * r, -c * r);
            context.lineTo(c * x - s * y, s * x + c * y);
        }
        context.closePath();
    }
};

var square$1 = {
  draw: function draw(context, size) {
    var w = Math.sqrt(size),
        x = -w / 2;
    context.rect(x, x, w, w);
  }
};

var sqrt3$1 = Math.sqrt(3);

var triangle$1 = {
  draw: function draw(context, size) {
    var y = -Math.sqrt(size / (sqrt3$1 * 3));
    context.moveTo(0, y * 2);
    context.lineTo(-sqrt3$1 * y, -y);
    context.lineTo(sqrt3$1 * y, -y);
    context.closePath();
  }
};

var c$2 = -0.5;
var s$1 = Math.sqrt(3) / 2;
var k$1 = 1 / Math.sqrt(12);
var a$1 = (k$1 / 2 + 1) * 3;

var wye$1 = {
    draw: function draw(context, size) {
        var r = Math.sqrt(size / a$1),
            x0 = r / 2,
            y0 = r * k$1,
            x1 = x0,
            y1 = r * k$1 + r,
            x2 = -x1,
            y2 = y1;
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.lineTo(x2, y2);
        context.lineTo(c$2 * x0 - s$1 * y0, s$1 * x0 + c$2 * y0);
        context.lineTo(c$2 * x1 - s$1 * y1, s$1 * x1 + c$2 * y1);
        context.lineTo(c$2 * x2 - s$1 * y2, s$1 * x2 + c$2 * y2);
        context.lineTo(c$2 * x0 + s$1 * y0, c$2 * y0 - s$1 * x0);
        context.lineTo(c$2 * x1 + s$1 * y1, c$2 * y1 - s$1 * x1);
        context.lineTo(c$2 * x2 + s$1 * y2, c$2 * y2 - s$1 * x2);
        context.closePath();
    }
};

var symbols$1 = [circle$1, cross$2, diamond$1, square$1, star$1, triangle$1, wye$1];

var symbol$2 = function () {
  var type = constant$16(circle$1),
      size = constant$16(64),
      context = null;

  function symbol() {
    var buffer;
    if (!context) context = buffer = path$4();
    type.apply(this, arguments).draw(context, +size.apply(this, arguments));
    if (buffer) return context = null, buffer + "" || null;
  }

  symbol.type = function (_) {
    return arguments.length ? (type = typeof _ === "function" ? _ : constant$16(_), symbol) : type;
  };

  symbol.size = function (_) {
    return arguments.length ? (size = typeof _ === "function" ? _ : constant$16(+_), symbol) : size;
  };

  symbol.context = function (_) {
    return arguments.length ? (context = _ == null ? null : _, symbol) : context;
  };

  return symbol;
};

var noop$6 = function () {};

function _point$4(that, x, y) {
  that._context.bezierCurveTo((2 * that._x0 + that._x1) / 3, (2 * that._y0 + that._y1) / 3, (that._x0 + 2 * that._x1) / 3, (that._y0 + 2 * that._y1) / 3, (that._x0 + 4 * that._x1 + x) / 6, (that._y0 + 4 * that._y1 + y) / 6);
}

function Basis$1(context) {
  this._context = context;
}

Basis$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 3:
        _point$4(this, this._x1, this._y1); // proceed
      case 2:
        this._context.lineTo(this._x1, this._y1);break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6); // proceed
      default:
        _point$4(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var basis$11 = function (context) {
  return new Basis$1(context);
};

function BasisClosed$1(context) {
  this._context = context;
}

BasisClosed$1.prototype = {
  areaStart: noop$6,
  areaEnd: noop$6,
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x2, this._y2);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.moveTo((this._x2 + 2 * this._x3) / 3, (this._y2 + 2 * this._y3) / 3);
          this._context.lineTo((this._x3 + 2 * this._x2) / 3, (this._y3 + 2 * this._y2) / 3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x2, this._y2);
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._x2 = x, this._y2 = y;break;
      case 1:
        this._point = 2;this._x3 = x, this._y3 = y;break;
      case 2:
        this._point = 3;this._x4 = x, this._y4 = y;this._context.moveTo((this._x0 + 4 * this._x1 + x) / 6, (this._y0 + 4 * this._y1 + y) / 6);break;
      default:
        _point$4(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var basisClosed$6 = function (context) {
  return new BasisClosed$1(context);
};

function BasisOpen$1(context) {
  this._context = context;
}

BasisOpen$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;var x0 = (this._x0 + 4 * this._x1 + x) / 6,
            y0 = (this._y0 + 4 * this._y1 + y) / 6;this._line ? this._context.lineTo(x0, y0) : this._context.moveTo(x0, y0);break;
      case 3:
        this._point = 4; // proceed
      default:
        _point$4(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

var basisOpen$1 = function (context) {
  return new BasisOpen$1(context);
};

function Bundle$1(context, beta) {
  this._basis = new Basis$1(context);
  this._beta = beta;
}

Bundle$1.prototype = {
  lineStart: function lineStart() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function lineEnd() {
    var x = this._x,
        y = this._y,
        j = x.length - 1;

    if (j > 0) {
      var x0 = x[0],
          y0 = y[0],
          dx = x[j] - x0,
          dy = y[j] - y0,
          i = -1,
          t;

      while (++i <= j) {
        t = i / j;
        this._basis.point(this._beta * x[i] + (1 - this._beta) * (x0 + t * dx), this._beta * y[i] + (1 - this._beta) * (y0 + t * dy));
      }
    }

    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function point(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

var bundle$1 = (function custom(beta) {

  function bundle(context) {
    return beta === 1 ? new Basis$1(context) : new Bundle$1(context, beta);
  }

  bundle.beta = function (beta) {
    return custom(+beta);
  };

  return bundle;
})(0.85);

function _point$5(that, x, y) {
  that._context.bezierCurveTo(that._x1 + that._k * (that._x2 - that._x0), that._y1 + that._k * (that._y2 - that._y0), that._x2 + that._k * (that._x1 - x), that._y2 + that._k * (that._y1 - y), that._x2, that._y2);
}

function Cardinal$1(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

Cardinal$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);break;
      case 3:
        _point$5(this, this._x1, this._y1);break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;this._x1 = x, this._y1 = y;break;
      case 2:
        this._point = 3; // proceed
      default:
        _point$5(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var cardinal$1 = (function custom(tension) {

  function cardinal(context) {
    return new Cardinal$1(context, tension);
  }

  cardinal.tension = function (tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalClosed$1(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalClosed$1.prototype = {
  areaStart: noop$6,
  areaEnd: noop$6,
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._x3 = x, this._y3 = y;break;
      case 1:
        this._point = 2;this._context.moveTo(this._x4 = x, this._y4 = y);break;
      case 2:
        this._point = 3;this._x5 = x, this._y5 = y;break;
      default:
        _point$5(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var cardinalClosed$1 = (function custom(tension) {

  function cardinal(context) {
    return new CardinalClosed$1(context, tension);
  }

  cardinal.tension = function (tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalOpen$1(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalOpen$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);break;
      case 3:
        this._point = 4; // proceed
      default:
        _point$5(this, x, y);break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var cardinalOpen$1 = (function custom(tension) {

  function cardinal(context) {
    return new CardinalOpen$1(context, tension);
  }

  cardinal.tension = function (tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function _point$6(that, x, y) {
  var x1 = that._x1,
      y1 = that._y1,
      x2 = that._x2,
      y2 = that._y2;

  if (that._l01_a > epsilon$5) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
        n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }

  if (that._l23_a > epsilon$5) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
        m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
  }

  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
}

function CatmullRom$1(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRom$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x2, this._y2);break;
      case 3:
        this.point(this._x2, this._y2);break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3; // proceed
      default:
        _point$6(this, x, y);break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRom$1 = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRom$1(context, alpha) : new Cardinal$1(context, 0);
  }

  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomClosed$1(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomClosed$1.prototype = {
  areaStart: noop$6,
  areaEnd: noop$6,
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 = this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 1:
        {
          this._context.moveTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 2:
        {
          this._context.lineTo(this._x3, this._y3);
          this._context.closePath();
          break;
        }
      case 3:
        {
          this.point(this._x3, this._y3);
          this.point(this._x4, this._y4);
          this.point(this._x5, this._y5);
          break;
        }
    }
  },
  point: function point(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0:
        this._point = 1;this._x3 = x, this._y3 = y;break;
      case 1:
        this._point = 2;this._context.moveTo(this._x4 = x, this._y4 = y);break;
      case 2:
        this._point = 3;this._x5 = x, this._y5 = y;break;
      default:
        _point$6(this, x, y);break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRomClosed$1 = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomClosed$1(context, alpha) : new CardinalClosed$1(context, 0);
  }

  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomOpen$1(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomOpen$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._x2 = this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a = this._l01_2a = this._l12_2a = this._l23_2a = this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._line || this._line !== 0 && this._point === 3) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0:
        this._point = 1;break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2);break;
      case 3:
        this._point = 4; // proceed
      default:
        _point$6(this, x, y);break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var catmullRomOpen$1 = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomOpen$1(context, alpha) : new CardinalOpen$1(context, 0);
  }

  catmullRom.alpha = function (alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function LinearClosed$1(context) {
  this._context = context;
}

LinearClosed$1.prototype = {
  areaStart: noop$6,
  areaEnd: noop$6,
  lineStart: function lineStart() {
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (this._point) this._context.closePath();
  },
  point: function point(x, y) {
    x = +x, y = +y;
    if (this._point) this._context.lineTo(x, y);else this._point = 1, this._context.moveTo(x, y);
  }
};

var linearClosed$1 = function (context) {
  return new LinearClosed$1(context);
};

function sign$1(x) {
  return x < 0 ? -1 : 1;
}

// Calculate the slopes of the tangents (Hermite-type interpolation) based on
// the following paper: Steffen, M. 1990. A Simple Method for Monotonic
// Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
// NOV(II), P. 443, 1990.
function slope3$1(that, x2, y2) {
  var h0 = that._x1 - that._x0,
      h1 = x2 - that._x1,
      s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
      s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
      p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign$1(s0) + sign$1(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

// Calculate a one-sided slope.
function slope2$1(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}

// According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
// "you can express cubic Hermite interpolation in terms of cubic Bézier curves
// with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
function _point$7(that, t0, t1) {
  var x0 = that._x0,
      y0 = that._y0,
      x1 = that._x1,
      y1 = that._y1,
      dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}

function MonotoneX$1(context) {
  this._context = context;
}

MonotoneX$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x0 = this._x1 = this._y0 = this._y1 = this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    switch (this._point) {
      case 2:
        this._context.lineTo(this._x1, this._y1);break;
      case 3:
        _point$7(this, this._t0, slope2$1(this, this._t0));break;
    }
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function point(x, y) {
    var t1 = NaN;

    x = +x, y = +y;
    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2;break;
      case 2:
        this._point = 3;_point$7(this, slope2$1(this, t1 = slope3$1(this, x, y)), t1);break;
      default:
        _point$7(this, this._t0, t1 = slope3$1(this, x, y));break;
    }

    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
    this._t0 = t1;
  }
};

function MonotoneY$1(context) {
  this._context = new ReflectContext$1(context);
}

(MonotoneY$1.prototype = Object.create(MonotoneX$1.prototype)).point = function (x, y) {
  MonotoneX$1.prototype.point.call(this, y, x);
};

function ReflectContext$1(context) {
  this._context = context;
}

ReflectContext$1.prototype = {
  moveTo: function moveTo(x, y) {
    this._context.moveTo(y, x);
  },
  closePath: function closePath() {
    this._context.closePath();
  },
  lineTo: function lineTo(x, y) {
    this._context.lineTo(y, x);
  },
  bezierCurveTo: function bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._context.bezierCurveTo(y1, x1, y2, x2, y, x);
  }
};

function monotoneX$1(context) {
  return new MonotoneX$1(context);
}

function monotoneY$1(context) {
  return new MonotoneY$1(context);
}

function Natural$1(context) {
  this._context = context;
}

Natural$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function lineEnd() {
    var x = this._x,
        y = this._y,
        n = x.length;

    if (n) {
      this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
      if (n === 2) {
        this._context.lineTo(x[1], y[1]);
      } else {
        var px = controlPoints$1(x),
            py = controlPoints$1(y);
        for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
        }
      }
    }

    if (this._line || this._line !== 0 && n === 1) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function point(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

// See https://www.particleincell.com/2012/bezier-splines/ for derivation.
function controlPoints$1(x) {
  var i,
      n = x.length - 1,
      m,
      a = new Array(n),
      b = new Array(n),
      r = new Array(n);
  a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
  for (i = 1; i < n - 1; ++i) {
    a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
  }a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
  for (i = 1; i < n; ++i) {
    m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
  }a[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) {
    a[i] = (r[i] - a[i + 1]) / b[i];
  }b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) {
    b[i] = 2 * x[i + 1] - a[i + 1];
  }return [a, b];
}

var natural$1 = function (context) {
  return new Natural$1(context);
};

function Step$1(context, t) {
  this._context = context;
  this._t = t;
}

Step$1.prototype = {
  areaStart: function areaStart() {
    this._line = 0;
  },
  areaEnd: function areaEnd() {
    this._line = NaN;
  },
  lineStart: function lineStart() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function lineEnd() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || this._line !== 0 && this._point === 1) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function point(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0:
        this._point = 1;this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y);break;
      case 1:
        this._point = 2; // proceed
      default:
        {
          if (this._t <= 0) {
            this._context.lineTo(this._x, y);
            this._context.lineTo(x, y);
          } else {
            var x1 = this._x * (1 - this._t) + x * this._t;
            this._context.lineTo(x1, this._y);
            this._context.lineTo(x1, y);
          }
          break;
        }
    }
    this._x = x, this._y = y;
  }
};

var step$1 = function (context) {
  return new Step$1(context, 0.5);
};

function stepBefore$1(context) {
  return new Step$1(context, 0);
}

function stepAfter$1(context) {
  return new Step$1(context, 1);
}

var slice$7 = Array.prototype.slice;

var none$7 = function (series, order) {
  if (!((n = series.length) > 1)) return;
  for (var i = 1, s0, s1 = series[order[0]], n, m = s1.length; i < n; ++i) {
    s0 = s1, s1 = series[order[i]];
    for (var j = 0; j < m; ++j) {
      s1[j][1] += s1[j][0] = isNaN(s0[j][1]) ? s0[j][0] : s0[j][1];
    }
  }
};

var none$8 = function (series) {
  var n = series.length,
      o = new Array(n);
  while (--n >= 0) {
    o[n] = n;
  }return o;
};

function stackValue$1(d, key) {
  return d[key];
}

var stack$1 = function () {
  var keys = constant$16([]),
      order = none$8,
      offset = none$7,
      value = stackValue$1;

  function stack(data) {
    var kz = keys.apply(this, arguments),
        i,
        m = data.length,
        n = kz.length,
        sz = new Array(n),
        oz;

    for (i = 0; i < n; ++i) {
      for (var ki = kz[i], si = sz[i] = new Array(m), j = 0, sij; j < m; ++j) {
        si[j] = sij = [0, +value(data[j], ki, j, data)];
        sij.data = data[j];
      }
      si.key = ki;
    }

    for (i = 0, oz = order(sz); i < n; ++i) {
      sz[oz[i]].index = i;
    }

    offset(sz, oz);
    return sz;
  }

  stack.keys = function (_) {
    return arguments.length ? (keys = typeof _ === "function" ? _ : constant$16(slice$7.call(_)), stack) : keys;
  };

  stack.value = function (_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant$16(+_), stack) : value;
  };

  stack.order = function (_) {
    return arguments.length ? (order = _ == null ? none$8 : typeof _ === "function" ? _ : constant$16(slice$7.call(_)), stack) : order;
  };

  stack.offset = function (_) {
    return arguments.length ? (offset = _ == null ? none$7 : _, stack) : offset;
  };

  return stack;
};

var expand$1 = function (series, order) {
  if (!((n = series.length) > 0)) return;
  for (var i, n, j = 0, m = series[0].length, y; j < m; ++j) {
    for (y = i = 0; i < n; ++i) {
      y += series[i][j][1] || 0;
    }if (y) for (i = 0; i < n; ++i) {
      series[i][j][1] /= y;
    }
  }
  none$7(series, order);
};

var silhouette$1 = function (series, order) {
  if (!((n = series.length) > 0)) return;
  for (var j = 0, s0 = series[order[0]], n, m = s0.length; j < m; ++j) {
    for (var i = 0, y = 0; i < n; ++i) {
      y += series[i][j][1] || 0;
    }s0[j][1] += s0[j][0] = -y / 2;
  }
  none$7(series, order);
};

var wiggle$1 = function (series, order) {
  if (!((n = series.length) > 0) || !((m = (s0 = series[order[0]]).length) > 0)) return;
  for (var y = 0, j = 1, s0, m, n; j < m; ++j) {
    for (var i = 0, s1 = 0, s2 = 0; i < n; ++i) {
      var si = series[order[i]],
          sij0 = si[j][1] || 0,
          sij1 = si[j - 1][1] || 0,
          s3 = (sij0 - sij1) / 2;
      for (var k = 0; k < i; ++k) {
        var sk = series[order[k]],
            skj0 = sk[j][1] || 0,
            skj1 = sk[j - 1][1] || 0;
        s3 += skj0 - skj1;
      }
      s1 += sij0, s2 += s3 * sij0;
    }
    s0[j - 1][1] += s0[j - 1][0] = y;
    if (s1) y -= s2 / s1;
  }
  s0[j - 1][1] += s0[j - 1][0] = y;
  none$7(series, order);
};

var ascending$8 = function (series) {
  var sums = series.map(sum$3);
  return none$8(series).sort(function (a, b) {
    return sums[a] - sums[b];
  });
};

function sum$3(series) {
  var s = 0,
      i = -1,
      n = series.length,
      v;
  while (++i < n) {
    if (v = +series[i][1]) s += v;
  }return s;
}

var descending$5 = function (series) {
  return ascending$8(series).reverse();
};

var insideOut$1 = function (series) {
  var n = series.length,
      i,
      j,
      sums = series.map(sum$3),
      order = none$8(series).sort(function (a, b) {
    return sums[b] - sums[a];
  }),
      top = 0,
      bottom = 0,
      tops = [],
      bottoms = [];

  for (i = 0; i < n; ++i) {
    j = order[i];
    if (top < bottom) {
      top += sums[j];
      tops.push(j);
    } else {
      bottom += sums[j];
      bottoms.push(j);
    }
  }

  return bottoms.reverse().concat(tops);
};

var reverse$1 = function (series) {
  return none$8(series).reverse();
};



var d3_shape = Object.freeze({
	arc: arc$2,
	area: area$2,
	line: line$2,
	pie: pie$1,
	radialArea: radialArea$1,
	radialLine: radialLine$3,
	symbol: symbol$2,
	symbols: symbols$1,
	symbolCircle: circle$1,
	symbolCross: cross$2,
	symbolDiamond: diamond$1,
	symbolSquare: square$1,
	symbolStar: star$1,
	symbolTriangle: triangle$1,
	symbolWye: wye$1,
	curveBasisClosed: basisClosed$6,
	curveBasisOpen: basisOpen$1,
	curveBasis: basis$11,
	curveBundle: bundle$1,
	curveCardinalClosed: cardinalClosed$1,
	curveCardinalOpen: cardinalOpen$1,
	curveCardinal: cardinal$1,
	curveCatmullRomClosed: catmullRomClosed$1,
	curveCatmullRomOpen: catmullRomOpen$1,
	curveCatmullRom: catmullRom$1,
	curveLinearClosed: linearClosed$1,
	curveLinear: curveLinear$1,
	curveMonotoneX: monotoneX$1,
	curveMonotoneY: monotoneY$1,
	curveNatural: natural$1,
	curveStep: step$1,
	curveStepAfter: stepAfter$1,
	curveStepBefore: stepBefore$1,
	stack: stack$1,
	stackOffsetExpand: expand$1,
	stackOffsetNone: none$7,
	stackOffsetSilhouette: silhouette$1,
	stackOffsetWiggle: wiggle$1,
	stackOrderAscending: ascending$8,
	stackOrderDescending: descending$5,
	stackOrderInsideOut: insideOut$1,
	stackOrderNone: none$8,
	stackOrderReverse: reverse$1
});

var points = {

    defaults: {
        symbol: 'circle',
        fill: true,
        color: true,
        fillOpacity: 1,
        colorOpacity: 1,
        lineWidth: 2,
        size: 60
    },

    draw: function draw(data) {
        var cfg = this.config,
            plot = this.plot,
            mapping = this.mapping,
            x = plot.mapper(mapping.x, 'x'),
            y = plot.mapper(mapping.y, 'y'),
            size = plot.mapper(mapping.size, 'xy', cfg.size),
            color = plot.mapper(mapping.color, 'color', cfg.color),
            fill = plot.mapper(mapping.fill, 'fill', cfg.fill),
            type = plot.mapper(mapping.symbol, null, cfg.symbol),
            fillOpacity = plot.mapper(mapping.fillOpacity, null, cfg.fillOpacity),
            strokeOpacity = plot.mapper(mapping.colorOpacity, null, cfg.colorOpacity),
            lineWidth = plot.mapper(mapping.lineWidth, null, cfg.lineWidth),
            marks = symbol$2().size(size).type(symbol$1(type)),
            group = plot.group(this),
            path = group.selectAll('path.points').data(data);
        //merge = plot.transition(this, 'update');

        path.enter().append('path').attr('class', 'points').attr('transform', plot.translate(x, y)).attr('fill', fill).attr('fill-opacity', 0).attr('stroke', color).attr('stroke-opacity', 0).attr('stroke-width', lineWidth).merge(path)
        //.transition(merge)
        .attr('transform', plot.translate(x, y)).attr('fill', fill).attr('fill-opacity', fillOpacity).attr('stroke', color).attr('stroke-opacity', strokeOpacity).attr('d', marks);

        path.exit().remove();
    }
};

function symbol$1(get) {
    var s;
    return function () {
        s = get.apply(this, arguments);
        return d3_shape['symbol' + capfirst(s)];
    };
}

var line$3 = {

    defaults: {
        lineWidth: 1,
        colorOpacity: 1,
        curve: 'cardinalOpen'
    },

    draw: function draw(plot, series) {
        var data = series,
            aesthetics = this.aesthetics,
            path = plot.path(this).data([data]),
            x = this.scaled(this.mapping.x, plot, series),
            y = this.scaled(this.mapping.y, plot, series),
            line$$1 = line$2().x(x).y(y).curve(curve(this, aesthetics.curve)),
            width = plot.dim(aesthetics.lineWidth),
            merge = plot.transition('update');

        path.enter().append('path').attr('class', 'line').attr('fill', 'none').attr('stroke', aesthetics.color).attr('stroke-opacity', 0).attr('stroke-width', width).merge(path).transition(merge).attr('stroke', aesthetics.color).attr('stroke-opacity', aesthetics.colorOpacity).attr('stroke-width', width).attr('d', line$$1);

        path.exit().remove();
    }
};

function curve(layer, name) {
    var obj = d3_shape[curveName(name)];
    if (!obj) {
        layer.logger.warn('Could not locate curve type "' + name + '"');
        name = curveName(layer.defaults().curveName);
        obj = d3_shape[name];
    }
    return obj;
}

function curveName(name) {
    if (name.substring(0, 5) !== 'curve') name = 'curve' + name[0].toUpperCase() + name.substring(1);
    return name;
}

// import {stackOrderNone, stackOffsetNone, area} from 'd3-shape';
var area$3 = {

    defaults: {
        // stackOrder: stackOrderNone,
        // stackOffset: stackOffsetNone,
        fillOpacity: 0.7,
        colorOpacity: 1,
        lineWidth: 1,
        background: true
    },

    draw: function draw(plot, sheet, series) {
        var data = series[0].data(),
            aesthetics = this.aesthetics,
            path = plot.path(this, sheet).data([data]),
            x = this.scaled(this.accessor(plot.x || 'x'), plot.scalex || 'x'),
            y = this.scaled(this.accessor(plot.y || 'y'), 'y'),
            draw = area$2().x(x).y(y).curve(curve(aesthetics.curve)),
            width = sheet.dim(aesthetics.lineWidth),
            merge = plot.transition('update');

        path.enter().append('path').attr('class', 'area').attr('fill', 'none').attr('stroke', aesthetics.color).attr('stroke-opacity', 0).attr('stroke-width', width).merge(path).transition(merge).attr('stroke', aesthetics.color).attr('stroke-opacity', aesthetics.colorOpacity).attr('stroke-width', width).attr('d', draw);

        path.exit().remove();
    }
};

paper.events.on('init.data', function (options) {
    var source = options.dataSource || 'default';
    this.config.$set('dataSource', source);
    this.dataStore = fluidStore(options.dataStore);
    if (options.data) this.dataStore.add(options.data);
});

plots.events.on('init.data', function (options) {
    if (options.dataSource) this.config.$set('dataSource', options.dataSource);
    Object.defineProperties(this, {
        dataStore: {
            get: function get() {
                return this.paper.dataStore;
            }
        }
    });
});

if (inBrowser$2) {
    if (!paper.constants.resizeDelay) paper.constants.resizeDelay = 200;

    var resize$1 = viewDebounce(resizePaper, paper.constants.resizeDelay);
    select$7(window).on('resize.paper', resize$1);
}

function resizePaper() {
    paper.live.forEach(function (p) {
        p.resize();
    });
}

//
//  Add margin models to Paper and Plot objects
//
paper.events.on('init.margin', setMargin);
plots.events.on('init.margin', plotMargin);

var defaultMargin = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
};

function setMargin(options) {
    var margin = options.margin;

    if (margin !== undefined && !isObject$2(margin)) {
        var value = margin || 0;
        margin = {
            left: value,
            right: value,
            top: value,
            bottom: value
        };
    } else {
        margin = assign$4({}, defaultMargin, margin);
    }
    this.margin = this.config.$new(margin);
}

function plotMargin(options) {
    this.margin = this.paper.margin.$child(options.margin);

    Object.defineProperties(this, {
        innerWidth: {
            get: function get() {
                return this.paper.width - this.margin.left - this.margin.right;
            }
        },
        innerHeight: {
            get: function get() {
                return this.paper.height - this.margin.top - this.margin.bottom;
            }
        }
    });
}

paper.events.on('init.mapping', setMapping);
plots.events.on('init.mapping', plotMapping);
layers.events.on('init.mapping', layerMapping);

var defaultMapping = {
    x: {
        from: 'x'
    },
    y: {
        from: 'y'
    },
    theta: {
        from: 'theta'
    },
    radius: {
        from: 'radius'
    },
    color: {
        from: 'color'
    }
};

function setMapping(options) {
    this.mapping = this.config.$new(assign$4({}, defaultMapping, options.mapping));
}

function plotMapping(options) {
    this.mapping = this.paper.mapping.$child(options.mapping);
}

function layerMapping(options) {
    this.mapping = this.plot.mapping.$child(options.mapping);
}

paper.events.on('init.background', initBackground);
paper.events.on('before-draw.background', drawBackground);

function initBackground(options) {
    var background = options.background || {};

    if (!isObject$2(background)) background = { color: background };

    Object.defineProperty(this, 'background', {
        get: function get() {
            return background;
        }
    });
}

function drawBackground() {
    //grad = gradient(this.background);
    //grad.xscale.range([0, paper.width]);
    //grad.yscale.range([0, paper.height]);
    //grad.draw(paper.background);
}

paper.events.on('init.transitions', function (options) {
    this.config.transitions = this.config.$new(options.transitions);
});

plots.events.on('init.transitions', function (options) {
    this.config.transitions = this.paper.config.transitions.$child(options.transitions);
});

assign$4(plots.proto, {
    transition: function transition(layer, name) {
        var t = this.config.transitions[name];
        return t;
    }
});

// Plugins add functionality to papers and plots

// Built-in layers
layers.add('points', points);
layers.add('line', line$3);
layers.add('area', area$3);

// Built-in plots
plots.add('scatter', { layers: ['points'] });
plots.add('line', { layers: ['line'] });
plots.add('linepoints', { layers: ['line', 'points'] });
plots.add('area', { layers: ['area', 'line'] });

//
// Built-in scales
scales.add('x', {
    nice: true,

    range: function range() {
        return [0, this.plot.innerWidth];
    }
});

scales.add('-x', {
    nice: true,

    range: function range() {
        return [this.plot.innerWidth, 0];
    }
});

scales.add('y', {
    nice: true,

    range: function range() {
        return [this.plot.innerHeight, 0];
    }
});

scales.add('xy', {
    nice: true,

    domain: function domain() {
        return [0, 100];
    },
    range: function range() {
        return [0, Math.min(this.plot.innerWidth, this.plot.innerHeight)];
    }
});

scales.add('color', {
    domain: function domain() {
        return [0, 1];
    },
    range: function range() {
        return category20$1;
    }
});

coords.add('cartesian', {
    axes: ['x', 'y']
});

coords.add('cartesianFlipped', {
    axes: ['y', 'x']
});

// polar coordinate system
coords.add('polar', {
    axes: ['x', 'y'],
    x: {
        range: [0, 2 * Math.PI]
    }
});

var version$9 = "0.1.3";

exports.version = version$9;
exports.bisect = bisectRight;
exports.bisectRight = bisectRight;
exports.bisectLeft = bisectLeft;
exports.ascending = ascending;
exports.bisector = bisector;
exports.descending = descending;
exports.deviation = deviation;
exports.extent = extent;
exports.histogram = histogram;
exports.thresholdFreedmanDiaconis = freedmanDiaconis;
exports.thresholdScott = scott;
exports.thresholdSturges = sturges;
exports.max = max;
exports.mean = mean;
exports.median = median;
exports.merge = merge;
exports.min = min;
exports.pairs = pairs;
exports.permute = permute;
exports.quantile = threshold;
exports.range = sequence;
exports.scan = scan;
exports.shuffle = shuffle;
exports.sum = sum;
exports.ticks = ticks;
exports.tickStep = tickStep;
exports.transpose = transpose;
exports.variance = variance;
exports.zip = zip;
exports.nest = nest;
exports.set = set$1;
exports.map = map$1;
exports.keys = keys$1;
exports.values = values$1;
exports.entries = entries$1;
exports.randomUniform = uniform;
exports.randomNormal = normal;
exports.randomLogNormal = logNormal;
exports.randomBates = bates;
exports.randomIrwinHall = irwinHall;
exports.randomExponential = exponential;
exports.easeLinear = linear;
exports.easeQuad = quadInOut;
exports.easeQuadIn = quadIn;
exports.easeQuadOut = quadOut;
exports.easeQuadInOut = quadInOut;
exports.easeCubic = cubicInOut;
exports.easeCubicIn = cubicIn;
exports.easeCubicOut = cubicOut;
exports.easeCubicInOut = cubicInOut;
exports.easePoly = polyInOut;
exports.easePolyIn = polyIn;
exports.easePolyOut = polyOut;
exports.easePolyInOut = polyInOut;
exports.easeSin = sinInOut;
exports.easeSinIn = sinIn;
exports.easeSinOut = sinOut;
exports.easeSinInOut = sinInOut;
exports.easeExp = expInOut;
exports.easeExpIn = expIn;
exports.easeExpOut = expOut;
exports.easeExpInOut = expInOut;
exports.easeCircle = circleInOut;
exports.easeCircleIn = circleIn;
exports.easeCircleOut = circleOut;
exports.easeCircleInOut = circleInOut;
exports.easeBounce = bounceOut;
exports.easeBounceIn = bounceIn;
exports.easeBounceOut = bounceOut;
exports.easeBounceInOut = bounceInOut;
exports.easeBack = backInOut;
exports.easeBackIn = backIn;
exports.easeBackOut = backOut;
exports.easeBackInOut = backInOut;
exports.easeElastic = elasticOut;
exports.easeElasticIn = elasticIn;
exports.easeElasticOut = elasticOut;
exports.easeElasticInOut = elasticInOut;
exports.polygonArea = area;
exports.polygonCentroid = centroid;
exports.polygonHull = hull;
exports.polygonContains = contains$1;
exports.polygonLength = length$1;
exports.path = path;
exports.quadtree = quadtree;
exports.arc = arc$1;
exports.area = area$1;
exports.line = line;
exports.pie = pie;
exports.radialArea = radialArea;
exports.radialLine = radialLine$1;
exports.symbol = symbol;
exports.symbols = symbols;
exports.symbolCircle = circle;
exports.symbolCross = cross$1;
exports.symbolDiamond = diamond;
exports.symbolSquare = square;
exports.symbolStar = star;
exports.symbolTriangle = triangle;
exports.symbolWye = wye;
exports.curveBasisClosed = basisClosed;
exports.curveBasisOpen = basisOpen;
exports.curveBasis = basis;
exports.curveBundle = bundle;
exports.curveCardinalClosed = cardinalClosed;
exports.curveCardinalOpen = cardinalOpen;
exports.curveCardinal = cardinal;
exports.curveCatmullRomClosed = catmullRomClosed;
exports.curveCatmullRomOpen = catmullRomOpen;
exports.curveCatmullRom = catmullRom;
exports.curveLinearClosed = linearClosed;
exports.curveLinear = curveLinear;
exports.curveMonotoneX = monotoneX;
exports.curveMonotoneY = monotoneY;
exports.curveNatural = natural;
exports.curveStep = step;
exports.curveStepAfter = stepAfter;
exports.curveStepBefore = stepBefore;
exports.stack = stack;
exports.stackOffsetExpand = expand;
exports.stackOffsetNone = none;
exports.stackOffsetSilhouette = silhouette;
exports.stackOffsetWiggle = wiggle;
exports.stackOrderAscending = ascending$1;
exports.stackOrderDescending = descending$2;
exports.stackOrderInsideOut = insideOut;
exports.stackOrderNone = none$1;
exports.stackOrderReverse = reverse;
exports.color = color;
exports.rgb = rgb$1;
exports.hsl = hsl;
exports.lab = lab;
exports.hcl = hcl;
exports.cubehelix = cubehelix;
exports.interpolate = interpolateValue;
exports.interpolateArray = array$1;
exports.interpolateBasis = basis$2;
exports.interpolateBasisClosed = basisClosed$1;
exports.interpolateDate = date;
exports.interpolateNumber = interpolateNumber;
exports.interpolateObject = object$1;
exports.interpolateRound = interpolateRound;
exports.interpolateString = interpolateString;
exports.interpolateTransformCss = interpolateTransformCss;
exports.interpolateTransformSvg = interpolateTransformSvg;
exports.interpolateZoom = zoom;
exports.interpolateRgb = interpolateRgb;
exports.interpolateRgbBasis = rgbBasis;
exports.interpolateRgbBasisClosed = rgbBasisClosed;
exports.interpolateHsl = hsl$2;
exports.interpolateHslLong = hslLong;
exports.interpolateLab = lab$1;
exports.interpolateHcl = hcl$2;
exports.interpolateHclLong = hclLong;
exports.interpolateCubehelix = cubehelix$2;
exports.interpolateCubehelixLong = cubehelixLong;
exports.quantize = quantize;
exports.dispatch = dispatch;
exports.dsvFormat = dsv;
exports.csvParse = csvParse;
exports.csvParseRows = csvParseRows;
exports.csvFormat = csvFormat;
exports.csvFormatRows = csvFormatRows;
exports.tsvParse = tsvParse;
exports.tsvParseRows = tsvParseRows;
exports.tsvFormat = tsvFormat;
exports.tsvFormatRows = tsvFormatRows;
exports.now = now;
exports.timer = timer;
exports.timerFlush = timerFlush;
exports.timeout = timeout$1;
exports.interval = interval$1;
exports.timeInterval = newInterval;
exports.timeMillisecond = millisecond;
exports.timeMilliseconds = milliseconds;
exports.utcMillisecond = millisecond;
exports.utcMilliseconds = milliseconds;
exports.timeSecond = second;
exports.timeSeconds = seconds;
exports.utcSecond = second;
exports.utcSeconds = seconds;
exports.timeMinute = minute;
exports.timeMinutes = minutes;
exports.timeHour = hour;
exports.timeHours = hours;
exports.timeDay = day;
exports.timeDays = days;
exports.timeWeek = sunday;
exports.timeWeeks = sundays;
exports.timeSunday = sunday;
exports.timeSundays = sundays;
exports.timeMonday = monday;
exports.timeMondays = mondays;
exports.timeTuesday = tuesday;
exports.timeTuesdays = tuesdays;
exports.timeWednesday = wednesday;
exports.timeWednesdays = wednesdays;
exports.timeThursday = thursday;
exports.timeThursdays = thursdays;
exports.timeFriday = friday;
exports.timeFridays = fridays;
exports.timeSaturday = saturday;
exports.timeSaturdays = saturdays;
exports.timeMonth = month;
exports.timeMonths = months;
exports.timeYear = year;
exports.timeYears = years;
exports.utcMinute = utcMinute;
exports.utcMinutes = utcMinutes;
exports.utcHour = utcHour;
exports.utcHours = utcHours;
exports.utcDay = utcDay;
exports.utcDays = utcDays;
exports.utcWeek = utcSunday;
exports.utcWeeks = utcSundays;
exports.utcSunday = utcSunday;
exports.utcSundays = utcSundays;
exports.utcMonday = utcMonday;
exports.utcMondays = utcMondays;
exports.utcTuesday = utcTuesday;
exports.utcTuesdays = utcTuesdays;
exports.utcWednesday = utcWednesday;
exports.utcWednesdays = utcWednesdays;
exports.utcThursday = utcThursday;
exports.utcThursdays = utcThursdays;
exports.utcFriday = utcFriday;
exports.utcFridays = utcFridays;
exports.utcSaturday = utcSaturday;
exports.utcSaturdays = utcSaturdays;
exports.utcMonth = utcMonth;
exports.utcMonths = utcMonths;
exports.utcYear = utcYear;
exports.utcYears = utcYears;
exports.formatDefaultLocale = defaultLocale;
exports.formatLocale = formatLocale;
exports.formatSpecifier = formatSpecifier;
exports.precisionFixed = precisionFixed;
exports.precisionPrefix = precisionPrefix;
exports.precisionRound = precisionRound;
exports.timeFormatDefaultLocale = defaultLocale$1;
exports.timeFormatLocale = formatLocale$1;
exports.isoFormat = formatIso;
exports.isoParse = parseIso;
exports.scaleBand = band;
exports.scalePoint = point$1;
exports.scaleIdentity = identity$4;
exports.scaleLinear = linear$2;
exports.scaleLog = log;
exports.scaleOrdinal = ordinal;
exports.scaleImplicit = implicit;
exports.scalePow = pow;
exports.scaleSqrt = sqrt;
exports.scaleQuantile = quantile$$1;
exports.scaleQuantize = quantize$1;
exports.scaleThreshold = threshold$1;
exports.scaleTime = time;
exports.scaleUtc = utcTime;
exports.schemeCategory10 = category10;
exports.schemeCategory20b = category20b;
exports.schemeCategory20c = category20c;
exports.schemeCategory20 = category20;
exports.interpolateCubehelixDefault = cubehelix$3;
exports.interpolateRainbow = rainbow$1;
exports.interpolateWarm = warm;
exports.interpolateCool = cool;
exports.interpolateViridis = viridis;
exports.interpolateMagma = magma;
exports.interpolateInferno = inferno;
exports.interpolatePlasma = plasma;
exports.scaleSequential = sequential;
exports.inBrowser = inBrowser;
exports.logger = logger;
exports.assign = assign;
exports.self = self$1;
exports.pop = pop$1;
exports.isObject = isObject;
exports.isString = isString;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.isDate = isDate;
exports.isNumber = isNumber;
exports.isPromise = isPromise;
exports.orderedMap = map$4;
exports.letVersion = version;
exports.tweenAttr = tweenAttr;
exports.selection = canvasSelection;
exports.resolution = resolution;
exports.CanvasElement = CanvasElement;
exports.fontProperties = fontProperties;
exports.axisTop = axisTop;
exports.axisRight = axisRight;
exports.axisBottom = axisBottom;
exports.axisLeft = axisLeft;
exports.canvasVersion = version$1;
exports.creator = creator;
exports.matcher = matcher$1;
exports.mouse = mouse;
exports.namespace = namespace;
exports.namespaces = namespaces;
exports.select = select;
exports.selectAll = selectAll;
exports.selector = selector;
exports.selectorAll = selectorAll;
exports.touch = touch;
exports.touches = touches;
exports.window = window$1;
exports.view = view;
exports.viewModel = model;
exports.viewExpression = viewExpression;
exports.viewReady = dom;
exports.viewProviders = providers;
exports.viewWarn = warn;
exports.viewRequire = require$1;
exports.viewForms = plugin;
exports.viewBootstrapForms = plugin$1;
exports.viewUid = uid;
exports.viewDebounce = debounce;
exports.viewVersion = version$3;
exports.viewElement = htmlElement;
exports.viewTemplate = compile$1;
exports.viewHtml = html$1;
exports.fluidStore = fluidStore;
exports.fluidPlugin = plugin$4;
exports.fluidPaper = paper;
exports.fluidLayers = layers;
exports.fluidScales = scales;
exports.fluidPlots = plots;
exports.fluidVersion = version$8;

Object.defineProperty(exports, '__esModule', { value: true });

})));
