var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');



var lkpAssociatePosition = new Schema({
    
    Pos_Id :{
        type : Schema.ObjectId,
        ref : 'lkpPosition'
    },
    Position :{
        type : String
    }
});


module.exports = mongoose.model('lkpAssociatePosition', lkpAssociatePosition);