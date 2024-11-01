import Splitter from "./splitter";

export default class VerticalSplitter extends Splitter {
    // Vertical splitter does not support minimize and restore as of now.


    get sizeAttribute() {
        return 'height';
    }

    get orientation() {
        return 'vertical';
    }

    get clientPosition() {
        return 'clientY';
    }
}
