import SchemaPropertyDefinition from "@repository/definition/type/schemapropertydefinition";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "./casefileitemdef";

export default class CaseFileItemTypeDefinition extends CaseFileItemDef {
    /**
     * 
     * @param {CaseDefinition} parent 
     * @param {String} id
     */
    static createEmptyDefinition(parent, id = undefined) {
        const definition = parent.createDefinition(CaseFileItemDef, id, '');
        definition.isEmpty = true;
        return definition;
    }

    /**
     * 
     * @param {CaseDefinition} caseDefinition 
     * @param {*} parent 
     * @param {SchemaPropertyDefinition} propertyDefinition 
     */
    constructor(caseDefinition, parent, propertyDefinition) {
        super(undefined, caseDefinition, parent);
        this.property = propertyDefinition;
        this.copyPropertyProperties();

        const childProperties = this.property.schema ? this.property.schema.properties : this.property.subType ? this.property.subType.schema.properties : [];
        childProperties.filter(p => p.isComplexType).forEach(child => this.children.push(new CaseFileItemTypeDefinition(this.caseDefinition, this, child)));

        this.isEmpty = false;
    }

    referencesElement(element) {
        return element === this.property;
    }

    copyPropertyProperties() {
        const propertyDefinition = this.property;
        this.name = propertyDefinition.name;
        this.id = this.getPath();
        this.multiplicity = propertyDefinition.multiplicity;
    }

    getPath() {
        const parentPaths = [];
        let ancestor = this.parent;
        while (ancestor && ancestor instanceof CaseFileItemTypeDefinition) {
            parentPaths.push(ancestor.property.name);
            ancestor = ancestor.parent;
        }
        const parent = parentPaths.filter(p => p !== '').reverse().join('/');
        return parent.length > 0 ? parent + '/' + this.property.name : this.property.name;
    }

    /**
     * Invoked when the property has a new name
     * @param {SchemaPropertyDefinition} property
     * @param {String} oldName
     * @param {String} newName
     */
    updatePaths(property, oldName, newName) {
        const oldId = this.id;
        const newId = this.getPath();
        if (oldId !== newId) { // Probably not necessary to check again, but nevertheless
            this.copyPropertyProperties();
            // Now update references to this property
            this.updateReferences(oldId, newId, oldName, newName);
        }
    }

    updateReferences(oldId, newId, oldName, newName) {
        this.caseDefinition.elements.forEach(element => {
            if (element instanceof ConstraintDefinition && element.contextRef === oldId) {
                element.contextRef = newId;
            } else if (element instanceof CaseFileItemOnPartDefinition && element.sourceRef === oldId) {
                element.sourceRef = newId;
            } else if (element instanceof ParameterDefinition && element.bindingRef === oldId) {
                element.bindingRef = newId;
                // Check if we also need to update the parameter name (assuming that a same name)
                if (element.name === oldName) {
                    element.name = newName;
                }
            }
        });

        this.caseDefinition.dimensions.elements.forEach(element => {
            if (element instanceof Edge && element.sourceId === oldId) {
                element.sourceId = newId;
            } else if (element instanceof Edge && element.targetId === oldId) {
                element.targetId = newId;
            } else if (element instanceof ShapeDefinition && element.cmmnElementRef === oldId) {
                element.cmmnElementRef = newId;
            }
        })
        /**
         Below source is from Cafienne Repository, printed here as reference
x        updateCaseReferences('repetitionRule', 'contextRef');
x        updateCaseReferences('requiredRule', 'contextRef');
x        updateCaseReferences('manualActivationRule', 'contextRef');
x        updateCaseReferences('applicabilityRule', 'contextRef');
x        updateCaseReferences('ifPart', 'contextRef');
x        updateCaseReferences('caseFileItemOnPart', 'sourceRef');
x        updateCaseReferences('input', 'bindingRef');
x        updateCaseReferences('output', 'bindingRef');
x        updateCaseReferences('inputs', 'bindingRef');
x        updateCaseReferences('outputs', 'bindingRef');
x        updateDiagramReferences('CMMNEdge', 'sourceCMMNElementRef');
x        updateDiagramReferences('CMMNEdge', 'targetCMMNElementRef');
x        updateDiagramReferences('CMMNShape', 'cmmnElementRef');
         */
    }

    /**
     * Returns all descending case file items including this one, recursively.
     */
    getDescendants() {
        const descendants = [this];
        this.children.forEach(child => child.getDescendants().forEach(c => descendants.push(c)));
        return descendants;
    }

    createExportNode() {
        return;
    }
}
