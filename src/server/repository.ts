'use strict';

import path from "path";
import Definitions from "./deploy/definitions";
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

    composeDefinitionsDocument(artifactName: string) {
        return new Definitions(artifactName, this.store);
    }

    deploy(artifactName: string) {
        const definitions = this.composeDefinitionsDocument(artifactName);
        if (definitions.hasErrors()) {
            throw new Error('Cannot deploy ' + artifactName + ' due to ' + definitions.getErrors());
        }
        const file = Utilities.createAbsolutePath(this.deployPath, definitions.deployFileName);
        Utilities.saveFile(file, definitions.deployContents);
        return file;
    }

    contents() {
        return this.store.contents();
    }

    list() {
        return this.store.list();
    }
}
