import Repository from "@repository/repository";
import ServerFile from "../serverfile/serverfile";
import Importer from "./importer";
import XML from "@util/xml";
import ModelDefinition from "@repository/definition/modeldefinition";
import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import CaseFile from "@repository/serverfile/casefile";
import TypeDefinition from "@repository/definition/type/typedefinition";
import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition";

export default class ImportElement {
    repository: Repository;

    constructor(public importer: Importer, public fileName: string, public xmlElement: Element) {
        this.repository = importer.repository;
    }

    get content() {
        return XML.prettyPrint(this.xmlElement);
    }

    async save() {
        const file = this.repository.get(this.fileName) || this.createFile();
        file.source = this.content.replace(/xmlns="http:\/\/www.omg.org\/spec\/CMMN\/20151109\/MODEL"/g, '');
        await file.save();
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
        return this.repository.createCaseFile(this.fileName, "");
    }

    async save() {
        const file: CaseFile = <CaseFile> this.repository.get(this.fileName) || this.createFile();
        file.source = this.content;
        const definition = new CaseDefinition(file).initialize();

        file.source = definition.toXMLString();
        file.source = file.source.replace(/xmlns="http:\/\/www.omg.org\/spec\/CMMN\/20151109\/MODEL"/g, '');

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

export class CaseTeamImporter extends ImportElement {
    constructor(importer: Importer, fileName: string, xmlElement: Element, public caseTeamModelDefinition: CaseTeamModelDefinition) {
        super(importer, fileName, xmlElement);
    }

    get content() {
        return XML.prettyPrint(this.caseTeamModelDefinition.toXML().documentElement);
    }

    createFile() {
        return this.repository.createCaseTeamFile(this.fileName, "");
    }
}
