import Halo from "./halo";
import HaloItem from "./haloitem";

export default abstract class HaloClickItem<H extends Halo = Halo> extends HaloItem<H> {
    constructor(halo: H, imgURL: string, title: string, clickHandler: (e: JQuery.ClickEvent) => void, html?: JQuery<HTMLElement>) {
        super(halo, imgURL, title, html);
        this.html.on('click', e => clickHandler(e));
    }
}
