import ProcessFile from "@repository/serverfile/processfile";
import XML from "@util/xml";
import ParameterDefinition from "../contract/parameterdefinition";
import ModelDefinition from "../modeldefinition";
import { CAFIENNE_NAMESPACE, IMPLEMENTATION_TAG } from "../xmlserializable";
import ProcessImplementationDefinition from "./processimplementationdefinition";

export default class ProcessModelDefinition extends ModelDefinition {
    input: ParameterDefinition<ProcessModelDefinition>[] = [];
    output: ParameterDefinition<ProcessModelDefinition>[] = [];
    implementation?: ProcessImplementationDefinition;
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     */
    constructor(public file: ProcessFile) {
        super(file);
        /** @type {Array<ParameterDefinition>} */
        this.input = this.parseElements('input', ParameterDefinition);
        /** @type {Array<ParameterDefinition>} */
        this.output = this.parseElements('output', ParameterDefinition);
        this.implementation = this.parseImplementation(ProcessImplementationDefinition);
    }

    get inputParameters() {
        return this.input;
    }

    get outputParameters() {
        return this.output;
    }

    toXML() {
        const xmlDocument = super.exportModel('process', 'input', 'output', 'implementation');
        this.exportNode.setAttribute('implementationType', 'http://www.omg.org/spec/CMMN/ProcessType/Unspecified');

        // Remove the empty namespace attribute from children of the implementation tag and put them in the namespace of the parent
        const implementationExportElement = XML.getElement(xmlDocument, IMPLEMENTATION_TAG);
        if (implementationExportElement) {
            implementationExportElement.setAttribute('xmlns', CAFIENNE_NAMESPACE);
            const children = XML.getChildrenByTagName(implementationExportElement, '*').filter(element => element.namespaceURI === null);
            children.forEach(element => {
                const clone: Element = <Element> XML.cloneWithoutNamespace(element, true, CAFIENNE_NAMESPACE);
                element.parentNode?.insertBefore(clone, element);
                element.parentNode?.removeChild(element);
                clone.removeAttribute("xmlns");
            })
        }
        return xmlDocument;
    }
}
