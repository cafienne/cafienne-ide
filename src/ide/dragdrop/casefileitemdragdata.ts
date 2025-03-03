import CaseFileItemDef from "../../repository/definition/cmmn/casefile/casefileitemdef";
import CaseFileEditor from "../modeleditor/case/editors/file/casefileeditor";
import CaseFileItemView from "../modeleditor/case/elements/casefileitemview";
import DragData from "./dragdata";

export default class CaseFileItemDragData extends DragData {
    constructor(editor: CaseFileEditor, public item: CaseFileItemDef) {
        super(editor, item.name, (CaseFileItemView as any).smallImage);
    }
}
