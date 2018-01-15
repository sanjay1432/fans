var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var formations = new Schema({
    activeImage : {
        type: String,
        trim : true 
    },
    disableImage : {
        type: String,
        trim : true 
    },
    type : {
        type: String,
        trim : true 
    },
    isActive : {
        type : Boolean
    },
    isDeleted : {
        type : Boolean
    }
});

module.exports = mongoose.model('formations',formations);