import XMLSerializable from "../definition/xmlserializable";
import Remark from "./remark";

export default class Warning<E extends XMLSerializable> extends Remark<E> {
    isWarning(): boolean {
        return true;
    }
}
