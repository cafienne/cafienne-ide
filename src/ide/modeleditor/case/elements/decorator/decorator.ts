import Util from "../../../../../util/util";
import PlanItemView from "../planitemview";
import DecoratorBox from "./decoratorbox";

export const DECORATORFROMBOTTOM = 4;
export const DECORATORSIZE = 12;

export default abstract class Decorator {
    id: string = Util.createID();


    /**
     * Simple helper class to visualize Decorator images on a PlanItem (like AutoComplete, RequiredRule, etc.)
     */
    constructor(protected box: DecoratorBox, protected view: PlanItemView, private imgURL: string) {
    }

    abstract get visibility(): boolean;

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
        <image x="${(i * DECORATORSIZE)}" y="${this.box.decoratorsTop}" visibility="${visibility}" width="${DECORATORSIZE}" height="${DECORATORSIZE}" class="${this.id}" href="${this.imgURL}">
            <title class="tooltip"></title>
        </image>`;
    }
}
