import CaseFileDefinitionDefinition from "@repository/definition/cfid/casefileitemdefinitiondefinition";
import TypeDefinition from "@repository/definition/type/typedefinition";
import CFIDFile from "@repository/serverfile/cfidfile";
import CFIDConverter from "./cfidconverter";
import Repository from "@repository/repository";
import TypeFile from "@repository/serverfile/typefile";

export default class TypeWrapper {
    repository: Repository;
    typeFile: TypeFile;
    /**
     * @param {CFIDConverter} converter 
     * @param {CFIDFile} cfidFile 
     */
    static getType(converter: CFIDConverter, cfidFile: CFIDFile) {
        const typeFileName = cfidFile.fileName.substring(0, cfidFile.fileName.length - 4) + 'type';

        const lcName = typeFileName.toLowerCase();
        const typeWrapper = converter.typeWrappers.find(file => file.typeFileName.toLowerCase() === lcName);
        if (typeWrapper) {
            return typeWrapper;
        } else {
            if (!cfidFile.definition) {
                return;
            }
            return new TypeWrapper(converter, cfidFile.definition, typeFileName);
        }
    }

    /**
     * 
     * @param {CFIDConverter} converter 
     * @param {CaseFileDefinitionDefinition} cfid 
     * @param {String} typeFileName 
     */
    constructor(public converter: CFIDConverter, public cfid: CaseFileDefinitionDefinition, public typeFileName: string) {
        this.converter = converter;
        this.repository = this.converter.repository;
        this.typeFileName = typeFileName;
        this.cfid = cfid;
        this.converter.typeWrappers.push(this);
        this.typeFile = this.createFile();
    }

    createFile(): TypeFile {
        const typeFile = this.repository.getTypes().find(file => file.fileName.toLowerCase() === this.typeFileName.toLowerCase());
        if (typeFile) {
            console.log("Found existing typefile " + this.typeFileName);
            this.typeFileName = typeFile.fileName;
            return typeFile;
        } else {
            console.log("Creating typefile " + this.typeFileName);
            const typeFile = this.repository.createTypeFile(this.typeFileName, TypeDefinition.createDefinitionSource(this.cfid.name));
            typeFile.parse().then(() => {
                this.cfid.properties.forEach(property => {
                    const typeProp = typeFile.definition?.schema?.createChildProperty(property.name, '', 'ExactlyOne', property.isBusinessIdentifier);
                    typeProp?.fromCMMNType(property.type);
                });
            });
            return typeFile;
        }
    }

    upload() {
        console.log("Saving type " + this.typeFile.fileName)
        this.typeFile.source = this.typeFile.definition?.toXML();
        return this.typeFile.save();
    }
}

function convertCMMNType(cmmnType: string) {
    // TODO: convert the CMMN type to a decent SchemaPropertyDefinition type
    // Perhaps code can go into SchemaPropertyDefinition class?
    return cmmnType;
}
