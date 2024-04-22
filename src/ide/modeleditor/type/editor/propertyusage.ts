import CaseModelEditor from "@ide/modeleditor/case/casemodeleditor";
import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import CaseFileItemTypeDefinition from "@repository/definition/cmmn/casefile/casefileitemtypedefinition";
import XML from "@util/xml";
import { PropertyRenderer } from "./typerenderer";

export default class PropertyUsage {

    static async updateNameChangeInOtherModels(renderer: PropertyRenderer, newName: string) {
        // First track both the old and new name.
        const oldName = renderer.property.name;
        const oldPath = renderer.path;
        // Set the new name on the property, but do not yet save the definition
        renderer.property.name = newName;
        const newPath = renderer.path;

        // Now process all case models that have a reference to this property.
        //  Step 1: change the case file item that wraps the property
        //  Step 2: check if the change leads to changes in CaseDefinition or Dimensions (only if the cfi is used in the model)
        //  Step 3: save those changes, in a sequential order, and keep track of the files that have been changed
        //  Step 4: save the local type
        //  Step 5: refresh the editors

        const references: CaseFileItemTypeDefinition[] = <CaseFileItemTypeDefinition[]>renderer.property.searchInboundReferences().filter(element => element instanceof CaseFileItemTypeDefinition);

        const referencesByCaseDefinition = /** @type {Map<CaseDefinition, CaseFileItemTypeDefinition[]>}*/ (new Map());
        references.forEach((ref: CaseFileItemTypeDefinition) => {
            const mapEntry = referencesByCaseDefinition.get(ref.caseDefinition);
            if (!mapEntry) {
                referencesByCaseDefinition.set(ref.caseDefinition, [ref]);
            } else {
                mapEntry.push(ref);
            }
        });

        if (referencesByCaseDefinition.size === 0) {
            return;
        }
        console.groupCollapsed(`Repository: updating ${referencesByCaseDefinition.size} case models after name change in ${renderer.property.modelDefinition.file.fileName}: '${oldPath}' ==> '${newPath}'`);

        const list1 = Array.from(referencesByCaseDefinition.entries());
        for (let i = 0; i<list1.length; i++) {
            const caseDefinition: CaseDefinition = list1[i][0];
            const refs: CaseFileItemTypeDefinition[] = list1[i][1];
            await this.updateCaseDefinition(caseDefinition, refs, renderer);
        }
        console.groupEnd();
    }

    static async updateCaseDefinition(caseDefinition: CaseDefinition, refs: CaseFileItemTypeDefinition[], renderer: PropertyRenderer): Promise<any> {
        const caseFileItemsWithOffspring = refs.map(cfi => cfi.getDescendants()).flat();
        const caseFileItemReferences = caseFileItemsWithOffspring.map((cfi: CaseFileItemTypeDefinition) => cfi.searchInboundReferences().filter(ref => ref.modelDefinition.file.name === cfi.modelDefinition.file.name)).flat();
        if (caseFileItemReferences.length === 0) {
            return;
        }
        const caseFile = caseDefinition.file;
        const dimensionsFile = caseFile.definition?.dimensions?.file;
        if (! caseFile || !dimensionsFile || !dimensionsFile.definition) {
            return;
        }

        console.groupCollapsed(`Updating ${caseFileItemReferences.length} references inside case ${caseDefinition.file.fileName}`);

        const caseXMLBefore = XML.prettyPrint(caseFile.definition.toXML());
        const dimXMLBefore = XML.prettyPrint(dimensionsFile.definition.toXML());

        refs.forEach((cfi: CaseFileItemTypeDefinition) => cfi.updatePaths(renderer.property));

        const caseXML = XML.prettyPrint(caseFile.definition.toXML());
        const dimXML = XML.prettyPrint(dimensionsFile.definition.toXML());

        const hasCaseDefinitionChanges = caseXMLBefore !== caseXML;
        const hasDimensionChanges = dimXMLBefore !== dimXML;

        if (hasCaseDefinitionChanges || hasDimensionChanges) {
            const editor: CaseModelEditor | undefined = renderer.editor?.ide.editorRegistry.get(caseFile);
            const caseView = editor?.case;
            if (caseView) {
                refs.forEach((cfi: CaseFileItemTypeDefinition) => caseView.refreshReferencingFields(cfi));
            }
            if (hasDimensionChanges) {
                dimensionsFile.source = dimXML;
                if (hasCaseDefinitionChanges) {
                    caseFile.source = caseXML;
                    await dimensionsFile.save().then(() => caseFile.save());
                } else {
                    await dimensionsFile.save();
                }
            } else /** if (hasCaseDefinitionChanges) */ {
                caseFile.source = caseXML;
                console.log("Saving " + caseFile.fileName)
                await caseFile.save();
            }
        }
        console.groupEnd();
    }
}
