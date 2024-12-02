import ValidationContext from "@repository/validate/validation";
import CMMNElementDefinition from "./cmmnelementdefinition";

/**
 * Simple helper class to support specific extension <cafienne:implementation>  
 */
export default class UnnamedCMMNElementDefinition extends CMMNElementDefinition {
    isNamedElement() {
        return false;
    }

    validate(validationContext: ValidationContext) {
        // no validations yet
    }
}
