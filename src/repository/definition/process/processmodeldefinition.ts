import ProcessFile from "@repository/serverfile/processfile";
import ParameterDefinition from "../contract/parameterdefinition";
import ModelDefinition from "../modeldefinition";
import ProcessImplementationDefinition from "./processimplementationdefinition";
import ValidationContext from "@repository/validate/validation";

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
        return xmlDocument;
    }

    validate(validationContext: ValidationContext) {
        super.validate(validationContext);

        // TODO: implement validation for input/output parameters
        // TODO: implement validation for implementation XML, e.g. mapping to output parameters
        //          based on the classname a fixed set of source parameters can be defined
    }
}
