
var oivdata = [['Italy', 42772],
               ['France', 50764],
               ['Spain', 33397],
               ['USA', 19187],
               ['Argentina', 15473],
               ['China', 13200],
               ['Australia', 11180],
               ['Chile', 10463],
               ['Germany', 9132],
               ['South Africa', 9725],
               ['Portugal', 5610],
               ['New Zealand', 2350],
               ['Rest of World', 63776]];

gexamples.piecharts = {
    height: '80%',
    margin: 80,

    tooltip: {
      show: true
    },

    pie: {
        show: true,
        formatY: function (d) {
            return d3.format(',')(d) + 'M ectoliters';
        },
        active: {
            outerRadius: '105%'
        },
        labels: {
            position: 'outside'
        },
        formatPercent: ',.1%'
    },

    data: {
        src: [{label: 'Wine Production 2013', data: oivdata}],
    },

    // Callback for angular directive
    angular: function (chart, opts) {

        function update (form) {
            angular.forEach(form, function (value, name) {
                if (name === 'type')
                    opts.type = value;
                else
                    chart.setSerieOption('pie', name, value);
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