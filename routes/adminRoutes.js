const express = require('express');
const router = express.Router();
const { createLogByType } = require('../Services/loggerServices');
const logLevel = require('../Services/logLevel');

router.get('/about', function(req, res, next) {
    createLogByType('GET /about called', logLevel.INFO, true);
    const members = process.env.TEAM_MEMBERS.split(',').map(mem => mem.trim());
    createLogByType('members ' + members, logLevel.INFO, true);
    res.send(members);
});

module.exports = router;
