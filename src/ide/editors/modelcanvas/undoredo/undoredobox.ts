import $ from "jquery";
import Images from "../../../util/images/images";
import ModelCanvas from "../modelcanvas";

export default class UndoRedoBox<CanvasT extends ModelCanvas> {
    private case: CanvasT;
    private spanUndoCounter: JQuery<HTMLElement>;
    private spanRedoCounter: JQuery<HTMLElement>;

    /**
     * @param cs CaseView
     * @param html JQuery<HTMLElement>
     */
    constructor(cs: CanvasT, public html: JQuery<HTMLElement>) {
        this.case = cs;
        this.html.append(
            $(`<div class="formheader">
    <div>
        <div class="undo" type="button" title="Undo">
            <span></span>
            <img src="${Images.Undo}" />
        </div>                
        <div class="redo" type="button" title="Redo">
            <img src="${Images.Redo}" />
            <span></span>
        </div>
    </div>
</div>`)
        );
        html.find('.undo').on('click', () => this.undo());
        html.find('.redo').on('click', () => this.redo());
        this.spanUndoCounter = html.find('.undo span');
        this.spanRedoCounter = html.find('.redo span');
    }

    undo(): void {
        this.case.undoManager.undo();
    }

    redo(): void {
        this.case.undoManager.redo();
    }

    updateButtons(undoCount: number, redoCount: number): void {
        this.spanUndoCounter.html(String(undoCount));
        this.spanRedoCounter.html(String(redoCount));
    }
}
