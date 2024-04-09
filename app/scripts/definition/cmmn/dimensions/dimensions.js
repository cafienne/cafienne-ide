const DIMENSIONS = 'dimensions';
const CMMNDI = 'CMMNDI';
const CMMNDIAGRAM = 'CMMNDiagram';
const CMMNSHAPE = 'CMMNShape';
const CMMNEDGE = 'CMMNEdge';
const BOUNDS = 'Bounds';
const WAYPOINT = 'waypoint';
const CMMNELEMENTREF = 'cmmnElementRef';
const SOURCECMMNELEMENTREF = 'sourceCMMNElementRef';
const TARGETCMMNELEMENTREF = 'targetCMMNElementRef';

class Dimensions extends ModelDefinition {
    /**
     * Parses the content of the XML document into dimension structures that can be accessed via this class.
     * @param {DimensionsFile} file
     * @param {Element} importNode 
     */
    constructor(file, importNode = file.content.xml) {
        super(file, importNode);
        this.file = file;
        this.errors = [];
    }

    createShape(x, y, width, height, cmmnElementRef = undefined) {
        return this.diagram.createShape(x, y, width, height, cmmnElementRef);
    }

    parseDocument() {
        super.parseDocument();
        this.diagram = this.parseElement(CMMNDIAGRAM, Diagram);
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
        return super.exportModel(CMMNDI, 'diagram');
    }
}
