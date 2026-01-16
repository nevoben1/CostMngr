/*
   Home Page Route
  
   Handles the root URL and renders the home page template
  */

const express = require('express');
const router = express.Router();

/*
   GET /
   Renders the home page using the index template
  */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
