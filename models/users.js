/*
   User Model
  
   Mongoose schema for storing user profile information in MongoDB.
   Each user can have multiple associated costs tracked in the system.
  */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
   User Schema Definition
  
   @property {Number} id - Unique user identifier (required, unique)
   @property {String} first_name - User's first name (required)
   @property {String} last_name - User's last name (required)
   @property {Date} birthday - User's date of birth (required)
  */
const UsersSchema = new Schema({
    id: {
        type: Number,
        unique: true,   // Ensures no duplicate user IDs
        required: true
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    birthday: {
        type: Date,
        required:true
    }
});

// Create and export Mongoose model for 'users' collection
const User = mongoose.model('users',UsersSchema);

module.exports = User;