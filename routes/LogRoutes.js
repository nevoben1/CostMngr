/*
   Log Routes
  
   Provides endpoints for retrieving application logs from the database
  */

const express = require('express');
const router = express.Router();
const { createLogByType } = require('../Services/LoggerServices');
const logLevel = require('../Services/LogLevel');
const { getAllLogs } = require('../Services/DocumentService');

/*
   GET /logs
   Retrieves all log entries from the database
  
   @returns {Array<Log>} Array of all log documents
  
   Note: Logs to console only (not DB) to avoid potential infinite loops
   when querying logs that would themselves generate log entries
  */
router.get('/logs', async function(req, res, next) {
    try {
        // Log to console only to avoid infinite loop of logging log requests
        createLogByType('GET /logs called', logLevel.INFO);
        // Note: we might not want to log the log request to DB to avoid infinite loops if not careful,
        // but requirements say "log message should be written to the database for every HTTP request".
        // The middleware handles the automatic logging. This manual one is extra or for specific logic.

        // Retrieve all logs from MongoDB
        const logs = await getAllLogs();
        res.send(logs);
    } catch(err) {
        createLogByType('Error getting logs: ' + err, logLevel.ERROR, true);
        next(err);
    }
});

module.exports = router;
