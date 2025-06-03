import TextAnnotationView from "../textannotationview";
import Properties from "./properties";

export default class TextAnnotationProperties extends Properties<TextAnnotationView> {
    constructor(textAnnotation: TextAnnotationView) {
        super(textAnnotation);
    }

    renderData() {
        this.addTextField('Text', 'text');
        this.addIdField();
    }
}