import Edge from "../../../../repository/definition/dimensions/edge";
import Connector from "../../../editors/graphical/connector/connector";
import CaseView from "../elements/caseview";
import CMMNElementView from "../elements/cmmnelementview";

export default class CaseConnector extends Connector<CMMNElementView> {
    constructor(cs: CaseView, source: CMMNElementView, target: CMMNElementView, edge: Edge) {
        super(cs, source, target, edge);

        const criterion = source.isCriterion ? source : target.isCriterion ? target : undefined;
        this.connectionStyle = criterion ? '8 3 3 3 3 3' : '5 5';
    }
}
