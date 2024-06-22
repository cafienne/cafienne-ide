import CMMNDocumentationDefinition from "../../../../repository/definition/cmmndocumentationdefinition";
import CMMNElementDefinition from "../../../../repository/definition/cmmnelementdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Util from "../../../../util/util";
import CanvasElement from "./canvaselement";
import CaseView from "./caseview";
import Connector from "./connector";
// import Halo from "./halo/halo";
// BIG TODO HERE

export default class CMMNElementView extends CanvasElement {
    /**
     * Creates a new CMMNElementView within the case having the corresponding definition and x, y coordinates
     * @param {CaseView} cs
     * @param {CMMNElementView} parent
     * @param {CMMNElementDefinition} definition
     * @param {ShapeDefinition} shape 
     */
    constructor(cs, parent, definition, shape) {
        super(cs);
        if (! shape) {
            console.warn(`${this.constructor.name}[${definition.id}] does not have a shape`);
        }

        this.case = cs;
        this.case.items.push(this);
        this.parent = parent || cs; // For now let parent point either to actual cmmn element view or to case. Not so nice ...
        this.definition = definition;
        this.shape = shape;
        this.editor = this.case.editor;
        /** @type {Array<Connector>} */
        this.__connectors = []; // An array of the connectors this element has with other elements (both incoming and outgoing)
        /** @type {Array<CMMNElementView>} */
        this.__childElements = []; // Create an array to keep track of our children, such that we can render them later on. 
        if (this.parent.__childElements) { // Register with parent.
            this.parent.__childElements.push(this);
        }
        this.createJointElement();
        this.__resizable = true;
    }

    get id() {
        return this.definition.id;
    }

    get name() {
        return this.definition.name;
    }

    /**
     * Override this method to provide type specific Properties object
     * @returns {Properties}
     */
    createProperties() {
        throw new Error('Class ' + this.constructor.name + ' must implement the createProperties method');
    }

    /**
     * Removes properties view when the case is refreshed.
     * Can be used in sub classes to remove other element pop up views (e.g. workflow properties in a human task)
     */
    deletePropertiesView() {
        this.__properties && this.__properties.delete();
    }

    /**
     * Returns the raw html/svg element.
     * @returns {JQuery<HTMLElement>}
     */
    get html() {
        // Element's ID might contain dots, slashes, etc. Escape them with a backslash
        // Source taken from https://stackoverflow.com/questions/2786538/need-to-escape-a-special-character-in-a-jquery-selector-string
        // Could also use jquery.escapeSelector, but this method is only from jquery 3 onwards, which is not in this jointjs (?)
        const jquerySelector = '#' + this.html_id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&")
        return this.case.svg.find(jquerySelector);
    }

    /**
     * Returns the svg markup to be rendered by joint-js.
     * @returns {String}
     */
    get markup() {
        throw new Error('Class ' + this.constructor.name + ' must implement the markup method');
    }

    /** @returns {Object} */
    get textAttributes() {
        return {};
    }

    /**
     * Returns the text to be rendered inside the shape
     * @returns {String}
     */
    get text() {
        const documentation = this.definition.documentation.text;
        if (this.name === Util.withoutNewlinesAndTabs(documentation)) {
            return documentation;
        } else {
            return this.definition.name;
        }
    }

    /**
     * Properties show the documentation. For CaseFileItemView shape we also have
     * to render documentation, but there the "definition" refers to the shape instead
     * of the actual case file item; through this method CaseFileItemView shape can override the getter.
     * @returns {CMMNDocumentationDefinition}
     */
    get documentation() {
        return this.definition.documentation;
    }

    /**
     * Boolean indicating whether the text to be rendered must be wrapped or not.
     * @returns {Boolean}
     */
    get wrapText() {
        return false;
    }

    /**
     * Determines whether or not the cmmn element is our parent or another ancestor of us.
     * @param {CMMNElementView} potentialAncestor 
     */
    hasAncestor(potentialAncestor) {
        if (!potentialAncestor) return false;
        if (this.parent === potentialAncestor) return true;
        if (this.parent === this.case) return false;
        return this.parent.hasAncestor(potentialAncestor);
    }

    createJointElement() {
        // Copy definition id into a fixed internal html_id property to have a stable this.html search function
        this.html_id = this.definition.id;
        const jointSVGSetup = {
            // Markup is the SVG that is rendered through the joint element; we surround the markup with an addition <g> element that holds the element id
            markup: `<g id="${this.html_id}">${this.markup}</g>`,
            // Type is used to determine whether drag/drop is supported (element border coloring)
            type: this.constructor.name,
            // Take size and position from shape.
            size: this.shape,
            position: this.shape,
            // Attrs can contain additional relative styling for the text label inside the element
            attrs: this.textAttributes
        };
        this.xyz_joint = new joint.shapes.basic.Generic(jointSVGSetup);
        // Directly embed into parent
        if (this.parent && this.parent.xyz_joint) {
            this.parent.xyz_joint.embed(this.xyz_joint);
        }
        this.xyz_joint.on('change:position', e => {
            this.shape.x = this.xyz_joint.attributes.position.x;
            this.shape.y = this.xyz_joint.attributes.position.y;
        });
        // We are not listening to change of size, since this is only done through "our own" resizer
    }

    /**
     * Determines whether the cursor is near the element, i.e., within a certain range of 'distance' pixels around this element.
     * Used to show/hide the halo of the element.
     * distance is a parameter to distinguish between moving from within to outside the element, or moving from outside towards the element.
     * In case.js, moving towards an element is "near" when within 10px, moving out of an element can be done up to 40px. 
     * 
     * @param {*} e 
     * @param {Number} distance
     */
    nearElement(e, distance) {
        const offset = this.html.offset();

        // EventListenerView somehow have an unclear and weird positioning with jointjs. Hence we need to do some correction for that.
        //  Note that this is still not a flawless improvement :(
        const left = this.isEventListener ? offset.left - 0.5 * distance : offset.left - distance;
        const right = this.isEventListener ? offset.left + this.shape.width + 1.5 * distance : offset.left + this.shape.width + distance;
        const top = offset.top - distance;
        const bottom = offset.top + this.shape.height + distance;
        const x = e.clientX;
        const y = e.clientY;

        return x > left && x < right && y > top && y < bottom;
    }

    mouseEnter() {
        this.setDropHandlers();
    }

    mouseLeave() {
        this.removeDropHandlers();
    }

    /**
     * Method invoked when mouse hovers on the element
     */
    setDropHandlers() {
        this.case.shapeBox.setDropHandler(dragData => this.addElementView(dragData.shapeType, dragData.event), dragData => this.__canHaveAsChild(dragData.shapeType));
    }

    /**
     * Method invoked when mouse leaves the element.
     */
    removeDropHandlers() {
        this.case.shapeBox.removeDropHandler();
    }

    /**
     * Adds a new shape in this element with the specified shape type.
     * @param {String} shapeType
     * @param {*} e
     */
    addElementView(shapeType, e) {
        const coor = this.case.getCursorCoordinates(e);
        const cmmnType = CMMNElementView.constructors[shapeType];
        const cmmnElement = this.createCMMNChild(cmmnType, Grid.snap(coor.x), Grid.snap(coor.y));
        // Now select the newly added element
        this.case.clearSelection();
        // Show properties of new element
        cmmnElement.propertiesView.show(true);
        return cmmnElement;
    }

    /**
     * Creates a cmmn child under this element with the specified type, and renders it at the given position.
     * @param {Function} cmmnType 
     * @param {Number} x 
     * @param {Number} y 
     * @returns {CMMNElementView} the newly created CMMN child
     */
    createCMMNChild(cmmnType, x, y) {
        throw new Error('Cannot create an element of type' + cmmnType.name);
    }

    /**
     * Informs the element to render again after a change to the underlying definition has happened.
     */
    refreshView() {
        if (this.case.loading) {
            // No refreshing when still loading.
            //  This method is being invoked from Connector's constructor when case is being loaded
            // NOTE: overrides of this method should actually also check the same flag (not all of them do...)
            return;
        }
        this.refreshText();
        this.refreshSubViews();
        this.__childElements.forEach(child => child.refreshView());
    }

    /**
     * Invoked from the refreshView. Assumes there is a text element inside the joint element holding the text to display on the element.
     */
    refreshText() {
        const rawText = this.text;
        const formattedText = this.wrapText ? joint.util.breakText(rawText, { width: this.shape.width, height: this.shape.height }) : rawText;
        this.xyz_joint.attr('text/text', formattedText);
    }

    refreshSubViews() {
        this.refreshHalo();
        this.refreshProperties();
    }

    refreshHalo() {
        if (this._halo && this._halo.visible) {
            this._halo.refresh();
        }
    }

    refreshProperties() {
        if (this.__properties && this.__properties.visible) {
            this.__properties.refresh();
        }
    }

    /**
     * Returns the "nice" type description of this CMMN Element.
     * Sub classes must implement this, otherwise an error is thrown.
     * @returns {String}
     */
    get typeDescription() {
        if (!this.constructor.typeDescription) {
            throw new Error(`The type ${this.constructor.name} does not have an typeDescription function ?!`);
        }
        return this.constructor.typeDescription;
    }

    /**
     * BELOW METHODS ARE FOR COMPATIBILITY ONLY.
     * It would be better to change all invocations to access the xyz_joint directly.
     */

    get attributes() {
        return this.xyz_joint.attributes;
    }

    /**
     * Returns the joint constructor for this element. I.e., the function with which the joint element can be created.
     * @returns {Function}
     */
    getJointConstructor() {
        throw new Error('This class does not have a joint constructor?!')
    }

    /**
     * BELOW METHODS ARE 'REAL' CMMNElementView methods
     */

    /**
     * Method invoked after a role or case file item has changed
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) {
        this.propertiesView.refreshReferencingFields(definitionElement);
    }

    /**
     * @returns {Properties}
     */
    get propertiesView() {
        if (!this.__properties) {
            this.__properties = this.createProperties(); // Create an object to hold the element properties.
        }
        return this.__properties;
    }

    get resizer() {
        if (!this._resizer) {
            this._resizer = new Resizer(this);
        }
        return this._resizer;
    }

    deleteResizer() {
        if (this._resizer) this.resizer.delete();
    }

    get marker() {
        if (!this._marker) {
            this._marker = new Marker(this);
        }
        return this._marker;
    }

    deleteMarker() {
        if (this._marker) this.marker.delete();
    }

    createHalo() {
        return new Halo(this);
    }

    deleteHalo() {
        if (this._halo) this.halo.delete();
    }

    get halo() {
        if (!this._halo) {
            // Creating the halo and it's content in 2 phases to give flexibility.
            this._halo = this.createHalo();
            this._halo.createItems();
        }
        return this._halo;
    }

    /**
     * Invoked when an element is (de)selected.
     * Shows/removes a border, halo, resizer.
     * @param {Boolean} selected 
     */
    __select(selected) {
        if (selected) {
            //do not select element twice
            Util.addClassOverride(this.html.find('.cmmn-shape'),'cmmn-selected-element');
            // this.html.find('.cmmn-shape').addClass('cmmn-selected-element');
            this.__renderBoundary(true);
        } else {
            // Give ourselves default color again.
            Util.removeClassOverride(this.html.find('.cmmn-shape'),'cmmn-selected-element');
            // this.html.find('.cmmn-shape').removeClass('cmmn-selected-element');
            this.propertiesView.hide();
            this.__renderBoundary(false);
        }
    }

    /**
     * Show or hide the halo and resizer
     * @param {Boolean} show 
     */
    __renderBoundary(show) {
        this.resizer.visible = show;
        this.halo.visible = show;
    }

    /**
     * Resizes the element, move sentries and decorators
     * @param {Number} w
     * @param {Number} h
     */
    __resize(w, h) {
        if (w < 0) w = 0;
        if (h < 0) h = 0;

        this.shape.width = w;
        this.shape.height = h;
        // Also have joint resize
        this.xyz_joint.resize(w, h);
        // Refresh the description to apply new text wrapping
        this.refreshText();
    }
    
    moved(x, y, newParent) {
        // Check if this element can serve as a new parent for the cmmn element
        if (newParent && newParent.__canHaveAsChild(this.constructor.name) && newParent != this.parent) {
            // check if new parent is allowed
            this.changeParent(newParent);
        }
    }

    /**
     * Adds an element to another element, implements element.__addElement
     * @param {CMMNElementView} cmmnChildElement
     */
    __addCMMNChild(cmmnChildElement) {
        return this.case.__addElement(cmmnChildElement);
    }

    /**
     * When a item is moved from one stage to another, this method is invoked
     * @param {CMMNElementView} newParent 
     */
    changeParent(newParent) {
        const currentParent = this.parent;
        currentParent.releaseItem(this);
        newParent.adoptItem(this);
    }

    /**
     * Adds the item to our list of children, and embeds it in the joint structure of this element.
     * It is an existing item in the case.
     * @param {CMMNElementView} childElement 
     */
    adoptItem(childElement) {
        childElement.parent = this;
        this.__childElements.push(childElement);
        this.xyz_joint.embed(childElement.xyz_joint);
        // Also move the child's joint element toFront, to make sure it gets mouse attention before the parent.
        //  "deep" option also brings all descendents to front, maintaining order
        childElement.xyz_joint.toFront({
            deep: true
        });
    }

    /**
     * Removes the imte from our list of children, and also unembeds it from the joint structure.
     * Does not delete the item.
     * @param {CMMNElementView} childElement 
     */
    releaseItem(childElement) {
        this.xyz_joint.unembed(childElement.xyz_joint);
        Util.removeFromArray(this.__childElements, childElement);
    }

    /**
     * Method invoked on all case elements upon removal of an element.
     * If there are references to the element to be removed, it can be handled here.
     * @param {CMMNElementView} cmmnElement 
     */
    __removeReferences(cmmnElement) {
        if (cmmnElement.parent == this) {
            // Perhaps also render the parent again?? Since this element about to be deleted ...
            Util.removeFromArray(this.__childElements, cmmnElement);
        }
    }

    /**
     * delete and element and its' children if available
     */
    __delete() {
        // Deselect ourselves if we are selected, to avoid invocation of __select(false) after we have been removed.
        if (this.case.selectedElement == this) {
            this.case.selectedElement = undefined;
        }

        // First, delete our children.
        while (this.__childElements.length > 0) {
            this.__childElements[0].__delete();
        }

        // Remove resizr, halo and propertiesview; but only if they have been created
        this.deleteSubViews();

        this.__connectors.forEach(connector => connector.remove());

        // Next, inform other elements we're gonna go
        this.case.items.forEach(cmmnElement => cmmnElement.__removeReferences(this));

        // Remove the shape from the definitions
        this.shape.removeShape();

        // Now remove our definition element from the case (overridden in CaseFileItemView, since that only needs to remove the shape)
        this.__removeElementDefinition();

        // Delete us from the case
        Util.removeFromArray(this.case.items, this);

        // Finally remove the UI element as well. 
        this.xyz_joint.remove();
    }

    deleteSubViews() {
        this.deleteResizer();
        this.deleteMarker();
        this.deleteHalo();
        this.deletePropertiesView();
    }

    __removeElementDefinition() {
        // Also let the definition side of the house know we're leaving
        console.groupCollapsed(`Removing definition for ${this}`);
        this.definition.removeDefinition();
        console.groupEnd();
    }

    /**
     * creates a connector between the element and the target.
     * @param {CMMNElementView} target
     * @returns {Connector}
     */
    __connect(target) {
        const connector = Connector.createConnector(this, target);
        this.case.editor.completeUserAction();
        return connector;
    }

    /**
     * Registers a connector with this element.
     * @param {Connector} connector 
     */
    __addConnector(connector) {
        this.__connectors.push(connector);
    }

    /**
     * This method is invoked on the element if it created a connection to the target CMMNElementView
     * @param {CMMNElementView} target 
     */
    __connectTo(target) { }

    /**
     * This method is invoked on the element if a connection to it was made from the source CMMNElementView
     * @param {CMMNElementView} source 
     */
    __connectFrom(source) { }

    /**
     * Removes a connector from the registration in this element.
     * @param {Connector} connector 
     */
    __removeConnector(connector) {
        Util.removeFromArray(this.__connectors, connector);
    }

    /**
     * returns an array of elements that are connected (through a link/connector) with this element
     * @returns {Array<CMMNElementView>}
     */
    __getConnectedElements() {
        const connectedCMMNElements = [];
        this.__connectors.forEach(connector => {
            if (!connectedCMMNElements.find(cmmnElement => connector.source == cmmnElement || connector.target == cmmnElement)) {
                connectedCMMNElements.push(connector.source == this ? connector.target : connector.source);
            }
        });
        return connectedCMMNElements;
    }

    /**
     * Returns the connector between this and the target element with the specified id,
     * or null
     * @param {String} targetId 
     * @returns {Connector}
     */
    __getConnector(targetId) {
        return this.__connectors.find(c => c.hasElementWithId(targetId));
    }

    /**
     * returns true if this element can contain elements of type 'elementType'.
     * By default it returns false
     * @param {String} elementType 
     * @returns {Boolean}
     */
    __canHaveAsChild(elementType) {
        return false;
    }

    /**
     * Determine whether this element can have a criterion added with the specified type.
     * @param {String} criterionType 
     * @returns {Boolean}
     */
    canHaveCriterion(criterionType) {
        return false;
    }

    /**
     * Add a criterion to this element sourcing the incoming element.
     * Default implementation is empty, task, stage, caseplan and milestone can override it.
     * @param {string} criterionType 
     * @param {CMMNElementView} sourceElement 
     * @param {JQuery<Event>} e event indicating x and y position of cursor
     */
    createCriterionAndConnect(criterionType, sourceElement, e) {
        // Create a new criterion and add the source as an on part
        this.addElementView(criterionType, e).adoptOnPart(sourceElement);
    }

    /**
     * Hook for sentries to override.
     * @param {CMMNElementView} sourceElement 
     */
    adoptOnPart(sourceElement) {
    }

    /**
     * Hook for sentries to override.
     */
    updateConnectorLabels() {        
    }

    /**
     * validate: all steps to check this element
     */
    __validate() { }

    /**
     * Raises a validation error/warning with the Case
     * @param {Number} number 
     * @param {Array<String>} parameters 
     */
    raiseValidationIssue(number, parameters = []) {
        if (parameters.length == 0) { // Default parameters are element name and case name
            parameters.push(this.name);
            parameters.push(this.case.name);
        }
        this.case.validator.raiseProblem(this.id, number, parameters);
    }

    /**
     * returns an array with all the joint (!) descendants of the element
     * @returns {Array<CMMNElementView>}
     */
    __getDescendants() {
        const allDescendants = [];
        this.__childElements.forEach(cmmnChild => this.addDescendantChild(cmmnChild, allDescendants));
        return allDescendants;
    }


    /**
     * Adds the cmmnElement and all its descendants to the array
     * @param {CMMNElementView} cmmnElement 
     * @param {Array} allDescendents 
     */
    addDescendantChild(cmmnElement, allDescendents) {
        allDescendents.push(cmmnElement);
        cmmnElement.__childElements.forEach(grantChild => this.addDescendantChild(grantChild, allDescendents));
    }

    /**
     * Returns true when this element references the definitionId (typically a casefile item or a role)
     * @param {String} definitionId 
     */
    referencesDefinitionElement(definitionId) {
        return false;
    }

    get __type() {
        return `${this.constructor.name}[${this.id}]`;
    }

    toString() {
        return this.__type;
    }

    /**
     * Method invoked on an element to enforce move constraints (e.g. sentries cannot be placed in the midst of an element)
     * @param {Number} x 
     * @param {Number} y 
     */
    __moveConstraint(x, y) { }

    /**
     * Registers a class that extends CMMNElementView by it's name.
     * @param {Function} cmmnElementType 
     * @param {String} typeDescription Friendly description of the type
     * @param {String} smallImageURL url of small image (for drag/drop, shapebox, etc.)
     * @param {String} menuImageURL optional url of image shown in repository browser
     */
    static registerType(cmmnElementType, typeDescription, smallImageURL = '', menuImageURL = smallImageURL) {
        CMMNElementView.constructors[cmmnElementType.name] = cmmnElementType;
        cmmnElementType.typeDescription = typeDescription;
        cmmnElementType.smallImage = smallImageURL;
        cmmnElementType.menuImage = menuImageURL;
    }

    get isPlanItem() {
        return false;
    }

    get isTask() {
        return false;
    }

    get isTaskOrStage() {
        return false;
    }

    get isMilestone() {
        return false;
    }

    get isEventListener() {
        return false;
    }

    get isUserEvent() {
        return false;
    }

    get isTimerEvent() {
        return false;
    }

    get isStage() {
        return false;
    }

    get isCasePlan() {
        return false;
    }

    get isCaseTask() {
        return false;
    }

    get isProcessTask() {
        return false;
    }

    get isHumanTask() {
        return false;
    }

    get isCriterion() {
        return false;
    }

    get isEntryCriterion() {
        return false;
    }

    get isExitCriterion() {
        return false;
    }

    get isReactivateCriterion() {
        return false;
    }

    get isPlanningTable() {
        return false;
    }

    get isCaseFileItem() {
        return false;
    }

    get isTextAnnotation() {
        return false;
    }
}
CMMNElementView.constructors = {};
