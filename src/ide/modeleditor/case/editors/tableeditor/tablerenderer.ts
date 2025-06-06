import $ from "jquery";
import ElementDefinition from "../../../../../repository/definition/elementdefinition";
import StandardForm from "../../../../editors/standardform";
import HtmlUtil from "../../../../util/htmlutil";
import CaseModelEditor from "../../casemodeleditor";
import CaseView from "../../elements/caseview";
import ColumnRenderer from "./columnrenderer";
import RowRenderer from "./rowrenderer";

export default abstract class TableRenderer<E extends ElementDefinition, R extends RowRenderer<E>, C extends ColumnRenderer<E, R>> {
    case: CaseView;
    rows: R[] = [];

    private _html!: JQuery<HTMLElement>;
    htmlContainer!: JQuery<HTMLElement>;
    private _selectedElement?: E;
    editor: CaseModelEditor;
    /**
     * Defines a generic control for collections of CMMNElementDefinition, to select and edit data in a table
     */
    constructor(cs: StandardForm, public htmlParent: JQuery<HTMLElement>) {
        this.case = cs.case;
        this.editor = this.case.editor;
    }

    get html() {
        return this._html;
    }

    set html(html: JQuery<HTMLElement>) {
        this._html = html;
        // console.log("Setting the html of the table renderer ...")
        this.htmlParent.append(html);
    }

    /**
      * Clears the content of the editor and removes all event handlers (recursively on all child html elements)
      * Note, this is different from "delete()", since delete removes all html, not just the data related content of the editor.
      */
    clear() {
        this.rows = [];
        HtmlUtil.clearHTML(this.htmlContainer);
    }

    /**
     * Renders the table inside the control again, but only if it has already been rendered.
     */
    refresh() {
        if (this._html) {
            this.renderTable();
        }
    }

    /**
     * Clears the current content of the editor and renders it again
     */
    renderTable() {
        if (!this._html) {
            this.renderHead();
        }
        this.renderData();
    }

    renderHead() {
        //create the html element of the editor form
        this.html = $(`<table>
                        <colgroup>
                            ${this.columns.map(column => column.col).join('\n')}
                        </colgroup>
                        <thead>
                            <tr>
                                ${this.columns.map(column => column.th).join('\n')}
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>`);

        this.htmlParent.append(this.html);
        this.htmlContainer = this.html.find('tbody');
    }

    /**
     * Removes current data content (and event handlers), 
     * and freshly renders the data again.
     */
    renderData() {
        this.clear();
        this.data.forEach(element => this.renderElement(element));
        this.renderElement(); // Add an empty renderer at the bottom, for creating new elements
    }

    renderElement(element: E | undefined = undefined) {
        const rowRenderer = this.addRenderer(element);
        if (rowRenderer) { // Also create the columns
            const tdElements = rowRenderer.html.find('td');
            this.columns.forEach((columnRenderer, index) => {
                const td = tdElements[index]; // There MUST be as many TDs as columns. Else let it crash. Also: better we create the td here instead...
                columnRenderer.render($(td), rowRenderer);
            });
        }

    }

    abstract addRenderer(element: E | undefined): R;
    abstract get data(): E[];
    abstract get columns(): C[];

    get activeNode(): E | undefined {
        return this._selectedElement;
    }

    set activeNode(node: E | undefined) {
        this._selectedElement = node;
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
     * when the name of a case file item is changed the zoom fields must be updated
     */
    refreshReferencingFields(definitionElement: E) {
        this.rows.forEach(row => row.refreshReferencingFields(definitionElement));
    }
}
