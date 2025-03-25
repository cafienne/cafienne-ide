import { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import ElementDefinition from "../../elementdefinition";
import ModelDefinition from "../../modeldefinition";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import XMLSerializable from "../../xmlserializable";
import CaseDefinition from "../casedefinition";
import CaseFileItemReference from "../casefile/casefileitemreference";
import ExpressionDefinition from "./expressiondefinition";

/**
 * Simple class that does basic expression parsing 
 */
export default class ExpressionContainer extends UnnamedCMMNElementDefinition {
    private _expression?: ExpressionDefinition;
    contextRef: CaseFileItemReference;

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        this._expression = this.parseElement(this.expressionTagName, ExpressionDefinition);
        this.contextRef = this.parseInternalReference('contextRef');
    }

    validateExpression(validator: Validator, owner: CMMNElementDefinition, expressionDescription: string) {
        if (!this.body || this.body.trim().length === 0) {
            validator.raiseError(owner, `The ${expressionDescription} in ${owner} must not be empty`)
        }

        if (this.contextRef.isEmpty && this.body !== 'true' && this.body !== 'false') {
            validator.raiseWarning(owner,  `The ${expressionDescription} in ${owner} has no case file item context`);                
        }
    }

    referencesElement(element: XMLSerializable) {
        return this.contextRef.references(element);
    }

    updateReferences<X extends ModelDefinition>(element: ElementDefinition<X>, oldId: string, newId: string, oldName: string, newName: string) {
        if (this.contextRef.references(oldId)) {
            this.contextRef.update(newId);
        }
    }

    get contextName() {
        return this.contextRef.name;
    }

    get expressionTagName(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * @returns {ExpressionDefinition}
     */
    get expression() {
        if (!this._expression) {
            this._expression = super.createDefinition(ExpressionDefinition);
        }
        return this._expression;
    }

    set language(newLanguage) {
        if (newLanguage) {
            this.expression.language = newLanguage;
        }
    }

    get language() {
        if (this.expression) return this.expression.language;
    }

    set body(newBody) {
        this.expression.body = newBody;
    }

    get body() {
        return this._expression ? this.expression.body : '';
    }

    get hasCustomLanguage() {
        return this._expression?.hasCustomLanguage;
    }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, 'contextRef', propertyNames);
        if (this._expression) {
            this._expression.createExportNode(this.exportNode, this.expressionTagName);
        }
    }
}