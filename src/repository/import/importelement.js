import ServerFile from "../serverfile";
import Importer from "./importer";

export default class ImportElement {
    /**
     * 
     * @param {Importer} importer 
     * @param {String} fileName 
     * @param {Element} xmlElement 
     */
    constructor(importer, fileName, xmlElement) {
        this.importer = importer;
        this.repository = importer.repository;
        this.fileName = fileName;
        this.xmlElement = xmlElement;
    }

    get content() {
        return XMLDocumentL.prettyPrint(this.xmlElement);
    }

    save() {
        const file = this.repository.get(this.fileName) || this.createFile();
        file.source = this.content;
        file.save();
    }

    /**
     * @returns {ServerFile}
     */
    createFile() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}

export class CaseImporter extends ImportElement {
    createFile() {
        return this.repository.createCaseFile(this.fileName, this.content);
    }
}

export class DimensionsImporter extends ImportElement {
    createFile() {
        return this.repository.createDimensionsFile(this.fileName, this.content);
    }
}

export class ProcessImporter extends ImportElement {
    createFile() {
        return this.repository.createProcessFile(this.fileName, this.content);
    }
}

export class HumanTaskImporter extends ImportElement {
    createFile() {
        return this.repository.createHumanTaskFile(this.fileName, this.content);
    }
}

export class CFIDImporter extends ImportElement {
    createFile() {
        return this.repository.createCFIDFile(this.fileName, this.content);
    }
}
