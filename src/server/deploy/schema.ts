import { XML } from "../util/xml";
import CaseDefinition from "./case";
import Property from "./property";
import Tags from "./tags";
import TypeDefinition from "./typedefinition";

export default class Schema {
    id: string;
    name: string;
    properties: Array<Property>;
    element: Element;

    constructor(public type: TypeDefinition, public parent: Element) {
        const schemaElement = XML.findElement(parent, 'schema');
        if (!schemaElement) {
            // throw an error or so
            throw new Error('Type is missing a schema element');
        }
        this.element = schemaElement;
        this.id = parent.getAttribute('id') || '';
        this.name = parent.getAttribute('name') || '';
        this.properties = XML.findChildrenWithTag(this.element, 'property').map(property => new Property(this, property));
    }

    createCFID(id: string = this.id) {
        // All inline properties of type 'object' need an independent CFID
        this.properties.filter(p => p.isObject && p.objectSchema).forEach(inlineObject => inlineObject.objectSchema?.createCFID(inlineObject.definitionRef));

        if (this.properties.filter(p => p.isProperty).length === 0) {
            // If there are no primitive properties, then the CFID element need not be generated.
            // return;
        }
        const parent = this.type.definitionsDocument.definitionsElement;
        const cfidElement = parent.ownerDocument.createElement(Tags.CASE_FILE_ITEM_DEFINITION);
        cfidElement.setAttribute('name', this.name);
        cfidElement.setAttribute('definitionType', 'http://www.omg.org/spec/CMMN/DefinitionType/Unspecified');
        cfidElement.setAttribute('id', id);
        parent.appendChild(cfidElement);

        this.properties.forEach(property => property.appendToCFID(cfidElement));
    }

    convertToCaseFileItems(caseDefinition: CaseDefinition, parent: Element, path: string = '') {
        this.properties.forEach(property => property.convertToCaseFileItem(caseDefinition, parent, path));
    }
}
