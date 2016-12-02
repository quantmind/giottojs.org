require(['d3', 'giottojs'], function (d3, site) {


    d3.view({
        model: {
            navbar: {
                fixedTop: true,
                theme: 'navbar-light bg-faded',
                brand: {
                    title: "Test"
                },
                items: [
                    {
                        title: 'one'
                    },
                    {
                        title: 'two'
                    },
                    {
                        title: 'three'
                    }
                ]
            },
            themes: [
                "navbar-light bg-faded",
                "navbar-dark bg-primary",
                "navbar-dark bg-inverse"
            ]

        }
    }).use(site.components).mount('#page');

});
