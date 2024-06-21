/**
 * Grid class contains some statics to arrange for the global settings of the grid.
 * Grid settings (size and whether visible or not) are stored in LocalStorage of the browser.
 * Also they can be modified from the IDE header above cases.
 * Grid is currently attached to the paper object of each case (see case.js).
 */

/**
 * @type {Array<Grid>}
 */
const grids = []; // List of all grid objects; forms a memory leak, in anticipation of keeping only one canvas for all cases, instead of a canvas per case.

export default class Grid {

    /**
     * 
     * @param {Grid} grid 
     */
    static register(grid) {
        grids.push(grid);
        if (!this.initialized) {
            this.initialized = true;
            this.ide = grid.case.editor.ide;
            $('#inputGridSize').val(Grid.Size);
            $('#inputShowGrid').prop('checked', Grid.Visible);

            // Attach listeners to the HTML with the settings.
            // These are "global" listeners, and we keep track of an array with ALL grids (so basically a memory leak, because grid objects are create in case.js)
            // Whenever a settings is modified, all grids will be informed of the change and everything will be recalculated
            $('#inputGridSize').on('change', e => Grid.Size = e.currentTarget.value);
            $('#inputGridSize').on('keydown', e => e.stopPropagation()); // Avoid backspace and delete to remove elements from the canvas
            $('#inputShowGrid').on('change', e => Grid.Visible = e.currentTarget.checked);
        }
    }

    /**
     * Returns global grid size setting
     */
    static get Size() {
        // this.initialize();
        return Settings.gridSize;
    }

    /**
     * Changes global grid size.
     * - Validates that it is an actual number, greater than 0.
     * - Stores the new size in local storage.
     * - Generates new background raster.
     * - Updates all grid objects with the new size.
     */
    static set Size(newSize) {
        // Only set new grid size if it is a valid value.
        if (newSize <= 0 || !Number.isInteger(Number.parseFloat(newSize)) || isNaN(newSize)) {
            this.ide.warning(`Grid size must be a whole number greater than zero instead of ${newSize}`, 1000);
            // Restore the previous value
            $('#inputGridSize').val(Grid.Size);
            return;
        }
        // Store it in the settings
        Settings.gridSize = newSize;

        // And inform all grids about the new size
        this.renderAllGrids();
    }

    /**
     * Snaps the number to the nearest grid dot. If ctrl-key is pressed, it will not snap.
     * @param {Number} number
     * @returns {Number}
     */
    static snap(number) {
        return window.event && window.event.ctrlKey ? number : Grid.Size * Math.round(number / Grid.Size);
    }

    /**
     * Returns global grid visibility setting
     */
    static get Visible() {
        return Settings.gridVisibility;
    }

    /**
     * Changes global grid visibility
     * - validates that it is a boolean
     * - stores it in local storage
     * - updates all grids with the new background image (visibile or not)
     */
    static set Visible(visibility) {
        if (typeof(visibility) !== 'boolean') {
            console.warn('Cannot set visibility of the grid with a value of type ' + typeof(visibility) + ', it must be of type boolean');
            return;
        }
        Settings.gridVisibility = visibility;
        this.renderAllGrids();
    }

    static renderAllGrids() {
        // Change the background image
        grids.forEach(grid => grid.render());
    }

    static blurSetSize() {
        if ($('#inputGridSize').is(':focus')) {
            $('#inputGridSize').trigger('blur');
        }
    }

    /**
     * Helper class that adds grid structure to the jointjs paper element.
     * We can set the .size and the .visible property.
     * @param {*} paper effectively joint.dia.Paper
     * @param {CaseView} cs effectively joint.dia.Paper
     */
    constructor(paper, cs) {
        this.paper = paper;
        this.case = cs;
        // Register grid for changes to the settings
        Grid.register(this);
        // Do a first time render
        this.render();
    }

    render() {
        if (Grid.Visible) {
            // Note: we do this asynchronously, because the paper in joint may not yet have been created properly
            window.setTimeout(() => this.paper.drawGrid({ color: 'black' }), 0);

        } else {
            this.paper.clearGrid();
        }
        // Set grid size on the JointJS paper object (joint.dia.Paper instance)
        this.paper.options.gridSize = Grid.Size;
    }
}