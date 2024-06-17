export default class Metadata {
    constructor(json) {
        this.fileName = json.fileName;
        this.lastModified = json.lastModified;
        this.usage = json.usage;
        this.error = json.error;
        this.type = json.type;
        this.serverContent = json.content;
    }
}
