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

        var nodes = d3.range(200).map(function () {
                return {radius: Math.random() * 12 + 4};
            }),
            root = nodes[0],
            color = d3.scaleOrdinal(d3.schemeCategory10);

        root.radius = 0;
        root.fixed = true;

        var force = d3.forceSimulation(nodes)
            .gravity(0.05)
            .charge(function (d, i) {
                return i ? 0 : -2000;
            })
            .size([width, height]);

        force.start();

        var example = d3.select("#example");

        example.select('.paper').remove();
        var paper = example
                .append(type)
                .classed('paper', true)
                .attr('width', width).attr('height', height).canvasResolution(r).canvas(true);

        paper.selectAll("circle")
            .data(nodes.slice(1))
            .enter().append("circle")
            .attr("r", function (d) {
                return d.radius;
            })
            .style("fill", function (d, i) {
                return color(i % 3);
            });

        force.on("tick", function (e) {
            var q = d3.geom.quadtree(nodes),
                i = 0,
                n = nodes.length;

            while (++i < n) q.visit(collide(nodes[i]));

            paper.selectAll("circle")
                .attr("cx", function (d) {
                    return d.x;
                })
                .attr("cy", function (d) {
                    return d.y;
                });
        });

        paper.on("mousemove", function () {
            var p1 = d3.mouse(this);
            root.px = p1[0];
            root.py = p1[1];
            force.resume();
        });

        function collide(node) {
            var r = node.radius + 16,
                nx1 = node.x - r,
                nx2 = node.x + r,
                ny1 = node.y - r,
                ny2 = node.y + r;
            return function (quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== node)) {
                    var x = node.x - quad.point.x,
                        y = node.y - quad.point.y,
                        l = Math.sqrt(x * x + y * y),
                        r = node.radius + quad.point.radius;
                    if (l < r) {
                        l = (l - r) / l * .5;
                        node.x -= x *= l;
                        node.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            };
        }
    }
}());
