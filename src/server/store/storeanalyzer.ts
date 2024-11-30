'use strict';

import Reference from "./reference";
import RepositoryElement from "./repositoryelement";
import Store from "./store";

/**
 * This class keeps track of artifacts usage.
 */
export default class StoreAnalyzer {
    public models: Array<RepositoryElement> = [];
    /**
     * 
     * @param {Store} store 
     */
    constructor(public store: Store) {
        this.store = store;
        this.models = this.store.getElements();
        // Create analysis information on all models in the store. Parses them as XML, searches for referencing attributes.
        this.models.forEach(model => model.fillReferenceInformation());
    }

    /**
     * 
     * @param {RepositoryElement} source 
     * @returns {Array<Reference>}
     */
    findReferences(source: RepositoryElement): Array<Reference> {
        // Filter out models that have parse errors.
        const references = this.models.filter(model => !model.error).map(model => model.referencedArtifacts.filter(reference => reference.id === source.fileName)).filter(use => use.length > 0);
        // Flatten to set and then make it an array ...
        return Array.from(new Set(flatten(references)));
    }

    get contents() {
        return this.models.map(model => model.json);
    }

    get list() {
        return this.models.map(model => ({...model.json, content: undefined}));
    }
}

/**
 * Recursive flattener for older node.js version we're on :(
 * @param {Array<Array<Reference>>} array 
 * @returns {Array<Reference>}
 */
function flatten(array: Array<Array<Reference>>) {
    const result: Array<Reference> = [];
    array.forEach(element => result.push(...element))
    return result;
}

exports.StoreAnalyzer = StoreAnalyzer;
