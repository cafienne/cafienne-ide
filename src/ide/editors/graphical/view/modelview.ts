import { dia } from "jointjs";
import $ from "jquery";
import Diagram from "../../../../repository/definition/dimensions/diagram";
import ElementDefinition from "../../../../repository/definition/elementdefinition";
import GraphicalModel from "../../../../repository/definition/graphicalmodel";
import Util from "../../../../util/util";
import ModelEditor from "../../../modeleditor/modeleditor";
import Connector from "../connector/connector";
import ElementView from "./elementview";

export default abstract class ModelView<M extends GraphicalModel = GraphicalModel, D extends ElementDefinition<M> = ElementDefinition<M>, V extends ElementView<D, any> = ElementView<D, any>> {
    readonly html: JQuery<HTMLElement>;
    graph!: dia.Graph;
    paper!: dia.Paper;
    svg!: JQuery<SVGElement>;
    diagram!: Diagram;

    loading: boolean = false;
    readonly items: V[] = [];
    readonly connectors: Connector<V>[] = [];


    constructor(public editor: ModelEditor, public model: M) {
        this.html = $(``);
    }

    abstract clearSelection() : void;
    abstract createConnector(source: V, target: V): Connector<V>;

    getItem(id: string): V | undefined {
        return this.items.find(item => id && item.id == id);
    }

    /**
       * Returns the container in which Halos can render their HTML elements.
       */
    get haloContainer() {
        return this.html.find('.divHalos');
    }

    /**
     * Returns the container in which Resizers can render their HTML elements.
     */
    get resizeContainer() {
        return this.html.find('.divResizers');
    }

    /**
     * Returns the container in which Marker can render their HTML element.
     */
    get markerContainer() {
        return this.html.find('.divMarker');
    }

    /**
     * Add an item to the model view. This method is invoked when the item is added to the canvas.
     */
    __addConnector(connector: Connector<V>) {
        this.connectors.push(connector);
        if (!this.loading) {
            this.graph.addCells([connector.xyz_joint]);
        }
    }

    /**
     * Remove a connector from the registration. This method is invoked when the connector
     * is already removed from the canvas.
     */
    __removeConnector(connector: Connector<V>) {
        connector.edge.removeDefinition();
        Util.removeFromArray(this.connectors, connector);
    }

    completeUserAction() {
        this.editor.completeUserAction();
    }

}
