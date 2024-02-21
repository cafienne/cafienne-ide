class CaseFileItemProperties extends Properties {
    /**
     * 
     * @param {CaseFileItem} caseFileItem 
     */
    constructor(caseFileItem) {
        super(caseFileItem);
        this.cmmnElement = caseFileItem;
    }

    renderData() {
        const caseFileItemId = this.cmmnElement.shape.cmmnElementRef ? this.cmmnElement.shape.cmmnElementRef : '';
        const cfi = this.cmmnElement.case.caseDefinition.getElement(caseFileItemId);

        //TODO: Fix async binding to external SchemaPropertyDefinition;  For now display a '> '
        const contextName = cfi ? cfi.name : (caseFileItemId.startsWith('sp__') ? '> ' + caseFileItemId : '');

        const html = $(`<div class="zoomRow zoomDoubleRow" title="Drag/drop a case file item from the editor to change the reference">
                            <label class="zoomlabel">Case File Item</label>
                            <label class="valuelabel">${contextName}</label>
                            <button class="zoombt"></button>
                            <button class="removeReferenceButton" title="remove the reference to the case file item" />
                        </div>`);
        this.htmlContainer.append(html);
                        
        html.find('.zoombt').on('click', e => {
            if (this.cmmnElement.case.caseDefinition.caseFile.typeRef) {
                const zoomType = new ZoomTypeDialog(this.cmmnElement.case.editor.ide, this.cmmnElement.case.caseDefinition.caseFile.typeRef);
                zoomType.showModalDialog(retVal => {
                    if (retVal) {
                        this.changeContextRef(html, retVal.property);
                    }
                });
            } else {
                this.cmmnElement.case.cfiEditor.open(cfi => this.changeContextRef(html, cfi));
            }
        });
        html.find('.removeReferenceButton').on('click', e => this.changeContextRef(html));
        html.on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.setDropHandler(dragData => this.changeContextRef(html, dragData.item));
            this.cmmnElement.case.typeEditor.typeEditor.setDropHandler(dragData => this.changeContextRef(html, dragData.item));
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.removeDropHandler();
            this.cmmnElement.case.typeEditor.typeEditor.removeDropHandler();
        });
        this.addDocumentationField();
        this.addIdField();
    }

    changeContextRef(html, newContextRef = undefined) {
        const cfiName = newContextRef ? newContextRef.name : '';
        const cfiId = newContextRef ? newContextRef.id : undefined;
        this.cmmnElement.setDefinition(newContextRef);
        html.find('.valuelabel').html(cfiName);
    }
}
