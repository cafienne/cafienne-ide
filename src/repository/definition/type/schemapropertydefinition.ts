import ReferableElementDefinition from "../referableelementdefinition";
import SchemaDefinition from "./schemadefinition";
import TypeDefinition from "./typedefinition";

export default class SchemaPropertyDefinition extends ReferableElementDefinition<TypeDefinition> {
    _type: string;
    format: string;
    multiplicity: string;
    isBusinessIdentifier: boolean;
    schema?: SchemaDefinition;
    subType?: TypeDefinition;

    constructor(importNode: Element, modelDefinition: TypeDefinition, public parent: SchemaDefinition) {
        super(importNode, modelDefinition, parent);
        this._type = this.parseAttribute('type', '');
        this.format = this.parseAttribute('format', '');
        this.multiplicity = this.parseAttribute('multiplicity', 'ExactlyOne');
        this.isBusinessIdentifier = this.parseBooleanAttribute('isBusinessIdentifier', false);
        if (this._type === 'object') {
            this.schema = this.parseElement(SchemaDefinition.TAG, SchemaDefinition);
        }
    }

    get isNew() {
        // A property is new if it has all default values
        return this.name === '' && this.type === '' && this.format === '' && this.multiplicity === 'ExactlyOne' && this.isBusinessIdentifier !== true;
    }

    hasExternalReferences(): boolean {
        return this.typeRef !== '';
    }

    async loadExternalReferences() {
        return this.resolveExternalDefinition<TypeDefinition>(this.typeRef).then(definition => { this.subType = definition });
    }

    static get prefix(): string {
        return 'sp';
    }

    get type(): string {
        return this._type;
    }

    set type(newType: string) {
        if (this._type !== newType) {
            this._type = newType;
            if (newType === 'object') {
                // An embedded complex type will have a schema
                this.schema = this.createDefinition(SchemaDefinition);
            } else {
                // A primitive type and a typeRef will not have a schema
                this.schema = undefined;
                this.subType = undefined;
                if (this.typeRef) {
                    this.loadExternalReferences();
                }
            }
        }
    }

    get typeRef(): string {
        return this.type.endsWith('.type') ? this.type : '';
    }

    get isPrimitiveType(): boolean {
        return !this.typeRef && this.type !== 'object';
    }

    get isComplexType(): boolean {
        return !this.isPrimitiveType;
    }

    createExportNode(parent: Element) {
        if (this.isNew) {
            // do not export a new empty property;
            return;
        }
        super.createExportNode(parent, 'property', 'type', SchemaDefinition.TAG, 'multiplicity');
        // console.log("createExportNode " + " type: " + this.type + " format: " + this.format + this.cmmnType + this.cmmnType );
        if (this.format) {
            this.exportNode.setAttribute('format', this.format);
        }
        if (this.isBusinessIdentifier) {
            this.exportNode.setAttribute('isBusinessIdentifier', 'true');
        }
    }

    toJSONSchema(properties: any, required: any, root: any) {
        const jsonProperty: any = {};
        properties[this.name] = jsonProperty;
        jsonProperty.$id = this.id;
        jsonProperty.title = this.name; // Default label is the name of the property
        const property: any = jsonProperty;
        if (this.type === 'object') {
            property.type = 'object';
            this.schema?.toJSONSchema(property, root);
        } else if (this.typeRef && this.subType) {
            const $id = this.subType.id.slice(0, this.subType.id.length - 5); // Strip ".type" from id
            const $ref = '#/definitions/' + $id;
            property.$ref = $ref;
            if (!root.definitions) {
                // Create the definitions in the root schema upon first typeRef
                // All (nested) external definitions will be bundled inline in definitions of the JSON schema of the root type
                root.definitions = {};
            }
            if (!root.definitions[$id]) {
                // Generate JSCHEMA for a definition once as it can have multiple references
                const definitionJSONSchema = {
                    $id: $id,
                    type: 'object'
                }
                root.definitions[$id] = definitionJSONSchema;
                this.subType?.schema?.toJSONSchema(definitionJSONSchema, root);
            }
        } else {
            property.type = this.type;
            if (this.format) {
                property.format = this.format;
            }
        }
        switch (this.multiplicity) {
            case 'ExactlyOne':
                // Required property
                required.push(this.name);
                break;
            case 'ZeroOrOne':
                // Optional property
                jsonProperty.minItems = 0;
                jsonProperty.maxItems = 1;
                break;
            case 'ZeroOrMore':
                // Array with optional items
                // Array items will have the type of the property
                this.setJSONArrayItemType(jsonProperty, 0);
                break;
            case 'OneOrMore':
                // Array with at least on required item
                required.push(this.name);
                // Array items will have the type of the property
                this.setJSONArrayItemType(jsonProperty, 1);
                break;
            case 'Unspecified':
                // Array with unspecified number of items
                // Array items will have the type of the property
                this.setJSONArrayItemType(jsonProperty);
                break;
            case 'Unknown':
                break;
        }
        return jsonProperty;
    }

    setJSONArrayItemType(property: any, minItems?: number, maxItems?: number): any {
        if (minItems) {
            property.minItems = minItems;
        }
        if (maxItems) {
            property.maxItems = maxItems;
        }
        const items: any = {};
        if (property.type == "object") {
            items.properties = property.properties;
            items.required = property.required;
            delete property.properties;
            delete property.required;
        }
        if (this.typeRef) {
            items.$ref = property.$ref;
            delete property.$ref;
        } else {
            items.type = property.type;
            delete property.type;
        }
        property.type = 'array';
        property.items = items;
        return property.items;
    }

    // This is the visual type in the TypeSelector
    get cmmnType(): string {
        switch (this.format) {
            // Types not yet implemented in IDE
            // case 'gYear':
            // case 'gYearMonth':
            // case 'gMonthDay':
            // case 'gDay':
            // case 'hexBinary':
            // case 'base64Binary':
            case 'uri':
            case 'time':
            case 'date':
            case 'date-time':
            case 'duration':
            case 'QName':
                return this.format;
                break;
            default:
                return this.type;
        }
    }

    // This is the visual type in the TypeSelector. That will be stored as (JSON-Schema compatible) type and format attributes 
    set cmmnType(value: string) {
        switch (value) {
            // Types not yet implemented in IDE
            // case 'gYear':
            // case 'gYearMonth':
            // case 'gMonthDay':
            // case 'gDay':
            // case 'hexBinary':
            // case 'base64Binary':
            case 'uri':
            case 'time':
            case 'date':
            case 'date-time':
            case 'duration':
            case 'QName':
                this.type = 'string';
                this.format = value;
                break;
            default:
                this.type = value;
                this.format = '';
        }
    }
}
