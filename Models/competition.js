
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

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
    teamId: {type: Schema.ObjectId, ref: 'teams'},
    teamKnownName: {type: String, trim: true, default: null, sparse: true},
    leaguePosition: {type: Number, trim: true, default: null, sparse: true},
    points: {type: Number, trim: true, default: 0, sparse: true},
    awayStats: [AwayStats],
    homeStats: [HomeStats],
    overallStats: [OverallStats]
});

var competitionData = new Schema({   

    competitionFeedId: { type: Number, required: true },
    competitionName: {type: String, trim: true, required: true},    
    sportId: { type: Schema.ObjectId, ref: 'sportVersion' },
    isNationalLeague: { type: Boolean },
    pyramidStructureRank: { type: Number },
    isInternationalCompetition: { type: Boolean },
    competitionType: { type: String },
    countryId: { type: Schema.ObjectId, ref: 'countryData' },
    startDate: { type: Date },
    endDate: { type: Date },
    yearOfStart: { type: Number },
    teamMini: [TeamMini],
     isLeague : {type : Boolean, default : true}
});

module.exports = mongoose.model('competitionData', competitionData);
