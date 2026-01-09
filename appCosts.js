var createError = require('http-errors');
var express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const {logger, httpLogger} = require('./Services/loggerServices');
mongoose.Promise = global.Promise;
var path = require('path');
var cookieParser = require('cookie-parser');

var costsRouter = require('./routes/costRoutes');

var app = express();

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGODB_URI, { autoIndex: true })
        .then(() => { logger.info('MongoDB Connected (Costs Service)') })
        .catch(err => logger.error('MongoDB connection error:', err));
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(httpLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', costsRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
