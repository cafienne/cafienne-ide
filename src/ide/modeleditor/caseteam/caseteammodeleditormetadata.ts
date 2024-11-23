import IDE from "@ide/ide";
import ModelDefinition from "@repository/definition/modeldefinition";
import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition"; 
import ServerFile from "@repository/serverfile/serverfile";
import CaseTeamFile from "@repository/serverfile/caseteamfile";
import Shapes from "@util/images/shapes";
import ModelEditorMetadata from "../modeleditormetadata";
import CaseTeamModelEditor from "./caseteammodeleditor";

export default class CaseTeamModelEditorMetadata extends ModelEditorMetadata {
    get modelList() {
        return this.ide?.repository.getCaseTeams() || [];
    }

    supportsFile(file: ServerFile<ModelDefinition>) {
        return file instanceof CaseTeamFile;
    }

    createEditor(ide: IDE, file: CaseTeamFile) {
        return new CaseTeamModelEditor(ide, file);
    }

    get fileType() {
        return 'caseteam';
    }

    get icon() {
        return Shapes.CaseTeam;
    }

    get description() {
        return 'Case Teams';
    }

    /**
     * Create a new TypeDefinition model with given name and description 
     */
    async createNewModel(ide: IDE, name: string, description: string) {
        const fileName = name + '.caseteam';
        const file = ide.repository.createCaseTeamFile(fileName, CaseTeamModelDefinition.createDefinitionSource(name));
        await file.save();
        await file.parse();
        return fileName;
    }
}
