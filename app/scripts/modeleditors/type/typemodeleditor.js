'use strict';

class TypeModelEditor extends ModelEditor {
    /**
     * This editor handles type models; only validates the xml
     * @param {TypeFile} file The ServerFile to be loaded. E.g. 'customer.type', 'order.type'
     */

    constructor(file) {
        super(file);
        this.typeEditor = new TypeEditor(this.ide, file, this.htmlContainer);
    }

    get label() {
        return 'Edit Type - ' + this.fileName;
    }

    onEscapeKey(e) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }
        this.close();
    }

    loadModel() {
        this.typeEditor.loadModel();
    }
}

class TypeModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getTypes();
    }

    get modelType() {
        return 'type';
    }

    /** @returns {Function} */
    get shapeType() {
        return CaseFileItem;
    }

    get description() {
        return 'Types';
    }

    /**
     * Create a new CaseFileItem model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @param {Function} callback
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, name, description, callback = (/** @type {String} */ fileName) => { }) {
        const fileName = name + '.type';
        const newModelContent = `<type id="${fileName}" name="${name}"><schema/></type>`;
        ide.repository.createTypeFile(fileName, newModelContent).save(() => callback(fileName));
        return fileName;
    }
}

IDE.registerEditorType(new TypeModelEditorMetadata());
