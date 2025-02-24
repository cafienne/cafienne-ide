import DragData from "../../../dragdrop/dragdata";
import ShapeBox from "./shapebox";

export default class ShapeBoxDragData extends DragData {
    constructor(shapeBox: ShapeBox, public shapeType: Function, typeDescription: string, smallImageURL: string) {
        super(shapeBox, typeDescription, smallImageURL);
    }
}
