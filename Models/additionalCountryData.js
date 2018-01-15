var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');


var countryData = new Schema({
    countryName: { type: String, trim: true, required: true }
});

module.exports = mongoose.model('additionalCountryData', countryData);

