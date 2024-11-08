'use strict';

import RepositoryElement from "./repositoryelement";
import Usage from "./usage";

export default class Reference {
    public id: string | null;
    /**
     * 
     * @param {RepositoryElement} model 
     * @param {Element} element 
     * @param {String} attributeName
     */
    constructor(public model: RepositoryElement, public element: Element, public attributeName: string) {
        this.model = model;
        this.element = element;
        this.attributeName = attributeName;
        this.id = element.getAttribute(attributeName);
        // console.log("Model "+ model.fileName + " references " + id)
    }

    get usage() {
        return new Usage(this.model.fileName, ''+this.model.id);
    }

    setNewId(newId: string) {
        this.id = newId;
        this.element.setAttribute(this.attributeName, newId);
    }
}
