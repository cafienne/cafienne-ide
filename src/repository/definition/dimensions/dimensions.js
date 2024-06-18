import DimensionsFile from "../../serverfile/dimensionsfile";
import ModelDefinition from "../modeldefinition";
import Diagram from "./diagram";
import Tags from "./tags";

export default class Dimensions extends ModelDefinition {
    /**
     * Parses the content of the XML document into dimension structures that can be accessed via this class.
     * @param {DimensionsFile} file
     */
    constructor(file) {
        super(file);
        this.file = file;
        this.errors = [];
    }

    createShape(x, y, width, height, cmmnElementRef = undefined) {
        return this.diagram.createShape(x, y, width, height, cmmnElementRef);
    }

    parseDocument() {
        super.parseDocument();
        this.diagram = this.parseElement(Tags.CMMNDIAGRAM, Diagram);
    }
    
    /**
     * While parsing the XML, an error may occur. This is stored in the overall list of parse errors.
     * @param {String} msg 
     */
    addParseError(msg) {
        this.errors.push(msg);
    }

    /**
     * While parsing the XML, we may encounter valid but incomplete content, for which a warning will be generated.
     * @param {String} msg 
     */
    addParseWarning(msg) {
        this.errors.push(msg);
    }

    toXML() {
        return super.exportModel(Tags.CMMNDI, 'diagram');
    }
}
