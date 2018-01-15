
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var Competitions = new Schema({ 
    _id: false,
    competitionId: { type: Schema.ObjectId },
    isNationalLeague: { type: String, trim: true, sparse: true },
    isActive: { type: Boolean }
});


var OverallStats = new Schema({   
    // stats of team 
    Points: {type: String, trim: true, sparse: true},
    GamesPlayed: {type: String, trim: true, sparse: true},
    Wins: {type: String, trim: true, sparse: true},
    Draws: {type: String, trim: true, sparse: true},
    Losses: {type: String, trim: true, sparse: true},
    goalsScored: {type: String, trim: true, sparse: true},
    goalsConceded: {type: String, trim: true, sparse: true},
    goalDifference: {type: String, trim: true, sparse: true}
});



var HomeStats = new Schema({    
    //stats as home team
    GamesPlayed : {type: String, trim: true, sparse: true},
    Wins: {type: String, trim: true, sparse: true},
    Draws: {type: String, trim: true,  sparse: true},
    Losses: {type: String, trim: true, sparse: true},
    goalsScored: {type: String, trim: true, sparse: true},
    goalsConceded: {type: String, trim: true, sparse: true},
    goalDifference: {type: String, trim: true, sparse: true}
});



var AwayStats = new Schema({   
    //stats as away team 
    GamesPlayed : {type: String, trim: true, sparse: true},
    Wins: {type: String, trim: true, sparse: true},
    Draws: {type: String, trim: true, sparse: true},
    Losses: {type: String, trim: true, sparse: true},
    goalsScored: {type: String, trim: true, sparse: true},
    goalsConceded: {type: String, trim: true, sparse: true},
    goalDifference: {type: String, trim: true, sparse: true}
});

var TeamMini = new Schema({
    // contain stats of team
    teamKnownName: {type: String, trim: true, default: null, sparse: true},
    leaguePosition: {type: Number, trim: true, default: null, sparse: true},
    points: {type: Number, trim: true, default: 0, sparse: true},
    awayStats: [AwayStats],
    homeStats: [HomeStats],
    overallStats: [OverallStats]
});

var Player = new Schema({
    // contain stats of team
    playerId: { type: Schema.ObjectId, ref: 'playerData' },
    id: { type: String, trim: true, default: null, sparse: true },
    name: { type: String, trim: true, default: null, sparse: true },
    number: { type: String, trim: true, default: null, sparse: true },
    age: { type: String, trim: true, default: null, sparse: true },
    position: { type: String, trim: true, default: null, sparse: true },
    injured: { type: String, trim: true, default: null, sparse: true },
    minutes: { type: String, trim: true, default: null, sparse: true },
    appearences: { type: String, trim: true, default: null, sparse: true },
    lineups: { type: String, trim: true, default: null, sparse: true },
    substitute_in: { type: String, trim: true, default: null, sparse: true },
    substitute_out: { type: String, trim: true, default: null, sparse: true },
    substitutes_on_bench: { type: String, trim: true, default: null, sparse: true },
    goals: { type: String, trim: true, default: null, sparse: true },
    assists: { type: String, trim: true, default: null, sparse: true },
    yellowcards: { type: String, trim: true, default: null, sparse: true },
    yellowred: { type: String, trim: true, default: null, sparse: true },
    redcards: { type: String, trim: true, default: null, sparse: true }
});


var TeamsSchema = new Schema({
    teamFeedID: {type: String, trim: true,  unique: true},
    isNationalTeam: {type: Boolean, required: true, default: false},
    countryId: {type: Schema.ObjectId, ref: 'countryData'},
    sportId: {type: Schema.ObjectId, ref: 'sportVersion'},
    leagueId: {type: Schema.ObjectId, ref: 'leagueData'},
    squadData: [Player],
    knownName: {type: String, trim: true, sparse: true},
    fullName: {type: String, trim: true, default: null, sparse: true},
    shortCode: {type: String, trim: true, default: null, sparse: true},
    country: {type: String, trim: true, default: null, sparse: true},
    founded: {type: String, trim: true, default: null, sparse: true},
    
    coachName: {type: String, trim: true},
    coachId: {type: String, trim: true},

    teamLogo: { type: String },
    teamShirtImage: {type: String},


    competitions: [Competitions],
    teamMini: [TeamMini],
    
    twitterHastag : {
        dateAdded : {type : Date , default : new Date()},
        isActive : {type : Boolean, default : true},
        isDeleted :  {type : Boolean, default : false},
        hashtag : []
    },
    facebookTerm : {
        dateAdded : {type : Date, default : new Date()},
        isActive : {type : Boolean, default : true},
        isDeleted : {type : Boolean, default : false},
        term : []
    }

});

module.exports = mongoose.model('teams', TeamsSchema);