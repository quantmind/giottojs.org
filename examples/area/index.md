title: Area Chart
description: GiottoJS supports area charts for both svg and canvas elements

<div class="row" d3-fluid='giotto.json'>
    <div class="col-sm-10">
        <div data-aspect-ratio="2:1">
            <d3paper></d3paper>
        </div>
    </div>
    <div class="col-sm-2">
        <button class="btn btn-default" type="submit" d3-click="vm.randomize()">Randomize</button>
    </div>
</div>

Area charts are enabled by adding ``area`` to the ``draw`` list.
