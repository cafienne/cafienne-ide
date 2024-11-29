'use strict';

import path from "path";
import RepositoryConfiguration from "./config/config";
import Store from "./store/store";
import Utilities from "./util/utilities";

export default class Repository {
    public repositoryPath: string;
    public deployPath: string;
    public store: Store;

    constructor(public config: RepositoryConfiguration = new RepositoryConfiguration()) {
        this.repositoryPath = path.resolve(config.repository);
        this.deployPath = path.resolve(config.deploy);
        this.store = new Store(this.repositoryPath);
        console.log(`========== Starting Cafienne Repository version 0.1.7)`);
        console.log('- sources location: ' + this.repositoryPath);
        console.log('-  deploy location: ' + this.deployPath); // Intentional double space to align both configuration values
        console.log('===================');
    }

    load(artifactName: string) {
        return this.store.load(artifactName);
    }

    save(artifactName: string, data: any) {
        return this.store.save(artifactName, data);
    }

    rename(artifactName: string, newArtifactName: string) {
        return this.store.rename(artifactName, newArtifactName);
    }

    delete(artifactName: string) {
        return this.store.delete(artifactName);
    }

    deploy(deployFileName: string, deployContents: string) {
        const file = Utilities.createAbsolutePath(this.deployPath, deployFileName);
        Utilities.saveFile(file, deployContents);
        return file;
    }

    contents() {
        return this.store.contents();
    }

    list() {
        return this.store.list();
    }
}
