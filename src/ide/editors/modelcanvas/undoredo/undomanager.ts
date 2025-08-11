import GraphicalModelDefinition from "../../../../repository/definition/graphicalmodeldefinition";
import ServerFile from "../../../../repository/serverfile/serverfile";
import State from "./state";
import UndoRedoBox from "./undoredobox";

export default class UndoManager {
    performingBufferAction: boolean = false;
    private currentState?: State;

    constructor(file: ServerFile<any>, public getUndoRedoBox: () => UndoRedoBox | undefined, public loadDefinition: (definition: GraphicalModelDefinition) => void) {
        this.currentState = new State(this, file.definition!, undefined);
    }

    updateUndoRedoButtons(undoCount: number = this.getUndoCount(), redoCount: number = this.getRedoCount()): void {
        // Only update the buttons once the model is loaded.
        this.getUndoRedoBox()?.updateButtons(undoCount, redoCount);
    }

    /**
     * Clears the action buffer, and prepares it for the new content.
     * This typically only happens when we open a new model
     */
    resetActionBuffer(definition: GraphicalModelDefinition): void {
        this.performingBufferAction = false;
        this.currentState = undefined;

        // First action is to add what we have to the undo/redo buffer.
        this.setState(definition);
    }

    /**
     * Save model and upload to server; but only if there are new changes.
     */
    saveModel(definition: GraphicalModelDefinition) {
        const newAction = this.setState(definition);
        if (newAction) {
            newAction.save();
        } else {
            console.warn('Nothing to save for this model change?!')
        }
    }

    private setState(definition: GraphicalModelDefinition) {
        if (this.performingBufferAction) {
            // This is not supposed to happen. But order of events and invocations is not so easy, so keeping it for safety reasons if you start changing this code
            console.warn('Adding state while performing buffer action');
            return;
        }

        // Creating a new action makes it also the current action.
        //  Note that the actual action may not resolve in changes, and in such a case, the currentAction will return itself and remain the same.
        this.currentState = new State(this, definition, this.currentState);
        this.updateUndoRedoButtons();
        return this.currentState;
    }

    getUndoCount() {
        if (this.currentState) {
            return this.currentState.undoCount;
        } else {
            return 0;
        }
    }

    async undo() {
        if (this.currentState) {
            this.currentState = await this.currentState.undo();
        } else {
            console.log('No undo available');
        }
        this.updateUndoRedoButtons();
    }

    getRedoCount() {
        if (this.currentState) {
            return this.currentState.redoCount;
        } else {
            return 0;
        }
    }

    async redo() {
        if (this.currentState && this.currentState.nextAction) {
            this.currentState = await this.currentState.nextAction.redo();
        } else {
            console.log('No redo availalbe');
        }
        this.updateUndoRedoButtons();
    }
}
