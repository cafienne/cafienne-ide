'use strict';

class CFIDModelDefinitionUnknown{
    /**
     * 
     * @param {CFIDModelEditor} editor 
     * @param {JQuery<HTMLElement>} container 
     */
    constructor(editor, container) {
        this.editor = editor;
        this.container = container;
        this.html = $('<div class="cfidefunknown">Properties are not required</div>');
        this.container.append(this.html);
    }

    /**
     * 
     * @param {CaseFileDefinitionDefinition} data 
     */
    show(data) {
        // Nothing todo here.
    }
}
