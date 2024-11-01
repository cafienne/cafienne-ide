import ElementDefinition from "../elementdefinition";
import ModelDefinition from "../modeldefinition";

/**
 * Simple helper class to support specific extensions to CMMN   
 */
export default class CMMNExtensionDefinition<M extends ModelDefinition> extends ElementDefinition<M> {
    constructor(element: Element, modelDefinition: M, parent?: ElementDefinition<M>) {
        super(element, modelDefinition, parent);
    }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        super.createExtensionNode(parentNode, tagName, propertyNames);
    }
}
