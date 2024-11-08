'use strict';

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { WalkSyncEntry, entries } from "walk-sync";
import Extensions from "../store/extensions";

export default class Utilities {

    static getFiles(directory: string) {
        const files: Array<WalkSyncEntry> = entries(directory, { directories: false, ignore: ['**/.*'] });
        return files;
    }

    static getRepositoryFiles(directory: string) {
        return this.getFiles(directory).filter(file => Extensions.isKnown(path.extname(file.relativePath)));
    }

    static ensureDirectory(fileName: string) {
        if (! this.hasFile(path.dirname(fileName))) {
            mkdirSync(path.dirname(fileName), { recursive: true });
        }
    }

    static hasFile(fileName: string): boolean {
        return existsSync(fileName);
    }

    static readFile(fileName: string) {
        const content = readFileSync(fileName, { encoding: 'utf8' });
        return content;
    }

    static saveFile(fileName: string, content: any) {
        this.ensureDirectory(fileName);
        // Always add a newline, because most XML serializations don't print it, and then it looks ugly in git
        writeFileSync(fileName, content + '\n');
    }

    static deleteFile(fileName: string) {
        unlinkSync(fileName);
    }

    static renameFile(currentFileName: string, newFileName: string) {
        this.ensureDirectory(currentFileName);
        this.ensureDirectory(newFileName);
        renameSync(currentFileName, newFileName);
    }

    static createAbsolutePath(rootFolder: string, artifactName: string) {
        // Check to make sure no one is reading/writing outside of the repository folder
        const fullPathOfArtifact = path.resolve(rootFolder, artifactName);
        const fullPathOfRepository = path.resolve(rootFolder);
        if (!fullPathOfArtifact.startsWith(fullPathOfRepository)) {
            throw new Error('Someone is trying to read outside of the repository context: ' + artifactName);
        }

        // Check for valid extension; cannot just load anything from the server
        const extension = path.extname(fullPathOfArtifact);
        if (!Extensions.isKnown(extension)) {
            throw new Error('Invalid extension for file ' + artifactName);
        }
        return fullPathOfArtifact;
    }
}

exports.Utilities = Utilities;
