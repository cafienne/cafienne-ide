class CFINode {
    /**
     * 
     * @param {CaseFileItemsEditor} editor 
     * @param {CFINode} parentNode 
     * @param {JQuery<HTMLElement>} htmlParent 
     * @param {CaseFileItemDef} definition 
     */
    constructor(editor, parentNode, htmlParent, definition) {
        this.editor = editor;
        this.parentNode = parentNode;
        this.htmlParent = htmlParent;
        this.definition = definition;
        this.case = editor.case;

        this.editor.cfiNodes.push(this);
        this.html = $(
        `<div class="divCFINode">
            <div class="cfi-details">
            </div>
            <div style="padding-left: 16px" class="cfi-children-container"></div>
        </div>`);
        this.htmlParent.append(this.html);

        this.divCFIDetails = this.html.find('.cfi-details');
        this.childrenContainer = this.html.find('.cfi-children-container');
        this.renderDetails();
        this.renderChildren();
    }

    renderDetails() {
        Util.clearHTML(this.divCFIDetails);
        this.divCFIDetails.html(`
            <div>
                <img class="cfi-icon" style="width:14px;margin:2px" src="/images/svg/casefileitem.svg"/>
                <input class="inputName" type="text" readonly></input>
                <img class="action-icon delete-icon" src="images/delete_32.png" title="Delete ..."/>
                <img class="action-icon add-sibling-icon" src="images/svg/add-sibling-node.svg" title="Add sibling ..."/>
                <img class="action-icon add-child-icon" src="images/svg/add-child-node.svg" title="Add child ..."/>
            </div>
            <div>
                <select class="selectMultiplicity">
                    <option value="ExactlyOne">[1]</option>
                    <option value="ZeroOrOne">[0..1]</option>
                    <option value="ZeroOrMore">[0..*]</option>
                    <option value="OneOrMore">[1..*]</option>
                    <option value="Unspecified">[*]</option>
                    <option value="Unknown">[?]</option>
                </select>
            </div>
            <div>
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
            if (e.keyCode == 27) {
                this.inputNameBlurHandler();
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
        selectDefinitionRef.on('change', e => this.editor.changeCaseFileItemDefinition(this.definition, e.currentTarget));

        this.divCFIDetails.find('.delete-icon').on('click', e => {
            this.editor.selectCFINode(this);
            this.editor.clickRemoveButton();
        });
        this.divCFIDetails.find('.add-sibling-icon').on('click', e => {
            e.preventDefault();
            e.stopPropagation();
            this.editor.selectCFINode(this);
            const newNode = this.editor.addSibling();
            this.editor.selectCFINode(newNode);
            newNode.inputNameFocusHandler();
        });
        this.divCFIDetails.find('.add-child-icon').on('click', e => {
            e.preventDefault();
            e.stopPropagation();
            this.editor.selectCFINode(this);
            const newNode = this.editor.addChild();
            this.editor.selectCFINode(newNode);
            newNode.inputNameFocusHandler();
        });
        this.divCFIDetails.find('.cfi-icon').on('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.editor.handleDragStartCFIDataNode(this.definition);
        });

        window.setTimeout(() => this.renderUsedIn(), 0);
    }

    inputNameBlurHandler() {
        const inputName = this.divCFIDetails.find('.inputName');
        inputName.attr('readonly', true);
        document.getSelection().empty();
    }

    inputNameFocusHandler() {
        const inputName = this.divCFIDetails.find('.inputName');
        if (this.editor.selectedNode === this) {
            inputName.attr('readonly', false);
            inputName.select();
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
     * Fills the usedIn column, shows which type of elements use this cfi
     * Values can be: sTEMSPOCIO (sentry, Task, Event, Milestone, Stage, PlanningTable, input output CaseParameters, CFIElement
     *
    */
    renderUsedIn() {
        const divUsedIn = this.divCFIDetails.find('.divUsedIn');
        const allCaseFileItems = this.case.caseDefinition.getCaseFile().getDescendants();
        const UsedInTooltip =
            `The Case File Item is used by:

        s = sentry
        T = Task
        E = Event
        M = Milestone
        S = Stage
        P = PlanningTable
        C = Case File Item (element)
        I = Input Case Parameters
        O = Output Case Parameters`;

        // loop all dataNodes
        allCaseFileItems.forEach(cfi => {
            //get objects using this case file item
            const objectsUsingDN = this.getReferences(cfi);
            cfi.usedIn = this.getUsedInValueFromObjects(objectsUsingDN);
        });
        divUsedIn.attr('title', UsedInTooltip);
        divUsedIn.html(this.definition.usedIn);
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
     * returns a string of characters, these represent the object types used by a dataNode
     * sTEMSPOCIO
     */
    getUsedInValueFromObjects(objects) {
        //loop objects
        const chars = [];
        for (let i = 0; i < 9; i++) {
            chars[i] = '&nbsp;';
        }

        objects.forEach(object => {
            if (object instanceof CaseParametersEditor) {
                // TODO: this can be made more precise through navigating the definition structure instead of the visualization structure.
                chars[7] = 'I';
                chars[8] = 'O';
            } else if (object instanceof TaskView) {
                chars[1] = 'T'
            } else if (object instanceof StageView) {
                chars[4] = 'S';
            } else if (object instanceof MilestoneView) {
                chars[3] = 'M';
            } else if (object instanceof EventListenerView) {
                chars[2] = 'E';
            } else if (object instanceof SentryView) {
                chars[0] = 's';
            } else if (object instanceof PlanningTableView) {
                chars[5] = 'P';
            } else if (object instanceof CaseFileItemView) {
                chars[6] = 'C';
            }
        })
        return chars.join('');
    }

    select() {
        this.divCFIDetails.addClass('cfi-selected');
        // Show the right item in the definitions editor
        this.editor.caseFileItemDefinitionEditor.loadDefinition(this.definition.definitionRef);
    }

    deselect() {
        this.divCFIDetails.removeClass('cfi-selected');
    }

    delete() {
        const selectedNextNode = () => {
            const parentDefinition = /** @type {CaseFileItemCollection} */ (this.definition.parent);
            const myIndex = parentDefinition.children.indexOf(this.definition);
            if (parentDefinition.children.length - 1 > myIndex) {
                const nextDefinition = parentDefinition.children[myIndex + 1];
                const nextNode = this.editor.cfiNodes.find(node => node.definition === nextDefinition);
                return nextNode;
            } else if (parentDefinition.children.length > 1) {
                const nextDefinition = parentDefinition.children[myIndex - 1];
                const nextNode = this.editor.cfiNodes.find(node => node.definition === nextDefinition);
                return nextNode;
            } else {
                return this.parentNode;
            }
        }
        const nextNode = selectedNextNode();

        this.definition.removeDefinition();
        Util.removeHTML(this.html);

        this.editor.selectCFINode(nextNode);
        this.editor.caseFileItemDefinitionEditor.hideEditor();
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