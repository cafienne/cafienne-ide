import HumanTaskModelDefinition from "../../../../../repository/definition/humantask/humantaskmodeldefinition";
import Util from "../../../../../util/util";
import AlpacaPreview from "../../../../editors/external/alpacapreview";
import StandardForm from "../../../../editors/standardform";
import HumanTaskView from "../../elements/humantaskview";

export default class PreviewTaskForm extends StandardForm {
    constructor(public task: HumanTaskView) {
        super(task.canvas, 'Task Preview', 'task-preview');
    }

    get label() {
        const name = this.task ? this.task.name : this.modelEditor.file.name;
        return 'Task Preview - ' + name;
    }

    renderData() {
        this.htmlContainer?.html('<div class="taskpreview"></div>');

        const divPreview = this.htmlContainer!.find('.taskpreview');
        const form = (this.task.definition.implementationModel &&
            this.task.definition.implementationModel instanceof HumanTaskModelDefinition)
            ? (this.task.definition.implementationModel as HumanTaskModelDefinition).taskModel
            : undefined;
        const taskModel = form?.taskModel || '';

        const parseResult = Util.parseJSON(taskModel);
        const validJSON = parseResult.object;
        if (validJSON) {
            validJSON.options = { focus: false };
            validJSON.error = (e: any) => {
                divPreview.attr('style', 'border: 2px solid orange')
                const msg = `The task definition has an error: ${e.message}`;
                divPreview.attr('title', msg);
            } // Ignore any errors.
            new AlpacaPreview(this.htmlContainer!.find('.taskpreview')).render(validJSON);
        } else {
            divPreview.html(`<h3 style="color:red;font-weight: bold;">${parseResult.description}</h3>`);
        }
    }
}
