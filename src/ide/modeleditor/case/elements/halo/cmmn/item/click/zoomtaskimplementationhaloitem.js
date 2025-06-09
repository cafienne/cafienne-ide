import $ from "jquery";
import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloClickItem from "../../../haloclickitem";

export default class ZoomTaskImplementationHaloItem extends HaloClickItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo 
     */
    static defaultBar(halo) {
        return halo.bottomBar;
    }

    constructor(halo) {
        const implementationRef = halo.element.definition.implementationRef;
        const imgURL = Images.ZoomIn;
        const title = 'Open task implementation - ' + implementationRef + '\nRight-click to open in new tab';
        const html = $(`<a href="./#${implementationRef}" title="${title}" ><img src="${imgURL}" /></a>`);
        super(halo, imgURL, title, e => window.location.hash = implementationRef, html);
    }
}

