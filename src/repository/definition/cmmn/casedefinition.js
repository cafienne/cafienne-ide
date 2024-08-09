import CaseFile from "@repository/serverfile/casefile";
import TextAnnotationDefinition from "../artifact/textannotation";
import CMMNElementDefinition from "../cmmnelementdefinition";
import Dimensions from "../dimensions/dimensions";
import ModelDefinition from "../modeldefinition";
import CaseFileDefinition from "./casefile/casefiledefinition";
import CasePlanDefinition from "./caseplan/caseplandefinition";
import CaseTeamDefinition from "./caseteam/caseteamdefinition";
import CaseParameterDefinition from "./contract/caseparameterdefinition";
import Migrator from "./migrator";
import StartCaseSchemaDefinition from "./startcaseschemadefinition";

export default class CaseDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {CaseFile} file
     */
    constructor(file) {
        super(file);
        this.file = file;
    }

    parseDocument() {
        // First run migrations if necessary.
        Migrator.updateXMLElement(this);
        super.parseDocument();
        /** @type {CaseFileDefinition} */
        this.caseFile = this.parseElement('caseFileModel', CaseFileDefinition);
        /** @type {CasePlanDefinition} */
        this.casePlan = this.parseElement('casePlanModel', CasePlanDefinition)
        /** @type {CaseTeamDefinition} */
        this.caseTeam = this.parseElement('caseRoles', CaseTeamDefinition);
        /** @type {Array<CaseParameterDefinition>} */
        this.input = this.parseElements('input', CaseParameterDefinition);
        /** @type {Array<CaseParameterDefinition>} */
        this.output = this.parseElements('output', CaseParameterDefinition);
        this.annotations = this.parseElements('textAnnotation', TextAnnotationDefinition);
        this.startCaseSchema = this.parseExtension(StartCaseSchemaDefinition);
        this.defaultExpressionLanguage = this.parseAttribute('expressionLanguage', 'spel');
    }

    hasExternalReferences() {
        return true;
    }

    loadExternalReferences(callback) {
        this.resolveExternalDefinition(this.file.name + ".dimensions", definition => {
            this.dimensions = /** @type {Dimensions} */ (definition);
            callback();
        });
    }

    validateDocument() {
        this.elements.forEach(element => element.resolveReferences());
    }

    /**
     * Returns the element that has the specified identifier, or undefined.
     * If the constructor argument is specified, the element is checked against the constructor with 'instanceof'
     * @param {String} id 
     * @param {Function} constructor
     * @returns {CMMNElementDefinition}
     */
    getElement(id, constructor = undefined) {
        // Override, just to have a generic type cast
        return super.getElement(id, constructor);
    }

    get inputParameters() {
        return this.input;
    }

    get outputParameters() {
        return this.output;
    }

    /**
     * Returns the case plan of this case definition (and creates one with
     * the specified position if it does not exist)
     * @returns {CasePlanDefinition}
     */
    getCasePlan() {
        if (!this.casePlan) {
            this.casePlan = super.createDefinition(CasePlanDefinition);
        }
        return this.casePlan;
    }

    /**
     * Returns the case file of this case definition (and creates it if it does not exist)
     * @returns {CaseFileDefinition}
     */
    getCaseFile() {
        if (!this.caseFile) {
            this.caseFile = super.createDefinition(CaseFileDefinition);
            this.caseFile.id = undefined;
            this.caseFile.name = undefined;
        }
        return this.caseFile;
    }

    parseStartCaseSchema() {
        const startCaseNode = this.parseExtension(StartCaseSchemaDefinition);
        return startCaseNode ? startCaseNode.value : '';
    }

    /**
     * Create a text annotation that can be child to this stage
     * @param {String} id 
     */
    createTextAnnotation(id = undefined) {
        const annotation = super.createDefinition(TextAnnotationDefinition, id);
        this.annotations.push(annotation);
        return annotation;
    }

    /**
     * Return all plan items in this stage and its children, including all discretionaries.
     * @returns {Array<PlanItem>}
     */
    getAllPlanItems() {
        return this.getCasePlan().getAllPlanItems();
    }

    toXML() {
        const xmlDocument = super.exportModel('case', 'caseFile', 'casePlan', 'caseTeam', 'input', 'output', 'annotations', 'startCaseSchema');

        if (this.defaultExpressionLanguage) this.exportNode.setAttribute('expressionLanguage', this.defaultExpressionLanguage);

        // Also export the guid that is used to generate new elements in the case. This must be removed upon deployment.
        this.exportNode.setAttribute('guid', this.typeCounters.guid);
        return xmlDocument;
    }
}
