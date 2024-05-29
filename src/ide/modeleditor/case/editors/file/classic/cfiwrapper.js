import CaseFileItemDef from "@repository/definition/cmmn/casefile/casefileitemdef";
import CFIDConverter from "./cfidconverter";
import TypeDefinition from "@repository/definition/type/typedefinition";
import ConstraintDefinition from "@repository/definition/cmmn/caseplan/constraintdefinition";
import CaseFileItemOnPartDefinition from "@repository/definition/cmmn/sentry/casefileitemonpartdefinition";
import ParameterDefinition from "@repository/definition/cmmn/contract/parameterdefinition";
import Edge from "@repository/definition/dimensions/edge";
import ShapeDefinition from "@repository/definition/dimensions/shape";
import TypeWrapper from "./typewrapper";

export default class CFIWrapper {
    /**
     * 
     * @param {CFIDConverter} converter 
     * @param {CaseFileItemDef} cfi 
     * @param {CFIWrapper|undefined} parent 
     */
    constructor(converter, cfi, parent) {
        this.converter = converter;
        this.merged = false;
        this.cfi = cfi;
        this.childWrappers = /** @type {Array<CFIWrapper>} */ ([]);
        this.parent = parent;
        if (this.parent) {
            this.parent.childWrappers.push(this);
        }
        this.converter.cfiWrappers.push(this);
        this.load();
    }

    load() {
        this.loadUsage();
        this.loadCFIDAsType();
        this.loadChildren();
    }

    loadUsage() {
        this.caseElementsUsingCFI = this.cfi.searchInboundReferences();
    }

    loadCFIDAsType() {
        if (! this.cfi.definitionRef) {
            throw new Error(`Cannot convert to type, because Case File Item ${this.cfi.name} has no CaseFileItemDefinition associated with it (property 'definitionRef' is missing or empty)`);
        }

        // resolve cfid
        this.cfidFile = this.converter.repository.getCaseFileItemDefinitions().find(file => file.fileName === this.cfi.definitionRef);

        if (! this.cfidFile) {
            throw new Error(`Cannot convert to type, because Case File Item ${this.cfi.name} refers to definition '${this.cfi.definitionRef}', but that file does not exist`)
        }

        this.typeWrapper = TypeWrapper.getType(this.converter, this.cfidFile);
    }

    loadChildren() {
        this.cfi.children.forEach(child => new CFIWrapper(this.converter, child, this));
    }

    /**
     * 
     * @param {TypeDefinition} parentType 
     */
    mergeInto(parentType) {
        if (this.merged) {
            console.log("Type " + this.cfi.name +" is alrady merged into " + parentType.name)
        }
        this.parentType = parentType;
        parentType.schema.createChildProperty(this.cfi.name, this.typeWrapper.typeFileName);
        console.group("Merging " + this.cfi.name +" into " + parentType.name);
        this.childWrappers.forEach(child => child.mergeInto(this.typeWrapper.typeFile.definition));
        console.groupEnd();
        this.merged = true;
    }

    getPath() {
        if (this.parent) {
            return this.parent.getPath() + '/' + this.cfi.name;
        } else {
            return this.cfi.name;
        }
    }

    convertUsage() {
        this.caseElementsUsingCFI = this.cfi.searchInboundReferences();
        const oldId = this.cfi.id;
        const newId = this.getPath();

        this.cfi.caseDefinition.elements.forEach(element => {
            if (element instanceof ConstraintDefinition && element.contextRef === oldId) {
                element.contextRef = newId;
            } else if (element instanceof CaseFileItemOnPartDefinition && element.sourceRef === oldId) {
                element.sourceRef = newId;
            } else if (element instanceof ParameterDefinition && element.bindingRef === oldId) {
                element.bindingRef = newId;
            }
        });

        this.cfi.caseDefinition.dimensions.elements.forEach(element => {
            if (element instanceof Edge && element.sourceId === oldId) {
                element.sourceId = newId;
            } else if (element instanceof Edge && element.targetId === oldId) {
                element.targetId = newId;
            } else if (element instanceof ShapeDefinition && element.cmmnElementRef === oldId) {
                element.cmmnElementRef = newId;
            }
        })
    }
}
