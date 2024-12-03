'use strict';


const express = require('express');
const bodyParser = require('body-parser');
const config = require('../../config/config');
const { Utilities } = require('../utilities');

const Repository = require('@cafienne/repository').Repository;

const repository = new Repository(config);

const router = express.Router();
const xmlParser = bodyParser.text({ type: 'application/xml', limit: '50mb' });


exports.RepositoryRouter = router;

/**
 * Returns the repository contents by name, last modified timestamp and usage information
 */
router.get('/list', function (req, res, next) {
    const list = repository.contents();
    res.json(list);
});

/**
 *  Get a file from the repository.
 */
router.get('/load/*', function (req, res, next) {
    const fileName = req.params[0];
    try {
        const content = repository.load(fileName);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('x-sent', 'true');
        res.send(content);
    } catch (err) {
        const error = err;
        if (error.code === 'ENOENT') {
            // File does not exist, just return an empty string
            res.sendStatus(404);
        } else {
            console.error(error);
            res.sendStatus(500);
        }
    }
});

/**
 * Save a file to the repository
 */
router.post('/save/*', xmlParser, function (req, res, next) {
    try {
        const fileName = req.params[0];
        repository.save(fileName, req.body);

        const list = repository.list();
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Rename a file in the repository
 */
router.put('/rename/:fileName', xmlParser, function (req, res, next) {
    // Note: this code takes the new name from the query parameter ?newName=
    try {
        const fileName = req.params.fileName;
        const newName = req.query.newName;
        const newContent = req.body;
        // logMessage(`RENAME  /${fileName} to /${newName}`);
        Utilities.renameFile(config.repository, fileName, newName);
        Utilities.writeFile(config.repository, newName, newContent);
        const list = repository.contents();
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Rename a file in the repository
 */
router.delete('/delete/*', function (req, res, next) {
    try {
        const fileName = req.params[0];
        repository.delete(fileName);
        const list = repository.list();
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Deploy a file and it's dependencies from the repository to the deployment folder
 */
router.post('/deploy/*', xmlParser, function (req, res, next) {
    const artifactToDeploy = req.params[0];
    try {
        // const deployedFile = repository.deploy(artifactToDeploy);
        Utilities.writeFile(config.deploy, artifactToDeploy, req.body);
        console.log('Deployed ' + artifactToDeploy);
        res.setHeader('Content-Type', 'application/xml');
        res.status(201).end();
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Preview what the deployment of a file and it's dependencies looks like
 */
router.get('/viewCMMN/*', (req, res, next) => {
    try {
        const fileName = req.params[0];

        const definitions = repository.composeDefinitionsDocument(fileName);
        const response = definitions.deployContents;
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('x-sent', 'true');
        res.send(response);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

