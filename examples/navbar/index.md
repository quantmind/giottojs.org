title: Navbar Component
requirejs: /examples/navbar/script.js


<navbar d3-model="navbar"></navbar>

<form>
    <fieldset class="form-group">
        <legend>Choose a style</legend>
        <div class="radio" d3-for="theme in themes">
            <label>
                <input class="form-check-input" type="radio" name="theme" d3-on-click="navbar.$set('theme', theme)">
                <span d3-html="theme"></span>
            </label>
        </div>
    </fieldset>
</form>
