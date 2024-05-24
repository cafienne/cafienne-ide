export default class Followup {
    static None = new Followup();

    /**
     * 
     * @param {(...args: *) => void} next 
     * @param {(msg: String) => void} fail
     */
    constructor(next = () => { }, fail = msg => { }) {
        this.next = next;
        this.fail = fail;
    }

    /**
     * Run the followup
     * @param {*} args
     */
    run(...args) {
        this.next(...args);
    }

    /**
     * Set a failure handler
     * @param {(msg: String) => void} fail
     */
    onFail(fail = msg => { }) {
        this.fail = fail;
        return this;
    }

    /**
     * Execute the next task, but before doing that, run a step "before"
     * @param {(...args: *) => void} before
     */
    first(before) {
        const currentNext = this.next;
        this.next = (...args) => {
            before(...args);
            currentNext(...args);
        }
        return this;
    }
}

/**
 * 
 * @param {(...args: *) => void} next 
 * @param {(msg: String) => void} fail
 */
export function andThen(next = (...args) => { }, fail = msg => { }) {
    return new Followup(next, fail);
}

/**
 * 
 * @param {(msg: String) => void} fail
 */
export function onFail(fail = msg => { }) {
    return new Followup(() => {}, fail);
}
