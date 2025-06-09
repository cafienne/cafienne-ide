import $ from "jquery";
import Halo from "./halo";

export default abstract class HaloItem<H extends Halo = Halo> {
    constructor(public halo: H, public imgURL: string, public title: string, public html: JQuery<HTMLElement> = $(`<img class="haloitem" style="height:21px;width:21px" src="${imgURL}" title="${title}" />`)) {
        this.halo = halo;
        this.imgURL = imgURL;
        this.title = title;
        this.html = html;
    }
}
