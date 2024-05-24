import Halo from "../halo";

export default class HaloItem {
    /**
     * 
     * @param {Halo} halo 
     * @param {string} imgURL
     * @param {string} title
     * @param {JQuery<HTMLElement>} html
     */
    constructor(halo, imgURL, title, html = $(`<img class="haloitem" style="height:21px;width:21px" src="${imgURL}" title="${title}" />`)) {
        /** @type {Halo} */
        this.halo = halo;
        this.imgURL = imgURL;
        this.title = title;
        this.html = html;
    }

    get element() {
        return this.halo.element;
    }
}
