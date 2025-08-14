'use strict';

import $ from "jquery";
import DocumentableElementDefinition from "../../repository/definition/documentableelementdefinition";
import GraphicalModelDefinition from "../../repository/definition/graphicalmodeldefinition";
import HtmlUtil from "../util/htmlutil";
import Images from "../util/images/images";
import ElementView from "./modelcanvas/elementview";
import ModelCanvas from "./modelcanvas/modelcanvas";
import MovableEditor from "./movableeditor";

export default class StandardForm<
    ModelDefT extends GraphicalModelDefinition = GraphicalModelDefinition,
    ViewT extends ElementView<DocumentableElementDefinition<ModelDefT>> = ElementView<DocumentableElementDefinition<ModelDefT>>>

    extends MovableEditor<ModelDefT, ViewT> {
    private _label: string;
    classNames: string[];
    _container?: JQuery<HTMLElement>;

    constructor(canvas: ModelCanvas<ModelDefT, DocumentableElementDefinition<ModelDefT>, ViewT>, label: string, ...classNames: string[]) {
        super(canvas);
        this._label = label;
        this.classNames = classNames;
    }

    renderHead() {
        this.html = $(
            `<div class="basicbox standardform ${this.classNames.join(' ')}">
    <div class="standardformheader">
        <label>${this.label}</label>
        <div class="button1st_right" title="Close">
            <img src="${Images.Close}" />
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
        HtmlUtil.clearHTML(this._container);
    }

    renderForm() {
        if (!this._html) {
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
