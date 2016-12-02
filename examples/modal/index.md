title: Modal component
description: A bootstrap modal component with d3-view
requirejs: /examples/form/script.js

<div class="mx-auto mw500">
    <p>Toggle a modal via JavaScript by clicking the button below. It will slide down and fade in from the top of the page.
    </p>
    <a class="btn btn-primary" href="#" role="button" d3-on-click="testModal.$show()">Link</a>
    <d3modal d3-model="testModal">
        <div d3-once="body">
            You can use the ``d3-once`` directive to initialise component model attributes without one-way binding.
        </div>
    </d3modal>
</div>
