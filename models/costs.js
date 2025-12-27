const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CostsSchema = new Schema({
    description: {
        type: String
    },
    category: {
        type: String
    },
    userid: {
        type: Number
    },
    date:{
      type: Date
    },
    sum: {
        type: Number
    }
});

const Cost = mongoose.model('costs',CostsSchema);

module.exports = Cost;