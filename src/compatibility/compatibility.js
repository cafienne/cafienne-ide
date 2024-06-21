import CreateNewModelDialog from '../ide/createnewmodeldialog';
import Debugger from '../ide/debugger/debugger';
import DragData, { CaseFileItemDragData } from '../ide/dragdata';
import Dialog from '../ide/editors/dialog';
import MovableEditor from '../ide/editors/movableeditor';
import StandardForm from '../ide/editors/standardform';
import IDE from '../ide/ide';
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
import CaseFileDefinitionDefinition, { UNKNOWN, UNKNOWN_URI, UNSPECIFIED, UNSPECIFIED_URI, XMLELEMENT, XMLELEMENT_URI } from '../repository/definition/cfid/casefileitemdefinitiondefinition';
import PropertyDefinition from '../repository/definition/cfid/propertydefinition';
import CaseDefinition from '../repository/definition/cmmn/casedefinition';
import CaseFileDefinition from '../repository/definition/cmmn/casefile/casefiledefinition';
import CaseFileItemCollection from '../repository/definition/cmmn/casefile/casefileitemcollection';
import CaseFileItemDef from '../repository/definition/cmmn/casefile/casefileitemdef';
import CaseRoleDefinition from '../repository/definition/cmmn/caseteam/caseroledefinition';
import CaseRoleReference from '../repository/definition/cmmn/caseteam/caserolereference';
import CaseTeamDefinition from '../repository/definition/cmmn/caseteam/caseteamdefinition';
import ParameterDefinition from '../repository/definition/cmmn/contract/parameterdefinition';
import ExpressionDefinition from '../repository/definition/cmmn/expression/expressiondefinition';
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

        window.UNSPECIFIED = UNSPECIFIED;
        window.UNSPECIFIED_URI = UNSPECIFIED_URI;
        window.XMLELEMENT = XMLELEMENT;
        window.XMLELEMENT_URI = XMLELEMENT_URI;
        window.UNKNOWN = UNKNOWN;
        window.UNKNOWN_URI = UNKNOWN_URI;
    }
}
