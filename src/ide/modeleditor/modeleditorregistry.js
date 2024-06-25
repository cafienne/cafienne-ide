
// BIG TODO HERE - the order of import (first ElementRegistry, then CaseModelEditorMetadata) is import for the code not to cause an issue.

import ElementRegistry from "./case/elements/elementregistry";
import CaseModelEditorMetadata from "./case/casemodeleditormetadata";
import HumantaskModelEditorMetadata from "./humantask/humantaskmodeleditormetadata";
import ProcessModelEditorMetadata from "./process/processtaskmodeleditormetadata";
import IDE from "@ide/ide";

export default class ModelEditorRegistry {
    static initialize() {
        IDE.registerEditorType(new CaseModelEditorMetadata());
        IDE.registerEditorType(new HumantaskModelEditorMetadata());
        IDE.registerEditorType(new ProcessModelEditorMetadata());
        ElementRegistry.initialize();
    }
}