/*
   Admin Routes
  
   Provides administrative endpoints for retrieving system and team information
  */

const express = require('express');
const router = express.Router();
const { createLogByType } = require('../Services/loggerServices');
const logLevel = require('../Services/logLevel');

/*
   GET /about
   Retrieves the list of team members from environment variables
  
   @returns {Array<string>} Array of team member names
  */
router.get('/about', function(req, res, next) {
    createLogByType('GET /about called', logLevel.INFO, true);
    // Parse comma-separated team members from environment variable
    const members = process.env.TEAM_MEMBERS.split(',').map(mem => mem.trim());
    createLogByType('members ' + members, logLevel.INFO, true);
    res.send(members);
});

module.exports = router;
