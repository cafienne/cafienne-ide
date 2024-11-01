import CaseFileEditor from "@ide/modeleditor/case/editors/file/casefileeditor";
import CaseFileItemView from "@ide/modeleditor/case/elements/casefileitemview";
import CaseFileItemDef from "@repository/definition/cmmn/casefile/casefileitemdef";
import DragData from "./dragdata";

export default class CaseFileItemDragData extends DragData {
    constructor(editor: CaseFileEditor, public item: CaseFileItemDef) {
        super(editor, item.name, (CaseFileItemView as any).smallImage);
    }
}
