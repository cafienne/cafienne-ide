class ConstraintDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.expression = this.parseElement('condition', ExpressionDefinition);
        this.contextRef = this.parseAttribute('contextRef');
    }

    get contextName() {
        const context = this.caseDefinition.getElement(this.contextRef);
        return context ? context.name : '';
        // const contextRef = this.contextRef;
        // const contextRefDefinition = this.caseDefinition.getElement(contextRef);
        // //TODO: Fix async binding to external SchemaPropertyDefinition;  For now display a '> '
        // return contextRefDefinition ? contextRefDefinition.name : (contextRef && contextRef.startsWith('sp__') ? '> ' + contextRef : '');
    }

    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName, 'contextRef');
        if (this.expression) {
            // Hmmm... perhaps we should rename 'expression' to 'condition' ...
            this.expression.createExportNode(this.exportNode, 'condition');
        }
    }

    getExpression() {
        if (! this.expression) {
            this.expression = super.createDefinition(ExpressionDefinition);
        }
        return this.expression;
    }

    set language(newLanguage) {
        if (newLanguage) {
            this.getExpression().language = newLanguage;
        }
    }

    get language() {
        if (this.expression) return this.expression.language;
    }

    get hasCustomLanguage() {
        return this.expression && this.expression.hasCustomLanguage;
    }

    set body(newBody) {
        this.getExpression().body = newBody;
    }

    get body() {
        return this.expression ? this.expression.body : '';
    }
}
