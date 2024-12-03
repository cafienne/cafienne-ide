const startMoment = new Date();
console.log("Starting Cafienne IDE Server at " + startMoment);

const express = require('express');
const bodyParser = require('body-parser');
const config = require('../../config/config');
const path = require('path');
const logger = require('morgan');

const Repository = require('./server_bundle.js').Repository;
const repository = new Repository(config);

const router = express.Router();
const xmlParser = bodyParser.text({ type: 'application/xml', limit: '50mb' });

/**
 * Returns the repository contents by name, last modified timestamp and usage information
 */
router.get('/list', function (req, res, next) {
    const list = repository.contents();
    res.json(list);
});

router.get('/config', (req, res) => {
    res.json(Object.assign({ server: config.backendUrl }));
})

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
        const newFileName = req.query.newName;
        repository.rename(fileName, newFileName, req.body);

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
    try {
        const fileName = req.params[0];
        repository.deploy(fileName, req.body);
        console.log('Deployed ' + fileName);
        res.setHeader('Content-Type', 'application/xml');
        res.status(201).end();
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

const app = express();

const logOptions = {};
if (!config.log_traffic) {
  console.log("Only HTTP errors are logged");
  logOptions.skip = (req, res) => {
    // Only log failures
    return res.statusCode < 400
  }
}
app.use(logger('dev', logOptions));
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
app.use(function (req, res, next) {
  const err = new Error('Not Found: ' + req.url);
  err.status = 404;
  next(err);
});

app.listen(config.serverPort, () => {
  const started = new Date();
  console.log(`Cafienne IDE Server started (${started - startMoment}ms) on http://localhost:${config.serverPort}`);
});
