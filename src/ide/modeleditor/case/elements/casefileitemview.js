import CaseFileItemDef from "../../../../repository/definition/cmmn/casefile/casefileitemdef";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import { CMMNDocumentationDefinition } from "../../../../repository/definition/elementdefinition";
import CMMNElementView from "./cmmnelementview";
import CaseFileItemHalo from "./halo/cmmn/casefileitemhalo";
import CaseFileItemProperties from "./properties/casefileitemproperties";
import StageView from "./stageview";

export default class CaseFileItemView extends CMMNElementView {
    /**
     * 
     * @param {StageView} stage 
     * @param {Number} x 
     * @param {Number} y 
     * @param {CaseFileItemDef} y 
     */
    static create(stage, x, y, definition = undefined) {
        definition = definition || CaseFileItemDef.createEmptyDefinition(stage.case.caseDefinition);
        const shape = stage.case.diagram.createShape(x, y, 25, 40, definition.id);
        return new CaseFileItemView(stage, definition, shape);
    }

    /**
     * Creates a new CaseFileItemView
     * @param {StageView} parent 
     * @param {CaseFileItemDef} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent.case, parent, definition, shape);
        this.definition = definition;
        if (definition.isEmpty) {
            // This means it is a temporary definition that will not be saved on the server.
            //  But we want to keep track of the id in case a definition is added and then removed again.
            this.temporaryId = definition.id;
        }
        this.__resizable = false;
    }

    createProperties() {
        return new CaseFileItemProperties(this);
    }

    createHalo() {
        return new CaseFileItemHalo(this);
    }

    __removeElementDefinition() {
        // Override here, because the superclass also removes the defition element,
        //  but for case file item views, we should only remove the shape.
        this.shape.removeDefinition();
    }

    refreshReferencingFields(definitionElement) {
        super.refreshReferencingFields(definitionElement);
        if (this.definition == definitionElement) {
            this.refreshText();
        }
    }

    /**
     * 
     * @param {CaseFileItemDef} definition 
     */
    setDefinition(definition) {
        this.definition = definition ? definition : CaseFileItemDef.createEmptyDefinition(this.case.caseDefinition);
        if (this.definition.isEmpty) {
            if (this.temporaryId) {
                // Restore the temporary id again
                this.definition.id = this.temporaryId;
            } else {
                this.temporaryId = this.definition.id;
            }
        }
        this.shape.cmmnElementRef = this.definition.id;
        this.refreshText();
        this.editor.completeUserAction();
    }

    get text() {
        return this.definition ? this.definition.name : '';
    }

    /**
     * @returns {CMMNDocumentationDefinition}
     */
    get documentation() {
        return this.definition && this.definition.documentation;
    }

    get markup() {
        return `<g>
                    <polyline class="cmmn-shape cmmn-border cmmn-casefile-shape" points=" 15,0 0,0 0,40 25,40 25,10 15,0 15,10 25,10" />
                </g>
                <text class="cmmn-text" text-anchor="middle" x="10" y="55" />`;
    }

    referencesDefinitionElement(definitionId) {
        return this.definition && this.definition.id === definitionId;
    }

    get isCaseFileItem() {
        return true;
    }
}
