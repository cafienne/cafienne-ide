import XML from "@util/xml";
import CaseDefinition from "./casedefinition";
import CaseTeamDefinition from "./caseteam/caseteamdefinition";

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
        if (this.needsMigration(definition.importNode)) {
            console.group(`Migrating XML contents of ${this.definition.file.fileName} to the new format`)
            this.migrate(definition.importNode);
            console.groupEnd();
        }
    }

    migrate(importNode) {
        const rolesElements = XML.getChildrenByTagName(importNode, 'caseRoles');
        if (rolesElements.length == 0 || rolesElements.length > 1) {
            // CMMN 1.0 format, we must migrate. Also, if roles.length == 0, then we should create an element to avoid nullpointers.
            //  Note: if there is only 1 caseRoles tag it can be both CMMN1.0 or CMMN1.1;
            //  CaseTeamDefinition class will do the check if additional migration is required.
            if (rolesElements.length) {
                this.migrated(`Converting ${rolesElements.length} CMMN1.0 roles`);
            }
            // Create a new element
            const caseTeamElement = XML.loadXMLString('<caseRoles />').documentElement;
            rolesElements.forEach(role => {
                role.parentElement.removeChild(role);
                caseTeamElement.appendChild(CaseTeamDefinition.convertRoleDefinition(role))
            });
            importNode.appendChild(caseTeamElement);
        }

        const sentries = XML.getElementsByTagName(importNode, 'sentry');
        if (sentries.length > 0) {
            console.groupCollapsed("Converting " + sentries.length + " sentries in case plan of " + this.definition.file.fileName);
            const allElements = XML.allElements(importNode);
            sentries.forEach(sentry => {
                const id = sentry.getAttribute('id');
                const criterion = allElements.find(element => !element.getAttribute('sourceRef') && element.getAttribute('sentryRef') === id);
                if (criterion) {
                    sentry.childNodes.forEach(node => criterion.appendChild(node.cloneNode(true)));
                    sentry.parentElement.removeChild(sentry);
                } else {
                    console.error(`Skipping migration of sentry ${id} because there is no criterion referring to it`);
                }
            });
            this.migrated(`Merged <sentry> elements with their corresponding definitions, so now we have only <entryCriterion>, <exitCriterion> and <reactivateCriterion>`);
            console.groupEnd();
        }

        const casePlan = XML.getChildByTagName(importNode, 'casePlanModel');
        if (XML.allElements(casePlan).filter(element => element.tagName === 'planItem' || element.tagName === 'discretionaryItem').length > 0) {
            console.groupCollapsed(`Converting ${XML.getElementsByTagName(importNode, 'planItem').length} plan items and ${XML.getElementsByTagName(importNode, 'discretionaryItem').length} discretionary items in the case plan`);
            const isDefinitionName = (node) => {
                switch (node.tagName) {
                    case 'humanTask':
                    case 'caseTask':
                    case 'processTask':
                    case 'milestone':
                    case 'userEvent':
                    case 'timerEvent':
                    case 'stage':
                        return true;
                    default:
                        return false;
                }
            }

            const definitionNodes = XML.getChildrenByTagName(casePlan, '*').filter(isDefinitionName);
            console.log("Found " + definitionNodes.length + " definition nodes")

            new StageMigrator(this, casePlan, casePlan, definitionNodes).migrateStage();

            definitionNodes.forEach(node => node.parentElement.removeChild(node));

            console.log(XML.prettyPrint(importNode));
            this.migrated(`Merged <planItem> and <discretionaryItem> elements with their corresponding definitions, so now we have only <humanTask>, <stage>, <milestone>, etc.`);

            console.groupEnd();
        }
    }

    needsMigration(importNode) {
        const classicRoles = XML.getChildrenByTagName(importNode, 'caseRoles'); // More than 1 means CMMN 1.0 style roles.
        const classicSentries = XML.getElementsByTagName(importNode, 'sentry');
        const classicPlanItems = XML.allElements(XML.getChildByTagName(importNode, 'casePlanModel')).filter(element => element.tagName === 'planItem' || element.tagName === 'discretionaryItem');

        return (classicRoles.length > 1) || (classicSentries.length > 0) || (classicPlanItems.length > 0);
    }
}

class StageMigrator {
    /**
     * 
     * @param {CaseDefinition} caseDefinition 
     * @param {Element} stage 
     * @param {Element} casePlan 
     * @param {Array<Element>} definitionNodes 
     */
    constructor(caseDefinition, stage, casePlan, definitionNodes) {
        this.caseDefinition = caseDefinition;
        this.stage = stage;
        this.item = stage;
        this.casePlan = casePlan;
        this.definitionNodes = definitionNodes;
        this.items = XML.getChildrenByTagName(this.stage, 'planItem').map(item => new ItemMigrator(this, item));
        const planningTable = XML.getChildByTagName(this.stage, 'planningTable');
        if (planningTable) {
            this.planningTableMigrator = new PlanningTableMigrator(this, planningTable);
        }
    }

    migrateStage() {
        console.log("Migrating stage content of " + this.stage.getAttribute('name'))
        this.items.forEach(item => item.migrateItem());
        if (this.planningTableMigrator) {
            this.planningTableMigrator.migrateTable();
        }
    }

    addError(msg) {
        console.error(`ERROR in migration of ${this.caseDefinition.name}: ${msg}`);
    }
}

class PlanningTableMigrator {
    /**
     * 
     * @param {ItemMigrator|StageMigrator} migrator 
     * @param {Element} table 
     */
    constructor(migrator, table) {
        this.migrator = migrator;
        this.definitionNodes = migrator.definitionNodes;
        this.table = table;
        this.stage = table;
        console.log("Creating migrator for planning table " + table.getAttribute('name') + " in " + this.migrator.item.tagName + " " + this.migrator.item.getAttribute('name'))
        this.items = XML.getChildrenByTagName(this.table, 'discretionaryItem').map(item => new ItemMigrator(this, item));
    }

    migrateTable() {
        console.log("Migrating planning table content of " + this.table.getAttribute('name'))
        this.items.forEach(item => item.migrateItem());
    }
}

class ItemMigrator {
    /**
     * 
     * @param {StageMigrator|PlanningTableMigrator} migrator 
     * @param {Element} item 
     */
    constructor(migrator, item) {
        this.migrator = migrator;
        this.definitionNodes = migrator.definitionNodes;
        this.item = item;
        console.log("Creating migrator for " + item.getAttribute('name') + " in " + this.migrator.stage.tagName + " " + this.migrator.stage.getAttribute('name'))
        this.definitionRef = this.item.getAttribute('definitionRef');
        if (this.definitionRef) {
            this.definitionNode = this.migrator.definitionNodes.find(element => element.getAttribute('id') === this.definitionRef);
            if (!this.definitionNode) {
                this.migrator.addError(`The element ${XML.prettyPrint(this.item.cloneNode(false))} refers to a definition with id "${this.definitionRef}", but that definition is not present in the case`);
            } else {
                if (this.definitionNode.tagName === 'stage') {
                    this.stageMigrator = new StageMigrator(this.migrator.caseDefinition, this.definitionNode, this.migrator.casePlan, this.migrator.definitionNodes);
                } else { // In a HumanTask we can also have a planning table, and then we have to migrate that one as well
                    const planningTable = XML.getChildByTagName(this.item, 'planningTable');
                    if (planningTable) {
                        this.planningTableMigrator = new PlanningTableMigrator(this, planningTable);
                    }
                }
            }
        } else {
            this.migrator.addError(`The element ${XML.prettyPrint(this.item.cloneNode(false))} misses a value for the definitionRef attribute`);
        }
    }

    migrateItem() {
        console.groupCollapsed(`Converting ${XML.prettyPrint(this.item.cloneNode(false))}`)
        if (this.stageMigrator) {
            console.log("First migrating the stage")
            this.stageMigrator.migrateStage();
        }
        if (this.planningTableMigrator) {
            this.planningTableMigrator.migrateTable();
        }
        const newChild = this.definitionNode.cloneNode(true);
        newChild.setAttribute('id', this.item.getAttribute('id'));
        newChild.setAttribute('name', this.item.getAttribute('name'));
        if (this.item.getAttribute('authorizedRoleRefs')) {
            newChild.setAttribute('authorizedRoleRefs', this.item.getAttribute('authorizedRoleRefs'))
        }
        this.item.childNodes.forEach(node => newChild.appendChild(node.cloneNode(true)));
        this.item.parentElement.insertBefore(newChild, this.item);
        console.groupEnd();
    }
}
