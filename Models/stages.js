var mongoose = require('mongoose');
var Schema = mongoose.Schema

var stages = new Schema({
    stage : {type : String, trim : true, required : true}
});

module.exports = mongoose.model('stages',stages);