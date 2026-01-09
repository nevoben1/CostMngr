var createError = require('http-errors');
var express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const {logger, httpLogger} = require('./Services/loggerServices');
mongoose.Promise = global.Promise;
var path = require('path');
var cookieParser = require('cookie-parser');

var adminRouter = require('./routes/adminRoutes');

var app = express();

// Only connect to the database if we are NOT in a test environment
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGODB_URI, { autoIndex: true })
        .then(() => { logger.info('MongoDB Connected (Admin Service)') })
        .catch(err => logger.error('MongoDB connection error:', err));
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(httpLogger); // Global logging middleware

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', adminRouter); // Mount at root or specific prefix? Reqs say "provide four different URL addresses".
// Usually endpoints are like GET /about. So if I mount at /, it becomes GET /about. Correct.

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
