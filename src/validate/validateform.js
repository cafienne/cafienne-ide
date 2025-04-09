﻿﻿import $ from "jquery";
import StandardForm from "../ide/editors/standardform";
import CaseView from "../ide/modeleditor/case/elements/caseview";
import Settings from "../ide/settings/settings";
import HtmlUtil from "../ide/util/htmlutil";
import Images from "../ide/util/images/images";
import Remark from "../repository/validate/remark";
import Validator from "../repository/validate/validator";
import ProblemType from "./problemtype";
import ValidationSettings from "./validationsettings";

export default class ValidateForm extends StandardForm {
    /** @returns {ValidationSettings} */
    static get Settings() {
        if (!ValidateForm._settings) {
            ValidateForm._settings = Object.assign(new ValidationSettings, Settings.validations);
        }
        return ValidateForm._settings;
    }

    /**
     * This object handles the validation of the CMMN schema drawn by the user;
     * If holds track of the problems found in the CMMN schema of the case; these problems have a @type {ProblemType}
     * @param {CaseView} cs
     */
    constructor(cs) {
        super(cs, '');
        if (ValidateForm.Settings.visible) {
            this.show();
        } else {
            this.hide();
        }
        this.html = $(
            `<div class="basicbox basicform" id="validateformid">
                <div class="formheader">
                    <label>
                        <span>Problems (</span>
                        <span id="validateheadernoerrorsid">0</span>
                        <span>&nbsp;Errors,</span>
                        <span id="validateheadernowarningsid">0</span>
                        <span>&nbsp;Warnings,</span>
                        <span id="validateheadernohiddenid">0</span>
                        <span>&nbsp;Hidden)</span>
                    </label>
                    <div class="formclose">
                        <img src="${Images.Close}" />
                    </div>
                </div>
                <div class="headerrowmenu">
                </div>
                <div class="formbody">
                    <div class="headerrowlabels">
                        <div class="problemmodel">
                            <label>Model Definition</label>
                        </div>
                        <div class="problemtype"></div>
                        <div class="problemdescription">
                            <label>Description</label>
                        </div>
                    </div>
                    <div class="problemcontainer"></div>
                </div>
            </div>`);
        this.htmlParent.append(this.html);
        this.containers = this.html.find('.problemcontainer');

        //set header handlers
        this.html.draggable({ handle: '.formheader' });
        this.html.resizable();
        this.html.find('.formclose').on('click', () => this.hide());
    }

    renderHead() {
    }

    renderForm() {
        if (!this._html) {
            this.renderHead();
        }
    }

    renderData() {
        if (!this.visible) {
            this.renderForm();
        }
    }

    /**
     * determines the initial problem form position (bottom right)
     */
    positionEditor() {
        const wForm = this.html.width();
        const hForm = this.html.height();

        const wBody = this.case.editor.html.width();
        const hBody = this.case.editor.html.height();

        this.html.css('left', wBody - wForm - 30);
        this.html.css('top', hBody - hForm - 30);
    }

    onShow() {
        ValidateForm.Settings.visible = true;
        // this.showProblemsInForm();
    }

    onHide() {
        ValidateForm.Settings.visible = false;
    }

    /**
     * 
     * @param {Validator} validator 
     */
    loadRemarks(validator) {
        if (ValidateForm.Settings.visible) {
            this.show();
        } else {
            this.hide();
        }
        // Shows the number of errors and warnings in the case footer
        const iErrors = validator.errors.length;
        const iWarnings = validator.warnings.length;

        // Update IDE Footer
        const validateLabel = $('.validateLabel');
        validateLabel.html(`CMMN Validation found ${iErrors} problem${iErrors == 1 ? '' : 's'} and ${iWarnings} suggestion${iWarnings == 1 ? '' : 's'}`);
        validateLabel.css('color', iErrors > 0 ? 'red' : iWarnings > 0 ? 'orange' : 'grey');
        if (iErrors == 0 && iWarnings == 0) {
            validateLabel.html('');
        }

        this.showProblemsInForm(validator);
    }

    /**
     * fills the html problem container with the created problems, first show errors then warnings
     * @param {Validator} validator 
     */
    showProblemsInForm(validator) {
        // Clear the old problems in the form
        HtmlUtil.clearHTML(this.containers);
        // validator.problems.forEach(p => this.addProblemRow(p));

        // Sort the problems; first render the errors, then only the warnings
        validator.errors.filter(e => e.modelDefinition === this.case.caseDefinition).forEach(p => this.addProblemRow(p));
        validator.warnings.forEach(p => this.addProblemRow(p));
        validator.errors.filter(e => e.modelDefinition !== this.case.caseDefinition).forEach(p => this.addProblemRow(p));

        const iErrors = validator.errors.length;
        const iWarnings = validator.warnings.length;
        const iHidden = iErrors + iWarnings - this.html.find('.problemrow').length;

        this.html.find('#validateheadernoerrorsid').html(iErrors);
        this.html.find('#validateheadernowarningsid').html(iWarnings);
        this.html.find('#validateheadernohiddenid').html(iHidden);
    }

    /**
     * create a html str for a problem and adds it to the problemContainer
     * problem     : object having the problem properties
     * @param {Remark} remark
     */
    addProblemRow(remark) {
        const link = remark.modelDefinition === this.case.caseDefinition ? '' : '#' + remark.modelDefinition.file.fileName;
        const html = $(`<div class="problemrow">
            <div class="problemmodel">
                <a href="${'#' + remark.modelDefinition.file.fileName}">${remark.element.modelDefinition.file.fileName}</a>
            </div>
            <div class="problemtype" title="${remark.number || 0}">
                <img src="${remark.isError() ? Images.Error : Images.Warning}"></img>
            </div>
            <div class="problemdescription">
                ${remark.description}
            </div>
        </div>`);
        html.on('click', e => this.case.highlight(remark));
        this.containers.append(html);
    }
}
