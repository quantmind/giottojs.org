define(['d3'], function (d3) {

    // Add a new layer
    d3.fluidLayers.add('particles', {

        defaults: {
            shape: 'circle',
            size: 0.025,
            minDistance: 0.04,
            maxDistance: 0.06
        },

        draw: draw
    });

    // Add the particle plot
    d3.fluidPlots.add('particles', {
        layers: ['particles']
    });

    // Create d3fluid options
    return {
        data: d3.fluidStore.random(200, 'x', 'y'),
        dashboard: {
            "class": "col-sm-12",
            aspect: "2:1",
            paper: "example",
        },
        example: {
            margin: 0,
            plots: [
                {
                    type: "particles"
                }
            ]
        }
    };

    function draw (particles, context) {

        var tau = 2 * Math.PI,
            cfg = this.config,
            plot = this.plot,
            width = this.plot.innerWidth,
            height = this.plot.innerWidth,
            minDistance = cfg.minDistance,
            maxDistance = cfg.maxDistance,
            minDistance2 = minDistance * minDistance,
            maxDistance2 = maxDistance * maxDistance,
            group = plot.group(this),
            i, j;

        for (i = 0; i < particles.length; ++i) {
            var p = particles[i];
            p.x += p.vx;
            if (p.x < -maxDistance) p.x += width + maxDistance * 2;
            else if (p.x > width + maxDistance) p.x -= width + maxDistance * 2;
            p.y += p.vy;
            if (p.y < -maxDistance) p.y += height + maxDistance * 2;
            else if (p.y > height + maxDistance) p.y -= height + maxDistance * 2;
            p.vx += 0.2 * (Math.random() - 0.5) - 0.01 * p.vx;
            p.vy += 0.2 * (Math.random() - 0.5) - 0.01 * p.vy;
            context.beginPath();
            context.arc(p.x, p.y, cfg.size, 0, tau);
            context.fill();
        }

        for (i = 0; i < particles.length; ++i) {
            for (j = i + 1; j < particles.length; ++j) {
                var pi = particles[i],
                    pj = particles[j],
                    dx = pi.x - pj.x,
                    dy = pi.y - pj.y,
                    d2 = dx * dx + dy * dy;
                if (d2 < maxDistance2) {
                    context.globalAlpha = d2 > minDistance2 ? (maxDistance2 - d2) / (maxDistance2 - minDistance2) : 1;
                    context.beginPath();
                    context.moveTo(pi.x, pi.y);
                    context.lineTo(pj.x, pj.y);
                    context.stroke();
                }
            }
        }
    }
});
