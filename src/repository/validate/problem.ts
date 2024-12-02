import ElementDefinition from "@repository/definition/elementdefinition";
import ModelDefinition from "@repository/definition/modeldefinition";
import Util from "@util/util";

export default class Problem <M extends ModelDefinition> {
    typeId: number;
    description: string;
    
    /**
     * Creates a new problem that can render itself as HTML
     */
    constructor(public element: ElementDefinition<M>, public descriptionTemplate: string, public parameters: string[], public severity: ProblemSeverity) {
        this.typeId = Util.hashCode(descriptionTemplate);

        // Now substitute parameters into the description template
        this.description = descriptionTemplate;
        for (let i = 0; i < parameters.length; i++) {
            this.description = this.description.replace('-par' + i + '-', parameters[i]);
        }
    }

    get id(): string {
        return this.typeId+' in '+this.element.id + '[' + this.parameters.join(',') + ']';
    }

    get fileName(): string {
        return this.element.modelDefinition.file.fileName;
    }

    get contextId(): string {
        return this.element.id;
    }

    isWarning(): boolean {
        return this.severity === ProblemSeverity.WARNING;
    }

    isError(): boolean {
        return this.severity === ProblemSeverity.ERROR;
    }
}

export enum ProblemSeverity {
    ERROR,
    WARNING
}