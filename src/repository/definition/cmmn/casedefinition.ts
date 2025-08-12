import CaseFile from "../../serverfile/casefile";
import Validator from "../../validate/validator";
import TextAnnotationDefinition from "../artifact/textannotation";
import CMMNElementDefinition from "../cmmnelementdefinition";
import GraphicalModelDefinition from "../graphicalmodeldefinition";
import Migrator from "../migration/cmmn/migrator";
import ParameterizedModelDefinition from "../parameterizedmodeldefinition";
import CaseFileDefinition from "./casefile/casefiledefinition";
import CasePlanDefinition from "./caseplan/caseplandefinition";
import PlanItem from "./caseplan/planitem";
import CaseTeamDefinition from "./caseteam/caseteamdefinition";
import CaseParameterDefinition from "./contract/caseparameterdefinition";
import StartCaseSchemaDefinition from "./startcaseschemadefinition";

export default class CaseDefinition extends GraphicalModelDefinition implements ParameterizedModelDefinition<CaseDefinition> {
    private _caseFile?: CaseFileDefinition;
    private _casePlan?: CasePlanDefinition;
    private _caseTeam?: CaseTeamDefinition;
    input: CaseParameterDefinition[];
    output: CaseParameterDefinition[];
    annotations: TextAnnotationDefinition[];
    startCaseSchema: StartCaseSchemaDefinition;
    defaultExpressionLanguage: string;

    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     */
    constructor(public file: CaseFile) {
        super(file, file.name + '.dimensions');
        // First run migrations if necessary.
        Migrator.updateXMLElement(this);
        this._caseFile = this.parseElement('caseFileModel', CaseFileDefinition);
        this._casePlan = this.parseElement('casePlanModel', CasePlanDefinition)
        this._caseTeam = this.parseElement('caseRoles', CaseTeamDefinition);
        this.input = this.parseElements('input', CaseParameterDefinition);
        this.output = this.parseElements('output', CaseParameterDefinition);
        this.annotations = this.parseElements('textAnnotation', TextAnnotationDefinition);
        this.startCaseSchema = this.parseExtension(StartCaseSchemaDefinition);
        this.defaultExpressionLanguage = this.parseAttribute('expressionLanguage', 'spel');
    }

    /**
     * Returns the element that has the specified identifier, or undefined.
     * If the constructor argument is specified, the element is checked against the constructor with 'instanceof'
     */
    getElement<T extends CMMNElementDefinition>(id: string, constructor?: Function): T {
        // Override, just to have a generic type cast
        return <T>super.getElement(id, constructor);
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

    hasCasePlan() {
        return this._casePlan !== undefined;
    }

    validate(validator: Validator) {
        super.validate(validator);
        // TODO: Check input / output parameters
        validator.mustExist(this, this._caseFile, 'case file');
        validator.mustExist(this, this._casePlan, 'case plan');
    }

    /**
     * Returns the case plan of this case definition (and creates one with if it does not exist)
     */
    get casePlan() {
        if (!this._casePlan) {
            this._casePlan = super.createDefinition(CasePlanDefinition);
            this._casePlan.name = this.name;
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
     */
    createTextAnnotation(id?: string) {
        const annotation: TextAnnotationDefinition = super.createDefinition(TextAnnotationDefinition, undefined, id);
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
