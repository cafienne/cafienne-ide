import $ from "jquery";
import ModelDefinition from "../../repository/definition/modeldefinition";
import ServerFile from "../../repository/serverfile/serverfile";
import Util from "../../util/util";
import MovableEditor from "../editors/movableeditor";
import IDE from "../ide";
import HtmlUtil from "../util/htmlutil";
import Images from "../util/images/images";

export default abstract class ModelEditor {
    movableEditors: MovableEditor[] = [];
    htmlContainer: any;
    divMovableEditors: any;
    keyStrokeListener: (e: any) => void;
    private _html: JQuery<HTMLElement>;
    /**
     * Base class for model editor
     */
    constructor(public ide: IDE, public file: ServerFile<ModelDefinition>) {
        this.ide.editorRegistry.add(this);
        this._html = $(
`<div class="model-editor-base" editor="${this.constructor.name}" model="${this.fileName}">
    <div class="model-editor-header">
        <label>${this.label}</label>
        <div class="refreshButton" title="Refresh">
            <img src="${Images.Refresh}" />
        </div>
        <div class="closeButton" title="Close">
            <img src="${Images.Close}" />
        </div>
    </div>
    <div class="divMovableEditors"></div>
    <div class="model-editor-content"></div>
</div>`);
        this.ide.divModelEditors.append(this._html);

        this.htmlContainer = this.html.find('.model-editor-content');
        this.divMovableEditors = this.html.find('.divMovableEditors');

        // Listener for keydown event; will be attached/detached from document.body when we become visible/hidden.
        this.keyStrokeListener = e => {
            const keyHandler = `on${e.key}Key`;
            // console.log("Pressed key " + e.key + " with code " + e.keyCode +"  from target " + e.target +" custom handler: " + keyHandler +" = " + this[keyHandler]);
            if ((this as any)[keyHandler]) {
                // console.log("Invoking specific key handler")
                (this as any)[keyHandler](e);
            } else {
                this.keyStrokeHandler(e);
            }
        }
        this.html.find('.closeButton').on('click', (e: JQuery.ClickEvent) => this.close());
        this.html.find('.refreshButton').on('click', (e: JQuery.ClickEvent) => this.refresh());
    }

    get html(): JQuery<HTMLElement> {
        return this._html;
    }

    get fileName(): string {
        return this.file.fileName;
    }

    registerMovableEditor(editor: MovableEditor) {
        this.movableEditors.push(editor);
    }

    /**
     * Make sure the editor is on top of the others
     */
    selectMovableEditor(editor: MovableEditor) {
        Util.removeFromArray(this.movableEditors, editor);
        this.movableEditors.push(editor);
        // Now reset z-index of editors, oldest at bottom, newest (this) at top.
        this.movableEditors.forEach((editor, index) => $(editor.html).css('z-index', index + 1));
    }

    /**
     * Give the editor an (initial) position
     */
    positionMovableEditor(editor: MovableEditor) {
        const newPosition = editor.html.offset();
        if (! newPosition) return;
        if (newPosition.left == 0) {
            newPosition.left = 220;
        }
        if (newPosition.top == 0) {
            newPosition.top = 60;
        }

        const MINIMUM_MARGIN_BETWEEN_EDITORS = 30;

        // Do not put this editor at exact same location as one of the others
        //  There must be at least 30 px difference
        this.movableEditors.forEach(sibling => {
            if (sibling != editor && sibling.html.css('display') == 'block') {
                const editorOffset = sibling.html.offset();
                if (! editorOffset) return;

                const leftMargin = editorOffset.left - MINIMUM_MARGIN_BETWEEN_EDITORS;
                const rightMargin = editorOffset.left + MINIMUM_MARGIN_BETWEEN_EDITORS;
                if (newPosition.left > leftMargin && newPosition.left < rightMargin) {
                    newPosition.left = rightMargin;
                }

                const topMargin = editorOffset.top - MINIMUM_MARGIN_BETWEEN_EDITORS;
                const bottomMargin = editorOffset.top + MINIMUM_MARGIN_BETWEEN_EDITORS;
                if (newPosition.top > topMargin && newPosition.top < bottomMargin) {
                    newPosition.top = bottomMargin;
                }
            }
        });

        // Also keep editor inside the browser window
        const bodyWidth = document.body.offsetWidth;
        const bodyHeight = document.body.offsetHeight;
        const editorWidth = editor.html.width();
        const editorHeight = editor.html.height();
        if (editorWidth && editorHeight) {
            if ((newPosition.left + editorWidth) > bodyWidth) {
                newPosition.left = Math.max(0, bodyWidth - editorWidth - MINIMUM_MARGIN_BETWEEN_EDITORS);
            }
            if ((newPosition.top + editorHeight) > bodyHeight) {
                newPosition.top = Math.max(0, bodyHeight - editorHeight - MINIMUM_MARGIN_BETWEEN_EDITORS);
            }    
        }

        editor.html.css('top', newPosition.top);
        editor.html.css('left', newPosition.left);
    }

    /**
     * Hide all movable editors.
     */
    hideMovableEditors() {
        this.movableEditors.forEach(editor => editor.visible = false);
    }

    /**
     * Hides the movable editor on top.
     * @returns true if an editor was hidden, false if no editors are visible
     */
    hideTopEditor(): boolean {
        const editorsReversed = Array.from(this.movableEditors).reverse();
        const visibleEditor = editorsReversed.find(editor => editor.visible)
        if (visibleEditor) {
            visibleEditor.visible = false;
            return true;
        } else {
            return false;
        }
    }

    abstract get label(): string;

    /**
     * Hook to indicate that a user action is completed, e.g. changing an input field
     * has been handled. Can be used by controls to tell the editor something changed.
     * Editor can then decide whether or not to immediately save the model (or await e.g. a timeout)
     */
    abstract completeUserAction(): void;

    abstract loadModel(): void;

    abstract loadSource(source: string): void;

    toString() {
        return this.constructor.name + ' - ' + this.fileName;
    }

    /**
     * Handler invoked after the editor becomes visible.
     */
    onShow() {
    }

    /**
     * Handler invoked after the editor is hidden.
     */
    onHide() {
    }

    keyStrokeHandler(e: JQuery.KeyDownEvent) {
    }

    get visible() {
        return this.html.css('display') == 'block';
    }

    set visible(visible) {
        this.html.css('display', visible ? 'block' : 'none');
        if (visible) {
            $(document.body).off('keydown', this.keyStrokeListener);
            $(document.body).on('keydown', this.keyStrokeListener);    
            this.onShow();
            this.ide.coverPanel.visible = false;
        } else {
            $(document.body).off('keydown', this.keyStrokeListener);
            this.onHide();
        }
    }

    close() {
        this.ide.back();
    }

    destroy() {
        if (this.visible) {
            this.visible = false;
            window.location.hash = '';
        }
        HtmlUtil.removeHTML(this.html);
        Util.removeFromArray(this.ide.editorRegistry.editors, this);
    }

    async refresh() {
        console.groupCollapsed(`Reloading editor of ${this.file}`);
        await this.file.reload().then(() => {
            console.groupEnd();
            this.loadModel();
        }).catch(error => {
            this.ide.warning(error);
        });
    }
}
