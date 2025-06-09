// FOR SOME WEIRD REASON THE UNUSED CasePlanHalo IMPORT MUST BE PUT HERE. VERY WEIRD, giving errors in ElementDefinition if it is removed...
/**
 * vertex.js:35 Uncaught ReferenceError: Cannot access 'ElementDefinition' before initialization
    at Module.default (vertex.js:35:1)
    at ./src/repository/definition/cmmndocumentationdefinition.js (cmmndocumentationdefinition.js:5:58)
    at __webpack_require__ (bootstrap:19:1)
    at ./src/repository/definition/modeldefinition.js (taskmodeldefinition.js:26:1)
    at __webpack_require__ (bootstrap:19:1)
    at ./src/repository/definition/elementdefinition.js (vertex.js:35:1)
    at __webpack_require__ (bootstrap:19:1)
    at ./src/repository/definition/xmlserializable.js (unnamedcmmnelementdefinition.js:10:1)
    at __webpack_require__ (bootstrap:19:1)
    at ./src/repository/definition/extensions/cafienneimplementationdefinition.js (elementdefinition.js:153:1)
 */
import CasePlanHalo from '../modeleditor/case/elements/halo/cmmn/caseplanhalo';

export default function echo(msg) {
}
