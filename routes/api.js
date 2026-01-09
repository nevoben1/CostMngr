const express = require('express');
const router = express.Router();
const Product = require('../models/products');
const url = require('url');
const {logger , createInfoLog , createLogByType} = require('../Services/loggerServices');
const logLevel = require('../Services/logLevel');

//MAP({userId , month , year} , costs)
let costsObjMap = new Map();

const { createCost, createLog , createUser , getAllUsers , getUserById , getMonthlyReport} = require('../services/documentService');

router.get('/about',function(req,res,next){
    //TBD - add log to DB
    createLogByType('GET /about called',logLevel.INFO , true)
    //createInfoLog('GET /about called',logLevel.INFO);
    //logger.info('GET /about called');
    const members = process.env.TEAM_MEMBERS.split(',').map(mem => mem.trim());
    createLogByType('members ' + members,logLevel.INFO , true)
    //createInfoLog('members ' + members , logLevel.INFO , true);
    res.send(members);

});

router.get('/report' , async function(req,res,next){
    try{
        createLogByType('GET /report called' , logLevel.INFO);
        //logger.info('GET /report called');
        //get query params
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        //set them in variables
        const userId = parsedUrl.query.id;
        const year = parsedUrl.query.year;
        const month = parsedUrl.query.month;
        const monthAsInt = parseInt(month);
        if(monthAsInt < 1 || monthAsInt > 12){
            createLogByType('invalid month parameter passed , aborting' , logLevel.ERROR , true);
            //logger.error('invalid month parameter passed , aborting');
            return res.status(400).send({"invalid month param":parsedUrl.query.month});
        }
        const queryObj =  `${userId}-${year}-${month}`;
        //check if report has been made before
        let costsArray = [];
        if(costsObjMap.has(queryObj)){
            createLogByType("found the query obj using it" , logLevel.INFO);

            costsArray = costsObjMap.get(queryObj)
        }
        else{
            createLogByType("the query obj was not found" , logLevel.INFO);

            // from here check if this object was already saved
            //query the DB by the params
            const costs = await getMonthlyReport(userId , year , month);
            //init the hashmap of categories to costs and fill it
            const categoriesToCosts = new Map();
            for(const cost of costs){
                createLogByType(cost , logLevel.INFO);
                //console.log(cost);
                const category = cost.category;
                const day = new Date(cost.date).getDate();
                const objToAdd = {sum:cost.sum, description:cost.description , day:day };
                //console.log("objToAdd : " , objToAdd);
                if(categoriesToCosts.has(category)){

                    categoriesToCosts.get(category).push(objToAdd);
                }
                else{
                    categoriesToCosts.set(category, [objToAdd]);
                }
            }
            costsArray = Array.from(categoriesToCosts , ([category,items]) =>({[category] : items}));
            costsObjMap.set(queryObj, costsArray);
        }
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



router.get('/users' , async function(req,res,next){
    try{
        createInfoLog('GET /users called' , logLevel.INFO , true);
        //logger.info('GET /users called');
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

router.get('/users/:userId' , async function(req,res,next){
    try{
        createLogByType('GET /users with userId ' + req.params.userId + ' called' , logLevel.INFO , true);
        //logger.info('GET /users with userId ' + req.params.userId + ' called');
        const userId = req.params.userId;
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

router.post('/add' , async function(req,res,next){
    try {
        createLogByType('POST /add called' , logLevel.INFO , true);
        //logger.info('POST /add called');
        createLogByType('Received data: '+ JSON.stringify(req.body) , logLevel.INFO);
        //logger.info('Received data: '+ JSON.stringify(req.body));

        const categories = process.env.SUPPORTED_CATEGORIES.split(',').map(cat => cat.trim());
        if(!categories.includes(req.body.category))
        {
          createLogByType("invalid category: "+ req.body.category , logLevel.ERROR , true);
          return res.status(400).send({"invalid category":req.body.category});
        }
        if(req.body.date)
        {
            const currCostDate = new Date(req.body.date);
            if(currCostDate < new Date()){
                return res.status(400).send({"invalid date":req.body.date});
            }
        }
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


router.post('/adduser' , async function(req,res,next){
    try {
        createLogByType('POST /add called' , logLevel.INFO , true);
        //logger.info('POST /add called');
        createLogByType('Received data: '+ JSON.stringify(req.body) , logLevel.INFO);
        //logger.info('Received data: '+ req.body);

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