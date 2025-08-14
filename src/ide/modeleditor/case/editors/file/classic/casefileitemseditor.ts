import $ from "jquery";
import CaseFileItemDef from "../../../../../../repository/definition/cmmn/casefile/casefileitemdef";
import IDE from "../../../../../ide";
import BottomSplitter from "../../../../../splitter/bottomsplitter";
import HtmlUtil from "../../../../../util/htmlutil";
import CaseFileItemDefinitionEditor from "../../../../cfid/casefileitemdefinitioneditor";
import CaseCanvas from "../../../elements/casecanvas";
import CaseFileEditor from "../casefileeditor";
import CFINode from "./cfinode";
import CFIDConverter from "./conversion/cfidconverter";

export const NEWDEF = '__new__';

export default class CaseFileItemsEditor {
    case: CaseCanvas;
    ide: IDE;

    // Keep track of nodes rendering individual case file items
    cfiNodes: CFINode[] = [];
    selectedNode?: CFINode;

    // HTML elements
    html!: JQuery<HTMLElement>;
    divCFIDetailsContainer!: JQuery<HTMLElement>;
    divCaseFileDefinitions!: JQuery<HTMLElement>;
    splitter!: BottomSplitter;
    caseFileItemDefinitionEditor!: CaseFileItemDefinitionEditor;

    /**
     * Renders the CaseFile definition through fancytree
     */
    constructor(public caseFileEditor: CaseFileEditor, public htmlParent: JQuery<HTMLElement>) {
        this.case = caseFileEditor.case;
        this.ide = this.case.editor.ide;

        // Now render the HTML
        this.renderHTML();
    }

    /**
     * create the html element of a treeEditor form
     */
    renderHTML() {
        //create the main element add to document
        this.html = $(
            `<div class="schemadatabox" tabindex="0">
                <div>
                    <div class="cfi-editorform basicbox basicform">
                        <div class="casefile-header formheader">
                            <label>Case File</label>
                        </div>
                        <div class="containerbox">
                            <div class="cfi-buttons">
                                <button class="btnAddChild" type="addchild">Add Child</button>
                                <button class="btnAddSibling" type="addsibling">Add Sibling</button>
                                <button class="btnRemoveItem" type="remove">Remove</button>
                                <button class="btnConvertToType">Convert to Type structure</button>
                            </div>
                            <div class="cfi-container">
                                <div class="cfi-header cfi-details">
                                    <div>Name</div>
                                    <div>Multiplicity</div>
                                    <div>Definition</div>
                                    <div>Used in</div>
                                </div>
                                <div class="cfi-details-container">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="schemadatabox">
                <div class="divCaseFileDefinitions basicbox"></div>
            </div>`);

        this.htmlParent.append(this.html);
        this.divCFIDetailsContainer = this.html.find('.cfi-details-container');
        this.divCaseFileDefinitions = this.html.find('.divCaseFileDefinitions');

        // Attach event handlers
        this.html.on('click', () => this.deselectElements());
        this.html.on('keydown', e => {
            if (this.selectedNode) {
                if (e.which == 113) {  // F2 to edit name of selected node
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectedNode.inputNameFocusHandler();
                } else if (e.which == 27) { // ESC to deselect elements
                    e.preventDefault();
                    e.stopPropagation();
                    this.deselectElements();
                }
            }
        });
        this.html.find('.btnAddChild').on('click', e => this.addChild(e));
        this.html.find('.btnAddSibling').on('click', e => this.addSibling(e));
        this.html.find('.btnRemoveItem').on('click', e => this.removeNode(e));
        this.html.find('.btnConvertToType').on('click', e => this.convertToType(e));

        // Create a splitter and put cfid editor at the bottom.
        this.splitter = new BottomSplitter(this.htmlParent, '70%', 175);
        this.caseFileItemDefinitionEditor = new CaseFileItemDefinitionEditor(this, this.divCaseFileDefinitions);

        // Render case file content
        this.renderCaseFileModel();
    }

    renderCaseFileModel() {
        this.cfiNodes.forEach(node => node.delete());
        HtmlUtil.clearHTML(this.html.find('.cfi-details-container'));
        this.case.caseDefinition.caseFile.children.forEach(cfi => this.createNode(cfi));
    }

    selectCFINode(node: CFINode | undefined) {
        if (node === this.selectedNode) {
            return;
        }

        // Deselect current selected node
        if (this.selectedNode) {
            this.selectedNode.deselect();
        }

        this.selectedNode = node;
        if (node) {
            node.select();
        }
    }

    deselectElements() {
        this.selectCFINode(undefined);
    }

    createNode(cfi: CaseFileItemDef) {
        return new CFINode(this, undefined, this.divCFIDetailsContainer, cfi);
    }

    /**
     * Deletes this editor
     */
    delete() {
        // Delete the generic events of the treeEditor (e.g. click add button, ...)
        HtmlUtil.removeHTML(this.html);
        this.splitter.delete();
    }

    /**
     * Add a child under the "from" node
     */
    addChild(e: JQuery.Event, from: CFINode | undefined = this.selectedNode) {
        this.addNode(e, false, from);
    }

    /**
     * Add a sibling next to the "from" node
     */
    addSibling(e: JQuery.Event, from: CFINode | undefined = this.selectedNode) {
        this.addNode(e, true, from);
    }

    /**
     * Add a node, and insert it after or under the "from" node.
     * Defaults to "under", basically meaning adds a child to the from node.
     */
    addNode(e: JQuery.Event, insert: boolean = false, from?: CFINode) {
        e.preventDefault();
        e.stopPropagation();
        let newNode: CFINode | undefined;
        if (from) {
            if (insert) {
                if (from.parentNode) {
                    newNode = from.parentNode.createChild(from);
                } else {
                    // Insert a node at root level
                    const parentDefinition = this.case.caseDefinition.caseFile;
                    newNode = this.createNode(parentDefinition.createChildDefinition());
                    parentDefinition.insert(newNode.definition, from.definition);
                    newNode.html.insertAfter(from.html);
                }
            } else {
                newNode = from.createChild();
            }
        } else {
            newNode = this.createNode(this.case.caseDefinition.caseFile.createChildDefinition());
        }
        this.case.editor.completeUserAction();
        this.selectCFINode(newNode);
        newNode.inputNameFocusHandler();
        return newNode;
    }

    /**
     * Remove a node and it's corresponding case file item definition.
     */
    removeNode(e: JQuery.Event, node: CFINode | undefined = this.selectedNode) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Get the user selected cfi. Can be undefined if none is selected
        if (node) {
            if (this.hasReferences(node.definition)) {
                // Only remove the node if it is not in use
                this.ide.danger('The Case File Item (or one of its children) is in use, it cannot be deleted');
            } else {
                // Remove the cfi
                node.delete();
                this.case.editor.completeUserAction();
            }
        } else {
            this.ide.warning('Select a Case File Item to be removed', 3000);
        }
    }

    async convertToType(e: JQuery.Event) {
        try {
            console.groupCollapsed(`Converting CaseFile structure of '${this.case.editor.fileName}'`)
            await new CFIDConverter(this.case).convert();
            console.groupEnd();
            console.log("Completed conversion, refreshing editor");
            this.case.editor.refresh();
        } catch (error: any) {
            console.error(error);
            console.groupEnd();
            this.ide.danger(`Failure during conversion:<p/>${error.message}`)
        }
    }

    /**
     * Creates a non-existing name for the new case file item definition node,
     * i.e., one that does not conflict with the existing list of case file item definitions.
     */
    __getUniqueDefinitionName(cfidName: string): string {
        const currentDefinitions = this.ide.repository.getCaseFileItemDefinitions();
        for (let i = 0; i < currentDefinitions.length; i++) {
            const modelName = currentDefinitions[i].name;
            if (modelName == cfidName) {
                return this.__getUniqueDefinitionName(this.__nextName(cfidName));
            }
        }
        return cfidName;
    }

    /**
     * Returns the next name for the specified string; it checks the last
     * characters. For a name like 'abc' it will return 'abc_1', for 'abc_1' it returns 'abc_2', etc.
     */
    __nextName(proposedName: string) {
        const underscoreLocation = proposedName.indexOf('_');
        if (underscoreLocation < 0) {
            return proposedName + '_1';
        } else {
            const front = proposedName.substring(0, underscoreLocation + 1);
            const num = Number(proposedName.substring(underscoreLocation + 1)) + 1;
            const newName = front + num;
            return newName;
        }
    }

    /**
     * Changes the definitionRef of the case file item, and loads the new definition ref
     */
    changeCaseFileItemDefinition(caseFileItem: CaseFileItemDef, cfidefField: HTMLSelectElement) {
        const newValue = cfidefField.value;
        const newModelName = newValue == NEWDEF ? this.__getUniqueDefinitionName(caseFileItem.name.toLowerCase()) : undefined;
        const definitionRef = newModelName ? newModelName + '.cfid' : newValue;

        if (newValue == NEWDEF) {
            // Create a new option for the new model
            $(cfidefField).append($(`<option value="${definitionRef}">${newModelName}</option>`));
            // select the option
            cfidefField.value = definitionRef;
            // and start an editor for it
            this.caseFileItemDefinitionEditor.createNewModel(definitionRef);
        } else {
            // Inform the CaseFileItemDefinition editor to render the new definition
            this.caseFileItemDefinitionEditor.loadDefinition(definitionRef);
        }

        // Do the actual definition change and make sure it is saved
        caseFileItem.definitionRef = definitionRef;
        this.case.editor.completeUserAction();
    }

    /**
     * Fills the usedIn column, shows which type of elements use this cfi
     * Values can be: sTEMSPOCIO (sentry, Task, Event, Milestone, Stage, PlanningTable, input output CaseParameters, CFIElement
     */
    showUsedIn() {
        // called from mappingcfi.js
        // called from caseview.js
        // Just render again to refresh the UsedIn
        this.cfiNodes.forEach(node => node.renderUsedIn());
    }

    hasReferences(definitionElement: CaseFileItemDef) {
        // Check for references not just for this element, but also for the children
        return definitionElement
            .getDescendants()
            .find(child => this.getReferences(child).length > 0) !== undefined;
    }

    /**
     * Gets all elements and editors that refer to the definition element
     */
    private getReferences(definitionElement: CaseFileItemDef) {
        const references: any[] = this.case.items.filter(item => item.referencesDefinitionElement(definitionElement.id));
        // Also check whether the case parameters may be using the case file item
        if (this.case.caseDefinition.input.find(p => p.bindingRef.references(definitionElement))) {
            references.push(this.case.caseParametersEditor);
        } else if (this.case.caseDefinition.output.find(p => p.bindingRef.references(definitionElement))) {
            // else statement, since no need to add the same editor twice
            references.push(this.case.caseParametersEditor);
        }
        return references;
    }
}
