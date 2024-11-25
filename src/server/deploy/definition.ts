import Store from "../store/store";
import { XML } from "../util/xml";
import Definitions from "./definitions";

export default class Definition {
    content: string;
    element: Element;
    store: Store;

    /**
     * Create a basic wrapper around a file.
     */
    constructor(public fileName: string, public definitionsDocument: Definitions) {
        definitionsDocument.addDefinition(this);
        this.store = definitionsDocument.store;
        this.content = this.store.load(fileName);
        this.element = XML.loadXMLElement(this.content);
    }

    /* returns all external references in this case of a certain type
    - elementName   : search for elements with this name
    - referenceAttributeName  : name of xml attribute that holds the reference
    */
    findReferences(elementName: string, referenceAttributeName: string): Array<string> {
        return XML.findElementsWithTag(this.element, elementName).map((element: Element) => element.getAttribute(referenceAttributeName)).filter((s: string|null) => s && s !== '') as Array<string>;
    }

    append() {
        this.element.setAttribute('id', this.fileName);
        this.definitionsDocument.definitionsElement.appendChild(this.element);
    }
}