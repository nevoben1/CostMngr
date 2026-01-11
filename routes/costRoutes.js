/*
   Cost Routes
  
   Provides endpoints for cost management including creation and monthly reporting
  */

const express = require('express');
const router = express.Router();
const url = require('url');
const { createLogByType, createInfoLog } = require('../Services/loggerServices');
const logLevel = require('../Services/logLevel');
const { createCost, getMonthlyReport, findCostReport, upsertCostReport } = require('../Services/documentService');

/*
   GET /report
   Retrieves or generates a monthly cost report for a specific user

   Query parameters:
   @param {string} id - User ID
   @param {string} year - Year (e.g., "2024")
   @param {string} month - Month (1-12)

   @returns {Object} Report object with costs grouped by category
   @returns {number} return.userId - User ID
   @returns {number} return.year - Year
   @returns {number} return.month - Month
   @returns {Array<Object>} return.costs - Costs grouped by category

   Searches for existing report in database. If not found, generates report
   from individual cost entries and saves it to database for future queries.
  */
router.get('/report', async function(req, res, next) {
    try {
        createLogByType('GET /report called', logLevel.INFO);
        // Extract query parameters from URL
        const parsedUrl = url.parse(req.url, true);

        // Parse user ID, year, and month from query string
        const userId = parsedUrl.query.id;
        const year = parsedUrl.query.year;
        const month = parsedUrl.query.month;
        const monthAsInt = parseInt(month);
        // Validate month is in valid range (1-12)
        if(monthAsInt < 1 || monthAsInt > 12){
            createLogByType('invalid month parameter passed , aborting', logLevel.ERROR, true);
            return res.status(400).send({"invalid month param": parsedUrl.query.month});
        }

        // Check if report exists in database
        let costReport = await findCostReport(userId, year, month);
        let costsArray = [];

        if(costReport){
            // Report found in database
            createLogByType("found existing cost report in database", logLevel.INFO);
            costsArray = costReport.costs;
        }
        else{
            // Generate new report from individual cost entries
            createLogByType("cost report not found, generating from individual costs", logLevel.INFO);
            // Query MongoDB for costs in the specified month
            const costs = await getMonthlyReport(userId, year, month);
            // Group costs by category for organized reporting
            const categoriesToCosts = new Map();
            for(const cost of costs){
                createLogByType(cost, logLevel.INFO);
                const category = cost.category;
                const day = new Date(cost.date).getDate();
                // Create cost item with sum, description, and day
                const objToAdd = {sum: cost.sum, description: cost.description, day: day};
                // Add to existing category or create new category entry
                if(categoriesToCosts.has(category)){
                    categoriesToCosts.get(category).push(objToAdd);
                }
                else{
                    categoriesToCosts.set(category, [objToAdd]);
                }
            }
            // Convert Map to array of objects for JSON response
            costsArray = Array.from(categoriesToCosts, ([category, items]) => ({[category]: items}));
            // Save the generated report to database
            costReport = await upsertCostReport(userId, year, month, costsArray);
            createLogByType("saved cost report to database", logLevel.INFO);
        }
        // Build response object with parsed integers
        const retVal = {userId: parseInt(userId), year: parseInt(year), month: parseInt(month), costs: costsArray};
        res.send(retVal);
        createLogByType('created a report for userId: ' + userId + ' year: ' + year + ' month: ' + month, logLevel.INFO, true);
    }
    catch(err){
        createLogByType('Error getting report: ' + err, logLevel.ERROR, true);
        next(err);
    }
});

/*
   POST /add
   Creates a new cost entry
  
   @param {Object} req.body - Cost data from request body
   @param {number} req.body.userid - User ID who incurred the cost
   @param {number} req.body.year - Year of the cost
   @param {number} req.body.month - Month of the cost (1-12)
   @param {string} req.body.category - Cost category (must be in SUPPORTED_CATEGORIES env var)
   @param {string} req.body.description - Description of the cost
   @param {number} req.body.sum - Cost amount
   @param {Date} [req.body.date] - Date of the cost (defaults to current date if not provided)
  
   @returns {Cost} Created cost document
  
   Validates category against environment variable and ensures date is not in the past
  */
router.post('/add', async function(req, res, next) {
    try {
        createLogByType('POST /add called', logLevel.INFO, true);
        createLogByType('Received data: ' + JSON.stringify(req.body), logLevel.INFO);

        // Validate category against supported categories from environment
        const categories = process.env.SUPPORTED_CATEGORIES.split(',').map(cat => cat.trim());
        if(!categories.includes(req.body.category))
        {
          createLogByType("invalid category: " + req.body.category, logLevel.ERROR, true);
          return res.status(400).send({"invalid category": req.body.category});
        }
        // Validate that date is not in the past (if provided)
        if(req.body.date)
        {
            const currCostDate = new Date(req.body.date);
            if(currCostDate < new Date()){
                return res.status(400).send({"invalid date": req.body.date});
            }
        }
        // Create cost entry in database
        const cost = await createCost(req.body);
        res.send(cost);
        createLogByType('cost_created', logLevel.INFO, true);
    } catch(error) {
        createLogByType('Error creating cost: ' + error, logLevel.ERROR, true);
        next(error);
    }
});

module.exports = router;
