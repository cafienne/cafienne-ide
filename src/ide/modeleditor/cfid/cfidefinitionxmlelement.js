import $ from "jquery";
import CaseFileDefinitionDefinition from "../../../repository/definition/cfid/casefileitemdefinitiondefinition";
import HtmlUtil from "../../util/htmlutil";
import CaseFileItemDefinitionEditor from "./casefileitemdefinitioneditor";

export default class CFIDefinitionXMLElement {
    /**
     * 
     * @param {CaseFileItemDefinitionEditor} editor 
     * @param {JQuery<HTMLElement>} container 
     */
    constructor(editor, container) {
        this.editor = editor;
        this.container = container;
        this.html = $('<div class="cfidefxmldoc"></div>');
        this.container.append(this.html);
    }

    /**
     * Recreates and shows the html of the cfi definition type XMLElement
     * 
     * @param {CaseFileDefinitionDefinition} data 
     */
    show(data) {
        HtmlUtil.clearHTML(this.html);
        this.html.html(`<div>
                        <label>Structure Ref</label>
                        <input class="inputStructureRef" value="${data.structureRef}" />
                    </div>
                    <div>
                        <label>Import Ref</label>
                        <input class="inputImportRef" value="${data.importRef}" />
                </div>`);
        // Attach event handlers for changing the properties                            
        this.html.find('.inputStructureRef').on('change', e => {
            data.structureRef = e.currentTarget.value;
            this.editor.saveModel();
        });
        this.html.find('.inputImportRef').on('change', e => {
            data.importRef = e.currentTarget.value;
            this.editor.saveModel();
        });
    }
}
