import TypeDefinition from "@repository/definition/type/typedefinition";
import XML from "@util/xml";
import CaseDeployment from "./casedeployment";
import DefinitionDeployment from "./definitiondeployment";
import Definitions from "./definitions";
import Tags from "./tags";

export default class TypeDeployment extends DefinitionDeployment {
    schema: Schema;
    casesUsingThisType: Array<CaseDeployment> = [];

    constructor(public definitionsDocument: Definitions, public definition: TypeDefinition) {
        super(definitionsDocument, definition);
        
        this.schema = new Schema(this, this.element);
    }

    fillCaseFile(caseDeployment: CaseDeployment) {
        this.casesUsingThisType.push(caseDeployment);
        caseDeployment.caseFileModel.setAttribute('cafienne:typeRef', this.fileName);
        caseDeployment.caseFileModel.removeAttribute('typeRef');
        this.schema.convertToCaseFileItems(caseDeployment, caseDeployment.caseFileModel);
    }

    append() {
        this.schema.createCFID();
    }
}

class Schema {
    id: string;
    name: string;
    properties: Array<Property>;
    element: Element;

    constructor(public type: TypeDeployment, public parent: Element) {
        const schemaElement = XML.getElement(parent, 'schema');
        if (!schemaElement) {
            // throw an error or so
            throw new Error('Type is missing a schema element');
        }
        this.element = schemaElement;
        this.id = parent.getAttribute('id') || '';
        this.name = parent.getAttribute('name') || '';
        this.properties = XML.getChildrenByTagName(this.element, 'property').map(property => new Property(this, property));
    }

    createCFID(id: string = this.id) {
        // All inline properties of type 'object' need an independent CFID
        this.properties.filter(p => p.isObject && p.objectSchema).forEach(inlineObject => inlineObject.objectSchema?.createCFID(inlineObject.definitionRef));

        if (this.properties.filter(p => p.isProperty).length === 0) {
            // If there are no primitive properties, then the CFID element need not be generated.
            // return;
        }
        const parent = this.type.definitionsDocument.definitionsElement;
        const cfidElement = XML.createChildElement(parent, Tags.CASE_FILE_ITEM_DEFINITION);
        cfidElement.setAttribute('name', this.name);
        cfidElement.setAttribute('definitionType', 'http://www.omg.org/spec/CMMN/DefinitionType/Unspecified');
        cfidElement.setAttribute('id', id);

        this.properties.forEach(property => property.appendToCFID(cfidElement));
    }

    convertToCaseFileItems(caseDeployment: CaseDeployment, parent: Element, path: string = '') {
        this.properties.forEach(property => property.convertToCaseFileItem(caseDeployment, parent, path));
    }
}

class Property {
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
            // Also get a pointer to the schema of the child type
            const childType = schema.type.definitionsDocument.getDeploymentModel(this.type) as TypeDeployment;
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
            const propertyElement = XML.createChildElement(parent, Tags.PROPERTY);
            propertyElement.setAttribute('name', this.name);
            propertyElement.setAttribute('type', this.CMMNType);
            if (this.isBusinessIdentifier) {
                const extensionNode = XML.createChildElement(propertyElement, 'extensionElements');
                extensionNode.setAttribute('mustUnderstand', 'false');
                propertyElement.appendChild(extensionNode);
                const implementationNode = XML.createChildElement(propertyElement, 'cafienne:implementation');
                implementationNode.setAttribute('isBusinessIdentifier', this.isBusinessIdentifier);
                extensionNode.appendChild(implementationNode);
            }
            parent.appendChild(propertyElement);
        }
    }

    convertToCaseFileItem(caseDeployment: CaseDeployment, parent: Element, parentCFIPath: string) {
        if (this.isProperty) {
            // This is a plain property, nothing to be done with it, as that is defined in the CFID
            return;
        }

        // Create a CFI element for this property
        const cfi = XML.createChildElement(parent, Tags.CASE_FILE_ITEM);
        const cfiPath = this.createUniqueCFIPath(caseDeployment, parentCFIPath);
        cfi.setAttribute('id', cfiPath);
        cfi.setAttribute('name', this.name);
        cfi.setAttribute('multiplicity', this.multiplicity);
        cfi.setAttribute('definitionRef', this.definitionRef);
        parent.appendChild(cfi);
        if (this.objectSchema && this.objectSchema.properties.filter(p => p.objectSchema).length > 0) {
            const children = XML.createChildElement(cfi, Tags.CHILDREN);
            cfi.appendChild(children);
            // Now iterate our child items and convert the into case file items as well, using our identifier as the new path
            this.objectSchema.convertToCaseFileItems(caseDeployment, children, cfiPath);
        }
    }

    createUniqueCFIPath(caseDeployment: CaseDeployment, parentCFIPath: string): string {
        // First generate the default new identifier: either directly the property name, or as an extension to the existing path with a slash.
        const pathPrefix = parentCFIPath ? parentCFIPath + '/' : '';
        const cfiPath = pathPrefix + this.name;

        if (caseDeployment.definitionsDocument.rootCaseName == caseDeployment.caseName) {
            // No need to change the cfi paths inside the root case, we do that only in subcases.
            return cfiPath;
        } else {
            // First determine whether the path is already pmaarrefixed with the sub case, 
            const subcasePrefix = caseDeployment.caseName + '/';
            // Check whether the prefix holds the subcase name or not. If not, add it.
            const newCFIPath = (!pathPrefix.startsWith(subcasePrefix) ? subcasePrefix + pathPrefix : pathPrefix) + this.name;
            // We're adding the prefix, but in the case definition we're still referring to the path without the prefix. 
            //  Ask the case to update the paths.
            const pathUsedInCaseDefinition = newCFIPath.substring(subcasePrefix.length);
            caseDeployment.updateCaseFileItemReferences(pathUsedInCaseDefinition, newCFIPath);
            return newCFIPath;
        }
    }
}
