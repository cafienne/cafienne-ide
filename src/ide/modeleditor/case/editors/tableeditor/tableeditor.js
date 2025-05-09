import $ from "jquery";
import CMMNElementDefinition from "../../../../../repository/definition/cmmnelementdefinition";
import MovableEditor from "../../../../editors/movableeditor";
import HtmlUtil from "../../../../util/htmlutil";
import Images from "../../../../util/images/images";
import CaseView from "../../elements/caseview";

export default class TableEditor extends MovableEditor {
    /**
     * Defines a generic editor for collections of CMMNElementDefinition, to select and edit data in a table
     * Defines a generic TableEditor, to select and edit data in a table
     * @param {CaseView} cs 
     */
    constructor(cs) {
        super(cs);
        // this.id = this.case.id + '_' + this.constructor.name;
        /** @type {Array<RowEditor>} */
        this.rows = []; // Reset array of row renderers
    }

    /** @returns {Array<TableEditorColumn>} */
    get columns() {
        throw new Error('Columns must be implemented in table editor');
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

    /**
     * 
     * @param {CMMNElementDefinition} element 
     * @returns {RowEditor}
     */
    addRenderer(element = undefined) {
        throw new Error('Method addRenderer must be implemented in table editor ' + this.constructor.name);
    }

    /**
     * @returns {String}
     */
    get label() {
        throw new Error('Property label is not implemented for ' + this.constructor.name);
    }

    /**
     * @returns {Array<CMMNElementDefinition>}
     */
    get data() {
        throw new Error('Property data is not implemented for ' + this.constructor.name);
    }

    clickOK(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    delete() {
        // Delete the generic events of the editor (e.g. click add button, ...)
        HtmlUtil.removeHTML(this.html);
    }

    /**
     * 
     * @param {CMMNElementDefinition} element 
     * @param {String} field 
     * @param {*} value 
     */
    change(element, field, value) {
        element.change(field, value);
        this.case.editor.completeUserAction();
    }

    /**
     * when the description of a case file item is changed the zoom fields must be updated
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) {
        this.rows.forEach(row => row.refreshReferencingFields(definitionElement));
    }
}

export class TableEditorColumn {
    /**
     * Base class for describing a column in a row in the table editor
     * @param {String} label 
     * @param {String} width 
     * @param {String} title 
     * @param {String} classNames 
     */
    constructor(label, width, title = label, classNames = '') {
        this.width = width;
        this.label = label;
        this.title = title;
        this.classNames = classNames;
    }

    get col() {
        return `<col width="${this.width}" class="${this.classNames}"></col>`;
    }

    get th() {
        return `<th title="${this.title}">${this.label}</th>`;
    }
}

export class RowEditor {
    /**
     * Base class for rendering a row in the table editor
     * @param {TableEditor} editor 
     * @param {CMMNElementDefinition} element 
     */
    constructor(editor, element = undefined) {
        this.editor = editor;
        this.editor.rows.push(this);
        this._element = element;
    }

    get case() {
        return this.editor.case;
    }

    get html() {
        return this._html;
    }

    /**
     * Setting the html will also add it to the table  
     * @returns {JQuery<HTMLElement>}
     */
    set html(html) {
        this._html = html;
        this.editor.htmlContainer.append(html);
        html.on('click', e => { // Highlight selected row
            e.stopPropagation();
            this.editor.htmlContainer.children().toArray().forEach(child => {
                const color = child == this.html[0] ? 'royalblue' : '';
                $(child).css('background-color', color);
            });
        });
        // Avoid pressing delete key leads to remove elements selected.
        html.on('keydown', e => {
            if (e.keyCode == 27) { // 'Esc' closes editor
                this.editor.hide();
            }
            e.stopPropagation();
        });

        // Check for a delete button (with that id) and add event handler
        html.find('.btnDelete').on('click', e => this.delete(e));
    }

    /**
     * Change a property of the element into the new value
     * @param {String} propertyName 
     * @param {*} propertyValue 
     */
    change(propertyName, propertyValue) {
        this.editor.change(this.element, propertyName, propertyValue);
    }

    /**
     * Deletes this row and the associated definition.
     * @param {*} e 
     */
    delete(e) {
        e.stopPropagation();
        if (this.isEmpty()) return;
        // Ask whether our element is in use by someone else, before it can be deleted.
        if (this.case.items.find(item => item.referencesDefinitionElement(this.element.id))) {
            this.case.editor.ide.danger('The element is in use, it cannot be deleted');
        } else {
            // delete the role
            HtmlUtil.removeHTML(this.html);
            this.element.removeDefinition();
            this.case.editor.completeUserAction();
        }
    }

    /**
     * @returns {CMMNElementDefinition}
     */
    createElement() {
        throw new Error('The row renderer ' + this.constructor.name + ' must implement this method');
    }

    /**
     * Gives an indication whether this is a newly added renderer without any data associated.
     * @returns {Boolean}
     */
    isEmpty() {
        return this._element == undefined;
    }

    /**
     * @returns {CMMNElementDefinition}
     */
    get element() {
        if (!this._element) {
            this._element = this.createElement();
            this.editor.data.push(this._element);
            this.editor.addRenderer(); // Add a new empty role
        }
        return this._element;
    }

    set element(element) {
        this._element = element;
    }

    /**
     * Refreshes the visualizers relating to the definition element
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) { }
}
