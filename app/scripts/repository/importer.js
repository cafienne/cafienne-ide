class Importer {
    /**
     * 
     * @param {IDE} ide 
     */
    constructor(ide) {
        this.ide = ide;
        this.repository = this.ide.repository;
    }

    load(pastedText) {
        const xmlDoc = XML.loadXMLString(pastedText);
        if (XML.isValid(xmlDoc) && xmlDoc.documentElement.tagName == 'definitions') {
            console.log('Parsing and uploading definitions from copy/paste command ...');
            const newFiles = new Array();
            const typeDefinitions = new Object();
            const typeRefs = new Object();
            const allDimensionsXML = XML.getChildByTagName(xmlDoc.documentElement, 'CMMNDI');
            XML.getChildrenByTagName(xmlDoc.documentElement, 'case').forEach(xmlElement => {
                // Create .case file
                const fileName = xmlElement.getAttribute('id'); // assuming fileName always ends with .case ?!
                const caseName = xmlElement.getAttribute('name');

                // Try to recover IDE design time guid
                const idAttributes = XML.allElements(xmlElement).map(element => element.getAttribute('id')).filter(id => id && id.startsWith('_')).map(id => id.split('_')[1]);
                if (idAttributes.length > 0) {
                    xmlElement.setAttribute('guid', `_${idAttributes[0]}`);
                } else {
                    console.log(`Could not reconstruct the IDE guid for case ${fileName}`)
                }

                this.stripCaseNameFromReferences(caseName, xmlElement);
                newFiles.push(new CaseImporter(this.repository, fileName, xmlElement));

                // Create .dimensions file
                // Copy and clean up dimensions from anything that does not occur inside this case's xmlElement
                const dimXML = /** @type {Element} */ (allDimensionsXML.cloneNode(true));
                const elementMatcher = (element, id1, id2 = '') => XML.allElements(xmlElement).find(e => e.getAttribute('id') == id1 || e.getAttribute('id') == id2) || element.parentNode.removeChild(element);
                XML.getElementsByTagName(dimXML, CMMNSHAPE).forEach(shape => elementMatcher(shape, shape.getAttribute('cmmnElementRef')));
                XML.getElementsByTagName(dimXML, 'textbox').forEach(shape => elementMatcher(shape, shape.getAttribute('parentId')));
                XML.getElementsByTagName(dimXML, 'casefileitem').forEach(shape => elementMatcher(shape, shape.getAttribute('parentId')));
                XML.getElementsByTagName(dimXML, CMMNEDGE).forEach(shape => elementMatcher(shape, shape.getAttribute('sourceCMMNElementRef'), shape.getAttribute('targetCMMNElementRef')));
                const dimName = fileName.substring(0, fileName.length - 5) + '.dimensions';
                this.stripCaseNameFromReferences(caseName, dimXML);
                newFiles.push(new DimensionsImporter(this.repository, dimName, dimXML));

                // Create .humantask files
                XML.getElementsByTagName(xmlElement, 'humanTask').forEach(humanTask => {
                    XML.getElementsByTagName(humanTask, 'cafienne:implementation').forEach(humanTaskExtensionElement => {
                        // Create a copy of implementation                        
                        const standAloneHumanTaskDefinition = /** @type {Element} */ (humanTaskExtensionElement.cloneNode(true));
                        // Put the copy in a new XML document
                        const task = XML.loadXMLString('<humantask />').documentElement;
                        task.appendChild(standAloneHumanTaskDefinition);

                        // Handy remover function
                        const removeChildrenWithName = (element, ...tagNames) => tagNames.forEach(tagName => XML.getElementsByTagName(element, tagName).forEach(child => child.parentNode.removeChild(child)));

                        // First clean up the extension element inside the case definition. Remove attributes and elements that belong to the standalone implementation of the humantask.
                        humanTaskExtensionElement.removeAttribute('class');
                        humanTaskExtensionElement.removeAttribute('name');
                        humanTaskExtensionElement.removeAttribute('description');
                        // And remove input and output and task-model from implementation node inside case model
                        removeChildrenWithName(humanTaskExtensionElement, 'input', 'output', 'task-model');

                        // Now cleanup the standalone implementation of the task. Remove attributes and elements that belong to the case model.
                        standAloneHumanTaskDefinition.removeAttribute('humanTaskRef');
                        // Remove parameter mappings, duedate and assignment elements, they belong in case model
                        removeChildrenWithName(standAloneHumanTaskDefinition, 'parameterMapping', 'duedate', 'assignment');

                        // Compose name of .humantask file. Prefer to take humanTaskRef attribute, but if that is not available,
                        //  we'll try to take the name from the implementation tag; and if that is also not there, we try to
                        //  take the name of the task itself inside the case model. Also remove spaces from it.
                        //  Then also set it again inside the case model's implementation of the task.
                        const id = humanTaskExtensionElement.getAttribute('humanTaskRef');
                        const name = humanTaskExtensionElement.getAttribute('name');
                        const backupName = humanTaskExtensionElement.parentNode.parentNode.getAttribute('name').replace(/ /g, '').toLowerCase() + '.humantask';
                        const fileName = id ? id : name ? name.toLowerCase() + '.humantask' : backupName;
                        // Now also set the reference on the implementation attribute (for the case it wasn't there yet)
                        humanTaskExtensionElement.setAttribute('humanTaskRef', fileName);
                        newFiles.push(new HumanTaskImporter(this.repository, fileName, task));
                    });
                });

            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'process').forEach(xmlElement => {
                const fileName = xmlElement.getAttribute('id');
                newFiles.push(new ProcessImporter(this.repository, fileName, xmlElement));
            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'caseFileItemDefinition').forEach(xmlElement => {
                const fileName = xmlElement.getAttribute('id');
                xmlElement.removeAttribute('id');
                if (fileName.endsWith('.cfid')) {
                    newFiles.push(new CFIDImporter(this.repository, fileName, xmlElement));
                } else {
                    const typeFile = new TypeFile(this.repository, fileName, `<type id="${fileName}" name="${xmlElement.getAttribute('name')}"><schema/></type>`);
                    typeFile.parse(andThen(() => {
                        const typeDefinition = /** @type {TypeDefinition} */ (typeFile.content.definition);
                        XML.getElementsByTagName(xmlElement, 'property').forEach((propertyElement) => {
                            const schemaPropertyDefinition = typeDefinition.schema.createEmptyProperty();
                            schemaPropertyDefinition.name = propertyElement.getAttribute('name');
                            let cmmnType = propertyElement.getAttribute('type').replace('http://www.omg.org/spec/CMMN/PropertyType/', '');
                            // Correct an inconsistency in type   for JSON(type="number")      vs CMMN(type="float") 
                            // Correct an inconsistency in format for JSON(format="date-time") vs CMMN(type=".../dateTime")
                            // Correct an inconsistency in format for JSON(format="uri")       vs CMMN(type=".../anyURI")  
                            cmmnType = cmmnType === 'float' ? 'number' : cmmnType === 'anyURI' ? 'uri' : cmmnType === 'dateTime' ? 'date-time' : cmmnType;
                            schemaPropertyDefinition.cmmnType = cmmnType;
                            schemaPropertyDefinition.multiplicity = 'ExactlyOne'; // CMMN doesn't specify multiplicity for primitive cfid properties
                            XML.getElementsByTagName(propertyElement, 'cafienne:implementation').forEach(propertyExtensionElement => {
                                const isBusinessIdentifierAttribute = propertyExtensionElement.getAttribute('isBusinessIdentifier');
                                if (isBusinessIdentifierAttribute === 'true') {
                                    schemaPropertyDefinition.isBusinessIdentifier = true;
                                }
                            });
                            typeDefinition.schema.properties.push(schemaPropertyDefinition);
                        });
                        if (fileName.endsWith('.type')) {
                            newFiles.push(new TypeImporter(this.repository, fileName, xmlElement, typeDefinition));
                        }
                        // Keep the embedded types for later usage during te import;
                        typeDefinitions[fileName] = typeDefinition;
                    }));
                }
            });
            XML.getElementsByTagName(xmlDoc.documentElement, 'caseFileModel').forEach(caseFileModel => {
                const typeRef = caseFileModel.getAttribute('cafienne:typeRef');
                if (typeRef && typeRef.endsWith('.type')) {
                    if (!typeRefs[typeRef]) {
                        typeRefs[typeRef] = typeRef; // To avoid generating same typeRef again as they can appear in multiple (sub)case's
                        let typeDefinition = /** @type {TypeDefinition} */ typeDefinitions[typeRef];
                        if (!typeDefinition) {
                            const typeFile = new TypeFile(this.repository, typeRef, TypeDefinition.createDefinitionSource(typeRef.replace(/\.type$/, '')));
                            typeFile.parse(andThen(() => {
                                // parsing is not a-sync code; so we are sure typeDefinition will be set with a new or already existing type from cache
                                typeDefinition = typeDefinitions[typeRef] = typeFile.content.definition;
                            }));
                        }
                        for (const caseFileItem of caseFileModel.children) {
                            this.loadCaseFileItem(typeDefinition, typeDefinition.schema, caseFileItem, typeDefinitions);
                        }
                    }
                    // Clear content as caseFileModel is definded by a typeRef
                    caseFileModel.innerHTML = '';
                    // without namespace prefix: typeRef="xxxx.type" in stead of cafienne:typeRef="xxxx.type"
                    caseFileModel.removeAttribute('cafienne:typeRef');
                    caseFileModel.removeAttribute('xmlns:cafienne');
                    caseFileModel.setAttribute('typeRef', typeRef); 
                }
            });

            const fileNames = newFiles.map(file => file.fileName);
            if (confirm('Press OK to upload the following ' + fileNames.length + ' files\n\n- ' + (fileNames.join('\n- ')))) {
                newFiles.forEach(file => file.save());
            }
        }
    }

    /**
     * 
     * @param {string} caseName 
     * @param {Element} xmlElement 
     */
    stripCaseNameFromReferences(caseName, xmlElement) {
        const caseNamePrefix = caseName + '/';
        const caseNamePrefixLength = caseNamePrefix.length;
        const updateReferences = (tagName, attributeName) =>
            XML.getElementsByTagName(xmlElement, tagName) // Search for elements with the tagname
                .filter((element) => element.getAttribute(attributeName) && element.getAttribute(attributeName).startsWith(caseNamePrefix))
                .forEach((element) => {
                    const oldRef = element.getAttribute(attributeName);
                    element.setAttribute(attributeName, oldRef.substring(caseNamePrefixLength));
                });

        updateReferences('repetitionRule', 'contextRef');
        updateReferences('requiredRule', 'contextRef');
        updateReferences('manualActivationRule', 'contextRef');
        updateReferences('applicabilityRule', 'contextRef');
        updateReferences('ifPart', 'contextRef');
        updateReferences('caseFileItemOnPart', 'sourceRef');
        updateReferences('input', 'bindingRef');
        updateReferences('output', 'bindingRef');
        updateReferences('inputs', 'bindingRef');
        updateReferences('outputs', 'bindingRef');
        updateReferences('CMMNEdge', 'sourceCMMNElementRef');
        updateReferences('CMMNEdge', 'targetCMMNElementRef');
        updateReferences('CMMNShape', 'cmmnElementRef');
    }

    /**
     * 
     * @param {TypeDefinition} typeDefinition 
     * @param {SchemaDefinition} schemaDefinition 
     * @param {Element} caseFileItem 
     * @param {Object} typeDefinitions 
     */
    loadCaseFileItem(typeDefinition, schemaDefinition, caseFileItem, typeDefinitions) {
        if (caseFileItem.nodeName === 'caseFileItem') {
            const property = /** @type {SchemaPropertyDefinition} */ (schemaDefinition.createEmptyProperty());
            property.name = caseFileItem.getAttribute('name');
            property.multiplicity = caseFileItem.getAttribute('multiplicity');
            schemaDefinition.properties.push(property);

            const definitionRef = caseFileItem.getAttribute('definitionRef');
            if (definitionRef.endsWith('.object')) {
                // It is an internal embedded object in type
                property.type = 'object';
                const embeddedTypeDefinition = typeDefinitions[definitionRef];
                embeddedTypeDefinition.schema.properties.forEach((embeddedProperty) => {property.schema.properties.push(embeddedProperty)}); // Push all properties of the embedded caseFileItemDefinition to the typeDefinition;
                const children = caseFileItem.getElementsByTagName('children');
                if (children.length === 1) {
                    for (const embeddedCaseFileItem of children[0].children) {
                        this.loadCaseFileItem(typeDefinition, property.schema, embeddedCaseFileItem, typeDefinitions);
                    }
                }
            }
            if (definitionRef.endsWith('.type')) {
                // It is an external referred type
                property.type = definitionRef;
            }
        }
    }
}

class ImportElement {
    /**
     * 
     * @param {Repository} repository 
     * @param {String} fileName 
     * @param {Element} xmlElement 
     */
    constructor(repository, fileName, xmlElement) {
        this.repository = repository;
        this.fileName = fileName;
        this.xmlElement = xmlElement;
    }

    get content() {
        return XML.prettyPrint(this.xmlElement);
    }

    save() {
        const file = this.repository.get(this.fileName) || this.createFile();
        file.source = this.content.replace(/xmlns="http:\/\/www.omg.org\/spec\/CMMN\/20151109\/MODEL"/g, '');
        file.save();
    }

    /**
     * @returns {ServerFile}
     */
    createFile() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}

class CaseImporter extends ImportElement {
    createFile() {
        return this.repository.createCaseFile(this.fileName, this.content);
    }
}

class DimensionsImporter extends ImportElement {
    createFile() {
        return this.repository.createDimensionsFile(this.fileName, this.content);
    }
}

class ProcessImporter extends ImportElement {
    createFile() {
        return this.repository.createProcessFile(this.fileName, this.content);
    }
}

class HumanTaskImporter extends ImportElement {
    createFile() {
        return this.repository.createHumanTaskFile(this.fileName, this.content);
    }
}

class CFIDImporter extends ImportElement {
    createFile() {
        return this.repository.createCFIDFile(this.fileName, this.content);
    }
}

class TypeImporter extends ImportElement {
    /**
     * 
     * @param {Repository} repository 
     * @param {String} fileName 
     * @param {Element} xmlElement 
     * @param {TypeDefinition} typeDefinition 
     */
    constructor(repository, fileName, xmlElement, typeDefinition) {
        super(repository, fileName, xmlElement);
        this.typeDefinition = typeDefinition;
    }

    get content() {
        return XML.prettyPrint(this.typeDefinition.toXML().documentElement);
    }

    createFile() {
        return this.repository.createTypeFile(this.fileName, this.content);
    }
}

