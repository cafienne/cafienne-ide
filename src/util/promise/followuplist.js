import Followup from "./followup";

export default class FollowupList {
    /**
     * 
     * @param {Followup} then 
     */
    constructor(then = Followup.None) {
        this.finally = then;
        this.actions = [];
    }

    /**
     * 
     * @param {(callback: () => void) => void} action 
     */
    add(action) {
        this.actions.push(action);
    }

    done() {
        this.finally.run();
    }

    /**
     * 
     * @param {Array<(callback: () => void) => void>} actions 
     */
    run(actions = []) {
        if (actions.length) this.actions.push(...actions);
        if (this.actions.length === 0) {
            this.done();
        } else {
            const pending = [...this.actions];
            this.actions.forEach(action => action(() => {
                Util.removeFromArray(pending, action);
                if (pending.length === 0) {
                    this.done();
                }
            }));
        }
    }
}
