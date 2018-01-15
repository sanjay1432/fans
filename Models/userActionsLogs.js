var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');


var UserActions = new Schema({
    time: {type: Date, required: true},
    playerId:  {type: Schema.Types.ObjectId, ref : 'playerData'},//{type: String, trim: true},
    action: {type: String, trim: true}
},{_id : false});

var UserActionLogsSchema = new Schema({
    pitch : { type : String, default : 'UserPick' },
    userId: {type: Schema.ObjectId, ref: 'fanspickUserSchema'},
    fixtureId: {type: Schema.ObjectId, ref: 'fixturedata'},
    teamId: {type: Schema.ObjectId, ref: 'teams'},
    createdDate: {type: Date},
    updatedDate: {type: Date},    
    userActions: [UserActions],
    isLive : {type : Boolean, default : false}
});


module.exports = mongoose.model('userActionsLogs', UserActionLogsSchema);