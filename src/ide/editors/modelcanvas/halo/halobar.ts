import HtmlUtil from "../../../util/htmlutil";
import Halo from "./halo";
import HaloItem from "./haloitem";

type HaloItemConstructor<H extends Halo = Halo> = new (halo: H) => HaloItem;

export default class HaloBar<H extends Halo = Halo> {
    halo: H;
    html: JQuery<HTMLElement>;

    constructor(halo: H, html: JQuery<HTMLElement>) {
        this.halo = halo;
        this.html = html;
    }

    clear() {
        HtmlUtil.clearHTML(this.html);
    }

    /**
     * Adds halo items to this specific bar of the halo.
     * It is sufficient to pass a comma separated list of the HaloItem constructors.
     */
    addItems(...haloItemConstructors: HaloItemConstructor<H>[]): HaloItem[] {
        return haloItemConstructors.map(HaloItemConstructor => {
            const item = new HaloItemConstructor(this.halo);
            this.add(item);
            return item;
        });
    }

    /**
     * Adds a halo item to the bar
     */
    add(item: HaloItem) {
        this.html.append(item.html);
    }
}
