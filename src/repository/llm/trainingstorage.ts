import Metadata from "../serverfile/metadata";

export default abstract class TrainingStorage {
    abstract renameTrainingForModel(fileName: string, newFileName: string, updatedContent: any): Promise<Metadata[]>;

    abstract addSetPointAndSave(fileName: string, source: any, insstruction: string): Promise<Metadata[]>;

    abstract deleteTrainingForModel(fileName: string): Promise<Metadata[]>;

    abstract loadTrainingForModel(fileName: string): Promise<any>;

    abstract listTrainedModels(): Promise<Metadata[]>;

}
