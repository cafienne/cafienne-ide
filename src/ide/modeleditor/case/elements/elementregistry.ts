
import CaseFileItemView from "./casefileitemview";
import CasePlanView from "./caseplanview";
import CaseTaskView from "./casetaskview";
import HumanTaskView from "./humantaskview";
import MilestoneView from "./milestoneview";
import PlanningTableView from "./planningtableview";
import ProcessTaskView from "./processtaskview";
import { EntryCriterionView, ExitCriterionView, ReactivateCriterionView } from "./sentryview";
import StageView from "./stageview";
import TextAnnotationView from "./textannotationview";
import TimerEventView from "./timereventview";
import UserEventView from "./usereventview";

export default class ElementRegistry {
    static viewMetadata: ElementMetadata[] = [];

    static initialize() {
        this.registerType(HumanTaskView, 'Human Task', 'images/svg/blockinghumantaskmenu.svg', 'images/humantaskmenu_32.png');
        this.registerType(CaseTaskView, 'Case Task', 'images/svg/casetaskmenu.svg', 'images/casetaskmenu_32.png');
        this.registerType(ProcessTaskView, 'Process Task', 'images/svg/processtaskmenu.svg', 'images/processtaskmenu_32.png');
        this.registerType(MilestoneView, 'Milestone', 'images/svg/milestone.svg');
        this.registerType(TimerEventView, 'Timer Event', 'images/svg/timerevent.svg');
        this.registerType(UserEventView, 'User Event', 'images/svg/userevent.svg');
        this.registerType(StageView, 'Stage', 'images/svg/collapsedstage.svg');
        this.registerType(EntryCriterionView, 'Entry Criterion', 'images/svg/entrycriterion.svg');
        this.registerType(ReactivateCriterionView, 'Reactivate Criterion', 'images/svg/reactivatecriterion.svg');
        this.registerType(ExitCriterionView, 'Exit Criterion', 'images/svg/exitcriterion.svg');
        this.registerType(CasePlanView, 'Case Plan', 'images/svg/caseplanmodel.svg');
        this.registerType(CaseFileItemView, 'Case File Item', 'images/svg/casefileitem.svg');
        this.registerType(TextAnnotationView, 'Text Annotation', 'images/svg/textannotation.svg');
        this.registerType(PlanningTableView, 'Planning Table');
    }

    /**
     * Registers a class that extends CMMNElementView by it's name.
     * @param cmmnElementType 
     * @param typeDescription Friendly description of the type
     * @param smallImageURL url of small image (for drag/drop, shapebox, etc.)
     * @param menuImageURL optional url of image shown in repository browser
     */
    static registerType(cmmnElementType: Function, typeDescription: string, smallImageURL: string = '', menuImageURL: string = smallImageURL) {
        this.viewMetadata.push(new ElementMetadata(cmmnElementType, typeDescription, smallImageURL, menuImageURL));
    }

    static getType(name: string) {
        return this.viewMetadata.find(type => type.name === name)?.cmmnElementType;
    }
}

export class ElementMetadata {
    name: string;

    constructor(public cmmnElementType: Function, public typeDescription: string, public smallImage: string, public menuImage: string) {
        this.name = cmmnElementType.name;

        // TODO: Remove backwards compatibility code. Still used in e.g. modellistpanel 
        (<any>cmmnElementType).typeDescription = cmmnElementType.name;
        (<any>cmmnElementType).smallImage = smallImage;
        (<any>cmmnElementType).menuImage = menuImage;
    }

    get hasImage() {
        return this.smallImage !== '';
    }
}
