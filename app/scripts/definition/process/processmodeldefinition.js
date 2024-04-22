const HTTP_CALL_DEFINITION = 'HTTPCallDefinition';
const HTTP_CALL_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.http.HTTPCallDefinition';

const CALCULATION_DEFINITION = 'CalculationDefinition';
const CALCULATION_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.calculation.CalculationDefinition';

const MAIL_DEFINITION = 'MailDefinition';
const MAIL_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.mail.MailDefinition';

const PDF_REPORT_DEFINITION = 'PDFReportDefinition';
const PDF_REPORT_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.report.PDFReportDefinition';

const CUSTOM_IMPLEMENTATION_DEFINITION = ' ';
const CUSTOM_IMPLEMENTATION_DEFINITION_IMPLEMENTATION_CLASS = 'SPECIFY_IMPLEMENTATION_CLASS_HERE';

class ProcessModelDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {Element} importNode
     */
    constructor(importNode) {
        super(importNode);
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
