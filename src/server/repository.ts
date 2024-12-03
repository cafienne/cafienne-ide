'use strict';

import path from "path";
import RepositoryConfiguration from "./config/config";
import Utilities from "./util/utilities";
import { WalkSyncEntry } from "walk-sync";

export default class Repository {
    public repositoryPath: string;
    public deployPath: string;

    constructor(public config: RepositoryConfiguration = new RepositoryConfiguration()) {
        this.repositoryPath = path.resolve(config.repository);
        this.deployPath = path.resolve(config.deploy);
        console.log(`========== Starting Cafienne Repository version 0.1.7)`);
        console.log('- sources location: ' + this.repositoryPath);
        console.log('-  deploy location: ' + this.deployPath); // Intentional double space to align both configuration values
        console.log('===================');
    }

    load(artifactName: string) {
        return Utilities.readFile(this.repositoryPath, artifactName);
    }

    save(artifactName: string, data: any) {
        Utilities.saveFile(this.repositoryPath, artifactName, data);
    }

    rename(artifactName: string, newArtifactName: string, data: any) {
        Utilities.renameFile(this.repositoryPath, artifactName, newArtifactName);
        this.save(newArtifactName, data);
    }

    delete(artifactName: string) {
        Utilities.deleteFile(this.repositoryPath, artifactName);
    }

    deploy(deployFileName: string, deployContents: string) {
        Utilities.saveFile(this.deployPath, deployFileName, deployContents);
    }

    contents() {
        return this.getElements();
    }

    list() {
        return this.getElements(false);
    }

    private getElements(includeJson: boolean = true) {
        const fileCreator = (file: WalkSyncEntry) => {
            const fileName = file.relativePath;
            const type = path.extname(fileName).substring(1);
            const lastModified = file.mtime;
            const content = includeJson ? Utilities.readFile(this.repositoryPath, fileName) : undefined;
            return { fileName, type, lastModified, content };
        }

        return Utilities.getRepositoryFiles(this.repositoryPath).map(fileCreator);
    }
}
