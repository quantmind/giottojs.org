title: Markdown Editor with d3-view
requirejs: https://cdnjs.cloudflare.com/ajax/libs/marked/0.3.6/marked.min.js
requirejs: /giottojs/examples/editor/script.js


<div class="container" id="editor">
    <div class="row">
        <div class="col-sm-6">
            <textarea d3-value="input"># hello</textarea>
        </div>
        <div d3-html="html" class="col-sm-6"></div>
    </div>
</div>
