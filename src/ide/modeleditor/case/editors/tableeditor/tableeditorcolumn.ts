
export default class TableEditorColumn {
    constructor(public label: string, public width: string, public title: string = label, public classNames: string = '') {
    }

    get col() {
        return `<col width="${this.width}" class="${this.classNames}"></col>`;
    }

    get th() {
        return `<th title="${this.title}">${this.label}</th>`;
    }
}
