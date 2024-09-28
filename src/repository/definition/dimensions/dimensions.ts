import DimensionsFile from "../../serverfile/dimensionsfile";
import ModelDefinition from "../modeldefinition";
import Diagram from "./diagram";
import Tags from "./tags";

export default class Dimensions extends ModelDefinition {
    errors: string[] = [];
    private _diagram?: Diagram;
    /**
     * Parses the content of the XML document into dimension structures that can be accessed via this class.
     * @param {DimensionsFile} file
     */
    constructor(public file: DimensionsFile) {
        super(file);
        this._diagram = this.parseElement(Tags.CMMNDIAGRAM, Diagram);
    }

    get diagram(): Diagram {
        if (! this._diagram) {
            this._diagram = this.createDefinition(Diagram);
        }
        return this._diagram;
    }

    createShape(x: number, y: number, width: number, height: number, cmmnElementRef: string) {
        return this.diagram.createShape(x, y, width, height, cmmnElementRef);
    }

    /**
     * While parsing the XML, an error may occur. This is stored in the overall list of parse errors.
     * @param {String} msg 
     */
    addParseError(msg: string) {
        this.errors.push(msg);
    }

    /**
     * While parsing the XML, we may encounter valid but incomplete content, for which a warning will be generated.
     * @param {String} msg 
     */
    addParseWarning(msg: string) {
        this.errors.push(msg);
    }

    toXML() {
        return super.exportModel(Tags.CMMNDI, 'diagram');
    }
}
