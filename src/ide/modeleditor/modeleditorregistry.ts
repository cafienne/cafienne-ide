import ServerFile from "../../repository/serverfile/serverfile";
import IDE from "../ide";
import CaseModelEditor from "./case/casemodeleditor";
import HumantaskModelEditor from "./humantask/humantaskmodeleditor";
import ModelEditor from "./modeleditor";
import ModelEditorMetadata from "./modeleditormetadata";
import ProcessModelEditor from "./process/processmodeleditor";
import TypeModelEditor from "./type/typemodeleditor";

export default class ModelEditorRegistry {
    editors: Array<ModelEditor> = [];

    constructor(public ide: IDE) {
        this.ide = ide;

        // Register the known editors, e.g. HumanTaskEditor, CaseModelEditor, ProcessModelEditor
        CaseModelEditor.register();
        HumantaskModelEditor.register();
        ProcessModelEditor.register();
        TypeModelEditor.register();
    }

    add(editor: ModelEditor) {
        this.editors.push(editor);
    }

    /**
     * Return the editor that renders the file, or undefined if that editor is not found.
     * Casts the return value to the given type for ease of use
     * @param file 
     * @returns 
     */
    get<EditorT extends ModelEditor>(file: ServerFile): EditorT | undefined {
        return <EditorT>this.editors.find(editor => editor.file.fileName === file.fileName);
    }

    /** 
     * Returns the editor that is currently active, if any
     */
    get currentEditor(): ModelEditor | undefined {
        return this.editors.find(editor => editor.visible);
    }

    /**
     * Determines the type of the file name and opens the corresponding editor.
     */
    open(fileName: string) {
        if (!fileName) {
            // Simply no model to load; but hide all existing editors.
            this.editors.forEach(editor => editor.visible = false);
            this.ide.coverPanel.show('Please, open or create a model.');
            return;
        }

        const serverFile = this.ide.repository.get(fileName);
        if (!serverFile) {
            this.ide.danger(`File ${fileName} does not exist and cannot be opened`, 2000);
            if (this.editors.length === 0) {
                this.ide.coverPanel.show('Please, open or create a model.');
            }
            return;
        }

        const editorMetadata = ModelEditorMetadata.types.find(type => type.supportsFile(serverFile));

        // Check if this file type has a model editor.
        if (!editorMetadata) {
            this.ide.danger(`File type ${serverFile.fileType} has no editor associated with it`, 3000);
            if (this.editors.length === 0) {
                this.ide.coverPanel.show('Please, open or create a model.');
            }
            return;
        }

        // In case of subsequent loadings, we have to close the console group of the previous one
        console.groupEnd();
        console.group(fileName);

        // Show the editor with the fileName (if available), hide all the ones with a different fileName
        const existingEditor = this.editors.find(editor => editor.fileName == fileName);
        this.editors.forEach(editor => editor.visible = (editor === existingEditor));
        if (existingEditor) existingEditor.visible = true;

        //show model name on browser tab
        document.title = 'Dynamic Case Management - ' + serverFile.name;

        // If we already have an editor for the fileName, no need to go further in the loading logic
        if (existingEditor) {
            return;
        }

        if (serverFile.metadata.error) {
            this.ide.coverPanel.show('Cannot open ' + fileName + '\nError: ' + serverFile.metadata.error);
            return;
        }

        // By default open the cover panel. If the model is present and loads,
        //  the cover panel will be closed.
        this.ide.coverPanel.show('Opening ' + fileName);

        // Now create and load the new editor
        editorMetadata.createEditor(this.ide, serverFile).loadModel();
    }

    remove(fileName: string) {
        this.editors.filter(editor => editor.fileName === fileName).forEach(editor => editor.destroy());
    }
}
