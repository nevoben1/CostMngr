const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CostsSchema = new Schema({
    description: {
        type: String,
        required: true

    },
    category: {
        type: String,
        required: true

    },
    userid: {
        type: Number,
        required: true

    },
    sum: {
        type: Number,
        required: true

    },
    date:{
        type: Date
    }
});

const Cost = mongoose.model('costs',CostsSchema);

module.exports = Cost;