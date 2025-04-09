import IDE from "./ide";
import RepositoryBrowser from "./repositorybrowser";
import LeftSplitter from "./splitter/leftsplitter";
import $ from "jquery";

// NO ALT SHIFT O (Do not apply sorting on imports of stylesheets.)
import "../../node_modules/jointjs/dist/joint.css";
import "../../node_modules/bootstrap/dist/css/bootstrap.css";
import "../../node_modules/jquery-ui/dist/themes/base/jquery-ui.css";
import "../../node_modules/codemirror/lib/codemirror.css";
import "../../node_modules/codemirror/addon/fold/foldgutter.css";
import "../../node_modules/codemirror/addon/hint/show-hint.css";
import "../../node_modules/alpaca/dist/alpaca/bootstrap/alpaca.min.css";

import "@styles/ide/ide.css";
import "@styles/ide/dragdata.css";
import "@styles/ide/splitter.css";
import "@styles/ide/repositorybrowser.css";
import "@styles/ide/editors/util/dialog.css";
import "@styles/ide/editors/util/zoomfield.css";
import "@styles/ide/editors/util/messagebox.css";
import "@styles/ide/editors/util/basicform.css";
import "@styles/ide/editors/util/generic_ui.css";
import "@styles/ide/editors/util/standardform.css";
import "@styles/ide/modeleditors/case/elements/properties/properties.css";
import "@styles/ide/modeleditors/case/elements/properties/planitemproperties.css";
import "@styles/ide/modeleditors/case/elements/properties/caseplanproperties.css";
import "@styles/ide/modeleditors/case/elements/properties/humantaskproperties.css";
import "@styles/ide/modeleditors/case/elements/properties/planningtableproperties.css";
import "@styles/ide/modeleditors/case/elements/properties/sentryproperties.css";
import "@styles/ide/modeleditors/case/elements/properties/stageproperties.css";
import "@styles/ide/modeleditors/case/elements/properties/timereventproperties.css";
import "@styles/ide/modeleditors/case/elements/elements.css";
import "@styles/ide/modeleditors/case/editors/cfiselector.css";
import "@styles/ide/modeleditors/case/editors/file/classic/casefileitemseditor.css";
import "@styles/ide/modeleditors/type/typemodeleditor.css";
import "@styles/ide/editors/roleseditor.css";
import "@styles/ide/editors/tableeditor.css";
import "@styles/ide/editors/jsoneditor.css";
import "@styles/ide/editors/task/taskmappingseditor.css";
import "@styles/ide/modeleditors/modeleditor.css";
import "@styles/ide/modeleditors/xmleditor/modelparameters.css";
import "@styles/ide/modeleditors/xmleditor/modelsourceeditor.css";
import "@styles/ide/modeleditors/xmleditor/tabs.css";
import "@styles/ide/modeleditors/humantask/humantaskmodeleditor.css";
import "@styles/ide/modeleditors/process/processmodeleditor.css";
import "@styles/ide/modeleditors/case/casemodeleditor.css";
import "@styles/ide/modeleditors/case/caseparameters.css";
import "@styles/ide/modeleditors/case/deploy.css";
import "@styles/ide/debugger/debugger.css";
import "@styles/ide/modeleditors/case/undoredobox.css";
import "@styles/ide/modeleditors/case/shapebox.css";
import "@styles/ide/modeleditors/case/casesourceeditor.css";
import "@styles/ide/modeleditors/case/resizer.css";
import "@styles/ide/modeleditors/case/marker.css";
import "@styles/ide/modeleditors/case/highlighter.css";
import "@styles/ide/modeleditors/case/elements/halo/halo.css";
import "@styles/validate/validate.css";
import "@styles/ide/modeleditors/cfid/casefileitemdefinition.css";
import "@styles/ide/settings/settingseditor.css";

export default class IDEMain {
    html: JQuery<HTMLElement>;
    repositoryBrowser: RepositoryBrowser;
    divModelEditors: JQuery<HTMLElement>;
    splitter: LeftSplitter;

    /**
     * Constructs the footer of the IDE element.
     */
    constructor(public ide: IDE) {
        this.ide = ide;
        this.html = $(
            `<div class="ide-main" id="ideMain">
                <div class="repository-browser basicbox"></div>
                <div class="model-editors"></div>
            </div>`
        );
        this.ide.html.append(this.html);

        // Now set the pointers on the this object;
        this.repositoryBrowser = new RepositoryBrowser(ide, this.html.find('.repository-browser'));
        this.divModelEditors = this.html.find('.model-editors');

        // Make a splitter between repository browser and the fixed editors div; it should also reposition the case model editor's splitter each time
        this.splitter = new LeftSplitter(this.html, '15%');

    }
}
