
var clock = {

    render: function () {
        var format = giotto.timeFormat("%B %d, %H:%M:%S"),
            el = this.createElement('h1'),
            self = this;

        function show () {
            var dt = new Date(),
                next = 1000 - dt.getMilliseconds();
            el.text(format(dt));
            self.timer = giotto.timeout(show, next);
        }

        show();
        return el;
    },

    destroy: function () {
        if (this.timer) this.timer.stop();
    }

};


giotto.view({
    components: {
        clock: clock
    }
}).mount('#clock');
