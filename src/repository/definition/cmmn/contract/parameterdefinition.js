import CafienneImplementationDefinition from "@repository/definition/extensions/cafienneimplementationdefinition";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import ExpressionDefinition from "../expression/expressiondefinition";
// import TaskDefinition from "../caseplan/task/taskdefinition";
// BIG TODO HERE
export default class ParameterDefinition extends CMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.bindingRef = this.parseAttribute('bindingRef');
        this.bindingRefinement = this.parseElement('bindingRefinement', ExpressionDefinition);
        this.required = this.parseImplementation(CafienneImplementationDefinition).parseBooleanAttribute('required', false);
        this.isNew = false; // This property is used in the HumanTaskEditor and ProcessTaskEditor
    }

    referencesElement(element) {
        return element.id === this.bindingRef;
    }

    get binding() {
        return /** @type {CaseFileItemDef} */ (this.caseDefinition.getElement(this.bindingRef, CaseFileItemDef));
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

    createExportNode(parentNode, tagName) {
        // Task parameters will not be saved, unless they are used in a non-empty mapping
        if (this.parent instanceof TaskDefinition) {
            const nonEmptyMappings = this.parent.mappings.filter(mapping => (mapping.sourceRef == this.id || mapping.targetRef == this.id) && !mapping.isEmpty());
            if (nonEmptyMappings.length == 0) {
                // console.log("Parameter "+this.name+" in "+this.parent.name+" is not used in any mapping");
                return;
            }
        }

        // Parameters have different tagnames depending on their type, so this must be passed.
        super.createExportNode(parentNode, tagName, 'bindingRef', 'bindingRefinement');
        if (this.required) { // Required is a customization to the spec, put in an extension element
            this.createImplementationNode().setAttribute('required', 'true');
        }
    }
}
