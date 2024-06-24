import Util from "@util/util";
import XML from "@util/xml";
import CaseDefinition from "../casedefinition";
import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";

export class CaseFileItemCollection extends CMMNElementDefinition {
    /**
     * Helper class to share logic across CaseFile and CaseFileItem (mostly the 'children' array)
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this._children = /** @type {Array<CaseFileItemDef>} */ ([]);
    }

    /**
     * Creates a new CaseFileItemDef child.
     * @returns {CaseFileItemDef}
     */
    createChildDefinition() {
        const newCaseFileItem = this.createDefinition(CaseFileItemDef);
        this.children.push(newCaseFileItem);
        newCaseFileItem.name = '';
        newCaseFileItem.multiplicity = 'ExactlyOne';
        newCaseFileItem.usedIn = '';
        newCaseFileItem.expanded = true;
        return newCaseFileItem;
    }

    /**
     * 
     * @param {CaseFileItemDef} child 
     * @param {CaseFileItemDef | undefined} after 
     */
    insert(child, after = undefined) {
        Util.insertInArray(this.children, child, after);
    }

    /**
     * Returns the case file item children of this element.
     * @returns {Array<CaseFileItemDef>}
     */
    get children() {
        return this._children;
    }
}

export default class CaseFileItemDef extends CaseFileItemCollection {
    /**
     * @returns {Array<String>} List of the possible events/transitions on a case file item
     */
    static get transitions() {
        return ['', 'addChild', 'addReference', 'create', 'delete', 'removeChild', 'removeReference', 'replace', 'update'];
    }

    static get prefix() {
        return 'cfi';
    }

    /**
     * 
     * @param {CaseDefinition} caseDefinition 
     * @param {String} id
     */
    static createEmptyDefinition(caseDefinition, id = undefined) {
        const definition = caseDefinition.createDefinition(CaseFileItemDef, id, '');
        definition.isEmpty = true;        
        return definition;
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.defaultTransition = 'create';
        this.multiplicity = this.parseAttribute('multiplicity', 'Unspecified');
        this.definitionRef = this.parseAttribute('definitionRef');
        this.parseGrandChildren('caseFileItem', CaseFileItemDef, this.children);
        this.isEmpty = false;
    }

    get isArray() {
        return this.multiplicity.endsWith('OrMore');
    }

    /**
     * Returns all descending case file items including this one, recursively.
     */
    getDescendants() {
        const descendants = [this];
        this.children.forEach(child => child.getDescendants().forEach(c => descendants.push(c)));
        return descendants;
    }

    parseGrandChildren(childName, constructor, collection) {
        const child = XML.getChildByTagName(this.importNode, 'children');
        if (child) {
            XML.getChildrenByTagName(child, childName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        }
        return collection;
    }

    createExportNode(parentNode) {
        if (this.isEmpty) return;

        super.createExportNode(parentNode, 'caseFileItem', 'multiplicity', 'definitionRef');
        if (this.children.length > 0) {
            const childrenNode = XML.createChildElement(this.exportNode, 'children');
            this.children.forEach(child => child.createExportNode(childrenNode));
        }
    }
}
