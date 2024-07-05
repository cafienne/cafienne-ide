import { MilestoneEventListenerDefinition } from "./planitem";

export default class EventListenerDefinition extends MilestoneEventListenerDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }
}
