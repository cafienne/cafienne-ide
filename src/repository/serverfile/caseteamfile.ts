import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition";
import ServerFile from "./serverfile";

export default class CaseTeamFile extends ServerFile<CaseTeamModelDefinition> {
    createModelDefinition() {
        return new CaseTeamModelDefinition(this);
    }
}
