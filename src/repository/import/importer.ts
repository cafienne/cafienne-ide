import SchemaDefinition from "@repository/definition/type/schemadefinition";
import TypeDefinition from "@repository/definition/type/typedefinition";
import XML from "@util/xml";
import Tags from "../definition/dimensions/tags";
import Repository from "../repository";
import ImportElement, { CFIDImporter, CaseImporter, DimensionsImporter, HumanTaskImporter, ProcessImporter, TypeImporter } from "./importelement";
import TypeFile from "@repository/serverfile/typefile";

export default class Importer {
    importFiles: ImportElement[] = [];

    constructor(public repository: Repository, public text: string) {
        const isNew = (fileName: string) => this.importFiles.find(file => file.fileName === fileName) === undefined;
        const getAttribute = (element: Element, name: string) => element.getAttribute(name) || '';

        const xmlDoc = XML.loadXMLString(this.text);
        if (XML.isValid(xmlDoc) && xmlDoc.documentElement.tagName == 'definitions') {
            console.log('Parsing and uploading definitions from copy/paste command ...');
            const typeDefinitions: any = new Object();
            const typeRefs: any = new Object();
            const allDimensionsXML = XML.getChildByTagName(xmlDoc.documentElement, Tags.CMMNDI);
            XML.getChildrenByTagName(xmlDoc.documentElement, 'case').forEach(xmlElement => {
                // Create .case file
                const fileName: string = getAttribute(xmlElement, 'id'); // assuming fileName always ends with .case ?!
                const caseName = getAttribute(xmlElement, 'name');

                // Try to recover IDE design time guid
                const idAttributes = XML.allElements(xmlElement).map(element => getAttribute(element, 'id')).filter(id => id && id.startsWith('_')).map(id => id.split('_')[1]);
                if (idAttributes.length > 0) {
                    xmlElement.setAttribute('guid', `_${idAttributes[0]}`);
                } else {
                    console.log(`Could not reconstruct the IDE guid for case ${fileName}`)
                }

                if (isNew(fileName)) {
                    this.stripCaseNameFromReferences(caseName, xmlElement);
                    this.importFiles.push(new CaseImporter(this, fileName, xmlElement));

                    // Create .dimensions file
                    // Copy and clean up dimensions from anything that does not occur inside this case's xmlElement
                    const dimXML = <Element>allDimensionsXML.cloneNode(true);
                    const elementMatcher = (element: Element, id1: string, id2 = '') => XML.allElements(xmlElement).find(e => getAttribute(e, 'id') == id1 || getAttribute(e, 'id') == id2) || element.parentNode?.removeChild(element);
                    XML.getElementsByTagName(dimXML, Tags.CMMNSHAPE).forEach(shape => elementMatcher(shape, getAttribute(shape, 'cmmnElementRef')));
                    XML.getElementsByTagName(dimXML, Tags.CMMNEDGE).forEach(shape => elementMatcher(shape, getAttribute(shape, 'sourceCMMNElementRef'), getAttribute(shape, 'targetCMMNElementRef')));
                    const dimName = fileName.substring(0, fileName.length - 5) + '.dimensions';
                    if (isNew(dimName)) {
                        this.stripCaseNameFromReferences(caseName, dimXML);
                        this.importFiles.push(new DimensionsImporter(this, dimName, dimXML));
                    }
                    // Create .humantask files
                    XML.getElementsByTagName(xmlElement, 'humanTask').forEach(humanTask => {
                        XML.getElementsByTagName(humanTask, 'cafienne:implementation').forEach(humanTaskExtensionElement => {
                            // Create a copy of implementation
                            const standAloneHumanTaskDefinition = <Element>humanTaskExtensionElement.cloneNode(true);
                            // Put the copy in a new XML document
                            const task = XML.loadXMLString('<humantask />').documentElement;
                            task.appendChild(standAloneHumanTaskDefinition);

                            // Handy remover function
                            const removeChildrenWithName = (element: Element, ...tagNames: string[]) => tagNames.forEach(tagName => XML.getElementsByTagName(element, tagName).forEach(child => child.parentNode?.removeChild(child)));

                            // First clean up the extension element inside the case definition. Remove attributes and elements that belong to the standalone implementation of the humantask.
                            humanTaskExtensionElement.removeAttribute('class');
                            humanTaskExtensionElement.removeAttribute('name');
                            humanTaskExtensionElement.removeAttribute('description');
                            // And remove input and output and task-model from implementation node inside case model
                            removeChildrenWithName(humanTaskExtensionElement, 'input', 'output', 'task-model', 'documentation');

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
                            // @ts-ignore
                            const backupName = humanTaskExtensionElement.parentNode.parentNode.getAttribute('name').replace(/ /g, '').toLowerCase() + '.humantask';
                            const fileName = id ? id : name ? name.toLowerCase() + '.humantask' : backupName;
                            // Now also set the reference on the implementation attribute (for the case it wasn't there yet)
                            humanTaskExtensionElement.setAttribute('humanTaskRef', fileName);
                            if (isNew(fileName)) {
                                this.importFiles.push(new HumanTaskImporter(this, fileName, task));
                            }
                        });
                    });
                }
            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'process').forEach(xmlElement => {
                const fileName = getAttribute(xmlElement, 'id');
                if (isNew(fileName)) {
                    this.importFiles.push(new ProcessImporter(this, fileName, xmlElement));
                }
            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'caseFileItemDefinition').forEach(xmlElement => {
                const fileName = getAttribute(xmlElement, 'id');
                if (isNew(fileName)) {
                    xmlElement.removeAttribute('id');
                    if (fileName.endsWith('.cfid')) {
                        this.importFiles.push(new CFIDImporter(this, fileName, xmlElement));
                    } else {
                        var typeFile: TypeFile = <TypeFile> this.repository.get(fileName);
                        var source = `<type id="${fileName}" name="${xmlElement.getAttribute('name')}"><schema/></type>`;
                        if (!typeFile) {
                            typeFile = this.repository.createTypeFile(fileName, source);
                            if (fileName.endsWith('.object')) {
                                // Just use it as temporary TypeFile object to import schema
                                this.repository.removeFile(typeFile);
                            }
                        } else {
                            // Overwrite existing file
                            typeFile.source = source;
                            typeFile.parse();
                        }
                        if (!typeFile.definition) return;
                        const typeDefinition: TypeDefinition = typeFile.definition;
                        const typeSchema = typeDefinition.schema;
                        if (typeSchema) {
                            XML.getElementsByTagName(xmlElement, 'property').forEach((propertyElement) => {
                                const schemaPropertyDefinition = typeSchema.createChildProperty(propertyElement.getAttribute('name') || '');
                                schemaPropertyDefinition.withCMMNType(propertyElement.getAttribute('type') || '');
                                XML.getElementsByTagName(propertyElement, 'cafienne:implementation').forEach(propertyExtensionElement => {
                                    const isBusinessIdentifierAttribute = propertyExtensionElement.getAttribute('isBusinessIdentifier');
                                    if (isBusinessIdentifierAttribute === 'true') {
                                        schemaPropertyDefinition.isBusinessIdentifier = true;
                                    }
                                });
                            });
                        }
                        if (fileName.endsWith('.type')) {
                            this.importFiles.push(new TypeImporter(this, fileName, xmlElement, typeDefinition));
                        }
                        // Keep the embedded types for later usage during te import;
                        typeDefinitions[fileName] = typeDefinition;
                    }
                }
            });
            XML.getElementsByTagName(xmlDoc.documentElement, 'caseFileModel').forEach(caseFileModel => {
                const typeRef = caseFileModel.getAttribute('cafienne:typeRef') || '';
                if (typeRef && typeRef.endsWith('.type')) {
                    if (!typeRefs[typeRef]) {
                        typeRefs[typeRef] = typeRef; // To avoid generating same typeRef again as they can appear in multiple (sub)case's
                        let typeDefinition = /** @type {TypeDefinition} */ typeDefinitions[typeRef];
                        if (!typeDefinition) {
                            const typeFile = this.repository.createTypeFile(typeRef, TypeDefinition.createDefinitionSource(typeRef.replace(/\.type$/, '')));
                            // parsing is not a-sync code; so we are sure typeDefinition will be set with a new or already existing type from cache
                            typeDefinition = typeDefinitions[typeRef] = typeFile.definition;
                        }
                        for (const caseFileItem of caseFileModel.children) {
                            this.loadCaseFileItem(typeDefinition.schema, caseFileItem, typeDefinitions);
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

    stripCaseNameFromReferences(caseName: string, xmlElement: Element) {
        const caseNamePrefix = caseName + '/';
        const caseNamePrefixLength = caseNamePrefix.length;
        const updateReferences = (tagName: string, attributeName: string) =>
            XML.getElementsByTagName(xmlElement, tagName) // Search for elements with the tagname
                .filter((element) => element.getAttribute(attributeName) && (element.getAttribute(attributeName) || '').startsWith(caseNamePrefix))
                .forEach((element) => {
                    const oldRef = element.getAttribute(attributeName) || '';
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

    loadCaseFileItem(schemaDefinition: SchemaDefinition, caseFileItem: Element, typeDefinitions: any) {
        if (caseFileItem.nodeName === 'caseFileItem') {
            const property = schemaDefinition.createChildProperty(caseFileItem.getAttribute('name') || '', '', caseFileItem.getAttribute('multiplicity') || '');
            // Check whether it is an inline type or a standalone child type
            const definitionRef = caseFileItem.getAttribute('definitionRef') || '';
            if (definitionRef.endsWith('.object')) {
                // It is an internal embedded object in type
                property.type = 'object';
                const embeddedTypeDefinition = typeDefinitions[definitionRef] as TypeDefinition;
                embeddedTypeDefinition.schema?.properties.forEach((embeddedProperty) => { property.schema?.properties.push(embeddedProperty) }); // Push all properties of the embedded caseFileItemDefinition to the typeDefinition;
                const children = XML.getChildByTagName(caseFileItem, 'children');
                if (children && property.schema) {
                    for (const embeddedCaseFileItem of children.children) {
                        this.loadCaseFileItem(property.schema, embeddedCaseFileItem, typeDefinitions);
                    }
                }
            }
            if (definitionRef.endsWith('.type')) {
                // It is an external referred type
                property.type = definitionRef;
                const externalTypeDefinition = typeDefinitions[definitionRef] as TypeDefinition;
                const children = XML.getChildByTagName(caseFileItem, 'children');
                if (children && externalTypeDefinition.schema) {
                    for (const embeddedCaseFileItem of children.children) {
                        this.loadCaseFileItem(externalTypeDefinition.schema, embeddedCaseFileItem, typeDefinitions);
                    }
                }
            }
        }
    }

    async uploadFiles() {
        console.group("Uploading " + this.importFiles.length +" new files");
        for (let i = 0; i < this.importFiles.length; i++) {
            const importElement = this.importFiles[i];
            await importElement.save();
        }
        console.log("Uploaded all")
        console.groupEnd();
        // Now parse root file again, so that all dependencies are resolved properly
        this.repository.get(this.importFiles[0].fileName)?.parse();            
    }

    get files() {
        return this.importFiles;
    }
}
