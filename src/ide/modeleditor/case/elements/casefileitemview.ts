import CaseFileItemDef from "../../../../repository/definition/cmmn/casefile/casefileitemdef";
import CMMNElementDefinition from "../../../../repository/definition/cmmnelementdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import CaseElementView from "./caseelementview";
import CaseFileItemHalo from "./halo/cmmn/casefileitemhalo";
import CaseFileItemProperties from "./properties/casefileitemproperties";
import StageView from "./stageview";

export default class CaseFileItemView extends CaseElementView<CaseFileItemDef> {
    temporaryId?: string;

    static create(stage: StageView, x: number, y: number, definition?: CaseFileItemDef) {
        definition = definition || CaseFileItemDef.createEmptyDefinition(stage.canvas.caseDefinition);
        const shape = stage.canvas.diagram.createShape(x, y, 25, 40, definition.id);
        return new CaseFileItemView(stage, definition, shape);
    }

    /**
     * Creates a new CaseFileItemView
     */
    constructor(public parent: StageView, definition: CaseFileItemDef, shape: ShapeDefinition) {
        super(parent.canvas, parent, definition, shape);
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

    refreshReferencingFields(definitionElement: CMMNElementDefinition) {
        super.refreshReferencingFields(definitionElement);
        if (this.definition == definitionElement) {
            this.refreshText();
        }
    }

    setDefinition(definition?: CaseFileItemDef) {
        this.definition = definition ? definition : CaseFileItemDef.createEmptyDefinition(this.canvas.caseDefinition);
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

    get documentation() {
        return this.definition && this.definition.documentation;
    }

    get markup() {
        return `<g>
                    <polyline @selector='body' points=" 15,0 0,0 0,40 25,40 25,10 15,0 15,10 25,10" />
                </g>
                <text @selector='label' text-anchor="middle" x="10" y="55" />`;
    }

    get markupAttributes() {
        return {};
    }

    referencesDefinitionElement(definitionId: string) {
        return this.definition && this.definition.id === definitionId;
    }

    get isCaseFileItem() {
        return true;
    }
}
