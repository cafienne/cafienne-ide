const DECORATORFROMBOTTOM = 4;
const DECORATORSIZE = 12;

class Decorator {
    /**
     * Simple helper class to visualize Decorator images on a PlanItem (like AutoComplete, RequiredRule, etc.)
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     * @param {String} imgURL 
     */
    constructor(box, view, imgURL) {
        this.box = box;
        this.view = view;
        this.imgURL = imgURL;
        this.id = Util.createID();
    }

    /**
     * @returns {Boolean}
     */
    get visibility() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get html() {
        return this.box.html.find('.' + this.id);
    }

    refreshView() {
        const visibility = this.visibility ? 'visible' : 'hidden';
        this.html.attr('visibility', visibility);
    }

    get markup() {
        const visibility = this.visibility ? 'visible' : 'hidden';
        const i = this.box.decorators.indexOf(this);
        return `<image x="${(i * DECORATORSIZE)}" y="${this.box.decoratorsTop}" visibility="${visibility}" width="${DECORATORSIZE}" height="${DECORATORSIZE}" class="${this.id}" xlink:href="${this.imgURL}" />`;
    }
}

class MinusDecorator extends Decorator {
    /**
     * @param {DecoratorBox} box 
     * @param {Stage} view 
     */
    constructor(box, view) {
        super(box, view, MINUS_IMG);
    }

    get visibility() {
        return true;
    }
}

class AutoCompleteDecorator extends Decorator {
    /**
     * @param {StageDecoratorBox} box 
     * @param {Stage} view 
     */
    constructor(box, view) {
        super(box, view, AUTOCOMPLETE_IMG);
        this.view = view;
    }

    get visibility() {
        return this.view.planItemDefinition.autoComplete;
    }
}

class ExpressionDecorator extends Decorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box, view, img, expressionProperty) {
        super(box, view, img);
        this.expressionProperty = expressionProperty;
    }

    get visibility() {
        return this.view.definition.itemControl[this.expressionProperty];
    }
}

class RequiredRuleDecorator extends ExpressionDecorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box, view) {
        super(box, view, REQUIRED_IMG, 'requiredRule');
    }
}

class RepetitionRuleDecorator extends ExpressionDecorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box, view) {
        super(box, view, REPETITION_IMG, 'repetitionRule');
    }
}

class ManualActivationRuleDecorator extends ExpressionDecorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box, view) {
        super(box, view, MANUALACTIVATION_IMG, 'manualActivationRule');
    }
}
