'use strict';

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "fs";
import path from "path";
import { Entry, entries } from "walk-sync";

function isKnownExtension(extension: string): boolean {
    return ['.case', '.process', '.humantask', '.dimensions', '.cfid', '.type', '.xml'].indexOf(extension) >= 0;
}

export class Utilities {
    static logging: boolean = false;
    private static date = new Date();

    static logMessage: (msg: string) => void = (msg:string) => {}; // By default ignore logging from 'ensureDirectory'

    static getFiles(directory: string) {
        const files: Array<Entry> = entries(directory, { directories: false, ignore: ['**/.*'] });
        return files;
    }

    static getRepositoryFiles(directory: string) {
        return this.getFiles(directory).filter(file => isKnownExtension(path.extname(file.relativePath)));
    }

    static ensureDirectory(fileName: string) {
        if (! this.hasFile(path.dirname(fileName))) {
            this.logMessage("MKDIR  " + path.dirname(fileName));
            mkdirSync(path.dirname(fileName), { recursive: true });
        }
    }

    static hasFile(fileName: string): boolean {
        return existsSync(fileName);
    }

    static readFile(folder: string, fileName: string) {
        const file = this.createAbsolutePath(folder, fileName);
        const content = readFileSync(file, { encoding: 'utf8' });
        return content;
    }

    static writeFile(folder: string, fileName: string, content: any) {
        const file = this.createAbsolutePath(folder, fileName);
        this.ensureDirectory(file);
        // Add a newline, since some XML serializations don't print it, and then it looks ugly in git
        if (typeof content === 'string' && !content.endsWith('\n')) {
            content = content + '\n';
        }
        writeFileSync(file, content);
    }

    static deleteFile(folder: string, fileName: string) {
        const file = this.createAbsolutePath(folder, fileName);
        unlinkSync(file);
    }

    static renameFile(folder: string, currentFileName: string, newFileName: string) {
        const currentFile = this.createAbsolutePath(folder, currentFileName);
        const newFile = this.createAbsolutePath(folder, newFileName);
        this.ensureDirectory(currentFile);
        this.ensureDirectory(newFile);
        renameSync(currentFile, newFile);
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
        if (!isKnownExtension(extension)) {
            throw new Error(`'Invalid extension '${extension}' for file '${artifactName}'`);
        }
        return fullPathOfArtifact;
    }
}

exports.Utilities = Utilities;
