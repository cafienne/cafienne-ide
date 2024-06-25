import CaseDefinition from "@definition/cmmn/casedefinition";
import MovableEditor from "@ide/editors/movableeditor";
import IDE from "@ide/ide";
import CaseFile from "@repository/serverfile/casefile";
import ModelEditor from "../modeleditor";
import CaseView from "./elements/caseview";
import Grid from "./grid";
import UndoManager from "./undoredo/undoredo";

export default class CaseModelEditor extends ModelEditor {
    /**
     * This editor handles Case models
     * @param {IDE} ide 
     * @param {CaseFile} file The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     */
    constructor(ide, file) {
        super(ide, file);
        this.file = file;
        this.caseFile = file;
        this.dimensionsFile = this.file.definition.dimensions.file;
        this.ideCaseFooter = $('.ideCaseFooter');
        this.undoManager = new UndoManager(this);

        // Upon clicking the case footer's validation label, render the validateform of the case (if a case is there)
        this.ideCaseFooter.find('.validateLabel').on('click', () => this.case && this.case.validateForm.show());
    }

    get label() {
        return 'Edit Case Model - ' + this.fileName;
    }

    /**
     * Loads the model and makes the editor visible
     */
    loadModel() {
        this.open(this.file.definition);
    }

    /**
     * 
     * @param {CaseDefinition} caseDefinition 
     */
    open(caseDefinition) {
        // Reset the undo manager.
        this.undoManager.resetActionBuffer(caseDefinition);

        // Now that the visualization information is available, we can start the import.
        this.loadDefinition();

        super.visible = true;
    }

    /**
     * Imports the source and tries to visualize it
     * @param {CaseDefinition} caseDefinition 
     */
    loadDefinition(caseDefinition = this.caseFile.definition) {
        // During import no live validation and storage of changes
        this.trackChanges = false;

        this.migrateDefinitions(caseDefinition);

        // First, remove current case content; but without tracking changes...
        if (this.case) {
            this.case.delete();
        }

        // Create a new case renderer on the definition and dimensions
        this.case = new CaseView(this, this.htmlContainer, caseDefinition);

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
     */
    migrateDefinitions(caseDefinition) {
        this.__migrated = false;
        const dimensions = caseDefinition.dimensions;
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
        // Overwrite to ensure that we also clear the dimensions file from the cache
        this.ide.repository.clear(this.dimensionsFile.fileName);
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
     * @param {CMMNElementView} selectedElement 
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
        this.undoManager.saveCaseModel(this.case.caseDefinition);
    }

    onShow() {
        this.ideCaseFooter.css('display', 'block');
        this.case && this.case.onShow();
    }

    onHide() {
        this.ideCaseFooter.css('display', 'none');
    }

}
