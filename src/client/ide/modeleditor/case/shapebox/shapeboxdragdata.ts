import ShapeBox from "@ide/modeleditor/case/shapebox/shapebox";
import DragData from "../../../dragdrop/dragdata";

export default class ShapeBoxDragData extends DragData {
    constructor(shapeBox: ShapeBox, public shapeType: Function, typeDescription: string, smallImageURL: string) {
        super(shapeBox, typeDescription, smallImageURL);
    }
}
