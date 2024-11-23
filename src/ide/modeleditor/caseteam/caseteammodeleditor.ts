'use strict';

import IDE from "@ide/ide";
import CaseTeamFile from "@repository/serverfile/caseteamfile";
import ModelEditor from "../modeleditor";
import ModelEditorMetadata from "../modeleditormetadata";
import CaseTeamEditor from "./editor/caseteameditor";
import TeamModelEditorMetadata from "./caseteammodeleditormetadata";

export default class TeamModelEditor extends ModelEditor {
    teamEditor: CaseTeamEditor;
    static register() {
        ModelEditorMetadata.registerEditorType(new TeamModelEditorMetadata());
    }

    /**
     * This editor handles type models; only validates the xml
     * @param {IDE} ide 
     * @param {TypeFile} file The ServerFile to be loaded. E.g. 'customer.type', 'order.type'
     */
    constructor(public ide: IDE, public file: CaseTeamFile) {
        super(ide, file);
        this.teamEditor = new CaseTeamEditor(this, this.htmlContainer);
    }

    get label() {
        return 'Edit Team - ' + this.fileName;
    }

    onEscapeKey(e: JQuery.KeyDownEvent) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }
        this.close();
    }

    loadModel() {
        this.teamEditor.setMainCaseTeam(this.file);
    }
}
