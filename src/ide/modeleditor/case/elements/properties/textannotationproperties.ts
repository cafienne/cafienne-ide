import CaseDefinition from "../../../../../repository/definition/cmmn/casedefinition";
import Properties from "../../../../editors/modelcanvas/properties";
import TextAnnotationView from "../textannotationview";

export default class TextAnnotationProperties extends Properties<CaseDefinition, TextAnnotationView> {
    constructor(textAnnotation: TextAnnotationView) {
        super(textAnnotation);
    }

    renderData() {
        this.addTextField('Text', 'text');
        this.addIdField();
    }
}
