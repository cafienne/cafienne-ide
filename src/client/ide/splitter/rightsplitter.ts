import HorizontalSplitter from "./horizontalsplitter";

export default class RightSplitter extends HorizontalSplitter {
    /**
     * Creates a splitter that by default aligns to the right 
     * (i.e., keeps the right div static, and resize left part upon parent resize)
     */
    constructor(public container: JQuery<HTMLElement>, offset: string | number, minimumSize = 0) {
        super(container, offset, minimumSize);
    }

    get direction() {
        return 'right';
    }

    get minimizeImgURL() {
        return 'images/doubleright_32.png';
    }

    get restoreImgURL() {
        return 'images/doubleleft_32.png';
    }

    /** @returns {Number} */
    get restoreImgLocation() {
        return -10;
    }

    get farEnd() {
        const width = this.container.width();
        if (!width) {
            throw new Error('There is not width here?!')
        }
        return width - this.minimumSize;
    }

    repositionSplitter(newPosition: number) {
        super.repositionSplitter(newPosition);
        if (this.container.width()) {
            // If the splitter moved near the farEnd, then we should show the restore image
            this.restoreImg?.css('display', newPosition >= this.farEnd - 5 ? 'block' : 'none');
        }
    }
}
