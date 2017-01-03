(function () {

    var canvas = d3.selectCanvas('#test2'),
        height = canvas.attr('height'),
        width = canvas.attr('width'),
        twizzleLock = {},
        plonkLock = {};

    canvas.canvas(true)
        .style("stroke-linejoin", "round")
        .append("g")
            .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
        .append("path")
            .attr("fill", "black")
            .attr("stroke", "red")
            .attr("d", d3.symbol().type(d3.symbolCross).size(50000))
            .call(twizzle, 20000)
            .call(plonk, 2000);


    function twizzle (path, duration) {
        d3.select(twizzleLock)
            .transition()
            .duration(duration)
            .tween("attr:transform", function() {
                var i = d3.interpolateString("rotate(0)", "rotate(720)");
                return function(t) {
                    path.attr("transform", i(t));
                };
            });

        d3.timeout(function() {
            twizzle(path, duration);
        }, (Math.random() + 1) * duration);
    }

    function plonk(path, duration) {
        d3.select(plonkLock)
            .transition()
            .duration(duration)
            .tween("style:stroke-width", function() {
                var i = d3.interpolateString("0px", "30px");
                return function(t) {
                    path.style("stroke-width", i(t));
                };
            })
            .transition()
            .tween("style:stroke-width", function() {
                var i = d3.interpolateString("30px", "0px");
                return function(t) {
                    path.style("stroke-width", i(t));
                };
            });

        d3.timeout(function() {
            plonk(path, duration);
        }, (Math.random() + 2) * duration);
    }

}());
