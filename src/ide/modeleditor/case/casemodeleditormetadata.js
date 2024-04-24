import IDE from "@ide/ide";
import Tags from "@repository/definition/dimensions/tags";
import CaseFile from "@repository/serverfile/casefile";
import Icons from "@util/images/icons";
import Util from "@util/util";
import ModelEditorMetadata from "../modeleditormetadata";
import CaseModelEditor from "./casemodeleditor";
import CreateNewCaseModelDialog from "./createnewcasemodeldialog";
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

    openCreateModelDialog() {
        const filetype = this.modelType;
        const text = `Create a new ${this.toString()}`;
        const dialog = new CreateNewCaseModelDialog(this.ide, text);
        dialog.showModalDialog((newModelInfo) => {
            if (newModelInfo) {
                const newModelName = newModelInfo.name;
                const newModelDescription = newModelInfo.description;
                /** @type {string} */
                const newTypeRef = newModelInfo.typeRef;

                //check if a valid name is used
                if (!this.ide.repositoryBrowser.isValidEntryName(newModelName)) {
                    return;
                }

                const fileName = newModelName + '.' + filetype;

                if (this.ide.repository.isExistingModel(fileName)) {
                    this.ide.danger('A ' + filetype + ' with this name already exists and cannot be overwritten', 5000);
                    return;
                }

                // If a type is selected, and it does not yet exist, then first create the type file, and only then create the case model.
                if (newTypeRef && newTypeRef.endsWith('.type') && !this.ide.repository.isExistingModel(newTypeRef)) {
                    const typeModelEditorMetadata = ModelEditorMetadata.types.find(type => type.modelType === 'type');
                    if (typeModelEditorMetadata) {
                        const newTypeModelName = newTypeRef.slice(0, newTypeRef.length - 5);
                        typeModelEditorMetadata.createNewModel(this.ide, newTypeModelName, newModelDescription).then(typeFileName => {
                            this.createNewCaseModelWithTypeRef(this.ide, newModelName, newModelDescription, typeFileName).then(() => {
                                window.location.hash = fileName;
                            });
                        });
                    }
                } else {
                    // Simply create the case file, either with an empty or with an existing type definition.
                    this.createNewCaseModelWithTypeRef(this.ide, newModelName, newModelDescription, newTypeRef).then(() => {
                        window.location.hash = fileName;
                    });
                }
            };
        });
    }

    /**
     * Creates a new case model
     * @param {IDE} ide
     * @param {String} name The user entered case name
     * @param {String} description The description given by the user (can be empty)
     * @returns {Promise<String>} fileName of the new model
     */
    async createNewModel(ide, name, description) {
        return this.createNewCaseModelWithTypeRef(ide, name, description, '');
    }

    /**
     * Creates a new case model
     * @param {IDE} ide
     * @param {String} name The user entered case name
     * @param {String} description The description given by the user (can be empty)
     * @param {String} typeRef The typeRef given by the user (can be empty)
     * @returns {Promise<String>} fileName of the new model
     */
    async createNewCaseModelWithTypeRef(ide, name, description, typeRef = '') {
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

        // Upload models to server, and call back
        const caseFile = this.ide.repository.createCaseFile(caseFileName, caseString);
        const dimensionsFile = this.ide.repository.createDimensionsFile(dimensionsFileName, dimensionsString);
        return dimensionsFile.save().then(() => caseFile.save()).then(() => caseFile.parse()).then(() => caseFileName);
    }
}
