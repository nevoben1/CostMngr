/* Main Application Configuration
   Primary Express application that consolidates all API routes.
   Runs on port 3000 (configured in bin/www).
   This serves as an alternative to using the separate microservices.

   Architecture:
   - Connects to MongoDB for data persistence
   - Uses Pug for view templating
   - Provides consolidated API endpoints under /api
   - Serves static files from /public directory */

var createError = require('http-errors');
var express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();  // Load environment variables from .env file
const {logger} = require('./Services/loggerServices');
const { ErrorIds, createErrorResponse } = require('./utils/errorResponse');
mongoose.Promise = global.Promise;
var path = require('path');
var cookieParser = require('cookie-parser');

// Import route handlers
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGODB_URI, { autoIndex: true })
        .then(() => { logger.info('MongoDB Connected') })
        .catch(err => logger.error('MongoDB connection error:', err));
}

// Configure Pug template engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Configure middleware stack
//app.use(logger('dev'));
app.use(express.json());                           // Parse JSON request bodies
app.use(express.urlencoded({ extended: false }));  // Parse URL-encoded request bodies
app.use(cookieParser());                           // Parse cookies
app.use(express.static(path.join(__dirname, 'public')));  // Serve static files

// Mount route handlers
app.use('/', indexRouter);       // Home page route
app.use('/users', usersRouter);  // Legacy users route
app.use('/api' , apiRouter);     // Main API routes (costs, users, admin)

// Handle 404 errors - route not found
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler middleware - returns JSON responses
app.use(function(err, req, res, next) {
  const statusCode = err.status || 500;
  const errorId = statusCode === 404 ? ErrorIds.RESOURCE_NOT_FOUND : ErrorIds.INTERNAL_SERVER_ERROR;
  const message = err.message || 'An unexpected error occurred';

  // Create base error response
  const errorResponse = createErrorResponse(errorId, message);

  // Include stack trace in development mode
  if (req.app.get('env') === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send JSON error response
  res.status(statusCode).json(errorResponse);
});

module.exports = app;
