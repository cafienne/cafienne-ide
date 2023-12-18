'use strict';

const consts = require('../constant.js');
const fs = require('fs');
const pathLib = require('path');
const walkSync = require('walk-sync');
const mkdirp = require('mkdirp');
const { Store } = require('./store.js');
const XML = require('../xml.js').XML;
const { Reference } = require('./reference.js');
const { Usage } = require('./usage.js');

class RepositoryElement {
    /**
     * 
     * @param {Store} store 
     * @param {*} file 
     */
    constructor(store, file) {
        this.store = store;
        this.fileName = file.relativePath;
        this.type = pathLib.extname(this.fileName).substring(1);
        this.lastModified = file.mtime;
        this.content = store.load(this.fileName);
        /** @type {Array<Usage>} */
        this.usage = [];
        this.error = undefined;
        
    }

    fillReferenceInformation() {
        // if (this.fileName.indexOf('helloworld'))
        this.xml = XML.parse(this.content);
        if (this.xml.hasErrors) {
            this.setError(`${this.fileName} has parse errors: ` + this.xml.errors);
            return undefined;
        }

        if (this.xml.element && this.xml.element.nodeName !== this.expectedTagName) {
            this.setError(`${this.fileName} is invalid: expecting <${this.expectedTagName}> instead of <${this.xml.element.nodeName}>`);
        }
        this.id = this.xml.element.getAttribute('id') || this.fileName;
        this.name = this.xml.element.getAttribute('name') || '';
        this.referencedArtifacts = this.findReferences();
    }

    findReferences() {
        /**
         * Private function searching for all elements with given tagname having a value for the specified attribute name. Returns an array with those found values.
         * @param {String} tagName 
         * @param {String} attributeName 
         */
        const getReferences = (tagName, attributeName) =>
            XML.findElementsWithTag(this.xml.element, tagName) // Search for elements with the tagname
                .filter(element => element.getAttribute(attributeName) !== undefined)
                .filter(element => element.getAttribute(attributeName).trim() !== '')
                .map(element => new Reference(this, element, attributeName))

        const refs = getReferences('caseTask', 'caseRef');
        refs.push(...getReferences('processTask', 'processRef'))
        refs.push(...getReferences('caseFileItem', 'definitionRef'));
        refs.push(...getReferences('caseFileItemRef', 'cfiRef'));
        refs.push(...getReferences('cafienne:implementation', 'humanTaskRef'))
        refs.push(...getReferences('type', 'type'));
        return refs;
    }

    
    save() {
        if (this.saved) {
            console.log("Model " + this.fileName +" is already saved, returning")
        }
        this.store.save(this.fileName, XML.printNiceXML(this.xml.element) + '\n');
        this.saved = true;
    }

    setError(msg) {
        this.error = msg;
        console.log(`--- ERROR --- File ${msg}`);
    }

    get expectedTagName() {
        const extension = '.' + this.type;
        if (extension == consts.CASE_EXT) return 'case';
        if (extension == consts.CASE_DIMENSION_EXT) return 'CMMNDI'
        if (extension == consts.PROCESS_EXT) return 'process';
        if (extension == consts.CASE_DEFINITION_EXT) return 'definitions'; // not quite needed here, but ok.
        if (extension == consts.HUMANTASK_EXT) return 'humantask';
        if (extension == consts.CASE_FILE_ITEM_EXT) return 'caseFileItem';
        if (extension == consts.CASE_FILE_ITEM_DEFINITION_EXT) return 'caseFileItemDefinition';
        if (extension == consts.TYPE_EXT) return 'type';
        return '';
    }

    get apiInformation() {
        // Explicit contract
        return {
            fileName: this.fileName,
            type: this.type,
            lastModified: this.lastModified,
            usage: this.usage,
            error: this.error
        }
    }
}

exports.RepositoryElement = RepositoryElement;
