import CaseFileDefinitionDefinition from "@repository/definition/cfid/casefileitemdefinitiondefinition";
import TypeDefinition from "@repository/definition/type/typedefinition";
import Repository from "@repository/repository";
import CFIDFile from "@repository/serverfile/cfidfile";
import TypeFile from "@repository/serverfile/typefile";
import XML from "@util/xml";
import CFIDConverter from "./cfidconverter";

export default class TypeWrapper {
    repository: Repository;
    typeFile: TypeFile;
    /**
     * @param {CFIDConverter} converter 
     * @param {CFIDFile} cfidFile 
     */
    static async getType(converter: CFIDConverter, cfidFile: CFIDFile): Promise<TypeWrapper> {
        const typeFileName = cfidFile.name + '.type';

        const lcName = typeFileName.toLowerCase();
        const typeWrapper = converter.typeWrappers.find(file => file.typeFileName.toLowerCase() === lcName);
        if (typeWrapper) {
            return typeWrapper;
        } else {
            if (!cfidFile.definition) {
                throw new Error(`CFID file ${cfidFile.fileName} lacks a definition object, cannot continue migration`);
            }
            const wrapper = new TypeWrapper(converter, cfidFile, cfidFile.definition,  typeFileName);
            await wrapper.load();
            return wrapper;
        }
    }

    /**
     * 
     * @param {CFIDConverter} converter 
     * @param {CaseFileDefinitionDefinition} cfid 
     * @param {String} typeFileName 
     */
    constructor(public converter: CFIDConverter, public cfidFile: CFIDFile, public cfid: CaseFileDefinitionDefinition, public typeFileName: string) {
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
            return this.repository.createTypeFile(this.typeFileName, TypeDefinition.createDefinitionSource(this.cfidFile.name));
        }
    }

    async load() {
        if (! this.typeFile.definition) {
            await this.typeFile.parse();
        }
        this.cfid.properties.forEach(property => {
            if (this.typeFile.definition?.schema?.properties.find(prop => prop.name === property.name)) {
                // Skip existing properties with the same name
                return;                
            }
            this.typeFile.definition?.schema?.createChildProperty(property.name, '', 'ExactlyOne', property.isBusinessIdentifier).withCMMNType(property.type);
        });
    }

     async upload() {
        const newSource = this.typeFile.definition?.toXMLString();
        if (XML.prettyPrint(this.typeFile.source) === newSource && this.typeFile.metadata.lastModified) {
            // No need to upload
            console.log("No need to upload the file " + this.typeFileName +", as there are no changes")
            return;
        }
        this.typeFile.source = newSource;
        return this.typeFile.save();
    }
}
