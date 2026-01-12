/*
   API Routes (Main)
  
   Central router combining all API endpoints for costs, users, and admin operations.
   This file consolidates multiple route handlers into a single router.
   Note: Duplicate functionality exists in separate route files (costRoutes, userRoutes, adminRoutes).
  */

const express = require('express');
const router = express.Router();
const Product = require('../models/products');
const url = require('url');
const {logger , createInfoLog , createLogByType} = require('../Services/loggerServices');
const logLevel = require('../Services/logLevel');

/*
   In-memory cache for monthly cost reports
   Maps query key ({userId}-{year}-{month}) to aggregated costs array
   Improves performance by avoiding redundant database queries
  */
let costsObjMap = new Map();

const { createCost, createLog , createUser , getAllUsers , getUserById , getMonthlyReport} = require('../Services/documentService');
const { verifyUserExists } = require('../Services/userValidationService');

/*
   GET /about
   Retrieves the list of team members from environment variables
  
   @returns {Array<string>} Array of team member names
  */
router.get('/about',function(req,res,next){
    //TBD - add log to DB
    createLogByType('GET /about called',logLevel.INFO , true)
    //createInfoLog('GET /about called',logLevel.INFO);
    //logger.info('GET /about called');
    // Parse comma-separated team members from environment variable
    const members = process.env.TEAM_MEMBERS.split(',').map(mem => mem.trim());
    createLogByType('members ' + members,logLevel.INFO , true)
    //createInfoLog('members ' + members , logLevel.INFO , true);
    res.send(members);

});

/*
   GET /report
   Generates a monthly cost report for a specific user
  
   Query parameters:
   @param {string} id - User ID
   @param {string} year - Year (e.g., "2024")
   @param {string} month - Month (1-12)
  
   @returns {Object} Report object with costs grouped by category
   @returns {number} return.userId - User ID
   @returns {number} return.year - Year
   @returns {number} return.month - Month
   @returns {Array<Object>} return.costs - Costs grouped by category
  
   Uses in-memory caching to improve performance for repeated queries
  */
router.get('/report' , async function(req,res,next){
    try{
        createLogByType('GET /report called' , logLevel.INFO);
        //logger.info('GET /report called');
        // Extract query parameters from URL
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        // Parse user ID, year, and month from query string
        const userId = parsedUrl.query.id;
        const year = parsedUrl.query.year;
        const month = parsedUrl.query.month;
        const monthAsInt = parseInt(month);
        // Validate month is in valid range (1-12)
        if(monthAsInt < 1 || monthAsInt > 12){
            createLogByType('invalid month parameter passed , aborting' , logLevel.ERROR , true);
            //logger.error('invalid month parameter passed , aborting');
            return res.status(400).send({"invalid month param":parsedUrl.query.month});
        }
        // Create cache key from query parameters
        const queryObj =  `${userId}-${year}-${month}`;
        // Check if report has been cached
        let costsArray = [];
        if(costsObjMap.has(queryObj)){
            // Return cached report for improved performance
            createLogByType("found the query obj using it" , logLevel.INFO);

            costsArray = costsObjMap.get(queryObj)
        }
        else{
            // Generate new report from database
            createLogByType("the query obj was not found" , logLevel.INFO);

            // Query MongoDB for costs in the specified month
            const costs = await getMonthlyReport(userId , year , month);
            // Group costs by category for organized reporting
            const categoriesToCosts = new Map();
            for(const cost of costs){
                createLogByType(cost , logLevel.INFO);
                //console.log(cost);
                const category = cost.category;
                const day = new Date(cost.date).getDate();
                // Create cost item with sum, description, and day
                const objToAdd = {sum:cost.sum, description:cost.description , day:day };
                //console.log("objToAdd : " , objToAdd);
                // Add to existing category or create new category entry
                if(categoriesToCosts.has(category)){

                    categoriesToCosts.get(category).push(objToAdd);
                }
                else{
                    categoriesToCosts.set(category, [objToAdd]);
                }
            }
            // Convert Map to array of objects for JSON response
            costsArray = Array.from(categoriesToCosts , ([category,items]) =>({[category] : items}));
            // Cache the result for future requests
            costsObjMap.set(queryObj, costsArray);
        }
        // Build response object with parsed integers
        const retVal = {userId: parseInt(userId), year:parseInt(year), month: parseInt(month), costs: costsArray };
        res.send(retVal);
        createLogByType('created a report for userId: ' + userId +' year: ' + year +'month: ' + month , logLevel.INFO , true);

    }
    catch(err){
        createLogByType('Error getting all users: ' + err , logLevel.ERROR , true);
        //console.error('Error getting all users:', err);
        next(err);
    }
});

/*
   GET /users
   Retrieves all users from the database
  
   @returns {Array<User>} Array of all user documents
  */
router.get('/users' , async function(req,res,next){
    try{
        createInfoLog('GET /users called' , logLevel.INFO , true);
        //logger.info('GET /users called');
        // Fetch all users from MongoDB
        const users = await getAllUsers();
        res.send(users);
        createLogByType('found all users' , logLevel.INFO , true);
        //createInfoLog('found all users');

    }
    catch(err){
        createLogByType('Error getting all users: ' + err , logLevel.ERROR , true);
        //console.error('Error getting all users:', err);
        next(err);
    }
});

/*
   GET /users/:userId
   Retrieves a specific user by their ID
  
   @param {string} userId - User ID from URL parameter
   @returns {Array<User>} Array containing the matching user document
  */
router.get('/users/:userId' , async function(req,res,next){
    try{
        createLogByType('GET /users with userId ' + req.params.userId + ' called' , logLevel.INFO , true);
        //logger.info('GET /users with userId ' + req.params.userId + ' called');
        const userId = req.params.userId;
        // Query user by ID
        const user = await getUserById(userId);
        res.send(user);
        createLogByType('found user: ' +  JSON.stringify(user), logLevel.INFO , true);
        //createInfoLog('found user: ' + JSON.stringify(user));
    }
    catch(err){
        createLogByType('Error getting all users: ' + err , logLevel.ERROR , true);
        //console.error('Error getting all users:', err);
        next(err);
    }
});

/*
   POST /add
   Creates a new cost entry

   @param {Object} req.body - Cost data from request body
   @param {number} req.body.userid - User ID who incurred the cost (verified against external user service)
   @param {number} req.body.year - Year of the cost
   @param {number} req.body.month - Month of the cost (1-12)
   @param {string} req.body.category - Cost category (must be in SUPPORTED_CATEGORIES env var)
   @param {string} req.body.description - Description of the cost
   @param {number} req.body.sum - Cost amount
   @param {Date} [req.body.date] - Date of the cost (defaults to current date if not provided)

   @returns {Cost} Created cost document
   @returns {404} If user does not exist in the user service
   @returns {503} If unable to verify user existence

   Verifies user exists via external service, validates category against environment variable,
   and ensures date is not in the past
  */
router.post('/add' , async function(req,res,next){
    try {
        createLogByType('POST /add called' , logLevel.INFO , true);
        //logger.info('POST /add called');
        createLogByType('Received data: '+ JSON.stringify(req.body) , logLevel.INFO);
        //logger.info('Received data: '+ JSON.stringify(req.body));

        // Verify that the user exists before creating the cost
        const userId = req.body.userid;
        if (!userId) {
            createLogByType('Missing userid in request body', logLevel.ERROR, true);
            return res.status(400).send({"error": "userid is required"});
        }

        try {
            const userExists = await verifyUserExists(userId);
            if (!userExists) {
                createLogByType(`User ${userId} does not exist, cannot create cost`, logLevel.ERROR, true);
                return res.status(404).send({"error": `User with id ${userId} does not exist`});
            }
        } catch (error) {
            createLogByType(`Error verifying user ${userId}: ${error.message}`, logLevel.ERROR, true);
            return res.status(503).send({"error": "Unable to verify user existence", "details": error.message});
        }

        // Validate category against supported categories from environment
        const categories = process.env.SUPPORTED_CATEGORIES.split(',').map(cat => cat.trim());
        if(!categories.includes(req.body.category))
        {
          createLogByType("invalid category: "+ req.body.category , logLevel.ERROR , true);
          return res.status(400).send({"invalid category":req.body.category});
        }
        // Validate that date is not in the past (if provided)
        if(req.body.date)
        {
            const currCostDate = new Date(req.body.date);
            if(currCostDate < new Date()){
                return res.status(400).send({"invalid date":req.body.date});
            }
        }
        // Create cost entry in database
        const cost = await createCost(req.body);
        res.send(cost);
        createLogByType('cost_created' , logLevel.INFO , true);
        //createInfoLog('cost_created');
    } catch(error) {
        createLogByType('Error creating cost: ' + error , logLevel.ERROR , true);
        //console.error('Error creating cost:', error);
        next(error);
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
router.post('/adduser' , async function(req,res,next){
    try {
        createLogByType('POST /add called' , logLevel.INFO , true);
        //logger.info('POST /add called');
        createLogByType('Received data: '+ JSON.stringify(req.body) , logLevel.INFO);
        //logger.info('Received data: '+ req.body);

        // Create new user with provided data
        const user = await createUser(req.body);
        res.send(user);
        createLogByType('created user: ' + JSON.stringify(user) , logLevel.INFO , true);
        //createInfoLog('created user: ' + JSON.stringify(user));
    } catch(error) {
        createLogByType('Error creating user: ' + error , logLevel.ERROR , true);
        //console.error('Error creating user:', error);
        next(error);
    }
});


module.exports = router;