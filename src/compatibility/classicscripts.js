export default class ClassicScripts {
    static include() {
        console.groupCollapsed("Loading " + scripts.length + " scripts");
        scripts.forEach(url => {
            console.log("Loading " + url)
            loadScriptSync(url);
        });
        console.groupEnd();
    }
}

function loadScriptSync(src) {
    var s = document.createElement('script');
    s.src = src;
    s.type = "text/javascript";
    s.async = false;                                 // <-- this is important
    document.getElementsByTagName('head')[0].appendChild(s);
}

const scripts = [
    // "scripts/repository/definition/xmlelementdefinition.js",
    // "scripts/repository/definition/cmmn/definitions/cmmndocumentationdefinition.js",
    // "scripts/repository/definition/referableelementdefinition.js",
    // "scripts/repository/definition/cmmn/definitions/cmmnelementdefinition.js",
    // "scripts/repository/definition/cmmn/definitions/unnamedcmmnelementdefinition.js",
    // "scripts/repository/definition/cmmn/definitions/extensions/cmmnextensiondefinition.js",
    // "scripts/repository/definition/cmmn/definitions/extensions/cafienneimplementationdefinition.js",
    "scripts/repository/definition/cmmn/definitions/artifact/artifactdefinition.js",
    "scripts/repository/definition/cmmn/definitions/artifact/textannotation.js",
    // "scripts/repository/definition/modeldefinition.js",
    // "scripts/repository/definition/typecounter.js",
    "scripts/repository/definition/cmmn/dimensions/dimensions.js",
    "scripts/repository/definition/cmmn/dimensions/diagramelement.js",
    "scripts/repository/definition/cmmn/dimensions/diagram.js",
    "scripts/repository/definition/cmmn/dimensions/bounds.js",
    "scripts/repository/definition/cmmn/dimensions/connectorstyle.js",
    "scripts/repository/definition/cmmn/dimensions/edge.js",
    "scripts/repository/definition/cmmn/dimensions/shape.js",
    "scripts/repository/definition/cmmn/dimensions/vertex.js",
    "scripts/repository/definition/cmmn/definitions/casedefinition.js",
    "scripts/repository/definition/cmmn/definitions/expression/expressiondefinition.js",
    "scripts/repository/definition/cmmn/definitions/casefile/casefileitemcollection.js",
    "scripts/repository/definition/cmmn/definitions/casefile/casefiledefinition.js",
    "scripts/repository/definition/cmmn/definitions/casefile/casefileitemdef.js",
    "scripts/repository/definition/cmmn/definitions/contract/parameterdefinition.js",
    "scripts/repository/definition/cmmn/definitions/contract/parametermappingdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/planitem.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/constraintdefinition.js",
    "scripts/repository/definition/cmmn/definitions/sentry/sentrydefinition.js",
    "scripts/repository/definition/cmmn/definitions/sentry/criteriondefinition.js",
    "scripts/repository/definition/cmmn/definitions/sentry/entrycriteriondefinition.js",
    "scripts/repository/definition/cmmn/definitions/sentry/reactivatecriteriondefinition.js",
    "scripts/repository/definition/cmmn/definitions/sentry/exitcriteriondefinition.js",
    "scripts/repository/definition/cmmn/definitions/sentry/ifpartdefinition.js",
    "scripts/repository/definition/cmmn/definitions/sentry/onpartdefinition.js",
    "scripts/repository/definition/cmmn/definitions/sentry/planitemonpartdefinition.js",
    "scripts/repository/definition/cmmn/definitions/sentry/casefileitemonpartdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/itemcontroldefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/planitemdefinitiondefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/planningtabledefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/stagedefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/taskdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/workflow/cafienneworkflowdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/casetaskdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/humantaskdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/planitemreference.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/workflow/assignmentdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/workflow/duedatedefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/workflow/taskpairingdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/workflow/foureyesdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/workflow/rendezvousdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/task/processtaskdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/caseplandefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/milestonedefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/eventlistenerdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/timereventdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseplan/usereventdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseteam/caseteamdefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseteam/caseroledefinition.js",
    "scripts/repository/definition/cmmn/definitions/caseteam/caserolereference.js",
    // "scripts/repository/metadata.js",
    // "scripts/repository/content.js",
    // "scripts/repository/serverfile.js",
    // "scripts/repository/serverfile/casefile.js",
    // "scripts/repository/serverfile/cfidfile.js",
    // "scripts/repository/serverfile/dimensionsfile.js",
    // "scripts/repository/serverfile/humantaskfile.js",
    // "scripts/repository/serverfile/processfile.js",
    // "scripts/repository/repository.js",
    // "scripts/repository/import/importelement.js",
    // "scripts/repository/import/importer.js",
    "scripts/repository/definition/humantask/humantaskmodeldefinition.js",
    "scripts/repository/definition/humantask/humantaskmodelelementdefinition.js",
    "scripts/repository/definition/humantask/humantaskimplementationdefinition.js",
    "scripts/repository/definition/humantask/taskmodeldefinition.js",
    "scripts/repository/definition/process/processmodeldefinition.js",
    "scripts/repository/definition/process/processimplementationdefinition.js",
    "scripts/repository/definition/cfid/casefileitemdefinitiondefinition.js",
    "scripts/repository/definition/cfid/propertydefinition.js",
    "scripts/ide/modeleditors/cfid/casefileitemdefinitioneditor.js",
    "scripts/ide/modeleditors/cfid/cfidefinitionunspecified.js",
    "scripts/ide/modeleditors/cfid/cfidefinitionxmlelement.js",
    "scripts/ide/modeleditors/cfid/cfidefinitionunknown.js",
    "scripts/ide/modeleditors/case/elements/elements.js",
    "scripts/ide/modeleditors/case/elements/canvaselement.js",
    "scripts/ide/modeleditors/case/elements/properties/properties.js",
    "scripts/ide/modeleditors/case/elements/properties/casefileitemproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/planitemproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/planningtableproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/sentryproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/taskstageproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/stageproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/caseplanproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/milestoneproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/taskproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/humantaskproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/workflowproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/textannotationproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/timereventproperties.js",
    "scripts/ide/modeleditors/case/elements/properties/usereventproperties.js",
    "scripts/ide/modeleditors/case/elements/halo/halo.js",
    "scripts/ide/modeleditors/case/elements/halo/halobar.js",
    "scripts/ide/modeleditors/case/elements/halo/item/haloitem.js",
    "scripts/ide/modeleditors/case/elements/halo/item/halodragitems.js",
    "scripts/ide/modeleditors/case/elements/halo/item/haloclickitems.js",
    "scripts/ide/modeleditors/case/elements/halo/casefileitemhalo.js",
    "scripts/ide/modeleditors/case/elements/halo/caseplanhalo.js",
    "scripts/ide/modeleditors/case/elements/halo/planitemhalo.js",
    "scripts/ide/modeleditors/case/elements/halo/planningtablehalo.js",
    "scripts/ide/modeleditors/case/elements/halo/sentryhalo.js",
    "scripts/ide/modeleditors/case/elements/halo/taskhalo.js",
    "scripts/ide/modeleditors/case/elements/cmmnelementview.js",
    "scripts/ide/modeleditors/case/elements/decorator/decorator.js",
    "scripts/ide/modeleditors/case/elements/decorator/decoratorbox.js",
    "scripts/ide/modeleditors/case/elements/planitemview.js",
    "scripts/ide/modeleditors/case/elements/taskstageview.js",
    "scripts/ide/modeleditors/case/elements/taskview.js",
    "scripts/ide/modeleditors/case/elements/casetaskview.js",
    "scripts/ide/modeleditors/case/elements/humantaskview.js",
    "scripts/ide/modeleditors/case/elements/processtaskview.js",
    "scripts/ide/modeleditors/case/elements/eventlistenerview.js",
    "scripts/ide/modeleditors/case/elements/timereventview.js",
    "scripts/ide/modeleditors/case/elements/usereventview.js",
    "scripts/ide/modeleditors/case/elements/sentryview.js",
    "scripts/ide/modeleditors/case/elements/casefileitemview.js",
    "scripts/ide/modeleditors/case/elements/milestoneview.js",
    "scripts/ide/modeleditors/case/elements/stageview.js",
    "scripts/ide/modeleditors/case/elements/caseplanview.js",
    "scripts/ide/modeleditors/case/elements/textannotationview.js",
    "scripts/ide/modeleditors/case/elements/planningtableview.js",
    "scripts/ide/modeleditors/case/elements/caseview.js",
    "scripts/ide/modeleditors/case/elements/connector.js",
    "scripts/ide/modeleditors/case/editors/tableeditor/tableeditor.js",
    "scripts/ide/modeleditors/case/editors/tableeditor/tablerenderer.js",
    "scripts/ide/modeleditors/case/editors/tableeditor/rowrenderer.js",
    "scripts/ide/modeleditors/case/editors/tableeditor/columnrenderer.js",
    "scripts/ide/modeleditors/case/editors/file/cfiselector.js",
    "scripts/ide/modeleditors/case/editors/file/cfinode.js",
    "scripts/ide/modeleditors/case/editors/casefileitemseditor.js",
    "scripts/ide/modeleditors/case/editors/parameters/caseparameterseditor.js",
    "scripts/ide/modeleditors/case/editors/parameters/cfizoom.js",
    "scripts/ide/modeleditors/case/editors/parameters/expressionchanger.js",
    "scripts/ide/modeleditors/case/editors/parameters/namechanger.js",
    "scripts/ide/modeleditors/case/editors/parameters/parameterdeleter.js",
    "scripts/ide/modeleditors/case/editors/task/previewtaskform.js",
    "scripts/ide/modeleditors/case/editors/task/taskmappingseditor.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/mappingcontrol.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/mappingrow.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/mappingcfi.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/mappingexpression.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/mappingorderchanger.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/input/inputmappingcontrol.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/input/inputmappingdeleter.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/input/inputoperationselector.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/input/inputparameterselector.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/output/outputmappingcontrol.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/output/outputoperationselector.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/output/outputmappingdeleter.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/output/outputparameterselector.js",
    "scripts/ide/modeleditors/case/editors/task/mapping/output/requiredchanger.js",
    "scripts/ide/modeleditors/case/editors/task/bindingrefinementeditor.js",
    "scripts/ide/modeleditors/case/editors/casesourceeditor.js",
    "scripts/ide/modeleditors/case/shapebox.js",
    "scripts/ide/modeleditors/case/resizer.js",
    "scripts/ide/modeleditors/case/undoredo.js",
    "scripts/ide/modeleditors/case/action.js",
    "scripts/ide/modeleditors/case/grid.js",
    "scripts/ide/modeleditors/case/marker.js",
    "scripts/ide/modeleditors/case/editors/roleseditor.js",
    "scripts/ide/modeleditors/case/editors/deploy.js",
    "scripts/ide/modeleditors/case/editors/startcaseeditor.js",
    "scripts/ide/modeleditors/modeleditor.js",
    "scripts/ide/modeleditors/modeleditormetadata.js",
    "scripts/ide/modeleditors/xmleditor/modelsourceeditor.js",
    "scripts/ide/modeleditors/xmleditor/modelparameters.js",
    "scripts/ide/modeleditors/case/casemodeleditor.js",
    "scripts/ide/modeleditors/case/casemodeleditormetadata.js",
    "scripts/ide/modeleditors/process/processmodeleditor.js",
    "scripts/ide/modeleditors/process/processtaskmodeleditormetadata.js",
    "scripts/ide/modeleditors/humantask/humantaskmodeleditor.js",
    "scripts/ide/modeleditors/humantask/humantaskmodeleditormetadata.js",
];