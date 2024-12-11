import XML, { Element } from "../../util/xml";
import CaseDefinition from "../definition/cmmn/casedefinition";
import Tags from "../definition/tags";
import CMMNCompliance from "./cmmncompliance";
import DefinitionDeployment from "./definitiondeployment";
import Definitions from "./definitions";
import TypeDeployment from "./typedeployment";

export default class CaseDeployment extends DefinitionDeployment {
    public caseElement: Element;
    public isRoot: boolean;

    constructor(public definitionsDocument: Definitions, public definition: CaseDefinition) {
        super(definitionsDocument, definition);
        this.caseElement = this.element;
        this.isRoot = definition === definitionsDocument.caseDefinition;

        CMMNCompliance.convert(this.element);

        // CMMN Modeler stores a guid in the case definition for generating IDs for new elements added to the case;
        //  Here, we remove this guid.
        this.element.removeAttribute('guid');
    }

    get caseName(): string {
        return this.definition.name;
    }

    append() {
        super.append();
        // First make sure to load all the human task ref extensions
        this.fillHumanTaskExtensions();
        // Then also load the CaseFileItems inside the CaseFile (if a type is defined).
        if (this.type) {
            this.type.fillCaseFile(this);
        }
        this.fillCaseTeam();
        // Also append the diagram information.
        this.appendDiagramInformation();
    }

    appendDiagramInformation() {
        if (!this.dimensionsTree) return;
        // Just read the shapes from the 'local' diagramElement and copy (or is it move?) them into the 'global' diagramElement
        const localCMMNDiagramElement = this.dimensionsTree.getElementsByTagName(Tags.CMMNDIAGRAM)[0];
        XML.children(localCMMNDiagramElement).forEach(shapeElement => this.definitionsDocument.diagram.appendChild(shapeElement).cloneNode(true));
    }

    get caseFileModel(): Element {
        const caseFileElement = XML.getChildByTagName(this.caseElement, 'caseFileModel');
        if (!caseFileElement) {
            return XML.createChildElement(this.caseElement, 'caseFileModel');
        } else {
            return caseFileElement;
        }
    }

    get dimensions(): DefinitionDeployment | undefined {
        return this.definitionsDocument.getDeploymentModel(this.definition.dimensions);
    }

    get dimensionsTree(): Element | undefined {
        return this.dimensions?.element;
    }

    get type(): TypeDeployment | undefined {
        return this.definitionsDocument.getDeploymentModel(this.definition.caseFile.type);
    }

    updateCaseFileItemReferences(oldId: string, newId: string) {
        const updateCaseReferences = (tagName: string, attributeName: string) =>
            XML.getElementsByTagName(this.element, tagName) // Search for elements with the tagname
                .filter((element: Element) => element.getAttribute(attributeName) === oldId)
                .forEach((element: Element) => element.setAttribute(attributeName, newId));

        const updateDiagramReferences = (tagName: string, attributeName: string) =>
            this.dimensionsTree && XML.getElementsByTagName(this.dimensionsTree, tagName) // Search for elements with the tagname
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

    fillHumanTaskExtensions() {
        XML.getElementsByTagName(this.caseElement, 'humanTask').forEach((task: Element) => this.fillInHumanTask(task));
    }

    fillInHumanTask(humanTaskElement: Element) {
        const taskName = humanTaskElement.getAttribute('name');

        //get <cafienne:implementation> node inside the <humanTask> node
        const extensionElements = XML.getChildrenByTagName(humanTaskElement, 'extensionElements');
        if (extensionElements.length === 0) {
            console.log('Human task ' + taskName + ' does not have a custom implementation');
            return;
        }

        const extensionElement = extensionElements[0];
        const implementationNodes = XML.getChildrenByTagName(extensionElement, 'cafienne:implementation');
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
        const humanTaskDefinition = this.definitionsDocument.getDeploymentModel(ref);
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
            // this.definitionsDocument.loadReference(validatorRef);
        }

        // Now move the parameterMapping children from the case model into the human task
        //  Note: this should first clone the human task into the case model, otherwise we get
        //  all parameter mappings spread across all human tasks ...
        //  Note2: the order below should match the order in the way the case model source is saved as well, so that import is more idempotent
        XML.getElementsByTagName(implementationNode, 'parameterMapping').forEach((mapping: Element) => clonedHumanTaskImplementation.appendChild(mapping.cloneNode(true)));
        XML.getElementsByTagName(implementationNode, 'assignment').forEach((assignment: Element) => clonedHumanTaskImplementation.appendChild(assignment.cloneNode(true)));
        XML.getElementsByTagName(implementationNode, 'duedate').forEach((duedate: Element) => clonedHumanTaskImplementation.appendChild(duedate.cloneNode(true)));

        // Now swap the elements in the case tree
        extensionElement.removeChild(implementationNode);
        extensionElement.appendChild(clonedHumanTaskImplementation);
    }

    fillCaseTeam() {
        XML.getElementsByTagName(this.caseElement, 'caseRoles').forEach((caseRoles: Element) => this.fillInCaseRoles(caseRoles));
    }

    fillInCaseRoles(caseRoles: Element) {
        //get content from caseTeam model with name 'caseTeamRef'
        const caseTeamRef = caseRoles.getAttribute("caseTeamRef");
        if (caseTeamRef) {
            const caseTeamDefinition = this.definitionsDocument.getDeploymentModel(caseTeamRef);
            if (caseTeamDefinition === undefined) {
                console.log('Cannot find the case team reference ' + caseTeamRef);
                return;
            }
            caseRoles.setAttribute('cafienne:caseTeamRef', caseTeamRef);
            caseRoles.removeAttribute('caseTeamRef');
            XML.getElementsByTagName(caseTeamDefinition.definition.exportNode, 'role').forEach((role: Element) => caseRoles.appendChild(role.cloneNode(true)));
        }        
    }
}
