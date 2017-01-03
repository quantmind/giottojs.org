(function () {
    d3.select('#svg').on('click', function () {draw('svg');});
    d3.select('#canvas').on('click', function () {draw('canvas');});
    if (d3.resolution() > 1) {
        d3.select('#paper').append('label').html(
            "<input id='canvas-low' name='type' type='radio'><span>canvas low resolution</span>"
        );
        d3.select('#canvas-low').on('click', function () {draw('canvas', 1);});
    }

    draw('svg');

    function draw (type, r) {
        var width = 960,
            height = 500,
            example = d3.select("#example");

        example.select('.paper').remove();
        var paper = example
                .append(type)
                .classed('paper', true)
                .attr('width', 960).attr('height', 500).canvasResolution(r).canvas(true);

        paper
            .style('stroke-opacity', 0.20)
            .style('shape-rendering', 'crispEdges')
            .append('defs')
            .append('linearGradient')
            .attr('id', 'linear-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%')
            .selectAll('stop')
            .data(["#2c7bb6", "#00a6ca", "#00ccbc", "#90eb9d", "#ffff8c", "#f9d057", "#f29e2e", "#e76818", "#d7191c"])
            .enter()
            .append('stop')
            .attr('offset', function (c, i) {
                return 12.5 * i + '%';
            })
            .attr('stop-color', function (c) {
                return c;
            });

        var zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[-100, -100], [width + 90, height + 100]])
            .on("zoom", zoomed);

        var x = d3.scaleLinear()
            .domain([-1, width + 1])
            .range([-1, width + 1]);

        var y = d3.scaleLinear()
            .domain([-1, height + 1])
            .range([-1, height + 1]);

        var xAxis = d3.axisBottom(x)
            .ticks((width + 2) / (height + 2) * 10)
            .tickSize(height)
            .tickPadding(8 - height);

        var yAxis = d3.axisRight(y)
            .ticks(10)
            .tickSize(width)
            .tickPadding(8 - width);

        var view = paper
            .append("rect")
            .style("fill", 'url(#linear-gradient)')
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width - 1)
            .attr("height", height - 1);

        var gX = paper
            .append("g")
            .call(xAxis);

        var gY = paper.append("g")
            .call(yAxis);

        d3.select("button")
            .on("click", resetted);

        paper.call(zoom);

        function zoomed() {
            view.attr("transform", d3.event.transform);
            gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
            gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
        }

        function resetted() {
            paper
                .transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }
    }

}());
