import CasePlanDefinition from "@definition/cmmn/caseplan/caseplandefinition";
import ShapeDefinition from "@definition/dimensions/shape";
import CaseView from "./caseview";
import CasePlanDecoratorBox from "./decorator/box/caseplandecoratorbox";
import CasePlanProperties from "./properties/caseplanproperties";
import { ExitCriterionView } from "./sentryview";
import StageView from "./stageview";
import CasePlanHalo from "./halo/caseplanhalo";

const CPM_TAB_HEIGHT = 22;

export default class CasePlanView extends StageView {
    /**
     * 
     * @param {CaseView} cs 
     * @param {*} x 
     * @param {*} y 
     */
    static create(cs, x = 10, y = 10) {
        const definition = cs.caseDefinition.getCasePlan();
        const shape = cs.diagram.createShape(x, y, 800, 500, definition.id);
        return new CasePlanView(cs, definition, shape)
    }

    /**
     * Creates a new CasePlan model
     * @param {CaseView} cs Must be the CaseView object itself.
     * @param {CasePlanDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(cs, definition, shape) {
        super(cs, undefined, definition, shape);
        this.definition = definition;
    }

    referencesDefinitionElement(definitionId) {
        // Check whether the case parameters may be using the case file item
        if (this.case.caseDefinition.input.find(p => p.bindingRef == definitionId)) {
            return true;
        }
        if (this.case.caseDefinition.output.find(p => p.bindingRef == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    createProperties() {
        return new CasePlanProperties(this);
    }

    createHalo() {
        return new CasePlanHalo(this);
    }

    createDecoratorBox() {
        return new CasePlanDecoratorBox(this);
    }

    /**
     * Show or hide the halo and resizer
     * @param {Boolean} show 
     */
    __renderBoundary(show) {
        if (this.case.selectedElement === this) {
            this.resizer.visible = true;
        } else {
            this.resizer.visible = false;
        }
        this.halo.visible = true;
    }

    hideHalo() {
        this.halo.visible = false;
    }

    get __planningTablePosition() {
        return { x: 280, y: 13 };
    }

    surrounds(element) {
        // Avoid the StageView.acquireChildren method to throw out elements outside the case plan (even though visually they can be dragged outside)
        return element != this;
    }

    get markup() {
        return `<g>
                    <polyline class="cmmn-shape cmmn-border cmmn-caseplan-header-shape" points="10,${CPM_TAB_HEIGHT} 15,0 250,0 255,${CPM_TAB_HEIGHT}" />
                    <text class="cmmn-bold-text" font-size="12" />
                    <rect class="cmmn-shape cmmn-border cmmn-caseplan-shape" x="0" y="${CPM_TAB_HEIGHT}" width="${this.shape.width}" height="${this.shape.height - CPM_TAB_HEIGHT}"/>
                </g>
                ${this.decoratorBox.markup}`;
    }

    get textAttributes() {
        return {
            'text': {
                'ref': '.cmmn-shape',
                'ref-x': .5,
                'ref-y': 18,
                'x-alignment': 'middle',
                'y-alignment': 'bottom'
            }
        };
    }

    /**
     * Override of basic resize method.
     * @param {*} w 
     * @param {*} h 
     */
    __resize(w, h) {
        super.__resize(w, h);
        // The rect must also be given some new dimensions
        this.html.find('.cmmn-border').attr('width', this.shape.width);
        this.html.find('.cmmn-border').attr('height', this.shape.height - CPM_TAB_HEIGHT);
    }

    __delete() {
        super.__delete();
        delete this.case.casePlanModel;
    }

    canHaveCriterion(criterionType) {
        return criterionType == ExitCriterionView.name;
    }

    createCMMNChild(cmmnType, x, y) {
        if (cmmnType == ExitCriterionView) {
            return this.__addCMMNChild(ExitCriterionView.create(this, x, y));
        } else {
            return super.createCMMNChild(cmmnType, x, y);
        }
    }

    get isCasePlan() {
        return true;
    }
}
