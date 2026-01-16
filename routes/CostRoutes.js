/*
   Cost Routes
  
   Provides endpoints for cost management including creation and monthly reporting
  */

const express = require('express');
const router = express.Router();
const url = require('url');
const { createLogByType, createInfoLog } = require('../Services/LoggerServices');
const logLevel = require('../Services/LogLevel');
const { createCost, getMonthlyReport, findCostReport, upsertCostReport } = require('../Services/DocumentService');
const { verifyUserExists } = require('../Services/UserValidationService');
const { ErrorIds, sendErrorResponse } = require('../utils/errorResponse');

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

   For current month: Always generates fresh report (not saved to DB as data may change)
   For past months: Searches database for existing report. If not found, generates report
   from individual cost entries and saves it to database for future queries.
  */
router.get('/report', async function(req, res, next) {
    try {
        createLogByType('GET /report called', logLevel.INFO);
        // Extract query parameters from URL
        const parsedUrl = url.parse(req.url, true);

        // Parse user ID, year, and month from query string
        const userId = parseInt(parsedUrl.query.id);
        const year = parsedUrl.query.year;
        const month = parsedUrl.query.month;

        // Validate that userId is a positive number
        if (isNaN(userId) || userId <= 0) {
            createLogByType('Invalid userId: must be a positive number', logLevel.ERROR, true);
            return sendErrorResponse(res, 400, ErrorIds.INVALID_USERID, 'User ID must be a positive number');
        }

        const monthAsInt = parseInt(month);
        // Validate month is in valid range (1-12)
        if(monthAsInt < 1 || monthAsInt > 12){
            createLogByType('invalid month parameter passed , aborting', logLevel.ERROR, true);
            return sendErrorResponse(res, 400, ErrorIds.INVALID_MONTH, `Invalid month parameter: ${parsedUrl.query.month}. Month must be between 1 and 12`);
        }

        // Check if the requested report is for the current month/year
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
        const isCurrentMonth = (parseInt(year) === currentYear && monthAsInt === currentMonth);

        let costsArray = [];
        let shouldGenerateReport = true;

        // For past months, check if report exists in database
        if(!isCurrentMonth){
            const costReport = await findCostReport(userId, year, month);
            if(costReport){
                // Report found in database - use cached version
                createLogByType("found existing cost report in database", logLevel.INFO);
                costsArray = costReport.costs;
                shouldGenerateReport = false;
            }
        }

        // Generate report if needed (current month or past month not in DB)
        if(shouldGenerateReport){
            if(isCurrentMonth){
                createLogByType("generating fresh report for current month (not saving to DB)", logLevel.INFO);
            } else {
                createLogByType("cost report not found, generating from individual costs", logLevel.INFO);
            }

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

            // Save to database only if it's a past month
            if(!isCurrentMonth){
                await upsertCostReport(userId, year, month, costsArray);
                createLogByType("saved cost report to database", logLevel.INFO);
            }
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
router.post('/add', async function(req, res, next) {
    try {
        createLogByType('POST /add called', logLevel.INFO, true);
        createLogByType('Received data: ' + JSON.stringify(req.body), logLevel.INFO);

        // Verify that the user exists before creating the cost
        const userId = parseInt(req.body.userid);
        if (!req.body.userid) {
            createLogByType('Missing userid in request body', logLevel.ERROR, true);
            return sendErrorResponse(res, 400, ErrorIds.MISSING_USERID, 'userid is required in request body');
        }

        // Validate that userId is a positive number
        if (isNaN(userId) || userId <= 0) {
            createLogByType('Invalid userid: must be a positive number', logLevel.ERROR, true);
            return sendErrorResponse(res, 400, ErrorIds.INVALID_USERID, 'User ID must be a positive number');
        }

        try {
            const userExists = await verifyUserExists(userId);
            if (!userExists) {
                createLogByType(`User ${userId} does not exist, cannot create cost`, logLevel.ERROR, true);
                return sendErrorResponse(res, 404, ErrorIds.USER_NOT_FOUND, `User with id ${userId} does not exist`);
            }
        } catch (error) {
            createLogByType(`Error verifying user ${userId}: ${error.message}`, logLevel.ERROR, true);
            return sendErrorResponse(res, 503, ErrorIds.USER_SERVICE_ERROR, 'Unable to verify user existence', { details: error.message });
        }

        // Validate category against supported categories from environment
        const categories = process.env.SUPPORTED_CATEGORIES.split(',').map(cat => cat.trim());
        if(!categories.includes(req.body.category))
        {
          createLogByType("invalid category: " + req.body.category, logLevel.ERROR, true);
          return sendErrorResponse(res, 400, ErrorIds.INVALID_CATEGORY, `Invalid category: ${req.body.category}. Supported categories are: ${categories.join(', ')}`);
        }
        // Validate that date is not in the past (if provided)
        if(req.body.date)
        {
            const currCostDate = new Date(req.body.date);
            if(currCostDate < new Date()){
                return sendErrorResponse(res, 400, ErrorIds.INVALID_DATE, `Invalid date: ${req.body.date}. Date cannot be in the past`);
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
