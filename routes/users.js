/*
   Users Route (Legacy)
  
   Legacy placeholder route for users.
   Actual user functionality is implemented in UserRoutes.js
  */

const express = require('express');
const router = express.Router();

/*
   GET /users
   Legacy placeholder endpoint - returns a generic message
  */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
