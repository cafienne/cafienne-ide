import CaseFileDefinitionDefinition from "@repository/definition/cfid/casefileitemdefinitiondefinition";
import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import ModelDefinition from "@repository/definition/modeldefinition";
import ProcessModelDefinition from "@repository/definition/process/processmodeldefinition";
import TypeDefinition from "@repository/definition/type/typedefinition";
import XML from "@util/xml";
import DefinitionDeployment from "./definitiondeployment";
import Tags from "./tags";
import DeploymentFactory from "./deploymentfactory";

export default class Definitions {

    // Storage of errors that are encountered while creating the definitions document;
    //  typically these are missing files that are referenced
    public errors: Array<string> = [];
    // XML element that will hold the final XML
    public definitionsElement: Element = XML.loadXMLString('<definitions xmlns="http://www.omg.org/spec/CMMN/20151109/MODEL" xmlns:cafienne="org.cafienne" />').documentElement;

    // The diagram element can be used by cases to append their diagram information. 
    //  The element itself is only added as last item to the definitionsElement tree.
    public diagram = XML.createChildElement(this.definitionsElement, Tags.CMMNDIAGRAM);

    public definitions: Array<DefinitionDeployment> = [];

    get rootCaseName(): string {
        return this.caseDefinition.name;
    }

    get fileName(): string {
        return this.rootCaseName + '.xml';
    }

    constructor(public caseDefinition: CaseDefinition) {
        console.groupCollapsed(`Creating deployment '${this.fileName}'`);
        this.addDefinition(caseDefinition);
        console.groupEnd();
    }

    addDefinition(definition: ModelDefinition | undefined) {
        if (!definition) return;
        const deployer = this.definitions.find(deployer => deployer.definition === definition);
        if (!deployer) { // Only create a new one if it is not yet registered
            console.log("Creating deploy definition for " + definition.file.fileName)
            DeploymentFactory.create(this, definition);
        }
    }

    /**
     * Return a deployer based on either matching ModelDefinition or matching fileName
     * @param identifier 
     * @returns 
     */
    getDeploymentModel<D extends DefinitionDeployment>(identifier: ModelDefinition | string | undefined): D | undefined {
        // Get a deployment model either through definition comparison or same file name
        return <D>this.definitions.find(deployer => deployer.definition === identifier || deployer.fileName === identifier);
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getErrors() {
        return this.errors;
    }

    contents() {
        if (this.hasErrors()) {
            throw this.errors;
        }

        // CMMN.XSD compliant ordering: 
        // first case file definitions, 
        this.definitions.filter(d => d.definition instanceof CaseFileDefinitionDefinition).forEach(definition => definition.append());
        this.definitions.filter(d => d.definition instanceof TypeDefinition).forEach(definition => definition.append());
        // ... then cases ...
        this.definitions.filter(d => d.definition instanceof CaseDefinition).forEach(definition => definition.append());
        // ... then processes ... 
        this.definitions.filter(d => d.definition instanceof ProcessModelDefinition).forEach(definition => definition.append());
        // ... and finally add the diagram element
        const cmmnDiElement = XML.createChildElement(this.definitionsElement, Tags.CMMNDI);
        cmmnDiElement.appendChild(this.diagram);
        this.definitionsElement.appendChild(cmmnDiElement);
        return XML.prettyPrint(this.definitionsElement);
    }
}
