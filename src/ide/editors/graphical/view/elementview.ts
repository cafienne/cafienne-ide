import { shapes } from "jointjs";
import ElementDefinition from "../../../../repository/definition/elementdefinition";
import GraphicalModel from "../../../../repository/definition/graphicalmodel";
import Util from "../../../../util/util";
import Connector from "../connector/connector";
import CanvasElement from "./canvaselement";
import ModelView from "./modelview";

export default abstract class ElementView<D extends ElementDefinition<GraphicalModel> = ElementDefinition<GraphicalModel>, M extends ModelView = ModelView>
    extends CanvasElement<shapes.basic.Generic, M> {

    __connectors: Connector<ElementView<any, M>>[] = [];

    constructor(modelView: M, public definition: D) {
        super(modelView);
    }

    get id(): string {
        return this.definition.id;
    }

    get name() {
        return this.definition.name;
    }

    /**
     * Removes a connector from the registration in this element.
     */
    __removeConnector(connector: Connector<ElementView<any, M>>): void {
        Util.removeFromArray(this.__connectors, connector);
    }
    /**
      * Registers a connector with this element.
      */
    __addConnector(connector: Connector<ElementView<any, M>>) {
        this.__connectors.push(connector);
    }

    /**
     * creates a connector between the element and the target.
     */
    __connect(target: ElementView<any, M>): Connector<ElementView<any, M>> {
        const connector = this.modelView.createConnector(this, target);
        return connector;
    }

    /**
    * This method is invoked on the element if it created a connection to the target CMMNElementView
    */
    __connectTo(target: ElementView<any, M>) { }

    /**
     * This method is invoked on the element if a connection to it was made from the source CMMNElementView
     */
    __connectFrom(source: ElementView<any, M>) { }

    /**
     * returns an array of elements that are connected (through a link/connector) with this element
     */
    __getConnectedElements(): ElementView<any, M>[] {
        const connectedCMMNElements: ElementView<any, M>[] = [];
        this.__connectors.forEach(connector => {
            if (!connectedCMMNElements.find(cmmnElement => connector.source == cmmnElement || connector.target == cmmnElement)) {
                connectedCMMNElements.push(connector.source == this ? connector.target : connector.source);
            }
        });
        return connectedCMMNElements;
    }

    /**
     * Returns the connector between this and the target element with the specified id,
     * or null
     */
    __getConnector(targetId: string): Connector<ElementView<any, M>> | undefined {
        return this.__connectors.find(c => c.hasElementWithId(targetId));
    }
}
