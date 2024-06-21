import CMMNExtensionDefinition from "../extensions/cmmnextensiondefinition";

export default class StartCaseSchemaDefinition extends CMMNExtensionDefinition {
    /**
    * @param {Element} importNode 
    * @param {CaseDefinition} caseDefinition
    * @param {CMMNElementDefinition} parent optional
    */
    constructor(importNode, caseDefinition, parent = undefined) {
        super(importNode, caseDefinition, parent);
        this.value = importNode ? importNode.textContent : '';
    }

    get value() {
        return this._value;
    }

    /**
     * @param {String} value
     */
    set value(value) {
        this._value = value;
    }

    createExportNode(parentNode) {
        if (this.value.trim()) {
        // Now dump start case schema if there is one. Should we also do ampersand replacements??? Not sure. Perhaps that belongs in business logic??
        // const startCaseSchemaValue = this.case.startCaseEditor.value.replace(/&/g, '&amp;');
            super.createExportNode(parentNode, StartCaseSchemaDefinition.TAG)
            this.exportNode.textContent = this.value;
        }
    }
}

StartCaseSchemaDefinition.TAG = 'cafienne:start-case-model';
