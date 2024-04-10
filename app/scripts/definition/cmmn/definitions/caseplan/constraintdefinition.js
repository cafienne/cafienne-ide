class ConstraintDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.expression = this.parseElement('condition', ExpressionDefinition);
        this.contextRef = this.parseAttribute('contextRef');
    }

    get contextName() {
        const context = this.caseDefinition.getElement(this.contextRef);
        return context ? context.name : '';
    }

    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName, 'contextRef');
        if (this.expression) {
            // Hmmm... perhaps we should rename 'expression' to 'condition' ...
            this.expression.createExportNode(this.exportNode, 'condition');
        }
    }

    getExpression() {
        if (!this.expression) {
            this.expression = super.createDefinition(ExpressionDefinition);
        }
        return this.expression;
    }

    createTooltip(ruleDescription) {
        // If no rule body - that's actually an error...
        if (!this.body) {
            return 'An expression is missing for this ' + ruleDescription;
        }
        const prefix = `${ruleDescription} expression`;
        // Most rules have 'true' as default value, if so, return it in a more concise version
        if (this.body === 'true') {
            return `${prefix}:\n\t${this.body}`;
        }

        const context = this.contextName ? 'Case file context is set to ' + this.contextName : 'Note: case file context is NOT set for the expression';
        const headline = `${prefix}:\n\n\t`;
        return `${headline}${this.body}\n\n\n${context}`;

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
