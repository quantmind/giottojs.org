
gexamples.linetypes = {
    height: '70%',

    tooltip: {
      show: true
    },

    point: {
        show: true,
        lineWidth: 3,
        fill: '#fff',
        size: '12px',
        formatY: ',.4g',
        active: {
            fill: '#fff',
            size: '150%'
        }
    },

    line: {
        show: true,
        lineWidth: 3,
        transition: {
            delay: 250
        }
    },

    grid: {
        show: true,
        color: '#000'
    },

    data: {
        src: function () {
            return [randomPath(0.2, 0.3)];
        }
    },

    // Callback for angular directive
    angular: function (chart, opts) {

        function update (form) {
            angular.forEach(form, function (value, name) {
                if (name === 'type')
                    opts.type = value;
                else if (name === 'interpolate')
                    chart.setSerieOption('line', name, value);
                else
                    chart.setSerieOption('point', name, value);
            });
            chart.resume();
        }

        chart.scope().$on('formReady', function (e, form) {
            update(form);
        });
        chart.scope().$on('formFieldChange', function (e, form) {
            update(form);
        });
    }
};

function randomPath (µ, σ) {
    // Create a random path
    var t = d3.range(0, 5, 0.5),
        data = [[t[0], 1]],
        norm = d3.random.normal(0, 1),
        dt, dy;

    for(var i=1; i<t.length; i++) {
        dt = t[i] - t[i-1];
        dy = dt*µ + σ*norm()*Math.sqrt(dt);
        data[i] = [t[i], data[i-1][1]+ dy];
    }
    return data;
}