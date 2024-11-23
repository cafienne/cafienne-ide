import CaseTeamFile from "@repository/serverfile/caseteamfile";
import Util from "@util/util";
import ModelDefinition from "../modeldefinition";
import CaseTeamRoleDefinition from "./caseteamroledefinition";

export default class CaseTeamModelDefinition extends ModelDefinition {
    static TAG: string = 'caseteam';
    public roles: CaseTeamRoleDefinition[];

    static createDefinitionSource(name: string) {
        return `<caseteam id="${name + '.caseteam'}" name="${name}"></caseteam>`;
    }

    constructor(public file: CaseTeamFile) {
        super(file);
        this.roles = this.parseElements('role', CaseTeamRoleDefinition);
    }

    createCaseRole(name: string = '', documentation = ''): CaseTeamRoleDefinition {
        const caseRole: CaseTeamRoleDefinition = this.createDefinition(CaseTeamRoleDefinition);
        caseRole.name = name;
        this.roles.push(caseRole);
        return caseRole;
    }

    createExportNode(parentNode: Element, tagName = CaseTeamModelDefinition.TAG, ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, 'roles', propertyNames);
    }

    insert(child: CaseTeamRoleDefinition, after?: CaseTeamRoleDefinition) {
        Util.insertInArray(this.roles, child, after);
    }

    toXML() {
        const xmlDocument = super.exportModel('caseteam', 'roles');
        return xmlDocument;
    }
}
