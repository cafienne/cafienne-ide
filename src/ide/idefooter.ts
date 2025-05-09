import $ from "jquery";
import IDE from "./ide";

export default class IDEFooter {
    html: JQuery<HTMLElement>;
    divGlobalWarning: JQuery<HTMLElement>;
    /**
     * Constructs the footer of the IDE element.
     */
    constructor(public ide: IDE) {
        this.html = $(
`<div class="ide-footer basicbox idefooter">
    <div class="globalWarning"></div>
    <div class="ideCaseFooter">
        <div class="btn-group gridsettings">
            <label>Grid size</label>
            <input type="number" id="inputGridSize" value="10" />
            <input type="checkbox" id="inputShowGrid" checked="true" />
            <label for="inputShowGrid">Show grid</label>
        </div>
        <div class="btn-group validatemessage">
            <a class="validateLabel"></a>
        </div>
    </div>
</div>`);
        this.ide.html.append(this.html);

        this.divGlobalWarning = this.html.find('.globalWarning');

        // Do the browser check.
        this.checkBrowser();
    }

    /**
     * Checks whether we are running on Chrome (because this is the only place where we test)
     * Additionally, attach a global js-error listener and warn the user about it.
     */
    checkBrowser() {
        // Code inspired by https://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome/13348618#13348618
        var isChromium = !!(window as any).chrome;
        var vendorName = window.navigator.vendor;
        var isOpera = typeof (window as any).opr !== "undefined";
        var isIEedge = window.navigator.userAgent.indexOf("Edge") > -1;
        var isIOSChrome = window.navigator.userAgent.match("CriOS");

        if (isIOSChrome || (
            isChromium !== null &&
            typeof isChromium !== "undefined" &&
            vendorName === "Google Inc." &&
            isOpera === false &&
            isIEedge === false)) {
            // is Google Chrome
        } else { 
            this.setGlobalWarning('This application is tested only in Chrome browsers');
        }

        // Sometimes we cause script errors without users seeing it. Make it more clear to them...
        $(window).on('error', e => this.setGlobalWarning('The browser ran into an error; we suggest you refresh it in order to avoid any further loss of work'));
    }

    /**
     * Sets a global warning message in the footer
     */
    setGlobalWarning(msg: string) {
        this.divGlobalWarning.html(msg);
    }
}
