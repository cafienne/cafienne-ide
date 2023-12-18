'use strict';

import IDE from "@ide/ide";
import ModelEditor from "../modeleditor";
import TypeFile from "@repository/serverfile/typefile";
import TypeEditor from "./editor/typeeditor";
import ModelEditorMetadata from "../modeleditormetadata";
import TypeModelEditorMetadata from "./typemodeleditormetadata";

export default class TypeModelEditor extends ModelEditor {
    static register() {
        ModelEditorMetadata.registerEditorType(new TypeModelEditorMetadata());
    }

    /**
     * This editor handles type models; only validates the xml
     * @param {IDE} ide 
     * @param {TypeFile} file The ServerFile to be loaded. E.g. 'customer.type', 'order.type'
     */
    constructor(ide, file) {
        super(ide, file);
        this.typeEditor = new TypeEditor(this.ide, file, this.htmlContainer);
    }

    get label() {
        return 'Edit Type - ' + this.fileName;
    }

    onEscapeKey(e) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }
        this.close();
    }

    loadModel() {
        this.typeEditor.loadModel();
    }
}
