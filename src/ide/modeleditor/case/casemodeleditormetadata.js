import IDE from "@ide/ide";
import Tags from "@repository/definition/dimensions/tags";
import CaseFile from "@repository/serverfile/casefile";
import Icons from "@util/images/icons";
import Util from "@util/util";
import ModelEditorMetadata from "../modeleditormetadata";
import CaseModelEditor from "./casemodeleditor";
import Grid from "./grid";

export default class CaseModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<CaseFile>} */
    get modelList() {
        return this.ide.repository.getCases();
    }

    supportsFile(file) {
        return file instanceof CaseFile;
    }

    createEditor(ide, file) {
        return new CaseModelEditor(ide, file);
    }

    get supportsDeploy() {
        return true;
    }

    get modelType() {
        return 'case';
    }

    get icon() {
        return Icons.CaseTask;
    }

    get description() {
        return 'Cases';
    }

    /**
     * Creates a new case model
     * @param {IDE} ide
     * @param {String} name The user entered case name
     * @param {String} description The description given by the user (can be empty)
     * @returns {Promise<String>} fileName of the new model
     */
    async createNewModel(ide, name, description) {
        // By default we create a case plan that fills the whole canvas size;
        //  We position it left and top at 2 times the grid size, with a minimum of 10px;
        //  Width and height have to be adjusted for scrollbar size.
        const margin = 2 * Grid.Size;
        const scrollbar = 40;
        const x = 20;//margin;
        const y = 20;//margin;
        const width = 800;//ide.caseModelEditor && ide.caseModelEditor.case ? ide.caseModelEditor.case.canvas.width() - (margin + scrollbar) : 800;
        const height = 500;//ide.caseModelEditor && ide.caseModelEditor.case ? ide.caseModelEditor.case.canvas.height() - (margin + scrollbar) : 500;

        const caseFileName = name + '.case';
        const dimensionsFileName = name + '.dimensions';
        const guid = Util.createID();

        const casePlanId = `cm_${guid}_0`;
        const documentation = description ? `<documentation textFormation="text/plain"><text><![CDATA[${description}]]></text></documentation>` : '';
        const caseString = 
`<case id="${caseFileName}" name="${name}" guid="${guid}">
    ${documentation}
    <caseFileModel/>
    <casePlanModel id="${casePlanId}" name="${name}"/>
</case>`;

        const dimensionsString = 
`<${Tags.CMMNDI}>
    <${Tags.CMMNDIAGRAM}>
        <${Tags.CMMNSHAPE} ${Tags.CMMNELEMENTREF}="${casePlanId}" name="${name}">
            <${Tags.BOUNDS} x="${x}" y="${y}" width="${width}" height="${height}" />                    
        </${Tags.CMMNSHAPE}>
    </${Tags.CMMNDIAGRAM}>
    <validation>
        <hiddennotices />
        <hiddenproblems />
    </validation>
</${Tags.CMMNDI}>`;

        // Upload models to server, and call back
        const caseFile = this.ide.repository.createCaseFile(caseFileName, caseString);
        const dimensionsFile = this.ide.repository.createDimensionsFile(dimensionsFileName, dimensionsString);

        // First save dimensions, then save the case, and then parse the case (which will load the dimensions)
        await dimensionsFile.save();
        await caseFile.save();
        await caseFile.parse();
        return caseFileName;
    }
}
