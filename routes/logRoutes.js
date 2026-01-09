const express = require('express');
const router = express.Router();
const { createLogByType } = require('../Services/loggerServices');
const logLevel = require('../Services/logLevel');
const { getAllLogs } = require('../Services/documentService');

router.get('/logs', async function(req, res, next) {
    try {
        createLogByType('GET /logs called', logLevel.INFO); 
        // Note: we might not want to log the log request to DB to avoid infinite loops if not careful, 
        // but requirements say "log message should be written to the database for every HTTP request".
        // The middleware handles the automatic logging. This manual one is extra or for specific logic.
        // Since we added httpLogger middleware, we might be double logging if we leave this manual call with isAddToDB=true.
        // However, looking at previous code, they logged manually. 
        // I will keep manual logging for specific "business logic" events if needed, but the requirement 
        // 'Log message should be written to the database for every HTTP request' is handled by the middleware I added.
        
        const logs = await getAllLogs();
        res.send(logs);
    } catch(err) {
        createLogByType('Error getting logs: ' + err, logLevel.ERROR, true);
        next(err);
    }
});

module.exports = router;
