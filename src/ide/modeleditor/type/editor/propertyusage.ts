import CaseDefinition from "../../../../repository/definition/cmmn/casedefinition";
import CaseFileItemTypeDefinition from "../../../../repository/definition/cmmn/casefile/casefileitemtypedefinition";
import ElementDefinition from "../../../../repository/definition/elementdefinition";
import SchemaPropertyDefinition from "../../../../repository/definition/type/schemapropertydefinition";
import CaseFile from "../../../../repository/serverfile/casefile";
import TypeFile from "../../../../repository/serverfile/typefile";
import Util from "../../../../util/util";
import CaseModelEditor from "../../case/casemodeleditor";
import PropertyRenderer from "./propertyrenderer";

export default class PropertyUsage {
    static checkPropertyDeletionAllowed(renderer: PropertyRenderer) {
        const getCaseReferences = (property: SchemaPropertyDefinition) => Util.removeDuplicates(property.getCaseFileItemReferences().map(cftd => cftd.searchInboundReferences()).flat());

        const getParentTypes = (typeFile: TypeFile, list: TypeFile[] = [typeFile]): TypeFile[] => {
            typeFile.usage.filter(fileUsingType => fileUsingType instanceof TypeFile).map(file => <TypeFile>file).forEach(file => {
                if (list.indexOf(file) < 0) {
                    list.push(file);
                    getParentTypes(file, list);
                }
            });
            return list;
        }

        const referringTypeFiles = getParentTypes(renderer.property.modelDefinition.file);

        // Lookup all referring .case fileNames (including corresponding .dimensions)
        const referringCaseFileNames: string[] = referringTypeFiles.map(type => type.usage.filter(file => file instanceof CaseFile)).flat().map(f => f ? f.fileName : '').filter(s => s.length > 0);
        const dims = referringCaseFileNames.map(f => f.replace('.case', '.dimensions'));
        referringCaseFileNames.push(...dims);

        // First check direct references, as that gives a different error message than child properties.
        const caseFilter = (ref: ElementDefinition) => referringCaseFileNames.indexOf(ref.modelDefinition.file.fileName) >= 0;
        const references = getCaseReferences(renderer.property).filter(caseFilter);
        if (references.length > 0) {
            const definitionsUsing = Util.removeDuplicates(references.map(ref => ref.modelDefinition.file.fileName));
            renderer.editor?.ide.warning('Cannot remove property, as it is in use in ' + references.length + ' places across the files ' + definitionsUsing.map(fileName => `<br />- ${fileName}`).join(''));
            return false;
        }

        // Now check references to one of our descendents. Also they are not allowed.
        const childRenderers: SchemaPropertyDefinition[] = renderer.getDescendents().filter(child => child instanceof PropertyRenderer).map(child => (<PropertyRenderer>(child)).property);
        const allChildCaseReferences = childRenderers.filter(p => p !== renderer.property && getCaseReferences(p).filter(caseFilter).length > 0);
        const childCaseReferences = Util.removeDuplicates(allChildCaseReferences);
        if (childCaseReferences.length > 0) {
            let usedInWarning: string[] = [];
            childRenderers.filter(p => p !== renderer.property && getCaseReferences(p).filter(caseFilter).forEach(p => usedInWarning.push(`<br />- ${p.modelDefinition.file.fileName}`)));
            Util.removeDuplicates(usedInWarning);
            renderer.editor?.ide.warning('Cannot remove property, as it has child properties that are in use' + childCaseReferences.map(property => `<br />- ${property.name}`).join('') + '<br /> used in' + usedInWarning.join(''));
            return false;
        }

        return true;
    }


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

        const references: CaseFileItemTypeDefinition[] = renderer.property.getCaseFileItemReferences();

        const referencesByCaseDefinition = /** @type {Map<CaseDefinition, CaseFileItemTypeDefinition[]>}*/ (new Map());
        references.forEach(ref => {
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
        for (let i = 0; i < list1.length; i++) {
            const caseDefinition: CaseDefinition = list1[i][0];
            const refs: CaseFileItemTypeDefinition[] = list1[i][1];
            await this.updateCaseDefinition(caseDefinition, refs, renderer, oldPath, oldName);
        }
        console.groupEnd();
    }

    static async updateCaseDefinition(caseDefinition: CaseDefinition, refs: CaseFileItemTypeDefinition[], renderer: PropertyRenderer, oldPath: string, oldName: string): Promise<any> {
        const caseFileItemsWithOffspring = refs.map(cfi => cfi.getDescendants()).flat();
        // Now select all references to the entiry tree below us. This _must_ include also the Dimensions file, so therefore comparing on the name of the model definition.
        const caseFileItemReferences = caseFileItemsWithOffspring.map((cfi: CaseFileItemTypeDefinition) => cfi.searchInboundReferences().filter(ref => ref.modelDefinition.file.name === cfi.modelDefinition.file.name)).flat();
        if (caseFileItemReferences.length === 0) {
            return;
        }
        const caseFile = caseDefinition.file;
        const dimensionsFile = caseFile.definition?.dimensions?.file;
        if (!caseFile || !caseFile.definition || !dimensionsFile || !dimensionsFile.definition) {
            return;
        }

        console.groupCollapsed(`Updating ${caseFileItemReferences.length} references inside case ${caseDefinition.file}`);

        const caseXMLBefore = caseFile.definition.toXMLString();
        const dimXMLBefore = dimensionsFile.definition.toXMLString();

        refs.forEach((cfi: CaseFileItemTypeDefinition) => cfi.updatePaths(renderer.property, oldPath, oldName));

        const caseXML = caseFile.definition.toXMLString();
        const dimXML = dimensionsFile.definition.toXMLString();

        const hasCaseDefinitionChanges = caseXMLBefore !== caseXML;
        const hasDimensionChanges = dimXMLBefore !== dimXML;

        if (hasCaseDefinitionChanges || hasDimensionChanges) {
            const editor: CaseModelEditor | undefined = renderer.editor?.ide.editorRegistry.get(caseFile);
            const caseView = editor?.canvas;
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
                console.log("Saving " + caseFile)
                await caseFile.save();
            }
        }
        console.groupEnd();
    }
}
