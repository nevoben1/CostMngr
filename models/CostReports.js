/*
   Cost Report Model

   Mongoose schema for storing aggregated monthly cost reports in MongoDB.
   Each report represents all costs for a specific user in a given month/year,
   organized by category.
  */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
   Cost Report Schema Definition

   @property {Number} userId - ID of the user (part of compound key)
   @property {Number} year - Year of the report (part of compound key)
   @property {Number} month - Month of the report 1-12 (part of compound key)
   @property {Array} costs - Array of category objects containing cost items

   Each category object in costs array has dynamic keys representing category names,
   with values being arrays of cost items:
   {
     "food": [
       {"sum": 13, "description": "shoco", "day": 17},
       {"sum": 14, "description": "baigale", "day": 13}
     ]
   }
  */
const CostReportSchema = new Schema({
    userId: {
        type: Number,
        required: true  // User identifier, part of compound key
    },
    year: {
        type: Number,
        required: true  // Report year, part of compound key
    },
    month: {
        type: Number,
        required: true,  // Report month (1-12), part of compound key
        min: 1,
        max: 12
    },
    costs: {
        type: [Schema.Types.Mixed],  // Array of objects with dynamic category keys
        default: []
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

/*
   Compound Index
   Creates a unique compound key on userId, year, and month
   This ensures only one report exists per user per month
  */
CostReportSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

// Create and export Mongoose model for 'costreports' collection
const CostReport = mongoose.model('costreports', CostReportSchema);

module.exports = CostReport;
