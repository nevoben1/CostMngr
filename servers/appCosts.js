/*
   Costs Microservice
  
   Express application dedicated to cost/expense management operations.
   Part of the microservices architecture - runs independently on port 3003.
   Handles cost creation and monthly reporting functionality.
  */

var createError = require('http-errors');
var express = require('express');
const mongoose = require('mongoose');
var path = require('path');
// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const {logger, httpLogger} = require('../Services/loggerServices');
mongoose.Promise = global.Promise;
var cookieParser = require('cookie-parser');

// Import cost routes
var costsRouter = require('../routes/costRoutes');

var app = express();

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGODB_URI, { autoIndex: true })
        .then(() => { logger.info('MongoDB Connected (Costs Service)') })
        .catch(err => logger.error('MongoDB connection error:', err));
}

// Configure Pug template engine
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

// Configure middleware stack
app.use(express.json());                              // Parse JSON request bodies
app.use(express.urlencoded({ extended: false }));     // Parse URL-encoded request bodies
app.use(cookieParser());                              // Parse cookies
app.use(express.static(path.join(__dirname, '../public')));  // Serve static files

// Mount cost routes under /api prefix
app.use('/api', costsRouter);

// Handle 404 errors - route not found
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler middleware
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};  // Only show stack trace in development
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
