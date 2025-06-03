import CaseDefinition from "../../../../repository/definition/cmmn/casedefinition";
import Dimensions from "../../../../repository/definition/dimensions/dimensions";
import CaseFile from "../../../../repository/serverfile/casefile";
import DimensionsFile from "../../../../repository/serverfile/dimensionsfile";
import UndoManager from "./undomanager";

export default class Action {
    private caseString: string;
    private dimensionsString: string;
    private caseFile: CaseFile;
    private dimensionsFile: DimensionsFile;
    private caseChanged: boolean;
    private dimensionsChanged: boolean;
    private next?: Action;
    private saved?: boolean;

    constructor(public undoManager: UndoManager, public caseDefinition: CaseDefinition, public dimensions: Dimensions, public previousAction?: Action) {
        this.caseString = caseDefinition.toXMLString();
        this.dimensionsString = dimensions.toXMLString();
        this.caseFile = caseDefinition.file;
        this.dimensionsFile = dimensions.file;
        this.caseChanged = false;
        this.dimensionsChanged = false;
        this.previousAction = previousAction;

        if (previousAction) {
            // Update flags if we have previous actions
            this.caseChanged = previousAction.caseString != this.caseString;
            this.dimensionsChanged = previousAction.dimensionsString != this.dimensionsString;
            if (!this.caseChanged && !this.dimensionsChanged && previousAction) {
                // If no changes, then just return the previous action instead of this new one.
                //  Note: if that previousAction was a change w.r.t. it's predecessor, then we should not keep saving.
                //  This is why the action keeps track of a "saved" flag (see logic in save() method).
                return previousAction;
            }

            // Also make ourselves the next action of the previous one.
            previousAction.nextAction = this;
        }
    }

    get nextAction(): Action | undefined {
        return this.next;
    }

    set nextAction(action: Action | undefined) {
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
            return this.previousAction.perform('undo', this.caseChanged, this.dimensionsChanged);
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
    async perform(direction: string, caseChanged: boolean = this.caseChanged, dimensionsChanged: boolean = this.dimensionsChanged): Promise<Action> {
        console.groupCollapsed("Performing " + direction + " on action " + this.undoCount);
        this.undoManager.performingBufferAction = true;
        // Parse the sources again into a definition and load that in the editor.
        this.caseFile.source = this.caseString;
        this.dimensionsFile.source = this.dimensionsString;
        this.dimensionsFile.parse();
        this.caseFile.parse();
        this.undoManager.editor.loadDefinition(this.caseFile.definition);
        // Reset the "saved" flag.
        this.saved = false;
        await this.save(caseChanged, dimensionsChanged);
        this.undoManager.performingBufferAction = false;
        console.groupEnd();
        return this;
    }

    /**
     * Trigger save logic on the action. Executes two independent save actions,
     * one on the case definition and one on the dimensions file; but only if they changed.
     * The flags indicate whether they have changed, and take the values of the Action itself by default.
     */
    async save(caseChanged: boolean = this.caseChanged, dimensionsChanged: boolean = this.dimensionsChanged) {
        if (this.saved) {
            // We keep track of a "saved" flag. This is required, because the constructor call
            //  may return the previous action, and hence, if there is a change, the save logic is invoked again.
            return;
        }
        if (caseChanged) {
            this.caseFile.source = this.caseString;
            await this.caseFile.save();
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
