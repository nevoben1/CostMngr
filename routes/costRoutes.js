const express = require('express');
const router = express.Router();
const url = require('url');
const { createLogByType, createInfoLog } = require('../Services/loggerServices');
const logLevel = require('../Services/logLevel');
const { createCost, getMonthlyReport } = require('../Services/documentService');

//MAP({userId , month , year} , costs)
let costsObjMap = new Map();

router.get('/report', async function(req, res, next) {
    try {
        createLogByType('GET /report called', logLevel.INFO);
        //get query params
        const parsedUrl = url.parse(req.url, true);
        
        //set them in variables
        const userId = parsedUrl.query.id;
        const year = parsedUrl.query.year;
        const month = parsedUrl.query.month;
        const monthAsInt = parseInt(month);
        if(monthAsInt < 1 || monthAsInt > 12){
            createLogByType('invalid month parameter passed , aborting', logLevel.ERROR, true);
            return res.status(400).send({"invalid month param": parsedUrl.query.month});
        }
        const queryObj = `${userId}-${year}-${month}`;
        //check if report has been made before
        let costsArray = [];
        if(costsObjMap.has(queryObj)){
            createLogByType("found the query obj using it", logLevel.INFO);
            costsArray = costsObjMap.get(queryObj);
        }
        else{
            createLogByType("the query obj was not found", logLevel.INFO);
            // from here check if this object was already saved
            //query the DB by the params
            const costs = await getMonthlyReport(userId, year, month);
            //init the hashmap of categories to costs and fill it
            const categoriesToCosts = new Map();
            for(const cost of costs){
                createLogByType(cost, logLevel.INFO);
                const category = cost.category;
                const day = new Date(cost.date).getDate();
                const objToAdd = {sum: cost.sum, description: cost.description, day: day};
                if(categoriesToCosts.has(category)){
                    categoriesToCosts.get(category).push(objToAdd);
                }
                else{
                    categoriesToCosts.set(category, [objToAdd]);
                }
            }
            costsArray = Array.from(categoriesToCosts, ([category, items]) => ({[category]: items}));
            costsObjMap.set(queryObj, costsArray);
        }
        const retVal = {userId: parseInt(userId), year: parseInt(year), month: parseInt(month), costs: costsArray};
        res.send(retVal);
        createLogByType('created a report for userId: ' + userId + ' year: ' + year + ' month: ' + month, logLevel.INFO, true);
    }
    catch(err){
        createLogByType('Error getting report: ' + err, logLevel.ERROR, true);
        next(err);
    }
});

router.post('/add', async function(req, res, next) {
    try {
        createLogByType('POST /add called', logLevel.INFO, true);
        createLogByType('Received data: ' + JSON.stringify(req.body), logLevel.INFO);

        const categories = process.env.SUPPORTED_CATEGORIES.split(',').map(cat => cat.trim());
        if(!categories.includes(req.body.category))
        {
          createLogByType("invalid category: " + req.body.category, logLevel.ERROR, true);
          return res.status(400).send({"invalid category": req.body.category});
        }
        if(req.body.date)
        {
            const currCostDate = new Date(req.body.date);
            if(currCostDate < new Date()){
                return res.status(400).send({"invalid date": req.body.date});
            }
        }
        const cost = await createCost(req.body);
        res.send(cost);
        createLogByType('cost_created', logLevel.INFO, true);
    } catch(error) {
        createLogByType('Error creating cost: ' + error, logLevel.ERROR, true);
        next(error);
    }
});

module.exports = router;
