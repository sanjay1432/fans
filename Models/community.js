var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');



var communitySchema = new Schema({
    Name: {type: String, trim: true, unique: true, required: true},
    Description: {type: String, trim: true, required: true},
    communityImage : {type: String, trim: true},
    SportID: {type: Schema.ObjectId, ref: 'sportVersion'},
    LeagueID: {type: Schema.ObjectId, ref: 'leagueData'},
    TeamID: {type: Schema.ObjectId, ref: 'teams'},
    Location: {type: String, trim: true},
    AgeRange: {type: String, trim: true},
    createdDate: {type: Date, required: true},
    modifiedDate: {default: Date.now, type: Date, required: true},
    isActive: {type: Boolean, required: true, default: true},
    isLocked: {type: Boolean, required: true, default: true},
    isDeleted: {type: Boolean, required: true, default: false},
    Admin: {type: String, trim: true},
    Moderators: {type: String, trim: true},
    topics: [{type: Schema.ObjectId, ref: 'topicSchema'}],
});


module.exports = mongoose.model('communitySchema', communitySchema);
