import PlanItem from "@definition/cmmn/caseplan/planitem";
import UserEventDefinition from "@definition/cmmn/caseplan/usereventdefinition";
import ShapeDefinition from "@definition/dimensions/shape";
import EventListenerView from "./eventlistenerview";
import UserEventProperties from "./properties/usereventproperties";
import StageView from "./stageview";

export default class UserEventView extends EventListenerView {
    /**
     * 
     * @param {StageView} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.definition.createPlanItem(UserEventDefinition);
        const shape = stage.case.diagram.createShape(x, y, 32, 32, definition.id);
        return new UserEventView(stage, definition, shape);
    }

    /**
     * Creates a new UserEventView element.
     * @param {StageView} parent 
     * @param {UserEventDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent, definition, shape);
        this.definition = definition;
    }

    createProperties() {
        return new UserEventProperties(this);
    }

    get imageURL() {
        return 'images/svg/userevent.svg';
    }

    referencesDefinitionElement(definitionId) {
        if (this.definition.authorizedRoles.find(role => role.id == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isUserEvent() {
        return true;
    }
}
