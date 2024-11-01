import IDE from "./ide";
import $ from "jquery";

/**
 * Showing/hiding status messages on top of the fixed editors.
 */
export default class CoverPanel {
    html: JQuery<HTMLElement>;
    msgElement: JQuery<HTMLElement>;
    visible: boolean = false;

    /**
     * This editor handles Case models
     */
    constructor(public ide: IDE) {
        this.ide = ide;
        this.html = $(
`<div class="divCoverPanel">
    <div></div>
    <div class="basicbox">
        <label class="labelCoverPanelDescription"></label>
    </div>
</div>`);
        this.ide.main.divModelEditors.append(this.html);
        this.msgElement = this.html.find('.labelCoverPanelDescription');
    }

    /**
     * Show a message on the cover panel and make it visible
     */
    show(msg: string) {
        this.visible = true;
        this.msgElement.html(msg);
    }
}
