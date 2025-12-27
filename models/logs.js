const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogsSchema = new Schema({
    message: {
        type: String
    },
    date: {
        type: Date
    },
    type: {
        type: String
    }
});

const Log = mongoose.model('logs',LogsSchema);

module.exports = Log;