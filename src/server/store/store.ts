'use strict';

import Utilities from "../util/utilities";
import { XML } from "../util/xml";
import RepositoryElement from "./repositoryelement";
import StoreAnalyzer from "./storeanalyzer";

export default class Store {
    constructor(public repositoryPath: string) {
    }

    createPath(artifactName: string) {
        return Utilities.createAbsolutePath(this.repositoryPath, artifactName);
    }

    /**
     * 
     * @param {string} artifactName 
     * @returns 
     */
    load(artifactName: string) {
        const fileName = this.createPath(artifactName);
        return Utilities.readFile(fileName);
    }

    save(artifactName: string, data: string) {
        const fileName = this.createPath(artifactName);
        Utilities.saveFile(fileName, data);
    }

    rename(artifactName: string, newArtifactName: string) {
        const analyzer = new StoreAnalyzer(this);
        const model = analyzer.models.find(model => model.fileName === artifactName);
        if (!model) {
            return;
        }
        const usedIn = analyzer.findReferences(model);
        usedIn.forEach(reference => reference.setNewId(newArtifactName))

        const fileName = this.createPath(artifactName);
        const newFileName = this.createPath(newArtifactName);
        Utilities.renameFile(fileName, newFileName);

        const nameReader = (/** @type {String} */ nameWithExtension: string) => {
            const splitList = nameWithExtension.split('.');
            splitList.pop(); // Last one is extension, we should remove it.
            return splitList.join('.'); // name becomes "MyMap/myMod.el"
        }

        // Also rename the value of the id attribute (if it exists and holds exactly the old file name)
        if (model.xml.element.getAttribute('id') === artifactName) {
            model.xml.element.setAttribute('id', newArtifactName);
            const oldName = nameReader(artifactName);
            const modelName = model.xml.element.getAttribute('name');
            const newModelName = oldName === modelName ? nameReader(newArtifactName) : modelName;
            model.xml.element.setAttribute('name', newModelName);
            console.log(` ===> UPDATE <${model.xml.element.tagName} id="${artifactName}" name="${oldName}">...</> to <${model.xml.element.tagName} id="${newArtifactName}" name="${newModelName}">...</>`);


            this.save(newArtifactName, XML.printNiceXML(model.xml.element) + '\n');
        }
        usedIn.forEach(reference => reference.model.save())
    }

    delete(artifactName: string) {
        Utilities.deleteFile(this.createPath(artifactName));
    }

    /**
     * 
     * @returns {Array<RepositoryElement>}
     */
    getElements() {
        return Utilities.getRepositoryFiles(this.repositoryPath).map(file => new RepositoryElement(this, file));
    }

    contents() {
        return new StoreAnalyzer(this).resolveUsageInformation().contents;
    }

    list() {
        return new StoreAnalyzer(this).resolveUsageInformation().list;
    }
}

exports.Store = Store;
