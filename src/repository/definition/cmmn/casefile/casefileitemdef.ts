import Util from "../../../../util/util";
import XML, { Element } from "../../../../util/xml";
import CaseFileDefinitionDefinition from "../../cfid/casefileitemdefinitiondefinition";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import ExternalReference from "../../references/externalreference";
import CaseDefinition from "../casedefinition";

export class CaseFileItemCollection extends CMMNElementDefinition {
    _children: CaseFileItemDef[];
    /**
     * Helper class to share logic across CaseFile and CaseFileItem (mostly the 'children' array)
     */
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        this._children = /** @type {Array<CaseFileItemDef>} */ ([]);
    }

    /**
     * Creates a new CaseFileItemDef child.
     */
    createChildDefinition(): CaseFileItemDef {
        const newCaseFileItem: CaseFileItemDef = this.createDefinition(CaseFileItemDef);
        this.children.push(newCaseFileItem);
        newCaseFileItem.name = '';
        newCaseFileItem.multiplicity = 'ExactlyOne';
        return newCaseFileItem;
    }

    insert(child: CaseFileItemDef, after?: CaseFileItemDef) {
        Util.insertInArray(this.children, child, after);
    }

    /**
     * Returns the case file item children of this element.
     */
    get children(): CaseFileItemDef[] {
        return this._children;
    }
}

export default class CaseFileItemDef extends CaseFileItemCollection {
    defaultTransition: string;
    multiplicity: string;
    _definitionRef: ExternalReference<CaseFileDefinitionDefinition>;
    isEmpty = false;
    /**
     * @returns List of the possible events/transitions on a case file item
     */
    static get transitions() {
        return ['', 'addChild', 'addReference', 'create', 'delete', 'removeChild', 'removeReference', 'replace', 'update'];
    }

    static get prefix() {
        return 'cfi';
    }

    static createEmptyDefinition(caseDefinition: CaseDefinition, id: string = '') {
        const definition: CaseFileItemDef = caseDefinition.createDefinition(CaseFileItemDef, undefined, id, '');
        definition.isEmpty = true;
        return definition;
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        this.defaultTransition = 'create';
        this.multiplicity = this.parseAttribute('multiplicity', 'Unspecified');
        this._definitionRef = this.parseReference('definitionRef');
        this.parseGrandChildren('caseFileItem', CaseFileItemDef, this.children);
    }

    get definitionRef(): string {
        return this._definitionRef.fileName;
    }

    set definitionRef(newReference: string) {
        this._definitionRef.update(newReference);
    }

    get isArray() {
        return this.multiplicity.endsWith('OrMore');
    }

    /**
     * Returns all descending case file items including this one, recursively.
     * @returns {Array[CaseFileItemDef]}
     */
    getDescendants() {
        const descendants: CaseFileItemDef[] = [this];
        this.children.forEach(child => child.getDescendants().forEach(c => descendants.push(c)));
        return descendants;
    }

    parseGrandChildren(childName: string, constructor: Function, collection: CaseFileItemDef[]) {
        const child = XML.getChildByTagName(this.importNode, 'children');
        if (child) {
            XML.getChildrenByTagName(child, childName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        }
        return collection;
    }

    createExportNode(parentNode: Element) {
        if (this.isEmpty) return;

        super.createExportNode(parentNode, 'caseFileItem', 'multiplicity', 'definitionRef');
        if (this.children.length > 0) {
            const childrenNode = XML.createChildElement(this.exportNode, 'children');
            this.children.forEach(child => child.createExportNode(childrenNode));
        }
    }
}
