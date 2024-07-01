'use strict';
import ModelEditorRegistry from "./modeleditor/modeleditorregistry";

import ModelDefinition from "@repository/definition/modeldefinition";
import Importer from "@repository/import/importer";
import Repository from "@repository/repository";
import CoverPanel from "./coverpanel";
import IDEFooter from "./idefooter";
import IDEHeader from "./ideheader";
import IDEMain from "./idemain";
import MessageBox from "./messagebox";
import ModelEditor from "./modeleditor/modeleditor";
import ModelEditorMetadata from "./modeleditor/modeleditormetadata";
import RepositoryBrowser from "./repositorybrowser";
import SettingsEditor from "./settings/settingseditor";
import $ from "jquery";

export default class IDE {
    private _editors: Array<ModelEditor> = [];
    repository: Repository;
    html: JQuery<HTMLElement>;
    header: IDEHeader;
    main: IDEMain;
    footer: IDEFooter;
    messageBox: MessageBox;
    coverPanel: CoverPanel;
    settingsEditor: SettingsEditor;
    private _dragging: any;

    static createInstance() {
        ModelEditorRegistry.initialize();

        const ide = new IDE();
    }

    static editorTypes: Array<ModelEditorMetadata> = []

    constructor() {
        this.repository = new Repository();
        this.html = $('body');
        this.header = new IDEHeader(this);
        this.main = new IDEMain(this);
        this.footer = new IDEFooter(this);
        this.messageBox = new MessageBox(this);
        this.coverPanel = new CoverPanel(this); // Helper to show/hide status messages while loading models from the repository
        this.settingsEditor = new SettingsEditor(this);

        // Repository object handles the interaction with the server
        this.html.on('keydown', e => {
            if (e.which == 83 && e.altKey) { // ALT S
                this.settingsEditor.show();
            }
        });

        // Scan for pasted text. It can upload and re-engineer a deployed model into a set of files
        this.html.on('paste', e => this.handlePasteText(e))

        IDE.editorTypes.forEach(type => type.init(this));
    }

    back() {
        // Simplistic. Buggy. But nice and simple for now. Better would be to hash all locations we've been and go back properly
        history.back();
    }

    handlePasteText(e: JQuery.TriggeredEvent) {
        const pastedText = (<any>e).originalEvent.clipboardData.getData('text/plain');
        const importer = new Importer(this.repository, pastedText);
        console.log("Found " + importer.files.length + " files to import")
        if (importer.files.length > 0) {
            const fileNames = importer.files.map(file => file.fileName);
            if (confirm('Press OK to upload the following ' + fileNames.length + ' files\n\n- ' + (fileNames.join('\n- ')))) {
                importer.uploadFiles();
            }
        }
    }

    get repositoryBrowser(): RepositoryBrowser {
        return this.main.repositoryBrowser;
    }

    /** @returns {JQuery<HTMLElement>} The element in which the editors can be added */
    get divModelEditors() {
        return this.main.divModelEditors;
    }

    /** @returns {Array<ModelEditor>} */
    get editors() {
        return this._editors;
    }

    register(editor: ModelEditor) {
        this.editors.push(editor);
    }

    /**
     * @returns Determines if someone is drag/dropping an item across the IDE.
     */
    get dragging(): boolean {
        return this._dragging;
    }

    set dragging(dragging) {
        this._dragging = dragging;
    }

    /**
     * 
     * @returns fileName of the new model
     */
    createNewModel(modelType: string, newModelName: string, newModelDescription: string, callback: Function): string | undefined {
        const editorMetadata = IDE.editorTypes.find(type => type.modelType == modelType);
        if (!editorMetadata) {
            const msg = 'Cannot create new models of type ' + modelType;
            console.error(msg);
            this.danger(msg);
            return;
        }
        return editorMetadata.createNewModel(this, newModelName, newModelDescription, callback);
    }

    openModel(model: ModelDefinition) {
        console.log("Opened model " + model.name)
    }

    /**
     * Determines the type of the file name and opens the corresponding editor.
     */
    open(fileName: string) {
        if (!fileName) {
            // Simply no model to load; but hide all existing editors.
            this.editors.forEach(editor => editor.visible = false);
            this.coverPanel.show('Please, open or create a model.');
            return;
        }

        const serverFile = this.repository.get(fileName);
        if (!serverFile) {
            this.danger(`File ${fileName} does not exist and cannot be opened`, 2000);
            if (this.editors.length === 0) {
                this.coverPanel.show('Please, open or create a model.');
            }
            return;
        }

        const editorMetadata = IDE.editorTypes.find(type => type.supportsFile(serverFile));

        // Check if this file type has a model editor.
        if (!editorMetadata) {
            this.danger(`File type ${serverFile.fileType} has no editor associated with it`, 3000);
            if (this.editors.length === 0) {
                this.coverPanel.show('Please, open or create a model.');
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
        document.title = 'Cafienne IDE - ' + serverFile.name;

        // If we already have an editor for the fileName, no need to go further in the loading logic
        if (existingEditor) {
            return;
        }

        if (serverFile.metadata.error) {
            this.coverPanel.show('Cannot open ' + fileName + '\nError: ' + serverFile.metadata.error);
            return;
        }

        // By default open the cover panel. If the model is present and loads,
        //  the cover panel will be closed.
        this.coverPanel.show('Opening ' + fileName);

        // Now create and load the new editor
        editorMetadata.createEditor(this, serverFile).loadModel();
    }

    /**
     * Shows a green success message.
     * @param message text to be displayed
     * @param delay message is automatically remove after this number of microsec  
     */
    success(message: string, delay = 0) {
        this.messageBox.createMessage(message, 'success', delay);
    }

    /** 
     * Shows a blue info message.
     * @param message text to be displayed
     * @param delay message is automatically remove after this number of microsec  
     */
    info(message: string, delay = 0) {
        this.messageBox.createMessage(message, 'info', delay);
    }

    /** 
     * Shows a yellow warning message.
     * @param message text to be displayed
     * @param delay message is automatically remove after this number of microsec  
     */
    warning(message: string, delay = 0) {
        this.messageBox.createMessage(message, 'warning', delay);
    }

    /** 
     * Shows a red danger message.
     * @param message text to be displayed
     * @param delay message is automatically remove after this number of microsec  
     */
    danger(message: string, delay = 0) {
        this.messageBox.createMessage(message, 'danger', delay);
    }

    /**
     * Registers a type of editor, e.g. HumanTaskEditor, CaseModelEditor, ProcessModelEditor
     */
    static registerEditorType(editorMetadata: ModelEditorMetadata) {
        IDE.editorTypes.push(editorMetadata);
    }
}
