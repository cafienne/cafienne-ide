import Compatibility from './compatibility/compatibility';
import IDE from './ide/ide';
import CaseModelEditorMetadata from './ide/modeleditor/case/casemodeleditormetadata';
import CaseView from './ide/modeleditor/case/elements/caseview';
import HumantaskModelEditorMetadata from './ide/modeleditor/humantask/humantaskmodeleditormetadata';
import ProcessModelEditorMetadata from './ide/modeleditor/process/processtaskmodeleditormetadata';

//Start initialization after the entire page is loaded
window.addEventListener('load', e => {
    // For now create a global IDE pointer.
    console.log("Registering metadata");

    IDE.registerEditorType(new CaseModelEditorMetadata());
    IDE.registerEditorType(new HumantaskModelEditorMetadata());
    IDE.registerEditorType(new ProcessModelEditorMetadata());

    console.log("Registering view elements");
    CaseView.registerViewElements();

    console.log("Creating IDE");
    const ide = new IDE();
    ide.init();
});

Compatibility.registerClasses();
