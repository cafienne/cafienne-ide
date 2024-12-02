import ProcessFile from "@repository/serverfile/processfile";
import TaskDefinition from "./taskdefinition";
import CaseDefinition from "../../casedefinition";
import StageDefinition from "../stagedefinition";
import ValidationContext from "@repository/validate/validation";

export default class ProcessTaskDefinition extends TaskDefinition {
    processRef: string;
    static get infix() {
        return 'pt';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.processRef = this.parseAttribute('processRef');
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'processTask', 'processRef', 'mappings');
    }

    get implementationClass() {
        return ProcessFile;
    }

    get implementationRef() {
        return this.processRef;
    }

    set implementationRef(ref) {
        this.processRef = ref;
    }
    validate(validationContext: ValidationContext): void {
        super.validate(validationContext);

        if (this.processRef !== undefined && this.processRef !== "")
        {
            let processModel = validationContext.repository.getProcesses().find(c => c.fileName === this.processRef);
            if (processModel === undefined) {
                this.raiseError('The process task "-par0-" refers to a process that is not defined', 
                    [this.name]);
            }
            else {
                if (processModel.definition === undefined) {
                    this.raiseError('The process file "-par0-" does not contain a process definition', 
                        [processModel.name]);
                } else {
                    processModel.definition.validate(validationContext);
                }
            }
        }
    }
}
