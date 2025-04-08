import Validator from "../../../validate/validator";
import SchemaPropertyDefinition from "../../type/schemapropertydefinition";
import XMLSerializable from "../../xmlserializable";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "./casefileitemdef";

export default class CaseFileItemTypeDefinition extends CaseFileItemDef {
    property: SchemaPropertyDefinition;

    static createEmptyDefinition(parent: CaseDefinition, id = undefined) {
        const definition: CaseFileItemDef = parent.createDefinition(CaseFileItemDef, id, '');
        definition.isEmpty = true;
        return definition;
    }

    constructor(caseDefinition: CaseDefinition, parent: any, propertyDefinition: SchemaPropertyDefinition) {
        super(caseDefinition.createImportNode('will-not-be-exported'), caseDefinition, parent);
        this.property = this.copyPropertyProperties(propertyDefinition);

        const childProperties: SchemaPropertyDefinition[] = this.property.schema ? this.property.schema.properties : this.property.subType ? this.property.subType?.schema?.properties || [] : [];
        childProperties.forEach(child => this.addChild(child));

        this.isEmpty = false;
    }

    validate(validator: Validator) {
        // Override validator, because TypeDefinition will do the validation, and CaseFileItemDef only validates classic CaseFiles.
    }

    set name(value: string) {
        // Override setting the name, because we always take the name from the property we belong to
    }

    get name() {
        return this.property.name;
    }

    referencesElement(element: XMLSerializable) {
        return element.id === this.property.id;
    }

    copyPropertyProperties(propertyDefinition: SchemaPropertyDefinition) {
        this.property = propertyDefinition;
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
     * Invoked when the property gets a new name
     */
    updatePaths(property: SchemaPropertyDefinition, oldId: string = this.id, oldName: string = this.name) {
        // console.log("Updating property " + this.name + " in case " + this.caseDefinition.file.fileName)
        const references = this.searchInboundReferences().filter(ref => ref.modelDefinition.file.name === this.modelDefinition.file.name);
        this.copyPropertyProperties(property);
        const newId = this.id;
        const newName = this.name;
        // Now update references to this property
        if (references.length) {
            console.log(this.modelDefinition.file.fileName + ": found " + references.length + " references to " + this.getPath() + "\n- " + references.map(ref => ref.modelDefinition.file.fileName + ": " + ref.constructor.name + (ref.id ? "[id=" + ref.id + "|name=" + ref.name + "]" : "")).join('\n- '));
        } else {
            console.log(this.modelDefinition.file.fileName + ": no references to " + this.getPath() + " where found");
        }
        references.forEach(ref => ref.updateReferences(this, oldId, newId, oldName, newName));

        this.getDescendants().filter(descendent => descendent.parent === this).forEach(child => {
            const childProperty = property.schema?.properties.find(p => child.property.id === p.id);
            if (childProperty) {
                child.updatePaths(childProperty);
            } else {
                console.log(`Could not find property to update child '${this.name}' in '${this.getPath()}'`)
            }
        });
    }

    private childTypeIsRecursive(child: SchemaPropertyDefinition): boolean {
        // Check if we or one of our parents has the same type definition as the child property
        if (this.property.modelDefinition === child.subType) {
            return true;
        } else if (this.parent instanceof CaseFileItemTypeDefinition) {
            return this.parent.childTypeIsRecursive(child);
        } else {
            return false;
        }
    }

    addChild(child: SchemaPropertyDefinition) {
        if (this.childTypeIsRecursive(child)) {
            // Avoid recursive case file item generation
            // console.log(`Skip adding CaseFileItem child ${child.name} inside ${this.getPath()} as it has a recursive type`);
            return;
        }
        this.children.push(new CaseFileItemTypeDefinition(this.caseDefinition, this, child));
    }

    /**
     * Returns all descending case file items including this one, recursively.
     */
    getDescendants(): CaseFileItemTypeDefinition[] {
        const descendants: CaseFileItemTypeDefinition[] = [this];
        this.children.forEach(child => child.getDescendants().forEach((c: CaseFileItemDef) => c instanceof CaseFileItemTypeDefinition ? descendants.push(c) : {}));
        return descendants;
    }

    createExportNode() {
        // We do not need to create any export XML, as the parent CaseFile will set a 'typeRef' attribute that includes us.
        return;
    }
}
