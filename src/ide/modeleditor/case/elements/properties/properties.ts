import $ from "jquery";
import CMMNElementDefinition from "../../../../../repository/definition/cmmnelementdefinition";
import XMLSerializable from "../../../../../repository/definition/xmlserializable";
import Util from "../../../../../util/util";
import MovableEditor from "../../../../editors/movableeditor";
import HtmlUtil from "../../../../util/htmlutil";
import Images from "../../../../util/images/images";
import CMMNElementView from "../cmmnelementview";

export default class Properties<V extends CMMNElementView = CMMNElementView> extends MovableEditor {
    id: string;
    pinned: boolean = false; //pinned determines whether a properties menu is pinned, pinned=true means that the menu stays on the same spot all the time
    htmlContainer!: JQuery<HTMLElement>;

    /**
     * Renderer for the properties of the element
     */
    constructor(public view: V) {
        // console.log("Creating properties for " + view)
        super(view.case);
        this.id = 'propertiesmenu-' + view.id;
    }

    renderForm() {
        if (!this.htmlContainer) {
            this.renderHead();
        }
        this.renderData();
    }

    get label() {
        return `${this.view.typeDescription} Properties`;
    }

    renderHead() {
        this.html = $(
            `<div element="${this.view.name}" id="${this.id}" class="basicbox basicform properties ${this.view.constructor.name.toLowerCase()}-properties">
                <div class="formheader">
                    <label>${this.label}</label>
                    <div class="propertiespin">
                        <img src="${Images.Pin}" />
                    </div>
                    <div class="formclose">
                        <img src="${Images.Close}" />
                    </div>
                </div>
                <div class="formcontainer properties-container"></div>
                <div class="properties-footer"></div>
            </div>`);
        this.htmlParent.append(this.html);
        this.htmlContainer = this.html.find('.properties-container');

        // set the events that control the drag/drop, close and pin of the properties menu
        this.html.resizable();
        this.html.draggable({
            handle: '.formheader',
            stop: () => {
                // workaround for bug in jqueryui, jquery ui sets absolute height and width after dragging
                // this.html.css('height', 'auto');
                // this.html.css('width', 'auto');
            }
        });
        this.html.find('.formclose').on('click', () => this.hide());
        this.html.find('.propertiespin').on('click', e => {
            // Pin/unpin the menu
            const changePinOperation = this.pinned ? 'removeClass' : 'addClass';
            $(e.currentTarget)[changePinOperation]('pinned');
            this.pinned = !this.pinned;
        });

        this.html.on('pointerdown', () => this.toFront());
        // Avoid keying down in input fields to propagate (except for escape, which closes the editor)
        this.html.on('keydown', (e: JQuery.KeyDownEvent) => {
            if (e.keyCode == 27) {
                // let Esc pass
            } else {
                // Avoid arrow control on an input to move the properties screen (next to moving the cursor in the text)
                e.stopPropagation();
            }
        });
    }

    /**
     * Renders the content of the properties view
     */
    renderData() { }

    clear() {
        if (this.htmlContainer) {
            HtmlUtil.clearHTML(this.htmlContainer);
        }
    }

    refresh() {
        this.clear();
        this.renderForm();
    }

    /**
     * Shows the properties of the element.
     * Optionally sets the focus on the description property of the element (typically used for new elements)
     */
    show(focusNameField = false) {
        this.clear();
        // Make us visible.
        this.visible = true;
        // Hide other properties editors (if they are not pinned)
        this.case.items.filter(item => item != this.view).forEach(item => item.propertiesView.hide());

        if (focusNameField) {
            this.htmlContainer.find('.cmmn-element-name').select();
        }
    }

    positionEditor() {
        // If not pinned, then determine our latest & greatest position
        if (!this.pinned) {
            // the menu is not pinned and not visible, show near element
            // get position of element, place property menu left of element
            const eX = this.view.position.x;
            const eY = this.view.position.y;
            const eWidth = this.view.size.width;

            const menuWidth: any = this.html.width();
            const menuHeight: any = this.html.height();
            const bdyHeight = $(document).height() || 0;
            const canvasOffset = (this.view.case as any).svg.offset() || { left: 0, top: 0 };

            // compensate for paper offset and scroll
            let leftPosition = (eX ?? 0) - menuWidth + canvasOffset.left - 10;
            let topPosition = eY + canvasOffset.top;

            // when menu outside body reposition
            if (leftPosition < 0) {
                leftPosition = 2;
            }
            if (topPosition < 0) {
                topPosition = 2;
            }
            if (topPosition + menuHeight > bdyHeight) {
                topPosition = bdyHeight - menuHeight - 4;
            }

            this.html.css({
                left: leftPosition,
                top: topPosition
            });
        }
    }

    hide() {
        // Only hide if not pinned.
        if (!this.pinned) {
            super.hide();
        }
    }

    change(element: XMLSerializable, field: string, value: any) {
        element.change(field, value);
        this.done();
    }

    /**
     * Insert a description field
     */
    addDescription(description: string) {
        const html = $(`<div class="descriptionBlock">${description}</div>`);
        this.htmlContainer.append(html);
        return html;
    }

    /**
     * Add a label, e.g. for an explanation.
     */
    addLabelField(...labels: string[]) {
        const html = $(`<div class="propertyBlock">
                            ${labels.map(label => `<label>${label}</label>`).join('\n')}
                        </div>`);
        this.htmlContainer.append(html);
        return html;
    }

    /**
     * Add a plain input field to show the property
     */
    addInputField(label: string, propertyType: string, element: XMLSerializable = this.view.definition) {
        const html = $(`<div class="propertyBlock">
                            <label>${label}</label>
                            <input class="single" value="${(element as any)[propertyType]}"></input>
                        </div>`);
        html.on('change', (e: JQuery.ChangeEvent) => this.change(element, propertyType, (e.target as HTMLInputElement).value));
        this.htmlContainer.append(html);
        return html;
    }

    addNameField() {
        const label = this.view.typeDescription + ' Name';
        const html = this.addTextField(label, 'name');
        // Adding class such that we can easily select the description
        html.find('textarea').addClass('cmmn-element-name');
    }

    addIdField() {
        this.addSeparator();
        this.addSeparator();
        const html = $(
            `<div class="propertyRule" title="Unique identifier of the element">
                <div class="cmmn-element-id">${this.view.definition.id}</div>
            </div>`);
        this.htmlContainer.append(html);
    }

    addDocumentationField() {
        const documentation = this.view.documentation;
        const html = $(`<div class="propertyBlock">
                            <label>Documentation</label>
                            <textarea class="multi cmmn-element-documentation" readonly>${documentation && documentation.text || ''}</textarea>
                        </div>`);
        this.htmlContainer.append(html);
        const textarea = html.find('textarea');
        // On pointer down we enable editing the documentation, but only if it exists
        textarea.on('pointerdown', () => {
            if (documentation) {
                textarea.attr('readonly', '' + false);
                textarea.addClass('edit-cmmn-documentation');
            }
        });
        // After change we make the textarea readonly again
        textarea.on('change', (e: JQuery.ChangeEvent) => {
            textarea.removeClass('edit-cmmn-documentation');
            textarea.attr('readonly', 'true');
            if (documentation) {
                documentation.text = (e.target as HTMLTextAreaElement).value;
            }
            this.done();
        });
        // And on blur as well
        textarea.on('blur', () => {
            textarea.removeClass('edit-cmmn-documentation');
            textarea.attr('readonly', 'true');
        });
        return html;
    }

    /**
     * Add a text area to show the property
     */
    addTextField(label: string, propertyType: string, element: XMLSerializable = this.view.definition) {
        const html = $(`<div class="propertyBlock">
                            <label>${label}</label>
                            <textarea class="multi">${(element as any)[propertyType]}</textarea>
                        </div>`);
        html.on('change', (e: JQuery.ChangeEvent) => this.change(element, propertyType, (e.target as HTMLTextAreaElement).value));
        this.htmlContainer.append(html);
        return html;
    }

    /**
     * Add a checkbox property
     */
    addCheckField(label: string, title: string, imageURL: string, propertyType: string, element: XMLSerializable = this.view.definition) {
        const checked = (element as any)[propertyType] == true ? ' checked' : '';
        const checkId = Util.createID();
        const html = $(`<div class="propertyRule" title="${title}">
                            <div class="propertyRow">
                                <input id="${checkId}" type="checkbox" ${checked} />
                                <img src="${imageURL}" />
                                <label for="${checkId}">${label}</label>
                            </div>
                        </div>`);
        html.on('change', (e: JQuery.ChangeEvent) => this.change(element, propertyType, (e.target as HTMLInputElement).checked));
        this.htmlContainer.append(html);
        return html;
    }

    addSeparator() {
        const html = $('<span class="separator"></span>');
        this.htmlContainer.append(html);
        return html;
    }

    /**
     * Method invoked after a role or case file item has changed
     */
    refreshReferencingFields(definitionElement: CMMNElementDefinition) {
        if (this.visible) {
            this.show();
        }
    }

    /**
     * Complete a change. Refreshes the CMMNElementView and saves the case model.
     */
    done() {
        this.view.refreshView();
        this.case.editor.completeUserAction();
    }
}
