/*
   Log Routes
  
   Provides endpoints for retrieving application logs from the database
  */

const express = require('express');
const router = express.Router();
const { createLogByType } = require('../Services/LoggerServices');
const logLevel = require('../Services/LogLevel');
const { getAllLogs, getAllUsers } = require('../Services/DocumentService');

/*
   GET /logs
   Retrieves team members with their first and last names

   @returns {Array<Object>} Array of objects containing first_name and last_name for each team member
  */
router.get('/logs', async function(req, res, next) {
    try {
        // Log to console only to avoid infinite loop of logging log requests
        createLogByType('GET /logs called', logLevel.INFO);

        // Retrieve all users (team members) from MongoDB
        const users = await getAllUsers();

        // Map to return only first_name and last_name
        const teamMembers = users.map(user => ({
            first_name: user.first_name,
            last_name: user.last_name
        }));

        res.json(teamMembers);
    } catch(err) {
        createLogByType('Error getting team members: ' + err, logLevel.ERROR, true);
        next(err);
    }
});

module.exports = router;
