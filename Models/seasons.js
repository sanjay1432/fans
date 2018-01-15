var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var seasons = new Schema({
    season : {type : String, trim : true, required : true}
});

module.exports = mongoose.model('seasons', seasons);