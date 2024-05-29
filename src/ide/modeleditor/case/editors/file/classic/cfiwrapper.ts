import CaseFileItemDef from "@repository/definition/cmmn/casefile/casefileitemdef";
import ConstraintDefinition from "@repository/definition/cmmn/caseplan/constraintdefinition";
import CaseParameterDefinition from "@repository/definition/cmmn/contract/caseparameterdefinition";
import CaseFileItemOnPartDefinition from "@repository/definition/cmmn/sentry/casefileitemonpartdefinition";
import Edge from "@repository/definition/dimensions/edge";
import ShapeDefinition from "@repository/definition/dimensions/shape";
import ElementDefinition from "@repository/definition/elementdefinition";
import TypeDefinition from "@repository/definition/type/typedefinition";
import CFIDFile from "@repository/serverfile/cfidfile";
import CFIDConverter from "./cfidconverter";
import TypeWrapper from "./typewrapper";

export default class CFIWrapper {
    merged = false;
    childWrappers: CFIWrapper[] = [];
    caseElementsUsingCFI: ElementDefinition<any>[] = [];
    cfidFile?: CFIDFile;
    typeWrapper?: TypeWrapper;
    parentType?: TypeDefinition;
    /**
     * 
     * @param {CFIDConverter} converter 
     * @param {CaseFileItemDef} cfi 
     * @param {CFIWrapper|undefined} parent 
     */
    constructor(public converter: CFIDConverter, public cfi: CaseFileItemDef, public parent?: CFIWrapper) {
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
        if (!this.cfi.definitionRef) {
            throw new Error(`Cannot convert to type, because Case File Item ${this.cfi.name} has no CaseFileItemDefinition associated with it (property 'definitionRef' is missing or empty)`);
        }

        // resolve cfid
        this.cfidFile = this.converter.repository.getCaseFileItemDefinitions().find(file => file.fileName === this.cfi.definitionRef);

        if (!this.cfidFile) {
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
    mergeInto(parentType?: TypeDefinition) {
        if (this.merged) {
            console.log("Type " + this.cfi.name + " is already merged into " + parentType?.name)
        }
        if (! parentType) {
            return;
        }
        this.parentType = parentType;
        parentType.schema?.createChildProperty(this.cfi.name, this.typeWrapper?.typeFileName);
        console.group("Merging " + this.cfi.name + " into " + parentType.name);
        this.childWrappers.forEach(child => child.mergeInto(this.typeWrapper?.typeFile.definition));
        console.groupEnd();
        this.merged = true;
    }

    getPath(): string {
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
            } else if (element instanceof CaseParameterDefinition && element.bindingRef === oldId) {
                element.bindingRef = newId;
            }
        });

        this.cfi.caseDefinition.dimensions?.elements.forEach(element => {
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
