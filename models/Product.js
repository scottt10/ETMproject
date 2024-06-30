const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status:{
        type:Boolean,
        default:false
    }
});

module.exports = Product = mongoose.model('product', ProductSchema);
