import $ from "jquery";
import Util from "../../../../../util/util";
import Images from "../../../../util/images/images";
import TaskStageView from "../taskstageview";
import PlanItemProperties from "./planitemproperties";

export default abstract class TaskStageProperties<TSV extends TaskStageView = TaskStageView> extends PlanItemProperties<TSV> {
    applicabilityRulesBlock!: JQuery<HTMLElement>;

    addDiscretionaryBlock(imageURL: string, label: string) {
        const element = this.view.definition;
        const isDiscretionary = element.isDiscretionary;
        const inputDiscretionary = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${inputDiscretionary}" type="checkbox" ${isDiscretionary ? 'checked' : ''}/>
                                <img src="${imageURL}" />
                                <label for="${inputDiscretionary}">${label}</label>
                            </div>
                            <div style="display:${isDiscretionary ? 'block' : 'none'}" title="Select case roles allowed to plan the item (not to perform the item, but to plan the item).\nA team member must have one of the roles in order to plan.\nIf empty, all team members can plan the item." class="discretionaryBlock">
                                <div class="authorizedRolesBlock">
                                    <label>Authorized Roles</label>
                                </div>
                                <span class="separator" />
                                <div class="applicabilityRulesBlock">
                                    <label>Applicability Rules</label>
                                </div>
                            </div>
                        </div>`);
        html.find('input').on('click', (e: any) => {
            const newDiscretionary = (e.target as HTMLInputElement).checked;
            html.find('.discretionaryBlock').css('display', newDiscretionary ? 'block' : 'none');
            this.view.definition.switchType();
            if (this.view.definition.isDiscretionary) {
                (this.view.parent as any).showPlanningTable();
                this.renderApplicabilityRules();
            }
            this.done();
        });

        // Add a row for each role, and also an empty role at the end
        const authorizedRolesHTML = html.find('.authorizedRolesBlock');
        this.addAuthorizatedRoles(authorizedRolesHTML);

        // Render the applicability rules
        this.applicabilityRulesBlock = html.find('.applicabilityRulesBlock');
        this.renderApplicabilityRules();

        this.htmlContainer.append(html);
        return html;
    }

    renderApplicabilityRules() {
        if (this.view.definition.isDiscretionary) {
            (this.view.definition.parent as any).ruleDefinitions.forEach((rule: any) => this.addApplicabilityRuleField(rule));
        }
    }

    addApplicabilityRuleField(rule: any) {
        const isSelected = this.view.definition.applicabilityRules.list.find((r: any) => r.references(rule)) ? true : false;
        const label = rule.name;
        const checked = isSelected ? ' checked' : '';
        const checkId = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${checkId}" type="checkbox" ${checked} />
                                <label for="${checkId}">${label}</label>
                            </div>
                        </div>`);
        html.on('change', (e: JQuery.ChangeEvent) => {
            if ((e.target as HTMLInputElement).checked) {
                this.view.definition.applicabilityRules.add(rule);
            } else {
                this.view.definition.applicabilityRules.remove(rule);
            }
            this.done();
        });
        this.applicabilityRulesBlock.append(html);
        return html;
    }

    addPlanningTableField() {
        const checked = this.view.definition.planningTable ? ' checked' : '';
        const checkId = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${checkId}" type="checkbox" ${checked} />
                                <img src="${Images.PlanningTable}" />
                                <label for="${checkId}">Planning Table</label>
                            </div>
                        </div>`);
        html.on('change', (e: JQuery.ChangeEvent) => {
            if ((e.target as HTMLInputElement).checked == true) {
                // Create a new planning table on the definition by invoking the getter, and show it.
                this.view.definition.getPlanningTable();
                this.view.showPlanningTable();
            } else {
                // Invoking delete on our planning table will also remove the definition and render this element again (and thus hide the pt image)
                this.view.planningTableView?.__delete();
            }
            this.done();
        });
        this.htmlContainer.append(html);
        return html;
    }
}
