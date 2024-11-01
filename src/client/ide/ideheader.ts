import IDE from "./ide";
import $ from "jquery";

export default class IDEHeader {
    html: JQuery<HTMLElement>;
    /**
     * Constructs the footer of the IDE element.
     */
    constructor(public ide: IDE) {
        this.html = $(
    `<!-- Define the header containing the UI control buttons -->
    <div class="ide-header basicbox">
        <div class="btn-toolbar" role="toolbar">
            <div class="btn-group appname">
                <label>Cafienne IDE</label>
            </div>
        </div>
    </div>`);
        this.ide.html.append(this.html);
    }
}
