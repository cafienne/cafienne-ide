import SplitterSettings from './ide/splitter/splittersettings';
import CreateNewModelDialog from './ide/createnewmodeldialog';
import DragData, { CaseFileItemDragData } from './ide/dragdata';
import Dialog from './ide/editors/dialog';
import MovableEditor from './ide/editors/movableeditor';
import StandardForm from './ide/editors/standardform';
import IDE from './ide/ide';
import ModelListPanel from './ide/modellistpanel';
import RepositoryBrowser from './ide/repositorybrowser';
import Settings from './ide/settings/settings';
import SettingsStorage from './ide/settings/settingsstorage';
import CodeMirrorConfig from './util/codemirrorconfig';
import Followup, { andThen, onFail } from './util/promise/followup';
import FollowupList from './util/promise/followuplist';
import SequentialFollowupList from './util/promise/sequentialfollowuplist';
import Util from './util/util';
import XML from './util/xml';
import Splitter from './ide/splitter/splitter';
import HorizontalSplitter from './ide/splitter/horizontalsplitter';
import LeftSplitter from './ide/splitter/leftsplitter';
import RightSplitter from './ide/splitter/rightsplitter';
import VerticalSplitter from './ide/splitter/verticalsplitter';
import BottomSplitter from './ide/splitter/bottomsplitter';
import TopSplitter from './ide/splitter/topsplitter';
import XMLElementDefinition, { CAFIENNE_NAMESPACE, CAFIENNE_PREFIX, EXTENSIONELEMENTS, IMPLEMENTATION_TAG } from './repository/definition/xmlelementdefinition';
import CMMNDocumentationDefinition from './repository/definition/cmmn/definitions/cmmndocumentationdefinition';
import ReferableElementDefinition from './repository/definition/referableelementdefinition';
import CMMNElementDefinition from './repository/definition/cmmn/definitions/cmmnelementdefinition';
import UnnamedCMMNElementDefinition from './repository/definition/cmmn/definitions/unnamedcmmnelementdefinition';
import CMMNExtensionDefinition from './repository/definition/cmmn/definitions/extensions/cmmnextensiondefinition';
import CafienneImplementationDefinition from './repository/definition/cmmn/definitions/extensions/cafienneimplementationdefinition';
import ArtifactDefinition from './repository/definition/cmmn/definitions/artifact/artifactdefinition';
import TextAnnotationDefinition from './repository/definition/cmmn/definitions/artifact/textannotation';
import Importer from './repository/importer';
import Repository from './repository/repository';
import ProcessFile from './repository/serverfile/processfile';
import HumanTaskFile from './repository/serverfile/humantaskfile';
import DimensionsFile from './repository/serverfile/dimensionsfile';
import CFIDFile from './repository/serverfile/cfidfile';
import CaseFile from './repository/serverfile/casefile';
import ServerFile from './repository/serverfile';
import Content from './repository/content';
import Metadata from './repository/metadata';
import CaseRoleReference from './repository/definition/cmmn/definitions/caseteam/caserolereference';
import CaseRoleDefinition from './repository/definition/cmmn/definitions/caseteam/caseroledefinition';
import CaseTeamDefinition from './repository/definition/cmmn/definitions/caseteam/caseteamdefinition';
import UserEventDefinition from './repository/definition/cmmn/definitions/caseplan/usereventdefinition';
import TimerEventDefinition from './repository/definition/cmmn/definitions/caseplan/timereventdefinition';
import EventListenerDefinition from './repository/definition/cmmn/definitions/caseplan/eventlistenerdefinition';
import MilestoneDefinition from './repository/definition/cmmn/definitions/caseplan/milestonedefinition';
import CasePlanDefinition from './repository/definition/cmmn/definitions/caseplan/caseplandefinition';
import ProcessTaskDefinition from './repository/definition/cmmn/definitions/caseplan/task/processtaskdefinition';
import RendezVousDefinition from './repository/definition/cmmn/definitions/caseplan/task/workflow/rendezvousdefinition';
import FourEyesDefinition from './repository/definition/cmmn/definitions/caseplan/task/workflow/foureyesdefinition';
import TaskPairingDefinition from './repository/definition/cmmn/definitions/caseplan/task/workflow/taskpairingdefinition';
import DueDateDefinition from './repository/definition/cmmn/definitions/caseplan/task/workflow/duedatedefinition';
import AssignmentDefinition from './repository/definition/cmmn/definitions/caseplan/task/workflow/assignmentdefinition';
import PlanItemReference from './repository/definition/cmmn/definitions/caseplan/task/planitemreference';
import HumanTaskDefinition from './repository/definition/cmmn/definitions/caseplan/task/humantaskdefinition';
import CaseTaskDefinition from './repository/definition/cmmn/definitions/caseplan/task/casetaskdefinition';
import CafienneWorkflowDefinition from './repository/definition/cmmn/definitions/caseplan/task/workflow/cafienneworkflowdefinition';
import TaskDefinition from './repository/definition/cmmn/definitions/caseplan/task/taskdefinition';
import StageDefinition from './repository/definition/cmmn/definitions/caseplan/stagedefinition';
import PlanningTableDefinition from './repository/definition/cmmn/definitions/caseplan/planningtabledefinition';
import PlanItemDefinitionDefinition from './repository/definition/cmmn/definitions/caseplan/planitemdefinitiondefinition';
import ItemControlDefinition from './repository/definition/cmmn/definitions/caseplan/itemcontroldefinition';
import CaseFileItemOnPartDefinition from './repository/definition/cmmn/definitions/sentry/casefileitemonpartdefinition';
import PlanItemOnPartDefinition from './repository/definition/cmmn/definitions/sentry/planitemonpartdefinition';
import OnPartDefinition from './repository/definition/cmmn/definitions/sentry/onpartdefinition';
import IfPartDefinition from './repository/definition/cmmn/definitions/sentry/ifpartdefinition';
import ExitCriterionDefinition from './repository/definition/cmmn/definitions/sentry/exitcriteriondefinition';
import ReactivateCriterionDefinition from './repository/definition/cmmn/definitions/sentry/reactivatecriteriondefinition';
import EntryCriterionDefinition from './repository/definition/cmmn/definitions/sentry/entrycriteriondefinition';
import CriterionDefinition from './repository/definition/cmmn/definitions/sentry/criteriondefinition';
import SentryDefinition from './repository/definition/cmmn/definitions/sentry/sentrydefinition';
import ConstraintDefinition from './repository/definition/cmmn/definitions/caseplan/constraintdefinition';
import PlanItem from './repository/definition/cmmn/definitions/caseplan/planitem';
import ParameterMappingDefinition from './repository/definition/cmmn/definitions/contract/parametermappingdefinition';
import ParameterDefinition from './repository/definition/cmmn/definitions/contract/parameterdefinition';
import CaseFileItemDef from './repository/definition/cmmn/definitions/casefile/casefileitemdef';
import CaseFileDefinition from './repository/definition/cmmn/definitions/casefile/casefiledefinition';
import CaseFileItemCollection from './repository/definition/cmmn/definitions/casefile/casefileitemcollection';
import ExpressionDefinition from './repository/definition/cmmn/definitions/expression/expressiondefinition';
import CaseDefinition from './repository/definition/cmmn/definitions/casedefinition';
import Vertex from './repository/definition/cmmn/dimensions/vertex';
import ShapeDefinition from './repository/definition/cmmn/dimensions/shape';
import Edge from './repository/definition/cmmn/dimensions/edge';
import ConnectorStyle from './repository/definition/cmmn/dimensions/connectorstyle';
import Bounds from './repository/definition/cmmn/dimensions/bounds';
import Diagram from './repository/definition/cmmn/dimensions/diagram';
import DiagramElement from './repository/definition/cmmn/dimensions/diagramelement';
import Dimensions, { BOUNDS, CMMNDI, CMMNDIAGRAM, CMMNEDGE, CMMNELEMENTREF, CMMNSHAPE, DIMENSIONS, SOURCECMMNELEMENTREF, TARGETCMMNELEMENTREF, WAYPOINT } from './repository/definition/cmmn/dimensions/dimensions';
import TypeCounter from './repository/definition/typecounter';
import ModelDefinition from './repository/definition/modeldefinition';
import HumanTaskModelDefinition from './repository/definition/humantask/humantaskmodeldefinition';
import HumanTaskModelElementDefinition from './repository/definition/humantask/humantaskmodelelementdefinition';
import HumanTaskImplementationDefinition from './repository/definition/humantask/humantaskimplementationdefinition';
import TaskModelDefinition from './repository/definition/humantask/taskmodeldefinition';
import ProcessModelDefinition, { CALCULATION_DEFINITION, CALCULATION_DEFINITION_IMPLEMENTATION_CLASS, CUSTOM_IMPLEMENTATION_DEFINITION, CUSTOM_IMPLEMENTATION_DEFINITION_IMPLEMENTATION_CLASS, HTTP_CALL_DEFINITION, HTTP_CALL_DEFINITION_IMPLEMENTATION_CLASS, MAIL_DEFINITION, MAIL_DEFINITION_IMPLEMENTATION_CLASS, PDF_REPORT_DEFINITION, PDF_REPORT_DEFINITION_IMPLEMENTATION_CLASS } from './repository/definition/process/processmodeldefinition';
import ProcessImplementationDefinition from './repository/definition/process/processimplementationdefinition';
import PropertyDefinition from './repository/definition/cfid/propertydefinition';
import CaseFileDefinitionDefinition, { UNKNOWN, UNKNOWN_URI, UNSPECIFIED, UNSPECIFIED_URI, XMLELEMENT, XMLELEMENT_URI } from './repository/definition/cfid/casefileitemdefinitiondefinition';

const pointers = [
    IDE,
    Util,
    XML,
    CodeMirrorConfig,
    Followup,
    FollowupList,
    SequentialFollowupList,
    andThen,
    onFail,
    MovableEditor,
    StandardForm,
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
    XMLElementDefinition,
    CMMNDocumentationDefinition,
    ReferableElementDefinition,
    CMMNElementDefinition,
    UnnamedCMMNElementDefinition,
    CMMNExtensionDefinition,
    CafienneImplementationDefinition,
    ArtifactDefinition,
    TextAnnotationDefinition,
    ModelDefinition,
    TypeCounter,
    Dimensions,
    DiagramElement,
    Diagram,
    Bounds,
    ConnectorStyle,
    Edge,
    ShapeDefinition,
    Vertex,
    CaseDefinition,
    ExpressionDefinition,
    CaseFileItemCollection,
    CaseFileDefinition,
    CaseFileItemDef,
    ParameterDefinition,
    ParameterMappingDefinition,
    PlanItem,
    ConstraintDefinition,
    SentryDefinition,
    CriterionDefinition,
    EntryCriterionDefinition,
    ReactivateCriterionDefinition,
    ExitCriterionDefinition,
    IfPartDefinition,
    OnPartDefinition,
    PlanItemOnPartDefinition,
    CaseFileItemOnPartDefinition,
    ItemControlDefinition,
    PlanItemDefinitionDefinition,
    PlanningTableDefinition,
    StageDefinition,
    TaskDefinition,
    CafienneWorkflowDefinition,
    CaseTaskDefinition,
    HumanTaskDefinition,
    PlanItemReference,
    AssignmentDefinition,
    DueDateDefinition,
    TaskPairingDefinition,
    FourEyesDefinition,
    RendezVousDefinition,
    ProcessTaskDefinition,
    CasePlanDefinition,
    MilestoneDefinition,
    EventListenerDefinition,
    TimerEventDefinition,
    UserEventDefinition,
    CaseTeamDefinition,
    CaseRoleDefinition,
    CaseRoleReference,
    Metadata,
    Content,
    ServerFile,
    CaseFile,
    CFIDFile,
    DimensionsFile,
    HumanTaskFile,
    ProcessFile,
    Repository,
    Importer,
    HumanTaskModelDefinition,
    HumanTaskModelElementDefinition,
    HumanTaskImplementationDefinition,
    TaskModelDefinition,
    ProcessModelDefinition,
    ProcessImplementationDefinition,
    CaseFileDefinitionDefinition,
    PropertyDefinition,
    HTTP_CALL_DEFINITION,
    HTTP_CALL_DEFINITION_IMPLEMENTATION_CLASS,
    CALCULATION_DEFINITION,
    CALCULATION_DEFINITION_IMPLEMENTATION_CLASS,
    MAIL_DEFINITION,
    MAIL_DEFINITION_IMPLEMENTATION_CLASS,
    PDF_REPORT_DEFINITION,
    PDF_REPORT_DEFINITION_IMPLEMENTATION_CLASS,
    CUSTOM_IMPLEMENTATION_DEFINITION,
    CUSTOM_IMPLEMENTATION_DEFINITION_IMPLEMENTATION_CLASS,
    EXTENSIONELEMENTS,
    CAFIENNE_NAMESPACE,
    CAFIENNE_PREFIX,
    IMPLEMENTATION_TAG,
    DIMENSIONS,
    CMMNDI,
    CMMNDIAGRAM,
    CMMNSHAPE,
    CMMNEDGE,
    BOUNDS,
    WAYPOINT,
    CMMNELEMENTREF,
    SOURCECMMNELEMENTREF,
    TARGETCMMNELEMENTREF,
    UNSPECIFIED,
    UNSPECIFIED_URI,
    XMLELEMENT,
    XMLELEMENT_URI,    
    UNKNOWN,
    UNKNOWN_URI,
    
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
}
/*

*/