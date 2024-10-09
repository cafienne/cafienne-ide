import SchemaPropertyDefinition from "@repository/definition/type/schemapropertydefinition";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "./casefileitemdef";
import ElementDefinition from "@repository/definition/elementdefinition";
import ModelDefinition from "@repository/definition/modeldefinition";

export default class CaseFileItemTypeDefinition extends CaseFileItemDef {
    property: SchemaPropertyDefinition;
    /**
     * 
     * @param {CaseDefinition} parent 
     * @param {String} id
     */
    static createEmptyDefinition(parent: CaseDefinition, id = undefined) {
        const definition: CaseFileItemDef = parent.createDefinition(CaseFileItemDef, id, '');
        definition.isEmpty = true;
        return definition;
    }

    /**
     * 
     * @param {CaseDefinition} caseDefinition 
     * @param {*} parent 
     * @param {SchemaPropertyDefinition} propertyDefinition 
     */
    constructor(caseDefinition: CaseDefinition, parent: any, propertyDefinition: SchemaPropertyDefinition) {
        super(caseDefinition.importNode.ownerDocument.createElement('will-not-be-exported'), caseDefinition, parent);
        this.property = this.copyPropertyProperties(propertyDefinition);

        const childProperties: SchemaPropertyDefinition[] = this.property.schema ? this.property.schema.properties : this.property.subType ? this.property.subType?.schema?.properties || [] : [];
        childProperties.filter(p => p.isComplexType).forEach(child => this.children.push(new CaseFileItemTypeDefinition(this.caseDefinition, this, child)));

        this.isEmpty = false;
    }

    referencesElement<X extends ModelDefinition>(element: ElementDefinition<X>) {
        return element.id === this.property.id;
    }

    copyPropertyProperties(propertyDefinition: SchemaPropertyDefinition) {
        this.property = propertyDefinition;
        this.name = propertyDefinition.name;
        this.id = this.getPath();
        this.multiplicity = propertyDefinition.multiplicity;
        return this.property;
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
     */
    updatePaths(property: SchemaPropertyDefinition) {
        const oldId = this.id;
        const oldName = this.name;
        const references = this.searchInboundReferences().filter(ref => ref.modelDefinition.file.name === this.modelDefinition.file.name);
        this.copyPropertyProperties(property);
        const newId = this.id;
        const newName = this.name;
        // Now update references to this property
        console.log(this.modelDefinition.file.fileName + ": found " + references.length +" references to " + this.getPath() + "\n- " + references.map(ref => ref.modelDefinition.file.fileName +": " + ref.constructor.name +( ref.id ? "[id=" + ref.id +"|name="+ref.name +"]" : "")).join('\n- '));
        references.forEach(ref => ref.updateReferences(this, oldId, newId, oldName, newName));
    }

    /**
     * Returns all descending case file items including this one, recursively.
     */
    getDescendants() {
        const descendants: CaseFileItemDef[] = [this];
        this.children.forEach(child => child.getDescendants().forEach((c: CaseFileItemDef) => descendants.push(c)));
        return descendants;
    }

    createExportNode() {
        // We do not need to create any export XML, as the parent CaseFile will set a 'typeRef' attribute that includes us.
        return;
    }
}
