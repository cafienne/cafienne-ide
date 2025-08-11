import ElementRegistry from "../../../editors/modelcanvas/shapebox/elementregistry";
import Icons from "../../../util/images/icons";
import Shapes from "../../../util/images/shapes";
import CaseFileItemView from "../elements/casefileitemview";
import CasePlanView from "../elements/caseplanview";
import CaseTaskView from "../elements/casetaskview";
import EntryCriterionView from "../elements/entrycriterionview";
import ExitCriterionView from "../elements/exitcriterionview";
import HumanTaskView from "../elements/humantaskview";
import MilestoneView from "../elements/milestoneview";
import PlanningTableView from "../elements/planningtableview";
import ProcessTaskView from "../elements/processtaskview";
import ReactivateCriterionView from "../elements/reactivatecriterionview";
import StageView from "../elements/stageview";
import TextAnnotationView from "../elements/textannotationview";
import TimerEventView from "../elements/timereventview";
import UserEventView from "../elements/usereventview";

export default class CaseElementRegistry extends ElementRegistry {
    constructor() {
        super();

        this.registerType(HumanTaskView, 'Human Task', Shapes.HumanTask, Icons.HumanTask);
        this.registerType(CaseTaskView, 'Case Task', Shapes.CaseTask, Icons.CaseTask);
        this.registerType(ProcessTaskView, 'Process Task', Shapes.ProcessTask, Icons.ProcessTask);
        this.registerType(MilestoneView, 'Milestone', Shapes.Milestone);
        this.registerType(TimerEventView, 'Timer Event', Shapes.TimerEvent);
        this.registerType(UserEventView, 'User Event', Shapes.UserEvent);
        this.registerType(StageView, 'Stage', Shapes.Stage);
        this.registerType(EntryCriterionView, 'Entry Criterion', Shapes.EntryCriterion);
        this.registerType(ReactivateCriterionView, 'Reactivate Criterion', Shapes.ReactivateCriterion);
        this.registerType(ExitCriterionView, 'Exit Criterion', Shapes.ExitCriterion);
        this.registerType(CasePlanView, 'Case Plan', Shapes.CasePlan);
        this.registerType(CaseFileItemView, 'Case File Item', Shapes.CaseFileItem);
        this.registerType(TextAnnotationView, 'Text Annotation', Shapes.TextAnnotation);
        this.registerType(PlanningTableView, 'Planning Table');
    }
}
