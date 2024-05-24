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
]

export default class Compatibility {
    static registerClasses() {
        console.groupCollapsed("Registering " + pointers.length +" exports");
        pointers.forEach(property => {
            console.log("Registering window." + property.name);
            window[property.name] = property;
        });        
        console.groupEnd();
    }
}
