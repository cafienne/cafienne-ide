'use strict';

const Consts = require('../constant.js');
const XML = require('../xml').XML;
const Definitions = require('./definitions').Definitions;
const Store = require('../store/store.js').Store;

class CaseDefinition {
    /**
     * 
     * @param {String} caseName 
     * @param {Definitions} definitionsDocument 
     * @param {Store} store 
     */
    constructor(caseName, definitionsDocument, store) {
        this.definitionsDocument = definitionsDocument;

        // First, load and parse the XML of the case file.
        const caseContent = store.load(caseName + Consts.CASE_EXT);
        this.caseElement = XML.loadXMLElement(caseContent);

        // CMMN Modeler stores a guid in the case definition for generating IDs for new elements added to the case;
        //  Here, we remove this guid.
        this.caseElement.removeAttribute('guid');

        // Now first register ourselves with the definitions document, in order to have the proper order with the loading of the referenced subcases
        //  and to avoid recursive loops
        this.identifier = this.caseElement.getAttribute('id');
        this.definitionsDocument.addCase(this);

        // Add case file item references
        const caseFileItemRefs = this.findReferences('caseFileItemRef', 'cfiRef');
        definitionsDocument.resolveCaseFileItemReferences(caseFileItemRefs);
        const caseFileItems = /** @type {IterableIterator<Element>}} */ (definitionsDocument.loadedCaseFileItems.values());

        // Add case file definition references
        const caseFileDefinitionRefs = this.findReferences('caseFileItem', 'definitionRef');
        definitionsDocument.resolveCaseFileDefinitionReferences(caseFileDefinitionRefs);

        // Now also make sure that all the definitionRefs of the CaseFileItemRef objects are loaded
        for (const cfiDefinition of definitionsDocument.loadedCaseFileItems.values()) {
            const definitionRefs = this.findReferences('caseFileItem', 'definitionRef', cfiDefinition);
            definitionRefs.push(cfiDefinition.getAttribute('definitionRef'));
            definitionsDocument.resolveCaseFileDefinitionReferences(definitionRefs.filter(value => value !== ''));
        }

        // Find out the process that this case refers to and add them to the definitions document
        const processRefs = this.findReferences('processTask', 'processRef');
        definitionsDocument.resolveProcessReferences(processRefs);

        // Add task references
        const humanTaskRefs = this.findReferences('cafienne:implementation', 'humanTaskRef');
        definitionsDocument.resolveHumanTaskReferences(humanTaskRefs);

        // Now load and parse the accompanying dimensions file with the CMMN DI format
        const dimensionsContent = store.load(caseName + Consts.CASE_DIMENSION_EXT);
        this.dimensionsTree = XML.loadXMLElement(dimensionsContent);

        // ... and finally add the sub cases
        const caseRefs = this.findReferences('caseTask', 'caseRef');
        definitionsDocument.resolveSubCaseReferences(caseRefs);
    }

    /**
     * Returns all external references in this case of a certain type
     * @param {String} elementName Search for elements with this name.
     * @param {String} referenceAttributeName  Name of xml attribute that holds the references to be returned
     * @param {Element} parent The node in which to search for the elements
     * @returns 
     */
    findReferences(elementName, referenceAttributeName, parent = this.caseElement) {
        return XML.findElementsWithTag(parent, elementName).map(element => element.getAttribute(referenceAttributeName)).filter(string => string !== '');
    }

    appendDiagramInformation(diagramElement) {
        // Just read the shapes from the 'local' diagramElement and copy (or is it move?) them into the 'global' diagramElement
        const localCMMNDiagramElement = this.dimensionsTree.getElementsByTagName(Consts.CMMNDIAGRAM)[0];
        const shapeElements = localCMMNDiagramElement.childNodes;
        for (let i = 0; i < shapeElements.length; i++) {
            const shapeElement = shapeElements[i].cloneNode(true);
            diagramElement.appendChild(shapeElement);
        }
    }

    fillCaseFileModel() {
        XML.findElementsWithTag(this.caseElement, 'caseFileItemRef').forEach(cfi => this.fillCaseFileItem(cfi));
    }

    fillCaseFileItem(cfiElement) {
        const cfiName = cfiElement.getAttribute('name');
        const cfiRef = cfiElement.getAttribute('cfiRef');
        if (cfiRef === '') {
            console.log(`Case File Item ${cfiName} does not have a reference to an implementation and will not be included in the case file model`);
            return;
        }
        const cfiDefinition = this.definitionsDocument.loadedCaseFileItems.get(cfiRef);
        if (cfiDefinition === undefined) {
            console.log(`Cannot find the reference ${cfiRef} used in case file item ${cfiName}`);
            return;
        }

        // Always overwrite the name from the definition with the one defined in the .case file
        cfiDefinition.setAttribute('name', cfiElement.getAttribute('name'));
        // Same for id and multiplicity
        cfiDefinition.setAttribute('id', cfiElement.getAttribute('id'));
        cfiDefinition.setAttribute('multiplicity', cfiElement.getAttribute('multiplicity'));

        // Make sure the definitionRef is at the end of the attributes (as before)
        const defRef = cfiDefinition.getAttribute('definitionRef');
        cfiDefinition.removeAttribute('definitionRef');
        cfiDefinition.setAttribute('definitionRef', defRef);

        const casefileModel = cfiElement.parentNode;
        casefileModel.removeChild(cfiElement);
        casefileModel.appendChild(cfiDefinition);
    }

    fillInHumanTaskExtensions() {
        XML.findElementsWithTag(this.caseElement, 'humanTask').forEach(task => this.fillInHumanTask(task));
    }

    fillInHumanTask(humanTaskElement) {
        const taskName = humanTaskElement.getAttribute('name');

        //get <cafienne:implementation> node inside the <humanTask> node
        const extensionElements = XML.findChildrenWithTag(humanTaskElement, 'extensionElements');
        if (extensionElements.length === 0) {
            console.log('Human task ' + taskName + ' does not have a custom implementation');
            return;
        }

        const extensionElement = extensionElements[0];
        const implementationNodes = XML.findChildrenWithTag(extensionElement, 'cafienne:implementation');
        if (implementationNodes.length === 0) {
            console.log('Human task ' + taskName + ' does not have a custom implementation');
            return;
        }

        const implementationNode = implementationNodes[0];
        const ref = implementationNode.getAttribute('humanTaskRef');
        if (ref === '') {
            console.log('Human task ' + taskName + ' does not have a reference to a custom implementation');
            return;
        }

        //get content from humantask model with name 'ref'
        const humanTaskDefinition = this.definitionsDocument.loadedHumanTasks.get(ref);
        if (humanTaskDefinition === undefined) {
            console.log('Cannot find the human task reference ' + ref);
            return;
        }

        //locate <cafienne:implementation> node in the humantask model (external file)
        const humanTaskImplementationNodes = humanTaskDefinition.getElementsByTagName('cafienne:implementation');
        if (humanTaskImplementationNodes.length == 0) {
            console.log('The human task ' + ref + ' does not contain a cafienne:implementation node');
            return;
        }

        // Now clone the task implementation, so that it can be re-used across multiple tasks
        const humanTaskImplementation = humanTaskImplementationNodes[0];
        const clonedHumanTaskImplementation = humanTaskImplementation.cloneNode(true);
        // Keep the reference for sake of reverse engineering a deployed model
        clonedHumanTaskImplementation.setAttribute('humanTaskRef', ref);

        const validatorRef = implementationNode.getAttribute('validatorRef');
        if (validatorRef) {
            clonedHumanTaskImplementation.setAttribute('validatorRef', validatorRef);
            this.definitionsDocument.resolveProcessReferences([validatorRef]);
        }

        // Now move the parameterMapping children from the case model into the human task
        //  Note: this should first clone the human task into the case model, otherwise we get
        //  all parameter mappings spread across all human tasks ...
        XML.findElementsWithTag(implementationNode, 'duedate').forEach(duedate => clonedHumanTaskImplementation.appendChild(duedate.cloneNode(true)));
        XML.findElementsWithTag(implementationNode, 'assignment').forEach(assignment => clonedHumanTaskImplementation.appendChild(assignment.cloneNode(true)));
        XML.findElementsWithTag(implementationNode, 'parameterMapping').forEach(mapping => clonedHumanTaskImplementation.appendChild(mapping.cloneNode(true)));

        // Now swap the elements in the case tree
        extensionElement.removeChild(implementationNode);
        extensionElement.appendChild(clonedHumanTaskImplementation);
    }
}

exports.CaseDefinition = CaseDefinition;
