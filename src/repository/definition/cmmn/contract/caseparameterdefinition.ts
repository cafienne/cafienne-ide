import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import ExpressionDefinition from "../expression/expressiondefinition";
import ParameterDefinition from "../../contract/parameterdefinition";
import CaseDefinition from "../casedefinition";
import ModelDefinition from "@repository/definition/modeldefinition";
import ElementDefinition from "@repository/definition/elementdefinition";

export default class CaseParameterDefinition extends ParameterDefinition<CaseDefinition> {
    bindingRef: string;
    bindingRefinement?: ExpressionDefinition;
    /**
     * 
     * @param {Element} importNode 
     * @param {CaseDefinition} caseDefinition
     * @param {CMMNElementDefinition} parent optional
     */
    constructor(importNode: Element, public caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        this.bindingRef = this.parseAttribute('bindingRef');
        this.bindingRefinement = this.parseElement('bindingRefinement', ExpressionDefinition);
    }

    referencesElement<X extends ModelDefinition>(element: ElementDefinition<X>) {
        return element.id === this.bindingRef;
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
}
