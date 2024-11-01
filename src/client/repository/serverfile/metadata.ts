/**
 * Array with id/name of the files where this file is used in 
 */
export type Usage = [{
    id: string,
    name: string
}];

export default class Metadata {
    fileName: any;
    lastModified: any;
    usage: Usage;
    error: any;
    type: any;
    serverContent: any;

    static from(json: any) {
        return new Metadata(json);
    }

    constructor(json: any) {
        this.fileName = json.fileName;
        this.lastModified = json.lastModified;
        this.usage = json.usage;
        this.error = json.error;
        this.type = json.type;
        this.serverContent = json.content;
    }
}
