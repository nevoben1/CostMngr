/*
   Product Model (Currently Unused)
  
   Mongoose schema for product data - appears to be legacy/unused code.
   Not referenced in any active routes or services.
   May be for future e-commerce functionality.
  */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/*
   Product Schema Definition
  
   @property {String} name - Product name
   @property {Number} id - Product identifier
   @property {Number} price - Product price
  */
const ProductsSchema = new Schema({
    name: {
        type: String  // Product name/title
    },
    id: {
        type: Number  // Unique product identifier
    },
    price: {
        type: Number  // Product price/cost
    }
});

// Create and export Mongoose model for 'products' collection
const Product = mongoose.model('products',ProductsSchema);

module.exports = Product;