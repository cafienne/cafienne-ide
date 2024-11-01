import Splitter from "./splitter";
import $ from "jquery";

export default class HorizontalSplitter extends Splitter {
    minimizeImg?: JQuery<HTMLElement>;
    restoreImg?: JQuery<HTMLElement>;
    constructor(public container: JQuery<HTMLElement>, offset: string | number, minimumSize = 0) {
        super(container, offset, minimumSize);
    }

    get positionAttribute() {
        return 'left';
    }

    get oppositePositionAttribute() {
        return 'right';
    }

    get sizeAttribute() {
        return 'width';
    }
    
    afterCreateBar() {
        this.attachMinimizer();
    }

    attachMinimizer() {
        this.bar.html(
            `<div class="splitter-minimize basicbox" title="Minimize">
                <img src="${this.minimizeImgURL}" />
            </div>
            <div class="splitter-restore basicbox" style="left:${this.restoreImgLocation}px" title="Restore">
                <img src="${this.restoreImgURL}" />
            </div>`);


        this.minimizeImg = this.bar.find('.splitter-minimize');
        this.minimizeImg.on('click', e => {
            e.preventDefault();
            e.stopPropagation();
            this.minimize();
        });
        this.minimizeImg.on('pointerdown', e => {
            e.preventDefault();
            e.stopPropagation();
        });

        this.restoreImg = this.bar.find('.splitter-restore');
        this.restoreImg.on('click', e => {
            e.preventDefault();
            e.stopPropagation();
            this.restore();
        });
        this.restoreImg.on('pointerdown', e => {
            e.preventDefault();
            e.stopPropagation();
        });

        const near = (a: number, b: number) => a >= b - 10 && a <= b + 10;

        this.container.on('pointermove', (e: any) => {
            const offset = this.bar.offset();
            if (! offset) return;
            if (near(e.clientX, offset.left)) {
                if (this.restoreImg?.css('display') == 'block') {
                    // not showing the collapse img, because we're already in collapsed state
                } else {
                    this.minimizeImg?.css('display', 'block');
                }
            } else {
                this.minimizeImg?.css('display', 'none');
            }
        });
    }

    get minimizeImgURL(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get restoreImgURL(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get restoreImgLocation(): number {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get orientation(): string {
        return 'horizontal';
    }

    get farEnd(): number {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get clientPosition(): string {
        return 'clientX';
    }

    minimize() {
        this.savedPosition = this.position;
        this.repositionSplitter(this.farEnd);
        this.restoreImg?.css('display', 'block');
        this.minimizeImg?.css('display', 'none');
    }

    restore() {
        this.restoreImg?.css('display', 'none');
        if (this.savedPosition) this.repositionSplitter(this.savedPosition);
    }

    /**
     * @returns {Boolean} true if the splitter has been minimized by clicking the minimize button
     */
    get minimized() {
        return this.restoreImg?.css('display') == 'block';
    }
}
