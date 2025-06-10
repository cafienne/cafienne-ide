import ElementDefinition from "../../../../../repository/definition/elementdefinition";
import RowRenderer from "./rowrenderer";

export type CellRendererClassType<E extends ElementDefinition, R extends RowRenderer<E>> = {
    new(row: R, column: JQuery<HTMLTableCellElement>): any;
    label?: string;
    width?: string;
    tooltip?: string;
}

export default abstract class ColumnRenderer<E extends ElementDefinition, R extends RowRenderer<E>> {
    label: string;
    width: string;
    tooltip: string;
    renderer: any; // cannot refer to ColumnConstructor<E, R> here due to circular dependency issues

    /**
     * Base class for describing a column in a row in the table renderer
     */
    constructor(renderer: CellRendererClassType<E, R>, tooltip: string = '', label: string = '', width: string = '') {
        this.renderer = renderer;
        this.label = renderer.label || label;
        this.width = renderer.width || width;
        this.tooltip = renderer.tooltip || tooltip;
    }

    get col() {
        return `<col title="${this.tooltip}" width="${this.width}"></col>`;
    }

    get th() {
        return `<th title="${this.tooltip}">${this.label}</th>`;
    }

    render(column: JQuery<HTMLTableCellElement>, row: R) {
        column.attr('title', this.tooltip)
        new (this.renderer as CellRendererClassType<E, R>)(row, column);
    }
}
