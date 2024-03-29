class TimerEvent extends EventListener {
    /**
     * 
     * @param {Stage} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.planItemDefinition.createPlanItem(TimerEventDefinition);
        const shape = stage.case.diagram.createShape(x, y, 32, 32, definition.id);
        if (definition.definition instanceof TimerEventDefinition) {
            return new TimerEvent(stage, definition, definition.definition, shape);
        }
        console.error('Not supposed to reach this code');
    }

    /**
     * Creates a new UserEvent element.
     * @param {CMMNElement} parent 
     * @param {PlanItem} definition
     * @param {TimerEventDefinition} planItemDefinition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, planItemDefinition, shape) {
        super(parent, definition, shape);
        this.planItemDefinition = planItemDefinition;
    }

    createProperties() {
        return new TimerEventProperties(this);
    }

    get imageURL() {
        return 'images/svg/timerevent.svg';       
    }

    referencesDefinitionElement(definitionId) {
        const cfiTrigger = this.planItemDefinition.caseFileItemStartTrigger;
        if (cfiTrigger && cfiTrigger.sourceRef == definitionId) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }    
}
CMMNElement.registerType(TimerEvent, 'Timer Event', 'images/svg/timerevent.svg');
