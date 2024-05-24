import ProcessFile from "../../serverfile/processfile";
import ParameterDefinition from "../cmmn/definitions/contract/parameterdefinition";
import ModelDefinition from "../modeldefinition";

export const HTTP_CALL_DEFINITION = 'HTTPCallDefinition';
export const HTTP_CALL_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.http.HTTPCallDefinition';

export const CALCULATION_DEFINITION = 'CalculationDefinition';
export const CALCULATION_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.calculation.CalculationDefinition';

export const MAIL_DEFINITION = 'MailDefinition';
export const MAIL_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.mail.MailDefinition';

export const PDF_REPORT_DEFINITION = 'PDFReportDefinition';
export const PDF_REPORT_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.report.PDFReportDefinition';

export const CUSTOM_IMPLEMENTATION_DEFINITION = ' ';
export const CUSTOM_IMPLEMENTATION_DEFINITION_IMPLEMENTATION_CLASS = 'SPECIFY_IMPLEMENTATION_CLASS_HERE';

export default class ProcessModelDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {ProcessFile} file
     */
    constructor(file) {
        super(file);
        this.file = file;
    }

    parseDocument() {
        super.parseDocument();
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
}
