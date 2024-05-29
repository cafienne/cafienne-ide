import CaseView from "@ide/modeleditor/case/elements/caseview";
import CFIWrapper from "./cfiwrapper";
import TypeWrapper from "./typewrapper";
import TypeDefinition from "@repository/definition/type/typedefinition";

export default class CFIDConverter {
    /**
     * Convert the CaseFileItems and their CaseFileItemDefinitions (.cfid files) to the new type structure for this case.
     * 
     * @param {CaseView} cs 
     */
    constructor(cs) {
        this.case = cs;
        this.repository = this.case.editor.ide.repository;
        this.cfiWrappers = /** @type {Array<CFIWrapper>} */ ([]);
        this.typeWrappers = /** @type {Array<TypeWrapper>} */ ([]);
    }

    convert(next = Followup.None) {
        // First create the list of CFIWrappers (is actually a hierarchical structure).
        this.case.caseDefinition.getCaseFile().children.forEach(child => new CFIWrapper(this, child, undefined));

        const caseName = this.case.caseDefinition.name;
        const topTypeFile = this.repository.createTypeFile('case_' + caseName + '.type', TypeDefinition.createDefinitionSource(caseName));
        console.group("Merging types")
        topTypeFile.parse(andThen(file => this.cfiWrappers.filter(wrapper => wrapper.parent === undefined).forEach(cfi => cfi.mergeInto(file.definition))));
        console.groupEnd();



        console.group("Converting usage")
        this.case.caseDefinition.caseFile.typeRef = topTypeFile.fileName;
        Util.clearArray(this.case.caseDefinition.caseFile.children);

        this.cfiWrappers.forEach(cfi => cfi.convertUsage());
        console.groupEnd();

        console.log("top definition: ", topTypeFile.definition)
        console.log("Type Wrappers: ", this.typeWrappers)

        const newDimensions = XML.prettyPrint(this.case.caseDefinition.dimensions.toXML());

        const newCase = XML.prettyPrint(this.case.caseDefinition.toXML());


        const list = new FollowupList(andThen(() => {
            console.log("Saved types, now saving top type")
            topTypeFile.source = topTypeFile.definition.toXML();
            topTypeFile.save(andThen(() => {
                console.log("Now saving case and dimensions");
                this.case.editor.dimensionsFile.source = newDimensions;
                this.case.editor.dimensionsFile.save(andThen(() => {
                    this.case.editor.caseFile.source = newCase;
                    this.case.editor.caseFile.save(next);
                }));

            }))
        }));
        this.typeWrappers.forEach(w => list.add(c => w.upload(c)));
        console.log("Saving conversion")
        list.run();
    }
}
