import ParameterDefinition from "../contract/parameterdefinition";
import { CAFIENNE_NAMESPACE, CAFIENNE_PREFIX, IMPLEMENTATION_TAG } from "../xmlserializable";
import HumanTaskModelDefinition from "./humantaskmodeldefinition";
import HumanTaskModelElementDefinition from "./humantaskmodelelementdefinition";
import TaskModelDefinition from "./taskmodeldefinition";

export default class HumanTaskImplementationDefinition extends HumanTaskModelElementDefinition {
    input: ParameterDefinition<HumanTaskModelDefinition>[];
    output: ParameterDefinition<HumanTaskModelDefinition>[];
    private _taskModel?: TaskModelDefinition;
    constructor(importNode: Element, modelDefinition: HumanTaskModelDefinition, parent?: HumanTaskModelElementDefinition) {
        super(importNode, modelDefinition, parent);
        this.input = this.parseElements('input', ParameterDefinition);
        this.output = this.parseElements('output', ParameterDefinition);
        this.taskModel = this.parseElement('task-model', TaskModelDefinition);
    }

    get taskModel(): TaskModelDefinition {
        if (! this._taskModel) {
            this._taskModel = super.createDefinition(TaskModelDefinition);
            this._taskModel.id = '';
            this._taskModel.name = '';
        }
        return this._taskModel;
    }

    set taskModel(taskModel: TaskModelDefinition | undefined) {
        this._taskModel = taskModel;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, IMPLEMENTATION_TAG, 'input', 'output', 'taskModel');
        this.exportNode.setAttribute(CAFIENNE_PREFIX, CAFIENNE_NAMESPACE);
        this.exportNode.setAttribute('class', 'org.cafienne.cmmn.definition.task.WorkflowTaskDefinition');

        // Hmmmm ... perhaps it is better to put name and documentation a level higher ...
        //  We'd have to investigate compatibility for existing models.
        this.exportNode.setAttribute('name', this.modelDefinition.name);
    }
}
