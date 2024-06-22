import TextAnnotationDefinition from "../../../../repository/definition/artifact/textannotation";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import CMMNElementView from "./cmmnelementview";
import TextAnnotationProperties from "./properties/textannotationproperties";
import StageView from "./stageview";

export default class TextAnnotationView extends CMMNElementView {
    /**
     * 
     * @param {StageView} stage 
     * @param {Number} x 
     * @param {Number} y 
     */
    static create(stage, x, y) {
        const definition = stage.case.caseDefinition.createTextAnnotation();
        const shape = stage.case.diagram.createShape(x, y, 100, 60, definition.id);
        return new TextAnnotationView(stage, definition, shape);
    }

    /**
     * Creates a new TextAnnotationView element
     * @param {StageView} parent 
     * @param {TextAnnotationDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent.case, parent, definition, shape);
        this.definition = definition;
    }

    get text() {
        return this.definition.text;
    }

    get wrapText() {
        return true;
    }

    createProperties() {
        return new TextAnnotationProperties(this);
    }

    get markup() {
        return `<g class="scalable">
                    <rect class="cmmn-shape cmmn-border cmmn-textannotation-shape" rx="5" ry="5" />
                </g>
                <text class="cmmn-text" />`;
    }

    get textAttributes() {
        return {
            'text': {
                ref: '.cmmn-shape',
                'ref-x': .5,
                'ref-y': .5,
                'y-alignment': 'middle',
                'x-alignment': 'middle'
            }
        };
    }

    get isTextAnnotation() {
        return true;
    }
}
