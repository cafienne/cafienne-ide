class CFIDConverter {
    /**
     * Convert the CaseFileItems and their CaseFileItemDefinitions (.cfid files) to the new type structure for this case.
     * 
     * @param {CaseView} cs 
     */
    constructor(cs) {
        this.case = cs;
        this.repository = this.case.editor.ide.repository;
    }

    convert() {
        const definition = this.case.caseDefinition.getCaseFile();
        const cfidFileNames = [...new Set(definition.getDescendants().map(cfi => cfi.definitionRef))];
        const cfidNamesAsType = cfidFileNames.map(fileName => fileName.substring(0, fileName.length - 4) + 'type');
        console.log("CFID Filenames: " + cfidFileNames);
        console.log("Type Filenames: " + cfidNamesAsType);

        const existingTypes = this.repository.getTypes();
        const lowerCasedExistingTypes = existingTypes.map(file => file.fileName.toLowerCase());
        
        const existingTypeFiles = cfidNamesAsType.filter(fileName => lowerCasedExistingTypes.indexOf(fileName.toLowerCase()) >= 0);
        const newTypeFiles = cfidNamesAsType.filter(fileName => lowerCasedExistingTypes.indexOf(fileName.toLowerCase()) < 0);

        console.log("Existing Type Filenames: " + existingTypeFiles);
        console.log("New Types: " + newTypeFiles);

        definition.children.forEach(child => this.convertCaseFileItem(child));

    }

    /**
     * 
     * @param {CaseFileItemDef} cfi 
     */
    convertCaseFileItem(cfi) {

    }
}

class CFIAsType {
    /**
     * 
     * @param {CaseFileItemDef} cfi 
     */
    constructor(cfi) {
        this.cfi = cfi;
    }
}