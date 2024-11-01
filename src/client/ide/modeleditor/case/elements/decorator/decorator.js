import Util from "@util/util";
import PlanItemView from "../planitemview";
import DecoratorBox from "./decoratorbox";

export const DECORATORFROMBOTTOM = 4;
export const DECORATORSIZE = 12;

export default class Decorator {
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

    get tooltip() {
        return '';
    }

    get html() {
        return this.box.html.find('.' + this.id);
    }

    refreshView() {
        const visibility = this.visibility ? 'visible' : 'hidden';
        this.html.attr('visibility', visibility);
        if (this.visibility) {
            this.html.find('.tooltip').html(this.tooltip);
        }
    }

    get markup() {
        const visibility = this.visibility ? 'visible' : 'hidden';
        const i = this.box.decorators.indexOf(this);
        return `
        <image x="${(i * DECORATORSIZE)}" y="${this.box.decoratorsTop}" visibility="${visibility}" width="${DECORATORSIZE}" height="${DECORATORSIZE}" class="${this.id}" xlink:href="${this.imgURL}">
            <title class="tooltip"></title>
        </image>`;
    }
}
