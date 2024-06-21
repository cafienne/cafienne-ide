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
import TextAnnotationDefinition from '../repository/definition/artifact/textannotation';
import CaseFileDefinitionDefinition from '../repository/definition/cfid/casefileitemdefinitiondefinition';
import PropertyDefinition from '../repository/definition/cfid/propertydefinition';
import CaseDefinition from '../repository/definition/cmmn/casedefinition';
import CaseFileDefinition from '../repository/definition/cmmn/casefile/casefiledefinition';
import CaseFileItemCollection from '../repository/definition/cmmn/casefile/casefileitemcollection';
import CaseFileItemDef from '../repository/definition/cmmn/casefile/casefileitemdef';
import CasePlanDefinition from '../repository/definition/cmmn/caseplan/caseplandefinition';
import ConstraintDefinition from '../repository/definition/cmmn/caseplan/constraintdefinition';
import EventListenerDefinition from '../repository/definition/cmmn/caseplan/eventlistenerdefinition';
import ItemControlDefinition from '../repository/definition/cmmn/caseplan/itemcontroldefinition';
import MilestoneDefinition from '../repository/definition/cmmn/caseplan/milestonedefinition';
import PlanItem from '../repository/definition/cmmn/caseplan/planitem';
import PlanItemDefinitionDefinition from '../repository/definition/cmmn/caseplan/planitemdefinitiondefinition';
import PlanningTableDefinition from '../repository/definition/cmmn/caseplan/planningtabledefinition';
import StageDefinition from '../repository/definition/cmmn/caseplan/stagedefinition';
import CaseTaskDefinition from '../repository/definition/cmmn/caseplan/task/casetaskdefinition';
import HumanTaskDefinition from '../repository/definition/cmmn/caseplan/task/humantaskdefinition';
import PlanItemReference from '../repository/definition/cmmn/caseplan/task/planitemreference';
import ProcessTaskDefinition from '../repository/definition/cmmn/caseplan/task/processtaskdefinition';
import TaskDefinition from '../repository/definition/cmmn/caseplan/task/taskdefinition';
import AssignmentDefinition from '../repository/definition/cmmn/caseplan/task/workflow/assignmentdefinition';
import CafienneWorkflowDefinition from '../repository/definition/cmmn/caseplan/task/workflow/cafienneworkflowdefinition';
import DueDateDefinition from '../repository/definition/cmmn/caseplan/task/workflow/duedatedefinition';
import FourEyesDefinition from '../repository/definition/cmmn/caseplan/task/workflow/foureyesdefinition';
import RendezVousDefinition from '../repository/definition/cmmn/caseplan/task/workflow/rendezvousdefinition';
import TaskPairingDefinition from '../repository/definition/cmmn/caseplan/task/workflow/taskpairingdefinition';
import TimerEventDefinition from '../repository/definition/cmmn/caseplan/timereventdefinition';
import UserEventDefinition from '../repository/definition/cmmn/caseplan/usereventdefinition';
import CaseRoleDefinition from '../repository/definition/cmmn/caseteam/caseroledefinition';
import CaseRoleReference from '../repository/definition/cmmn/caseteam/caserolereference';
import CaseTeamDefinition from '../repository/definition/cmmn/caseteam/caseteamdefinition';
import ParameterDefinition from '../repository/definition/cmmn/contract/parameterdefinition';
import ExpressionDefinition from '../repository/definition/cmmn/expression/expressiondefinition';
import CaseFileItemOnPartDefinition from '../repository/definition/cmmn/sentry/casefileitemonpartdefinition';
import CriterionDefinition from '../repository/definition/cmmn/sentry/criteriondefinition';
import EntryCriterionDefinition from '../repository/definition/cmmn/sentry/entrycriteriondefinition';
import ExitCriterionDefinition from '../repository/definition/cmmn/sentry/exitcriteriondefinition';
import IfPartDefinition from '../repository/definition/cmmn/sentry/ifpartdefinition';
import OnPartDefinition from '../repository/definition/cmmn/sentry/onpartdefinition';
import PlanItemOnPartDefinition from '../repository/definition/cmmn/sentry/planitemonpartdefinition';
import ReactivateCriterionDefinition from '../repository/definition/cmmn/sentry/reactivatecriteriondefinition';
import SentryDefinition from '../repository/definition/cmmn/sentry/sentrydefinition';
import CMMNDocumentationDefinition from '../repository/definition/cmmndocumentationdefinition';
import CMMNElementDefinition from '../repository/definition/cmmnelementdefinition';
import Dimensions from '../repository/definition/dimensions/dimensions';
import Edge from '../repository/definition/dimensions/edge';
import ShapeDefinition from '../repository/definition/dimensions/shape';
import Tags from '../repository/definition/dimensions/tags';
import ElementDefinition from '../repository/definition/elementdefinition';
import CafienneImplementationDefinition from '../repository/definition/extensions/cafienneimplementationdefinition';
import CMMNExtensionDefinition from '../repository/definition/extensions/cmmnextensiondefinition';
import HumanTaskModelDefinition from '../repository/definition/humantask/humantaskmodeldefinition';
import ModelDefinition from '../repository/definition/modeldefinition';
import ProcessModelDefinition from '../repository/definition/process/processmodeldefinition';
import ReferableElementDefinition from '../repository/definition/referableelementdefinition';
import TypeCounter from '../repository/definition/typecounter';
import UnnamedCMMNElementDefinition from '../repository/definition/unnamedcmmnelementdefinition';
import { CAFIENNE_NAMESPACE, CAFIENNE_PREFIX, EXTENSIONELEMENTS, IMPLEMENTATION_TAG } from '../repository/definition/xmlserializable';
import CaseFile from '../repository/serverfile/casefile';
import CFIDFile from '../repository/serverfile/cfidfile';
import DimensionsFile from '../repository/serverfile/dimensionsfile';
import HumanTaskFile from '../repository/serverfile/humantaskfile';
import ProcessFile from '../repository/serverfile/processfile';
import CodeMirrorConfig from '../util/codemirrorconfig';
import Followup, { andThen, onFail } from '../util/promise/followup';
import FollowupList from '../util/promise/followuplist';
import SequentialFollowupList from '../util/promise/sequentialfollowuplist';
import Util from '../util/util';
import XML from '../util/xml';
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
