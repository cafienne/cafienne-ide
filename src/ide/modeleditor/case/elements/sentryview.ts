import { g } from '@joint/core';
import CaseFileItemTransition from "../../../../repository/definition/cmmn/casefile/casefileitemtransition";
import PlanItem from "../../../../repository/definition/cmmn/caseplan/planitem";
import PlanItemTransition from "../../../../repository/definition/cmmn/caseplan/planitemtransition";
import CriterionDefinition from "../../../../repository/definition/cmmn/sentry/criteriondefinition";
import OnPartDefinition from "../../../../repository/definition/cmmn/sentry/onpartdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Connector from '../../../editors/modelcanvas/connector/connector';
import CaseElementView from "./caseelementview";
import CaseFileItemView from "./casefileitemview";
import CaseConnector from "./connector/caseconnector";
import PlanItemView from "./planitemview";
import SentryProperties from "./properties/sentryproperties";

export default abstract class SentryView<CD extends CriterionDefinition = CriterionDefinition>
    extends CaseElementView<CD> {
    /**
     * Creates a new SentryView element.
     * Is an abstract sub class for EntryCriterionView and ExitCriterionView.
     */
    constructor(public parent: PlanItemView, definition: CD, shape: ShapeDefinition) {
        super(parent.canvas, parent, definition, shape);
        this.__resizable = false;
    }

    /**
     * Override select in both planningtable and sentry to immediately show properties.
     */
    __select(selected: boolean) {
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

    adoptOnPart(sourceElement: CaseElementView) {
        // Also connect the sentry with the source element to create a corresponding on-part
        sourceElement.__connect(this);

        if (sourceElement.isPlanItem) {
            const changedOnPart = this.definition.createPlanItemOnPart();
            changedOnPart.sourceRef.update(sourceElement.id);
            changedOnPart.standardEvent = (sourceElement.definition as PlanItem).defaultTransition;
        }

        this.updateConnectorLabels();
        this.propertiesView.refresh();
    }

    updateConnectorLabels() {
        const style = this.canvas.diagram.connectorStyle;

        this.__connectors.forEach((connector: Connector) => {
            const onPart = this.__getOnPart(connector);
            if (style.isNone) {
                connector.label = '';
            } else {
                if (!onPart || !onPart.source) {
                    // Only update if we have a source
                    return;
                }
                const defaultTransition = onPart.source.defaultTransition;
                if (style.isDefault && onPart.standardEvent == defaultTransition) {
                    connector.label = '';
                } else {
                    connector.label = onPart.standardEvent.toString();
                }
            }
        });
    }

    /**
     * set a standard event to a sentry with value element, standardEvent
     * When the dataNode exists for the element, look up and set standardEvent
     * When the dataNode does not exist (no entry for the element yet)-> create
     * Return the dataNode
     */
    setPlanItemOnPart(source: PlanItemView, defaultEvent: PlanItemTransition, exitCriterion?: SentryView) {
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
     */
    setCaseFileItemOnPart(source: CaseFileItemView, defaultEvent: CaseFileItemTransition) {
        if (source.definition.isEmpty) {
            // Do not create an onpart if the definition is not set.
            return;
        }
        if (!this.definition.caseFileItemOnParts.find(onPart => onPart.sourceRef.references(source.definition))) {
            const newOnPart = this.definition.createCaseFileItemOnPart();
            newOnPart.sourceRef.update(source.definition);
            newOnPart.standardEvent = defaultEvent;
        }
    }

    get markup() {
        return `
        <polyline @selector='body' style="pointer-events: bounding-box;" points="6,0  0,10  6,20  12,10 6,0">
            <title class="tooltip"></title>
        </polyline>`;
    }

    get markupAttributes() {
        return {
            body: {
                fill: this.color,
            }
        };
    }

    abstract get color(): string;

    resizing() {
        console.error('Cannot resize a sentry');
    }

    moved(x: number, y: number, newParent: CaseElementView) {
    }

    /**
     * when moving a sentry, it can only move along the edge of its' parent
     */
    moving(x: number, y: number) {
        const parentElement = this.parent.xyz_joint;
        if (!parentElement) return;

        const sX = this.position.x;
        const sY = this.position.y;
        const sH = this.size.height;
        const sW = this.size.width;

        const shapeCenter = new g.Point(sX + (sW / 2), sY + (sH / 2));
        const boundaryPoint = parentElement.getBBox().pointNearestToPoint(shapeCenter);

        const sentryTranslateX = boundaryPoint.x - shapeCenter.x;
        const sentryTranslateY = boundaryPoint.y - shapeCenter.y;

        if (sentryTranslateX != 0 || sentryTranslateY != 0) {
            this.xyz_joint.translate(sentryTranslateX, sentryTranslateY);
        }
    }

    /**
     * returns array with all planItems/sentries that can be connected to the sentry
     */
    __getConnectableElements(): CaseElementView[] {
        const connectableElements = this.canvas.items.filter(cmmnElementView => {
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
            if (cmmnElementView.isPlanItem && (cmmnElementView as PlanItemView).definition.isDiscretionary) {
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

    protected adoptOutgoingConnector(connector: CaseConnector) {
        this.connectElement(connector.target);
    }

    protected adoptIncomingConnector(connector: CaseConnector) {
        this.connectElement(connector.source);
    }

    private connectElement(target: CaseElementView) {
        if (target.isCaseFileItem) {
            this.setCaseFileItemOnPart(target as CaseFileItemView, CaseFileItemTransition.Create);
        } else if (target.isPlanItem) {
            this.setPlanItemOnPart(target as PlanItemView, (target.definition as PlanItem).defaultTransition);
        } else if (target.isCriterion) {
            this.__connectSentry(target);
        }
        if (this.propertiesView.visible) {
            this.propertiesView.show();
        }
    }

    __getOnPart(connector: Connector): OnPartDefinition<any> | undefined {
        const planItemOnPart = this.definition.planItemOnParts.find(onPart => connector.hasElementWithId(onPart.sourceRef.value));
        if (planItemOnPart) return planItemOnPart;
        return this.definition.caseFileItemOnParts.find(onPart => {
            const casefileElement = this.canvas.getCaseFileItemElement(onPart.sourceRef.value);
            if (casefileElement) return connector.hasElementWithId(casefileElement.id);
        });
    }

    __connectSentry(target: CaseElementView) {
        // Empty implementation; only EntryCriteria can connect to other sentries.
    }

    referencesDefinitionElement(definitionId: string) {
        if (this.definition.ifPart && this.definition.ifPart.contextRef.references(definitionId)) {
            return true;
        }
        if (this.definition.caseFileItemOnParts.find(onPart => onPart.sourceRef.references(definitionId))) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    /**
     * @returns the purpose of the sentry (whether it activates, re-activates or exits the item)
     */
    abstract get purpose(): string;

    get isCriterion() {
        return true;
    }
}
