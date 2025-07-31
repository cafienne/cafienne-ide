import TrainingStorage from '../repository/llm/trainingstorage';
import Metadata from '../repository/serverfile/metadata';
import XML from '../util/xml';
import $ajax, { $get, AjaxError } from './util/ajax';

export default class RemoteTrainingStorage extends TrainingStorage {
    
    repositoryUrl: string;

    constructor(baseUrl: string) {
        super();
        this.repositoryUrl = `${baseUrl}/training_repository`;
    }

    async renameTrainingForModel(oldFileName: string, newFileName: string, updatedContent: any): Promise<Metadata[]> {
        console.groupCollapsed(`Renaming '${oldFileName}' to '${newFileName}'`);
        const url = `${this.repositoryUrl}/rename/${oldFileName}?newName=${newFileName}`;
        const type = 'put';
        const content = XML.prettyPrint(updatedContent);

        console.log(`Sending server request to rename '${oldFileName}' to '${newFileName}'`);
        const response = await $ajax({ url, type, data: content, headers: { 'content-type': 'application/xml' } })
            .catch((error: AjaxError) => { throw new Error('We could not rename the file: ' + error.message) });

        return response.data;
    }

    async addSetPointAndSave(fileName: any, source: string, instruction: string): Promise<Metadata[]> {
        //ready instrution and source for json transfer.
        const escapedXML = source.replace(/"/g, '\"').replace(/\r\n/g, '').replace(/\r\n/g, '').replace(/>\s+</g, '><');
        const content = JSON.stringify({ "instruction": instruction, "source": escapedXML });
        
        const url = `${this.repositoryUrl}/addsetpoint_and_save/${fileName}`;
        const type = 'post';
        const response = await $ajax({ url, data: content, type, headers: { 'content-type': 'application/json' } })
            .catch(() => {
                throw 'We could not save your work due to an error in the server. Please refresh the browser and make sure the server is up and running';
            });

        return response.data;
    }

    async deleteTrainingForModel(fileName: any): Promise<Metadata[]> {
        const url = `${this.repositoryUrl}/delete/${fileName}`;
        const type = 'delete';
        const response = await $ajax({ url, type });

        return response.data;
    }

    async loadTrainingForModel(fileName: string) {
        const url = `${this.repositoryUrl}/load/${fileName}`;
        const type = 'get';

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
        return response.data;
    }

    async listTrainedModels(): Promise<Metadata[]> {
        const url = `${this.repositoryUrl}/list`;
        return await $get(url)
            .catch((error: AjaxError) => {
                console.log(error)
                throw 'Could not fetch the list of models: ' + error.message
            });
    }
    
}
