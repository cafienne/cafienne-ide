import Halo from "./halo";
import HaloBar from "./halobar";
import HaloItem from "./haloitem";

export default abstract class HaloClickItem<HaloT extends Halo = Halo> extends HaloItem<HaloT> {
    constructor(halo: HaloT, imgURL: string, title: string, clickHandler: (e: JQuery.ClickEvent) => void, defaultBar: HaloBar = halo.topBar, html?: JQuery<HTMLElement>) {
        super(halo, imgURL, title, defaultBar, html);
        this.html.on('click', e => clickHandler(e));
    }
}
