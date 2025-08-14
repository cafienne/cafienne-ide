import $ from "jquery";
import Halo from "./halo";
import HaloBar from "./halobar";

export default abstract class HaloItem<HaloT extends Halo = Halo> {
    constructor(
        public halo: HaloT,
        public imgURL: string,
        public title: string,
        public defaultBar: HaloBar,
        public html: JQuery<HTMLElement> = $(`<img class="haloitem" style="height:21px;width:21px" src="${imgURL}" title="${title}" />`),
    ) {
        defaultBar.add(this);
    }
}
