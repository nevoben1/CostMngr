const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UsersSchema = new Schema({
    user_id: {
        type: Number,
        unique: true,
        required: true
    },
    first_name: {
        type: String
    },
    last_name: {
        type: String
    },
    birthday: {
        type: Date
    }
});

const User = mongoose.model('users',UsersSchema);

module.exports = User;