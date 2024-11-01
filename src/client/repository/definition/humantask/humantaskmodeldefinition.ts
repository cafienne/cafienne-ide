import HumanTaskFile from "../../serverfile/humantaskfile";
import ModelDefinition from "../modeldefinition";
import { IMPLEMENTATION_TAG } from "../xmlserializable";
import HumanTaskImplementationDefinition from "./humantaskimplementationdefinition";

export default class HumanTaskModelDefinition extends ModelDefinition {
    private _implementation?: HumanTaskImplementationDefinition;
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {HumanTaskFile} file
     */
    constructor(public file: HumanTaskFile) {
        super(file);
        /** @type {HumanTaskImplementationDefinition} */
        this.implementation = this.parseElement(IMPLEMENTATION_TAG, HumanTaskImplementationDefinition);
    }

    get implementation(): HumanTaskImplementationDefinition {
        if (! this._implementation) {
            this._implementation = new HumanTaskImplementationDefinition(this.importNode.ownerDocument.createElement(IMPLEMENTATION_TAG), this, undefined);
        }
        return this._implementation;
    }

    private set implementation(implementation: HumanTaskImplementationDefinition | undefined) {
        this._implementation = implementation;
    }

    get name() {
        return this._implementation?.name || '';
    }

    set name(name) {
        if (this._implementation) this._implementation.name = name;
    }

    get inputParameters() {
        return this._implementation?.input || [];
    }

    get outputParameters() {
        return this._implementation?.output || [];
    }

    get taskModel() {
        return this._implementation?.taskModel;
    }

    toXML() {
        const document = super.exportModel('humantask', 'implementation');
        this.exportNode.removeAttribute('name');
        return document;
    }
}
