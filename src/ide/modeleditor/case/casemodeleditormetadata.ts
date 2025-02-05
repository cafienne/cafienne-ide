import IDE from "../../ide";
import Tags from "../../../repository/definition/dimensions/tags";
import ModelDefinition from "../../../repository/definition/modeldefinition";
import TypeDefinition from "../../../repository/definition/type/typedefinition";
import CaseFile from "../../../repository/serverfile/casefile";
import ServerFile from "../../../repository/serverfile/serverfile";
import Icons from "../../../util/images/icons";
import Util from "../../../util/util";
import ModelEditorMetadata from "../modeleditormetadata";
import CaseModelEditor from "./casemodeleditor";
import CreateNewCaseModelDialog from "./createnewcasemodeldialog";
import Grid from "./grid";

export default class CaseModelEditorMetadata extends ModelEditorMetadata {
    get modelList() {
        return this.ide?.repository.getCases() || [];
    }

    supportsFile(file: ServerFile<ModelDefinition>) {
        return file instanceof CaseFile;
    }

    createEditor(ide: IDE, file: CaseFile) {
        return new CaseModelEditor(ide, file);
    }

    get supportsDeploy() {
        return true;
    }

    get fileType() {
        return 'case';
    }

    get icon() {
        return Icons.CaseTask;
    }

    get description() {
        return 'Cases';
    }

    async openCreateModelDialog() {
        if (!this.ide) return;
        const filetype = this.fileType;
        const text = `Create a new ${this.toString()}`;
        const dialog = new CreateNewCaseModelDialog(this.ide, text);
        dialog.showModalDialog(async (newModelInfo: any) => {
            if (!this.ide) return;

            if (newModelInfo) {
                console.groupCollapsed(`Creating new case ${newModelInfo.name}.case`);
                const newModelName = newModelInfo.name;
                const newModelDescription = newModelInfo.description;
                const newTypeRef = newModelInfo.typeRef;

                //check if a valid name is used
                if (!this.ide.repositoryBrowser.isValidEntryName(newModelName)) {
                    return;
                }

                const fileName = newModelName + '.' + filetype;

                if (this.ide.repository.hasFile(fileName)) {
                    this.ide.danger('A ' + filetype + ' with this name already exists and cannot be overwritten', 5000);
                    return;
                }

                // Simply create the case file, either with an empty or with an existing type definition.
                await this.createNewCaseModelWithTypeRef(this.ide, newModelName, newModelDescription, newTypeRef);
                window.location.hash = fileName;
                console.groupEnd();
            };
        });
    }

    /**
     * Creates a new case model
     */
    async createNewModel(ide: IDE, name: string, description: string) {
        return this.createNewCaseModelWithTypeRef(ide, name, description, '');
    }

    /**
     * Creates a new case model
     */
    async createNewCaseModelWithTypeRef(ide: IDE, name: string, description: string, typeRef = '') {
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
    <caseFileModel typeRef="${typeRef}"/>
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

        // Optionally create a new type file
        const typeFile = typeRef && typeRef.endsWith('.type') && !ide.repository.hasFile(typeRef) ? ide.repository.createTypeFile(typeRef, TypeDefinition.createDefinitionSource(name)) : undefined;
        // Create dimensions and case files
        const dimensionsFile = ide.repository.createDimensionsFile(dimensionsFileName, dimensionsString);
        const caseFile = ide.repository.createCaseFile(caseFileName, caseString);

        // Upload the new files to the server, in this particular order
        if (typeFile) await typeFile.save();
        await dimensionsFile.save();
        await caseFile.save();
        return caseFileName;
    }
}
