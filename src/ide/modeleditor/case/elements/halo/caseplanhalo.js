import $ from "jquery";
import Images from "../../../../util/images/images";
import CasePlanView from "../caseplanview";
import Halo from "./halo";
import HaloClickItem, { DeleteHaloItem, PropertiesHaloItem } from "./item/haloclickitems";
import HaloItem from "./item/haloitem";

export default class CasePlanHalo extends Halo {
    /**
     * Create the halo for the caseplan model. This halo is situated next to the top tab of the case plan model
     * @param {CasePlanView} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    createItems() {
        // All content in the topbar, next to the top tab (or next to the planning table).
        this.topBar.addItems(
            PropertiesHaloItem, DeleteHaloItem,
            SeparatorHaloItem,
            CaseInputParametersHaloItem, CaseOutputParametersHaloItem,StartCaseSchemaHaloItem, CaseRolesHaloItem,
            SeparatorHaloItem,
            ViewSourceHaloItem, DeployHaloItem, DebuggerHaloItem
        );
    }

    setHaloPosition() {
        // Determine new left and top, relative to element's position in the case paper
        const casePaper = this.element.case.paperContainer;

        // We need to make the halo a bit lower and on the right hand side of the top tab or the planning table.
        const leftCorrection = this.element.definition.planningTable ? 310 : 260;
        const haloLeft = this.element.shape.x - casePaper.scrollLeft() + leftCorrection;
        const haloTop = this.element.shape.y - casePaper.scrollTop() + 24;

        this.html.css('left', haloLeft);
        this.html.css('top', haloTop);
        this.html.width(this.element.shape.width);
        this.html.height(this.element.shape.height);
    }
}

// Below a series of caseplan specific halo items

class CaseInputParametersHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.Input, 'Edit case input parameters', e => this.halo.element.case.caseParametersEditor.show());
    }
}

class CaseOutputParametersHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.Output, 'Edit case output parameters', e => this.halo.element.case.caseParametersEditor.show());
    }
}

class CaseRolesHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.Roles, 'Edit case team', e => this.halo.element.case.rolesEditor.show());
    }
}

class StartCaseSchemaHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.StartCaseSchema, 'Edit start case schema', e => this.halo.element.case.startCaseEditor.show());
    }
}

class DeployHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.Deploy, 'Deploy this case', e => this.halo.element.case.deployForm.show());
    }
}

class ViewSourceHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.ViewSource, 'View source of this case', e => this.halo.element.case.viewSource());
    }
}

class DebuggerHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.Debug, 'Debug cases of this type', e => this.halo.element.case.debugEditor.show());
    }
}

class SeparatorHaloItem extends HaloItem {
    constructor(halo) {
        super(halo, '', '', $('<div style="width:12px;height:21px" />'));
    }
}
