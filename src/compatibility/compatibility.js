import TextAnnotationDefinition from '@definition/artifact/textannotation';
import CaseFileDefinitionDefinition from '@definition/cfid/casefileitemdefinitiondefinition';
import PropertyDefinition from '@definition/cfid/propertydefinition';
import CaseDefinition from '@definition/cmmn/casedefinition';
import CaseFileDefinition from '@definition/cmmn/casefile/casefiledefinition';
import CaseFileItemCollection from '@definition/cmmn/casefile/casefileitemcollection';
import CaseFileItemDef from '@definition/cmmn/casefile/casefileitemdef';
import CasePlanDefinition from '@definition/cmmn/caseplan/caseplandefinition';
import ConstraintDefinition from '@definition/cmmn/caseplan/constraintdefinition';
import EventListenerDefinition from '@definition/cmmn/caseplan/eventlistenerdefinition';
import ItemControlDefinition from '@definition/cmmn/caseplan/itemcontroldefinition';
import MilestoneDefinition from '@definition/cmmn/caseplan/milestonedefinition';
import PlanItem from '@definition/cmmn/caseplan/planitem';
import PlanItemDefinitionDefinition from '@definition/cmmn/caseplan/planitemdefinitiondefinition';
import PlanningTableDefinition from '@definition/cmmn/caseplan/planningtabledefinition';
import StageDefinition from '@definition/cmmn/caseplan/stagedefinition';
import CaseTaskDefinition from '@definition/cmmn/caseplan/task/casetaskdefinition';
import HumanTaskDefinition from '@definition/cmmn/caseplan/task/humantaskdefinition';
import PlanItemReference from '@definition/cmmn/caseplan/task/planitemreference';
import ProcessTaskDefinition from '@definition/cmmn/caseplan/task/processtaskdefinition';
import TaskDefinition from '@definition/cmmn/caseplan/task/taskdefinition';
import AssignmentDefinition from '@definition/cmmn/caseplan/task/workflow/assignmentdefinition';
import CafienneWorkflowDefinition from '@definition/cmmn/caseplan/task/workflow/cafienneworkflowdefinition';
import DueDateDefinition from '@definition/cmmn/caseplan/task/workflow/duedatedefinition';
import FourEyesDefinition from '@definition/cmmn/caseplan/task/workflow/foureyesdefinition';
import RendezVousDefinition from '@definition/cmmn/caseplan/task/workflow/rendezvousdefinition';
import TaskPairingDefinition from '@definition/cmmn/caseplan/task/workflow/taskpairingdefinition';
import TimerEventDefinition from '@definition/cmmn/caseplan/timereventdefinition';
import UserEventDefinition from '@definition/cmmn/caseplan/usereventdefinition';
import CaseRoleDefinition from '@definition/cmmn/caseteam/caseroledefinition';
import CaseRoleReference from '@definition/cmmn/caseteam/caserolereference';
import CaseTeamDefinition from '@definition/cmmn/caseteam/caseteamdefinition';
import ParameterDefinition from '@definition/cmmn/contract/parameterdefinition';
import ExpressionDefinition from '@definition/cmmn/expression/expressiondefinition';
import CaseFileItemOnPartDefinition from '@definition/cmmn/sentry/casefileitemonpartdefinition';
import CriterionDefinition from '@definition/cmmn/sentry/criteriondefinition';
import EntryCriterionDefinition from '@definition/cmmn/sentry/entrycriteriondefinition';
import ExitCriterionDefinition from '@definition/cmmn/sentry/exitcriteriondefinition';
import IfPartDefinition from '@definition/cmmn/sentry/ifpartdefinition';
import OnPartDefinition from '@definition/cmmn/sentry/onpartdefinition';
import PlanItemOnPartDefinition from '@definition/cmmn/sentry/planitemonpartdefinition';
import ReactivateCriterionDefinition from '@definition/cmmn/sentry/reactivatecriteriondefinition';
import SentryDefinition from '@definition/cmmn/sentry/sentrydefinition';
import CMMNDocumentationDefinition from '@definition/cmmndocumentationdefinition';
import CMMNElementDefinition from '@definition/cmmnelementdefinition';
import Dimensions from '@definition/dimensions/dimensions';
import Edge from '@definition/dimensions/edge';
import ShapeDefinition from '@definition/dimensions/shape';
import Tags from '@definition/dimensions/tags';
import ElementDefinition from '@definition/elementdefinition';
import CafienneImplementationDefinition from '@definition/extensions/cafienneimplementationdefinition';
import CMMNExtensionDefinition from '@definition/extensions/cmmnextensiondefinition';
import HumanTaskModelDefinition from '@definition/humantask/humantaskmodeldefinition';
import ModelDefinition from '@definition/modeldefinition';
import ProcessModelDefinition from '@definition/process/processmodeldefinition';
import ReferableElementDefinition from '@definition/referableelementdefinition';
import TypeCounter from '@definition/typecounter';
import UnnamedCMMNElementDefinition from '@definition/unnamedcmmnelementdefinition';
import { CAFIENNE_NAMESPACE, CAFIENNE_PREFIX, EXTENSIONELEMENTS, IMPLEMENTATION_TAG } from '@definition/xmlserializable';
import CaseFileItemHalo from '@ide/modeleditor/case/elements/halo/casefileitemhalo';
import CasePlanHalo from '@ide/modeleditor/case/elements/halo/caseplanhalo';
import Halo from '@ide/modeleditor/case/elements/halo/halo';
import PlanItemHalo from '@ide/modeleditor/case/elements/halo/planitemhalo';
import PlanningTableHalo from '@ide/modeleditor/case/elements/halo/planningtablehalo';
import { EntryCriterionHalo, ExitCriterionHalo, ReactivateCriterionHalo } from '@ide/modeleditor/case/elements/halo/sentryhalo';
import TaskHalo, { HumanTaskHalo } from '@ide/modeleditor/case/elements/halo/taskhalo';
import CaseFile from '@repository/serverfile/casefile';
import CFIDFile from '@repository/serverfile/cfidfile';
import DimensionsFile from '@repository/serverfile/dimensionsfile';
import HumanTaskFile from '@repository/serverfile/humantaskfile';
import ProcessFile from '@repository/serverfile/processfile';
import CodeMirrorConfig from '@util/codemirrorconfig';
import Followup, { andThen, onFail } from '@util/promise/followup';
import FollowupList from '@util/promise/followuplist';
import SequentialFollowupList from '@util/promise/sequentialfollowuplist';
import Util from '@util/util';
import XML from '@util/xml';
import CreateNewModelDialog from '../ide/createnewmodeldialog';
import Debugger from '../ide/debugger/debugger';
import DragData, { CaseFileItemDragData } from '../ide/dragdata';
import Dialog from '../ide/editors/dialog';
import MovableEditor from '../ide/editors/movableeditor';
import StandardForm from '../ide/editors/standardform';
import IDE from '../ide/ide';
import CaseModelEditor from '../ide/modeleditor/case/casemodeleditor';
import CaseModelEditorMetadata from '../ide/modeleditor/case/casemodeleditormetadata';
import CaseFileItemsEditor from '../ide/modeleditor/case/editors/casefileitemseditor';
import CaseSourceEditor from '../ide/modeleditor/case/editors/casesourceeditor';
import Deploy from '../ide/modeleditor/case/editors/deploy';
import CaseParametersEditor from '../ide/modeleditor/case/editors/parameters/caseparameterseditor';
import RolesEditor from '../ide/modeleditor/case/editors/roleseditor';
import StartCaseEditor from '../ide/modeleditor/case/editors/startcaseeditor';
import ColumnRenderer from '../ide/modeleditor/case/editors/tableeditor/columnrenderer';
import RowRenderer from '../ide/modeleditor/case/editors/tableeditor/rowrenderer';
import TableEditor, { RowEditor } from '../ide/modeleditor/case/editors/tableeditor/tableeditor';
import TableRenderer from '../ide/modeleditor/case/editors/tableeditor/tablerenderer';
import BindingRefinementEditor from '../ide/modeleditor/case/editors/task/bindingrefinementeditor';
import CanvasElement from '../ide/modeleditor/case/elements/canvaselement';
import CaseFileItemView from '../ide/modeleditor/case/elements/casefileitemview';
import CasePlanView from '../ide/modeleditor/case/elements/caseplanview';
import CaseTaskView from '../ide/modeleditor/case/elements/casetaskview';
import CaseView from '../ide/modeleditor/case/elements/caseview';
import CMMNElementView from '../ide/modeleditor/case/elements/cmmnelementview';
import Connector, { TemporaryConnector } from '../ide/modeleditor/case/elements/connector';
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
import Grid from '../ide/modeleditor/case/grid';
import Marker from '../ide/modeleditor/case/marker';
import Resizer from '../ide/modeleditor/case/resizer';
import ShapeBox from '../ide/modeleditor/case/shapebox';
import Action from '../ide/modeleditor/case/undoredo/action';
import UndoManager from '../ide/modeleditor/case/undoredo/undoredo';
import UndoRedoBox from "../ide/modeleditor/case/undoredo/undoredobox";
import CaseFileItemDefinitionEditor from '../ide/modeleditor/cfid/casefileitemdefinitioneditor';
import ModelEditor from '../ide/modeleditor/modeleditor';
import ModelEditorMetadata from '../ide/modeleditor/modeleditormetadata';
import ModelListPanel from '../ide/modellistpanel';
import RepositoryBrowser from '../ide/repositorybrowser';
import Settings from '../ide/settings/settings';
import SettingsStorage from '../ide/settings/settingsstorage';
import BottomSplitter from '../ide/splitter/bottomsplitter';
import HorizontalSplitter from '../ide/splitter/horizontalsplitter';
import LeftSplitter from '../ide/splitter/leftsplitter';
import RightSplitter from '../ide/splitter/rightsplitter';
import Splitter from '../ide/splitter/splitter';
import SplitterSettings from '../ide/splitter/splittersettings';
import TopSplitter from '../ide/splitter/topsplitter';
import VerticalSplitter from '../ide/splitter/verticalsplitter';
import ValidateForm from '../validate/validateform';
import Validator from '../validate/validator';
import ClassicScripts from './classicscripts';
import InputMappingDefinition from '@repository/definition/cmmn/contract/inputmappingdefinition';
import OutputMappingDefinition from '@repository/definition/cmmn/contract/outputmappingdefinition';
import ParameterMappingDefinition from '@repository/definition/cmmn/contract/parametermappingdefinition';

const pointers = [
    // Util
    Util,
    XML,
    CodeMirrorConfig,
    Followup,
    FollowupList,
    SequentialFollowupList,
    andThen,
    onFail,

    // Repository
    CaseFile,
    CFIDFile,
    DimensionsFile,
    HumanTaskFile,
    ProcessFile,
    ElementDefinition,
    TypeCounter,
    ModelDefinition,
    CMMNDocumentationDefinition,
    ReferableElementDefinition,
    CMMNElementDefinition,
    UnnamedCMMNElementDefinition,
    CMMNExtensionDefinition,
    CafienneImplementationDefinition,
    TextAnnotationDefinition,

    ParameterMappingDefinition,
    InputMappingDefinition,
    OutputMappingDefinition,
    
    CaseDefinition,
    CaseFileItemCollection,
    CaseFileItemDef,
    CaseFileDefinition,
    CaseTeamDefinition,
    CaseRoleDefinition,
    CaseRoleReference,
    ExpressionDefinition,
    ParameterDefinition,
    ConstraintDefinition,
    SentryDefinition,
    CriterionDefinition,
    IfPartDefinition,
    OnPartDefinition,
    PlanItemOnPartDefinition,
    CaseFileItemOnPartDefinition,
    EntryCriterionDefinition,
    ExitCriterionDefinition,
    ReactivateCriterionDefinition,

    AssignmentDefinition,
    CafienneWorkflowDefinition,
    DueDateDefinition,
    FourEyesDefinition,
    RendezVousDefinition,
    TaskPairingDefinition,
    CaseTaskDefinition,
    HumanTaskDefinition,
    PlanItemReference,
    ProcessTaskDefinition,
    TaskDefinition,
    CasePlanDefinition,
    EventListenerDefinition,
    ItemControlDefinition,
    MilestoneDefinition,
    PlanItemDefinitionDefinition,
    PlanningTableDefinition,
    StageDefinition,
    TimerEventDefinition,
    UserEventDefinition,
    PlanItem,

    Dimensions,
    Edge,
    ShapeDefinition,
    Tags,

    CaseFileDefinitionDefinition,
    PropertyDefinition,

    HumanTaskModelDefinition,

    ProcessModelDefinition,

    // IDE
    IDE,
    MovableEditor,
    StandardForm,
    ModelEditor,
    ModelEditorMetadata,
    CaseFileItemDefinitionEditor,
    Dialog,
    CreateNewModelDialog,
    DragData,
    CaseFileItemDragData,
    Settings,
    SettingsStorage,
    ModelListPanel,
    RepositoryBrowser,
    SplitterSettings,
    Splitter,
    HorizontalSplitter,
    LeftSplitter,
    RightSplitter,
    VerticalSplitter,
    BottomSplitter,
    TopSplitter,
    Validator,
    ValidateForm,
    Debugger,

    UndoManager,
    UndoRedoBox,
    Action,
    CaseModelEditor,
    CaseModelEditorMetadata,
    Grid,
    Marker,
    Resizer,
    ShapeBox,

    CaseParametersEditor,
    TableRenderer,
    TableEditor,
    ColumnRenderer,
    RowRenderer,
    CaseFileItemsEditor,
    CaseSourceEditor,
    Deploy,
    RolesEditor,
    RowEditor,
    StartCaseEditor,

    CanvasElement,
    Connector,
    TemporaryConnector,
    CaseView,
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
    BindingRefinementEditor,

    Halo,
    CaseFileItemHalo,
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

        this.registerConstants();

        ClassicScripts.include();
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

    static registerConstants() {
        window.EXTENSIONELEMENTS = EXTENSIONELEMENTS;
        window.CAFIENNE_NAMESPACE = CAFIENNE_NAMESPACE;
        window.CAFIENNE_PREFIX = CAFIENNE_PREFIX;
        window.IMPLEMENTATION_TAG = IMPLEMENTATION_TAG;
    }
}
