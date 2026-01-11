/*
   Home Page Route
  
   Handles the root URL and renders the home page template
  */

var express = require('express');
var router = express.Router();

/*
   GET /
   Renders the home page using the index template
  */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
