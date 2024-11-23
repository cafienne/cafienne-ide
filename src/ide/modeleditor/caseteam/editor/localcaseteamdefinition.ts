import CaseTeamModelDefinition from "../../../../repository/definition/caseteam/caseteammodeldefinition";
import CaseTeamFile from "../../../../repository/serverfile/caseteamfile";
import CaseTeamEditor from "./caseteameditor";
import CaseTeamRenderer from "./caseteamrenderer";
import MainCaseTeamDefinition from "./maincaseteamdefinition";

export default class LocalCaseTeamDefinition {
    definition: CaseTeamModelDefinition;

    constructor(public editor: CaseTeamEditor, public file: CaseTeamFile, public root?: MainCaseTeamDefinition) {
        if (!file.definition) {
            throw new Error('We need a definition for this');
        }
        this.definition = file.definition;
    }

    async save(source?: CaseTeamRenderer): Promise<void> {
        this.file.source = this.definition.toXML();
        CaseTeamRenderer.refreshOthers(source);
        return this.file.save().then();
    }

    registerLocalDefinition(file: CaseTeamFile): LocalCaseTeamDefinition | undefined {
        return this.root?.registerLocalDefinition(file);
    }

    sameFile(other: LocalCaseTeamDefinition) {
        return other && this.file.fileName === other.file.fileName;
    }
}
