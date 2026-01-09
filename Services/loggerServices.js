const pino = require('pino');
//const {createLog} = require('../Services/documentService');
const {createLog} = require('./documentService');

const logger = pino({
    transport:{
        target: "pino-pretty",
        options: {
            translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
            ignore:"pid,hostname"
        }
    }
})

function createInfoLog(message){
    logger.info(message);
    createLog({
        message: message,
        date: new Date(),
        type: 'INFO'
    }).catch(err => console.log(err));
}

function createLogByType(message , type , isAddToDB = false){
    switch(type){
        case 'INFO':
            logger.info(message);
            break;
        case 'ERROR':
            logger.error(message);
            break;
        case 'WARNING':
            logger.warn(message);
            break;
        case 'FATAL':
            logger.fatal(message);
            break;
    }
    if(isAddToDB){
        createLog({
            message: message,
            date: new Date(),
            type: type
        }).catch(err => console.log(err));
    }
}


function httpLogger(req, res, next) {
    // Log the request
    const message = `${req.method} ${req.originalUrl} called`;
    createLogByType(message, 'INFO', true);
    next();
}

module.exports = {logger , createInfoLog , createLogByType, httpLogger};