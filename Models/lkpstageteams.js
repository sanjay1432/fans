var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var teamsSchema = new Schema({
    teamId : {type : Schema.Types.ObjectId, ref : 'teams'}
},{_id : false})

var lkpstageteams = new Schema({
    seasonId : {type : Schema.Types.ObjectId, ref : 'seasons'},
    stageId : {type : Schema.Types.ObjectId, ref : 'stages'},
    competitionId : {type : Schema.Types.ObjectId, ref : 'competitionData'},
    teams : [teamsSchema]
})

module.exports = mongoose.model('lkpstageteams', lkpstageteams);