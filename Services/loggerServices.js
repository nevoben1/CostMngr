import pino from 'pino';

const logger = pino({
    transport:{
        target: "pino-pretty"
    }
})

module.exports = {logger};