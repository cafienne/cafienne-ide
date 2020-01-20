'use strict';

const Path = require('path');
const Consts = require('./constant.js');
const XML = require('./xml').XML;

class Upgrade {

  constructor(store) {
    this.store = store;
  }

  start() {
    const files = this.store.list();
    for (let i = 0; i < files.length; i++) {
      const filename = files[i].filename;
      const extension = Path.extname(filename);
      if (extension === Consts.CASE_EXT) {
        this.migrateCase(filename);
      }
    }
  }

  migrateCase(filename) {
    const content = this.store.load(filename);
    const rootElement = XML.loadXMLElement(content);
    if (rootElement.nodeName === 'definitions') {
      console.log('Upgrading ' + filename);
      const caseElement = rootElement.getElementsByTagName("case")[0];
      this.migrateCaseAttribute(caseElement, 'id');
      this.migrateCaseTaskIds(caseElement);
      this.store.save(filename, XML.printNiceXML(caseElement));
    }
  }

  migrateCaseAttribute(caseElement, attribName) {
    let caseId = caseElement.getAttribute(attribName);
    caseId = this.convertCaseId(caseId);
    caseElement.setAttribute(attribName, caseId);
  }

  migrateCaseTaskIds(caseElement) {
    const caseTasks = caseElement.getElementsByTagName('caseTask');
    for (let i = 0; i < caseTasks.length; i++) {
      this.migrateCaseAttribute(caseTasks[i], 'caseRef');
    }
  }

  convertCaseId(caseId) {
    let newCaseId = caseId;
    const regexp = /(.+?\.case)/;
    var match = regexp.exec(caseId);
    if (match != null) {
      newCaseId = match[1]
    }
    return newCaseId;
  }
}

exports.Upgrade = Upgrade;