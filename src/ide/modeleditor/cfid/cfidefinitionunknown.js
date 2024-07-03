import CaseFileDefinitionDefinition from "@definition/cfid/casefileitemdefinitiondefinition";
import CaseFileItemDefinitionEditor from "./casefileitemdefinitioneditor";
import $ from "jquery";

export default class CFIDefinitionUnknown{
    /**
     * 
     * @param {CaseFileItemDefinitionEditor} editor 
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
