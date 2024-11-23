import CaseTeamFile from "@repository/serverfile/caseteamfile";
import LocalCaseTeamDefinition from "./localcaseteamdefinition";
import CaseTeamEditor from "./caseteameditor";

export default class MainCaseTeamDefinition extends LocalCaseTeamDefinition {
    files: any = {};

    constructor(editor: CaseTeamEditor, file: CaseTeamFile) {
        super(editor, file, undefined);
        this.root = this; // Cannot set root through super.
        // First register ourselves
        this.files[file.fileName] = new LocalCaseTeamDefinition(this.editor, file, this);
    }

    get xml() {
        return this.definition.toXML();
    }

    registerLocalDefinition(file: CaseTeamFile): LocalCaseTeamDefinition | undefined {
        if (!file) {
            console.warn('Trying to register a local team without passing a file ...');
            return;
        }
        if (!this.files[file.fileName]) {
            this.files[file.fileName] = new LocalCaseTeamDefinition(this.editor, file, this);
        }
        return this.files[file.fileName];
    }
}
