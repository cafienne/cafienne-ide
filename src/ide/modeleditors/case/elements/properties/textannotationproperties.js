import TextAnnotationView from "../textannotationview";
import Properties from "./properties";

export default class TextAnnotationProperties extends Properties {
    /**
     * 
     * @param {TextAnnotationView} textAnnotation 
     */
    constructor(textAnnotation) {
        super(textAnnotation);
        this.cmmnElement = textAnnotation;
    }

    renderData() {
        this.addTextField('Text', 'text');
        this.addIdField();
    }
}