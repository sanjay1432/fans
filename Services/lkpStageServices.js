var Models = require('../Models');
var Config = require('../Config');

var getStages = function (criteria, projection, options, callback) {
    Models.stages.find(criteria, projection, options, callback);
}

var getSeasons = function (criteria, projection, options, callback) {
    Models.seasons.find(criteria, projection, options, callback);
}


var getLkpStageTeams = function (criteria, projection, options, callback) {
    Models.lkpstageteams.find(criteria, projection, options, callback);
}

var updateLKPStageTeams = function (criteria, dataToSet, options, callback) {
    Models.lkpstageteams.findOneAndUpdate(criteria, dataToSet, options, callback);
}

var getTeamsDetailsForStage = function (criteria, callback) {
    var query = [];
    query.push(
        {
            $match: { competitionId: criteria.competitionId, seasonId: criteria.seasonId, stageId: criteria.stageId }
        },
        { $unwind: '$teams' },
        {
            $project: {
                '_id': '$teams.teamId'
            }
        },
        {
            $lookup: {
                'localField': '_id',
                'foreignField': '_id',
                'from': 'teams',
                'as': 'team'
            }
        },
        { $unwind: '$team' },
        {
            $project: {
                '_id': '$team._id',
                "coachName": "$team.coachName",
                "knownName": "$team.knownName",
                "sportId": "$team.sportId",
                "countryId": "$team.countryId",
                "imageURL": "$team.imageURL",
                "teamShirtURL": "$team.teamShirtURL",
                "founded": "$team.founded",
                "country": "$team.country",
                "fullName": "$team.fullName",
                "isNationalTeam": "$team.isNationalTeam"
            }
        },
        {$sort : {'knownName' : 1}}

    )
    Models.lkpstageteams.aggregate(query,callback);
}

module.exports = {
    getStages: getStages,
    getSeasons: getSeasons,
    getLkpStageTeams: getLkpStageTeams,
    updateLKPStageTeams: updateLKPStageTeams,
    getTeamsDetailsForStage: getTeamsDetailsForStage
}