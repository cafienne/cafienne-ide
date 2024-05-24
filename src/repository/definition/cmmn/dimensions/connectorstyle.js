export default class ConnectorStyle {
    static get NONE() {
        return 'none';
    }

    static get DEFAULT() {
        return 'default';
    }

    static get FULL() {
        return 'full';
    }

    constructor(style) {
        this.style = style;
        if (! (this.isNone || this.isDefault || this.isFull)) {
            this.style = ConnectorStyle.DEFAULT;
        }
    }

    get isNone() {
        return this.style === ConnectorStyle.NONE;
    }

    get isDefault() {
        return this.style === ConnectorStyle.DEFAULT;
    }

    get isFull() {
        return this.style === ConnectorStyle.FULL;
    }

    makeNone() {
        this.style = ConnectorStyle.NONE;
    }

    makeDefault() {
        this.style = ConnectorStyle.DEFAULT;
    }

    makeFull() {
        this.style = ConnectorStyle.FULL;
    }

    get infoMessage() {
        if (this.isNone) {
            return 'By default all connector labels are hidden';
        } else if (this.isFull) {
            return 'By default all connector labels are shown';
        } else {
            return 'Connector labels are shown for all events except <b><i>complete</i></b>, <b><i>occur</i></b> and <b><i>create</i></b>';
        }
    }

    shiftRight() {
        if (this.isDefault) {
            this.makeFull();
        } else if (this.isFull) {
            this.makeNone();
        } else { // Probably it is currently "none", but in all cases we make it default.
            this.makeDefault();
        }
    }
}
