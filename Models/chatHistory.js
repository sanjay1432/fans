var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');

var chats = new Schema({
    sender: { type: Schema.ObjectId, ref: 'fanspickUserSchema' },//{type : Schema.Types.ObjectId, ref : 'fanspickUserSchema'},
    message: { type: String },
    time: { type: Date },
    statusType: { type: String },
    receivedBy: [], // userId 
    deletedBy: [], // userId 
    pending: [], // userId ,
    readBy : [],
    type : { type : String, default : Config.APP_CONSTANTS.MESSAGE_TYPE.MESSAGE},
})

var chatHistory = new Schema({
    groupId: { type: Schema.ObjectId, ref: 'chatGroups'},
    chats: [chats]
})


module.exports = mongoose.model('chatHistory', chatHistory);