import Repository from "@repository/repository";
import ServerFile from "../serverfile/serverfile";
import Importer from "./importer";
import XML from "@util/xml";
import ModelDefinition from "@repository/definition/modeldefinition";
import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import CaseFile from "@repository/serverfile/casefile";

export default class ImportElement {
    repository: Repository;
    /**
     * 
     * @param {Importer} importer 
     * @param {String} fileName 
     * @param {Element} xmlElement 
     */
    constructor(public importer: Importer, public fileName: string, public xmlElement: Element) {
        this.repository = importer.repository;
    }

    get content() {
        return XML.prettyPrint(this.xmlElement);
    }

    async save() {
        const file = this.repository.get(this.fileName) || this.createFile();
        file.source = this.content.replace(/xmlns="http:\/\/www.omg.org\/spec\/CMMN\/20151109\/MODEL"/g, '');
        return file.save();
    }

    /**
     * @returns {ServerFile}
     */
    createFile(): ServerFile<ModelDefinition> {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}

export class CaseImporter extends ImportElement {
    createFile() {
        return this.repository.createCaseFile(this.fileName, this.content);
    }

    async save() {
        const file: CaseFile = <CaseFile> this.repository.get(this.fileName) || this.createFile();
        file.source = this.content;
        const definition = new CaseDefinition(file);

        file.source = XML.prettyPrint(definition.toXML());
        file.source = file.source.replace(/xmlns="http:\/\/www.omg.org\/spec\/CMMN\/20151109\/MODEL"/g, '');

        return file.save();
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
