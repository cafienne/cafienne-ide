import UserEventDefinition from "../../../../repository/definition/cmmn/caseplan/usereventdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Images from "../../../util/images/images";
import EventListenerView from "./eventlistenerview";
import UserEventProperties from "./properties/usereventproperties";
import StageView from "./stageview";

export default class UserEventView extends EventListenerView<UserEventDefinition> {
    /**
     * Create a new UserEventView at the given coordinates.
     */
    static create(stage: StageView, x: number, y: number): UserEventView {
        const definition = stage.definition.createPlanItem(UserEventDefinition);
        const shape = stage.canvas.diagram.createShape(x, y, 32, 32, definition.id);
        return new UserEventView(stage, definition, shape);
    }

    /**
     * Creates a new UserEventView element.
     */
    constructor(parent: StageView, definition: UserEventDefinition, shape: ShapeDefinition) {
        super(parent, definition, shape);
    }

    createProperties() {
        return new UserEventProperties(this);
    }

    get imageURL() {
        return Images.UserEvent;
    }

    referencesDefinitionElement(definitionId: string) {
        if (this.definition.authorizedRoles.find(role => role.id == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isUserEvent() {
        return true;
    }
}
