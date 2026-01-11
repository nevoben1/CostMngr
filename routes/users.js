/*
   Users Route (Legacy)
  
   Legacy placeholder route for users.
   Actual user functionality is implemented in userRoutes.js
  */

var express = require('express');
var router = express.Router();

/*
   GET /users
   Legacy placeholder endpoint - returns a generic message
  */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
