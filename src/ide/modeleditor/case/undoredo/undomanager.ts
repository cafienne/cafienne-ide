import CaseDefinition from "../../../../repository/definition/cmmn/casedefinition";
import Dimensions from "../../../../repository/definition/dimensions/dimensions";
import CaseModelEditor from "../casemodeleditor";
import Action from "./action";

export default class UndoManager {
    performingBufferAction: boolean = false;
    private currentAction?: Action;

    constructor(public editor: CaseModelEditor) { }

    updateUndoRedoButtons(undoCount: number = this.getUndoCount(), redoCount: number = this.getRedoCount()): void {
        // Only update the buttons once the case is loaded.
        if (this.editor.case) this.editor.case.undoBox.updateButtons(undoCount, redoCount);
    }

    /**
     * Clears the action buffer, and prepares it for the new content.
     * This typically only happens when we open a new case model
     */
    resetActionBuffer(caseDefinition: CaseDefinition, dimensions: Dimensions): void {
        this.performingBufferAction = false;
        this.currentAction = undefined;

        // First action is to add what we have to the undo/redo buffer.
        this.addCaseAction(caseDefinition, dimensions);
    }

    /**
     * Save model and upload to server; but only if there are new changes.
     * @param forceSave Saving case model is only done on the changes with respect to the previous save action. For creating a new model we have to forcefully save.
     */
    saveCaseModel(caseDefinition: CaseDefinition, dimensions: Dimensions, forceSave: boolean = false) {
        const newAction = this.addCaseAction(caseDefinition, dimensions);
        if (newAction) {
            if (forceSave) {
                newAction.forceSave();
            } else {
                newAction.save();
            }
        } else {
            // See also console.warn in addCaseAction
            console.warn('Nothing to save for this case model change?!')
        }
    }

    private addCaseAction(caseDefinition: CaseDefinition, dimensions: Dimensions) {
        if (this.performingBufferAction) {
            // This is not supposed to happen. But order of events and invocations is not so easy, so keeping it for safety reasons if you start changing this code
            console.warn('Adding case action while performing buffer action');
            return;
        }

        // Creating a new action makes it also the current action.
        //  Note that the actual action may not resolve in changes, and in such a case, the currentAction will return itself and remain the same.
        this.currentAction = new Action(this, caseDefinition, dimensions, this.currentAction as Action | undefined);
        this.updateUndoRedoButtons();
        return this.currentAction as Action;
    }

    getUndoCount() {
        if (this.currentAction) {
            return this.currentAction.undoCount;
        } else {
            return 0;
        }
    }

    async undo() {
        if (!this.editor.case) return; // Function currently only enabled in CaseModelEditor

        if (this.currentAction) {
            this.currentAction = await this.currentAction.undo();
        } else {
            console.log('No undo available');
        }
        this.updateUndoRedoButtons();
    }

    getRedoCount() {
        if (this.currentAction) {
            return this.currentAction.redoCount;
        } else {
            return 0;
        }
    }

    async redo() {
        if (!this.editor.case) return; // Function currently only enabled in CaseModelEditor

        if (this.currentAction && this.currentAction.nextAction) {
            this.currentAction = await this.currentAction.nextAction.redo();
        } else {
            console.log('No redo availalbe');
        }
        this.updateUndoRedoButtons();
    }
}
