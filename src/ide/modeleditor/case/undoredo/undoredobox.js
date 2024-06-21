
export default class UndoRedoBox {
    /**
     *
     * @param {CaseView} cs
     * @param {JQuery<HTMLElement>} html
     */
    constructor(cs, html) {
        this.case = cs;
        this.html = html;
        this.html.append(
            $(`<div class="formheader">
    <div>
        <div class="undo" type="button" title="Undo">
            <span></span>
            <img src="images/undo_128.png" />
        </div>                
        <div class="redo" type="button" title="Redo">
            <img src="images/redo_128.png" />
            <span></span>
        </div>
    </div>
</div>`));
        html.find('.undo').on('click', () => this.undo());
        html.find('.redo').on('click', () => this.redo());
        this.spanUndoCounter = html.find('.undo span');
        this.spanRedoCounter = html.find('.redo span');
    }

    undo() {
        this.case.editor.undoManager.undo();
    }

    redo() {
        this.case.editor.undoManager.redo();
    }

    updateButtons(undoCount, redoCount) {
        this.spanUndoCounter.html(undoCount);
        this.spanRedoCounter.html(redoCount);
    }
}
