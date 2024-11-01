import CaseView from "@ide/modeleditor/case/elements/caseview";
import TypeDefinition from "@repository/definition/type/typedefinition";
import Repository from "@repository/repository";
import Util from "@util/util";
import XML from "@util/xml";
import CFIWrapper from "./cfiwrapper";
import TypeWrapper from "./typewrapper";

export default class CFIDConverter {
    case: CaseView;
    repository: Repository;
    cfiWrappers: CFIWrapper[];
    typeWrappers: TypeWrapper[];
    /**
     * Convert the CaseFileItems and their CaseFileItemDefinitions (.cfid files) to the new type structure for this case.
     * 
     * @param {CaseView} cs 
     */
    constructor(cs: CaseView) {
        this.case = cs;
        this.repository = this.case.editor.ide.repository;
        this.cfiWrappers = /** @type {Array<CFIWrapper>} */ ([]);
        this.typeWrappers = /** @type {Array<TypeWrapper>} */ ([]);
    }

    async convert() {
        // First create an empty type file for the case.
        const caseName = this.case.caseDefinition.file.name;
        const topTypeFile = this.repository.createTypeFile('case_' + caseName + '.type', TypeDefinition.createDefinitionSource('case_' + caseName));
        await topTypeFile.parse();

        // Recursively create the list of CFIWrappers (is actually a hierarchical structure).
        const topWrappers = this.case.caseDefinition.caseFile.children.map(child => new CFIWrapper(this, child, undefined));
        // Now recursively load all of them (this may need to invoke the async parse() method in some of them)
        for (let i = 0; i<topWrappers.length; i++) {
            await topWrappers[i].load();
        }

        // Now recursively merge all wrappers into the new type file for the case
        console.group(`Merging ${topWrappers.length} types into ${topTypeFile.fileName}`);
        topWrappers.forEach(wrapper => wrapper.mergeInto(topTypeFile.definition));
        console.groupEnd();

        // Now upload the new type definitions
        console.groupCollapsed(`Uploading all new and changed type files`);
        for (let i = 0; i < this.typeWrappers.length; i++) {
            await this.typeWrappers[i].upload();
        }
        console.log("Uploaded all used types, now saving top level type definition");
        topTypeFile.source = topTypeFile.definition?.toXML();
        await topTypeFile.save();
        console.groupEnd();

        // Now update all model wide references to old CaseFileItemDef identifiers to become "path" based into the new structure
        console.group("Converting usage of the case file items within other parts of the case (expressions, criteria, etc.)");
        this.case.caseDefinition.caseFile.typeRef = topTypeFile.fileName;
        this.cfiWrappers.forEach(cfi => cfi.convertUsage());
        console.groupEnd();

        // Finally upload the case and the dimensions.
        console.group("Saving modified case and dimensions");
        const newDimensions = this.case.caseDefinition.dimensions?.toXMLString();
        const newCase = this.case.caseDefinition.toXMLString();
        const dimensionsFile = this.case.editor.dimensionsFile;
        const caseFile = this.case.editor.caseFile;
        if (!dimensionsFile) return; // only needed because of typescript ...
        dimensionsFile.source = newDimensions;
        await dimensionsFile.save();
        caseFile.source = newCase;
        await caseFile.save();
        console.groupEnd();
    }
}
