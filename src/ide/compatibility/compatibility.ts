// FOR SOME WEIRD REASON THE UNUSED CasePlanDefinition IMPORT MUST BE PUT HERE. VERY WEIRD, giving errors in TaskDefinition if it is removed...
// In the compatibilityhelper we do an import CasePlanDefinition from '../../repository/definition/cmmn/caseplan/caseplandefinition';
import echo from './compatibilityhelper';

import Halo from '../modeleditor/case/elements/halo/halo';
import PlanItemHalo from '../modeleditor/case/elements/halo/planitemhalo';
import { EntryCriterionHalo, ExitCriterionHalo, ReactivateCriterionHalo } from '../modeleditor/case/elements/halo/sentryhalo';
import TaskHalo from '../modeleditor/case/elements/halo/taskhalo';

const pointers = [
    // IDE
    Halo,
    PlanItemHalo,
    EntryCriterionHalo,
    ReactivateCriterionHalo,
    ExitCriterionHalo,
    TaskHalo,
]

export default class Compatibility {
    static registerClasses() {
        console.groupCollapsed("Registering " + pointers.length + " exports");
        pointers.forEach(property => {
            console.log("Registering window." + property.name);
            (<any>window)[property.name] = property;
        });
        echo();  // TODO BIG .... Shouldn't be necessary
        console.groupEnd();
    }
}
