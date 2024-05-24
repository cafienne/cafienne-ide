import VerticalSplitter from "./verticalsplitter";

export default class BottomSplitter extends VerticalSplitter {
    get direction() {
        return 'bottom';
    }

    get positionAttribute() {
        return 'top';
    }

    get oppositePositionAttribute() {
        return 'bottom';
    }
}
