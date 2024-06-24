import Util from "@util/util";
import CMMNExtensionDefinition from "../../../../extensions/cmmnextensiondefinition";
import PlanItem from "../../planitem";
import PlanItemReference from "../planitemreference";

export default class TaskPairingDefinition extends CMMNExtensionDefinition {
    /**
     * 
     * @param {*} importNode 
     * @param {*} caseDefinition 
     * @param {PlanItem} parent 
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.parent = parent;
        this.present = importNode instanceof Element;
        this.references = this.parseElements('task', PlanItemReference);
    }

    get present() {
        return this._present || this.references.length > 0;
    }

    /**
     * @param {Boolean} value 
     */
    set present(value) {
        this._present = value;
    }

    createExportNode(parentNode, tagName) {
        if (this.present || this.references.length > 0) {
            super.createExportNode(parentNode, tagName, 'references');
        }
    }

    /**
     * @returns {Array<PlanItem>}
     */
    get tasks() {
        return this.references.map(ref => ref.task);
    }

    /**
     * @param {PlanItem} item 
     * @returns {TaskPairingDefinition}
     */
    counterPartOf(item) {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    drop() {
        // Remove references to us from our opposites.
        this.references.map(ref => ref.task).forEach(item => {
            this.counterPartOf(item).removeReference(this.parent);
            if (this.counterPartOf(item).references.length === 0) {
                this.counterPartOf(item).present = false;
            }
        });
        // Drop our opposites
        this.references = [];
        // We're no longer present either.
        this.present = false;
    }

    /**
     * 
     * @param {PlanItem} task 
     * @returns {Boolean}
     */
    has(task) {
        return this.references.find(ref => ref.is(task));
    }

    /**
     * 
     * @param {PlanItem} item 
     */
    add(item) {
        this.adoptReference(item);
        this.counterPartOf(item).adoptReference(this.parent)
    }

    /**
     * 
     * @param {PlanItem} item 
     */
    remove(item) {
        this.removeReference(item);
        this.counterPartOf(item).removeReference(this.parent);
    }

    /**
     * 
     * @param {PlanItem} item 
     * @returns {PlanItemReference}
     */
    adoptReference(item) {
        const existing = this.references.find(ref => ref.is(item))
        if (existing) return existing;

        const ref = this.createDefinition(PlanItemReference);
        ref.adopt(item);
        this.references.push(ref);
        return ref;
    }

    removeReference(item) {
        Util.removeFromArray(this.references, this.references.find(ref => ref.is(item)));
    }
}
