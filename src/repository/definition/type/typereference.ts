import ExternalReference from "../references/externalreference";
import TypeDefinition from "./typedefinition";

export default class TypeReference extends ExternalReference<TypeDefinition> {
    get type() {
        return this.fileName;
    }

    get typeRef() {
        return this.type.endsWith('.type') ? this.type : '';
    }

    protected loadFile(): void {
        if (this.typeRef) {
            super.loadFile();
        }
    }
}
