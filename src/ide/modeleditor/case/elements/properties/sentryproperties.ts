import $ from "jquery";
import CaseFileItemDef from "../../../../../repository/definition/cmmn/casefile/casefileitemdef";
import CaseFileItemTransition from "../../../../../repository/definition/cmmn/casefile/casefileitemtransition";
import PlanItem from "../../../../../repository/definition/cmmn/caseplan/planitem";
import CaseFileItemOnPartDefinition from "../../../../../repository/definition/cmmn/sentry/casefileitemonpartdefinition";
import OnPartDefinition from "../../../../../repository/definition/cmmn/sentry/onpartdefinition";
import PlanItemOnPartDefinition from "../../../../../repository/definition/cmmn/sentry/planitemonpartdefinition";
import Util from "../../../../../util/util";
import Connector from "../../../../editors/modelcanvas/connector/connector";
import Properties from "../../../../editors/modelcanvas/properties";
import HtmlUtil from "../../../../util/htmlutil";
import Images from "../../../../util/images/images";
import SentryView from "../sentryview";

export default class SentryProperties extends Properties<SentryView> {
    renderData() {
        this.addDescription(this.view.purpose);
        this.addSeparator();
        this.addIfPart();
        this.addSeparator();
        this.addPlanItemOnParts();
        this.addSeparator();
        this.addCaseFileItemOnParts();
        this.addIdField();
    }

    show() {
        // Never focus on the sentry name.
        super.show(false);
    }

    addIfPart() {
        const sentry = this.view.definition;
        const rule = sentry.ifPart;
        const ruleAvailable = !!rule;
        const contextName = rule ? rule.contextRef.name : '';
        const ruleBody = rule ? rule.body : '';
        const ruleLanguage = rule && rule.hasCustomLanguage ? rule.language : '';
        const nonDefaultLanguage = rule && rule.hasCustomLanguage ? ' custom-language' : '';
        const ruleLanguageTip = `Default language for expressions is '${this.view.definition.caseDefinition.defaultExpressionLanguage}'. Click the button to change the language`;
        const ruleDeviatesTip = `Language used in this expression is '${ruleLanguage}'. Default language in the rest of the case model is '${this.view.definition.caseDefinition.defaultExpressionLanguage}'`;
        const tip = rule && rule.hasCustomLanguage ? ruleDeviatesTip : ruleLanguageTip;
        const inputIfPartPresence = Util.createID();

        const html = $(`<div class="propertyRule if-part">
                            <div class="propertyRow">
                                <input id="${inputIfPartPresence}" class="rulePresence" type="checkbox" ${ruleAvailable ? 'checked' : ''}/>
                                <img src="${Images.IfPart}" />
                                <label for="${inputIfPartPresence}">If Part</label>
                            </div>
                            <div style="display:${ruleAvailable ? 'block' : 'none'}" class="ruleProperty">
                                <div class="propertyBlock ifPartBody">
                                    <label>If Part Expression</label>
                                    <span class="property-expression-language ${nonDefaultLanguage}" title="${tip}">
                                        <button>L</button>
                                        <input class="input-expression-language" value="${ruleLanguage}" />
                                    </span>
                                    <textarea class="multi">${ruleBody}</textarea>
                                </div>
                                <div class="zoomRow zoomDoubleRow">
                                    <label class="zoomlabel">If Part Context</label>
                                    <label class="valuelabel">${contextName}</label>
                                    <button class="zoombt"></button>
                                    <button class="removeReferenceButton" title="remove the reference to the case file item" />
                                </div>
                                <span class="separator" />
                            </div>
                        </div>`);
        html.find('.rulePresence').on('click', (e: any) => {
            const newPresence = e.target.checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence && this.view.definition.ifPart) {
                this.view.definition.ifPart.removeDefinition();
                this.done();
            }
        });
        const htmlExpressionLanguage = html.find('.property-expression-language');
        const editHTMLExpressionLanguage = htmlExpressionLanguage.find('input');
        const showHTMLExpressionLanguage = htmlExpressionLanguage.find('button');
        editHTMLExpressionLanguage.on('change', e => {
            const rule = this.view.definition.getIfPart();
            const newLanguage = e.target.value || this.view.definition.caseDefinition.defaultExpressionLanguage;
            this.change(rule, 'language', newLanguage);
            if (rule.hasCustomLanguage) {
                HtmlUtil.addClassOverride(htmlExpressionLanguage, 'custom-language');
            } else {
                HtmlUtil.removeClassOverride(htmlExpressionLanguage, 'custom-language');
            }
            this.done();
        });
        showHTMLExpressionLanguage.on('click', () => {
            if (editHTMLExpressionLanguage.css('display') === 'none') {
                editHTMLExpressionLanguage.css('display', 'block');
                HtmlUtil.addClassOverride(htmlExpressionLanguage, 'show-language-input');
            } else {
                editHTMLExpressionLanguage.css('display', 'none');
                HtmlUtil.removeClassOverride(htmlExpressionLanguage, 'show-language-input');
            }
        });

        html.find('.ifPartBody textarea').on('change', (e: any) => this.change(this.view.definition.getIfPart(), 'body', e.target.value));
        html.find('.zoombt').on('click', () => {
            this.view.case.cfiEditor.open((cfi: CaseFileItemDef) => {
                this.change(this.view.definition.getIfPart(), 'contextRef', cfi.id);
            });
        });
        html.find('.removeReferenceButton').on('click', () => {
            this.change(this.view.definition.getIfPart(), 'contextRef', undefined);
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.view.case.cfiEditor.setDropHandler((dragData: { item: CaseFileItemDef }) => {
                const newContextRef = dragData.item.id;
                this.change(this.view.definition.getIfPart(), 'contextRef', newContextRef);
            });
        });
        html.find('.zoomRow').on('pointerout', () => {
            this.view.case.cfiEditor.removeDropHandler();
        });
        this.htmlContainer.append(html);
        return html;
    }

    changeStandardEvent(e: any, onPart: OnPartDefinition<any>, connector?: Connector) {
        if (onPart) {
            const selectedStandardEvent = e.currentTarget.selectedOptions[0];
            const newStandardEvent = onPart.parseStandardEvent(selectedStandardEvent.value);
            if (connector) {
                const style = connector.case.diagram.connectorStyle;
                const label = newStandardEvent.toString();
                if (style.isNone || (style.isDefault && onPart.source.defaultTransition == newStandardEvent)) {
                    connector.label = '';
                    connector.hiddenLabel = label;
                } else {
                    connector.label = label;
                }
            }
            this.change(onPart, 'standardEvent', newStandardEvent);
        }
    }

    deleteOnPart(onPart: OnPartDefinition<any>, connector?: Connector) {
        if (onPart) {
            onPart.removeDefinition();
            if (connector) {
                connector.remove();
            }
            this.done();
            this.show();
        }
    }

    addPlanItemOnParts() {
        const html = $(`<div class="onparts-block">
                            <label>PlanItem On Parts</label>
                            <table class="onparts-table">
                                <colgroup>
                                    <col width="15px"></col>
                                    <col width="150px"></col>
                                    <col width="100px"></col>
                                    <col width="15px"></col>
                                    <col width="15px"></col>
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Plan Item</th>
                                        <th>Standard Event</th>
                                        <th title="Show/hide connector">C</th>
                                        <th title="Show/hide label">L</th>
                                    </tr>
                                </thead>
                                <tbody />
                            </table>
                        </div>`);
        this.htmlContainer.append(html);
        const tableBody = html.find('.onparts-table tbody');
        this.view.definition.planItemOnParts.forEach((onPart: PlanItemOnPartDefinition) => this.addPlanItemOnPart(tableBody, onPart));
        this.addPlanItemOnPart(tableBody);
    }

    getPlanItemsSelect(onPart?: PlanItemOnPartDefinition) {
        const thisPlanItem = this.view.parent!.definition;
        const allPlanItems = this.view.definition.caseDefinition.elements.filter(e => e instanceof PlanItem && e != thisPlanItem);
        const planItemOptions = allPlanItems.map((item: any) => {
            const selected = onPart && onPart.source == item ? ' selected="true"' : '';
            return `<option value="${item.id}" ${selected}>${item.name}</option>`;
        }).join('');
        return '<option></option>' + planItemOptions;
    }

    getPlanItemStandardEvents(onPart?: PlanItemOnPartDefinition) {
        if (!onPart || !onPart.source) {
            return '<option></option><option>first select a plan item</option>';
        } else {
            const isTransitionSelected = (transition: any) => transition == onPart.standardEvent ? 'selected="true"' : '';
            return onPart.source.transitions.map((t: any) => `<option value="${t}" ${isTransitionSelected(t)}>${t}</option>`).join('');
        }
    }

    addPlanItemOnPart(parentHTML: JQuery<HTMLElement>, onPart?: PlanItemOnPartDefinition) {
        const planItemSelection = this.getPlanItemsSelect(onPart);
        const standardEvents = this.getPlanItemStandardEvents(onPart);
        const connector = onPart ? this.view.__getConnector(onPart.sourceRef.value) : undefined;
        const checked = connector ? 'checked="true"' : '';
        const checkedLabel = connector && connector.label ? 'checked="true"' : '';
        const html = $(`<tr class="onpart">
                            <td>
                                <button title="Delete on part" class="btnDelete">
                                    <img src="${Images.Delete}" />
                                </button>
                            </td>
                            <td>
                                <select title="Select a plan item to which the sentry listens" class="source-ref" id="planItemSelection">${planItemSelection}</select>
                            </td>
                            <td>
                                <select title="Select the event to which the sentry listens" class="standard-event">${standardEvents}</select>
                            </td>
                            <td>
                                <input id="hideShowConnector" title="Show/hide a visual connector to the plan item" type="checkbox" ${checked}></input>
                            </td>
                            <td>
                                <input id="hideShowLabel" title="Show/hide the label with the standard event on the connector (CTRL-L changes default settings for this case)" type="checkbox" ${checkedLabel}></input>
                            </td>
                        </tr>`);
        parentHTML.append(html);
        html.find('.btnDelete').on('click', () => this.deleteOnPart(onPart!, connector));
        html.find('#planItemSelection').on('change', (e: any) => {
            const selectedOption = e.currentTarget.selectedOptions[0];
            const planItemID = selectedOption.value;
            const planItem = this.view.definition.caseDefinition.getElement(planItemID);
            if (planItem && planItem instanceof PlanItem) {
                const changedOnPart = onPart ? onPart : this.view.definition.createPlanItemOnPart();
                changedOnPart.sourceRef.update(planItem.id);
                changedOnPart.standardEvent = planItem.defaultTransition;
            } else if (onPart) {
                onPart.sourceRef.update(undefined);
            }
            if (connector) {
                connector.remove();
            }
            html.find('.standard-event').html(this.getPlanItemStandardEvents(onPart));
            this.done();
            this.show();
        });
        html.find('.standard-event').on('change', e => this.changeStandardEvent(e, onPart!, connector));
        html.find('#hideShowConnector').on('change', (e: any) => {
            if (!onPart) {
                if (e.currentTarget.checked) e.currentTarget.checked = false;
                return;
            }
            const planItemView = this.view.case.getItem(onPart.sourceRef.value);
            if (planItemView) {
                const checked = e.currentTarget.checked;
                if (checked) {
                    const connector = this.view.__connect(planItemView);
                    const style = connector.case.diagram.connectorStyle;
                    const label = onPart.standardEvent.toString();
                    if (style.isNone || (style.isDefault && onPart.source?.defaultTransition == onPart.standardEvent)) {
                        connector.label = '';
                        connector.hiddenLabel = label;
                    } else {
                        connector.label = label;
                    }
                    this.show();
                } else if (connector) {
                    connector.remove();
                }
            }
            this.done();
        });
        html.find('#hideShowLabel').on('change', e => this.changeLabelVisibility(e, onPart!, connector));
        return html;
    }

    addCaseFileItemOnParts() {
        const html = $(`<div class="onparts-block">
                            <label>CaseFileItemView On Parts</label>
                            <table class="onparts-table">
                                <colgroup>
                                    <col width="15px"></col>
                                    <col width="150px"></col>
                                    <col width="100px"></col>
                                    <col width="15px"></col>
                                    <col width="15px"></col>
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Case File Item</th>
                                        <th class="scorrect-standard-event">Standard Event</th>
                                        <th title="Show/hide connector">C</th>
                                        <th title="Show/hide label">L</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>`);
        this.htmlContainer.append(html);
        const tableBody = html.find('.onparts-table tbody');
        this.view.definition.caseFileItemOnParts.forEach((onPart: CaseFileItemOnPartDefinition) => this.addCaseFileItemOnPart(tableBody, onPart));
        this.addCaseFileItemOnPart(tableBody);
    }

    getCaseFileItemStandardEvents(onPart?: CaseFileItemOnPartDefinition) {
        if (onPart && onPart.source) {
            const isTransitionSelected = (transition: CaseFileItemTransition) => transition == onPart.standardEvent ? 'selected="true"' : '';
            return CaseFileItemTransition.values.map(t => `<option value="${t}" ${isTransitionSelected(t)}>${t}</option>`).join('');
        } else {
            return '<option></option><option>first select a case file item item</option>';
        }
    }

    addCaseFileItemOnPart(parentHTML: JQuery<HTMLElement>, onPart?: CaseFileItemOnPartDefinition) {
        const caseFileItemName = onPart && onPart.source ? onPart.source.name : '';
        const standardEvents = this.getCaseFileItemStandardEvents(onPart);
        const cfiView = onPart ? this.view.case.getCaseFileItemElement(onPart.sourceRef.value) : undefined;
        const connector = cfiView ? this.view.__getConnector(cfiView.id) : undefined;
        const checked = connector ? 'checked="true"' : '';
        const checkedLabel = connector && connector.label ? 'checked="true"' : '';
        const html = $(`<tr class="onpart">
                            <td title="Delete on part">
                                <button class="btnDelete"><img src="${Images.Delete}" /></button>
                            </td>
                            <td title="Select a case file item to which the sentry listens">
                                <div class="zoomRow zoomSingleRow source-ref">
                                    <label class="valuelabel">${caseFileItemName}</label>
                                    <button class="zoombt"></button>
                                </div>
                            </td>
                            <td title="Select the CaseFileItemView event to which the sentry listens">
                                <select class="standard-event">${standardEvents}</select>
                            </td>
                            <td title="Show/hide a visual connector to the case file item">
                                <input id="hideShowConnector" type="checkbox" ${checked}></input>
                            </td>
                            <td>
                                <input id="hideShowLabel" title="Show/hide the label with the standard event on the connector (CTRL-L changes default settings for this case)" type="checkbox" ${checkedLabel}></input>
                            </td>
                        </tr>`);
        parentHTML.append(html);
        html.find('.btnDelete').on('click', () => this.deleteOnPart(onPart!, connector));
        html.find('.zoombt').on('click', () => {
            this.view.case.cfiEditor.open((cfi: CaseFileItemDef) => this.changeCaseFileItemOnPart(onPart, connector, html, cfi));
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.view.case.cfiEditor.setDropHandler((dragData: { item: CaseFileItemDef }) => this.changeCaseFileItemOnPart(onPart, connector, html, dragData.item));
        });
        html.find('.zoomRow').on('pointerout', () => {
            this.view.case.cfiEditor.removeDropHandler();
        });
        html.find('.standard-event').on('change', e => this.changeStandardEvent(e, onPart!, connector));
        html.find('#hideShowConnector').on('change', (e: any) => {
            const cfiView = onPart ? this.view.case.getCaseFileItemElement(onPart.sourceRef.value) : undefined;
            const checked = e.currentTarget.checked;
            if (onPart && cfiView) {
                if (checked) {
                    this.view.__connect(cfiView);
                    this.show();
                } else if (connector) {
                    connector.remove();
                }
                this.done();
            } else if (checked) {
                e.currentTarget.checked = false;
            }
        });
        html.find('#hideShowLabel').on('change', e => this.changeLabelVisibility(e, onPart!, connector));
        return html;
    }

    changeLabelVisibility(e: any, onPart: OnPartDefinition<any>, connector?: Connector) {
        if (!onPart) {
            if (e.currentTarget.checked) e.currentTarget.checked = false;
            return;
        }
        if (connector) {
            const checked = e.currentTarget.checked;
            const label = onPart.standardEvent.toString();
            if (checked) {
                connector.label = label;
            } else {
                connector.label = '';
                connector.hiddenLabel = onPart.standardEvent.toString();
            }
        }
        this.done();
    }

    changeCaseFileItemOnPart(
        onPart: CaseFileItemOnPartDefinition | undefined,
        connector: Connector | undefined,
        html: JQuery<HTMLElement>,
        cfi: CaseFileItemDef
    ) {
        const currentSourceRef = onPart ? onPart.sourceRef : '';
        if (cfi.id === currentSourceRef) {
            return;
        }

        const newOnPart = onPart ? onPart : this.view.definition.createCaseFileItemOnPart();
        if (!onPart) {
            newOnPart.standardEvent = CaseFileItemTransition.Create;
        }
        if (cfi.id !== currentSourceRef && connector) {
            connector.remove();
        }
        this.change(newOnPart, 'sourceRef', cfi.id);

        this.show();
    }
}
