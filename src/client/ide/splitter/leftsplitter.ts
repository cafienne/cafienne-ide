import HorizontalSplitter from "./horizontalsplitter";

export default class LeftSplitter extends HorizontalSplitter {
    /**
     * Creates a splitter that by default aligns to the right 
     * (i.e., keeps the right div static, and resize left part upon parent resize)
     */
    constructor(public container: JQuery<HTMLElement>, offset: string | number, minimumSize = 0) {
        super(container, offset, minimumSize);
    }

    get direction() {
        return 'left';
    }

    get minimizeImgURL() {
        return 'images/doubleleft_32.png';
    }

    get restoreImgURL() {
        return 'images/doubleright_32.png';
    }

    /** @returns {Number} */
    get restoreImgLocation() {
        return 2;
    }

    get farEnd() {
        return this.minimumSize;
    }

    repositionSplitter(newPosition: number) {
        super.repositionSplitter(newPosition);
        // If the splitter moved all the way to the farEnd, then we should show the restore image
        this.restoreImg?.css('display', newPosition <= this.farEnd + 5 ? 'block' : 'none');
    }     
}
