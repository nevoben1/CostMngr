var createError = require('http-errors');
var express = require('express');
const mongoose = require('mongoose');
var path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const {logger, httpLogger} = require('../Services/loggerServices');
mongoose.Promise = global.Promise;
var cookieParser = require('cookie-parser');

var usersRouter = require('../routes/userRoutes');

var app = express();

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGODB_URI, { autoIndex: true })
        .then(() => { logger.info('MongoDB Connected (Users Service)') })
        .catch(err => logger.error('MongoDB connection error:', err));
}

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', usersRouter);

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
