import CaseFile from "@repository/serverfile/casefile";
import TaskDefinition from "./taskdefinition";
import StageDefinition from "../stagedefinition";
import CaseDefinition from "../../casedefinition";
import ValidationContext from "@repository/validate/validation";

export default class CaseTaskDefinition extends TaskDefinition {
    caseRef: string;
    static get infix(): string {
        return 'ct';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.caseRef = this.parseAttribute('caseRef');
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseTask', 'caseRef', 'mappings');
    }

    get implementationClass() {
        return CaseFile;
    }

    get implementationRef() {
        return this.caseRef;
    }

    set implementationRef(ref) {
        this.caseRef = ref;
    }

    validate(validationContext: ValidationContext): void {
        super.validate(validationContext);

        if (this.caseRef !== undefined && this.caseRef !== "")
        {
            let caseFile = validationContext.repository.getCases().find(c => c.fileName === this.caseRef);
            if (caseFile === undefined) {
                this.raiseError('The case task "-par0-" refers to a case that is not defined', 
                    [this.name]);
            }
            else {
                // TODO: check for cyclic references during startup, see CaseTaskDefintion.java:54 in engine.
                if (caseFile.definition === undefined) {
                    this.raiseError('The case file "-par0-" does not contain a case definition', 
                        [caseFile.name]);
                } else {
                    caseFile.definition.validate(validationContext);
                }
            }
        }
    }
}
