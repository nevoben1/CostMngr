/*
   User Routes
  
   Provides endpoints for user management including retrieval and creation
  */

const express = require('express');
const router = express.Router();
const { createLogByType, createInfoLog } = require('../Services/LoggerServices');
const logLevel = require('../Services/LogLevel');
const { createUser, getAllUsers, getUserById } = require('../Services/DocumentService');
const { ErrorIds, sendErrorResponse } = require('../utils/errorResponse');

/*
   GET /users
   Retrieves all users from the database
  
   @returns {Array<User>} Array of all user documents
  */
router.get('/users', async function(req, res, next) {
    try {
        createInfoLog('GET /users called', logLevel.INFO, true);
        // Fetch all users from MongoDB
        const users = await getAllUsers();
        res.send(users);
        createLogByType('found all users', logLevel.INFO, true);
    } catch(err) {
        createLogByType('Error getting all users: ' + err, logLevel.ERROR, true);
        next(err);
    }
});

/*
   GET /users/:userId
   Retrieves a specific user by their ID
  
   @param {string} userId - User ID from URL parameter
   @returns {Array<User>} Array containing the matching user document
  */
router.get('/users/:userId', async function(req, res, next) {
    try {
        createLogByType('GET /users with userId ' + req.params.userId + ' called', logLevel.INFO, true);
        const userId = parseInt(req.params.userId);

        // Validate that userId is a positive number
        if (isNaN(userId) || userId <= 0) {
            createLogByType('Invalid userId: must be a positive number', logLevel.ERROR, true);
            return sendErrorResponse(res, 400, ErrorIds.INVALID_USERID, 'User ID must be a positive number');
        }

        // Query user by ID
        const user = await getUserById(userId);
        res.send(user);
        createLogByType('found user: ' + JSON.stringify(user), logLevel.INFO, true);
    } catch(err) {
        createLogByType('Error getting all users: ' + err, logLevel.ERROR, true);
        next(err);
    }
});

/*
   POST /adduser
   Creates a new user in the database
  
   @param {Object} req.body - User data from request body
   @param {number} req.body.id - Unique user ID
   @param {string} req.body.first_name - User's first name
   @param {string} req.body.last_name - User's last name
   @param {Date} [req.body.birthday] - User's birthday
   @param {boolean} [req.body.marital_status] - User's marital status
   @returns {User} Created user document
  */
router.post('/add', async function(req, res, next) {
    try {
        createLogByType('POST /adduser called', logLevel.INFO, true);
        createLogByType('Received data: ' + JSON.stringify(req.body), logLevel.INFO);

        // Validate that user id is a positive number
        const userId = parseInt(req.body.id);
        if (isNaN(userId) || userId <= 0) {
            createLogByType('Invalid user id: must be a positive number', logLevel.ERROR, true);
            return sendErrorResponse(res, 400, ErrorIds.INVALID_USERID, 'User ID must be a positive number');
        }

        // Create new user with provided data
        const user = await createUser(req.body);
        res.send(user);
        createLogByType('created user: ' + JSON.stringify(user), logLevel.INFO, true);
    } catch(error) {
        createLogByType('Error creating user: ' + error, logLevel.ERROR, true);
        next(error);
    }
});

module.exports = router;
