import XML from "@util/xml";
import Migrator from "../migrator";

export default class CasePlanMigrator {
    /**
     * 
     * @param {Migrator} migrator 
     */
    constructor(migrator) {
        this.migrator = migrator;
    }

    needsMigration() {
        return XML.allElements(XML.getChildByTagName(this.migrator.definition.importNode, 'casePlanModel')).filter(element => element.tagName === 'planItem' || element.tagName === 'discretionaryItem').length > 0;
    }

    run() {
        if (!this.needsMigration()) {
            return;
        }
        const importNode = this.migrator.definition.importNode;
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
            this.migrator.migrated(`Merged <planItem> and <discretionaryItem> elements with their corresponding definitions, so now we have only <humanTask>, <stage>, <milestone>, etc.`);

            console.groupEnd();
        }
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
                    console.log(`Creating a stage migrator for ${this.definitionNode.getAttribute('name')}`)
                    this.stageMigrator = new StageMigrator(this.migrator.caseDefinition, this.definitionNode, this.migrator.casePlan, this.migrator.definitionNodes);
                } else { // In a HumanTask we can also have a planning table, and then we have to migrate that one as well
                    const planningTable = XML.getChildByTagName(this.definitionNode, 'planningTable');
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
        console.groupCollapsed(`Converting ${XML.prettyPrint(this.item.cloneNode(true))}`);
        if (this.stageMigrator) {
            console.log("First migrating stage contents");
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
        // NOTE: as of now we're keeping the plan item in tree, as that will anyway not be parsed no longer and therefore also not serialized.
        this.item.parentElement.insertBefore(newChild, this.item);
        console.log("Conversion result: ", XML.prettyPrint(newChild));
        console.groupEnd();
    }
}
