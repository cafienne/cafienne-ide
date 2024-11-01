import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import TypeDefinition from "@repository/definition/type/typedefinition";
import CaseFileItemDef, { CaseFileItemCollection } from "./casefileitemdef";
import CaseFileItemTypeDefinition from "./casefileitemtypedefinition";
import XMLSerializable from "@repository/definition/xmlserializable";
import SchemaPropertyDefinition from "@repository/definition/type/schemapropertydefinition";

export default class CaseFileDefinition extends CaseFileItemCollection {
    isOldStyle: boolean;
    typeRef: string;
    type?: TypeDefinition;
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        this.parseElements('caseFileItem', CaseFileItemDef, this.children);
        this.isOldStyle = this.children.length > 0; // If we have found the <caseFileItem> tag, then it is an old style model.
        this.typeRef = this.parseAttribute('typeRef');
    }

    referencesElement(element: XMLSerializable): boolean {
        return element.id === this.typeRef;
    }

    hasExternalReferences() {
        return this.typeRef !== '';
    }

    async loadExternalReferences() {
        return this.resolveExternalDefinition<TypeDefinition>(this.typeRef).then(definition => {
            if (definition) {
                this.type = definition;
                this.type.schema?.properties.forEach(property => this.addChild(property));
            }
        });
    }

    addChild(child: SchemaPropertyDefinition) {
        this.children.push(new CaseFileItemTypeDefinition(this.caseDefinition, this, child));
    }

    createExportNode(parentNode: Element) {
        // Only export children if typeRef is empty
        const propertiesToExport = ['typeRef', this.typeRef ? '' : 'children'];
        super.createExportNode(parentNode, 'caseFileModel', ...propertiesToExport);
    }

    /**
     * Returns all case file items in the case file, recursively.
     */
    getDescendants(): CaseFileItemDef[] {
        const descendants: CaseFileItemDef[] = [];
        this.children.forEach(child => child.getDescendants().forEach(c => descendants.push(c)));
        return descendants;
    }
}
