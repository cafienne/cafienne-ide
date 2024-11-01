import Settings from "@ide/settings/settings";

export default class SplitterSettings {
    splitters: any = {};
    savedPosition?: number | string;
    position?: number | string;

    constructor() {
    }

    get(html: JQuery<HTMLElement>): SplitterSettings {
        const splitterId = html.attr('id');
        if (!splitterId) {
            return new AnonymousSplitterSettings();
        }
        if (!this.splitters[splitterId]) {
            this.splitters[splitterId] = {};
        }
        this.splitters[splitterId].save = () => this.save();
        return this.splitters[splitterId];
    }

    save() {
        Settings.splitters = this;
    }
}

class AnonymousSplitterSettings extends SplitterSettings {
    save() {
        // console.log("Saving into anonmymous splitter")
    }
}
