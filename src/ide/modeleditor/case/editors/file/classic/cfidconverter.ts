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
        // First create the list of CFIWrappers (is actually a hierarchical structure).
        this.case.caseDefinition.caseFile.children.forEach(child => new CFIWrapper(this, child, undefined));

        const caseName = this.case.caseDefinition.name;
        const topTypeFile = this.repository.createTypeFile('case_' + caseName + '.type', TypeDefinition.createDefinitionSource(caseName));
        console.group("Merging types");
        await topTypeFile.parse();
        this.cfiWrappers.filter(wrapper => wrapper.parent === undefined).forEach(cfi => cfi.mergeInto(topTypeFile.definition));
        console.groupEnd();

        console.group("Converting usage")
        this.case.caseDefinition.caseFile.typeRef = topTypeFile.fileName;
        Util.clearArray(this.case.caseDefinition.caseFile.children);

        this.cfiWrappers.forEach(cfi => cfi.convertUsage());
        console.groupEnd();

        // console.log("top definition: ", topTypeFile.definition)
        // console.log("Type Wrappers: ", this.typeWrappers)

        const newDimensions = XML.prettyPrint(this.case.caseDefinition.dimensions?.toXML());

        const newCase = XML.prettyPrint(this.case.caseDefinition.toXML());


        console.log("Saving conversion")

        await Util.PromiseAllSequential(this.typeWrappers.map(w => w.upload));
        console.log("Uploaded all")
        console.log("Saved types, now saving top type")
        topTypeFile.source = topTypeFile.definition?.toXML();
        await topTypeFile.save();
        if (this.case.editor.dimensionsFile) {
            console.log("Now saving case and dimensions");
            this.case.editor.dimensionsFile.source = newDimensions;
            await this.case.editor.dimensionsFile.save();
            this.case.editor.caseFile.source = newCase;
            await this.case.editor.caseFile.save();
        }
    }
}
