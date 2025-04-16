import XML, { Element } from "../../util/xml";
import CaseDefinition from "../definition/cmmn/casedefinition";
import ModelDefinition from "../definition/modeldefinition";
import TypeDefinition from "../definition/type/typedefinition";
import Repository from "../repository";
import CaseFile from "../serverfile/casefile";
import ServerFile from "../serverfile/serverfile";
import Importer from "./importer";

abstract class ImportElement {
    repository: Repository;

    constructor(public importer: Importer, public fileName: string, public xmlElement: Element) {
        this.repository = importer.repository;
    }

    get content() {
        return XML.prettyPrint(this.xmlElement);
    }

    async save() {
        const file = this.repository.get(this.fileName) || this.createFile();
        file.source = this.content;
        await file.save();
    }

    /**
     * @returns {ServerFile}
     */
    abstract createFile(): ServerFile<ModelDefinition>;
}

export class CaseImporter extends ImportElement {
    createFile() {
        return this.repository.createCaseFile(this.fileName, "");
    }

    async save() {
        const file: CaseFile = <CaseFile> this.repository.get(this.fileName) || this.createFile();
        file.source = this.content;
        const definition = new CaseDefinition(file).initialize();
        file.source = definition.toXMLString();

        await file.save();
    }
}

export class DimensionsImporter extends ImportElement {
    createFile() {
        return this.repository.createDimensionsFile(this.fileName, "");
    }
}

export class ProcessImporter extends ImportElement {
    createFile() {
        return this.repository.createProcessFile(this.fileName, "");
    }
}

export class HumanTaskImporter extends ImportElement {
    createFile() {
        return this.repository.createHumanTaskFile(this.fileName, "");
    }
}

export class CFIDImporter extends ImportElement {
    createFile() {
        return this.repository.createCFIDFile(this.fileName, "");
    }
}

export class TypeImporter extends ImportElement {
    constructor(importer: Importer, fileName: string, xmlElement: Element, public typeDefinition: TypeDefinition) {
        super(importer, fileName, xmlElement);
    }

    get content() {
        return XML.prettyPrint(this.typeDefinition.toXML().documentElement);
    }

    createFile() {
        return this.repository.createTypeFile(this.fileName, "");
    }
}

export default ImportElement;