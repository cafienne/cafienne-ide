import UnnamedCMMNElementDefinition from "@repository/definition/unnamedcmmnelementdefinition";
import ExpressionDefinition from "./expressiondefinition";
import CaseDefinition from "../casedefinition";
import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";
import XMLSerializable from "@repository/definition/xmlserializable";
import ModelDefinition from "@repository/definition/modeldefinition";
import ElementDefinition from "@repository/definition/elementdefinition";
import CaseFileItemReference from "../casefile/casefileitemreference";

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
        if (! this._expression) {
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