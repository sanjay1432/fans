var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');



var lkpPosition = new Schema({
    
    PosX :{
        type : Number
    } ,
    PosY :{
        type : Number
    },
    Role :{
        type : String
    },
    Key :{
        type : String
    }
});


module.exports = mongoose.model('lkpPosition', lkpPosition);