import ProcessFile from "../../serverfile/processfile";
import ParameterDefinition from "../contract/parameterdefinition";
import ModelDefinition from "../modeldefinition";
import ParameterizedModelDefinition from "../parameterizedmodeldefinition";
import ProcessImplementationDefinition from "./processimplementationdefinition";

export default class ProcessModelDefinition extends ModelDefinition implements ParameterizedModelDefinition<ProcessModelDefinition> {
    input: ParameterDefinition<this>[] = [];
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

    findInputParameter(identifier: string) {
        return this.inputParameters.find(p => p.hasIdentifier(identifier));
    }

    findOutputParameter(identifier: string) {
        return this.outputParameters.find(p => p.hasIdentifier(identifier));
    }

    toXML() {
        const xmlDocument = super.exportModel('process', 'input', 'output', 'implementation');
        this.exportNode.setAttribute('implementationType', 'http://www.omg.org/spec/CMMN/ProcessType/Unspecified');
        return xmlDocument;
    }
}
