import CasePlanDefinition from "../../../../../../repository/definition/cmmn/caseplan/caseplandefinition";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import CasePlanView from "../../caseplanview";
import CaseHalo from "../casehalo";
import CaseInputParametersHaloItem from "./item/caseplan/caseinputparametershaloitem";
import CaseOutputParametersHaloItem from "./item/caseplan/caseoutputparametershaloitem";
import CaseRolesHaloItem from "./item/caseplan/caseroleshaloitem";
import DebuggerHaloItem from "./item/caseplan/debuggerhaloitem";
import DeployHaloItem from "./item/caseplan/deployhaloitem";
import SeparatorHaloItem from "./item/caseplan/separatorhaloitem";
import StartCaseSchemaHaloItem from "./item/caseplan/startcaseschemahaloitem";
import TestHaloItem from "./item/caseplan/testhaloitem";
import ViewSourceHaloItem from "./item/caseplan/viewsourcehaloitem";

/**
 * Halo for the caseplan model. This halo is situated next to the top tab of the case plan model
 */
export default class CasePlanHalo extends CaseHalo<CasePlanDefinition, CasePlanView> {

    createItems() {
        // All content in the topbar, next to the top tab (or next to the planning table).
        this.topBar.addItems(
            PropertiesHaloItem, DeleteHaloItem,
            SeparatorHaloItem,
            CaseInputParametersHaloItem, CaseOutputParametersHaloItem, StartCaseSchemaHaloItem, CaseRolesHaloItem,
            SeparatorHaloItem,
            ViewSourceHaloItem, DeployHaloItem, DebuggerHaloItem,
            TestHaloItem
        );
    }

    setHaloPosition() {
        // Determine new left and top, relative to element's position in the case paper
        const casePaper = this.element.canvas.paperContainer!;

        // We need to make the halo a bit lower and on the right hand side of the top tab or the planning table.
        const leftCorrection = this.element.definition.planningTable ? 310 : 260;
        const haloLeft = this.element.shape.x - (casePaper.scrollLeft() ?? 0) + leftCorrection;
        const haloTop = this.element.shape.y - (casePaper.scrollTop() ?? 0) + 24;

        this.html.css('left', haloLeft);
        this.html.css('top', haloTop);
        this.html.width(this.element.shape.width);
        this.html.height(this.element.shape.height);
    }
}
