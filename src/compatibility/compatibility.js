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
import CasePlanView from '../ide/modeleditor/case/elements/caseplanview';
import Connector from '../ide/modeleditor/case/elements/connector';
import StageView from '../ide/modeleditor/case/elements/stageview';
import TextAnnotationView from '../ide/modeleditor/case/elements/textannotationview';
import ModelEditor from '../ide/modeleditor/modeleditor';
import StageDefinition from '@repository/definition/cmmn/caseplan/stagedefinition';

const pointers = [
    // Repository
    ParameterDefinition,

    EntryCriterionDefinition,
    ExitCriterionDefinition,
    ReactivateCriterionDefinition,

    TaskDefinition,
    StageDefinition,

    // IDE
    ModelEditor,

    CaseModelEditor,

    CaseFileItemsEditor,

    Connector,

    // Needed in e.g. ShapeBox and CaseView
    CasePlanView,
    StageView,
    TextAnnotationView,

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
