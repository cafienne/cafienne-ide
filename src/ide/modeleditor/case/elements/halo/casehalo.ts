import CMMNElementDefinition from "../../../../../repository/definition/cmmnelementdefinition";
import Halo from "../../../../editors/modelcanvas/halo/halo";
import CaseElementView from "../caseelementview";

export default class CaseHalo<ElemDefT extends CMMNElementDefinition = CMMNElementDefinition,
    ViewT extends CaseElementView<ElemDefT> = CaseElementView<ElemDefT>>
    extends Halo<ElemDefT, ViewT> {
}
