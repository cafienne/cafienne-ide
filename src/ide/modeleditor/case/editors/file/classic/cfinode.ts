import $ from "jquery";
import CaseFileItemDef, { CaseFileItemCollection } from "../../../../../../repository/definition/cmmn/casefile/casefileitemdef";
import Multiplicity from "../../../../../../repository/definition/type/multiplicity";
import Util from "../../../../../../util/util";
import HtmlUtil from "../../../../../util/htmlutil";
import Images from "../../../../../util/images/images";
import Shapes from "../../../../../util/images/shapes";
import CaseCanvas from "../../../elements/casecanvas";
import CaseFileItemsEditor, { NEWDEF } from "./casefileitemseditor";

export default class CFINode {
    childNodes: CFINode[] = [];
    case: CaseCanvas;
    html: JQuery<HTMLElement>;
    divCFIDetails: JQuery<HTMLElement>;
    childrenContainer: JQuery<HTMLElement>;

    constructor(
        public editor: CaseFileItemsEditor,
        public parentNode: CFINode | undefined,
        public htmlParent: JQuery<HTMLElement>,
        public definition: CaseFileItemDef
    ) {
        if (this.parentNode) {
            this.parentNode.childNodes.push(this);
        }
        this.case = editor.case;
        this.editor.cfiNodes.push(this);

        this.html = $(
            `<div>
                <div class="cfi-details">
                </div>
                <div class="cfi-children-container"></div>
            </div>`
        );
        this.htmlParent.append(this.html);

        this.divCFIDetails = this.html.find('.cfi-details');
        this.childrenContainer = this.html.find('.cfi-children-container');
        this.renderDetails();
        this.renderChildren();
    }

    renderDetails(): void {
        HtmlUtil.clearHTML(this.divCFIDetails);
        this.divCFIDetails.html(
            `<div class="input-name-container">
                <img class="cfi-icon" src="${Shapes.CaseFileItem}" title="Drag item on case model ..."/>
                <input class="inputName" type="text" readonly></input>
                <div class="action-icon-container">
                    <img class="action-icon delete-icon" src="${Images.Delete}" title="Delete ..."/>
                    <img class="action-icon add-sibling-icon" src="${Images.AddSiblingNode}" title="Add sibling ..."/>
                    <img class="action-icon add-child-icon" src="${Images.AddChildNode}" title="Add child ..."/>
                </div>
            </div>
            <div class="select-container">
                <select class="selectMultiplicity">
                    ${Multiplicity.values.map(m => '<option value="' + m.value + '">' + m.label + '</option>')}
                </select>
            </div>
            <div class="select-container">
                ${this.getSelectDefinitionRefHTML()}
            </div>
            <div class="divUsedIn">
            </div>`
        );

        const inputName = this.divCFIDetails.find('.inputName');
        const selectMultiplicity = this.divCFIDetails.find('.selectMultiplicity');
        const selectDefinitionRef = this.divCFIDetails.find('.selectDefinitionRef') as JQuery<HTMLSelectElement>;

        inputName.val(this.definition.name);
        selectMultiplicity.val(this.definition.multiplicity.toString());
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
        inputName.on('change', e => {
            // Captures changes to name of case file item
            this.definition.name = (e.target as HTMLInputElement).value;
            // If we do not yet have a definitionRef, then check to see if there is a definition that has the same name, and then set it
            if (!this.definition.definitionRef) {
                const cfid = this.editor.ide.repository.getCaseFileItemDefinitions().find(
                    definition => definition.name.toLowerCase() == this.definition.name.toLowerCase()
                );
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
            this.definition.multiplicity = Multiplicity.parse(selectMultiplicity.val()?.toString());
            this.case.editor.completeUserAction();
        });
        selectMultiplicity.on('focus', () => this.editor.selectCFINode(this));
        selectDefinitionRef.on('change', e => this.editor.changeCaseFileItemDefinition(this.definition, e.currentTarget));
        selectDefinitionRef.on('focus', () => this.editor.selectCFINode(this));
        this.divCFIDetails.find('.cfi-icon').on('pointerdown', e => {
            e.preventDefault();
            e.stopPropagation();
            this.editor.caseFileEditor.startDragging(this.definition);
        });
        this.divCFIDetails.find('.add-child-icon').on('click', e => this.editor.addChild(e, this));
        this.divCFIDetails.find('.add-sibling-icon').on('click', e => this.editor.addSibling(e, this));
        this.divCFIDetails.find('.delete-icon').on('click', e => this.editor.removeNode(e, this));
        this.renderUsedIn();
    }

    inputNameBlurHandler(): void {
        const inputName = this.divCFIDetails.find('.inputName');
        inputName.attr('readonly', String(true));
        document.getSelection()?.empty();
    }

    inputNameFocusHandler(): void {
        if (this.editor.selectedNode === this) {
            const inputName = this.divCFIDetails.find('.inputName');
            inputName.attr('readonly', null);
            inputName.trigger('select');
        }
    }

    /**
     * return a string that defines the content of the select defintion field in the case file items editor
     * Select has an empty field, a <new> for creating a new cfidef, and the already available cfidef's
     */
    getSelectDefinitionRefHTML(): string {
        // First create 2 options for "empty" and "_new_", then add all casefileitem definition files
        return (
            [`<select class="selectDefinitionRef"><option value=""></option> <option value="${NEWDEF}">&lt;new&gt;</option>`]
                .concat(this.editor.ide.repository.getCaseFileItemDefinitions().map(definition => `<option value="${definition.fileName}">${definition.name}</option>`))
                .concat('</select>')
                .join('')
        );
    }

    renderChildren(): void {
        HtmlUtil.clearHTML(this.childrenContainer);
        this.definition.children.forEach(cfi => this.renderChild(cfi));
    }

    /**
     * @param cfi
     */
    renderChild(cfi: CaseFileItemDef): CFINode {
        return new CFINode(this.editor, this, this.childrenContainer, cfi);
    }

    /**
     * Fills the usage counter of this cfi
     */
    renderUsedIn(): void {
        if (this.case.items && this.definition.id) { // This means the case has been rendered
            const references = this.case.items.filter(item => item.referencesDefinitionElement(this.definition.id));
            if (references.length > 0) {
                const divUsedIn = this.divCFIDetails.find('.divUsedIn');
                divUsedIn.html(references.length + ' places');
            }
        }
    }

    select(): void {
        this.divCFIDetails.addClass('cfi-selected');
        // Show the right item in the definitions editor
        this.editor.caseFileItemDefinitionEditor.loadDefinition(this.definition.definitionRef);
        this.case.updateSelectedCaseFileItemDefinition(this.definition);
        this.renderUsedIn(); // Refresh the usedIn count too when markers are refreshed
    }

    deselect(): void {
        this.divCFIDetails.removeClass('cfi-selected');
        this.case.updateSelectedCaseFileItemDefinition(undefined);
        this.renderUsedIn(); // Refresh the usedIn count too when markers are refreshed
    }

    getOffspring(offspring: CFINode[] = []): CFINode[] {
        offspring.push(this);
        this.childNodes.forEach(child => child.getOffspring(offspring));
        return offspring;
    }

    delete(): void {
        const determineNextNodeToSelect = (from: CFINode): CFINode | undefined => {
            const parentDefinition = from.definition.parent as CaseFileItemCollection;
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
        };
        const offspring = this.getOffspring();
        // If this node is selected or the current selected node is a child of this node,
        // then we need to find a new node to be selected
        const currentSelectedNode = this.editor.selectedNode;
        let nextNode: CFINode | undefined;
        if (currentSelectedNode && currentSelectedNode.getOffspring().indexOf(this) >= 0) {
            // If the current selected node is a child of this node, then we need to find a new node to select
            nextNode = determineNextNodeToSelect(currentSelectedNode);
        }

        // Now delete all childnodes of this node
        offspring.forEach(node => Util.removeFromArray(this.editor.cfiNodes, node));
        this.definition.removeDefinition();
        HtmlUtil.removeHTML(this.html);

        // Select the next node
        this.editor.selectCFINode(nextNode);
    }

    createChild(sibling: CFINode | undefined = undefined): CFINode {
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
