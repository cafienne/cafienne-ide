import XML from "../../../../../util/xml";
import Migrator from "../migrator";

export default class SentryMigrator {
    constructor(public migrator: Migrator) {}

    needsMigration(): boolean {
        return XML.getElementsByTagName(this.migrator.definition.importNode, 'sentry').length > 0;
    }

    run() {
        if (! this.needsMigration()) {
            return;
        }
        const importNode = this.migrator.definition.importNode;
        const sentries = XML.getElementsByTagName(importNode, 'sentry');
        if (sentries.length > 0) {
            console.groupCollapsed("Converting " + sentries.length + " sentries in case plan of " + this.migrator.definition.file.fileName);
            const allElements = XML.allElements(importNode);
            sentries.forEach(sentry => {
                const id = sentry.getAttribute('id');
                const criterion = allElements.find(element => !element.getAttribute('sourceRef') && element.getAttribute('sentryRef') === id);
                if (criterion) {
                    sentry.childNodes.forEach(node => criterion.appendChild(node.cloneNode(true)));
                    sentry.parentElement && sentry.parentElement.removeChild(sentry);
                } else {
                    console.error(`Skipping migration of sentry ${id} because there is no criterion referring to it`);
                }
            });
            this.migrator.migrated(`Merged <sentry> elements with their corresponding definitions, so now we have only <entryCriterion>, <exitCriterion> and <reactivateCriterion>`);
            console.groupEnd();
        }
    }
}
