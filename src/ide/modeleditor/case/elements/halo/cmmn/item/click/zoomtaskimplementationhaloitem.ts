import $ from "jquery";
import HaloClickItem from "../../../../../../../editors/modelcanvas/halo/haloclickitem";
import Images from "../../../../../../../util/images/images";
import TaskHalo from "../../taskhalo";

export default class ZoomTaskImplementationHaloItem extends HaloClickItem<TaskHalo> {
    constructor(halo: TaskHalo) {
        const implementationRef = halo.element.definition.implementationRef;
        const imgURL = Images.ZoomIn;
        const title = 'Open task implementation - ' + implementationRef + '\nRight-click to open in new tab';
        const html = $(`<a href="./#${implementationRef}" title="${title}" ><img src="${imgURL}" /></a>`);
        super(halo, imgURL, title, e => { window.location.hash = implementationRef; }, halo.bottomBar, html);
    }
}
