const NEWDEF = '__new__';

class CaseFileItemsEditor {
    /**
     * Renders the CaseFile definition through fancytree
     * @param {CaseFileEditor} caseFileEditor 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(caseFileEditor, htmlParent) {
        this.caseFileEditor = caseFileEditor;
        this.case = caseFileEditor.case;
        this.ide = this.case.editor.ide;
        this.htmlParent = htmlParent;
        this.renderHTML();
        /** @type {Array<CFINode>} */
        this.cfiNodes = [];
        /** @type {CFINode} */
        this.selectedNode = null;
        this.cfiBox = htmlParent.find('.cfi-details-container');

        this.renderCaseFileModel();

        this.divCaseFileDefinitions = this.html.find('.divCaseFileDefinitions');
        this.caseFileItemDefinitionEditor = new CaseFileItemDefinitionEditor(this, this.divCaseFileDefinitions);
        this.splitter = new BottomSplitter(htmlParent, '70%', 175);

        //add the event handles, for adding and removing data at top level
        this.attachEventHandlers();
    }

    /**
     * Raises an issue found during validation. The context in which the issue has occured and the issue number must be passed, 
     * along with some parameters that are used to provide a meaningful description of the issue
     * @param {*} context
     * @param {Number} number 
     * @param {Array<String>} parameters 
     */
    raiseEditorIssue(context, number, parameters) {
        this.case.validator.raiseProblem(context.id, number, parameters);
    }

    /**
     * Deletes this editor
     */
    delete() {
        // Delete the generic events of the treeEditor (e.g. click add button, ...)
        Util.removeHTML(this.html);
        this.splitter.delete();
    }

    /**
     * define the events of the data manipulation buttons, tree click event and other buttons
     */
    attachEventHandlers() {
        this.html.find('.btnAddChild').on('click', e => this.clickAddButton(e, false));
        this.html.find('.btnAddSibling').on('click', e => this.clickAddButton(e, true));
        this.html.find('.btnRemoveItem').on('click', e => this.removeNode());
        this.html.find('.btnConvertToType').on('click', e => this.convertToType(e));
        this.html.on('keydown', e => {
            if (e.which == 27) {
                e.preventDefault();
                e.stopPropagation();
                this.deselectElements();
            }
        });
    }

    clickAddButton(e, insert = false) {
        e.preventDefault();
        e.stopPropagation();
        const newNode = this.addNode(insert);
        this.selectCFINode(newNode);
        newNode.inputNameFocusHandler();
    }

    /**
     * 
     * @param {Boolean} insert 
     * @returns {CFINode}
     */
    addNode(insert = false) {
        let newNode = null;
        if (this.selectedNode) {
            if (insert) {
                if (this.selectedNode.parentNode) {
                    newNode = this.selectedNode.parentNode.createChild(this.selectedNode);
                } else {
                    // Insert a node at root level
                    const parentDefinition = this.case.caseDefinition.getCaseFile();
                    newNode = this.createNode(parentDefinition.createChildDefinition());
                    parentDefinition.insert(newNode.definition, this.selectedNode.definition);
                    newNode.html.insertAfter(this.selectedNode.html);
                }
            } else {
                newNode = this.selectedNode.createChild();
            }
        } else {
            newNode = this.createNode(this.case.caseDefinition.getCaseFile().createChildDefinition());
        }
        this.case.editor.completeUserAction();
        return newNode;
    }

    removeNode() {
        // Get the user selected cfi. Can be null if none is seleted
        if (this.selectedNode) {
            if (this.hasReferences(this.selectedNode.definition)) {
                // Only remove the node if it is not in use
                this.ide.danger('The Case File Item (or one of its children) is in use, it cannot be deleted');
            } else {
                // Remove the cfi
                this.selectedNode.delete();
                this.case.editor.completeUserAction();
            }
        } else {
            this.ide.warning('Select a Case File Item to be removed', 1000);
        }
    }

    convertToType(e) {
        try {
            new CFIDConverter(this.case).convert();
        } catch (error) {
            console.error(error);
            this.ide.danger(`Failure during conversion:<p/>${error.message}`)
        }
    }

    /**
     * Creates a non-existing name for the new case file item definition node,
     * i.e., one that does not conflict with the existing list of case file item definitions.
     * @returns {String}
     */
    __getUniqueDefinitionName(cfidName) {
        const currentDefinitions = this.ide.repository.getCaseFileItemDefinitions();
        for (let i = 0; i < currentDefinitions.length; i++) {
            const modelName = currentDefinitions[i].name;
            if (modelName == cfidName) {
                console.log('The name ' + cfidName + ' already exists in repository; creating new one');
                return this.__getUniqueDefinitionName(this.__nextName(cfidName));
            }
        }
        return cfidName;
    }

    /**
     * Returns the next name for the specified string; it checks the last
     * characters. For a name like 'abc' it will return 'abc_1', for 'abc_1' it returns 'abc_2', etc.
     * @returns {String}
     */
    __nextName(proposedName) {
        const underscoreLocation = proposedName.indexOf('_');
        if (underscoreLocation < 0) {
            return proposedName + '_1';
        } else {
            const front = proposedName.substring(0, underscoreLocation + 1);
            const num = new Number(proposedName.substring(underscoreLocation + 1)).valueOf() + 1;
            const newName = front + num;
            return newName;
        }
    }

    /**
     * Changes the definitionRef of the case file item, and loads the new definition ref
     * @param {CaseFileItemDef} caseFileItem 
     * @param {Element} cfidefField 
     */
    changeCaseFileItemDefinition(caseFileItem, cfidefField) {
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
        this.renderCaseFileModel();
    }

    /**
     * @returns {Boolean}
     */
    hasReferences(definitionElement) {
        // Check for references not just for this element, but also for the children
        return definitionElement.getDescendants().find(child => this.getReferences(child).length > 0);
    }

    /**
     * Gets all elements and editors that refer to the definition element
     * @param {CaseFileItemDef} definitionElement 
     * @returns {Array<*>}
     */
    getReferences(definitionElement) {
        /** @type {Array<*>} */
        const references = this.case.items.filter(item => item.referencesDefinitionElement(definitionElement.id));
        // Also check whether the case parameters may be using the case file item
        if (this.case.caseDefinition.input.find(p => p.bindingRef == definitionElement.id)) {
            references.push(this.case.caseParametersEditor);
        } else if (this.case.caseDefinition.output.find(p => p.bindingRef == definitionElement.id)) {
            // else statement, since no need to add the same editor twice
            references.push(this.case.caseParametersEditor);
        }
        return references;
    }

    /**
     * Handles the dragging of a case file item from the cfi editor to a zoom field (cfi field)
     */
    handleDragStartCFIDataNode(cfi) {
        this.caseFileEditor.setDragData(new CaseFileItemDragData(this, cfi));
    }

    /**
     * 
     * @param {CFINode} node 
     */
    selectCFINode(node) {
        if (node === this.selectedNode) {
            return;
        }
        this.changeMarking(false); // Remove old markers
        this.cfiNodes.forEach(node => node.deselect());
        this.selectedNode = node;
        if (node) {
            node.select();

            //get all objects using the dataNode = all objects using the case file item
            this.markedObjects = this.getReferences(node.definition);
            this.changeMarking(true);
        }
    }

    deselectElements() {
        this.selectCFINode(undefined);
    }

    /**
     * (un)mark the objects (elements or editors) currently marked
     * - bMark     : true marks the object, false unmarks
     */
    changeMarking(bMark) {
        if (!this.markedObjects) {
            return;
        }
        this.markedObjects.forEach(mObject => {
            //two types of objects possible: cmmn element, or an editor
            // Both must implement __mark() method
            mObject.__mark(bMark);
        });
    }

    /**
     * validates this
     */
    validate() {
        const allCaseFileItems = this.case.caseDefinition.getCaseFile().getDescendants();
        if ((!allCaseFileItems || allCaseFileItems.length <= 0) && !this.case.caseDefinition.caseFile.typeRef) {
            this.raiseEditorIssue(this.case, 38, [this.case.name]);
        }
        allCaseFileItems.forEach(item => {
            if (!item.name) {
                this.raiseEditorIssue(item, 1, ['Case File Item', this.case.name, item.multiplicity]);
            }
            if (!item.definitionRef) {
                this.raiseEditorIssue(item, 31, [item.name, this.case.name]);
            }
        });
    }

    /**
     * 
     * @param {CaseFileItemDef} cfi 
     */
    createNode(cfi) {
        return new CFINode(this, undefined, this.cfiBox, cfi);
    }

    renderCaseFileModel() {
        Util.clearHTML(this.html.find('.cfi-details-container'));
        this.case.caseDefinition.caseFile.children.forEach(cfi => this.createNode(cfi));
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
                            <label>Case File Items</label>
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
                                    <div>UsedIn</div>
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
        this.html.on('click', () => this.deselectElements());
        this.html.on('keydown', e => {
            if (e.which == 113) {  // F2 pressed for edit
                if (this.selectedNode) {
                    this.selectedNode.inputNameFocusHandler();
                }
            }
        });
        this.htmlParent.append(this.html);
    }
}
