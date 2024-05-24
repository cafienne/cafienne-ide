import MovableEditor from './ide/editors/movableeditor';
import StandardForm from './ide/editors/standardform';
import IDE from './ide/ide';
import CodeMirrorConfig from './util/codemirrorconfig';
import Followup, { andThen, onFail } from './util/promise/followup';
import FollowupList from './util/promise/followuplist';
import SequentialFollowupList from './util/promise/sequentialfollowuplist';
import Util from './util/util';
import XML from './util/xml';

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
]

export default class Compatibility {
    static registerClasses() {

        const registerPointer = (property) => {
            console.log("Registering window." + property.name);
            window[property.name] = property;
        }

        pointers.forEach(registerPointer);        
    }
}
