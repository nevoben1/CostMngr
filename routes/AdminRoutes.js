/*
   Admin Routes
  
   Provides administrative endpoints for retrieving system and team information
  */

const express = require('express');
const router = express.Router();
const { createLogByType } = require('../Services/LoggerServices');
const logLevel = require('../Services/LogLevel');

/*
   GET /about
   Retrieves the list of team members from environment variables
  
   @returns {Array<string>} Array of team member names
  */
router.get('/about', function(req, res, next) {
    createLogByType('GET /about called', logLevel.INFO, true);
    // Parse comma-separated team members from environment variable
    const membersArray = process.env.TEAM_MEMBERS.split(',').map(mem => mem.trim());

    // Transform each member into an object with first_name and last_name
    const members = membersArray.map(member => {
        const nameParts = member.split(' ');
        return {
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || ''
        };
    });

    createLogByType('members ' + JSON.stringify(members), logLevel.INFO, true);
    res.json(members);
});

module.exports = router;
