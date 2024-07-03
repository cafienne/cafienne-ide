import IDE from "@ide/ide";
import CodeMirrorConfig from "@util/codemirrorconfig";
import SettingsStorage from "./settingsstorage";
import $ from "jquery";

export default class SettingsEditor {
    /**
     * Editor for the content of the settings of the case model editor
     * @param {IDE} ide 
     */
    constructor(ide) {
        this.htmlParent = ide.html;
        this.ide = ide;
    }

    get html() {
        return $(this._html);
    }

    /**
     * @param {JQuery<HTMLElement>} html
     */
    set html(html) {
        this._html = $(html);
    }

    get label() {
        return this._label;
    }

    set label(sLabel) {
        this._label = sLabel;
        this.html.find('.standardformheader label').html(sLabel);
    }

    get htmlContainer() {
        return this._container;
    }

    renderForm() {
        if (!this._html) {
            this.renderHead();
        }
        this.renderData();
    }

    renderHead() {
        this.html = $(
            `<div class="basicbox standardform jsoneditor settings-editor">
                <div class="standardformheader">
                    <label>Settings (raw JSON)</label>
                    <div class="button1st_right" title="Close">
                        <img src="images/close_32.png" />
                    </div>
                </div>
                <div class="standardformcontainer">
                </div>
            </div>`
        );
        this.htmlParent.append(this.html);

        //add draggable to header
        this.html.draggable({ handle: '.standardformheader' });
        this.html.find('label').css('cursor', 'move');

        this.html.resizable();
        this.html.find('img').on('click', e => this.hide());

        this._container = this.html.find('.standardformcontainer');
    }

    renderData() {
        if (this.errorSpan) {
            // Already rendered once, avoid rendering again.
            // TODO: apparently render/renderHead/renderData as a pattern does not work here...
            return;
        }
        const html = $(
            `<div class="btn-group top-bar">
                <button class="btnResetPreferences">Reset</button>
                <button class="btnSavePreferences">Save (reload browser to effectuate)</button>
                <strong><span class="error-message"></span></strong>
            </div>
            <div class="jsoncode"></div>`
        );
        this.errorSpan = html.find('.error-message');
        html.find('.btnResetPreferences').on('click', e => this.reset());
        html.find('.btnSavePreferences').on('click', e => this._save());
        this.htmlContainer.append(html);

        // Add CodeMirror
        this._codeMirrorEditor = CodeMirrorConfig.createJSONEditor(this.html.find('.jsoncode'));

        // CodeMirror onchange fires when content is changed, every change so on keydown (not just after loss of focus)
        this._codeMirrorEditor.on('change', () => this.validateJSON());

        // Avoid CTRL-Y and CTRL-Z invoking undo-manager
        //  Apparently, code mirror does not give the event as a parameter to the function, so we work directly on window.event
        this._codeMirrorEditor.on('keydown', e => window.event.stopPropagation());
    }

    show() {
        this.visible = true;
        // mechanism to handle fact that editor is shown
    }

    hide() {
        this.visible = false;
        // mechanism to handle fact that editor is hidden
    }

    get visible() {
        return this._visible;
    }

    /** @param {Boolean} visible */
    set visible(visible) {
        this._visible = visible;
        if (visible) {
            console.log("Making visible")
            this.renderForm();
        }
        if (this._html) {
            this.html.css('display', visible ? 'block' : 'none');
            if (!this._changingVisiblity) {
                this._changingVisiblity = true;
                if (visible) {
                    this.onShow()
                 }
                this._changingVisiblity = false;
            }
        }
    }

    delete() {
        this._visible = false; // Set visible to false to avoid refresh invocations from refreshMovableViews() inside case.js
        Util.removeHTML(this.html);
    }

    /**
     * Validates the currently typed JSON and shows an optional error message.
     */
    validateJSON() {
        try {
            this.newSettings = JSON.parse(this.value);
            this.errorSpan.html('');
        } catch (exception) {
            // remove whatever was left over from previous edit in order to avoid it getting saved accidentally
            delete this.newSettings;
            this.errorSpan.html(exception);
        }
    }

    reset() {
        this.value = this._originalContent;
        this.errorSpan.html('');
    }

    //test json code and saves case model
    _save() {
        if (this.newSettings) {
            SettingsStorage.save(this.newSettings);
        }
    }

    onShow() {
        // Upon opening the editor, set the value with the current start-case-schema, or use the default value.
        //  Note, default value will not be written into case definition if it is not changed.
        this.value = JSON.stringify(SettingsStorage.store, null, 2);
    }

    get value() {
        return this._codeMirrorEditor.getValue();
    }

    set value(sContent) {
        console.warn("Rendering settings again")
        this._isLoading = true;
        this._originalContent = sContent;
        this._codeMirrorEditor.setValue(sContent);
        this._isLoading = false;
    }
}
