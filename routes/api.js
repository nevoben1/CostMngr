const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/products');
const Cost = require('../models/costs');
const Log = require('../models/logs');

const { createCost, createLog , createUser , getAllUsers , getUserById } = require('../services/documentService');

router.get('/products',function(req,res,next){
    Product.find({}).then(function(prdcts){
        res.send(prdcts);
    }).catch(next);
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

        const cost = await createCost(req.body);

        //console.log('Collection name:', Cost.collection.name);
        //console.log('DB name:', mongoose.connection.name);
        //console.log('Created cost:', cost);
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