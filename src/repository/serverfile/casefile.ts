import CaseDefinition from "../definition/cmmn/casedefinition";
import ServerFile from "./serverfile";

export default class CaseFile extends ServerFile<CaseDefinition> {
    createModelDefinition() {
        return new CaseDefinition(this);
    }

    validateDefinition() {
        if (this.definition && this.definition.dimensions && this.definition.dimensions.file && this.definition.dimensions.file.metadata.error) {
            this.metadata.error = 'Cannot load case because the dimensions file has error:\n' + this.definition.dimensions.file.metadata.error;
        }
    }

    async rename(newFileName: string): Promise<this> {
        await super.rename(newFileName);
        this.isRenaming = true; // Ugly hack to avoid dimensions rename to update the case definition again.
        if (this.definition && this.definition.dimensions && this.definition.dimensions.file) {
            await this.definition.dimensions.file.rename(this.name + '.dimensions');
        }
        this.isRenaming = false;
        return this;
   }
}
