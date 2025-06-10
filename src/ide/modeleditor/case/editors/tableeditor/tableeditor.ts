import $ from "jquery";
import ElementDefinition from "../../../../../repository/definition/elementdefinition";
import MovableEditor from "../../../../editors/movableeditor";
import HtmlUtil from "../../../../util/htmlutil";
import Images from "../../../../util/images/images";
import CaseView from "../../elements/caseview";
import RowEditor from "./roweditor";
import TableEditorColumn from "./tableeditorcolumn";

export default abstract class TableEditor<E extends ElementDefinition> extends MovableEditor<E> {
    rows: RowEditor[];
    htmlContainer!: JQuery<HTMLElement>;
    id: string = '';
    /**
     * Defines a generic editor for collections of CMMNElementDefinition, to select and edit data in a table
     * Defines a generic TableEditor, to select and edit data in a table
     */
    constructor(cs: CaseView) {
        super(cs);
        // this.id = this.case.id + '_' + this.constructor.name;
        /** @type {Array<RowEditor>} */
        this.rows = []; // Reset array of row renderers
    }

    abstract get columns(): TableEditorColumn[];

    /**
     * Clears the content of the editor and removes all event handlers (recursively on all child html elements)
     * Note, this is different from "delete()", since delete removes all html, not just the data related content of the editor.
     */
    clear() {
        this.rows = [];
        HtmlUtil.clearHTML(this.htmlContainer);
    }

    /**
     * Clears the current content of the editor and renders it again
     */
    renderForm() {
        if (!this._html) {
            this.renderHead();
        }
        this.renderData();
    }

    renderHead() {
        //create the html element of the editor form
        this.html = $(`<div id='${this.id}' class='tableeditorform basicbox basicform'>
                                <div class="formheader">
                                    <label>${this.label}</label>
                                    <div class="formclose">
                                        <img src="${Images.Close}" />
                                    </div>
                                </div>
                                <div class="tableeditorcontainer">
                                    <div id="containerbox" class="containerbox">
                                        <table>
                                            <colgroup>
                                                ${this.columns.map(column => column.col).join('\n')}
                                            </colgroup>
                                            <thead>
                                                <tr>
                                                    ${this.columns.map(column => column.th).join('\n')}
                                                </tr>
                                            </thead>
                                            <tbody></tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>`);

        this.htmlParent.append(this.html);
        this.htmlContainer = this.html.find('tbody');

        //make the editor draggable
        this.html.draggable({ handle: '.formheader' });
        this.html.resizable();

        //add the event handles, for adding and removing data at top level
        this.html.find('.formclose').on('click', e => this.hide());

        //add event for OK, cancel and close buttons (bottom)
        this.html.find('.btnOK').on('click', e => this.clickOK(e));
        this.html.find('.btnCancel').on('click', e => this.hide());
        this.html.find('.btnClose').on('click', e => this.hide());

        //add event for click/mousedown on tree editor
        this.html.on('pointerdown', e => this.toFront());
    }

    /**
     * Removes current data content (and event handlers), 
     * and freshly renders the data again.
     */
    renderData() {
        this.clear();
        this.data.forEach(element => this.addRenderer(element));
        const renderer = this.addRenderer(); // Add an empty renderer at the bottom, for creating new elements
    }

    abstract addRenderer(element?: E): RowEditor<E> | undefined;

    abstract get label(): string;

    abstract get data(): E[];

    clickOK(e: JQuery.Event) {
        e.stopPropagation();
        e.preventDefault();
    }

    delete() {
        // Delete the generic events of the editor (e.g. click add button, ...)
        HtmlUtil.removeHTML(this.html);
    }

    change(element: E, field: string, value: any) {
        element.change(field, value);
        this.case.editor.completeUserAction();
    }

    /**
     * when the description of a case file item is changed the zoom fields must be updated
     */
    refreshReferencingFields(definitionElement: E) {
        this.rows.forEach(row => row.refreshReferencingFields(definitionElement));
    }
}
