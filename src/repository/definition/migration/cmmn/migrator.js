import CaseDefinition from "../../cmmn/casedefinition";
import CaseTeamMigrator from "./team/caseteammigrator";
import SentryMigrator from "./plan/sentrymigrator";
import CasePlanMigrator from "./plan/caseplanmigrator";

export default class Migrator {
    static updateXMLElement(definition) {
        new Migrator(definition);
    }

    /**
     * 
     * @param {String} msg 
     */
    migrated(msg) {
        this.definition.migrated(msg);
    }

    /**
     * 
     * @param {CaseDefinition} definition 
     */
    constructor(definition) {
        this.definition = definition;
        const teamMigrator = new CaseTeamMigrator(this);
        const sentryMigrator = new SentryMigrator(this);
        const planMigrator = new CasePlanMigrator(this);
        if (teamMigrator.needsMigration() || sentryMigrator.needsMigration() || planMigrator.needsMigration()) {
            console.group(`Migrating XML contents of ${this.definition.file.fileName} to the new format`);
            teamMigrator.run();
            sentryMigrator.run();
            planMigrator.run();
            console.groupEnd();
        }
    }
}

