const express = require('express');
const router = express.Router();
const { createLogByType, createInfoLog } = require('../Services/loggerServices');
const logLevel = require('../Services/logLevel');
const { createUser, getAllUsers, getUserById } = require('../Services/documentService');

router.get('/users', async function(req, res, next) {
    try {
        createInfoLog('GET /users called', logLevel.INFO, true);
        const users = await getAllUsers();
        res.send(users);
        createLogByType('found all users', logLevel.INFO, true);
    } catch(err) {
        createLogByType('Error getting all users: ' + err, logLevel.ERROR, true);
        next(err);
    }
});

router.get('/users/:userId', async function(req, res, next) {
    try {
        createLogByType('GET /users with userId ' + req.params.userId + ' called', logLevel.INFO, true);
        const userId = req.params.userId;
        const user = await getUserById(userId);
        res.send(user);
        createLogByType('found user: ' + JSON.stringify(user), logLevel.INFO, true);
    } catch(err) {
        createLogByType('Error getting all users: ' + err, logLevel.ERROR, true);
        next(err);
    }
});

router.post('/adduser', async function(req, res, next) {
    try {
        createLogByType('POST /adduser called', logLevel.INFO, true);
        createLogByType('Received data: ' + JSON.stringify(req.body), logLevel.INFO);

        const user = await createUser(req.body);
        res.send(user);
        createLogByType('created user: ' + JSON.stringify(user), logLevel.INFO, true);
    } catch(error) {
        createLogByType('Error creating user: ' + error, logLevel.ERROR, true);
        next(error);
    }
});

module.exports = router;
