(function () {
    d3.select('#svg').on('click', function () {
        draw('svg');
    });
    d3.select('#canvas').on('click', function () {
        draw('canvas');
    });
    if (d3.resolution() > 1) {
        d3.select('#paper').append('label').html(
            "<input id='canvas-low' name='type' type='radio'><span>canvas low resolution</span>"
        );
        d3.select('#canvas-low').on('click', function () {
            draw('canvas', 1);
        });
    }

    draw('svg');

    function draw(type, r) {

        var width = 960,
            height = 500,
            size = Math.max(width, height),
            example = d3.select("#example");

        example.select('.paper').remove();
        var paper = example
                .append(type)
                .classed('paper', true)
                .attr('width', width).attr('height', height).canvasResolution(r).canvas(true);

        var color = d3.scaleSequential(d3.interpolateRainbow)
            .domain([0, 2 * Math.PI]);

        var circles = d3.packSiblings(d3.range(2000)
            .map(d3.randomUniform(8, 26))
            .map(function (r) {
                return {r: r};
            }))
            .filter(function (d) {
                return -500 < d.x && d.x < 500 && -500 < d.y && d.y < 500;
            });

        paper
            .append('rect')
            .style("fill", '#333')
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height);

        paper
            .append("g")
            .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")")
            .selectAll("circle")
            .data(circles)
            .enter().append("circle")
            .style("fill", function (d) {
                return color(d.angle = Math.atan2(d.y, d.x));
            })
            .attr("cx", function (d) {
                return Math.cos(d.angle) * (size / Math.SQRT2 + 30);
            })
            .attr("cy", function (d) {
                return Math.sin(d.angle) * (size / Math.SQRT2 + 30);
            })
            .attr("r", function (d) {
                return d.r - 0.25;
            })
            .transition()
            .ease(d3.easeCubicOut)
            .delay(function (d) {
                return Math.sqrt(d.x * d.x + d.y * d.y) * 10;
            })
            .duration(1000)
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            });
    }
}());
