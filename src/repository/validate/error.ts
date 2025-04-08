import XMLSerializable from "../definition/xmlserializable";
import Remark from "./remark";

export default class Error<E extends XMLSerializable> extends Remark<E> {
    isError(): boolean {
        return true;
    }
}
