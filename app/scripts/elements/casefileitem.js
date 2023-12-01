class CaseFileItem extends CMMNElement {
    /**
     * 
     * @param {Stage} stage 
     * @param {Number} x 
     * @param {Number} y 
     * @param {CaseFileItemDef} y 
     */
    static create(stage, x, y, definition = undefined) {
        definition = definition || CaseFileItemDef.createEmptyDefinition(stage.case.caseDefinition);
        const shape = stage.case.diagram.createShape(x, y, 25, 40, definition.id);
        return new CaseFileItem(stage, definition, shape);
    }

    /**
     * Check if the shape has the right size to be an "empty" case file item.
     * @param {CaseDefinition} caseDefinition 
     * @param {ShapeDefinition} shape 
     * @returns 
     */
    static createElementForShape(caseDefinition, shape) {
        if (shape.width == 25 && shape.height == 40) {
            return CaseFileItemDef.createEmptyDefinition(caseDefinition);
        }
    }

    /**
     * Creates a new CaseFileItem
     * @param {Stage} parent 
     * @param {CaseFileItemDef} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent, definition, shape);
        this.definition = definition;
        if (definition.isEmpty) {
            // This means it is a temporary definition that will not be saved on the server.
            //  But we want to keep track of the id in case a definition is added and then removed again.
            this.temporaryId = definition.id;
        }
        this.__resizable = false;
    }

    createProperties() {
        return new CaseFileItemProperties(this);
    }

    createHalo() {
        return new CaseFileItemHalo(this);
    }

    __removeElementDefinition() {
        // Avoid removing the actual CaseFileItemDef, we should only delete the shape.
    }

    refreshReferencingFields(definitionElement) {
        super.refreshReferencingFields(definitionElement);
        if (this.definition == definitionElement) {
            this.refreshText();
        }
    }

    setDropHandlers() {
        super.setDropHandlers();
        // Add drop handler with repository browser to handle changing cfi implementation when it is drag/dropped from there.
        this.case.editor.ide.repositoryBrowser.setDropHandler(dragData => this.changeDefinitionImplementation(dragData), dragData => this.constructor.name == dragData.shapeType);
    }

    removeDropHandlers() {
        super.removeDropHandlers();
        this.case.editor.ide.repositoryBrowser.removeDropHandler();
    }

    /**
    * @param {DragData} dragData 
    * @param {Boolean} updateName 
    */
    changeDefinitionImplementation(dragData, updateName = false) {
        if (this.definition instanceof CaseFileItemRefDef && this.definition.cfiRef === dragData.fileName) {
            // Nothing changed, let's return;
            return;
        }
        const fileName = dragData.fileName;
        const caseDefinition = this.definition.caseDefinition;

        const existingRefDef = caseDefinition.getCaseFile().children.find(child => child instanceof CaseFileItemRefDef && child.cfiRef === dragData.fileName)
        this.setDefinition(existingRefDef);

        if (! existingRefDef) {
            const newChild = /** @type {CaseFileItemRefDef} */ (caseDefinition.getCaseFile().createChildDefinition(CaseFileItemRefDef));
            // const newChild = CaseFileItemRefDef.createEmptyDefinition(this.definition.caseDefinition, dragData.fileName, dragData.fileName);
            newChild.cfiRef = dragData.fileName;
            newChild.id = dragData.fileName;
            newChild.name = dragData.fileName;
            this.setDefinition(newChild);

            // this.case.cfiEditor.refresh();
        }

        this.editor.ide.repository.load(fileName, file => {
            const model = file.definition;
            if (!model) {
                this.case.editor.ide.warning('Could not read the model ' + fileName + ' which is referenced from the case file item ' + this.name);
                return;
            }

            if (updateName) {
                console.warn(`Updating the cfi name to ${model.name}`);
                const name = model.name;
                if (name) {
                    this.definition.name = name;
                    this.refreshView();
                }
            }

            this.definition.caseFileItemModel = model;

            // Make sure to save changes if any.
            this.case.editor.completeUserAction();
            this.refreshView();

            this.case.cfiEditor.fancyTree.reload();
            // window.setTimeout(() => this.case.cfiEditor.fancyTree.reload(),0);
        });
    }

    /**
     * 
     * @param {CaseFileItemDef} definition 
     */
    setDefinition(definition) {
        this.definition = definition ? definition : CaseFileItemDef.createEmptyDefinition(this.case.caseDefinition);
        if (this.definition.isEmpty) {
            if (this.temporaryId) {
                // Restore the temporary id again
                this.definition.id = this.temporaryId;
            } else {
                this.temporaryId = this.definition.id;
            }
        }
        this.shape.cmmnElementRef = this.definition.id;
        this.refreshText();
        this.editor.completeUserAction();
    }

    get text() {
        return this.definition ? this.definition.name : '';
    }

    /**
     * @returns {CMMNDocumentationDefinition}
     */
    get documentation() {
        return this.definition && this.definition.documentation;
    }

    get markup() {
        return `<g>
                    <polyline class="cmmn-shape cmmn-border cmmn-casefile-shape" points=" 15,0 0,0 0,40 25,40 25,10 15,0 15,10 25,10" />
                </g>
                <text class="cmmn-text" text-anchor="middle" x="10" y="55" />`;
    }

    //validate: all steps to check this element
    __validate() {
        if (!this.name) {
            const message = this.parent ? this.parent.name : '-no parent-';
            this.raiseValidationIssue(0, [message, this.case.name]);
        }
    }

    referencesDefinitionElement(definitionId) {
        return this.definition && this.definition.id === definitionId;
    }
}
CMMNElement.registerType(CaseFileItem, 'Case File Item', 'images/svg/casefileitem.svg');
