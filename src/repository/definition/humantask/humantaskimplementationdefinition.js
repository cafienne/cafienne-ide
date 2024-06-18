import ParameterDefinition from "../cmmn/contract/parameterdefinition";
import { CAFIENNE_NAMESPACE, CAFIENNE_PREFIX, IMPLEMENTATION_TAG } from "../xmlelementdefinition";
import HumanTaskModelElementDefinition from "./humantaskmodelelementdefinition";
import TaskModelDefinition from "./taskmodeldefinition";

export default class HumanTaskImplementationDefinition extends HumanTaskModelElementDefinition {
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        /** @type {Array<ParameterDefinition>} */
        this.input = this.parseElements('input', ParameterDefinition);
        /** @type {Array<ParameterDefinition>} */
        this.output = this.parseElements('output', ParameterDefinition);
        this.taskModel = this.parseElement('task-model', TaskModelDefinition);
    }

    /** @returns {TaskModelDefinition} */
    get taskModel() {
        if (! this._taskModel) {
            this._taskModel = super.createDefinition(TaskModelDefinition);
            this._taskModel.id = undefined;
            this._taskModel.name = undefined;
        }
        return this._taskModel;
    }

    set taskModel(taskModel) {
        this._taskModel = taskModel;
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, IMPLEMENTATION_TAG, 'input', 'output', 'taskModel');
        this.exportNode.setAttribute(CAFIENNE_PREFIX, CAFIENNE_NAMESPACE);
        this.exportNode.setAttribute('class', 'org.cafienne.cmmn.definition.task.WorkflowTaskDefinition');

        // Hmmmm ... perhaps it is better to put name and documentation a level higher ...
        //  We'd have to investigate compatibility for existing models.
        this.exportNode.setAttribute('name', this.modelDefinition.name);
    }
}
