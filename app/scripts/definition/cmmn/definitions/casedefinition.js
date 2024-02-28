const STARTCASEMODEL_TAG = 'cafienne:start-case-model';

class CaseDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {Element} importNode
     */
    constructor(importNode) {
        super(importNode);
    }

    parseDocument() {
        super.parseDocument();
        this.caseFile = this.parseElement('caseFileModel', CaseFileDefinition);
        this.casePlan = this.parseElement('casePlanModel', CasePlanDefinition);
        this.caseTeam = this.parseCaseTeam();
        this.input = this.parseElements('input', ParameterDefinition);
        this.output = this.parseElements('output', ParameterDefinition);
        this.annotations = this.parseElements('textAnnotation', TextAnnotationDefinition);
        this.startCaseSchema = this.parseExtension(StartCaseSchemaDefinition);
        this.defaultExpressionLanguage = this.parseAttribute('expressionLanguage', 'spel');
    }

    validateDocument() {
        this.elements.forEach(element => element.resolveReferences());
    }

    parseCaseTeam() {
        const rolesElements = XML.getChildrenByTagName(this.importNode, 'caseRoles');
        if (rolesElements.length == 0 || rolesElements.length > 1) { 
            // CMMN 1.0 format, we must migrate. Also, if roles.length == 0, then we should create an element to avoid nullpointers.
            //  Note: if there is only 1 caseRoles tag it can be both CMMN1.0 or CMMN1.1;
            //  CaseTeamDefinition class will do the check if additional migration is required.
            if (rolesElements.length) {
                this.migrated(`Converting ${rolesElements.length} CMMN1.0 roles`);
            }
            // Create a new element
            const caseTeamElement = XML.parseXML('<caseRoles />').documentElement;
            rolesElements.forEach(role => {
                role.parentElement.removeChild(role);
                caseTeamElement.appendChild(CaseTeamDefinition.convertRoleDefinition(role))
            });
            this.importNode.appendChild(caseTeamElement);
        }
        return this.parseElement('caseRoles', CaseTeamDefinition);
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

class StartCaseSchemaDefinition extends CMMNExtensionDefinition {
    /**
    * @param {Element} importNode 
    * @param {CaseDefinition} caseDefinition
    * @param {CMMNElementDefinition} parent optional
    */
    constructor(importNode, caseDefinition, parent = undefined) {
        super(importNode, caseDefinition, parent);
        this.value = importNode ? importNode.textContent : '';
    }

    get value() {
        return this._value;
    }

    /**
     * @param {String} value
     */
    set value(value) {
        this._value = value;
    }

    createExportNode(parentNode) {
        if (this.value.trim()) {
        // Now dump start case schema if there is one. Should we also do ampersand replacements??? Not sure. Perhaps that belongs in business logic??
        // const startCaseSchemaValue = this.case.startCaseEditor.value.replace(/&/g, '&amp;');
            super.createExportNode(parentNode, StartCaseSchemaDefinition.TAG)
            this.exportNode.textContent = this.value;
        }
    }
}

StartCaseSchemaDefinition.TAG = STARTCASEMODEL_TAG;
