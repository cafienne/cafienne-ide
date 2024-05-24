import IDE from "../ide/ide";

export default class Importer {
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
            const allDimensionsXML = XML.getChildByTagName(xmlDoc.documentElement, 'CMMNDI');
            XML.getChildrenByTagName(xmlDoc.documentElement, 'case').forEach(xmlElement => {
                // Create .case file
                const fileName = xmlElement.getAttribute('id'); // assuming fileName always ends with .case ?!

                // Try to recover IDE design time guid
                const idAttributes = XML.allElements(xmlElement).map(element => element.getAttribute('id')).filter(id => id && id.startsWith('_')).map(id => id.split('_')[1]);
                if (idAttributes.length > 0) {
                    xmlElement.setAttribute('guid', `_${idAttributes[0]}`);
                } else {
                    console.log(`Could not reconstruct the IDE guid for case ${fileName}`)
                }

                newFiles.push(new CaseImporter(this.repository, fileName, xmlElement));

                // Create .dimensions file
                // Copy and clean up dimensions from anything that does not occur inside this case's xmlElement
                const dimXML = /** @type {Element} */ (allDimensionsXML.cloneNode(true));
                const elementMatcher = (element, id1, id2 = '') => XML.allElements(xmlElement).find(e => e.getAttribute('id') == id1 || e.getAttribute('id') == id2) || element.parentNode.removeChild(element);
                XML.getElementsByTagName(dimXML, CMMNSHAPE).forEach(shape => elementMatcher(shape, shape.getAttribute('cmmnElementRef')));
                XML.getElementsByTagName(dimXML, 'textbox').forEach(shape => elementMatcher(shape, shape.getAttribute('parentId')));
                XML.getElementsByTagName(dimXML, 'casefileitem').forEach(shape => elementMatcher(shape, shape.getAttribute('parentId')));
                XML.getElementsByTagName(dimXML, CMMNEDGE).forEach(shape =>  elementMatcher(shape, shape.getAttribute('sourceCMMNElementRef'), shape.getAttribute('targetCMMNElementRef')));
                const dimName = fileName.substring(0, fileName.length - 5) + '.dimensions';
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
                xmlElement.removeAttribute('id')
                newFiles.push(new CFIDImporter(this.repository, fileName, xmlElement));
            });
            const fileNames = newFiles.map(file => file.fileName);
            if (confirm('Press OK to upload the following ' + fileNames.length + ' files\n\n- ' + (fileNames.join('\n- ')))) {
                newFiles.forEach(file => file.save());
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
        file.source = this.content;
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
