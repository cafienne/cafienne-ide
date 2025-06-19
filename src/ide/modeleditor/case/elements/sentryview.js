﻿import { g } from "jointjs";
import CaseFileItemTransition from "../../../../repository/definition/cmmn/casefile/casefileitemtransition";
import CriterionDefinition from "../../../../repository/definition/cmmn/sentry/criteriondefinition";
import OnPartDefinition from "../../../../repository/definition/cmmn/sentry/onpartdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import CaseFileItemView from "./casefileitemview";
import CMMNElementView from "./cmmnelementview";
import Connector from "./connector";
import PlanItemView from "./planitemview";
import SentryProperties from "./properties/sentryproperties";
// import { EntryCriterionHalo, ExitCriterionHalo, ReactivateCriterionHalo } from "./halo/sentryhalo";
// BIG TODO HERE

export default class SentryView extends CMMNElementView {
    /**
     * Creates a new SentryView element.
     * Is an abstract sub class for EntryCriterionView and ExitCriterionView.
     * @param {PlanItemView} planItem 
     * @param {CriterionDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(planItem, definition, shape) {
        super(planItem.case, planItem, definition, shape);
        this.planItem = planItem;
        this.definition = definition;

        //define default color
        this.__resizable = false;
    }

    /**
     * Override select in both planningtable and sentry to immediately show properties.
     * @param {Boolean} selected 
     */
    __select(selected) {
        super.__select(selected);
        if (selected) {
            this.propertiesView.show();
        }
    }

    createProperties() {
        return new SentryProperties(this);
    }

    refreshIfPartTooltip() {
        const tooltip = this.definition.ifPart ? this.definition.ifPart.createTooltip('If Part') : '';
        this.html.find('.tooltip').html(tooltip);
    }

    /**
     * shows the element properties as icons in the element
     */
    refreshView() {
        super.refreshView();
        this.refreshIfPartTooltip();
    }

    adoptOnPart(sourceElement) {
        // Also connect the sentry with the source element to create a corresponding on-part
        sourceElement.__connect(this);
        this.updateConnectorLabels();
        this.propertiesView.refresh();
    }

    updateConnectorLabels() {
        const style = this.case.diagram.connectorStyle;

        this.__connectors.forEach(connector => {
            const onPart = this.__getOnPart(connector);
            if (style.isNone) { // Remove the label
                connector.label = '';
            } else {
                if (!onPart.source) {
                    // Only update if we have a source
                    return;
                }
                const defaultTransition = onPart.source.defaultTransition;
                if (style.isDefault && onPart.standardEvent == defaultTransition) {
                    connector.label = ''
                } else {
                    connector.label = onPart.standardEvent.toString();
                }
            }
        })

    }

    /**
     * set a standard event to a sentry with value element, standardEvent
     * When the dataNode exists for the element, look up and set standardEvent
     * When the dataNode does not exist (no entry for the element yet)-> create
     * Return the dataNode
     * 
     * @param {CMMNElementView} source 
     * @param {String} defaultEvent 
     * @param {ExitCriterionView} exitCriterion 
     */
    setPlanItemOnPart(source, defaultEvent, exitCriterion = undefined) {
        // If we cannot find the onpart in our definition, then we'll create a new one
        if (!this.definition.planItemOnParts.find(onPart => onPart.sourceRef.references(source.definition))) {
            const newOnPart = this.definition.createPlanItemOnPart();
            newOnPart.sourceRef.update(source.definition);
            newOnPart.standardEvent = defaultEvent;
            if (exitCriterion) {
                newOnPart.exitCriterionRef = exitCriterion.definition.id;
            }
        }
    }

    /**
     * sets the properties of the case file item onpart of a sentry,
     * when manually linking a case file item element with a sentry
     * @param {CaseFileItemView} source 
     */
    setCaseFileItemOnPart(source, defaultEvent) {
        if (source.definition.isEmpty) {
            // Do not create an onpart if the definition is not set.
            return;
        }
        // If we cannot find the onpart in our definition, then we'll create a new one
        if (!this.definition.caseFileItemOnParts.find(onPart => onPart.sourceRef.references(source.definition))) {
            const newOnPart = this.definition.createCaseFileItemOnPart();
            newOnPart.sourceRef.update(source.definition);
            newOnPart.standardEvent = defaultEvent;
        }
    }

    get markup() {
        return `
        <polyline style="pointer-events: bounding-box;" class="cmmn-shape cmmn-border cmmn-${this.constructor.name.toLowerCase()}-shape" points="6,0  0,10  6,20  12,10 6,0">
            <title class="tooltip"></title>
        </polyline>`;
    }

    resizing() {
        console.error('Cannot resize a sentry')
    }

    moved(x, y, newParent) {
        this.moving(x, y);
    }

    /**
     * when moving a sentry, it can only move along the edge of its' parent
     * @param {*} x the coordinates of the event (cursor/mouse pointer location)
     * @param {*} y the coordinates of the event (cursor/mouse pointer location)
     */
    moving(x, y) {
        const parentElement = this.case.graph.getCell(this.parent.xyz_joint.id);
        if (!parentElement) return; // Parent element probably has not yet been added to the case

        const point = g.point(x, y);

        //get the coordinates of the boundrypoint of the parent that is nearest to the cursor
        const boundryPoint = parentElement.getBBox().pointNearestToPoint(point);

        const sA = this.attributes;
        const sX = sA.position.x;
        const sY = sA.position.y;
        const sH = sA.size.height;
        const sW = sA.size.width;

        const sentryTranslateX = boundryPoint.x - sX - sW / 2;
        const sentryTranslateY = boundryPoint.y - sY - sH / 2;

        this.xyz_joint.translate(sentryTranslateX, sentryTranslateY);
    }


    /**
     * returns array with all planItems/sentries that can be connected to the sentry
     */
    __getConnectableElements() {
        const connectableElements = this.case.items.filter(cmmnElementView => {
            /*the sentry planItem can not link with (so skip)
            - casePlanModel
            - another sentry of same type (entry can only connect with exit)
            - it self
            - a sentry having the same parent (do not connect to sibling sentry)
            - its' parent (do not connect to own parent)
            - a discretionary element
            - case file item element (must be done via onPart Case File Items)
            - planningTable
            - no onPart element in an exit sentry to an entry sentry
                (thus in the onPart of an exit sentry, you cannot connect to an entrysentry)
            */

            if (!(cmmnElementView.isCriterion || cmmnElementView.isPlanItem)) {
                return false;
            }
            if (cmmnElementView.isCasePlan) {
                return false;
            }
            if (this.constructor == cmmnElementView.constructor) {
                return false;
            }
            if (this == cmmnElementView) {
                return false;
            }
            if (this.isExitCriterion && cmmnElementView.isEntryCriterion) {
                return false;
            }
            if (cmmnElementView.definition.isDiscretionary) {
                return false;
            }
            if (this.parent == cmmnElementView) {
                return false;
            }
            if (cmmnElementView.isCriterion && this.parent == cmmnElementView.parent) {
                return false;
            }
            return true;
        });
        return connectableElements;
    }

    __connectTo(target) {
        this.__connectElement(target);
    }

    __connectFrom(source) {
        this.__connectElement(source);
    }

    /**
     * 
     * @param {CMMNElementView} target 
     */
    __connectElement(target) {
        if (target.isCaseFileItem) {
            this.setCaseFileItemOnPart(target, CaseFileItemTransition.Create);
        } else if (target.isPlanItem) {
            this.setPlanItemOnPart(target, target.definition.defaultTransition);
        } else if (target.isCriterion) {
            // Note: this means 2 sentries get connected, and, since we're invoking
            //  this method on both ends of the connection, we're invoking __connectSentry twice.
            //  One has an empty implementation.
            this.__connectSentry(target);
        }
        if (this.propertiesView.visible) {
            this.propertiesView.show();
        }
    }

    /**
     * 
     * @param {Connector} connector 
     * @returns {OnPartDefinition}
     */
    __getOnPart(connector) {
        const planItemOnPart = this.definition.planItemOnParts.find(onPart => connector.hasElementWithId(onPart.sourceRef.value));
        if (planItemOnPart) return planItemOnPart;
        return this.definition.caseFileItemOnParts.find(onPart => {
            const casefileElement = this.case.getCaseFileItemElement(onPart.sourceRef.value);
            if (casefileElement) return connector.hasElementWithId(casefileElement.id);
        });
    }

    __connectSentry(target) {
        // Empty implementation; only EntryCriteria can connect to other sentries.
    }

    referencesDefinitionElement(definitionId) {
        if (this.definition.ifPart && this.definition.ifPart.contextRef.references(definitionId)) {
            return true;
        }
        if (this.definition.caseFileItemOnParts.find(onPart => onPart.sourceRef.references(definitionId))) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get purpose() {
        return "test123";
    }

    get isCriterion() {
        return true;
    }
}


export class EntryCriterionView extends SentryView {
    static create(planItem, x, y) {
        const definition = planItem.definition.createEntryCriterion();
        const shape = planItem.case.diagram.createShape(x, y, 12, 20, definition.id);
        return new EntryCriterionView(planItem, definition, shape);
    }

    /**
     * 
     * @param {SentryView} target 
     */
    __connectSentry(target) {
        if (target.isExitCriterion) {
            // Then we need to connect to the exit of the parent of the target;
            const targetParent = target.parent;
            // It does not make sense to listen and start a new plan item when the CasePlan goes exit,
            //  so skip that one.
            if (!(targetParent.isCasePlan)) {
                this.setPlanItemOnPart(targetParent, 'exit', target);
            }
        }
    }

    get purpose() {
        const hasRepetition = this.planItem.definition.planItemControl.repetitionRule != undefined;
        const transition = this.planItem.definition.entryTransition;
        return `This condition causes ${hasRepetition ? 'the next ' : ''}'${this.planItem.name}' to ${transition}`;
    }

    createHalo() {
        return new EntryCriterionHalo(this);
    }

    get isEntryCriterion() {
        return true;
    }
}

export class ReactivateCriterionView extends SentryView {
    static create(planItem, x, y) {
        const definition = planItem.definition.createReactivateCriterion();
        const shape = planItem.case.diagram.createShape(x, y, 12, 20, definition.id);
        return new ReactivateCriterionView(planItem, definition, shape);
    }

    get markup() {
        return `<path style="pointer-events: bounding-box; fill:white; stroke:black; stroke-width:1" class="cmmn-shape cmmn-border cmmn-${this.constructor.name.toLowerCase()}-shape" d="M 3.827 2.137 L 9.807 1.377 L 5.657 8.494 L 11.141 7.923 L 2.696 19.454 L 5.157 11.663 L 0.787 12.164 C 0.85 12.173 3.827 2.137 3.827 2.137 Z" />`;
    }

    get purpose() {
        return `This condition causes '${this.planItem.name}' to reactivate - if it is in failed state`;
    }

    createHalo() {
        return new ReactivateCriterionHalo(this);
    }

    get isReactivateCriterion() {
        return true;
    }
}

export class ExitCriterionView extends SentryView {
    /**
     * 
     * @param {PlanItemView} planItem 
     * @param {*} x 
     * @param {*} y 
     */
    static create(planItem, x, y) {
        const definition = planItem.definition.createExitCriterion();
        const shape = planItem.case.diagram.createShape(x, y, 12, 20, definition.id);
        return new ExitCriterionView(planItem, definition, shape);
    }

    get purpose() {
        return `This condition causes '${this.planItem.name}' to stop`;
    }

    createHalo() {
        return new ExitCriterionHalo(this);
    }

    get isExitCriterion() {
        return true;
    }
}
