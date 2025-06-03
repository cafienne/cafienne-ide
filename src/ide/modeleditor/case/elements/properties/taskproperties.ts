import $ from "jquery";
import ServerFileDragData from "../../../../dragdrop/serverfiledragdata";
import Images from "../../../../util/images/images";
import TaskView from "../taskview";
import TaskStageProperties from "./taskstageproperties";

export default class TaskProperties<TV extends TaskView = TaskView> extends TaskStageProperties<TV> {
    /**
     * Adds a dropdown with all possible task implementation
     */
    addModelImplementation() {
        const repositoryBrowser = this.view.case.editor.ide.repositoryBrowser;
        const taskDefinition = this.view.definition;
        const implementation = taskDefinition.implementationRef ? taskDefinition.implementationRef : '';

        const options = this.view.getImplementationList().map(model =>
            `<option value="${model.fileName}" ${model.fileName == implementation ? " selected" : ""}>${model.name}</option>`
        ).join('');
        const html = $(`<div class="propertyBlock">
                            <label>Implementation</label>
                            <div class="properties_filefield">
                                <div>
                                    <select>
                                        <option value="">${implementation ? '... remove ' + implementation : ''}</option>
                                        <option value="__new__">create new implementation ...</option>
                                        ${options}
                                    </select>
                                </div>
                            </div>
                        </div>`);
        html.find('select').on('change', (e: JQuery.ChangeEvent) => {
            const reference = (e.target as HTMLSelectElement).value;
            const model = this.view.getImplementationList().find(model => model.fileName == reference);
            if (model) {
                this.view.changeTaskImplementation(model);
            } else if (reference == '__new__') {
                this.view.generateNewTaskImplementation();
            } else {
                this.change(taskDefinition, 'implementationRef', reference);
                this.clear();
                this.renderForm();
            }
        });
        // Also make the html a drop target for drag/dropping elements from the repository browser
        html.on('pointerover', () =>
            repositoryBrowser.setDropHandler(
                (dragData: ServerFileDragData) => this.view.changeTaskImplementation(dragData.file),
                (dragData: ServerFileDragData) => this.view.supportsFileTypeAsImplementation(dragData)
            )
        );
        html.on('pointerout', () => repositoryBrowser.removeDropHandler());
        this.htmlContainer.append(html);
        return html;
    }

    addValidatorField() {
        const taskDefinition = this.view.definition;
        const implementation = taskDefinition.validatorRef ? taskDefinition.validatorRef : '';

        const options = this.case.editor.ide.repository.getProcesses().map((model: any) =>
            `<option value="${model.fileName}" ${model.fileName == implementation ? " selected" : ""}>${model.name}</option>`
        ).join('');
        const html = $(`<div class="propertyBlock" title="Select a web service to be invoked to validate task output">
                            <label>Task Output Validator</label>
                            <div class="properties_filefield">
                                <div>
                                    <select>
                                        <option value="">${implementation ? '... remove ' + implementation : ''}</option>
                                        ${options}
                                    </select>
                                </div>
                            </div>
                        </div>`);
        html.find('select').on('change', (e: JQuery.ChangeEvent) => {
            const reference = (e.target as HTMLSelectElement).value;
            const model = this.view.getImplementationList().find(model => model.fileName == reference);
            if (model) {
                this.change(taskDefinition, 'validatorRef', reference);
                this.clear();
                this.renderForm();
            } else {
                this.change(taskDefinition, 'validatorRef', reference);
                this.clear();
                this.renderForm();
            }
        });
        this.htmlContainer.append(html);
        return html;
    }

    addParameterMappings() {
        const html = $(`<div class="propertyBlock">
            <button class="btnParameterMapping">Edit Parameter Mappings</button>
        </div>`);
        html.find('.btnParameterMapping').on('click', () => this.view.mappingsEditor.show());
        this.htmlContainer.append(html);
        return html;
    }

    addIsBlocking() {
        this.addCheckField('Is Blocking', 'If the task is non-blocking, the case will continue without awaiting the task to complete', Images.Blocking, 'isBlocking', this.view.definition);
    }

    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDocumentationField();
        this.addSeparator();
        this.addModelImplementation();
        this.addParameterMappings();
        this.addSeparator();
        this.addRepeatRuleBlock();
        this.addRequiredRuleBlock();
        this.addManualActivationRuleBlock();
        this.addSeparator();
        this.addIsBlocking();
        this.addDiscretionaryBlock(Images.DiscretionaryTask, 'Discretionary Task');
        this.addIdField();
    }
}