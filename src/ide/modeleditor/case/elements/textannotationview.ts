import TextAnnotationDefinition from "../../../../repository/definition/artifact/textannotation";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import CMMNElementView from "./cmmnelementview";
import Halo from "./halo/halo";
import TextAnnotationProperties from "./properties/textannotationproperties";
import StageView from "./stageview";

export default class TextAnnotationView extends CMMNElementView<TextAnnotationDefinition> {
    /**
     * Create a new TextAnnotationView at the given coordinates.
     */
    static create(stage: StageView, x: number, y: number): TextAnnotationView {
        const definition = stage.case.caseDefinition.createTextAnnotation();
        const shape = stage.case.diagram.createShape(x, y, 100, 60, definition.id);
        return new TextAnnotationView(stage, definition, shape);
    }

    /**
     * Creates a new TextAnnotationView element
     */
    constructor(public parent: StageView, definition: TextAnnotationDefinition, shape: ShapeDefinition) {
        super(parent.case, parent, definition, shape);
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

    createHalo() {
        return new Halo(this);
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
                'ref-x': 0.5,
                'ref-y': 0.5,
                'y-alignment': 'middle',
                'x-alignment': 'middle'
            }
        };
    }

    get isTextAnnotation() {
        return true;
    }
}
