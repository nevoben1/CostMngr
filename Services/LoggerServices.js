/* Logger Services
   Provides logging functionality using Pino logger with pretty printing.
   Supports both console logging and database persistence of log entries. */

const pino = require('pino');
//const {createLog} = require('../Services/documentService');
const {createLog} = require('./DocumentService');

// Configure Pino logger with pretty printing for better readability
const logger = pino({
    transport:{
        target: "pino-pretty",
        options: {
            translateTime: "SYS:dd-mm-yyyy HH:MM:ss",  // Format timestamps
            ignore:"pid,hostname"  // Exclude process ID and hostname from logs
        }
    }
})

/* Creates an INFO level log entry
   Logs to console via Pino and persists to database */
function createInfoLog(message){
    logger.info(message);
    createLog({
        message: message,
        date: new Date(),
        type: 'INFO'
    }).catch(err => console.log(err));
}

/* Creates a log entry with specified severity level
   Parameters:
   - message: The log message to record
   - type: Log level (INFO, ERROR, WARNING, FATAL)
   - isAddToDB: Whether to persist log to database (default: false)
   Logs to console based on type, optionally persists to database */
function createLogByType(message , type , isAddToDB = false){
    // Route log to appropriate Pino logger method based on type
    switch(type){
        case 'INFO':
            logger.info(message);
            break;
        case 'ERROR':
            logger.error(message);
            break;
        case 'WARNING':
            logger.warn(message);
            break;
        case 'FATAL':
            logger.fatal(message);
            break;
    }
    // Optionally persist log to MongoDB for long-term storage and analysis
    if(isAddToDB){
        createLog({
            message: message,
            date: new Date(),
            type: type
        }).catch(err => console.log(err));
    }
}


/* HTTP Request Logger Middleware (Currently Disabled)
   Logs all incoming HTTP requests with method and URL
   Commented out to avoid logging /api/ calls per requirements */
/*function httpLogger(req, res, next) {
    // Log the request
    const message = `${req.method} ${req.originalUrl} called`;
    createLogByType(message, 'INFO', true);
    next();
}*/

// Export logging utilities for use across the application
module.exports = {logger , createInfoLog , createLogByType};