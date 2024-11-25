import Tags from "./tags";
import Extensions from "../store/extensions";
import Store from "../store/store";
import { XML } from "../util/xml";
import CaseDefinition from "./case";
import Definition from "./definition";
import TypeDefinition from "./typedefinition";

/**
 * Helper class to assemble a definitions XML for a case with it's dependencies
 */
export default class Definitions {
    public rootCaseName: string;
    
    // Storage of errors that are encountered while creating the definitions document;
    //  typically these are missing files that are referenced
    public errors: Array<string> = [];
    // XML element that will hold the final XML
    public definitionsElement: Element = XML.loadXMLElement('<definitions xmlns="http://www.omg.org/spec/CMMN/20151109/MODEL" xmlns:cafienne="org.cafienne" />');
    // The diagram element can be used by cases to append their diagram information. 
    //  The element itself is only added as last item to the definitionsElement tree.
    public diagram = this.definitionsElement.ownerDocument.createElement(Tags.CMMNDIAGRAM);

    public rootCase: CaseDefinition;
    public definitions: Array<Definition> = [];

    /**
     * 
     * @param {String} rootCaseFileName 
     * @param {Store} store 
     */
    constructor(public rootCaseFileName: string, public store: Store) {
        this.rootCaseName = rootCaseFileName.substring(0, rootCaseFileName.length - 5);

        // Creating the new CaseDefinition will validate and load all references
        this.rootCase = new CaseDefinition(this.rootCaseFileName, this);
    }

    /**
     * @returns {String} The fileName into which this case definition with all it's contents is stored.
     */
    get deployFileName() {
        return this.rootCaseName + Extensions.DEFINITIONS;
    }

    /**
     * Adds a case to the list of loaded cases (by it's identifier)
     * @param {*} caseDefinition
     */
    addCase(caseDefinition: CaseDefinition): CaseDefinition {
        return this.addDefinition(caseDefinition);
    }

    addDefinition<D extends Definition>(definition: D): D {
        if (this.definitions.indexOf(definition) < 0) {
            this.definitions.push(definition);
        }
        return definition;
    }

    get cases() {
        return this.definitions.filter(definition => definition.fileName.endsWith(Extensions.CASE));
    }

    get processes() {
        return this.definitions.filter(definition => definition.fileName.endsWith(Extensions.PROCESS));
    }

    get humanTasks() {
        return this.definitions.filter(definition => definition.fileName.endsWith(Extensions.HUMANTASK));
    }

    get caseFileDefinitions() {
        return this.definitions.filter(definition => definition.fileName.endsWith(Extensions.CFID));
    }

    get types(): Array<TypeDefinition> {
        return this.definitions.filter(definition => definition.fileName.endsWith(Extensions.TYPE)) as Array<TypeDefinition>;
    }

    /**
     * Loads the references from disk, and parses them to a Definition structure
     * @param refs 
     */
    loadReferences(refs: Array<string>) {
        refs.forEach(ref => this.loadReference(ref));
    }

    loadReference(ref: string) {
        const creator = (ref: string) => {
            if (ref.endsWith(Extensions.CASE)) {
                return new CaseDefinition(ref, this);
            }
            if (ref.endsWith(Extensions.TYPE)) {
                return new TypeDefinition(ref, this);
            }
            return new Definition(ref, this);
        }

        if (ref === undefined) {
            // Ignore empty elements (e.g. a HumanTask need not per se have a reference)
            return;
        }
        if (this.definitions.find(definition => definition.fileName === ref)) {
            // Ignore elements that are already loaded
            return;
        }

        // Now try and load the reference; if not found, report an error
        try {
            creator(ref);
        } catch (err) {
            console.log('Could not load reference ' + ref);
            this.errors.push('Failure while loading reference ' + ref);
        }
    }

    hasErrors() {
        return this.errors.length > 0;
    }

    getErrors() {
        return this.errors;
    }

    /**
     * Returns the contents of the file that can be deployed
     * @returns {String}
     */
    get deployContents() {
        if (this.hasErrors()) {
            throw this.errors;
        }

        // CMMN.XSD compliant ordering: 
        // first case file definitions, 
        this.caseFileDefinitions.forEach(definition => definition.append());
        this.types.forEach(definition => definition.append());
        // ... then cases ...
        this.cases.forEach(definition => definition.append());
        // ... then processes ... 
        this.processes.forEach(definition => definition.append());
        // ... and finally add the diagram element
        const cmmnDiElement = this.definitionsElement.ownerDocument.createElement(Tags.CMMNDI);
        cmmnDiElement.appendChild(this.diagram);
        this.definitionsElement.appendChild(cmmnDiElement);
        return XML.printNiceXML(this.definitionsElement);
    }
}

exports.Definitions = Definitions;
