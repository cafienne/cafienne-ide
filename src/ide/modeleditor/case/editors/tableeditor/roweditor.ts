import ElementDefinition from "../../../../../repository/definition/elementdefinition";
import HtmlUtil from "../../../../util/htmlutil";
import TableEditor from "./tableeditor";

export default abstract class RowEditor<E extends ElementDefinition = ElementDefinition> {
    private _element?: E;
    private _html!: JQuery<HTMLElement>;
    /**
     * Base class for rendering a row in the table editor
     */
    constructor(public editor: TableEditor<E>, element?: E) {
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
     */
    set html(html: JQuery<HTMLElement>) {
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
     */
    change(propertyName: string, propertyValue: any) {
        this.editor.change(this.element, propertyName, propertyValue);
    }

    /**
     * Deletes this row and the associated definition.
     * @param {*} e 
     */
    delete(e: JQuery.Event) {
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

    abstract createElement(): E;

    /**
     * Gives an indication whether this is a newly added renderer without any data associated.
     */
    isEmpty() {
        return this._element == undefined;
    }

    get element(): E {
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
     */
    refreshReferencingFields(definitionElement: E) { }
}
