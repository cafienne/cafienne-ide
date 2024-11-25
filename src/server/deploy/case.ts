import Extensions from "../store/extensions";
import { XML } from "../util/xml";
import CMMNCompliance from "./cmmncompliance";
import Definition from "./definition";
import Definitions from "./definitions";
import Tags from "./tags";
import TypeDefinition from "./typedefinition";

export default class CaseDefinition extends Definition {
    public caseName: string;
    public caseElement: Element;
    public dimensionsTree: Element;
    public caseFileModel: Element;
    public typeRef: string | null;

    constructor(public fileName: string, public definitionsDocument: Definitions) {
        super(fileName, definitionsDocument);
        this.caseName = this.fileName.substring(0, this.fileName.length - 5);
        this.caseElement = this.element;
        CMMNCompliance.convert(this.caseElement);

        // CMMN Modeler stores a guid in the case definition for generating IDs for new elements added to the case;
        //  Here, we remove this guid.
        this.caseElement.removeAttribute('guid');

        // Add case file definition references
        const caseFileDefinitionRefs = this.findReferences('caseFileItem', 'definitionRef');
        definitionsDocument.loadReferences(caseFileDefinitionRefs);

        // Add type file definitions references
        const caseFileElement = XML.findElement(this.caseElement, 'caseFileModel');
        if (!caseFileElement) {
            this.caseFileModel = this.caseElement.ownerDocument.createElement('caseFileModel');
            this.caseElement.appendChild(this.caseFileModel);
        } else {
            this.caseFileModel = caseFileElement;
        }

        const typeRefs = this.findReferences('caseFileModel', 'typeRef'); // There will be zeroOrOne typeRef in a CaseDefinition
        this.typeRef = typeRefs.length === 1 ? typeRefs[0] : null;
        definitionsDocument.loadReferences(typeRefs); // There can be more nested refences to other types;

        // Find out the process that this case refers to and add them to the definitions document
        const processRefs = this.findReferences('processTask', 'processRef');
        definitionsDocument.loadReferences(processRefs);

        // Add task references
        const humanTaskRefs = this.findReferences('cafienne:implementation', 'humanTaskRef');
        definitionsDocument.loadReferences(humanTaskRefs);

        // Now load and parse the accompanying dimensions file with the CMMN DI format
        const dimensionsContent = this.store.load(this.caseName + Extensions.DIMENSIONS);
        this.dimensionsTree = XML.loadXMLElement(dimensionsContent);

        // ... and finally add the sub cases
        const caseRefs = this.findReferences('caseTask', 'caseRef');
        definitionsDocument.loadReferences(caseRefs);
    }

    get hasTypeRef(): boolean {
        return this.caseFileModel !== null && this.caseFileModel.getAttribute('typeRef') !== null;
    }

    get type(): TypeDefinition | undefined {
        return this.definitionsDocument.types.find(type => type.fileName === this.typeRef);
    }

    updateCaseFileItemReferences(oldId: string, newId: string) {
        const updateCaseReferences = (tagName: string, attributeName: string) =>
            XML.findElementsWithTag(this.element, tagName) // Search for elements with the tagname
                .filter((element: Element) => element.getAttribute(attributeName) === oldId)
                .forEach((element: Element) => element.setAttribute(attributeName, newId));

        const updateDiagramReferences = (tagName: string, attributeName: string) =>
            XML.findElementsWithTag(this.dimensionsTree, tagName) // Search for elements with the tagname
                .filter((element: Element) => element.getAttribute(attributeName) === oldId)
                .forEach((element: Element) => element.setAttribute(attributeName, newId));

        updateCaseReferences('repetitionRule', 'contextRef');
        updateCaseReferences('requiredRule', 'contextRef');
        updateCaseReferences('manualActivationRule', 'contextRef');
        updateCaseReferences('applicabilityRule', 'contextRef');
        updateCaseReferences('ifPart', 'contextRef');
        updateCaseReferences('caseFileItemOnPart', 'sourceRef');
        updateCaseReferences('input', 'bindingRef');
        updateCaseReferences('output', 'bindingRef');
        updateCaseReferences('inputs', 'bindingRef');
        updateCaseReferences('outputs', 'bindingRef');
        updateDiagramReferences('CMMNEdge', 'sourceCMMNElementRef');
        updateDiagramReferences('CMMNEdge', 'targetCMMNElementRef');
        updateDiagramReferences('CMMNShape', 'cmmnElementRef');
    }

    append() {
        super.append();
        // First make sure to load all the human task ref extensions
        this.fillHumanTaskExtensions();
        // Then also load the CaseFileItems inside the CaseFile (if a type is defined).
        if (this.type) {
            this.type.fillCaseFile(this);
        }
        // Also append the diagram information.
        this.appendDiagramInformation();
    }

    appendDiagramInformation() {
        // Just read the shapes from the 'local' diagramElement and copy (or is it move?) them into the 'global' diagramElement
        const localCMMNDiagramElement = this.dimensionsTree.getElementsByTagName(Tags.CMMNDIAGRAM)[0];
        const shapeElements = localCMMNDiagramElement.childNodes;
        for (let i = 0; i < shapeElements.length; i++) {
            const shapeElement = shapeElements[i].cloneNode(true);
            this.definitionsDocument.diagram.appendChild(shapeElement);
        }
    }

    fillHumanTaskExtensions() {
        XML.findElementsWithTag(this.caseElement, 'humanTask').forEach((task: Element) => this.fillInHumanTask(task));
    }

    fillInHumanTask(humanTaskElement: Element) {
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
            // console.log('Human task ' + taskName + ' does not have a custom implementation');
            return;
        }

        const implementationNode = implementationNodes[0];
        const ref = implementationNode.getAttribute('humanTaskRef');
        if (ref === null || ref === '') {
            // console.log('Human task ' + taskName + ' does not have a reference to a custom implementation');
            return;
        }

        //get content from humantask model with name 'ref'
        const humanTaskDefinition = this.definitionsDocument.humanTasks.find(task => task.fileName === ref);
        if (humanTaskDefinition === undefined) {
            console.log('Cannot find the human task reference ' + ref);
            return;
        }

        //locate <cafienne:implementation> node in the humantask model (external file)
        const humanTaskImplementationNodes = humanTaskDefinition.element.getElementsByTagName('cafienne:implementation');
        if (humanTaskImplementationNodes.length == 0) {
            console.log('The human task ' + ref + ' does not contain a cafienne:implementation node');
            return;
        }

        // Now clone the task implementation, so that it can be re-used across multiple tasks
        const humanTaskImplementation = humanTaskImplementationNodes[0];
        const clonedHumanTaskImplementation = humanTaskImplementation.cloneNode(true) as Element;
        // Keep the reference for sake of reverse engineering a deployed model
        clonedHumanTaskImplementation.setAttribute('humanTaskRef', ref);

        const validatorRef = implementationNode.getAttribute('validatorRef');
        if (validatorRef) {
            clonedHumanTaskImplementation.setAttribute('validatorRef', validatorRef);
            this.definitionsDocument.loadReference(validatorRef);
        }

        // Now move the parameterMapping children from the case model into the human task
        //  Note: this should first clone the human task into the case model, otherwise we get
        //  all parameter mappings spread across all human tasks ...
        //  Note2: the order below should match the order in the way the case model source is saved as well, so that import is more idempotent
        XML.findElementsWithTag(implementationNode, 'parameterMapping').forEach((mapping: Element) => clonedHumanTaskImplementation.appendChild(mapping.cloneNode(true)));
        XML.findElementsWithTag(implementationNode, 'assignment').forEach((assignment: Element) => clonedHumanTaskImplementation.appendChild(assignment.cloneNode(true)));
        XML.findElementsWithTag(implementationNode, 'duedate').forEach((duedate: Element) => clonedHumanTaskImplementation.appendChild(duedate.cloneNode(true)));

        // Now swap the elements in the case tree
        extensionElement.removeChild(implementationNode);
        extensionElement.appendChild(clonedHumanTaskImplementation);
    }
}

exports.CaseDefinition = CaseDefinition;
