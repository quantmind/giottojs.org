(function () {
    var canvas = d3.selectCanvas('#test3'),
        margin = 40,
        width = canvas.attr('width') - 2*margin,
        height = canvas.attr('height') - 2*margin;

    var y = d3.scalePoint().domain(d3.range(50)).range([0, height]);
    var z = d3.scaleLinear()
        .domain([10, 0])
        .range(["hsl(62,100%,90%)", "hsl(228,30%,20%)"])
        .interpolate(d3.interpolateHcl);

    canvas.canvas(true)
        .append('g')
            .attr("stroke", "black")
            .attr("stroke-width", 1.5)
            .attr("transform", "translate(" + margin + "," + margin + ")")
        .selectAll("circle")
            .data(y.domain())
            .enter()
                .append("circle")
                .attr("r", 25)
                .attr("cx", 0)
                .attr("cy", y)
                .style("fill", function(d) { return z(Math.abs(d % 20 - 10));})
                .transition()
                .duration(2500)
                .delay(function(d) { return d * 40; })
                .on("start", slide);

    function slide() {
        d3.active(this)
          .attr("cx", width)
        .transition()
          .attr("cx", 0)
        .transition()
          .on("start", slide);
    }

}());
