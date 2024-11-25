import CaseDefinition from "./case";
import Schema from "./schema";
import Tags from "./tags";

export default class Property {
    id: string;
    name: string;
    type: string;
    format: string;
    multiplicity: string;
    isBusinessIdentifier: string;
    objectSchema?: Schema;

    constructor(public schema: Schema, public element: Element) {
        this.id = element.getAttribute('id') || '';
        this.name = element.getAttribute('name') || '';
        this.type = element.getAttribute('type') || '';
        this.format = element.getAttribute('format') || '';
        this.multiplicity = element.getAttribute('multiplicity') || '';
        this.isBusinessIdentifier = element.getAttribute('isBusinessIdentifier') || '';

        if (this.hasTypeReference) {
            // Tell the definitions document to add this type reference.
            schema.type.definitionsDocument.loadReference(this.type);
            // Also get a pointer to the schema of the child type
            const childType = schema.type.definitionsDocument.types.find(type => type.fileName === this.type);
            this.objectSchema = childType ? childType.schema : undefined;
        }

        if (this.isObject) {
            // Then it has an inline schema element, that we create newly here.
            this.objectSchema = new Schema(this.schema.type, this.element);
        }
    }

    get definitionRef(): string {
        if (this.isObject) {
            // this.type === 'object', so let's use our path to create an identifier.
            return this.schema.type.fileName.replace('.type', '_type_') + this.name + '.object';
        } else if (this.isChild) {
            return this.type;
        }
        return '';
    }

    get hasTypeReference(): boolean {
        return this.type.endsWith('.type');
    }

    get isObject(): boolean {
        return this.type === 'object';
    }

    get isChild(): boolean {
        return this.isObject || this.hasTypeReference;
    }

    get isProperty(): boolean {
        return !this.objectSchema;
    }

    get CMMNType(): string {
        const cmmnType =
            this.type === 'number'
                ? 'float'
                : this.format
                    ? this.format === 'uri'
                        ? 'anyURI'
                        : this.format === 'date-time'
                            ? 'dateTime'
                            : this.format
                    : this.type;
        return `http://www.omg.org/spec/CMMN/PropertyType/${cmmnType}`;
    }

    appendToCFID(parent: Element) {
        // Only append if this is a plain "primitive" property.
        if (this.isProperty) {
            const propertyElement = parent.ownerDocument.createElement(Tags.PROPERTY);
            propertyElement.setAttribute('name', this.name);
            propertyElement.setAttribute('type', this.CMMNType);
            if (this.isBusinessIdentifier) {
                const extensionNode = propertyElement.ownerDocument.createElement('extensionElements');
                extensionNode.setAttribute('mustUnderstand', 'false');
                propertyElement.appendChild(extensionNode);
                const implementationNode = propertyElement.ownerDocument.createElement('cafienne:implementation');
                implementationNode.setAttribute('xmlns:cafienne', 'org.cafienne')
                implementationNode.setAttribute('isBusinessIdentifier', this.isBusinessIdentifier);
                extensionNode.appendChild(implementationNode);
            }
            parent.appendChild(propertyElement);
        }
    }

    convertToCaseFileItem(caseDefinition: CaseDefinition, parent: Element, parentCFIPath: string) {
        if (this.isProperty) {
            // This is a plain property, nothing to be done with it, as that is defined in the CFID
            return;
        }

        // Create a CFI element for this property
        const cfi = parent.ownerDocument.createElement(Tags.CASE_FILE_ITEM);
        const cfiPath = this.createUniqueCFIPath(caseDefinition, parentCFIPath);
        cfi.setAttribute('id', cfiPath);
        cfi.setAttribute('name', this.name);
        cfi.setAttribute('multiplicity', this.multiplicity);
        cfi.setAttribute('definitionRef', this.definitionRef);
        parent.appendChild(cfi);
        if (this.objectSchema && this.objectSchema.properties.filter(p => p.objectSchema).length > 0) {
            const children = parent.ownerDocument.createElement(Tags.CHILDREN);
            cfi.appendChild(children);
            // Now iterate our child items and convert the into case file items as well, using our identifier as the new path
            this.objectSchema.convertToCaseFileItems(caseDefinition, children, cfiPath);
        }
    }

    createUniqueCFIPath(caseDefinition: CaseDefinition, parentCFIPath: string): string {
        // First generate the default new identifier: either directly the property name, or as an extension to the existing path with a slash.
        const pathPrefix = parentCFIPath ? parentCFIPath + '/' : '';
        const cfiPath = pathPrefix + this.name;

        if (caseDefinition.definitionsDocument.rootCaseName == caseDefinition.caseName) {
            // No need to change the cfi paths inside the root case, we do that only in subcases.
            return cfiPath;
        } else {
            // First determine whether the path is already pmaarrefixed with the sub case, 
            const subcasePrefix = caseDefinition.caseName + '/';
            // Check whether the prefix holds the subcase name or not. If not, add it.
            const newCFIPath = (!pathPrefix.startsWith(subcasePrefix) ? subcasePrefix + pathPrefix : pathPrefix) + this.name;
            // We're adding the prefix, but in the case definition we're still referring to the path without the prefix. 
            //  Ask the case to update the paths.
            const pathUsedInCaseDefinition = newCFIPath.substring(subcasePrefix.length);
            caseDefinition.updateCaseFileItemReferences(pathUsedInCaseDefinition, newCFIPath);
            return newCFIPath;
        }
    }
}
