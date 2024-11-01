import RepositoryBrowser from "@ide/repositorybrowser";
import ServerFile from "@repository/serverfile/serverfile";
import DragData from "./dragdata";
import ModelDefinition from "@repository/definition/modeldefinition";

export default class ServerFileDragData extends DragData {
    constructor(repositoryBrowser: RepositoryBrowser, public file: ServerFile<ModelDefinition>, imgURL: string) {
        super(repositoryBrowser, file.name, imgURL);
    }
}
