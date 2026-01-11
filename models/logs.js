/*
   Log Model
  
   Mongoose schema for storing application log entries in MongoDB.
   Provides persistent storage of system events, errors, and informational messages.
  */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
   Log Schema Definition
  
   @property {String} message - Log message content
   @property {Date} date - Timestamp when the log was created
   @property {String} type - Log severity level (INFO, ERROR, WARN, FATAL)
  */
const LogsSchema = new Schema({
    message: {
        type: String  // The actual log message
    },
    date: {
        type: Date    // When the log entry was created
    },
    type: {
        type: String  // Severity level for filtering and alerting
    }
});

// Create and export Mongoose model for 'logs' collection
const Log = mongoose.model('logs',LogsSchema);

module.exports = Log;