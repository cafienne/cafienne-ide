import Edge from "../../../../../repository/definition/dimensions/edge";
import Connector from '../../../../editors/modelcanvas/connector/connector';
import CaseElementView from "../caseelementview";

export default class CaseConnector extends Connector<CaseElementView> {
    criterion?: CaseElementView;

    constructor(public source: CaseElementView, public target: CaseElementView, public edge: Edge) {
        super(source, target, edge);

        const criterion = source.isCriterion ? source : target.isCriterion ? target : undefined;
        this.connectionStyle = criterion ? '8 3 3 3 3 3' : '5 5';
    }
}
