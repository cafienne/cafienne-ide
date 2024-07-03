'use strict';

import Util from "@util/util";
import MovableEditor from "./movableeditor";
import CaseView from "@ide/modeleditor/case/elements/caseview";
import $ from "jquery";

export default class StandardForm extends MovableEditor {

    /**
     * @param {CaseView} cs 
     * @param {String} label 
     * @param {Array<String>} classNames      * 
     */
    constructor(cs, label, ...classNames) {
        super(cs);
        this._label = label;
        this.classNames = classNames;
    }

    renderHead() {
        this.html = $(
`<div class="basicbox standardform ${this.classNames.join(' ')}">
    <div class="standardformheader">
        <label>${this.label}</label>
        <div class="button1st_right" title="Close">
            <img src="images/close_32.png" />
        </div>
    </div>
    <div class="standardformcontainer">
    </div>
</div>`);
        this.htmlParent.append(this.html);
        this.html.on('click', e => this.toFront());

        //add draggable to header
        this.html.draggable({ handle: '.standardformheader' });
        this.html.find('label').css('cursor', 'move');

        this.html.resizable();
        this.html.find('img').on('click', e => this.hide());

        this._container = this.html.find('.standardformcontainer');
    }

    renderData() {
        Util.clearHTML(this._container);
    }

    renderForm() {
        if (! this._html) {
            this.renderHead();
        }
        this.renderData();
    }

    get label() {
        return this._label;
    }

    set label(sLabel) {
        this._label = sLabel;
        this.html.find('.standardformheader label').html(sLabel);
    }

    get htmlContainer() {
        return this._container;
    }
}
