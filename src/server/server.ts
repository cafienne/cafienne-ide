const startMoment = new Date();
console.log(`Starting Cafienne IDE Server at ${startMoment}`);
console.log('==================================================   ');

import bodyParser from 'body-parser';
import express, { Request, Response } from 'express';
import morgan from 'morgan';
import path from 'path';
import RepositoryConfiguration from '../config/config';
import LocalFileStorage from '../repository/storage/localfilestorage';
import Logger from './logger';
import ServerConfiguration from './serverconfiguration';

const repositoryConfig = new RepositoryConfiguration();
const repositoryPath = repositoryConfig.repository;
const deployPath = repositoryConfig.deploy;

const serverConfig = new ServerConfiguration();
const logger = new Logger();

const storage = new LocalFileStorage(repositoryConfig);
const router = express.Router();
const xmlParser = bodyParser.text({ type: 'application/xml', limit: '50mb' });


/**
 * Returns the repository contents by name, last modified timestamp and usage information
 */
router.get('/list', async (_req: Request, res: Response) => {
    logger.printAction(`LIST`);
    res.json(await storage.listModels());
});

/**
 *  Get a file from the repository.
 */
router.get('/load/*', async function (req: Request, res: Response, _next) {
    const fileName = req.params[0];
    logger.printAction(`LOAD   /${fileName}`);
    try {
        const content = await storage.loadModel(fileName);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('x-sent', 'true');
        res.send(content);
    } catch (err: any) {
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
router.post('/save/*', xmlParser, async function (req: Request, res: Response, _next) {
    try {
        const fileName = req.params[0];
        logger.printAction(`SAVE   /${fileName}`);
        res.json(await storage.saveModel(fileName, req.body));
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Rename a file in the repository
 */
router.put('/rename/:fileName', xmlParser, async function (req: Request, res: Response, _next) {
    // Note: this code takes the new name from the query parameter ?newName=
    try {
        const fileName = req.params.fileName;
        const newName = req.query.newName?.toString() ?? (() => { throw new Error('newName query parameter is required'); })();
        const newContent = req.body;
        logger.printAction(`RENAME /${fileName} to /${newName}`);
        return res.json(await storage.renameModel(fileName, newName, newContent));
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
        return [];
    }
});

/**
 * Rename a file in the repository
 */
router.delete('/delete/*', async function (req: Request, res: Response, _next) {
    try {
        const fileName = req.params[0];
        logger.printAction(`DELETE /${fileName}`);
        await res.json(storage.deleteModel(fileName));
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

/**
 * Deploy a file and it's dependencies from the repository to the deployment folder
 */
router.post('/deploy/*', xmlParser, async function (req: Request, res: Response, _next) {
    try {
        const fileName = req.params[0];
        logger.printAction(`DEPLOY /${fileName}`);
        res.setHeader('Content-Type', 'application/xml');
        res.json(await storage.deploy(fileName, req.body));
        res.status(201).end();
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

const app = express();
app.use(morgan('dev', logger));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/node_modules', express.static(path.join(__dirname, '/../../node_modules')));

// Do not add static content when running in a docker container.
// The docker container serves static content via nginx
if (app.get('env') !== 'docker') {
    app.use(express.static(path.join(__dirname, '/../app')));
}

app.use('/repository', router);

// catch 404 and forward to error handler
app.use(function (req: Request, _res: Response, next) {
    const err: any = new Error('Not Found: ' + req.url);
    err.status = 404;
    next(err);
});

app.listen(serverConfig.port, () => {
    const startCompleted = new Date();
    console.log('- sources location: ' + path.resolve(repositoryPath));
    console.log('-  deploy location: ' + path.resolve(deployPath)); // Intentional double space to align both configuration values
    console.log('==================================================   ');
    console.log(`Cafienne IDE Server started (in ${startCompleted.getTime() - startMoment.getTime()}ms) on http://localhost:${serverConfig.port}\n`);
});
