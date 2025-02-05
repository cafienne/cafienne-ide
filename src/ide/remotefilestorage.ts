import Metadata from '../repository/serverfile/metadata';
import FileStorage from '../repository/storage/filestorage';
import XML from '../util/xml';
import $ajax, { $get, AjaxError } from './util/ajax';

export default class RemoteFileStorage extends FileStorage {
    repositoryUrl: string;

    constructor(baseUrl: string) {
        super();
        this.repositoryUrl = `${baseUrl}/repository`;
    }

    async renameModel(oldFileName: string, newFileName: string, updatedContent: any): Promise<Metadata[]> {
        console.groupCollapsed(`Renaming '${oldFileName}' to '${newFileName}'`);
        const url = `${this.repositoryUrl}/rename/${oldFileName}?newName=${newFileName}`;
        const type = 'put';
        const content = XML.prettyPrint(updatedContent);

        console.log(`Sending server request to rename '${oldFileName}' to '${newFileName}'`);
        const response = await $ajax({ url, type, data: content, headers: { 'content-type': 'application/xml' } })
            .catch((error: AjaxError) => { throw new Error('We could not rename the file: ' + error.message) });

        return response.data;
    }

    async saveModel(fileName: any, source: any): Promise<Metadata[]> {
        const content = XML.prettyPrint(source);
        const url = `${this.repositoryUrl}/save/${fileName}`;
        const type = 'post';
        const response = await $ajax({ url, data: content, type, headers: { 'content-type': 'application/xml' } })
            .catch(() => {
                throw 'We could not save your work due to an error in the server. Please refresh the browser and make sure the server is up and running';
            });

        return response.data;
    }

    async deleteModel(fileName: any): Promise<Metadata[]> {
        const url = `${this.repositoryUrl}/delete/${fileName}`;
        const type = 'delete';
        const response = await $ajax({ url, type });

        return response.data;
    }

    async loadModel(fileName: string) {
        const url = `${this.repositoryUrl}/load/${fileName}`;
        const type = 'get';
        console.log('Loading ' + url);

        const response = await $ajax({ type, url }).catch((error: AjaxError) => {
            if (error.xhr && error.xhr.status === 404) {
                throw `File "${fileName}" cannot be found in the repository. Perhaps it has been deleted`;
            } else {
                throw error;
            }
        });
        if (response.xhr.responseText === '') {
            const msg = fileName + ' does not exist or is an empty file in the repository';
            console.warn(msg);
            // we could reject?
        }
        console.log(`Fetched ${fileName}, calling parse with data `, response.data);
        return response.data;
    }

    async listModels(): Promise<Metadata[]> {
        const url = `${this.repositoryUrl}/list`;
        return await $get(url)
            .catch((error: AjaxError) => {
                throw 'Could not fetch the list of models: ' + error.message
            });
    }
}
