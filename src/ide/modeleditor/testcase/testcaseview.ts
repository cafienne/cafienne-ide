import TestcaseModelDefinition from "../../../repository/definition/testcase/testcasemodeldefinition";
import ShapeBox from "./shapebox/shapebox";
import TestcaseModelEditor from "./testcasemodeleditor";
import $ from "jquery";

export default class TestCaseView {
    html: JQuery<HTMLElement>;
    divTestCaseModel: JQuery<HTMLElement>;
    divShapeBox: JQuery<HTMLElement>;
    canvas: JQuery<HTMLElement>;
    paperContainer: JQuery<HTMLElement>;
    shapeBox: ShapeBox;

    constructor(public htmlParent: JQuery<HTMLElement>, 
        public editor: TestcaseModelEditor, 
        public definition: TestcaseModelDefinition) {
        this.html = $(
            `<div testcase="${this.definition.id}">
    <div class="testcasemodeler">
        <div class="basicbox basicform shapebox"></div>
        <div class="divTestCaseModel">
            <div class="divTestCaseContainer">
                <div class="divTestCaseCanvas basicbox">
                    <div class="paper-container-scroller">
                        <div class="paper-container" />
                        <div class="divResizers"></div>
                        <div class="divHalos"></div>
                        <div class="divMarker"></div>
                        <img class="halodragimgid" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>`);
        this.htmlParent.append(this.html);

        this.divTestCaseModel = this.html.find('.divTestCaseModel');
        this.divShapeBox = this.html.find('.shapebox');
        this.canvas = this.divTestCaseModel.find('.divTestCaseCanvas');
        this.paperContainer = this.html.find('.paper-container');

        this.shapeBox = new ShapeBox(this, this.divShapeBox);
    }

    public render(model: TestcaseModelDefinition) {
        // Render the model
    }
}
