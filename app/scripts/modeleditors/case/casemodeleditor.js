'use strict';

class CaseModelEditor extends ModelEditor {
    /**
     * This editor handles Case models
     * @param {CaseFile} file The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     */
    constructor(file) {
        super(file);
        this.file = file;
        this.caseFile = file;
        this.caseFileName = this.fileName;
        this.dimensionsFile = this.ide.repository.getDimensions().find(file => file.name === this.file.name);
        this.dimensionsFileName = this.file.name + '.dimensions';
        this.ideCaseFooter = $('.ideCaseFooter');

        Grid.initialize(); // Initialize the snap-to-grid component
        this.undoManager = new UndoManager(this);

        // Upon clicking the case footer's validation label, render the validateform of the case (if a case is there)
        this.ideCaseFooter.find('.validateLabel').on('click', () => this.case && this.case.validateForm.show());
    }

    get label() {
        return 'Edit Case Model - ' + this.fileName;
    }

    /**
     * Async Load of the case model, dimensions model and all referred cfi models. 
     */
    loadModel() {
        this.ide.repository.load(this.fileName, file => {
            const caseDefinition = file.definition;
            // When case model finished loading then load the dimensions model
            this.ide.repository.load(this.dimensionsFileName, file => {
                const dimensions = file.definition;
                // When dimensions model finished loading then filter for all <caseFileItemRef>'s and push in array 
                const cfiRefs = [];
                caseDefinition.elements.filter(element => element instanceof CaseFileItemRefDef).forEach(cfi => cfiRefs.push(cfi));
                // Load all referred cfi models
                this.loadCFIModels(cfiRefs, () => {
                    // When all referred cfi models finished loading we can open the editor
                    this.open(caseDefinition, dimensions)
                });
            });
        });
    }

    /**
     * Will load CaseFileItemRefDef models recursively in the callback until array is entirely processed
     * 
     * @param {Array<CaseFileItemRefDef>} cfiRefs 
     * @param {Function} callbackWhenAllCfiModelsAreLoaded 
     */
    loadCFIModels(cfiRefs, callbackWhenAllCfiModelsAreLoaded) {
        const caseFileItemRef = cfiRefs.pop();
        if ( caseFileItemRef ) {
            // As long there is a remaining item in the array then load the model
            this.ide.repository.load(caseFileItemRef.cfiRef, file => {
                caseFileItemRef.caseFileItemModel = file.definition;
                // Recursively load the next one in the array
                this.loadCFIModels(cfiRefs, callbackWhenAllCfiModelsAreLoaded);
            });
        }
        else {
            // When cfiRefs is empty and all models are loaded then execute final callback
            callbackWhenAllCfiModelsAreLoaded();
        }
    }

    /**
     * 
     * @param {CaseDefinition} caseDefinition 
     * @param {Dimensions} dimensions 
     */
    open(caseDefinition, dimensions) {
        // Reset the undo manager.
        this.undoManager.resetActionBuffer(caseDefinition, dimensions);

        // Now that the visualization information is available, we can start the import.
        this.loadDefinition();

        super.visible = true;
    }

    /**
     * Imports the source and tries to visualize it
     * @param {CaseDefinition} caseDefinition 
     * @param {Dimensions} dimensions 
     */
    loadDefinition(caseDefinition = this.caseFile.definition, dimensions = this.dimensionsFile.definition) {
        // During import no live validation and storage of changes
        this.trackChanges = false;

        this.migrateDefinitions(caseDefinition, dimensions);

        // First, remove current case content; but without tracking changes...
        if (this.case) {
            this.case.delete();
        }

        // Create a new case renderer on the definition and dimensions
        this.case = new Case(this, this.htmlContainer, caseDefinition, dimensions);

        if (this.__migrated) {
            this.saveModel();
        }

        // activate live validation and undo etc
        this.trackChanges = true;

        // Do a first time validation.
        window.setTimeout(() => this.case.runValidation(), 100);
    }

    /**
     * Imports the source and tries to visualize it
     * @param {CaseDefinition} caseDefinition 
     * @param {Dimensions} dimensions 
     */
    migrateDefinitions(caseDefinition, dimensions) {
        this.__migrated = false;

        dimensions.diagram.deprecatedCaseFileItems.forEach(casefileshape => {
            casefileshape.migrate();
            this.migrated(`Migrating casefileshape ${casefileshape.cmmnElementRef}`);
        })

        dimensions.diagram.deprecatedTextBoxes.forEach(textbox => {
            const textAnnotationDefinition = caseDefinition.createTextAnnotation(textbox.migrate().cmmnElementRef);
            textAnnotationDefinition.text = textbox.content;
            this.migrated(`Migrating textbox ${textbox.cmmnElementRef}`);
        });
    }

    /**
     * 
     * @param {String} msg 
     */
    migrated(msg) {
        console.log(msg);
        this.__migrated = true;
    }

    refresh() {
        // Overwrite 'refresh()' to ensure that we also clear the dimensions and cfi files from the cache
        this.ide.repository.clear(this.dimensionsFileName);
        this.case.caseDefinition.elements.forEach(element => {
            if (element instanceof CaseFileItemRefDef) {
                this.ide.repository.clear(element.cfiRef);
            }
        });
        super.refresh();
    }

    /**
     * 
     * @param {JQuery.KeyDownEvent} e 
     */
    keyStrokeHandler(e) {
        if (!this.case) {
            console.log("No case, but already pressing a key?! You're too quick ;)");
            return;
        }
        const visibleMovableEditor = this.movableEditors.find(e => e.visible);
        const selectedElement = this.case.selectedElement;
        switch (e.keyCode) {
        case 27: // esc
            // Clicking Escape closes Movable editors one by one, and if none is left, it deselects current selection
            //  First check if source editor is currently open, and if so, close that one.
            if (this.case.sourceEditor.visible) {
                this.case.sourceEditor.close();
            } else if (!this.hideTopEditor()) {
                if (this.case) {
                    this.case.clearSelection();
                }
            }
            break;
        case 46: //del
            if (!visibleMovableEditor && selectedElement) {
                this.case.__removeElement(selectedElement);
                this.case.clearSelection();
            }
            break;
        case 37: //arrow left;
        case 38: //arrow up;
        case 39: //arrow right;
        case 40: //arrow down;
            // Pressing one of the arrow keys will move any selected editor or element according to the grid size
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Arrow press should not have effect when you're in an input or textarea.
                break;
            }
            return this.handleArrowPress(e.keyCode, visibleMovableEditor, selectedElement);
        case 97: //1;
            break;
        case 98: //2;
            break;
        case 99: //3;
            break;
        case 100: //4;
            break;
        case 76: //L
            if (e.ctrlKey) {
                if (!this.case.sourceEditor.visible) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.case.switchLabels();
                }
            }
            break;
        case 83: //S
            if (e.ctrlKey) { // Avoid the browser's save, and save the current model.
                e.stopPropagation();
                e.preventDefault();
                this.saveModel();
            }
            break;
        case 89: //y
            if (e.ctrlKey) this.undoManager.redo();
            break;
        case 90: //z
            if (e.ctrlKey) this.undoManager.undo();
        default:
            break;
        }
    }

    /**
     * Handles pressing an arrow key. Moves either top editor or selected element around.
     * @param {Number} keyCode 
     * @param {MovableEditor} visibleMovableEditor 
     * @param {CMMNElement} selectedElement 
     * @returns {Boolean} false if the event must be canceled, true if the arrow press was not handled.
     */
    handleArrowPress(keyCode, visibleMovableEditor, selectedElement) {
        // 37: arrow left, 39: arrow right, 38: arrow up, 40: arrow down 
        const xMove = (keyCode == 37 ? -1 : keyCode == 39 ? 1 : 0) * Grid.Size;
        const yMove = (keyCode == 38 ? -1 : keyCode == 40 ? 1 : 0) * Grid.Size;
        if (visibleMovableEditor) {
            visibleMovableEditor.move(xMove, yMove);
            return false;
        } else if (selectedElement) {
            selectedElement.xyz_joint.translate(xMove, yMove);
            this.completeUserAction();
            return false;
        }
        return true;
    }

    /**
     * Completes a user action; triggers live-validation and auto-save of models
     */
    completeUserAction() {
        //check if the execute is active (can be set inactive for import)
        if (this.trackChanges) {
            if (!this.autoSaveTimer) {
                // console.warn("Setting the auto-save timer")
                this.autoSaveTimer = window.setTimeout(() => {
                    // console.log("Removing timer and saving changes")
                    delete this.autoSaveTimer;
                    // Tell the repository to save
                    this.saveModel();
                }, 0);
            } else {
                // console.warn("There is already an auto save timer in progress")
            }
        }
    }

    /**
     * to be used to save the current active model
     */
    saveModel() {
        // Validate all models currently active in the ide
        if (this.case) this.case.runValidation();
        this.undoManager.saveCaseModel(this.case.caseDefinition, this.case.dimensions);
    }

    onShow() {
        this.ideCaseFooter.css('display', 'block');
        this.case && this.case.onShow();
    }

    onHide() {
        this.ideCaseFooter.css('display', 'none');
    }

}

class CaseModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getCases();
    }

    get supportsDeploy() {
        return true;
    }

    get modelType() {
        return 'case';
    }

    /** @returns {Function} */
    get shapeType() {
        return CaseTask;
    }

    get description() {
        return 'Cases';
    }

    /**
     * Creates a new case model
     * @param {IDE} ide
     * @param {String} name The user entered case name
     * @param {String} description The description given by the user (can be empty)
     * @param {Function} callback 
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, name, description, callback = (/** @type {String} */ fileName) => {}) {
        // By default we create a case plan that fills the whole canvas size;
        //  We position it left and top at 2 times the grid size, with a minimum of 10px;
        //  Width and height have to be adjusted for scrollbar size.
        const margin = 2 * Grid.Size;
        const scrollbar = 40;
        const x = 20;//margin;
        const y = 20;//margin;
        const width = 800;//ide.caseModelEditor && ide.caseModelEditor.case ? ide.caseModelEditor.case.canvas.width() - (margin + scrollbar) : 800;
        const height = 500;//ide.caseModelEditor && ide.caseModelEditor.case ? ide.caseModelEditor.case.canvas.height() - (margin + scrollbar) : 500;

        const caseFileName = name + '.case';
        const dimensionsFileName = name + '.dimensions';
        const guid = Util.createID();

        const casePlanId = `cm_${guid}_0`;
        const documentation = description ? `<documentation textFormation="text/plain"><text><![CDATA[${description}]]></text></documentation>` : '';
        const caseString = 
`<case id="${caseFileName}" name="${name}" guid="${guid}">
    ${documentation}
    <caseFileModel/>
    <casePlanModel id="${casePlanId}" name="${name}"/>
</case>`;

        const dimensionsString = 
`<${CMMNDI}>
    <${CMMNDIAGRAM}>
        <${CMMNSHAPE} ${CMMNELEMENTREF}="${casePlanId}" name="${name}">
            <${BOUNDS} x="${x}" y="${y}" width="${width}" height="${height}" />                    
        </${CMMNSHAPE}>
    </${CMMNDIAGRAM}>
    <validation>
        <hiddennotices />
        <hiddenproblems />
    </validation>
</${CMMNDI}>`;

        // Upload models to server, and call back
        const caseFile = this.ide.repository.createCaseFile(caseFileName, caseString);
        const dimensionsFile = this.ide.repository.createDimensionsFile(dimensionsFileName, dimensionsString);
        caseFile.save(() => dimensionsFile.save(() => callback(caseFileName)));
        return caseFileName;
    }
}

IDE.registerEditorType(new CaseModelEditorMetadata());
