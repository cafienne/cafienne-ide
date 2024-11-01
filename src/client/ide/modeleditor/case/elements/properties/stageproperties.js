import PlanItem from "@definition/cmmn/caseplan/planitem";
import Images from "@util/images/images";
import $ from "jquery";
import StageView from "../stageview";
import TaskStageProperties from "./taskstageproperties";

export default class StageProperties extends TaskStageProperties {
    /**
     * @param {StageView} stage 
     */
    constructor(stage) {
        super(stage);
        this.cmmnElement = stage;
    }

    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDocumentationField();
        this.addSeparator();
        this.addRepeatRuleBlock();
        this.addRequiredRuleBlock();
        this.addManualActivationRuleBlock();
        this.addSeparator();
        this.addAutoComplete();
        this.addDiscretionaryBlock(Images.DiscretionaryTask, 'Discretionary Stage');
        this.addSeparator();
        this.addPlanningTableField();
        this.addSeparator();
        this.addPlanItemTable();
        this.addIdField();
    }

    addAutoComplete() {
        this.addCheckField('Auto Complete', 'Determines whether the stage should auto complete or not.', Images.AutoComplete, 'autoComplete', this.cmmnElement.definition);
    }

    addPlanItemTable() {
        const html = $(`<div class="propertyBlock">
                            <label title="The order of plan items in the stage determines when they are instantiated">
                                <strong>Plan Item Order</strong>
                                <span title="Show" class="togglePlanItemsButton toggleDown">&nbsp;&nbsp;+</span>
                            </label>
                            <div class="planitems-table">
                            </div>
                        </div>`);
        this.htmlContainer.append(html);
        html.on('click', e => {
            const visible = html.find('.planitems-table').css('display') == 'block';
            html.find('.planitems-table').css('display', visible ? 'none' : 'block');
            html.find('.togglePlanItemsButton').html(visible ? '&nbsp;&nbsp;+' : '');
        });
        
        this.cmmnElement.definition.planItems.forEach(item => {
            const itemHTML = $(`<div>
                                    <span title="Move plan item up (affects instantiation order)" class="upButton"><img src="images/doubleup_32.png" /></span>
                                    <span title="Move plan item down (affects instantiation order)" class="downButton"><img src="images/doubledown_32.png" /></span> ${item.name}
                                    <span class="separator" />
                                </div>`);
            itemHTML.find('.upButton').on('click', e => this.up(e, itemHTML, item, this.cmmnElement.definition.planItems));
            itemHTML.find('.downButton').on('click', e => this.down(e, itemHTML, item, this.cmmnElement.definition.planItems));
            this.htmlContainer.find('.planitems-table').append(itemHTML);
        });
    }

    /**
     * Moves the item and it's corresponding HTML up in the list (if it is not the first one)
     * @param {JQuery.ClickEvent} e 
     * @param {JQuery<HTMLElement>} html 
     * @param {PlanItem} item 
     * @param {Array<PlanItem>} collection
     */
    up(e, html, item, collection) {
        e.stopPropagation();
        const index = collection.indexOf(item);
        if (index > 0) {
            collection[index] = collection[index - 1];
            collection[index - 1] = item;
            html.insertBefore(html.prev());
        }
        this.done();
    }

    /**
     * Moves the item and it's corresponding HTML down in the list (if it is not the last one)
     * @param {JQuery.ClickEvent} e 
     * @param {JQuery<HTMLElement>} html 
     * @param {PlanItem} item 
     * @param {Array<PlanItem>} collection
     */
    down(e, html, item, collection) {
        e.stopPropagation();
        const index = collection.indexOf(item);
        if (index < collection.length - 1) {
            collection[index] = collection[index + 1];
            collection[index + 1] = item;
            html.insertAfter(html.next());
        }
        this.done();
    }
}
