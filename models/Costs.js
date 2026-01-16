/*
   Cost Model
  
   Mongoose schema for storing user expense/cost entries in MongoDB.
   Each cost represents a single expense tracked by the system.
  */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
   Cost Schema Definition
  
   @property {String} description - Description of the expense (required)
   @property {String} category - Category classification (required, validated against SUPPORTED_CATEGORIES env var)
   @property {Number} userid - ID of the user who incurred the cost (required)
   @property {Number} sum - Amount/value of the cost (required)
   @property {Date} date - Date when the cost was incurred (optional, defaults to creation date)
  */
const CostsSchema = new Schema({
    description: {
        type: String,
        required: true  // Description is mandatory for tracking purposes

    },
    category: {
        type: String,
        required: true  // Category enables grouping and reporting

    },
    userid: {
        type: Number,
        required: true  // Links cost to specific user

    },
    sum: {
        type: Number,
        required: true  // The monetary amount of the cost

    },
    date:{
        type: Date  // Optional timestamp for the expense
    }
}, {
    toJSON: {
        transform: function(doc, ret) {
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Create and export Mongoose model for 'costs' collection
const Cost = mongoose.model('costs',CostsSchema);

module.exports = Cost;