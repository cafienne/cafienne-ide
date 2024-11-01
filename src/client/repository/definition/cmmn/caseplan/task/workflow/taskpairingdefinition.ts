import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import Util from "@util/util";
import CMMNExtensionDefinition from "../../../../extensions/cmmnextensiondefinition";
import PlanItem from "../../planitem";
import PlanItemReference from "../planitemreference";

export default class TaskPairingDefinition extends CMMNExtensionDefinition<CaseDefinition> {
    references: PlanItemReference[];
    private _present: boolean = false;

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: PlanItem) {
        super(importNode, caseDefinition, parent);
        this.present = importNode instanceof Element;
        this.references = this.parseElements('task', PlanItemReference);
    }

    get present(): boolean {
        return this._present || this.references.length > 0;
    }

    set present(value: boolean) {
        this._present = value;
    }

    createExportNode(parentNode: Element, tagName: string) {
        if (this.present || this.references.length > 0) {
            super.createExportNode(parentNode, tagName, 'references');
        }
    }

    get tasks(): PlanItem[] {
        return this.references.map(ref => ref.task);
    }

    counterPartOf(item: PlanItem): TaskPairingDefinition {
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

    has(task: PlanItem): boolean {
        return this.references.find(ref => ref.is(task)) !== undefined;
    }

    add(item: PlanItem) {
        this.adoptReference(item);
        this.counterPartOf(item).adoptReference(this.parent);
    }

    remove(item: PlanItem) {
        this.removeReference(item);
        this.counterPartOf(item).removeReference(this.parent);
    }

    adoptReference(item: PlanItem): PlanItemReference {
        const existing = this.references.find(ref => ref.is(item))
        if (existing) return existing;

        const ref: PlanItemReference = this.createDefinition(PlanItemReference);
        ref.adopt(item);
        this.references.push(ref);
        return ref;
    }

    removeReference(item: PlanItem | undefined) {
        Util.removeFromArray(this.references, this.references.find(ref => ref.is(item)));
    }
}
