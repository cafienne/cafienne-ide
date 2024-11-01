import CMMNElementDefinition from "@definition/cmmnelementdefinition";
import CaseModelEditor from "@ide/modeleditor/case/casemodeleditor";
import CaseView from "@ide/modeleditor/case/elements/caseview";
import Util from "@util/util";
import $ from "jquery";

export default class MovableEditor {
    case: CaseView;
    modelEditor: CaseModelEditor;
    htmlParent: JQuery<HTMLElement>;
    private _visible: boolean = false;
    protected _html?: JQuery<HTMLElement>;
    private _changingVisiblity: any;
    /**
     * A movable editor resides typically within the context of a case.
     * Usually it is something that pops up upon button click (e.g., Properties of an element, Roles Editor, Parameters Editor, etc)
     * It can be moved around and resized.
     * @param {CaseView} cs 
     */
    constructor(cs: CaseView) {
        this.case = cs;
        this.modelEditor = cs.editor;
        this.htmlParent = this.modelEditor.divMovableEditors;
        this.modelEditor.registerMovableEditor(this);
    }

    get html(): JQuery<HTMLElement> {
        // @ts-ignore
        return $(this._html);
    }

    /**
     * @param {JQuery<HTMLElement>} html
     */
    set html(html) {
        this._html = $(html);
    }

    renderForm() {
        console.warn('The editor ' + this.constructor.name + ' does not implement the renderForm() function, but that is expected');
    }

    renderHead() {
        console.warn('The editor ' + this.constructor.name + ' does not implement the renderHead() function, but that is expected');
    }

    renderData() {
        console.warn('The editor ' + this.constructor.name + ' does not implement the renderData() function, but that is expected');
    }

    /**
     * Brings this editor in front of the others
     */
    toFront() {
        this.modelEditor.selectMovableEditor(this);
    }

    get visible() {
        return this._visible;
    }

    /** @param {Boolean} visible */
    set visible(visible) {
        const alreadyVisible = this._visible;
        this._visible = visible;
        if (visible) {
            this.renderForm();
            this.toFront();
            if (! alreadyVisible) {
                this.positionEditor();
            }
        }
        if (this._html) {
            this.html.css('display', visible ? 'block' : 'none');
            if (! this._changingVisiblity) {
                this._changingVisiblity = true;
                const nothing = visible ? this.onShow() : this.onHide();
                this._changingVisiblity = false;
            }
        }
    }

    delete() {
        this._visible = false; // Set visible to false to avoid refresh invocations from refreshMovableViews() inside case.js
        Util.removeHTML(this.html);
    }

    show() {
        this.visible = true;
        // mechanism to handle fact that editor is shown
    }

    hide() {
        this.visible = false;
        // mechanism to handle fact that editor is hidden
    }

    onShow() {
        // mechanism to handle fact that editor is hidden
    }

    onHide() {
        // mechanism to handle fact that editor is hidden
    }

    /**
     * Position this editor along with the others to avoid unclear overlap
     */
    positionEditor() {
        this.modelEditor.positionMovableEditor(this);
    }

    /**
     * Move the editor x pixels to the right, and y pixels down. Negative numbers move it in the opposite direction.
     */
    move(x: number, y: number) {
        const top = parseInt(this.html.css('top'));
        const left = parseInt(this.html.css('left'));
        this.html.css('left', left + x);
        this.html.css('top', top + y);
    }

    refresh() {
    }

    /**
     * Method invoked after a role or case file item has changed
     */
    refreshReferencingFields(definitionElement: CMMNElementDefinition) {}

    toString() {
        return this.constructor.name;
    }
}
