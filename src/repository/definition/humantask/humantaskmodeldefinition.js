import HumanTaskFile from "../../serverfile/humantaskfile";
import ModelDefinition from "../modeldefinition";
import { IMPLEMENTATION_TAG } from "../xmlelementdefinition";
import HumanTaskImplementationDefinition from "./humantaskimplementationdefinition";

export default class HumanTaskModelDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {HumanTaskFile} file
     */
    constructor(file) {
        super(file);
        this.file = file;
    }

    parseDocument() {
        super.parseDocument();
        /** @type {HumanTaskImplementationDefinition} */
        this.implementation = this.parseElement(IMPLEMENTATION_TAG, HumanTaskImplementationDefinition);
    }

    get name() {
        return this.implementation.name;
    }

    set name(name) {
        if (this.implementation) this.implementation.name = name;
    }

    get inputParameters() {
        return this.implementation.input;
    }

    get outputParameters() {
        return this.implementation.output;
    }

    get taskModel() {
        return this.implementation.taskModel;
    }

    toXML() {
        const document = super.exportModel('humantask', 'implementation');
        this.exportNode.removeAttribute('name');
        return document;
    }
}
