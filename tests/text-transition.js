(function () {

    var canvas = d3.selectCanvas('#test4'),
        height = canvas.attr('height'),
        width = canvas.attr('width'),
        format = d3.format(",d");

    canvas.canvas(true)
        .append("text")
        .style("font-size", 120)
        .style("font-family", '"Helvetica Neue"')
        .style("color", "black")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
        .text('0')
        .transition()
        .duration(2500)
        .on("start", function repeat() {
            d3.active(this)
                .tween("text", function() {
                var that = d3.select(this),
                    i = d3.interpolateNumber(that.text().replace(/,/g, ""), Math.random() * 1e6);
                    return function(t) {
                        that.text(format(i(t)));
                    };
                })
                .transition()
                .delay(1500)
                .on("start", repeat);
        });

}());
