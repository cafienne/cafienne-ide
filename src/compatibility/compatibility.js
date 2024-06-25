// FOR SOME WEIRD REASON THE UNUSED CasePlanDefinition IMPORT MUST BE PUT HERE. VERY WEIRD, giving errors in TaskDefinition if it is removed...
import CasePlanDefinition from '@definition/cmmn/caseplan/caseplandefinition';
import TaskDefinition from '@definition/cmmn/caseplan/task/taskdefinition';
import ParameterDefinition from '@definition/cmmn/contract/parameterdefinition';
import EntryCriterionDefinition from '@definition/cmmn/sentry/entrycriteriondefinition';
import ExitCriterionDefinition from '@definition/cmmn/sentry/exitcriteriondefinition';
import ReactivateCriterionDefinition from '@definition/cmmn/sentry/reactivatecriteriondefinition';
import CasePlanHalo from '@ide/modeleditor/case/elements/halo/caseplanhalo';
import Halo from '@ide/modeleditor/case/elements/halo/halo';
import PlanItemHalo from '@ide/modeleditor/case/elements/halo/planitemhalo';
import PlanningTableHalo from '@ide/modeleditor/case/elements/halo/planningtablehalo';
import { EntryCriterionHalo, ExitCriterionHalo, ReactivateCriterionHalo } from '@ide/modeleditor/case/elements/halo/sentryhalo';
import TaskHalo, { HumanTaskHalo } from '@ide/modeleditor/case/elements/halo/taskhalo';
import CaseModelEditor from '../ide/modeleditor/case/casemodeleditor';
import CaseFileItemsEditor from '../ide/modeleditor/case/editors/casefileitemseditor';
import CaseFileItemView from '../ide/modeleditor/case/elements/casefileitemview';
import CasePlanView from '../ide/modeleditor/case/elements/caseplanview';
import CaseTaskView from '../ide/modeleditor/case/elements/casetaskview';
import CMMNElementView from '../ide/modeleditor/case/elements/cmmnelementview';
import Connector from '../ide/modeleditor/case/elements/connector';
import EventListenerView from '../ide/modeleditor/case/elements/eventlistenerview';
import HumanTaskView from '../ide/modeleditor/case/elements/humantaskview';
import MilestoneView from '../ide/modeleditor/case/elements/milestoneview';
import PlanItemView from '../ide/modeleditor/case/elements/planitemview';
import PlanningTableView from '../ide/modeleditor/case/elements/planningtableview';
import ProcessTaskView from '../ide/modeleditor/case/elements/processtaskview';
import SentryView, { EntryCriterionView, ExitCriterionView, ReactivateCriterionView } from '../ide/modeleditor/case/elements/sentryview';
import StageView from '../ide/modeleditor/case/elements/stageview';
import TaskStageView from '../ide/modeleditor/case/elements/taskstageview';
import TaskView from '../ide/modeleditor/case/elements/taskview';
import TextAnnotationView from '../ide/modeleditor/case/elements/textannotationview';
import TimerEventView from '../ide/modeleditor/case/elements/timereventview';
import UserEventView from '../ide/modeleditor/case/elements/usereventview';
import ModelEditor from '../ide/modeleditor/modeleditor';

const pointers = [
    // Repository
    ParameterDefinition,

    EntryCriterionDefinition,
    ExitCriterionDefinition,
    ReactivateCriterionDefinition,

    TaskDefinition,

    // IDE
    ModelEditor,

    CaseModelEditor,

    CaseFileItemsEditor,

    Connector,

    // Needed in e.g. ShapeBox and CaseView
    CaseFileItemView,
    CasePlanView,
    CaseTaskView,
    CMMNElementView,
    EventListenerView,
    HumanTaskView,
    MilestoneView,
    PlanItemView,
    PlanningTableView,
    ProcessTaskView,
    SentryView,
    EntryCriterionView,
    ReactivateCriterionView,
    ExitCriterionView,
    StageView,
    TaskStageView,
    TaskView,
    TextAnnotationView,
    TimerEventView,
    UserEventView,

    Halo,
    CasePlanHalo,
    PlanItemHalo,
    PlanningTableHalo,
    EntryCriterionHalo,
    ReactivateCriterionHalo,
    ExitCriterionHalo,
    TaskHalo,
    HumanTaskHalo,

]

export default class Compatibility {
    static registerClasses() {
        console.groupCollapsed("Registering " + pointers.length + " exports");
        pointers.forEach(property => {
            console.log("Registering window." + property.name);
            window[property.name] = property;
        });
        console.groupEnd();
    }

    static loadScriptSync(src) {
        // if (pointers.find(pointer => pointer.name && src.endsWith(pointer.name.toLowerCase() + '.js'))) {
        //     console.log("Skipping script " + src)
        // }
        var s = document.createElement('script');
        s.src = src;
        s.type = "text/javascript";
        s.async = false;                                 // <-- this is important
        document.getElementsByTagName('head')[0].appendChild(s);
    }
}
