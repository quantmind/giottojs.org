(function () {
    var barWidth = 20,
        canvas = d3.selectCanvas('#test1'),
        height = canvas.attr('height'),
        y = d3.scaleLinear().range([height, 0]).domain([0, 10]);

    var bar = canvas.canvas(true)
        .selectAll('g')
        .data([1, 2, 3, 4, 5, 6])
        .enter()
            .append('g')
            .attr("transform", function(d, i) { return "translate(" + i * barWidth + ",0)"; });

    bar.append("rect")
        .attr('fill', 'steelblue')
        .attr("y", function(d) { return y(d); })
        .attr("height", function(d) { return height - y(d); })
        .attr("width", barWidth - 1);

}());
