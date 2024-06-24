
import CaseFileItemView from "./casefileitemview";
import CasePlanView from "./caseplanview";
import CaseTaskView from "./casetaskview";
import CMMNElementView from "./cmmnelementview";
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
    static initialize() {
        CMMNElementView.registerType(CaseFileItemView, 'Case File Item', 'images/svg/casefileitem.svg');
        CMMNElementView.registerType(CasePlanView, 'Case Plan', 'images/svg/caseplanmodel.svg');
        CMMNElementView.registerType(CaseTaskView, 'Case TaskView', 'images/svg/casetaskmenu.svg', 'images/casetaskmenu_32.png');
        CMMNElementView.registerType(HumanTaskView, 'Human TaskView', 'images/svg/blockinghumantaskmenu.svg', 'images/humantaskmenu_32.png');
        CMMNElementView.registerType(MilestoneView, 'MilestoneView', 'images/svg/milestone.svg');
        CMMNElementView.registerType(PlanningTableView, 'Planning Table');
        CMMNElementView.registerType(ProcessTaskView, 'Process TaskView', 'images/svg/processtaskmenu.svg', 'images/processtaskmenu_32.png');
        CMMNElementView.registerType(EntryCriterionView, 'Entry Criterion', 'images/svg/entrycriterion.svg');
        CMMNElementView.registerType(ReactivateCriterionView, 'Reactivate Criterion', 'images/svg/reactivatecriterion.svg');
        CMMNElementView.registerType(ExitCriterionView, 'Exit Criterion', 'images/svg/exitcriterion.svg');
        CMMNElementView.registerType(StageView, 'StageView', 'images/svg/collapsedstage.svg');
        CMMNElementView.registerType(TextAnnotationView, 'Text Annotation', 'images/svg/textannotation.svg');
        CMMNElementView.registerType(TimerEventView, 'Timer Event', 'images/svg/timerevent.svg');
        CMMNElementView.registerType(UserEventView, 'User Event', 'images/svg/userevent.svg');
    }
}