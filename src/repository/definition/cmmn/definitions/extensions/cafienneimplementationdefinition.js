import { IMPLEMENTATION_TAG } from "../../../xmlelementdefinition";
import CMMNExtensionDefinition from "./cmmnextensiondefinition";

/**
 * Simple helper class to support specific extensions to CMMN   
 */
export default class CafienneImplementationDefinition extends CMMNExtensionDefinition {
    constructor(element, caseDefinition, parent) {
        super(element, caseDefinition, parent);
    }
}

CafienneImplementationDefinition.TAG = IMPLEMENTATION_TAG;
