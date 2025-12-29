const Cost = require('../models/costs');
const Log = require('../models/logs');
const User = require('../models/users');


async function createCost(costData) {
    if (!costData.date) {
        //handle case in which the user added only date without time
        costData.date = new Date();
    }
    return await Cost.create(costData);
}

async function createLog(logData) {
    return await Log.create(logData);
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

module.exports = { createCost, createLog , createUser, getAllUsers , getUserById };