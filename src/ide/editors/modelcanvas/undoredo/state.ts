import GraphicalModelDefinition from "../../../../repository/definition/graphicalmodeldefinition";
import DimensionsFile from "../../../../repository/serverfile/dimensionsfile";
import ServerFile from "../../../../repository/serverfile/serverfile";
import UndoManager from "./undomanager";

export default class State {
    private modelString: string;
    private dimensionsString: string;
    private modelFile: ServerFile<any>;
    private dimensionsFile: DimensionsFile;
    private modelChanged: boolean;
    private dimensionsChanged: boolean;
    private next?: State;
    private saved?: boolean;

    constructor(public undoManager: UndoManager, public definition: GraphicalModelDefinition, public previousAction?: State) {
        this.modelString = definition.toXMLString();
        const dimensions = definition.dimensions!;
        this.dimensionsString = dimensions.toXMLString();
        this.modelFile = definition.file as ServerFile<any>;
        this.dimensionsFile = dimensions.file;
        this.modelChanged = false;
        this.dimensionsChanged = false;
        this.previousAction = previousAction;

        if (previousAction) {
            // Update flags if we have previous actions
            this.modelChanged = previousAction.modelString != this.modelString;
            this.dimensionsChanged = previousAction.dimensionsString != this.dimensionsString;
            if (!this.modelChanged && !this.dimensionsChanged && previousAction) {
                // If no changes, then just return the previous action instead of this new one.
                //  Note: if that previousAction was a change w.r.t. it's predecessor, then we should not keep saving.
                //  This is why the action keeps track of a "saved" flag (see logic in save() method).
                return previousAction;
            }

            // Also make ourselves the next action of the previous one.
            previousAction.nextAction = this;
        }
    }

    get nextAction(): State | undefined {
        return this.next;
    }

    set nextAction(action: State | undefined) {
        this.next = action;
    }

    /**
     * Returns the number of undo actions available before this action.
     */
    get undoCount(): number {
        return this.previousAction ? this.previousAction.undoCount + 1 : 0;
    }

    /**
     * Returns the number of redo actions available behind this action.
     */
    get redoCount(): number {
        return this.nextAction ? this.nextAction.redoCount + 1 : 0;
    }

    async undo() {
        if (this.previousAction) {
            // Undo means we have to perform the previous action.
            //  But for saving the result of that action we have to use our change flags, because we are moving back.
            return this.previousAction.perform('undo', this.modelChanged, this.dimensionsChanged);
        } else {
            console.log('No undo available');
            return Promise.resolve(this);
        }
    }

    async redo() {
        // For redo we can suffice with our own change flags for saving
        return this.perform('redo');
    }

    /**
     * Performs this specific action again, i.e., tells the editor to load the model state
     * corresponding with this action, and also invokes the save logic on the action.
     * Note that the save logic depends on the direction of the perform: for undo, the save flags
     * has to be taken from the current action, for redo it has to be taken from the next action.
     * (See the actual implementations of undo and redo above) 
     */
    async perform(direction: string, modelChanged: boolean = this.modelChanged, dimensionsChanged: boolean = this.dimensionsChanged): Promise<State> {
        console.groupCollapsed("Performing " + direction + " on action " + this.undoCount);
        this.undoManager.performingBufferAction = true;
        // Parse the sources again into a definition and load that in the editor.
        this.modelFile.source = this.modelString;
        this.dimensionsFile.source = this.dimensionsString;
        this.dimensionsFile.parse();
        this.modelFile.parse();

        if (this.modelFile.definition) {
            this.undoManager.loadDefinition(this.modelFile.definition);
        }

        // Reset the "saved" flag.
        this.saved = false;
        await this.save(modelChanged, dimensionsChanged);
        this.undoManager.performingBufferAction = false;
        console.groupEnd();
        return this;
    }

    /**
     * Trigger save logic on the action. Executes two independent save actions,
     * one on the definition and one on the dimensions file; but only if they changed.
     * The flags indicate whether they have changed, and take the values of the Action itself by default.
     */
    async save(modelChanged: boolean = this.modelChanged, dimensionsChanged: boolean = this.dimensionsChanged) {
        if (this.saved) {
            // We keep track of a "saved" flag. This is required, because the constructor call
            //  may return the previous action, and hence, if there is a change, the save logic is invoked again.
            return;
        }
        if (modelChanged) {
            this.modelFile.source = this.modelString;
            await this.modelFile.save();
        }
        if (dimensionsChanged) {
            this.dimensionsFile.source = this.dimensionsString;
            await this.dimensionsFile.save();
        }
        this.saved = true;
    }

    /**
     * Forceful save. Required for creating new models.
     */
    async forceSave() {
        this.save(true, true);
    }
}
