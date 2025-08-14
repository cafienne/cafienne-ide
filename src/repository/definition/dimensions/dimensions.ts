import DimensionsFile from "../../serverfile/dimensionsfile";
import ElementDefinition from "../elementdefinition";
import ModelDefinition from "../modeldefinition";
import Tags from "../tags";
import Diagram from "./diagram";

export default class Dimensions extends ModelDefinition {
    errors: string[] = [];
    private _diagram?: Diagram;
    /**
     * Parses the content of the XML document into dimension structures that can be accessed via this class.
     */
    constructor(public file: DimensionsFile) {
        super(file);
        this._diagram = this.parseElement(Tags.CMMNDIAGRAM, Diagram);
    }

    get diagram(): Diagram {
        if (!this._diagram) {
            this._diagram = this.createDefinition(Diagram);
        }
        return this._diagram;
    }

    /**
     * Create a Shape for the CMMNElement with the specified size and position.
     */
    createShape(x: number, y: number, width: number, height: number, cmmnElementRef: string) {
        return this.diagram.createShape(x, y, width, height, cmmnElementRef);
    }

    /**
     * Create a new Edge shape that binds the two CMMNElements.
     */
    createEdge(source: ElementDefinition, target: ElementDefinition) {
        return this.diagram.createEdge(source, target);
    }

    /**
     * While parsing the XML, an error may occur. This is stored in the overall list of parse errors.
     */
    addParseError(msg: string) {
        this.errors.push(msg);
    }

    /**
     * While parsing the XML, we may encounter valid but incomplete content, for which a warning will be generated.
     */
    addParseWarning(msg: string) {
        this.errors.push(msg);
    }

    toXML() {
        return super.exportModel(Tags.CMMNDI, 'diagram');
    }
}
