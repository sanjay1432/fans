var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var CompetitionMini = new Schema({
    competitionId: { type: Schema.ObjectId, ref: 'competitionData', required: false },
    // competitionId: { type: String, trim: true },
    competitionFixtureFeedUrl: { type: String, trim: true },
    competitionStandingsFeedUrl: { type: String, trim: true },
    competitionCommentaryFeedUrl: { type: String, trim: true },
    pyramidStructureRank: { type: Number },
    isNationalLeague: { type: Boolean },
    isInternationalCompetition: { type: Boolean },
    isContinentalCup: { type: Boolean },
    competitionFormatType: { type: String, trim: true },
    isLeague : {type : Boolean, default : true}
    
});


var countryData = new Schema({
    countryName: { type: String, trim: true, required: true },
    SportID: { type: Schema.ObjectId, ref: 'sportVersion' },
    competitionMini: [CompetitionMini],
    isContinent : {type : Boolean, default : false}
});

module.exports = mongoose.model('countryData', countryData);

