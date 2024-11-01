import VerticalSplitter from "./verticalsplitter";

export default class TopSplitter extends VerticalSplitter {
    get direction() {
        return 'top';
    }

    get positionAttribute() {
        return 'bottom';
    }

    get oppositePositionAttribute() {
        return 'top';
    }
}
