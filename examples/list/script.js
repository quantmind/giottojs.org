require(['d3'], function (d3) {

    var vm = d3.view({
        model: {
            data: [],
            $addData (entry) {
                this.data.push(entry);
            }
        }
    });

    vm.use(d3.listPlugin).mount('#page');

    var timer = d3.timer(function (elapsed) {
        vm.model.$addData({
            elapsed: elapsed
        });
        if (elapsed > 1000) timer.stop();
    }, 100);

});
