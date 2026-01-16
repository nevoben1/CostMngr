/*
   Logs Microservice
  
   Express application dedicated to log retrieval operations.
   Part of the microservices architecture - runs independently on port 3004.
   Provides access to persisted application logs from MongoDB.
  */

const createError = require('http-errors');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const {logger, httpLogger} = require('../Services/loggerServices');
const { ErrorIds, createErrorResponse } = require('../utils/errorResponse');
mongoose.Promise = global.Promise;
const cookieParser = require('cookie-parser');

// Import log routes
const logsRouter = require('../routes/logRoutes');

const app = express();

// Connect to MongoDB (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGODB_URI, { autoIndex: true })
        .then(() => { logger.info('MongoDB Connected (Logs Service)') })
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

// Mount log routes under /api prefix
app.use('/api', logsRouter);

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
