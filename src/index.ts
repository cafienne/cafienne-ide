import Compatibility from './compatibility/compatibility';
import IDE from './ide/ide';
import HumantaskModelEditorMetadata from './ide/modeleditor/humantask/humantaskmodeleditormetadata';
import ProcessModelEditorMetadata from './ide/modeleditor/process/processtaskmodeleditormetadata';

//Start initialization after the entire page is loaded
window.addEventListener('load', e => {
    // For now create a global IDE pointer.
    console.log("Creating IDE");

    IDE.registerEditorType(new CaseModelEditorMetadata());
    IDE.registerEditorType(new HumantaskModelEditorMetadata());
    IDE.registerEditorType(new ProcessModelEditorMetadata());

    const ide = new IDE();
    ide.init();
});

Compatibility.registerClasses();
