import Logger from "src/server/logger";
import CasePlanDefinition from "../../../../../../repository/definition/cmmn/caseplan/caseplandefinition";
import CasePlanView from "../../caseplanview";
import Halo from "../halo";
import CaseInputParametersHaloItem from "./item/caseplan/caseinputparametershaloitem";
import CaseOutputParametersHaloItem from "./item/caseplan/caseoutputparametershaloitem";
import CaseRolesHaloItem from "./item/caseplan/caseroleshaloitem";
import DebuggerHaloItem from "./item/caseplan/debuggerhaloitem";
import DeployHaloItem from "./item/caseplan/deployhaloitem";
import SeparatorHaloItem from "./item/caseplan/separatorhaloitem";
import StartCaseSchemaHaloItem from "./item/caseplan/startcaseschemahaloitem";
import TrainingHaloItem from "./item/caseplan/traininghaloitem";
import ViewSourceHaloItem from "./item/caseplan/viewsourcehaloitem";
import DeleteHaloItem from "./item/click/deletehaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";
import Settings from "../../../../../settings/settings";

/**
 * Halo for the caseplan model. This halo is situated next to the top tab of the case plan model
 */
export default class CasePlanHalo extends Halo<CasePlanDefinition, CasePlanView> {
    createItems() {
        // All content in the topbar, next to the top tab (or next to the planning table).
        this.topBar.addItems(
            PropertiesHaloItem, DeleteHaloItem,
            SeparatorHaloItem,
            CaseInputParametersHaloItem, CaseOutputParametersHaloItem, StartCaseSchemaHaloItem, CaseRolesHaloItem,
            SeparatorHaloItem,
            ViewSourceHaloItem, DeployHaloItem, DebuggerHaloItem
        );
        if (this.isTrainingEnabled()) {
            this.topBar.addItems(TrainingHaloItem);
        }
    }

    setHaloPosition() {
        // Determine new left and top, relative to element's position in the case paper
        const casePaper = this.element.case.paperContainer!;

        // We need to make the halo a bit lower and on the right hand side of the top tab or the planning table.
        const leftCorrection = this.element.definition.planningTable ? 310 : 260;
        const haloLeft = this.element.shape.x - (casePaper.scrollLeft() ?? 0) + leftCorrection;
        const haloTop = this.element.shape.y - (casePaper.scrollTop() ?? 0) + 24;

        this.html.css('left', haloLeft);
        this.html.css('top', haloTop);
        this.html.width(this.element.shape.width);
        this.html.height(this.element.shape.height);
    }

    isTrainingEnabled(): boolean {
        return Settings.llmTraining;
    }

}
