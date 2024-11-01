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
    }

    async load() {
        await this.loadCFIDAsType();
        await this.loadChildren();
    }

    async loadCFIDAsType() {
        if (!this.cfi.definitionRef) {
            throw new Error(`Cannot convert to type, because Case File Item ${this.cfi.name} has no CaseFileItemDefinition associated with it (property 'definitionRef' is missing or empty)`);
        }

        // resolve cfid
        this.cfidFile = this.converter.repository.getCaseFileItemDefinitions().find(file => file.fileName === this.cfi.definitionRef);

        if (!this.cfidFile) {
            throw new Error(`Cannot convert to type, because Case File Item ${this.cfi.name} refers to definition '${this.cfi.definitionRef}', but that file does not exist`)
        }

        this.typeWrapper = await TypeWrapper.getType(this.converter, this.cfidFile);
    }

    async loadChildren() {
        for (let i = 0; i < this.cfi.children.length; i++) {
            const wrapper = new CFIWrapper(this.converter, this.cfi.children[i], this);
            await wrapper.load();
        }
    }

    mergeInto(parentType?: TypeDefinition) {
        if (this.merged) {
            console.log("Type " + this.cfi.name + " is already merged into " + parentType?.name)
        }
        if (!parentType) {
            return;
        }
        this.parentType = parentType;
        if (this.parentType.schema.properties.find(p => p.name === this.cfi.name)) {
            return;
        }
        parentType.schema?.createChildProperty(this.cfi.name, this.typeWrapper?.typeFileName, this.cfi.multiplicity);
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
        const oldName = this.cfi.name;
        const oldId = this.cfi.id;
        const newId = this.getPath();
        const newName = this.cfi.name;
        console.groupCollapsed(`Converting usage of ${newId} (old identifier was '${oldId}')`);

        this.caseElementsUsingCFI.forEach(element => {
            console.log(`Changing ${element.constructor.name} to new id ${newId}`);
            element.updateReferences(this.cfi, oldId, newId, oldName, newName);
        });

        // this.cfi.caseDefinition.elements.forEach(element => {
        //     if (element instanceof ConstraintDefinition && element.contextRef === oldId) {
        //         console.log(`Changing ${element.constructor.name} to new id ${newId}`);
        //         element.contextRef = newId;
        //     } else if (element instanceof CaseFileItemOnPartDefinition && element.sourceRef === oldId) {
        //         console.log(`Changing ${element.constructor.name} to new id ${newId}`);
        //         element.sourceRef = newId;
        //     } else if (element instanceof CaseParameterDefinition && element.bindingRef === oldId) {
        //         console.log(`Changing ${element.constructor.name} to new id ${newId}`);
        //         element.bindingRef = newId;
        //     }
        // });

        // this.cfi.caseDefinition.dimensions?.elements.forEach(element => {
        //     if (element instanceof Edge && element.sourceId === oldId) {
        //         console.log(`Changing ${element.constructor.name} to new id ${newId}`);
        //         element.sourceId = newId;
        //     } else if (element instanceof Edge && element.targetId === oldId) {
        //         console.log(`Changing ${element.constructor.name} to new id ${newId}`);
        //         element.targetId = newId;
        //     } else if (element instanceof ShapeDefinition && element.cmmnElementRef === oldId) {
        //         console.log(`Changing ${element.constructor.name} to new id ${newId}`);
        //         element.cmmnElementRef = newId;
        //     }
        // });

        console.groupEnd();
    }
}
