import CMMNElementDefinition from "../../../../repository/definition/cmmnelementdefinition";
import Edge from "../../../../repository/definition/dimensions/edge";
import Connector from "../../../editors/graphical/connector/connector";
import CaseView from "../elements/caseview";
import CMMNElementView from "../elements/cmmnelementview";

export default class CaseConnector extends Connector<CMMNElementView> {
    criterion?: CMMNElementView<CMMNElementDefinition>;

    constructor(cs: CaseView, source: CMMNElementView, target: CMMNElementView, edge: Edge) {
        super(cs, source, target, edge);

        this.criterion = source.isCriterion ? source : target.isCriterion ? target : undefined;
    }

    get arrowStyle(): string {
        return this.criterion ? '8 3 3 3 3 3' : '5 5';
    }
}
