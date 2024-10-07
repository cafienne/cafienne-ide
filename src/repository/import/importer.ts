import XML from "@util/xml";
import Tags from "../definition/dimensions/tags";
import Repository from "../repository";
import ImportElement, { CFIDImporter, CaseImporter, DimensionsImporter, HumanTaskImporter, ProcessImporter } from "./importelement";

export default class Importer {
    newFiles: ImportElement[] = [];
    
    /**
     * 
     * @param {Repository} repository 
     */
    constructor(public repository: Repository, public text: string) {
        const isNew = (fileName: string) => this.newFiles.find(file => file.fileName === fileName) === undefined;
        const getAttribute = (element: Element, name: string) => element.getAttribute(name) || '';

        const xmlDoc = XML.loadXMLString(this.text);
        if (XML.isValid(xmlDoc) && xmlDoc.documentElement.tagName == 'definitions') {
            console.log('Parsing and uploading definitions from copy/paste command ...');
            const allDimensionsXML = XML.getChildByTagName(xmlDoc.documentElement, Tags.CMMNDI);
            XML.getChildrenByTagName(xmlDoc.documentElement, 'case').forEach(xmlElement => {
                // Create .case file
                const fileName: string = getAttribute(xmlElement, 'id'); // assuming fileName always ends with .case ?!

                // Try to recover IDE design time guid
                const idAttributes = XML.allElements(xmlElement).map(element => getAttribute(element, 'id')).filter(id => id && id.startsWith('_')).map(id => id.split('_')[1]);
                if (idAttributes.length > 0) {
                    xmlElement.setAttribute('guid', `_${idAttributes[0]}`);
                } else {
                    console.log(`Could not reconstruct the IDE guid for case ${fileName}`)
                }

                if (isNew(fileName)) {
                    this.newFiles.push(new CaseImporter(this, fileName, xmlElement));

                    // Create .dimensions file
                    // Copy and clean up dimensions from anything that does not occur inside this case's xmlElement
                    const dimXML = <Element> allDimensionsXML.cloneNode(true);
                    const elementMatcher = (element: Element, id1: string, id2 = '') => XML.allElements(xmlElement).find(e => getAttribute(e, 'id') == id1 || getAttribute(e, 'id') == id2) || element.parentNode?.removeChild(element);
                    XML.getElementsByTagName(dimXML, Tags.CMMNSHAPE).forEach(shape => elementMatcher(shape, getAttribute(shape, 'cmmnElementRef')));
                    XML.getElementsByTagName(dimXML, Tags.CMMNEDGE).forEach(shape => elementMatcher(shape, getAttribute(shape, 'sourceCMMNElementRef'), getAttribute(shape, 'targetCMMNElementRef')));
                    const dimName = fileName.substring(0, fileName.length - 5) + '.dimensions';
                    if (isNew(dimName)) {
                        this.newFiles.push(new DimensionsImporter(this, dimName, dimXML));
                    }
                    // Create .humantask files
                    XML.getElementsByTagName(xmlElement, 'humanTask').forEach(humanTask => {
                        XML.getElementsByTagName(humanTask, 'cafienne:implementation').forEach(humanTaskExtensionElement => {
                            // Create a copy of implementation
                            const standAloneHumanTaskDefinition = <Element> humanTaskExtensionElement.cloneNode(true);
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
                                this.newFiles.push(new HumanTaskImporter(this, fileName, task));
                            }
                        });
                    });
                }
            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'process').forEach(xmlElement => {
                const fileName = getAttribute(xmlElement, 'id');
                if (isNew(fileName)) {
                    this.newFiles.push(new ProcessImporter(this, fileName, xmlElement));
                }
            });
            XML.getChildrenByTagName(xmlDoc.documentElement, 'caseFileItemDefinition').forEach(xmlElement => {
                const fileName = getAttribute(xmlElement, 'id');
                if (isNew(fileName)) {
                    xmlElement.removeAttribute('id')
                    this.newFiles.push(new CFIDImporter(this, fileName, xmlElement));
                }
            });
        }
    }

    uploadFiles() {
        this.newFiles.forEach(file => file.save());
    }

    get files() {
        return this.newFiles;
    }
}
