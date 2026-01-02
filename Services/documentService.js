const Cost = require('../models/costs');
const Log = require('../models/logs');
const User = require('../models/users');
const {logger} = require('../Services/loggerServices');


async function createCost(costData) {
    if (!costData.date) {
        costData.date = new Date();
    }
    return await Cost.create(costData);
}

async function createLog(logData) {
    return await Log.create(logData);
}

async function getMonthlyReport(userId , year , month){
    // month should be 1-12 (January = 1, December = 12)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    return await Cost.find({
        date: {
            $gte: startDate,
            $lt: endDate
        } ,
        userid:userId
    });
}

async function createUser(userData){
    return await User.create(userData);
}

async function getAllUsers(){
    return await User.find({});
}

async  function getUserById(id){
    return await User.find({id:id});
}

async function getAllLogs(){
    return await Log.find({});
}

module.exports = { createCost, createLog , createUser, getAllUsers , getUserById , getMonthlyReport };