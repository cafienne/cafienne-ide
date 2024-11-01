import Util from "@util/util";
import SplitterSettings from "./splittersettings";
import Settings from "@ide/settings/settings";
import $ from "jquery";

export default class Splitter {
    private static _settings?: SplitterSettings;
    private static splitters: Splitter[] = [];
    startSize: number = 0;
    minimumSize: number;
    settings: SplitterSettings;
    div1: JQuery<HTMLElement>;
    div2: JQuery<HTMLElement>;
    bar: JQuery<HTMLElement>;
    splitterMover: (e: any) => void;
    splitterMoved: (e: any) => void;
    private _parentSplitter?: Splitter;
    private _child?: Splitter;

    /** @returns {SplitterSettings} */
    static get Settings(): SplitterSettings {
        if (!Splitter._settings) {
            Splitter._settings = Object.assign(new SplitterSettings, Settings.splitters);
        }
        return Splitter._settings as SplitterSettings;
    }

    /**
     * Creates a new Splitter object for the container.
     */
    constructor(public container: JQuery<HTMLElement>, defaultPosition: string | number, minimumSize = 0) {
        Splitter.splitters.push(this);
        this.settings = Splitter.Settings.get(container);
        if (! this.settings.savedPosition) {
            this.settings.savedPosition = defaultPosition;
        }
        if (! this.settings.position) {
            this.settings.position = defaultPosition;
        }
        this.minimumSize = minimumSize;
        
        this.connectParent();

        // Create the bar object
        const children = this.container.children();
        if (children.length != 2) {
            throw new Error('Splitter can only work on a container with 2 children. Container has ' + children.length + ' children instead');
        }
        this.div1 = children.first();
        this.div2 = children.next();
        this.bar = $(`<div class="${this.orientation}-splitter"></div>`); // Orientation is either 'horizontal' or 'vertical'
        this.splitterMover = e => this.handlePointerMove(e);
        this.splitterMoved = e => this.handlePointerUp(e);
        this.bar.on('pointerdown', e => this.handlePointerDown(e));
        this.bar.insertAfter(this.div1);
        this.div1.css('position', 'absolute');
        this.div2.css('position', 'absolute');

        this.afterCreateBar();

        this.startSize = this.getSize();
        if (this.position) this.repositionSplitter(this.position);
    }
    
    afterCreateBar() {
    }

    getSize() {
        const size = (this.container as any)[this.sizeAttribute]();
        if (! size) {
            // If there is no size on the container available, then we'll just add the sizes of the content with each other.
            const div1Size = (this.div1 as any)[this.sizeAttribute]();
            const div2Size = (this.div2 as any)[this.sizeAttribute]();
            if (div1Size || div2Size) {
                return div1Size + div2Size;
            }
        }
        return size;
    }

    /**
     * Looks up a splitter in the whole set of splitters that could be a parent to use.
     * Upon finding such a splitter, we will make ourselves a child of that splitter,
     * and thereby listen to resize events in the parent splitter.
     * Note: we filter only on parents that have same orientation (either vertical or horizontal),
     * and also only on those parents that have a different direction than we have.
     * Resizing of a parent with a different orientation is not relevant,
     * since our opposite orientation (whether height/width) is 100%.
     * Resizing when a parent has same direction is also not relevant, since our "stable" div is the same, and
     * should not resize accordingly.
     * So, e.g., only if our parent splits left, and we split right, then when the parent resizes, we have
     * to resize in the opposite direction.
     * Note: current algorithm does not cater for grand-grand-children etc.
     */
    connectParent() {
        this.parent = Splitter.splitters.reverse().find(splitter => {
            if (splitter.container.find('*').toArray().find(element => $(element).is(this.container))) {
                // The other splitter's container contains our container
                if (splitter.orientation == this.orientation) {
                    // They must be either both horizontal, or both vertical
                    if (splitter.direction != this.direction) {
                        return true;
                    }
                }
            }
            return false;
        });
    }

    set parent(newParent) {
        if (this._parentSplitter) {
            // New parent; remove ourselves from the old one.
            this._parentSplitter.child = undefined;
        }
        this._parentSplitter = newParent;
        if (newParent) newParent.child = this;
    }

    get parent() {
        return this._parentSplitter;
    }

    set child(c) {
        this._child = c;
    }

    get child() {
        return this._child;
    }

    handlePointerDown(e: any) {
        this.savedPosition = this.position;
        // Start listening to mouse move - but only inside the container
        this.container.on('pointermove', this.splitterMover);
        this.container.on('pointerup', this.splitterMoved);
    }

    handlePointerMove(e: any) {
        e.stopPropagation();
        e.preventDefault();
        const currentBarPosition = (this.bar.offset() as any)[this.positionAttribute];
        const pixelsMoved = currentBarPosition - e[this.clientPosition];
        this.moveSplitter(pixelsMoved);
    }

    handlePointerUp(e: any) {
        e.stopPropagation();
        e.preventDefault();
        // this.bar.css('background-color', '')
        this.container.off('pointermove', this.splitterMover);
        this.container.off('pointerup', this.splitterMoved);
    }

    delete() {
        Util.removeHTML(this.bar);
        this.container.off('pointermove');
        this.parent = undefined; // Deleting the parent will also clean up info in parent.
        Util.removeFromArray(Splitter.splitters, this);
    }

    /**
     * Returns whether this is a 'horizontal' or 'vertical' splitter
     */
    get orientation(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Returns the direction of the splitter, i.e., which part is "stable" and which part is "dynamic" upon resizing of a parent element.
     * Should be either top, bottom, left or right.
     */
    get direction(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Returns the name of the event's client attribute relevant for repositioning (either 'clientX' or 'clientY')
     */
    get clientPosition(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Returns the relative bar position (either 'left' or 'top') depending on the orientation.
     */
    getBarPixels(): number {
        return parseInt(this.bar.css(this.positionAttribute));
    }

    /**
     * Move splitter to align it to the new size of the container.
     * This method is invoked only if there is a parent splitter that has repositioned
     */
    align() {
        this.savedPosition = this.position;
        const totalPixelsMoved = this.getSize() - this.startSize;
        this.moveSplitter(-1 * totalPixelsMoved);
    }

    /** @returns {String} The name of the css attribute through which the position can be set (either 'top' or 'left') */
    get positionAttribute(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {String} The name of the css attribute through which the position can be set (either 'top' or 'left') */
    get oppositePositionAttribute(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {String} The name of the css attribute through which the element's size can be measured (either 'height' or 'width') */
    get sizeAttribute(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Moves the splitter by the number of pixels indicated relative to it's current position.
     * Also validates against the minimum size setting.
     * @param {Number} numPixels 
     */
    moveSplitter(numPixels: number) {
        const currentPosition = this.getBarPixels();
        const newPosition = currentPosition - numPixels;
        this.repositionSplitter(newPosition);
    }

    validateNewPosition(proposedPosition: number | string): number | string {
        if (typeof(proposedPosition)==='string') {
            return proposedPosition;
        }
        const maximumPosition = this.getSize() - this.minimumSize;
        const newPosition = Math.min(proposedPosition, maximumPosition);
        return newPosition;
    }

    /**
     * Moves the splitter to the absolute location.
     * @param {Number} proposedPosition 
     */
    repositionSplitter(proposedPosition: number | string) {
        const newPosition = this.validateNewPosition(proposedPosition);

        // Place the splitter bar into the right position
        this.bar.css(this.positionAttribute, newPosition);
        
        // First, give both contained div's all space.
        this.div1.css('left', '0px');
        this.div1.css('right', '0px');
        this.div1.css('bottom', '0px');
        this.div1.css('top', '0px');
        this.div2.css('left', '0px');
        this.div2.css('right', '0px');
        this.div2.css('bottom', '0px');
        this.div2.css('top', '0px');

        // Now adjust the appropriate div attributes
        this.div1.css(this.sizeAttribute, newPosition);
        this.div1.css(this.oppositePositionAttribute, newPosition);
        this.div2.css(this.positionAttribute, newPosition);

        // Save the settings
        this.position = newPosition;
        
        if (this.child) {
            // Inform child about it's new container size (since we have shifted the splitter, and child is either in div1 or div2, and both have changed size)
            this.child.align();
        }

        // Reset startSize for next resize (in case of align invocation)
        this.startSize = this.getSize();
    }

    get position(): number | string | undefined{
        return this.settings.position;
    }

    set position(p: number | string) {
        if (Number(p) < 0) {
            console.warn("Cannot set position to negative number "+p)
            return;
        }
        this.settings.position = p;
        this.settings.save();
    }

    get savedPosition(): number | string | undefined {
        return this.settings.savedPosition;
    }

    set savedPosition(p: number | string | undefined) {
        this.settings.savedPosition = p;
        this.settings.save();
    }
}
