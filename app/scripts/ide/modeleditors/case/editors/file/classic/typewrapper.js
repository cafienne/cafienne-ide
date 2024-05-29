class TypeWrapper {
    /**
     * @param {CFIDConverter} converter 
     * @param {CFIDFile} cfidFile 
     */
    static getType(converter, cfidFile) {
        const typeFileName = cfidFile.fileName.substring(0, cfidFile.fileName.length - 4) + 'type';

        const lcName = typeFileName.toLowerCase();
        const typeWrapper = converter.typeWrappers.find(file => file.typeFileName.toLowerCase() === lcName);
        if (typeWrapper) {
            return typeWrapper;
        } else {
            return new TypeWrapper(converter, cfidFile.definition, typeFileName);
        }
    }

    constructor(converter, cfid, typeFileName) {
        this.converter = converter;
        this.repository = this.converter.repository;
        this.typeFileName = typeFileName;
        this.cfid = cfid;
        this.converter.typeWrappers.push(this);
        this.typeFile = this.createFile();
    }

    createFile() {
        const typeFile = this.repository.getTypes().map(file => file.fileName.toLowerCase()).find(fileName => this.typeFileName.toLowerCase() === fileName);
        if (typeFile) {
            console.log("Found existing typefile " + this.typeFileName)
        } else {
            console.log("Creating typefile " + this.typeFileName);
            const typeFile = this.repository.createTypeFile(this.typeFileName, TypeDefinition.createDefinitionSource(this.cfid.name));
            typeFile.parse(andThen(() => {
                this.cfid.properties.forEach(property => {
                    const typeProp = typeFile.definition.schema.createEmptyProperty();
                    typeProp.name = property.name;
                    typeProp.isBusinessIdentifier = property.isBusinessIdentifier;
                    typeProp.type = convertCMMNType(property.type); /// hmmm doesn't exist
                });
            }));
            return typeFile;
        }
    }
}

function convertCMMNType(cmmnType) {
    // TODO: convert the CMMN type to a decent SchemaPropertyDefinition type
    // Perhaps code can go into SchemaPropertyDefinition class?
    return cmmnType;
}
