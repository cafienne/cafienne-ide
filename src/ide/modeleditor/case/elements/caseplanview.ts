import CasePlanDefinition from "../../../../repository/definition/cmmn/caseplan/caseplandefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import ElementView from "../../../editors/modelcanvas/elementview";
import CaseView from "./caseview";
import CasePlanDecoratorBox from "./decorator/box/caseplandecoratorbox";
import ExitCriterionView from "./exitcriterionview";
import CasePlanHalo from "./halo/cmmn/caseplanhalo";
import CasePlanProperties from "./properties/caseplanproperties";
import StageView from "./stageview";

const CPM_TAB_HEIGHT = 22;

export default class CasePlanView extends StageView<CasePlanDefinition> {
    static createNew(cs: CaseView, x = 10, y = 10) {
        const definition = cs.caseDefinition.casePlan;
        const shape = cs.diagram.createShape(x, y, 800, 500, definition.id);
        return new CasePlanView(cs, definition, shape)
    }

    /**
     * Creates a new CasePlan model
      */
    constructor(cs: CaseView, definition: CasePlanDefinition, shape: ShapeDefinition) {
        super(cs, undefined, definition, shape);
        this.definition = definition;
    }

    referencesDefinitionElement(definitionId: string) {
        // Check whether the case parameters may be using the case file item
        if (this.case.caseDefinition.input.find(p => p.bindingRef.references(definitionId))) {
            return true;
        }
        if (this.case.caseDefinition.output.find(p => p.bindingRef.references(definitionId))) {
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
     */
    __renderBoundary(show: boolean) {
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

    surrounds(element: CasePlanView) {
        // Avoid the StageView.acquireChildren method to throw out elements outside the case plan (even though visually they can be dragged outside)
        return element != this;
    }

    get markup() {
        return `<polyline @selector='header' points="10,${CPM_TAB_HEIGHT} 15,0 250,0 255,${CPM_TAB_HEIGHT}" />
                <text @selector='label'/>
                <rect @selector='body'/>
                
                ${this.decoratorBox.markup}`;
    }

    get markupAttributes() {
        return {
            body: {
                x: 0,
                y: CPM_TAB_HEIGHT,
                width: 'calc(w)',
                height: 'calc(h - ' + CPM_TAB_HEIGHT + ')',
            },
            label: {
                ref: 'header',
                'ref-x': 0.5,
                'ref-y': 18,
                'x-alignment': 'middle',
                'y-alignment': 'bottom',
                'font-weight': 'bold',
            }
        };
    }

    /**
     * Override of basic resize method.
     */
    resizing(w: number, h: number) {
        super.resizing(w, h);
        // The rect must also be given some new dimensions
        this.html.find('.cmmn-border').attr('width', this.shape.width);
        this.html.find('.cmmn-border').attr('height', this.shape.height - CPM_TAB_HEIGHT);
    }

    __delete() {
        super.__delete();
        delete this.case.casePlanModel;
    }

    canHaveCriterion(criterionType: Function) {
        return criterionType == ExitCriterionView;
    }

    createCMMNChild(viewType: Function, x: number, y: number): ElementView<any> {
        if (viewType == ExitCriterionView) {
            return this.__addCMMNChild(ExitCriterionView.create(this, x, y));
        } else {
            return super.createCMMNChild(viewType, x, y);
        }
    }

    get isCasePlan() {
        return true;
    }
}
