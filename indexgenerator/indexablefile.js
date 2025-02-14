const { readdirSync, writeFileSync, statSync, readFileSync } = require('fs');
const { join } = require('path');
const IndexGenerator = require('./indexgenerator');

const SCRIPT_FILE_EXTENSIONS = /(\.ts)|(\.js)$/;

class IndexableFile {
    /**
     * 
     * @param {IndexGenerator} generator 
     * @param {String} fileName 
     * @param {String} relativeName
     */
    constructor(generator, fileName, relativeName) {
        this.generator = generator;
        this.fileName = fileName;
        this.relativeName = relativeName;
        this.classNames = (/**@type {Array<String>} */[]);
        this.exportStatements = (/**@type {Array<Export>} */[]);        
    }

    detectExports() {
        // File must be .ts or .js
        if (! this.fileName.match(SCRIPT_FILE_EXTENSIONS)) return;
        // File must not be index.js or index.ts
        if (this.fileName === 'index.js' || this.fileName === 'index.ts') return;
        // File must not be a type declaration
        if (this.fileName.endsWith('.d.ts') || this.fileName.endsWith('.d.js')) return;

        this.fileContent = readFileSync(this.fileName, 'utf-8');

        this.findDefaultExport();
        this.findOtherExports();
    }

    findDefaultExport() {
        const DEFAULT_EXPORTS = /export\s+(default\s+)(class\s+|interface\s+|(async\s+)?function\s+)?(\w+)/g;
        const defaultMatch = DEFAULT_EXPORTS.exec(this.fileContent);
        if (defaultMatch !== null) {
            this.exportStatements.push(new Export(defaultMatch[4], true));
        }
    }

    findOtherExports() {
        const OTHER_EXPORTS = /export\s+(class|interface|(async\s+)?function)\s+(\w+)/g;
        let match;
        while ((match = OTHER_EXPORTS.exec(this.fileContent)) !== null) {
            this.exportStatements.push(new Export(match[3]));
        }
    }

    /**
     * 
     * @returns String
     */
    generateStatement() {
        if (this.exportStatements.length === 0) {
            return '';
        } else {
            const modulePath = this.relativeName.replace(SCRIPT_FILE_EXTENSIONS, '');

            return `export { ${this.exportStatements.map(exp => exp.toString()).join(", ")} } from "${modulePath}";\n`;
        }
    }
}

class Export {
    constructor(name, isDefault = false) {
        this.name = name;
        this.isDefault = isDefault;
    }

    toString() {
        return this.isDefault ? `default as ${this.name}` : this.name;
    }
}

exports.IndexableFile = IndexableFile;