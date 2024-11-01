import PlanItemView from "../planitemview";
import Decorator, { DECORATORFROMBOTTOM, DECORATORSIZE } from "./decorator";

export default class DecoratorBox {
    /**
     * 
     * @param {PlanItemView} view 
     */
    constructor(view) {
        this.view = view;
        /** @type {Array<Decorator>} */
        this.decorators = [];
    }

    refreshView() {
        this.decorators.forEach(d => d.refreshView());
    }

    get html() {
        return this.view.html.find('.decoratorBox');
    }

    get markup() {
        const images = this.decorators.map(d => d.markup).join('\n');
        return `<g transform="translate(${this.decoratorsLeft})" class="decoratorBox">${images}</g>`;
    }

    /**
     * Calculates the left position that the decoratorBox should move to in order for the images to render in the middle of the bottom of the element
     */
    get decoratorsLeft() {
        const decoratorBoxWidth = this.decorators.length * DECORATORSIZE;
        const decoratorLeft = Math.round((this.view.shape.width - decoratorBoxWidth) / 2);
        return decoratorLeft;
    }

    /**
     * Calculates the top position that the images in the decoratorBox should have in order for the images to render in the middle of the bottom of the element
     */
    get decoratorsTop() {
        const imgHeight = DECORATORSIZE + DECORATORFROMBOTTOM;
        const decoratorBoxTop = this.view.shape.height - imgHeight;
        return decoratorBoxTop;
    }

    /**
     * Position the decorators after resize again in the middle of the element
     */
    moveDecoratorsToMiddle() {
        const decoratorBox = this.view.html.find('.decoratorBox');
        const decoratorImages = decoratorBox.find('image');
        //y position at bottom of element
        decoratorImages.attr('y', this.decoratorsTop)

        //x position in middle
        decoratorBox.attr('transform', 'translate(' + this.decoratorsLeft + ')');
    }
}
