title: Markdown Editor
description: Dead simple markdown editor with d3-view
category: d3-view
requirejs: /examples/editor/script.js


<div class="container" id="editor">
    <div class="row">
        <div class="col-sm-6">
            <textarea class="form-control" rows="20" d3-value="input"># hello</textarea>
        </div>
        <div d3-html="html" class="col-sm-6"></div>
    </div>
</div>

<br>
A simple markdown editor inspired by [vue](http://vuejs.org/v2/examples/).

```html
<div class="container" id="editor">
    <div class="row">
        <div class="col-sm-6">
            <textarea class="form-control" rows="20" d3-value="input"># hello</textarea>
        </div>
        <div d3-html="html" class="col-sm-6"></div>
    </div>
</div>
```
