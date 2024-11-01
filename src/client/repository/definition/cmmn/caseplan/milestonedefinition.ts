import { MilestoneEventListenerDefinition } from "./planitem";

export default class MilestoneDefinition extends MilestoneEventListenerDefinition {
    static get infix() {
        return 'ms';
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'milestone');
    }
}
