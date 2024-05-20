const startMoment = new Date();
console.log("Starting Cafienne IDE Server at " + startMoment);

const RepositoryRouter = require("./repository/repository-router").RepositoryRouter;
const config = require('../config/config');
const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');


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
app.use(favicon(path.join(__dirname, 'favicon.ico')));


app.use('/repository', RepositoryRouter);

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
