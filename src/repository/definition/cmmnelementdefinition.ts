import CaseDefinition from "./cmmn/casedefinition";
import DocumentableElementDefinition from "./documentableelementdefinition";
import Reference from "./references/reference";

export default class CMMNElementDefinition extends DocumentableElementDefinition<CaseDefinition> {
    /**
     * Creates a new, abstract CMMNElementDefinition object based on the given XML element 'importNode'.
     * Also parses 'id', 'name' and 'documentation' attributes, and adds the element to the case definition.
     * Note: importNode is supposed to be used [optional]. That is, it should be possible to create an element without
     * having an xml node as input to parse from. This means that constructors must be able to create elements
     * with sensible default settings.
     * ParentDefinition is mandatory (except for CaseDefinition); it is used to take the case definition from.
     * CaseDefinition and shape are optional parameters. CaseDefinition is taken from parentDefinition, and shape, if
     * not given, is looked up in the dimensions array of the casedefinition.
     */
    constructor(importNode: Element, public caseDefinition: CaseDefinition, parent?: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
    }

    change(field: string, value: string) {
        console.log("Changing field '" + field + "' in " + this + " into " + value);
        const element: any = this;
        if (element[field] instanceof Reference) {
            (element[field] as any).update(value);
        } else {
            element[field] = value;
        }
    }

    toString() {
        const name = this.name ? ` '${this.name}'` : '';
        return `${this.constructor.name}${name}`;
    }
}
