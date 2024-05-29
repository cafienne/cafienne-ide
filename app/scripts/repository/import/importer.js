class Importer {
    /**
     * 
     * @param {Repository} repository 
     */
    constructor(repository, text) {
        this.repository = repository;
        this.text = text;
        this.newFiles = /** @type {Array<ImportElement>} */ (new Array());
        const isNew = (fileName) => this.newFiles.find(file => file.fileName === fileName) === undefined;

        const xmlDoc = XML.loadXMLString(this.text);
        if (XML.isValid(xmlDoc) && xmlDoc.documentElement.tagName == 'definitions') {
            console.log('Parsing and uploading definitions from copy/paste command ...');
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

                if (isNew(fileName)) {
                    this.stripCaseNameFromReferences(caseName, xmlElement);
                    this.newFiles.push(new CaseImporter(this, fileName, xmlElement));

                    // Create .dimensions file
                    // Copy and clean up dimensions from anything that does not occur inside this case's xmlElement
                    const dimXML = /** @type {Element} */ (allDimensionsXML.cloneNode(true));
                    const elementMatcher = (element, id1, id2 = '') => XML.allElements(xmlElement).find(e => e.getAttribute('id') == id1 || e.getAttribute('id') == id2) || element.parentNode.removeChild(element);
                    XML.getElementsByTagName(dimXML, CMMNSHAPE).forEach(shape => elementMatcher(shape, shape.getAttribute('cmmnElementRef')));
                    XML.getElementsByTagName(dimXML, 'textbox').forEach(shape => elementMatcher(shape, shape.getAttribute('parentId')));
                    XML.getElementsByTagName(dimXML, 'casefileitem').forEach(shape => elementMatcher(shape, shape.getAttribute('parentId')));
                    XML.getElementsByTagName(dimXML, CMMNEDGE).forEach(shape => elementMatcher(shape, shape.getAttribute('sourceCMMNElementRef'), shape.getAttribute('targetCMMNElementRef')));
                    const dimName = fileName.substring(0, fileName.length - 5) + '.dimensions';
                    if (isNew(dimName)) {
                        this.stripCaseNameFromReferences(caseName, dimXML);
                        this.newFiles.push(new DimensionsImporter(this, dimName, dimXML));
                    }
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
                            if (isNew(fileName)) {
                                this.newFiles.push(new HumanTaskImporter(this, fileName, task));
                            }
                        });
                    });
                }
            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'process').forEach(xmlElement => {
                const fileName = xmlElement.getAttribute('id');
                if (isNew(fileName)) {
                    this.newFiles.push(new ProcessImporter(this, fileName, xmlElement));
                }
            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'caseFileItemDefinition').forEach(xmlElement => {
                const fileName = xmlElement.getAttribute('id');
                if (isNew(fileName)) {
                    xmlElement.removeAttribute('id');
                    if (fileName.endsWith('.cfid')) {
                        this.newFiles.push(new CFIDImporter(this, fileName, xmlElement));
                    } else {
                        const typeFile = new TypeFile(this.repository, fileName, `<type id="${fileName}" name="${xmlElement.getAttribute('name')}"><schema/></type>`);
                        typeFile.parse(andThen(() => {
                            const typeDefinition = /** @type {TypeDefinition} */ (typeFile.content.definition);
                            XML.getElementsByTagName(xmlElement, 'property').forEach((propertyElement) => {
                                const schemaPropertyDefinition = typeDefinition.schema.createChildProperty(propertyElement.getAttribute('name'));
                                schemaPropertyDefinition.fromCMMNType(propertyElement.getAttribute('type'));
                                XML.getElementsByTagName(propertyElement, 'cafienne:implementation').forEach(propertyExtensionElement => {
                                    const isBusinessIdentifierAttribute = propertyExtensionElement.getAttribute('isBusinessIdentifier');
                                    if (isBusinessIdentifierAttribute === 'true') {
                                        schemaPropertyDefinition.isBusinessIdentifier = true;
                                    }
                                });
                            });
                            if (fileName.endsWith('.type')) {
                                this.newFiles.push(new TypeImporter(this, fileName, xmlElement, typeDefinition));
                            }
                            // Keep the embedded types for later usage during te import;
                            typeDefinitions[fileName] = typeDefinition;
                        }));
                    }
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
            const property = schemaDefinition.createChildProperty(caseFileItem.getAttribute('name'), '', caseFileItem.getAttribute('multiplicity'))
            // Check whether it is an inline type or a standalone child type
            const definitionRef = caseFileItem.getAttribute('definitionRef');
            if (definitionRef.endsWith('.object')) {
                // It is an internal embedded object in type
                property.type = 'object';
                const embeddedTypeDefinition = typeDefinitions[definitionRef];
                embeddedTypeDefinition.schema.properties.forEach((embeddedProperty) => { property.schema.properties.push(embeddedProperty) }); // Push all properties of the embedded caseFileItemDefinition to the typeDefinition;
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

    uploadFiles() {
        this.newFiles.forEach(file => file.save());
    }

    /**
     * @returns {Array<ImportElement>}
     */
    get files() {
        return this.newFiles;
    }
}
