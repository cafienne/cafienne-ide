'use strict';

import path from "path";
import Reference from "./reference";
import Store from "./store";
import { XML } from "../util/xml";
import Extensions from "./extensions";

export default class RepositoryElement {
    public fileName: string;
    public extension: string;
    public type: string;
    
    public lastModified: any;
    public content: string;

    public id: string | undefined;
    public name: string | undefined;
    public referencedArtifacts: Array<Reference> = [];

    public error: any;
    public usage: any; // Make this of type Usage
    public xml: any;

    private saved: boolean = false;

    /**
     * 
     * @param {Store} store 
     * @param {*} file 
     */
    constructor(public store: Store, file: any) {
        this.store = store;
        this.fileName = file.relativePath;
        this.extension = path.extname(this.fileName);
        this.type = this.extension.substring(1);
        this.lastModified = file.mtime;
        this.content = store.load(this.fileName);
        /** @type {Array<Usage>} */
        this.usage = [];
        this.error = undefined;
    }

    fillReferenceInformation() {
        // if (this.fileName.indexOf('helloworld'))
        this.xml = XML.parse(this.content);
        if (this.xml.hasErrors) {
            this.setError(`${this.fileName} has parse errors: ` + this.xml.errors);
            return undefined;
        }

        if (this.xml.element && this.xml.element.nodeName !== this.expectedTagName) {
            this.setError(`${this.fileName} is invalid: expecting <${this.expectedTagName}> instead of <${this.xml.element.nodeName}>`);
        }
        this.id = this.xml.element.getAttribute('id') || this.fileName;
        this.name = this.xml.element.getAttribute('name') || '';
        this.referencedArtifacts = this.findReferences();
    }

    findReferences() {
        /**
         * Private function searching for all elements with given tagname having a value for the specified attribute name. Returns an array with those found values.
         * @param {String} tagName 
         * @param {String} attributeName 
         */
        const getReferences = (tagName: string, attributeName: string) =>
            XML.findElementsWithTag(this.xml.element, tagName) // Search for elements with the tagname
                .filter((element: Element) => element.getAttribute(attributeName) !== undefined)
                .filter((element: Element) => (''+element.getAttribute(attributeName)).trim() !== '')
                .map((element: Element) => new Reference(this, element, attributeName))

        const refs = getReferences('caseTask', 'caseRef');
        refs.push(...getReferences('processTask', 'processRef'))
        refs.push(...getReferences('caseFileItem', 'definitionRef'));
        refs.push(...getReferences('caseFileModel', 'typeRef'));
        refs.push(...getReferences('cafienne:implementation', 'humanTaskRef'));
        refs.push(...getReferences('property', 'type'));
        return refs;
    }


    save() {
        if (this.saved) {
            console.log("Model " + this.fileName + " is already saved, returning")
        }
        this.store.save(this.fileName, XML.printNiceXML(this.xml.element) + '\n');
        this.saved = true;
    }

    setError(msg: string) {
        this.error = msg;
        console.log(`--- ERROR --- File ${msg}`);
    }

    get expectedTagName() {
        return Extensions.getRootTag(this.extension);
    }

    get json() {
        // Explicit contract
        return {
            fileName: this.fileName,
            type: this.type,
            lastModified: this.lastModified,
            error: this.error,
            content: this.content
        }
    }
}
