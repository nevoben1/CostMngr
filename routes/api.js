const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/products');
const Cost = require('../models/costs');
const Log = require('../models/logs');
const url = require('url');


const { createCost, createLog , createUser , getAllUsers , getUserById , getMonthlyReport } = require('../services/documentService');

router.get('/products',function(req,res,next){
    Product.find({}).then(function(prdcts){
        res.send(prdcts);
    }).catch(next);
});
router.get('/about',function(req,res,next){
    const members = process.env.TEAM_MEMBERS.split(',').map(mem => mem.trim());
    res.send(members);

});

router.get('/report' , async function(req,res,next){
    try{
        const parsedUrl = url.parse(req.url, true);
        const query = parsedUrl.query;
        const userId = parsedUrl.query.id;
        const year = parsedUrl.query.year;
        const month = parsedUrl.query.month;
        const costs = await getMonthlyReport(userId , year , month);
        res.send(costs);

        createLog({
            message: 'get_costs_invoked',
            date: new Date(),
            type: 'INFO'
        }).catch(err => console.log(err));
    }
    catch(err){
        console.error('Error getting all users:', err);
        next(err);
    }
});



router.get('/users' , async function(req,res,next){
    try{
        const users = await getAllUsers();
        res.send(users);

        createLog({
            message: 'get_users_invoked',
            date: new Date(),
            type: 'INFO'
        }).catch(err => console.log(err));
    }
    catch(err){
        console.error('Error getting all users:', err);
        next(err);
    }
});

router.get('/users/:userId' , async function(req,res,next){
    try{
        const userId = req.params.userId;
        const user = await getUserById(userId);
        res.send(user);

        createLog({
            message: 'get_user for userId : ' + userId,
            date: new Date(),
            type: 'INFO'
        }).catch(err => console.log(err));
    }
    catch(err){
        console.error('Error getting all users:', err);
        next(err);
    }
});

router.post('/add' , async function(req,res,next){
    try {
        console.log('Received data:', req.body);

        const categories = process.env.SUPPORTED_CATEGORIES.split(',').map(cat => cat.trim());
        if(!categories.includes(req.body.category))
        {
          return res.status(400).send({"invalid category":req.body.category});
        }
        const cost = await createCost(req.body);
        res.send(cost);
        createLog({
            message: 'cost_created',
            date: new Date(),
            type: 'INFO'
        }).catch(err => console.log(err));
    } catch(error) {
        console.error('Error creating cost:', error);
        next(error);
    }
});


router.post('/adduser' , async function(req,res,next){
    try {
        console.log('Received data:', req.body);

        const user = await createUser(req.body);
        console.log('Created user object:', user.toObject());
        console.log('user_id value:', user.user_id);
        res.send(user);

        createLog({
            message: 'user_created',
            date: new Date(),
            type: 'INFO'
        }).catch(err => console.log(err));
    } catch(error) {
        console.error('Error creating user:', error);
        next(error);
    }
});


module.exports = router;