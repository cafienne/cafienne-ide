import CaseFile from "@repository/serverfile/casefile";
import TextAnnotationDefinition from "../artifact/textannotation";
import CMMNElementDefinition from "../cmmnelementdefinition";
import Dimensions from "../dimensions/dimensions";
import Migrator from "../migration/cmmn/migrator";
import ModelDefinition from "../modeldefinition";
import CaseFileDefinition from "./casefile/casefiledefinition";
import CasePlanDefinition from "./caseplan/caseplandefinition";
import CaseTeamDefinition from "./caseteam/caseteamdefinition";
import CaseParameterDefinition from "./contract/caseparameterdefinition";
import StartCaseSchemaDefinition from "./startcaseschemadefinition";
import PlanItem from "./caseplan/planitem";

export default class CaseDefinition extends ModelDefinition {
    private _caseFile?: CaseFileDefinition;
    private _casePlan?: CasePlanDefinition;
    private _caseTeam?: CaseTeamDefinition;
    input: CaseParameterDefinition[];
    output: CaseParameterDefinition[];
    annotations: TextAnnotationDefinition[];
    startCaseSchema: StartCaseSchemaDefinition;
    defaultExpressionLanguage: string;
    dimensions?: Dimensions;
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {CaseFile} file
     */
    constructor(public file: CaseFile) {
        super(file);
        // First run migrations if necessary.
        Migrator.updateXMLElement(this);
        this._caseFile = this.parseElement('caseFileModel', CaseFileDefinition);
        /** @type {CasePlanDefinition} */
        this._casePlan = this.parseElement('casePlanModel', CasePlanDefinition)
        /** @type {CaseTeamDefinition} */
        this._caseTeam = this.parseElement('caseRoles', CaseTeamDefinition);
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

    loadExternalReferences(callback: () => void) {
        this.resolveExternalDefinition(this.file.name + ".dimensions", definition => {
            this.dimensions = <Dimensions> definition;
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
    getElement<T extends CMMNElementDefinition>(id: string, constructor?: Function): T {
        // Override, just to have a generic type cast
        return <T> super.getElement(id, constructor);
    }

    get inputParameters() {
        return this.input;
    }

    get outputParameters() {
        return this.output;
    }

    hasCasePlan() {
        return this._casePlan !== undefined;
    }

    /**
     * Returns the case plan of this case definition (and creates one with if it does not exist)
     */
    get casePlan() {
        if (!this._casePlan) {
            this._casePlan = super.createDefinition(CasePlanDefinition);
        }
        return this._casePlan;
    }

    /**
     * Returns the case file of this case definition (and creates it if it does not exist)
     */
    get caseFile() {
        if (!this._caseFile) {
            this._caseFile = super.createDefinition(CaseFileDefinition);
            this._caseFile.id = '';
            this._caseFile.name = '';
        }
        return this._caseFile;
    }

    /**
     * Returns the case team of this case definition (and creates it if it does not exist)
     */
    get caseTeam() {
        if (!this._caseTeam) {
            this._caseTeam = super.createDefinition(CaseTeamDefinition);
            this._caseTeam.id = '';
            this._caseTeam.name = '';
        }
        return this._caseTeam;
    }

    /**
     * Create a text annotation that can be child to this stage
     * @param {String} id 
     */
    createTextAnnotation(id = undefined) {
        const annotation: TextAnnotationDefinition = super.createDefinition(TextAnnotationDefinition, id);
        this.annotations.push(annotation);
        return annotation;
    }

    /**
     * Return all plan items in this stage and its children, including all discretionaries.
     */
    getAllPlanItems(): PlanItem[] {
        return this.casePlan.getAllPlanItems();
    }

    toXML() {
        const xmlDocument = super.exportModel('case', '_caseFile', '_casePlan', 'caseTeam', 'input', 'output', 'annotations', 'startCaseSchema');

        if (this.defaultExpressionLanguage) this.exportNode.setAttribute('expressionLanguage', this.defaultExpressionLanguage);

        // Also export the guid that is used to generate new elements in the case. This must be removed upon deployment.
        this.exportNode.setAttribute('guid', this.typeCounters.guid);
        return xmlDocument;
    }
}
