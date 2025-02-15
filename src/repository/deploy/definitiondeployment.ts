import { Element } from "../../util/xml";
import ModelDefinition from "../definition/modeldefinition";
import Definitions from "./definitions";

export default class DefinitionDeployment {
    element: Element;

    constructor(public definitionsDocument: Definitions, public definition: ModelDefinition) {
        definitionsDocument.definitions.push(this);
        this.element = this.definition.toXML().documentElement ?? (() => { throw new Error('No ownerDocument found'); })();
    }

    get fileName() {
        return this.definition.file.fileName;
    }

    append() {
        // Note: we're ALWAYS overwriting the id to match with the file name ...
        //   Be aware that one can set a different id in the source than the file name has. 
        //   Such "developer behavior" is overwritten here without any notice ...
        this.element.setAttribute('id', this.definition.file.fileName);
        this.definitionsDocument.definitionsElement.appendChild(this.element);
    }
}
