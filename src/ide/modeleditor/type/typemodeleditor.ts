'use strict';

import ModelDefinition from "../../../repository/definition/modeldefinition";
import TypeFile from "../../../repository/serverfile/typefile";
import IDE from "../../ide";
import ModelEditor from "../modeleditor";
import ModelEditorMetadata from "../modeleditormetadata";
import TypeEditor from "./editor/typeeditor";
import TypeModelEditorMetadata from "./typemodeleditormetadata";

export default class TypeModelEditor extends ModelEditor {
    typeEditor: TypeEditor;
    static register() {
        ModelEditorMetadata.registerEditorType(new TypeModelEditorMetadata());
    }

    /**
     * This editor handles type models; only validates the xml
     * @param file The ServerFile to be loaded. E.g. 'customer.type', 'order.type'
     */
    constructor(public ide: IDE, public file: TypeFile) {
        super(ide, file);
        this.typeEditor = new TypeEditor(this, this.htmlContainer);
    }

    get label() {
        return 'Edit Type - ' + this.fileName;
    }

    onEscapeKey(e: JQuery.KeyDownEvent) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }
        this.close();
    }

    loadModel() {
        this.typeEditor.setMainType(this.file);
    }
    saveModel(): void {
        throw new Error("Method not implemented.");
    }
    loadDefinition(definition: ModelDefinition | undefined): void {
        throw new Error("Method not implemented.");
    }

}
