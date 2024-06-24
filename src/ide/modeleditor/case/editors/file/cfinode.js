import CaseFileItemCollection from "@definition/cmmn/casefile/casefileitemcollection";
import CaseFileItemDef from "@definition/cmmn/casefile/casefileitemdef";
import CaseFileItemsEditor, { NEWDEF } from "../casefileitemseditor";
import Util from "@util/util";

export default class CFINode {
    /**
     * 
     * @param {CaseFileItemsEditor} editor 
     * @param {CFINode} parentNode 
     * @param {JQuery<HTMLElement>} htmlParent 
     * @param {CaseFileItemDef} definition 
     */
    constructor(editor, parentNode, htmlParent, definition) {
        this.editor = editor;
        this.childNodes = /** @type {Array<CFINode>} */ ([]);
        this.parentNode = parentNode;
        if (this.parentNode) {
            this.parentNode.childNodes.push(this);
        }
        this.htmlParent = htmlParent;
        this.definition = definition;
        this.case = editor.case;

        this.editor.cfiNodes.push(this);
        this.html = $(
            `<div>
                <div class="cfi-details">
                </div>
                <div style="padding-left: 11px" class="cfi-children-container"></div>
            </div>`
        );
        this.htmlParent.append(this.html);

        this.divCFIDetails = this.html.find('.cfi-details');
        this.childrenContainer = this.html.find('.cfi-children-container');
        this.renderDetails();
        this.renderChildren();
    }

    renderDetails() {
        Util.clearHTML(this.divCFIDetails);
        this.divCFIDetails.html(
            `<div class="inputNameContainer">
                <img class="cfi-icon" src="/images/svg/casefileitem.svg" title="Drag item on case model ..."/>
                <input class="inputName" type="text" readonly></input>
                <div class="action-icon-container">
                    <img class="action-icon delete-icon" src="images/delete_32.png" title="Delete ..."/>
                    <img class="action-icon add-sibling-icon" src="images/svg/add-sibling-node.svg" title="Add sibling ..."/>
                    <img class="action-icon add-child-icon" src="images/svg/add-child-node.svg" title="Add child ..."/>
                </div>
            </div>
            <div class="selectContainer">
                <select class="selectMultiplicity">
                    <option value="ExactlyOne">[1]</option>
                    <option value="ZeroOrOne">[0..1]</option>
                    <option value="ZeroOrMore">[0..*]</option>
                    <option value="OneOrMore">[1..*]</option>
                    <option value="Unspecified">[*]</option>
                    <option value="Unknown">[?]</option>
                </select>
            </div>
            <div class="selectContainer">
                ${this.getSelectDefinitionRefHTML()}
            </div>
            <div class="divUsedIn">
            </div>`
        );

        const inputName = this.divCFIDetails.find('.inputName');
        const selectMultiplicity = this.divCFIDetails.find('.selectMultiplicity');
        const selectDefinitionRef = this.divCFIDetails.find('.selectDefinitionRef');

        inputName.val(this.definition.name);
        selectMultiplicity.val(this.definition.multiplicity);
        selectDefinitionRef.val(this.definition.definitionRef);

        this.divCFIDetails.on('click', e => {
            e.stopPropagation();
            this.editor.selectCFINode(this);
        });
        inputName.on('keydown', e => {
            if (e.which === 27) {
                e.preventDefault();
                e.stopPropagation();
                if (inputName.attr('readonly')) {
                    this.editor.deselectElements();
                } else {
                    this.inputNameBlurHandler();
                }
            }
        });
        inputName.on('keyup', e => {
            if (e.which === 9) {
                this.editor.selectCFINode(this);
                this.inputNameFocusHandler();
            }
        });
        inputName.on('leave', () => this.inputNameBlurHandler());
        inputName.on('blur', () => this.inputNameBlurHandler());
        inputName.on('dblclick', () => this.inputNameFocusHandler());
        inputName.on('click', () => this.inputNameFocusHandler());
        inputName.on('change', (e) => {
            // Captures changes to name of case file item
            this.definition.name = e.target.value;
            if (!this.definition.definitionRef) {
                const cfid = this.editor.ide.repository.getCaseFileItemDefinitions().find(definition => definition.name.toLowerCase() == this.definition.name.toLowerCase());
                if (cfid) {
                    this.definition.definitionRef = cfid.fileName;
                    selectDefinitionRef.val(this.definition.definitionRef);
                    this.editor.caseFileItemDefinitionEditor.loadDefinition(this.definition.definitionRef);
                }
            }
            this.case.refreshReferencingFields(this.definition);
            this.case.editor.completeUserAction();
        });
        selectMultiplicity.on('change', () => {
            this.definition.multiplicity = selectMultiplicity.value;
            this.case.editor.completeUserAction();
        });
        selectMultiplicity.on('focus', () => this.editor.selectCFINode(this));
        selectDefinitionRef.on('change', e => this.editor.changeCaseFileItemDefinition(this.definition, e.currentTarget));
        selectDefinitionRef.on('focus', () => this.editor.selectCFINode(this));
        this.divCFIDetails.find('.cfi-icon').on('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.editor.handleDragStartCFIDataNode(this.definition);
        });
        this.divCFIDetails.find('.add-child-icon').on('click', e => this.editor.addChild(e, this));
        this.divCFIDetails.find('.add-sibling-icon').on('click', e => this.editor.addSibling(e, this));
        this.divCFIDetails.find('.delete-icon').on('click', e => this.editor.removeNode(e, this));
        this.renderUsedIn();
    }

    inputNameBlurHandler() {
        const inputName = this.divCFIDetails.find('.inputName');
        inputName.attr('readonly', true);
        document.getSelection().empty();
    }

    inputNameFocusHandler() {
        if (this.editor.selectedNode === this) {
            const inputName = this.divCFIDetails.find('.inputName');
            inputName.attr('readonly', false);
            inputName.trigger('select');
        }
    }

    /**
     * return a string that defines the content of the select defintion field in the case file items editor
     * Select has an empty field, a <new> for creating a new cfidef, and the already available cfidef's
     * @returns {String}
     */
    getSelectDefinitionRefHTML() {
        // First create 2 options for "empty" and "_new_", then add all casefileitem definition files
        return (
            [`<select class="selectDefinitionRef"><option value=""></option> <option value="${NEWDEF}">&lt;new&gt;</option>`]
                .concat(this.editor.ide.repository.getCaseFileItemDefinitions().map(definition => `<option value="${definition.fileName}">${definition.name}</option>`))
                .concat('</select>')
                .join(''));
    };

    renderChildren() {
        Util.clearHTML(this.childrenContainer);
        this.definition.children.forEach(cfi => this.renderChild(cfi));
    }

    /**
     * 
     * @param {CaseFileItemDef} cfi 
     */
    renderChild(cfi) {
        return new CFINode(this.editor, this, this.childrenContainer, cfi);
    }

    /**
     * Fills the usage counter of this cfi
    */
    renderUsedIn() {
        if (this.case.items && this.definition.id) { // This means the case has been rendered
            const references = this.case.items.filter(item => item.referencesDefinitionElement(this.definition.id));
            if (references.length > 0) {
                const divUsedIn = this.divCFIDetails.find('.divUsedIn');
                divUsedIn.html(references.length + ' places');
            }
        }
    }

    select() {
        this.divCFIDetails.addClass('cfi-selected');
        // Show the right item in the definitions editor
        this.editor.caseFileItemDefinitionEditor.loadDefinition(this.definition.definitionRef);
        this.case.updateSelectedCaseFileItemDefinition(this.definition);
        this.renderUsedIn(); // Refresh the usedIn count too when markers are refreshed
    }

    deselect() {
        this.divCFIDetails.removeClass('cfi-selected');
        this.case.updateSelectedCaseFileItemDefinition(undefined);
        this.renderUsedIn(); // Refresh the usedIn count too when markers are refreshed
    }

    /**
     * 
     * @param {Array<CFINode>} offspring 
     * @returns 
     */
    getOffspring(offspring = []) {
        offspring.push(this);
        this.childNodes.forEach(child => child.getOffspring(offspring));
        return offspring;
    }

    delete() {
        const determineNextNodeToSelect = (from) => {
            const parentDefinition = /** @type {CaseFileItemCollection} */ (from.definition.parent);
            const myIndex = parentDefinition.children.indexOf(from.definition);
            if (parentDefinition.children.length - 1 > myIndex) {
                const nextDefinition = parentDefinition.children[myIndex + 1];
                const nextNode = this.editor.cfiNodes.find(node => node.definition === nextDefinition);
                return nextNode;
            } else if (parentDefinition.children.length > 1 && myIndex > 0) {
                const nextDefinition = parentDefinition.children[myIndex - 1];
                const nextNode = this.editor.cfiNodes.find(node => node.definition === nextDefinition);
                return nextNode;
            } else {
                return from.parentNode;
            }
        }
        const offspring = this.getOffspring();
        // If this node is selected or the current selected node is a child of this node,
        // then we need to find a new node to be selected
        const nextNode = offspring.indexOf(this.editor.selectedNode) >= 0 ? determineNextNodeToSelect(this) : this.editor.selectedNode;

        // Now delete all childnodes of this node
        offspring.forEach(node => Util.removeFromArray(this.editor.cfiNodes, node))
        this.definition.removeDefinition();
        Util.removeHTML(this.html);

        // Select the next node
        this.editor.selectCFINode(nextNode);
    }

    /**
     * 
     * @param {CFINode} sibling
     * @returns {CFINode}
     */
    createChild(sibling = undefined) {
        const newCaseFileItemDefinition = this.definition.createChildDefinition();
        // newCaseFileItemDefinition.name = this.editor.case.caseDefinition.getNextNameOfType(CaseFileItemDef);
        const childNode = this.renderChild(newCaseFileItemDefinition);
        if (sibling) {
            this.definition.insert(newCaseFileItemDefinition, sibling.definition);
            childNode.html.insertAfter(sibling.html);
        }
        return childNode;
    }
}
