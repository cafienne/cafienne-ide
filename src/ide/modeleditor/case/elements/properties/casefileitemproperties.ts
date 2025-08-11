import $ from "jquery";
import CaseFileItemDef from "../../../../../repository/definition/cmmn/casefile/casefileitemdef";
import Properties from "../../../../editors/modelcanvas/properties";
import CaseFileItemView from "../casefileitemview";

export default class CaseFileItemProperties extends Properties<CaseFileItemView> {
    renderData() {
        const caseFileItemId = this.view.shape.cmmnElementRef ? this.view.shape.cmmnElementRef : '';
        const cfi = this.view.case.caseDefinition.getElement(caseFileItemId) as CaseFileItemDef | undefined;
        const contextName = cfi ? cfi.name : '';

        const html = $(`<div class="zoomRow zoomDoubleRow" title="Drag/drop a case file item from the editor to change the reference">
                            <label class="zoomlabel">Case File Item</label>
                            <label class="valuelabel">${contextName}</label>
                            <button class="zoombt"></button>
                            <button class="removeReferenceButton" title="remove the reference to the case file item" />
                        </div>`);
        this.htmlContainer.append(html);

        html.find('.zoombt').on('click', e => this.view.case.cfiEditor.open((cfi: CaseFileItemDef) => this.changeContextRef(html, cfi)));
        html.find('.removeReferenceButton').on('click', e => this.changeContextRef(html));
        html.on('pointerover', e => {
            e.stopPropagation();
            this.view.case.cfiEditor.setDropHandler((dragData: { item: CaseFileItemDef }) => this.changeContextRef(html, dragData.item));
        });
        html.find('.zoomRow').on('pointerout', e => this.view.case.cfiEditor.removeDropHandler());
        this.addDocumentationField();
        this.addIdField();
    }

    changeContextRef(html: JQuery<HTMLElement>, cfi: CaseFileItemDef | undefined = undefined) {
        const cfiName = cfi ? cfi.name : '';
        this.view.setDefinition(cfi);
        html.find('.valuelabel').html(cfiName);
    }
}
