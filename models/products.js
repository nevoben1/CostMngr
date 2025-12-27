const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductsSchema = new Schema({
    name: {
        type: String
    },
    id: {
        type: Number
    },
    price: {
        type: Number
    }
});

const Product = mongoose.model('products',ProductsSchema);

module.exports = Product;