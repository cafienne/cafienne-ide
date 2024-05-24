import Followup from "./followup";
import FollowupList from "./followuplist";

export default class SequentialFollowupList extends FollowupList {
    /**
     * 
     * @param {Followup} then 
     */
    constructor(then = Followup.None) {
        super(then);
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
            // console.log("Starting a sequential list of " + this.actions.length + " sequential actions");

            const linkedList = /** @type {Array<Followup>} */[];
            this.actions.forEach((action, index) => linkedList.push(new SequentialAction(action, index)));
            linkedList.forEach((item, index) => {
                if (index < linkedList.length - 1) {
                    item.next = () => linkedList[index + 1].run();
                } else {
                    item.next = () => {
                        // console.log("Completed all actions, now we're done");
                        this.done();
                    }
                }
            })
            // console.log("Running first action in synced list of size " + linkedList.length);

            linkedList[0].run();
        }
    }
}

class SequentialAction {
    constructor(action, index) {
        this.action = action;
        this.index = index;
        this.next = () => { };
    }

    run() {
        // console.groupCollapsed("Starting SequentialAction[" + this.index +"]");
        this.action(() => {
            // console.groupEnd();
            // console.log("Completed SequentialAction[" + this.index +"]");
            this.next();
        })
    }
}
