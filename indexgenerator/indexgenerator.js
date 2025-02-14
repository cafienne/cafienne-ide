const { readdirSync, writeFileSync, statSync } = require('fs');
const { join } = require('path');

const IndexableFile = require('./indexablefile.js').IndexableFile;

const exclusionPatterns = [
    /^\.\/ide\//,
    /^\.\/validate\//,
    /^\.\/deploy\//,
];


class IndexGenerator {
    /**
     * @param {String} targetDirectory 
     * @param  {String[]} rootDirectories 
     */
    constructor(targetDirectory, ...rootDirectories) {
        this.targetDirectory = targetDirectory;
        if (rootDirectories.indexOf(targetDirectory) < 0) {
            rootDirectories.push(targetDirectory);
        }
        this.rootDirectories = rootDirectories;
        this.files = (/**@type {Array<IndexableFile>} */ []);
    }

    collectFiles() {
        this.rootDirectories.forEach(directory => this.readDirectoryContents(directory, '.'));
    }

    /**
     * 
     * @param {String} directory 
     * @param {String} relativeDirectory 
     */
    readDirectoryContents(directory, relativeDirectory) {
        const entries = readdirSync(directory);
        entries.forEach(entry => {
            const relativePath = [relativeDirectory, entry].join('/');
            if (exclusionPatterns.some(pattern => pattern.test(relativePath))) {
                return;
            }
            const filePath = join(directory, entry);
            const stat = statSync(filePath);

            if (stat.isDirectory()) {
                this.readDirectoryContents(filePath, relativePath);
            } else if (stat.isFile()) {
                this.files.push(new IndexableFile(this, filePath, relativePath));
            }
        });
    }

    generateExportStatements() {
        this.files.forEach(file => file.detectExports());
        this.exportStatements = this.files.map(file => file.generateStatement()).join('');
    }

    writeIndexFile() {
        writeFileSync(join(this.targetDirectory, './index.js'), this.exportStatements);
    }
}

exports.IndexGenerator = IndexGenerator;