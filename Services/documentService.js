/*
   Document Service
  
   Core business logic layer for database operations.
   Provides CRUD operations for Costs, Logs, and Users collections.
  */

const Cost = require('../models/costs');
const Log = require('../models/logs');
const User = require('../models/users');
const CostReport = require('../models/costReports');



/*
   Creates a new cost entry in the database
  
   @param {Object} costData - Cost data to persist
   @param {number} costData.userid - User ID who incurred the cost
   @param {number} costData.year - Year of the cost
   @param {number} costData.month - Month of the cost (1-12)
   @param {string} costData.description - Description of the cost
   @param {number} costData.sum - Cost amount
   @param {Date} [costData.date] - Date of the cost (defaults to current date)
   @returns {Promise<Cost>} Created cost document
  */
async function createCost(costData) {
    // Default to current date if not provided
    if (!costData.date) {
        costData.date = new Date();
    }
    return await Cost.create(costData);
}

/*
   Creates a new log entry in the database
  
   @param {Object} logData - Log data to persist
   @param {string} logData.message - Log message
   @param {Date} logData.date - Timestamp of the log
   @param {string} logData.type - Log level (INFO, ERROR, WARN, FATAL)
   @returns {Promise<Log>} Created log document
  */
async function createLog(logData) {
    return await Log.create(logData);
}

/*
   Retrieves all costs for a specific user in a given month
  
   @param {number} userId - User ID to filter by
   @param {number} year - Year to retrieve (e.g., 2024)
   @param {number} month - Month to retrieve (1-12, where 1=January, 12=December)
   @returns {Promise<Cost[]>} Array of cost documents for the specified month
  */
async function getMonthlyReport(userId , year , month){
    // month should be 1-12 (January = 1, December = 12)
    // Calculate date range for the entire month
    const startDate = new Date(year, month - 1, 1);  // First day of month
    const endDate = new Date(year, month, 1);        // First day of next month

    // Query costs within date range for specific user
    return await Cost.find({
        date: {
            $gte: startDate,  // Greater than or equal to start date
            $lt: endDate      // Less than end date (exclusive)
        } ,
        userid:userId
    });
}

/*
   Creates a new user in the database
  
   @param {Object} userData - User data to persist
   @param {number} userData.id - Unique user ID
   @param {string} userData.first_name - User's first name
   @param {string} userData.last_name - User's last name
   @param {Date} [userData.birthday] - User's birthday
   @param {boolean} [userData.marital_status] - User's marital status
   @returns {Promise<User>} Created user document
  */
async function createUser(userData){
    return await User.create(userData);
}

/*
   Retrieves all users from the database
  
   @returns {Promise<User[]>} Array of all user documents
  */
async function getAllUsers(){
    return await User.find({});
}

/*
   Retrieves a specific user by their ID
  
   @param {number} id - User ID to search for
   @returns {Promise<User[]>} Array containing matching user documents
  */
async  function getUserById(id){
    return await User.find({id:id});
}

/*
   Retrieves all log entries from the database
  
   @returns {Promise<Log[]>} Array of all log documents
  */
async function getAllLogs(){
    return await Log.find({});
}

/*
   Finds a cost report for a specific user, year, and month

   @param {number} userId - User ID to search for
   @param {number} year - Year of the report
   @param {number} month - Month of the report (1-12)
   @returns {Promise<CostReport|null>} Cost report document if found, null otherwise
  */
async function findCostReport(userId, year, month) {
    return await CostReport.findOne({
        userId: parseInt(userId),
        year: parseInt(year),
        month: parseInt(month)
    });
}

/*
   Creates or updates a cost report for a specific user, year, and month
   Uses upsert to either update existing document or create new one

   @param {number} userId - User ID
   @param {number} year - Year of the report
   @param {number} month - Month of the report (1-12)
   @param {Array} costs - Array of category objects with cost items
   @returns {Promise<CostReport>} Updated or created cost report document
  */
async function upsertCostReport(userId, year, month, costs) {
    return await CostReport.findOneAndUpdate(
        {
            userId: parseInt(userId),
            year: parseInt(year),
            month: parseInt(month)
        },
        {
            userId: parseInt(userId),
            year: parseInt(year),
            month: parseInt(month),
            costs: costs
        },
        {
            upsert: true,  // Create if doesn't exist
            new: true      // Return the updated document
        }
    );
}

// Export all service functions for use in routes and controllers
module.exports = { createCost, createLog , createUser, getAllUsers , getUserById , getMonthlyReport, getAllLogs, findCostReport, upsertCostReport };