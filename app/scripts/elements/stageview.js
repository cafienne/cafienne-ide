﻿class StageView extends TaskStageView {
    /**
     * 
     * @param {StageView} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.planItemDefinition.createPlanItem(StageDefinition);
        const shape = stage.case.diagram.createShape(x, y, 420, 140, definition.id);
        if (definition.definition instanceof StageDefinition) {
            return new StageView(stage, definition, definition.definition, shape);
        }
        console.error('Not supposed to reach this code');
    }

    /**
     * Creates a new StageView element.
     * @param {CMMNElementView} parent 
     * @param {PlanItem} definition
     * @param {StageDefinition} planItemDefinition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, planItemDefinition, shape) {
        super(parent, definition, planItemDefinition, shape);
        this.planItemDefinition = planItemDefinition;
        this.planItemDefinition.planItems.forEach(planItem => this.addPlanItem(planItem));
    }

    setDropHandlers() {
        super.setDropHandlers();
        // allow for dropping tasks directly from repository browser ...
        this.case.editor.ide.repositoryBrowser.setDropHandler(dragData => this.addTaskModel(dragData));
        // ... and case file items to be dropped from the cfiEditor
        this.case.cfiEditor.setDropHandler(dragData => this.addCaseFileItem(dragData));
    }

    removeDropHandlers() {
        super.removeDropHandlers();
        this.case.editor.ide.repositoryBrowser.removeDropHandler();
        this.case.cfiEditor.removeDropHandler();
    }

    /**
     * Add a 'drag-dropped' case file item
     * @param {CaseFileItemDragData} dragData 
     */
    addCaseFileItem(dragData) {
        const coor = this.case.getCursorCoordinates(dragData.event);
        this.__addCMMNChild(CaseFileItemView.create(this, coor.x, coor.y, dragData.item));
    }

    /**
     * Add a 'drag-dropped' task implementation
     * @param {DragData} dragData 
     */
    addTaskModel(dragData) {
        /** @type {TaskView} */
        const element = super.addElementView(dragData.shapeType, dragData.event);
        element.changeTaskImplementation(dragData, true);
    }

    /**
     * If a stage is moved, then it may be moved onto other plan items.
     * If that is the case, these items will change their parent to this stage.
     * Alternatively, if a stage is resized to a smaller size, items may fall out, and then get a new parent.
     */
    resetChildren() {
        const currentChildren = this.__childElements;
        // Only other plan items, case file items and textboxes can move in/out of us. Not planning tables or sentries.
        const allCaseItems = this.case.items.filter(item => !(item instanceof PlanningTableView) && !(item instanceof SentryView));
        // Create a collection of items we surround visually, but only the "top-level", not their children.
        const visuallySurroundedItems = allCaseItems.filter(item => this.surrounds(item) && !this.surrounds(item.parent));
        // Former children: those that are currently a descendant, but that we no longer surround visually.
        const formerChildren = allCaseItems.filter(item => currentChildren.indexOf(item) >= 0 && visuallySurroundedItems.indexOf(item) < 0);
        // New children: those that are currently not a descendant, but that we now surround visually.
        const newChildren = allCaseItems.filter(item => currentChildren.indexOf(item) < 0 && visuallySurroundedItems.indexOf(item) >= 0);
        formerChildren.forEach(child => child.changeParent(this.parent));
        newChildren.forEach(child => child.changeParent(this));
    }

    /**
     * Determines whether this stage visually surrounds the cmmn element.
     * @param {CMMNElementView} other 
     */
    surrounds(other) {
        // Note: this method is added here instead of directly invoking shape.surrounds because logic is different at caseplan level, so caseplan can override.
        return this.shape.surrounds(other.shape);
    }

    moved(x, y, newParent) {
        super.moved(x, y, newParent);
        this.resetChildren();
    }

    createProperties() {
        return new StageProperties(this);
    }

    createDecoratorBox() {
        return new StageDecoratorBox(this);
    }

    get __planningTablePosition() {
        return { x: 50, y: -9 };
    }

    /**
     * 
     * @param {PlanItem} definition 
     */
    addPlanItem(definition) {
        if (!definition.definition) {
            // there is no planitemdefinition for the planitem...
            console.warn('Plan item has NO definition and will be skipped', definition);
            return;
        }
        // Only add the new plan item if we do not yet visualize it
        if (!this.__childElements.find(planItemView => planItemView.definition.id == definition.id)) {
            return this.__addCMMNChild(this.createPlanItemView(definition));
        }
    }

    /**
     * Creates a new view (either HumanTaskView, CaseTaskView, ProcessTaskView, CasePlanView, MilestoneView, StageView, UserEvent, TimerEvent),
     * based on the given plan item. It will look for the planItemDefinition inside the plan item and take it's type to determine the view.
     * @param {PlanItem} definition 
     */
    createPlanItemView(definition) {
        const planItemDefinition = definition.definition;
        const shape = this.case.diagram.getShape(definition);
        if (! shape) {
            console.warn(`Error: missing shape definition for ${definition.definition.constructor.name} named "${definition.name}" with id "${definition.id}"`)
            return;
        }

        if (planItemDefinition instanceof HumanTaskDefinition) {
            return new HumanTaskView(this, definition, planItemDefinition, shape);
        } else if (planItemDefinition instanceof CaseTaskDefinition) {
            return new CaseTaskView(this, definition, planItemDefinition, shape);
        } else if (planItemDefinition instanceof ProcessTaskDefinition) {
            return new ProcessTaskView(this, definition, planItemDefinition, shape);
        } else if (planItemDefinition instanceof StageDefinition) {
            return new StageView(this, definition, planItemDefinition, shape);
        } else if (planItemDefinition instanceof MilestoneDefinition) {
            return new MilestoneView(this, definition, planItemDefinition, shape);
        } else if (planItemDefinition instanceof UserEventDefinition) {
            return new UserEvent(this, definition, planItemDefinition, shape);
        } else if (planItemDefinition instanceof TimerEventDefinition) {
            return new TimerEvent(this, definition, planItemDefinition, shape);
        } else {
            throw new Error('This type of plan item cannot be instantiated into a view' + definition.name);
        }
    }

    /**
     * Method invoked when a child is moved into this element from a different parent.
     * @param {CMMNElementView} childElement 
     */
    adoptItem(childElement) {
        const previousParent = childElement.parent;
        super.adoptItem(childElement);
        if (childElement instanceof PlanItemView) {
            // then also move the definition
            childElement.definition.switchParent(this.planItemDefinition);
            // If the item is discretionary, we may also have to clean up the former planning table and refresh ours.
            if (childElement.definition.isDiscretionary && previousParent && previousParent instanceof StageView) {
                previousParent.cleanupPlanningTableIfPossible();
                this.showPlanningTable();
            }
        }
    }

    cleanupPlanningTableIfPossible() {
        if (this.planningTableView) {
            if (this.planningTableView.definition.tableItems.length == 0) {
                this.planningTableView.__delete();
                return;
            }
        }
    }

    /**
     * Adds a discretionary item definition (that is, a PlanItem with .isDiscretionary set to true)
     * @param {PlanItem} definition 
     */
    addDiscretionaryItem(definition) {
        this.addPlanItem(definition);
    }

    createCMMNChild(cmmnType, x, y) {
        if (Util.isSubClassOf(PlanItemView, cmmnType)) {
            return this.__addCMMNChild(cmmnType.create(this, x, y));
        } else if (cmmnType == CaseFileItemView) {
            return this.__addCMMNChild(CaseFileItemView.create(this, x, y));
        } else if (cmmnType == TextAnnotationView) {
            return this.__addCMMNChild(TextAnnotationView.create(this, x, y));
        } else { // Could (should?) be sentry
            return super.createCMMNChild(cmmnType, x, y);
        }
    }

    //validation steps of a stage
    __validate() {
        super.__validate();

        this.validatePlanItemDefinitionNesting();
        this.autoCompleteDiscretionary();
        this.oneOrLessChildren();

        //check discretionary
        if (this.definition.isDiscretionary) {
            this.discretionaryStage();
        }
    }

    /**
     * check discretionary stage, NOT discretionary to child
     */
    discretionaryStage() {
        this.__getConnectedElements().forEach(connectedCMMNElement => {
            if (connectedCMMNElement.__planningTable) {
                // this discretionary stage is connected to another element for its' planning table
                this.__getDescendants().forEach(child => {
                    if (child == connectedCMMNElement) {
                        this.raiseValidationIssue(22, [this.name, this.case.name, connectedCMMNElement.name]);
                    }
                });
            }
        });
    }

    /**
     * A stage should have more than one child
     */
    oneOrLessChildren() {
        const numPlanItems = this.planItemDefinition.planItems.length;
        const planningTable = this.planItemDefinition.planningTable;
        const numDiscretionaryItems = planningTable ? planningTable.tableItems.length : 0;
        if (numPlanItems + numDiscretionaryItems <= 1) {
            //stage has one or less children
            this.raiseValidationIssue(13);
        }
    }

    /**
     * A stage with autocomplete=false should have discretionary items (and a planning table)
     */
    autoCompleteDiscretionary() {
        if (this.planItemDefinition.autoComplete == false) {
            const planningTable = this.planItemDefinition.planningTable;
            if (!planningTable || planningTable.tableItems.length == 0) {
                //no discretionary children found
                this.raiseValidationIssue(12);
            }
        }
    }

    /**
     * checks whether element refers for its' plan item definition to an ancestor or descendant
     */
    validatePlanItemDefinitionNesting() {
        const pidID = this.planItemDefinition.id;
        if (pidID) {
            // search parents/ancestors
            let parent = this.parent;
            while (parent) {
                if (parent.id == pidID) {
                    //the element refers for its' PID to a (grand)parent
                    this.raiseValidationIssue(9, [this.name, this.case.name, 'an ancestor or (grand)parent']);
                    return;
                }
                parent = parent.parent;
            }

            // Search children.
            const child = this.__getDescendants().find(child => child.id == pidID);
            if (child) {
                this.raiseValidationIssue(9, [this.name, this.case.name, 'a decendant or (grand)child']);
                return;
            }
        }
    }

    get markup() {
        return `<g class="scalable">
                    <polyline class="cmmn-shape cmmn-border cmmn-stage-shape" points=" 20,0 0,20 0,280 20,300 480,300 500,280 500,20 480,0 20,0" />
                </g>
                <text class="cmmn-bold-text" font-size="12" />
                ${this.decoratorBox.markup}`;
    }

    get textAttributes() {
        return {
            'text': {
                'ref': '.cmmn-shape',
                'ref-x': .5,
                'ref-y': 8,
                'x-alignment': 'middle',
                'y-alignment': 'top'
            }
        };
    }

    /**
     * returns true when an element of type 'elementType' can be added as a child to this element
     * @param {*} elementType 
     */
    __canHaveAsChild(elementType) {
        if (this.canHaveCriterion(elementType) ||
            elementType == HumanTaskView.name ||
            elementType == CaseTaskView.name ||
            elementType == ProcessTaskView.name ||
            elementType == MilestoneView.name ||
            elementType == UserEvent.name ||
            elementType == TimerEvent.name ||
            elementType == CaseFileItemView.name ||
            elementType == StageView.name ||
            elementType == TextAnnotationView.name) {
            return true;
        }
        return false;
    }
}
CMMNElementView.registerType(StageView, 'StageView', 'images/svg/collapsedstage.svg');
