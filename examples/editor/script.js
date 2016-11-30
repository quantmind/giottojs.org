require([
    'd3',
    'https://cdnjs.cloudflare.com/ajax/libs/marked/0.3.6/marked.min.js',
    'giottojs'], function (d3, marked) {

    d3.view({
        model: {
            html: function () {
                return marked(this.input || '');
            }
        }
    }).mount('#editor');
});
