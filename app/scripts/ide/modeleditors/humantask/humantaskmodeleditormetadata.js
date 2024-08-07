class HumantaskModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getHumanTasks();
    }

    supportsFile(file) {
        return file instanceof HumanTaskFile;
    }

    createEditor(ide, file) {
        return new HumantaskModelEditor(ide, file);
    }

    get modelType() {
        return 'humantask';
    }

    /** @returns {Function} */
    get shapeType() {
        return HumanTaskView;
    }

    get description() {
        return 'Human Task Models';
    }

    /**
     * Create a new HumanTaskView model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @param {Function} callback
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, name, description, callback = (/** @type {String} */ fileName) => {}) {
        const newModelContent =
            `<humantask>
                <${IMPLEMENTATION_TAG} name="${name}" description="${description}" ${CAFIENNE_PREFIX}="${CAFIENNE_NAMESPACE}" class="org.cafienne.cmmn.definition.task.WorkflowTaskDefinition">
                    <task-model></task-model>
                </${IMPLEMENTATION_TAG}>
            </humantask>`;
        const fileName = name + '.humantask';
        ide.repository.createHumanTaskFile(fileName, newModelContent).save(andThen(() => callback(fileName)));
        return fileName;
    }
}

IDE.registerEditorType(new HumantaskModelEditorMetadata());
