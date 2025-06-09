import HaloItem from "./haloitem";

export default class HaloClickItem extends HaloItem {
    constructor(halo, imgURL, title, clickHandler, html) {
        super(halo, imgURL, title, html);
        this.html.on('click', e => clickHandler(e));
    }
}
