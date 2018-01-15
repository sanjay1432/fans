var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');

var groupMembers = new Schema({
    memberId: { type: Schema.Types.ObjectId, ref: 'fanspickUserSchema' },
    addedAt: { type: Date }
}, { _id: false })

var admin = new Schema({
    adminId: { type: Schema.Types.ObjectId, ref: 'fanspickUserSchema' }
}, { _id: false })

var chatGroups = new Schema({
    groupMembers: [groupMembers],
    createdBy :  { type: Schema.Types.ObjectId, ref: 'fanspickUserSchema' },
    admin: [admin],
    type: { type: String, default: Config.APP_CONSTANTS.CHAT_GROUP_TYPE.ONE_TO_ONE },
    name: { type: String },
    lastActivatedTime: { type: Date },
    isDeleted: { type: Boolean, default: false }
},{ timestamps: { createdAt: 'created_at' } })

module.exports = mongoose.model('chatGroups', chatGroups);