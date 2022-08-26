const mongoose = require('mongoose');

//parameter schema
const ParameterSchema = mongoose.Schema({
    temperature: {
        type: Number
    },
    druck: {
        type: Number,
    },
    bezugszeit: {
        type: Number,
    },
    standBy: {
        type: Number,
    }
});

const parameter = module.exports = mongoose.model('parameter', ParameterSchema);