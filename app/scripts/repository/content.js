class Content {
    /**
     * @param {ServerFile} file 
     */
    constructor(file) {
        this.file = file;
    }

    get source() {
        return this._source;
    }

    set source(source) {
        // If we get a new source, flatten and parse it, and also remove the existing definition
        const stringifiedSource = this.serialize(source);
        if (!this._serialized || this._serialized !== stringifiedSource) { // source undefined or it is a real change
            this._source = source;
            this._definition = undefined;
            this._serialized = undefined;
            this._deserialized = undefined;
        }
    }

    /**
     * Returns the deserialized version of the source (e.g. as a Document or JSON Object)
     */
    get deserialized() {
        if (! this._deserialized) {
            this._deserialized = this.deserialize(this._source);
        }
        return this._deserialized;
    }

    /**
     * Returns the deserialized version of the content as an XML Element.
     * @returns {Element}
     */
    get xml() {
        const tree = this.deserialized;
        if (tree && tree instanceof Element) return tree;
        if (tree && tree instanceof Document) return tree.documentElement;
        return tree;
    }

    /**
     * Parse the source into a base structure that can be given as input to the craeteDefinition() call.
     * Basically parses a string to XML or to JSON, dependending on the storage in the server.
     * @param {*} source 
     */
    deserialize(source) {
        if (source instanceof Node) return source;
        if (typeof(source) === 'string') return XML.parseXML(source); // TODO: extends this for JSON
        if (source instanceof Object) return source;
        return source;
    }

    /**
     * Returns a stringified version of the source.
     */
    get serialized() {
        if (! this._serialized) {
            this._serialized = this.serialize(this._source);
        }
        return this._serialized;
    }

    /**
     * Make a stringified version of the source
     * @param {*} source 
     */
    serialize(source) {
        if (source instanceof Node) return XML.prettyPrint(source);
        if (typeof(source) === 'string') return source;
        if (source instanceof Object) return JSON.stringify(source, undefined, 2);
        return source; // This may well return undefined;
    }

    /** @type {ModelDefinition} */
    get definition() {
        if (!this._definition) {
            this._definition = this.file.createDefinition();
            this._definition.parseDocument();
            this._definition.validateDocument();
        }
        return this._definition;
    }

    set definition(definition) {
        this._definition = definition;
    }
}
