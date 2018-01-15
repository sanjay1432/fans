

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');
var statistics = new Schema({
    teamName : {type : String, trim : true,default : ''},
    teamFeedId : {type : String, trim: true,default : ''},
    teamId : {type: Schema.ObjectId, ref: 'team'},
    competitionName : {type : String, trim : true,default : ''},
    competitionId : {type: Schema.ObjectId, ref: 'competitiondatas'},
    competitonFeedId : {type : String, trim: true,default : ''},
    season : {type : String, default : '2017/2018'},
    minutes : {type : String, trim : true},
    appearences: {type : String, trim : true},
    lineups: {type : String, trim : true},
    substitute_in: {type : String, trim : true},
    substitute_out: {type : String, trim : true},
    substitutes_on_bench: {type : String, trim : true},
    goals: {type : String, trim : true},
    yellowcards: {type : String, trim : true},
    yellowred: {type : String, trim : true},
    redcards: {type : String, trim : true}
})

var playerData = new Schema({
    playerId: {type: String, trim: true, default: null, sparse: true},
    name: {type: String, trim: true, default: null, sparse: true},
    firstname: {type: String, trim: true, default: null, sparse: true},
    lastname: {type: String, trim: true, default: null, sparse: true},
    team: {type: String, trim: true, default: null, sparse: true},
    teamid: {type: String, trim: true, default: null, sparse: true},
    nationality: {type: String, trim: true, default: null, sparse: true},
    birthdate: {type: String, trim: true, default: null, sparse: true},
    age: {type: String, trim: true, default: null, sparse: true},
    birthcountry: {type: String, trim: true, default: null, sparse: true},
    birthplace: {type: String, trim: true, default: null, sparse: true},
    position: {type: String, trim: true, default: null, sparse: true},
    height: {type: String, trim: true, default: null, sparse: true},
    weight: {type: String, trim: true, default: null, sparse: true},
    fanspickTeamId: {type: Schema.ObjectId, ref: 'team'},
    statistics : [statistics]
});




module.exports = mongoose.model('playerData', playerData);