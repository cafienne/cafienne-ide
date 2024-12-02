import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import ExpressionDefinition from "../expression/expressiondefinition";
import ParameterDefinition from "../../contract/parameterdefinition";
import CaseDefinition from "../casedefinition";
import ModelDefinition from "@repository/definition/modeldefinition";
import ElementDefinition from "@repository/definition/elementdefinition";
import ValidationContext from "@repository/validate/validation";

export default class CaseParameterDefinition extends ParameterDefinition<CaseDefinition> {
    bindingRef: string;
    bindingRefinement?: ExpressionDefinition;

    constructor(importNode: Element, public caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        this.bindingRef = this.parseAttribute('bindingRef');
        this.bindingRefinement = this.parseElement('bindingRefinement', ExpressionDefinition);
    }

    referencesElement<X extends ModelDefinition>(element: ElementDefinition<X>) {
        return element.id === this.bindingRef;
    }

    updateReferences<X extends ModelDefinition>(element: ElementDefinition<X>, oldId: string, newId: string, oldName: string, newName: string) {
        if (this.bindingRef === oldId) {
            this.bindingRef = newId;
            // Check if we also need to update the parameter name (assuming that a same name)
            if (this.name === oldName) {
                this.name = newName;
            }
        }
    }

    get binding(): CaseFileItemDef {
        return this.caseDefinition.getElement(this.bindingRef, CaseFileItemDef);
    }

    get bindingName() {
        return this.bindingRef ? this.binding && this.binding.name : '';
    }

    get defaultOperation() {
        return this.binding ? this.binding.isArray ? 'add' : 'update' : ''; 
    }

    get hasUnusualBindingRefinement() {
        return this.bindingRefinement && ['add', 'update', 'replace'].indexOf(this.bindingRefinement.body.toLowerCase()) < 0;
    }

    get bindingRefinementExpression() {
        return this.bindingRefinement ? this.bindingRefinement.body : this.defaultOperation;
    }

    set bindingRefinementExpression(expression) {
        if (expression && expression != this.defaultOperation) {
            this.getBindingRefinement().body = expression;
        } else {
            if (this.bindingRefinement) {
                this.bindingRefinement.removeDefinition();
            }
        }
    }

    /**
     * Gets or creates the bindingRefinement object.
     */
    getBindingRefinement() {
        if (!this.bindingRefinement) {
            this.bindingRefinement = super.createDefinition(ExpressionDefinition);
        }
        return this.bindingRefinement;
    }

    createExportNode(parentNode: Element, tagName: string) {
        // Parameters have different tagnames depending on their type, so this must be passed.
        super.createExportNode(parentNode, tagName, 'bindingRef', 'bindingRefinement');
    }
    validate(validationContext: ValidationContext): void {
        super.validate(validationContext);

        if (this.name === "") 
        {
            this.raiseError('A case parameter has no name', []);
        }
        if (this.bindingName === "") 
        {
            this.raiseError('The case parameter "-par0-" is not bound', [this.name]);
        }
        if (this.bindingRef === "") 
        {
            this.raiseError('The case parameter "-par0-" has no type', [this.name]);
        }
    }
}
