giotto.view({
    model: {
        html: function () {
            return marked(this.input || '');
        }
    }
}).mount('#editor');
