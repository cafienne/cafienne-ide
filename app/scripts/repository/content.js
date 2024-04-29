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
        if (this._source !== source) {
            this._definition = undefined;
            this._source = source;
            const xml = XML.parseXML(source);
            this.xml = xml  ? xml.documentElement : xml;
        }
    }

    /** @type {ModelDefinition} */
    get definition() {
        return this._definition;
    }

    set definition(definition) {
        this._definition = definition;
    }
}
