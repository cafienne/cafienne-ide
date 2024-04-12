'use strict';

class IDE {
    /** @type {Array<ModelEditorMetadata>} */
    static editorTypes = []
    constructor() {
        this._editors = [];
    }

    back() {
        // Simplistic. Buggy. But nice and simple for now. Better would be to hash all locations we've been and go back properly
        history.back();
    }

    init() {
        // Repository object handles the interaction with the server
        this.repository = new Repository(this);

        this.html = $('body');

        this.header = new IDEHeader(this);
        this.main = new IDEMain(this);
        this.footer = new IDEFooter(this);
        this.messageBox = new MessageBox(this);

        this.coverPanel = new CoverPanel(this); // Helper to show/hide status messages while loading models from the repository

        this.html.on('keydown', e => {
            if (e.keyCode == 83 && e.altKey) {
                SettingsEditor.show();
            }
        });

        // Scan for pasted text. It can upload and re-engineer a deployed model into a set of files
        this.html.on('paste', e => this.handlePasteText(e))


        IDE.editorTypes.forEach(type => type.init(this));
    }

    /**
     * 
     * @param {JQuery.TriggeredEvent} e 
     */
    handlePasteText(e) {
        const pastedText = e.originalEvent.clipboardData.getData('text/plain');
        new Importer(this).load(pastedText);
    }

    /**
     * @returns {RepositoryBrowser}
     */
    get repositoryBrowser() {
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

    /**
     * @param {ModelEditor} editor 
     */
    register(editor) {
        this.editors.push(editor);
    }

    /**
     * @returns {CaseModelEditor}
     */
    get caseModelEditor() {
        return /** @type {CaseModelEditor} */ (this.editors.find(editor => editor instanceof CaseModelEditor));
    }

    /**
     * @returns {Boolean} Determines if someone is drag/dropping an item across the IDE.
     */
    get dragging() {
        return this._dragging;
    }

    set dragging(dragging) {
        this._dragging = dragging;
    }

    /**
     * 
     * @param {String} modelType 
     * @param {String} newModelName 
     * @param {String} newModelDescription 
     * @param {Function} callback 
     * @returns {String} fileName of the new model
     */
    createNewModel(modelType, newModelName, newModelDescription, callback) {
        const editorMetadata = IDE.editorTypes.find(type => type.modelType == modelType);
        if (!editorMetadata) {
            const msg = 'Cannot create new models of type ' + modelType;
            console.error(msg);
            this.danger(msg);
            return;
        }
        return editorMetadata.createNewModel(this, newModelName, newModelDescription, callback);
    }

    /**
     * 
     * @param {ModelDefinition} model 
     */
    openModel(model) {
        console.log("Opened model " + model.name)
    }

    /**
     * Determines the type of the file name and opens the corresponding editor.
     * @param {String} fileName 
     */
    open(fileName) {
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

        // Check if this file type has a model editor.
        if (!serverFile.hasModelEditor) {
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
        const showableEditor = this.editors.find(editor => editor.fileName == fileName);
        this.editors.forEach(editor => editor.visible = (editor === showableEditor));
        if (showableEditor) showableEditor.visible = true;

        //show model name on browser tab
        document.title = 'Cafienne IDE - ' + serverFile.name;

        // If we already have an editor for the fileName, no need to go further in the loading logic
        const existingEditor = this.editors.find(editor => editor.fileName == fileName);
        if (existingEditor) {
            return;
        }

        // By default open the cover panel. If the model is present and loads,
        //  the cover panel will be closed.
        this.coverPanel.show('Opening ' + fileName);

        // Now create and load the new editor
        serverFile.loadEditor();
    }

    /**
     * Shows a green success message.
     * @param {String} message     : text to be displayed
     * @param {Number} delay       : message is automatically remove after this number of microsec  
     */
    success(message, delay = 0) {
        this.messageBox.createMessage(message, 'success', delay);
    }

    /** 
     * Shows a blue info message.
     * @param {String} message     : text to be displayed
     * @param {Number} delay       : message is automatically remove after this number of microsec  
     */
    info(message, delay = 0) {
        this.messageBox.createMessage(message, 'info', delay);
    }

    /** 
     * Shows a yellow warning message.
     * @param {String} message     : text to be displayed
     * @param {Number} delay       : message is automatically remove after this number of microsec  
     */
    warning(message, delay = 0) {
        this.messageBox.createMessage(message, 'warning', delay);
    }

    /** 
     * Shows a red danger message.
     * @param {String} message     : text to be displayed
     * @param {Number} delay       : message is automatically remove after this number of microsec  
     */
    danger(message, delay = 0) {
        this.messageBox.createMessage(message, 'danger', delay);
    }

    /**
     * Registers a type of editor, e.g. HumanTaskEditor, CaseModelEditor, ProcessModelEditor
     * @param {ModelEditorMetadata} editorMetadata 
     */
    static registerEditorType(editorMetadata) {
        IDE.editorTypes.push(editorMetadata);
    }
}
