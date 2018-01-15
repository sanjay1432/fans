'use strict';

var Models = require('../Models');
var async = require('async');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var ObjectId = require('mongoose').Types.ObjectId;
var fsExtra = require('fs-extra');
/*  ====================================================
CREATING Users
=======================================================*/


//Insert User in DB
var createUser = function (objToSave, callback) {
    new Models.fanspickUser(objToSave).save(callback)
};


var getMyCommunity = function (criteria, callback) {

    // var populateVariable = {
    //     path: "topics",
    //     select: 'name'
    // };
    // var criteria = { TeamID: payloadData.teamId };
    // var options = { lean: true },
    //     projection = { modifiedDate: 0, createdDate: 0, isActive: 0, isLocked: 0, isDeleted: 0 };

    getCommunityForTeam(criteria, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};


//Get Users from DB
var getCommunityForTeam = function (criteria, callback) {

    var query = [];
    query.push(
        { $match: { TeamID: new ObjectId(criteria.TeamID) } },
        { $unwind: "$topics" },
        {
            $lookup: {
                localField: 'topics',
                foreignField: '_id',
                from: 'topicschemas',
                as: 'topics'
            }
        },

        { $unwind: '$topics' },

        {
            $lookup: {
                localField: 'topics.fixtureId',
                foreignField: '_id',
                from: 'fixturedatas',
                as: 'topics.fixturedata'
            }
        },
        {
            $unwind: {
                "path": "$topics.fixturedata",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $project: {
                '_id': '$_id',
                Name: '$Name',
                Description: '$Description',
                SportID: '$SportID',
                TeamID: '$TeamID',
                'topics.fixturedate': '$topics.fixturedata.fixtureDate',
                'topics.name': '$topics.name',
                'topics._id': '$topics._id',

            }
        },
        {
            $group: {
                _id: '$_id',
                Name: { $first: '$Name' },
                fixtureID: { $first: '$fixtureID' },
                Description: { $first: '$Description' },
                SportID: { $first: '$SportID' },
                TeamID: { $first: '$TeamID' },
                topics: { $push: '$topics' }
            }
        }
    );
    Models.community.aggregate(query, callback);
};


var getAllCommunity = function (criteria, projection, options, populateModel, callback) {
    Models.community.find(criteria, projection, options).populate(populateModel).sort({
        createdDate: -1
    }).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        } else {
            callback(null, docs);
        }
    });
};

var getUserTeams = function (criteria, projection, options, callback) {
    Models.fanspickUser.find(criteria, projection, options, function (err, docs) {
        async.series([
            function (cb) {
                Models.Teams.populate(docs[0].defaultTeam, {
                    path: 'favouriteTeam'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            },
            function (cb) {
                Models.Teams.populate(docs[0].defaultTeam, {
                    path: 'favouriteTeamCountry',
                    select: 'country'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            },
            function (cb) {
                Models.Teams.populate(docs[0].defaultTeam, {
                    path: 'favouriteTeamLeague',
                    select: 'leagueName'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            },
            function (cb) {
                Models.Teams.populate(docs[0].teamFavourite, {
                    path: 'favouriteTeam'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            },
            function (cb) {
                Models.Country.populate(docs[0].teamFavourite, {
                    path: 'favouriteTeamCountry',
                    select: 'country'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            }
        ], function (err, data) {
            if (err) return callback(err, docs);
            callback(null, docs);
        });
    })
};

// update users(one or many) 
var update = function (criteria, dataToSet, options, callback) {
    Models.fanspickUser.update(criteria, dataToSet, options, callback);
};

// /Update Donation in DB
var updateUser = function (criteria, dataToSet, options, callback) {
    Models.fanspickUser.findOneAndUpdate(criteria, dataToSet, options, callback);
};




//Get Users from DB
var getUser = function (criteria, projection, options, callback) {
    Models.fanspickUser.find(criteria, projection, options, callback);

};

// var getUserForFavTeams = function (criteria, projection, options, callback) {
//     // Models.fanspickUser.find(criteria, projection, options, callback);
// Models.fanspickUser.find(criteria, projection).populate({
//     path: 'defaultTeam.favouriteTeam',
//     model: 'teams',
//     select: 'knownName  _id'
// }).populate({
//     path: 'defaultTeam.favouriteTeamCountry',
//     model: 'countryData',
//     select: 'countryName _id'
// }).populate({
//     path: 'teamFavourite.favouriteTeam',
//     model: 'teams',
//     select: 'knownName  _id'
// }).populate({
//     path: 'teamFavourite.favouriteTeamCountry',
//     model: 'countryData',
//     select: 'countryName _id'
// }).exec(function (err, response) {
//     if (err) {
//         callback(err);
//     } else {
//         callback(null, response);
//     }
// })
// };

var getUserForFavTeams = function (criteria, projection, options, callback) {
    // Models.fanspickUser.find(criteria, projection, options, callback);
    Models.fanspickUser.find(criteria, projection).populate({
        path: 'defaultTeam.favouriteTeam',
        model: 'teams',
        select: 'knownName  _id'
    }).populate({
        path: 'teamFavourite.favouriteTeam',
        model: 'teams',
        select: 'knownName  _id'
    }).exec(function (err, response) {
        if (err) {
            callback(err);
        } else {
            callback(null, response);
        }
    })
};
//////////////////////////////////////////////////////////////////SPORT DATA////////////////////////////////////////////////////////
//Get Sport from DB
var getSports = function (criteria, projection, options, callback) {
    Models.sportVersion.find(criteria, projection, options, callback);
};

var getCountryData = function (criteria, projection, options, callback) {
    Models.Country.find(criteria, projection, options, callback).sort({ countryName: 'asc' });
};

var getCompetitions = function (criteria, projection, options, callback) {
    Models.Competition.find(criteria, projection, options, callback).sort({ pyramidStructureRank: 'asc' });
};

var getTeamsOfLeague = function (criteria, projection, options, populateModel, callback) {
    Models.League.find(criteria, projection, options).populate(populateModel).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        } else {
            callback(null, docs);
        }
    });
};

var getTeamData = function (criteria, projection, options, callback) {
    Models.Teams.find(criteria, projection, options, callback).sort({ knownName: 'asc' });
};

var getTeamSubstitutes = function (criteria, projection, options, callback) {
    var query = [];
    query.push({ $match: criteria },
        { $unwind: '$substitutes' },
        {
            $lookup: {
                localField: 'substitutes.playerId',
                foreignField: '_id',
                from: 'playerdatas',
                as: 'playerData'
            }
        },
        { $unwind: '$playerData' },
        {
            $project: {
                '_id': '$_id',
                "playerData.weight": "$playerData.weight",
                "playerData.height": "$playerData.height",
                "playerData.position": "$playerData.position",
                "playerData.birthplace": "$playerData.birthplace",
                "playerData.birthcountry": "$playerData.birthcountry",
                "playerData.age": "$playerData.age",
                "playerData.birthdate": "$playerData.birthdate",
                "playerData.nationality": "$playerData.nationality",
                "playerData.teamid": "$playerData.teamid",
                "playerData.team": "$playerData.team",
                "playerData.knownName": "$playerData.knownName",
                "playerData.lastname": "$playerData.lastname",
                "playerData.firstname": "$playerData.firstname",
                "playerData.name": "$playerData.name",
                "playerData.playerFeedId": "$playerData.playerFeedId",
                "playerData.imageURL": "$playerData.imageURL",
                "playerData.fanspickTeamId": "$playerData.fanspickTeamId"
            }
        },
        {
            $group: {
                _id: '$_id',
                playersData: { $addToSet: '$playerData' }
            }
        });
    Models.userFixture.aggregate(query).exec(callback);
}

var getUpcomingFixtures = function (criteria, projection, options, order, callback) {

    Models.Fixture.find(criteria, projection, options).populate({
        path: 'localTeam.franspickTeamId',
        model: 'teams',
        select: 'imageURL'
    }).populate({
        path: 'visitorTeam.franspickTeamId',
        model: 'teams',
        select: 'imageURL'
    }).sort({ fixtureDate: order }).limit(10).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        } else {
            callback(null, docs);
        }
    });
}
var getFixtureById = function (criteria, projection, options, callback) {
    Models.Fixture.find(criteria, projection, options, callback);
}
/*
var getUserpickPercentage = function (criteria, projection, options, callback) {
    async.parallel([
        function (parallelCallback) {
            var isLive = false;
            criteria.isLive = isLive;
            var userFixtureFound = {};
            console.log('Fix : ' + typeof criteria.fixtureId + ' Team : ' + typeof criteria.teamId + ' user : ' + typeof criteria.userId + ' isLive : ' + typeof criteria.isLive);
            Models.userFixture.find(criteria, projection, options, function (error, result) {
                if (error) {
                    parallelCallback(error);
                } else if (result.length == 0) {
                    parallelCallback(null, { 'preMatch': 0 });
                } else {
                    userFixtureFound = result[0]
                    Models.fanspickFixture.find({ fixtureId: criteria.fixtureId, teamId: criteria.teamId, isLive: isLive }, projection, options, function (err, result) {
                        if (err) {
                            parallelCallback(error);
                        } else if (result.length == 0) {
                            parallelCallback(null, { 'preMatch': 0 });
                        } else {
                            var points = calculatePercentage(userFixtureFound, result[0]);
                            var percentage = (points * 100) / 11;
                            parallelCallback(null, { 'preMatch': Math.round(percentage) });
                        }
                    })
                }
            })
        }, function (parallelCallback) {
            var isLive = true;
            criteria.isLive = isLive;
            console.log('Fix : ' + criteria.fixtureId + ' Team : ' + criteria.teamId + ' user : ' + criteria.userId + ' isLive : ' + criteria.isLive);
            var userFixtureFound = {};
            Models.userFixture.find(criteria, projection, options, function (error, result) {
                if (error) {
                    parallelCallback(error);
                } else if (result.length == 0) {
                    parallelCallback(null, { 'live': 0 });
                } else {
                    userFixtureFound = result[0];
                    Models.fanspickFixture.find({ fixtureId: criteria.fixtureId, teamId: criteria.teamId, isLive: isLive }, projection, options, function (err, result) {
                        if (err) {
                            parallelCallback(error);
                        } else if (result.length == 0) {
                            parallelCallback(null, { 'live': 0 });
                        } else {
                            var points = calculatePercentage(userFixtureFound, result[0]);
                            var percentage = (points * 100) / 11;
                            parallelCallback(null, { 'live': Math.round(percentage) });
                        }
                    })
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            var finalResult = {};
            finalResult.live = 0;
            finalResult.preMatch = 0;
            if (result.length > 0) {
                console.log('result : ' + result);
                finalResult.live = result[1].live;
                finalResult.preMatch = result[0].preMatch;
            }
            callback(null, finalResult);

        }
    });
}

var calculatePercentage = function (userPick, fanspick) {
    var count = 0;
    fanspick.lineUpPlayers.forEach(function (eachFanspickPlayer) {
        if (eachFanspickPlayer.playerId != null) {
            userPick.lineUpPlayers.forEach(function (eachUserPickPlayer) {
                if (eachUserPickPlayer.playerId != null) {
                    if (eachFanspickPlayer.playerId.toString() == eachUserPickPlayer.playerId.toString()) {
                        count++;
                    }
                }
            })
        }

    });
    return count;

}
*/
/*
var getUserpickAndManagersPickPercentage = function (criteria, projection, options, callback) {
    var finalResult = '0';
    async.series([
        function (seriesCallback) {
            var userFixtureFound = {};
            console.log('Fix : ' + typeof criteria.fixtureId + ' Team : ' + typeof criteria.teamId + ' user : ' + typeof criteria.userId + ' isLive : ' + typeof criteria.isLive);
            getManagerPickForStats({ _id: criteria.fixtureId }, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result.length == 0) {
                    // seriesCallback(null, 0);
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_PICK_NOT_FOUND);
                } else if(result && result.length > 0) {
                    if (result[0].localTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                        userFixtureFound = result[0].localTeam;
                    } else if (result[0].visitorTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                        userFixtureFound = result[0].visitorTeam;
                    } else {
                        userFixtureFound = null;
                    }
                    if (userFixtureFound == null || userFixtureFound.formation == null || userFixtureFound.players == undefined || userFixtureFound.players.length <= 0) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_PICK_NOT_FOUND);
                    } else {
                        criteria['$or'] = [{ isPrimaryFavouriteTeam: 'true' }, { isFavouriteTeam: 'true' }];
                        getUserFixture(criteria, projection, options, function (err, result) {
                            if (err) {
                                seriesCallback(error);
                            } else if (result.length == 0) {
                                // seriesCallback(null, 0);
                                seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_NOT_FOUND);
                            } else if (result.length > 0 && (result[0].lineUpPlayers == undefined || result[0].lineUpPlayers.length < 11)) {
                                // seriesCallback(null, 0);
                                if (checkTeamIsSecondaryFav(result[0])) {
                                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SECONDARY_FAV_TEAM);
                                } else {
                                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_INCOMPLETE);
                                }
                            }
                            else {
                                if (checkTeamIsSecondaryFav(result[0])) {
                                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SECONDARY_FAV_TEAM);
                                } else {
                                    var firstItemDetail = {
                                        formation: {
                                            _id: userFixtureFound.formation._id,
                                            type: userFixtureFound.formation.type
                                        },
                                        lineUpPlayers: userFixtureFound.players
                                    };
                                    var secondItemDetail = {
                                        formation: {
                                            _id: result[0].currentFormation._id,
                                            type: result[0].currentFormation.type
                                        },
                                        lineUpPlayers: result[0].lineUpPlayers
                                    }
                                    calculateStats(firstItemDetail, secondItemDetail, UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.LINE_UP_PLAYERS, function (error, percentage) {
                                        if (error) {
                                            seriesCallback(error);
                                        } else {
                                            finalResult = percentage;
                                            seriesCallback(null, finalResult);
                                        }
                                    });
                                }

                            }
                        })
                    }

                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, { 'percentage': finalResult });
        }
    })
}*/
var getUserpickAndManagersPickPercentage = function (criteria, projection, options, callback) {
    var finalResult = '0';
    var userFixtureFound = {};
    criteria['$or'] = [{ isPrimaryFavouriteTeam: 'true' }, { isFavouriteTeam: 'true' }];
    async.parallel([
        function (parallelCallback) {
            //get mp
            getManagerPickForStats({ _id: criteria.fixtureId }, projection, options, function (error, result) {
                if (error) {
                    parallelCallback(error);
                } else {
                    parallelCallback(null, result);
                }
            })
        },
        function (parallelCallback) {
            //get up
            getUserFixture(criteria, projection, options, function (err, result) {
                if (err) {
                    parallelCallback(error);
                } else {
                    parallelCallback(null, result);
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            validateUPandMP(result[1], result[0], function (error) {
                if (error) {
                    callback(error);
                } else {
                    //calculate 
                    if (result[0].localTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                        userFixtureFound = result[0].localTeam;
                    } else if (result[0].visitorTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                        userFixtureFound = result[0].visitorTeam;
                    } else {
                        userFixtureFound = null;
                    }
                    if (userFixtureFound == null || userFixtureFound.formation == null || userFixtureFound.players == undefined || userFixtureFound.players.length <= 0) {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_PICK_NOT_FOUND);
                    } else {
                        var firstItemDetail = {
                            formation: {
                                _id: userFixtureFound.formation._id,
                                type: userFixtureFound.formation.type
                            },
                            lineUpPlayers: userFixtureFound.players
                        };
                        var secondItemDetail = {
                            formation: {
                                _id: result[1].currentFormation._id,
                                type: result[1].currentFormation.type
                            },
                            lineUpPlayers: result[1].lineUpPlayers
                        }
                        calculateStats(firstItemDetail, secondItemDetail, UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.LINE_UP_PLAYERS, function (error, percentage) {
                            if (error) {
                                callback(error);
                            } else {
                                finalResult = percentage;
                                callback(null, finalResult);
                            }
                        });
                    }
                }
            })
        }
    })
}

var validateUPandMP = function (userPick, managerPick, callback) {
    if ((userPick == undefined || userPick.length == 0) && (managerPick == undefined || managerPick.length == 0)) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_MANAGER_NOT_FOUND);
    } else if (managerPick == undefined || managerPick.length == 0) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_PICK_NOT_FOUND);
    } else if (userPick == undefined || userPick.length == 0) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_NOT_FOUND);
    } else {
        if (checkTeamIsSecondaryFav(userPick[0])) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SECONDARY_FAV_TEAM);
        } else if (userPick.length > 0 && (userPick[0].lineUpPlayers == undefined || userPick[0].lineUpPlayers.length < 11)) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_INCOMPLETE);
        } else {
            callback(null);
        }
    }
}

var checkTeamIsSecondaryFav = function (teamData) {
    if (teamData.isPrimaryFavouriteTeam == "false" && teamData.isFavouriteTeam == "true") {
        return true;
    }
    return false;
}

/**get manager pick percentage start*/
/*
var getFanspickAndManagersPickPercentage = function (criteria, projection, options, callback) {
    var finalResult = '0';
    async.series([
        function (seriesCallback) {
            var userFixtureFound = {};
            console.log('Fix : ' + typeof criteria.fixtureId + ' Team : ' + typeof criteria.teamId + ' user : ' + typeof criteria.userId + ' isLive : ' + typeof criteria.isLive);
            getManagerPickForStats({ _id: criteria.fixtureId }, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result.length == 0) {
                    // seriesCallback(null, 0);
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_PICK_NOT_FOUND)
                } else {
                    if (result[0].localTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                        userFixtureFound = result[0].localTeam;
                    } else if (result[0].visitorTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                        userFixtureFound = result[0].visitorTeam;
                    } else {
                        userFixtureFound = null;
                    }
                    if (userFixtureFound == null || userFixtureFound.formation == null || userFixtureFound.players == undefined || userFixtureFound.players.length <= 0) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_PICK_NOT_FOUND)
                    } else {
                        getFanspickFixture(criteria, projection, options, function (err, result) {
                            if (err) {
                                seriesCallback(error);
                            } else if (result.length == 0) {
                                // seriesCallback(null, 0)
                                seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_NOT_FOUND)
                            } else {
                                var firstItemDetail = {
                                    formation: {
                                        _id: userFixtureFound.formation._id,
                                        type: userFixtureFound.formation.type
                                    },
                                    lineUpPlayers: userFixtureFound.players
                                };
                                var secondItemDetail = {
                                    formation: {
                                        _id: result[0].formationId._id,
                                        type: result[0].formationId.type
                                    },
                                    lineUpPlayers: result[0].lineUpPlayers
                                }
                                calculateStats(firstItemDetail, secondItemDetail, UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.LINE_UP_PLAYERS, function (error, percentage) {
                                    if (error) {
                                        seriesCallback(error);
                                    } else {
                                        finalResult = percentage;
                                        seriesCallback(null, finalResult);
                                    }
                                });

                            }
                        })
                    }

                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, { 'percentage': finalResult });
        }
    })
}
*/
var getFanspickAndManagersPickPercentage = function (criteria, projection, options, callback) {
    var finalResult = '0';
    async.parallel([
        function (innerCallback) {
            //get mp
            getManagerPickForStats({ _id: criteria.fixtureId }, projection, options, function (error, result) {
                if (error) {
                    innerCallback(error);
                } else {
                    // seriesCallback(null, 0);
                    innerCallback(null, result);
                    // innerCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_PICK_NOT_FOUND)
                }
            })
        },
        function (innerCallback) {
            //get fp
            getFanspickFixture(criteria, projection, options, function (err, result) {
                if (err) {
                    innerCallback(err);
                } else {
                    innerCallback(null, result);
                    // seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_NOT_FOUND)
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            validateMPandFP(result[0], result[1], function (error) {
                if (error) {
                    callback(error);
                } else {
                    var userFixtureFound = {};
                    if (result[0].localTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                        userFixtureFound = result[0].localTeam;
                    } else if (result[0].visitorTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                        userFixtureFound = result[0].visitorTeam;
                    } else {
                        userFixtureFound = null;
                    }
                    if (userFixtureFound == null || userFixtureFound.formation == null || userFixtureFound.players == undefined || userFixtureFound.players.length <= 0) {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_PICK_NOT_FOUND)
                    } else {
                        var firstItemDetail = {
                            formation: {
                                _id: userFixtureFound.formation._id,
                                type: userFixtureFound.formation.type
                            },
                            lineUpPlayers: userFixtureFound.players
                        };
                        var secondItemDetail = {
                            formation: {
                                _id: result[1].formationId._id,
                                type: result[1].formationId.type
                            },
                            lineUpPlayers: result[1].lineUpPlayers
                        }
                        calculateStats(firstItemDetail, secondItemDetail, UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.LINE_UP_PLAYERS, function (error, percentage) {
                            if (error) {
                                callback(error);
                            } else {
                                finalResult = percentage;
                                callback(null, { 'percentage': finalResult });
                            }
                        });
                    }
                }
            })
        }
    })
}

var validateMPandFP = function (managerPick, fanspick, callback) {
    if ((fanspick == undefined || fanspick.length == 0) && (managerPick == undefined || managerPick.length == 0)) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_FANSPICK_NOT_FOUND);
    } else if (managerPick == undefined || managerPick.length == 0) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_PICK_NOT_FOUND);
    } else if (fanspick == undefined || fanspick.length == 0) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_NOT_FOUND);
    } else {
        callback(null);
    }
}

var getUserpickPercentage = function (criteria, projection, options, callback) {
    var finalResult = '0';
    var isLive = false;
    criteria.isLive = isLive;
    criteria['$or'] = [{ isPrimaryFavouriteTeam: 'true' }, { isFavouriteTeam: 'true' }];
    async.parallel([
        function (parallelCallback) {
            //get userpick
            getUserFixture(criteria, projection, options, function (error, result) {
                if (error) {
                    parallelCallback(error);
                } else {
                    parallelCallback(null, result);
                }
            })
        },
        function (parallelCallback) {
            //get fanspick
            getFanspickFixture({ fixtureId: criteria.fixtureId, teamId: criteria.teamId, isLive: isLive }, projection, options, function (error, result) {
                if (error) {
                    parallelCallback(error);
                } else {
                    parallelCallback(null, result);
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            validateData(result[0], result[1], function (error) {
                if (error) {
                    callback(error);
                } else {
                    getUP_FP_Percentage_Pre(result[0], result[1], callback);
                }
            })

        }
    });
}
var getUP_FP_Percentage_Pre = function (userFixtureFound, fanspick, callback) {
    // userFixtureFound = result[0]
    var finalResult = '0';
    var firstItemDetail = {
        formation: {
            _id: userFixtureFound[0].currentFormation._id,
            type: userFixtureFound[0].currentFormation.type
        },
        lineUpPlayers: userFixtureFound[0].lineUpPlayers
    };
    var secondItemDetail = {
        formation: {
            _id: fanspick[0].formationId._id,
            type: fanspick[0].formationId.type
        },
        lineUpPlayers: fanspick[0].lineUpPlayers
    }
    calculateStats(firstItemDetail, secondItemDetail, UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.LINE_UP_PLAYERS, function (error, percentage) {
        if (error) {
            callback(error);
        } else {
            // var percentage = (points * 100) / 11;
            finalResult = percentage;
            callback(null, { 'percentage': percentage });
        }
    });
}

var validateData = function (userPick, fanspick, callback) {
    if ((userPick == undefined || userPick.length == 0) && (fanspick == undefined || fanspick.length == 0)) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_FANSPICK_NOT_FOUND);
    } else if (fanspick == undefined || fanspick.length == 0) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_NOT_FOUND);
    } else if (userPick == undefined || userPick.length == 0) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_NOT_FOUND);
    } else {
        if (checkTeamIsSecondaryFav(userPick[0])) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SECONDARY_FAV_TEAM);
        } else if (userPick.length > 0 && (userPick[0].lineUpPlayers == undefined || userPick[0].lineUpPlayers.length < 11)) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_INCOMPLETE);
        } else if (fanspick.length > 0 && (fanspick[0].lineUpPlayers == undefined || fanspick[0].lineUpPlayers.length < 11)) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_INCOMPLETE);
        } else {
            callback(null);
        }
    }
}

var prepareLineUpFormat = function (substitutions) {
    var lineUpPlayers = [];
    substitutions.forEach(function (each) {
        var eachLineUp = {
            playerId: each.playerInId,
            positionId: each.positionId
        }
        lineUpPlayers.push(eachLineUp);
    })
    return lineUpPlayers;
}

var getFanspickVsManagerPickPercentageLive = function (criteria, projection, options, callback) {
    var userFixtureFound = {};
    var managerFixture = {};
    var finalResult = '0';
    criteria.isLive = true;
    var isFPFound = false;
    async.series([
        function (seriesCallback) {
            getFanspickFixture(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result.length == 0 /*|| result[0].substitutions == undefined || result[0].substitutions.length == 0*/) {
                    seriesCallback(null);
                    // seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_NOT_FOUND);
                } else {
                    isFPFound = true;
                    userFixtureFound.lineUpPlayers = result[0].lineUpPlayers;
                    seriesCallback(null);
                }
            })
        },
        function (seriesCallback) {
            //get MP
            var projection = {
                'localTeam.substitutions': 1,
                'localTeam.franspickTeamId': 1,
                'visitorTeam.substitutions': 1,
                'visitorTeam.franspickTeamId': 1,
                'localTeam.substitutes': 1,
                'visitorTeam.substitutes': 1
            };
            var options = { lean: true };
            getManagerPickForStats({ _id: criteria.fixtureId, $or: [{ 'localTeam.franspickTeamId': criteria.teamId }, { 'visitorTeam.franspickTeamId': criteria.teamId }] }, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    if (!isFPFound) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_NOT_FOUND);
                    }
                    else {
                        if (result[0].localTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                            managerFixture['substitutions'] = result[0].localTeam.substitutions;
                            managerFixture['substitutes'] = result[0].localTeam.substitutes;
                        } else {
                            managerFixture['substitutions'] = result[0].visitorTeam.substitutions;
                            managerFixture['substitutes'] = result[0].visitorTeam.substitutes;
                        }
                        seriesCallback();
                    }
                } else {
                    // seriesCallback();
                    if (!isFPFound) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MANAGER_FANSPICK_NOT_FOUND);
                    } else {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_NOT_FOUND);
                    }
                }
            })
        },
        function (seriesCallback) {
            if (managerFixture.substitutes != null && userFixtureFound != null) {
                var lineUpPlayers = [];
                managerFixture.substitutes.forEach(function (eachSub) {
                    userFixtureFound.lineUpPlayers.forEach(function (eachFp) {
                        if (eachSub.playerId._id.toString() == eachFp.playerId._id.toString()) {
                            var eachLineUp = {
                                playerId: eachFp.playerId,
                                positionId: eachFp.positionId
                            }
                            lineUpPlayers.push(eachLineUp);
                        }
                    })
                })
                userFixtureFound['substitutes'] = lineUpPlayers;
                seriesCallback();
            } else {
                seriesCallback();
            }
        },
        function (seriesCallback) {
            //calculate stats 
            if ((userFixtureFound.substitutes != undefined || userFixtureFound.substitutes != null) && (managerFixture['substitutes'] != undefined || managerFixture['substitutes'] != null)) {
                var managerSub = prepareLineUpFormat(managerFixture.substitutions);
                commonPlayerPercentage(userFixtureFound.substitutes, managerSub, UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.SUBSTITUTES, function (error, percentage) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        finalResult = Math.round(percentage.percentage * 100).toString();
                        seriesCallback(null);
                    }
                });
            } else {
                seriesCallback();
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, { 'percentage': finalResult });
        }
    });
}

var getUserpickVsManagerPickPercentageLive = function (criteria, projection, options, callback) {
    var userFixtureFound = {};
    var managerFixture = {};
    var finalResult = '0';
    var managerSub = [];
    var isUserPickFound = false;
    criteria.isLive = true;
    async.series([
        function (seriesCallback) {
            criteria['$or'] = [{ isPrimaryFavouriteTeam: 'true' }, { isFavouriteTeam: 'true' }];
            getUserFixture(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result.length == 0 /*|| result[0].substitutions == undefined || result[0].substitutions.length == 0*/) {
                    // seriesCallback(null);
                    isUserPickFound = false;
                    seriesCallback(null);
                    // seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
                } else {
                    if (checkTeamIsSecondaryFav(result[0])) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SECONDARY_FAV_TEAM);
                    } else {
                        isUserPickFound = true;
                        userFixtureFound.lineUpPlayers = result[0].substitutions;
                        seriesCallback(null);
                    }
                }
            })
        },
        function (seriesCallback) {
            //get MP
            var projection = {
                'localTeam.substitutions': 1,
                'localTeam.franspickTeamId': 1,
                'visitorTeam.substitutions': 1,
                'visitorTeam.franspickTeamId': 1
            };
            var options = { lean: true };
            getManagerPickForStats({ _id: criteria.fixtureId, $or: [{ 'localTeam.franspickTeamId': criteria.teamId }, { 'visitorTeam.franspickTeamId': criteria.teamId }] }, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    if (!isUserPickFound) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_MANAGER_NOT_FOUND)
                    }
                    else if (result[0].localTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                        managerFixture['substitutions'] = result[0].localTeam.substitutions;
                    } else {
                        managerFixture['substitutions'] = result[0].visitorTeam.substitutions;
                    }
                    seriesCallback();
                } else {
                    // seriesCallback();
                    if (!isUserPickFound) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_MANAGER_NOT_FOUND)
                    } else {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
                    }

                }
            })
        },
        function (seriesCallback) {
            //calculate stats 
            if (userFixtureFound != undefined && managerFixture != undefined) {
                managerSub = managerFixture.substitutions;
                /* commonPlayerPercentage(userFixtureFound.lineUpPlayers, managerSub, UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.SUBSTITUTES, function (error, percentage) {
                     if (error) {
                         seriesCallback(error);
                     } else {
                         finalResult = Math.round(percentage.percentage * 100).toString();
                         seriesCallback(null);
                     }
                 });*/
                seriesCallback(null);
            } else {
                seriesCallback();
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, { 'userPickSub': userFixtureFound.lineUpPlayers, 'managerPickSub': managerSub });
        }
    });
}




var getUserpickVsFanspickPercentageLive = function (criteria, projection, options, callback) {
    var userFixtureFound = null;
    var finalResult = '0';
    var fpLineUpPlayers = {};
    var isLive = true;
    var fpFixture = null;
    var substitutes = null;
    criteria.isLive = isLive;
    async.series([
        function (seriesCallback) {
            criteria['$or'] = [{ isPrimaryFavouriteTeam: 'true' }, { isFavouriteTeam: 'true' }];
            getUserFixture(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result.length == 0 /*|| result[0].substitutions == undefined || result[0].substitutions.length == 0*/) {
                    // seriesCallback(null);
                    userFixtureFound = result;
                    seriesCallback();
                    // seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
                } else {
                    if (checkTeamIsSecondaryFav(result[0])) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SECONDARY_FAV_TEAM);
                    } else {
                        userFixtureFound = {};
                        userFixtureFound.lineUpPlayers = prepareLineUpFormat(result[0].substitutions);
                        userFixtureFound.currentFormation = result[0].currentFormation;
                        seriesCallback(null);
                    }
                }
            })
        },
        function (seriesCallback) {
            // if (userFixtureFound.lineUpPlayers != undefined && userFixtureFound.lineUpPlayers.length > 0) {           
            async.parallel([
                function (parallelCallback) {
                    //get FP
                    getFanspickFixture({ fixtureId: criteria.fixtureId, teamId: criteria.teamId, isLive: isLive }, projection, options, function (err, result) {
                        if (err) {
                            parallelCallback(error);
                        } else if (result.length == 0) {
                            // parallelCallback(null);
                            if (userFixtureFound.length == 0) {
                                parallelCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_FANSPICK_NOT_FOUND);
                            } else {
                                parallelCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_NOT_FOUND);
                            }
                        } else {
                            if (userFixtureFound.length == 0) {
                                parallelCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERPICK_FANSPICK_NOT_FOUND);
                            } else {
                                fpFixture = result[0];
                                parallelCallback();

                            }
                        }
                    })
                },
                function (parallelCallback) {
                    //get MP

                    var projection = {
                        'localTeam.substitutes': 1,
                        'localTeam.franspickTeamId': 1,
                        'visitorTeam.substitutes': 1,
                        'visitorTeam.franspickTeamId': 1
                    };
                    var options = { lean: true };
                    getManagerPickForStats({ _id: criteria.fixtureId, $or: [{ 'localTeam.franspickTeamId': criteria.teamId }, { 'visitorTeam.franspickTeamId': criteria.teamId }] }, projection, options, function (error, result) {
                        if (error) {
                            parallelCallback(error);
                        } else if (result != undefined && result.length > 0) {
                            if (result[0].localTeam.franspickTeamId.toString() == criteria.teamId.toString()) {
                                substitutes = result[0].localTeam.substitutes;
                            } else {
                                substitutes = result[0].visitorTeam.substitutes;
                            }
                            parallelCallback();
                        } else {
                            parallelCallback();
                        }
                    })

                }
            ], function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (substitutes != null && fpFixture != null) {
                    var lineUpPlayers = [];
                    substitutes.forEach(function (eachSub) {
                        fpFixture.lineUpPlayers.forEach(function (eachFp) {
                            if (eachSub.playerId._id.toString() == eachFp.playerId._id.toString()) {
                                var eachLineUp = {
                                    playerId: eachFp.playerId,
                                    positionId: eachFp.positionId
                                }
                                lineUpPlayers.push(eachLineUp);
                            }
                        })
                    })
                    fpFixture['substitutes'] = lineUpPlayers;
                    seriesCallback();
                } else {
                    seriesCallback();
                }
            })
            // } else {
            //     seriesCallback();
            // }
        },
        function (seriesCallback) {
            //calculate stats 
            if (userFixtureFound != null && userFixtureFound.currentFormation != null && fpFixture != null && fpFixture.substitutes != undefined) {
                var firstItemDetail = {
                    formation: {
                        _id: userFixtureFound.currentFormation._id,
                        type: userFixtureFound.currentFormation.type
                    },
                    lineUpPlayers: userFixtureFound.lineUpPlayers
                };
                var secondItemDetail = {
                    formation: {
                        _id: fpFixture.formationId._id,
                        type: fpFixture.formationId.type
                    },
                    lineUpPlayers: fpFixture.substitutes
                }

                calculateStats(firstItemDetail, secondItemDetail, UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.SUBSTITUTES, function (error, percentage) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        finalResult = percentage;
                        seriesCallback(null);
                    }
                });
            } else {
                seriesCallback();
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, { 'percentage': finalResult });
        }
    });
}



/** aggregation logic start  */

/**
 * items formats  = {
 *      formation : {
 *              _id :'',
 *              type : ''
 *      },
 *      lineUpPlayers : [
 *      {
 *              "playerId": {
                    "_id": "596c6b63a55787a414050d08",
                    "knownName": "D. Mitchell",
                    "lastname": "Mitchell",
                    "firstname": "David"
                },
                "positionId": {
                    "_id": "58d0ef994dcb492d8d048ebb",
                    "PosX": 1,
                    "PosY": 3,
                    "Role": "D",
                    "Key": "1_3"
                },
                "_id": "5975e784f099dc24d6c28642"
 *     }
 * ]
 * }
 */
var calculateStats = function (firstItemDetail, secondItemDetail, type, callback) {
    var sum = 0;
    var commonPlayersInFirstItem = [];
    var commonPlayersInSecondItem = [];
    async.series([
        function (seriesCallback) {
            //get formation percentage
            var firstItemFormation = firstItemDetail.formation.type;
            var secondItemFormation = secondItemDetail.formation.type;
            if (type == UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.SUBSTITUTES && firstItemDetail.lineUpPlayers.length == 0) {
                seriesCallback();
            } else {
                getFormationPercentage(firstItemFormation, secondItemFormation, type, function (error, formationPercentage) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        sum += formationPercentage;
                        seriesCallback();
                    }
                })
            }
        },
        function (seriesCallback) {
            //get playerCount 
            var firstItemLineup = firstItemDetail.lineUpPlayers;
            var secondItemLineup = secondItemDetail.lineUpPlayers;
            commonPlayerPercentage(firstItemLineup, secondItemLineup, type, function (error, matchedPlayersStats) {
                if (error) {
                    seriesCallback(error);
                } else {
                    sum += matchedPlayersStats.percentage;
                    commonPlayersInFirstItem = matchedPlayersStats.commonPlayersInFirstItem;
                    commonPlayersInSecondItem = matchedPlayersStats.commonPlayersInSecondItem;
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            //get matched player's position percentage
            var divider = firstItemDetail.lineUpPlayers.length > secondItemDetail.lineUpPlayers.length ? firstItemDetail.lineUpPlayers.length : secondItemDetail.lineUpPlayers.length;
            getPlayerPostionPercentage(commonPlayersInFirstItem, commonPlayersInSecondItem, type, divider, function (error, playerWithPositionPercentage) {
                if (error) {
                    seriesCallback(error);
                } else {
                    sum += playerWithPositionPercentage;
                    seriesCallback();
                }
            })

        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            var percentage = sum > 0 ? sum / 3 : sum;
            percentage = percentage * 100;
            percentage = Math.round(percentage);
            callback(null, percentage.toString());
        }
    })
}

var getFormationPercentage = function (firstFormation, secondFormation, type, callback) {
    var percentage = 0;
    async.series([
        function (seriesCallback) {
            var totalPoints = 0;
            //if both formations having same number of lines
            if (firstFormation.length == secondFormation.length) {
                totalPoints += 1;
            }
            var firstFourLineFormation = getFourLineFormation(firstFormation);
            var secondFourLineFormation = getFourLineFormation(secondFormation);
            for (var charIndex = 0; charIndex < 4; charIndex++) {
                if (firstFourLineFormation[charIndex] == secondFourLineFormation[charIndex]) {
                    totalPoints += 1;
                }
            }
            //5 ptns :- 1 for same number of lines for formations and 4 points for number of players on each line(4-line formation)
            percentage = totalPoints / 5;
            seriesCallback();
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, percentage);
        }
    })

}

var getFourLineFormation = function (formation) {
    if (formation.length < 4) {
        formation = formation.slice(0, 2) + '0' + formation.slice(2, formation.length);
    }
    return formation;
}

var commonPlayerPercentage = function (firstItemLineup, secondItemLineup, type, callback) {
    var matchedPlayersStats = {
        percentage: 0,
        commonPlayersInFirstItem: [],
        commonPlayersInSecondItem: []
    };
    async.series([
        function (seriesCallback) {
            var count = 0;
            // if (firstItemLineup.length == 0 && secondItemLineup.length == 0 && type == UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.SUBSTITUTES) {
            //     count = 1;
            // }/*else if(type == UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.SUBSTITUTES && (firstItemLineup.length == 0 || secondItemLineup.length == 0)){
            // count = 0;
            // }*/
            // else {
            firstItemLineup.forEach(function (eachPlayerOfFirstItem) {
                if (eachPlayerOfFirstItem.playerId != null) {
                    secondItemLineup.forEach(function (eachPlayerOfSecondItem) {
                        if (eachPlayerOfSecondItem.playerId != null) {
                            if (eachPlayerOfFirstItem.playerId._id.toString() == eachPlayerOfSecondItem.playerId._id.toString()) {
                                matchedPlayersStats.commonPlayersInFirstItem.push(eachPlayerOfFirstItem);
                                matchedPlayersStats.commonPlayersInSecondItem.push(eachPlayerOfSecondItem);
                                count++;
                            }
                        }
                    })
                }
            });
            // }
            var divider = firstItemLineup.length > secondItemLineup.length ? firstItemLineup.length : secondItemLineup.length;
            matchedPlayersStats.percentage = count > 0 && divider > 0 ? count / divider : count; // divide by total number of players 
            seriesCallback(null);
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, matchedPlayersStats);
        }
    })
}

var getPlayerPostionPercentage = function (commonPlayersInFirstItem, commonPlayersInSecondItem, type, divider, callback) {
    var percentage = 0;
    var commonPlayerUnmacthedPositionFirstItem = [];
    var commonPlayerUnmacthedPositionSecondItem = [];
    var sum = 0;
    async.series([
        function (seriesCallback) {
            if (commonPlayersInFirstItem.length != commonPlayersInSecondItem.length) {
                seriesCallback(null, percentage);
            } else {

                //get common player's percentage according to their positons 
                for (var commonPlayerIndex = 0; commonPlayerIndex < commonPlayersInFirstItem.length; commonPlayerIndex++) {
                    //check if their postions matched
                    var firstItemPlayerPosition = commonPlayersInFirstItem[commonPlayerIndex].positionId;
                    var secondItemPlayerPosition = commonPlayersInSecondItem[commonPlayerIndex].positionId;
                    if (firstItemPlayerPosition._id.toString() == secondItemPlayerPosition._id.toString()) {
                        sum += 1;
                    } else {
                        commonPlayerUnmacthedPositionFirstItem.push(commonPlayersInFirstItem[commonPlayerIndex]);
                        commonPlayerUnmacthedPositionSecondItem.push(commonPlayersInSecondItem[commonPlayerIndex]);
                    }
                }
                seriesCallback(null);
            }
        },
        function (seriesCallback) {
            //get player's count with position in same row
            if (commonPlayerUnmacthedPositionFirstItem.length != commonPlayerUnmacthedPositionSecondItem.length) {
                seriesCallback();
            } else {
                var count = 0;
                for (var playerIndex = 0; playerIndex < commonPlayerUnmacthedPositionFirstItem.length; playerIndex++) {
                    if (commonPlayerUnmacthedPositionFirstItem[playerIndex].positionId.PosX == commonPlayerUnmacthedPositionSecondItem[playerIndex].positionId.PosX) {
                        count += 1;
                    }
                }
                count = count > 0 ? count / 2 : count;
                sum += count;
                seriesCallback();
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            // if (commonPlayersInFirstItem.length == 0 && commonPlayersInSecondItem.length == 0 && type == UniversalFunctions.CONFIG.APP_CONSTANTS.STATS_TYPES.SUBSTITUTES) {
            //     sum = 1;
            // }
            // var divider = commonPlayersInFirstItem.length > commonPlayersInSecondItem.length ? commonPlayersInFirstItem.length : commonPlayersInSecondItem.length;
            percentage = sum > 0 && divider > 0 ? sum / divider : sum;
            callback(null, percentage);
        }
    })
}

/** aggregation logic ends  */


var getManagerPick = function (criteria, projection, options, callback) {
    Models.Fixture.find(criteria, projection, options).populate({
        path: 'localTeam.formation',
        model: 'formations'
    }).populate({
        path: 'localTeam.players.positionId',
        model: 'lkpPosition'
    }).populate({
        path: 'visitorTeam.formation',
        model: 'formations'
    }).populate({
        path: 'visitorTeam.players.positionId',
        model: 'lkpPosition',
        // options : { sort : {'Key' : 1}}
    }).populate({
        path: 'visitorTeam.players.playerId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'localTeam.players.playerId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'localTeam.substitutions.playerInId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'visitorTeam.substitutions.playerInId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'localTeam.substitutions.playerOutId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'visitorTeam.substitutions.playerOutId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'localTeam.substitutions.positionId',
        model: 'lkpPosition'
    }).populate({
        path: 'visitorTeam.substitutions.positionId',
        model: 'lkpPosition'
    })
        .populate({
            path: 'localTeam.livePlayers.positionId',
            model: 'lkpPosition'
        }).populate({
            path: 'visitorTeam.livePlayers.positionId',
            model: 'lkpPosition'
        }).populate({
            path: 'visitorTeam.livePlayers.playerId',
            model: 'playerData',
            select: '_id knownName lastname firstname'
        }).populate({
            path: 'localTeam.livePlayers.playerId',
            model: 'playerData',
            select: '_id knownName lastname firstname'
        })
        .exec(callback);
}


var getManagerPickForStats = function (criteria, projection, options, callback) {
    Models.Fixture.find(criteria, projection, options).populate({
        path: 'localTeam.formation',
        model: 'formations'
    }).populate({
        path: 'localTeam.players.positionId',
        model: 'lkpPosition'
    }).populate({
        path: 'visitorTeam.formation',
        model: 'formations'
    }).populate({
        path: 'visitorTeam.players.positionId',
        model: 'lkpPosition',
        // options : { sort : {'Key' : 1}}
    }).populate({
        path: 'visitorTeam.players.playerId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'localTeam.players.playerId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'localTeam.substitutions.playerInId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'visitorTeam.substitutions.playerInId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'localTeam.substitutions.playerOutId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'visitorTeam.substitutions.playerOutId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'localTeam.substitutions.positionId',
        model: 'lkpPosition'
    }).populate({
        path: 'visitorTeam.substitutions.positionId',
        model: 'lkpPosition'
    }).populate({
        path: 'localTeam.substitutes.playerId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'visitorTeam.substitutes.playerId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).exec(callback);
}

var getUpcomingFixturesForBothTeams = function (payloadData, projection, options, callback) {
    async.parallel([
        function (innerCallback) {
            var criteria = {
                fixtureId: new ObjectId(payloadData.fixtureId)
            }

            Models.fixturePlayersStatics.find(criteria, {}, {}, function (err, result) {
                if (err) {
                    innerCallback(err);
                } else {
                    innerCallback(null, { 'staticInfo': result });
                }
            })
        }, function (innerCallback) {
            getUpcomingFixturesForLocalTeam(payloadData, projection, options, function (err, result) {
                if (err) {
                    innerCallback(err);
                }
                else if (result.length == 0) {
                    getUpcomingFixturesForVisitorTeam(payloadData, projection, options, function (err, result) {
                        if (err) {
                            innerCallback(err);
                        }
                        else {
                            innerCallback(null, { 'teamData': result });
                        }
                    });
                }
                else {
                    innerCallback(null, { 'teamData': result });
                }
            });
        }
    ], function (err, result) {
        if (err) {
            callback(err);
        } else {
            if (result && result.length > 0) {
                if (result.length >= 2 && result[1].teamData.length > 0) {
                    var staticInfos = result[0].staticInfo;
                    var teamData = result[1].teamData[0].team;
                    var count = 0;
                    teamData.forEach(function (eachTeam) {
                        staticInfos.forEach(function (eachStaticRecord) {
                            if (eachTeam.players.playerId.toString() == eachStaticRecord._doc.playerId.toString() && eachStaticRecord._doc.isStatic) {
                                count++;
                                eachTeam.players['playerPositionX'] = eachStaticRecord._doc.posX;
                                eachTeam.players['playerPositionY'] = eachStaticRecord._doc.posY;
                                eachTeam.players['role'] = eachStaticRecord._doc.role;
                                eachTeam.players['isStatic'] = true;

                            }
                        });

                    });

                }
                return callback(null, result[1].teamData);
            } else
                return callback(null, result);
        }
    })

}

var getUpcomingFixturesForLocalTeam = function (payloadData, projection, options, callback) {
    Models.Fixture.aggregate([{ $match: { _id: new ObjectId(payloadData.fixtureId) } },

    { $match: { 'localTeam.franspickTeamId': new ObjectId(payloadData.teamId) } },
    { $unwind: '$localTeam.players' },

    {
        $lookup: {
            from: 'lkpassociatepositions',
            localField: 'localTeam.players.playerPos',
            foreignField: 'Position',
            as: 'localTeam.players.detail'
        }
    },
    { $unwind: '$localTeam.players.detail' },
    {
        $lookup: {
            from: 'lkppositions',
            localField: 'localTeam.players.detail.Pos_Id',
            foreignField: '_id',
            as: 'localTeam.players.detail.Positions'
        }
    },
    {
        $group: {
            _id: '$_id',
            'team': { $push: '$localTeam' }
        }
    }
    ]).exec(function (err, fixtures) {
        if (err) {
            callback(err);
        } else {
            callback(null, fixtures);
        }
    });



};

var getUpcomingFixturesForVisitorTeam = function (payloadData, projection, options, callback) {


    Models.Fixture.aggregate([{ $match: { _id: new ObjectId(payloadData.fixtureId) } },

    { $match: { 'visitorTeam.franspickTeamId': new ObjectId(payloadData.teamId) } },
    { $unwind: '$visitorTeam.players' },

    {
        $lookup: {
            from: 'lkpassociatepositions',
            localField: 'visitorTeam.players.playerPos',
            foreignField: 'Position',
            as: 'visitorTeam.players.detail'
        }
    },
    { $unwind: '$visitorTeam.players.detail' },
    {
        $lookup: {
            from: 'lkppositions',
            localField: 'visitorTeam.players.detail.Pos_Id',
            foreignField: '_id',
            as: 'visitorTeam.players.detail.Positions'
        }
    },
    {
        $group: {
            _id: '$_id',
            'team': { $push: '$visitorTeam' }
        }
    }
    ]).exec(function (err, fixtures) {
        if (err) {
            callback(err);
        } else {
            callback(null, fixtures);
        }
    });
};

var getUserActions = function (playerIDArray, payloadData, callback) {
    var query = [];
    var fixtureIdObj = new ObjectId(payloadData.fixtureId);
    var teamIdObj = new ObjectId(payloadData.teamId);
    query.push(
        { $match: { fixtureId: fixtureIdObj, teamId: teamIdObj, userId: payloadData.userId } }
    );
    query.push({
        $unwind: '$userActions'
    });
    query.push(
        {
            $project: {
                'userActions': '$userActions'
            }
        });
    query.push(
        { $match: { 'userActions.playerID': { $in: playerIDArray } } }
    );
    Models.userFixture.aggregate(query).exec(function (err, userActions) {
        if (err) {
            callback(err);
        } else {
            callback(null, userActions);
        }
    });

}

var getFormation = function (criteria, projection, options, callback) {
    Models.formations.find(criteria, projection, options, callback);
}

var getAllTopicAsTopicdatas = function (criteria, projection, options, callback) {
    Models.topic.find(criteria, projection, options, callback);
};

var getUserFavTeams = function (teamArray, projection, callback) {
    var query = [];
    query.push(
        { $match: { '_id': { $in: teamArray } } }
    );
    query.push({
        $project: {
            '_id': "$_id",
            'knownName': "$knownName",
            'imageURL': "$imageURL",
            "coachName": "$coachName",
            "sportId": "$sportId",
            "countryId": "$countryId",
            "founded": "$founded",
            "country": "$country",
            "fullName": "$fullName",
            "isNationalTeam": "$isNationalTeam"
        }
    })
    Models.Teams.aggregate(query).exec(function (err, teamData) {
        if (err) {
            callback(err);
        } else {
            callback(null, teamData);
        }
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




/*=========================================================
LOGGINF INFORMATION
==============================================================*/

//Insert User in DB
var createEventLog = function (objToSave, callback) {
    Models.eventLoging(objToSave).save(callback)
};




//////////////////////////////////////////////////////////////////////////////CHAT DATA///////////////////////////////////////////////////////////////

var getChatHistory = function (criteria, projection, options, callback) {

    var result = {
        _id: null,
        communityID: null,
        fixtureID: null,
        name: '',
        createdDate: null,
        communityPosts: [],
        fanspickPosts: [],
        topicTages: null,
        hot: null,
        isDeleted: false,
        isLocked: false,
        isPinned: false
    }
    async.series([
        function (seriesCallback) {
            //get topic
            var projection = { fanspickPosts: 0, communityPosts: 0 };
            var options = { lean: true };
            getAllTopicAsTopicdatas(criteria, projection, options, function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else if (response && response.length > 0) {
                    result._id = response[0]._id || null;
                    result.communityID = response[0].communityID;
                    result.fixtureID = response[0].fixtureID;
                    result.name = response[0].name;
                    result.createdDate = response[0].createdDate;
                    result.topicTages = response[0].topicTages;
                    result.hot = response[0].hot;
                    result.isDeleted = response[0].isDeleted;
                    result.isLocked = response[0].isLocked;
                    result.isPinned = response[0].isPinned;
                    seriesCallback(null);
                } else {
                    seriesCallback(null);
                }
            })
        },
        function (seriesCallback) {
            //get fanspickPosts 
            getFanspickPostsForTopic(criteria, function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else if (response && response.length > 0) {
                    result.fanspickPosts = response[0].fanspickPosts;
                    seriesCallback(null);
                } else {
                    seriesCallback(null);
                }
            })
        }, function (seriesCallback) {
            //get fanspickPosts 
            getCommunityPostsForTopic(criteria, function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else if (response && response.length > 0) {
                    result.communityPosts = response[0].communityPosts;
                    seriesCallback(null);
                } else {
                    seriesCallback(null);
                }
            })
        }
    ], function (error, response) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })

};

var getFanspickPostsForTopic = function (criteria, callback) {
    var query = [];
    query.push({ $match: { _id: new ObjectId(criteria._id) } },
        { $unwind: "$fanspickPosts" },
        {
            $lookup: {
                localField: 'fanspickPosts.userId',
                foreignField: '_id',
                from: 'fanspickuserschemas',
                as: 'fanspickPosts.userId'
            }
        },
        { $unwind: '$fanspickPosts.userId' },
        {
            $project: {
                '_id': '$_id',
                communityID: '$communityID',
                fixtureID: '$fixtureID',
                name: '$name',
                createdDate: '$createdDate',
                topicTages: '$topicTages',
                hot: '$hot',
                isDeleted: '$isDeleted',
                isLocked: '$isLocked',
                isPinned: '$isPinned',
                'fanspickPosts.userId._id': '$fanspickPosts.userId._id',
                'fanspickPosts.userId.emailId': '$fanspickPosts.userId.emailId',
                'fanspickPosts.userId.username': '$fanspickPosts.userId.username',
                'fanspickPosts.userId.gender': '$fanspickPosts.userId.gender',
                'fanspickPosts.userId.deviceType': '$fanspickPosts.userId.deviceType',
                'fanspickPosts.userId.lastname': '$fanspickPosts.userId.lastname',
                'fanspickPosts.userId.firstname': '$fanspickPosts.userId.firstname',
                'fanspickPosts._id': '$fanspickPosts._id',
                'fanspickPosts.message': '$fanspickPosts.message',
                'fanspickPosts.type': '$fanspickPosts.type',
                'fanspickPosts.time': '$fanspickPosts.time'
            }
        },
        {
            $group: {
                _id: '$_id',
                communityID: { $first: '$communityID' },
                fixtureID: { $first: '$fixtureID' },
                name: { $first: '$name' },
                createdDate: { $first: '$createdDate' },
                fanspickPosts: { $push: '$fanspickPosts' },
                topicTages: { $first: '$topicTages' },
                hot: { $first: '$hot' },
                isDeleted: { $first: '$isDeleted' },
                isLocked: { $first: '$isLocked' },
                isPinned: { $first: '$isPinned' }
            }
        });
    Models.topic.aggregate(query, callback);
}

var getCommunityPostsForTopic = function (criteria, callback) {

    var query = [];
    query.push({ $match: { _id: new ObjectId(criteria._id) } },
        { $unwind: "$communityPosts" },
        {
            $lookup: {
                localField: 'communityPosts.userId',
                foreignField: '_id',
                from: 'fanspickuserschemas',
                as: 'communityPosts.userId'
            }
        },
        { $unwind: '$communityPosts.userId' },
        {
            $project: {
                '_id': '$_id',
                communityID: '$communityID',
                fixtureID: '$fixtureID',
                name: '$name',
                createdDate: '$createdDate',
                topicTages: '$topicTages',
                hot: '$hot',
                isDeleted: '$isDeleted',
                isLocked: '$isLocked',
                isPinned: '$isPinned',
                'communityPosts.userId._id': '$communityPosts.userId._id',
                'communityPosts.userId.emailId': '$communityPosts.userId.emailId',
                'communityPosts.userId.username': '$communityPosts.userId.username',
                'communityPosts.userId.gender': '$communityPosts.userId.gender',
                'communityPosts.userId.deviceType': '$communityPosts.userId.deviceType',
                'communityPosts.userId.lastname': '$communityPosts.userId.lastname',
                'communityPosts.userId.firstname': '$communityPosts.userId.firstname',
                'communityPosts._id': '$communityPosts._id',
                'communityPosts.message': '$communityPosts.message',
                'communityPosts.type': '$communityPosts.type',
                'communityPosts.time': '$communityPosts.time'
            }
        },
        {
            $group: {
                _id: '$_id',
                communityID: { $first: '$communityID' },
                fixtureID: { $first: '$fixtureID' },
                name: { $first: '$name' },
                createdDate: { $first: '$createdDate' },
                communityPosts: { $push: '$communityPosts' },
                topicTages: { $first: '$topicTages' },
                hot: { $first: '$hot' },
                isDeleted: { $first: '$isDeleted' },
                isLocked: { $first: '$isLocked' },
                isPinned: { $first: '$isPinned' }
            }
        });
    Models.topic.aggregate(query, callback);
}


var getTeamSquad = function (criteria, projection, options, callback) {
    Models.Teams.find(criteria, projection, options, function (err, docs) {
        Models.Player.populate(docs[0].squadData, {
            path: 'squad'
        }, function (err, things) {
            if (err) return callback(err);
            callback(null, docs[0].squadData);
        });
    });
};

var getTeamSquadAggregate = function (query, callback) {
    Models.Teams.aggregate(query).exec(callback);
}

var getLineUpsUserFixture = function (criteria, projection, callback) {
    Models.userFixture.find(criteria, projection, callback);
}

var getPlayerData = function (criteria, projection, options, callback) {
    Models.Player.find(criteria, projection, options, callback);
};

var getPlayerDataWithStatistics = function (playerId, callback) {
    var query = [
        { $match: { "_id": new ObjectId(playerId) } },
        {
            $unwind: {
                "path": "$statistics",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $group: {
                _id: '$_id',
                "fanspickTeamId": { $first: "$fanspickTeamId" },
                "knownName": { $first: "$knownName" },
                "playerFeedId": { $first: "$playerFeedId" },
                "weight": { $first: "$weight" },
                "height": { $first: "$height" },
                "position": { $first: "$position" },
                "birthplace": { $first: "$birthplace" },
                "birthcountry": { $first: "$birthcountry" },
                "age": { $first: "$age" },
                "birthdate": { $first: "$birthdate" },
                "nationality": { $first: "$nationality" },
                "teamid": { $first: "$teamid" },
                "team": { $first: "$team" },
                "lastname": { $first: "$lastname" },
                "firstname": { $first: "$firstname" },
                "name": { $first: "$name" },
                "imageURL": { $first: '$imageURL' },

                "redcardsTotal": { $sum: '$statistics.redcards' },
                "yellowredTotal": { $sum: '$statistics.yellowred' },
                "yellowcardsTotal": { $sum: '$statistics.yellowcards' },
                "goalsTotal": { $sum: '$statistics.goals' },
                "substitutes_on_benchTotal": { $sum: '$statistics.substitutes_on_bench' },
                "substitute_outTotal": { $sum: '$statistics.substitute_out' },
                "substitute_inTotal": { $sum: '$statistics.substitute_in' },
                "lineupsTotal": { $sum: '$statistics.lineups' },
                "appearencesTotal": { $sum: '$statistics.appearences' },
                "minutesTotal": { $sum: '$statistics.minutes' },
                "statistics": { $push: "$statistics" }

            }
        }
    ];
    Models.Player.aggregate(query, callback);
}

// var updateFixtureActions = function(criteria, dataToUpdate, options,callback){
//     // .update({_id :ObjectId("59034771c3dfbf0c55dac31e"), userActions : {$elemMatch : {"_id" : ObjectId("59037b90475cd22c0bbf1be6")}} },{$set : {'userActions.$': 
//     // {
//     //         "time" : ISODate("2017-04-28T17:27:44.879Z"),
//     //         "playerId" : ObjectId("58d4e9b84dcb492d8d0497f7"),
//     //         "action" : "star",
//     //         "minutes" : "59",
//     //         "_id" : ObjectId("59037b90475cd22c0bbf1be6")
//     //     }
//     // }})

// }

//Insert User in DB
var createUserPick = function (objToSave, callback) {
    Models.userPick(objToSave).save(callback)
};

var createUserFixture = function (objToSave, callback) {
    Models.userFixture(objToSave).save(callback)
};

var getUserFixture = function (criteria, projection, options, callback) {
    Models.userFixture.find(criteria, projection, options).populate({
        path: 'currentFormation',
        model: 'formations'
    }).populate({
        path: 'lineUpPlayers.positionId',
        model: 'lkpPosition',
        // options :  { sort : {'Key' : 1}}
    }).populate({
        path: 'lineUpPlayers.playerId',
        model: 'playerData',
        select: 'knownName firstname lastname'
    }).populate({
        path: 'substitutions.playerInId',
        model: 'playerData',
        select: 'knownName firstname lastname'
    }).populate({
        path: 'substitutions.positionId',
        model: 'lkpPosition',
        // options :  { sort : {'Key' : 1}}
    }).populate({
        path: 'substitutions.playerOutId',
        model: 'playerData',
        select: 'knownName firstname lastname'
    }).exec(function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
};

var updateUserFixture = function (criteria, dataToSet, options, callback) {
    // Models.userFixture.findOneAndUpdate(criteria, dataToSet, options, callback);
    Models.userFixture.update(criteria, dataToSet, options).populate({
        path: 'currentFormation',
        model: 'formations'
    }).populate({
        path: 'lineUpPlayers.positionId',
        model: 'lkpPosition'
    }).populate({
        path: 'lineUpPlayers.playerId',
        model: 'playerData',
        select: 'knownName firstname lastname'
    }).exec(callback);
};

var removeUserFixture = function (criteria, projection, options, callback) {
    Models.userFixture.remove(criteria, callback);
}

var getTeamdata = function (criteria, projection, options, callback) {
    Models.fanspickUser.find(criteria, projection, options, function (err, docs) {
        async.series([
            function (cb) {
                Models.Teams.populate(docs[0].defaultTeam, {
                    path: 'favouriteTeam'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            },
            function (cb) {
                Models.Teams.populate(docs[0].defaultTeam, {
                    path: 'favouriteTeamCountry',
                    select: 'country'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            },
            function (cb) {
                Models.Teams.populate(docs[0].defaultTeam, {
                    path: 'favouriteTeamLeague',
                    select: 'leagueName'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            },
            function (cb) {
                Models.Teams.populate(docs[0].teamFavourite, {
                    path: 'favouriteTeam'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            },
            function (cb) {
                Models.Country.populate(docs[0].teamFavourite, {
                    path: 'favouriteTeamCountry',
                    select: 'country'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            },
            function (cb) {
                Models.League.populate(docs[0].teamFavourite, {
                    path: 'favouriteTeamLeague',
                    select: 'leagueName'
                }, function (err, things) {
                    if (err) return cb(err, docs);
                    cb(null, docs);
                });
            }
        ], function (err, data) {
            if (err) return callback(err, docs);
            callback(null, docs);
        });
    })
};

var getFixture = function (criteria, projection, options, callback) {
    Models.Fixture.find(criteria, projection, options, function (err, docs) {
        Models.Player.populate(docs[0].squadData, {
            path: 'player'
        }, function (err, things) {
            if (err) return callback(err);
            callback(null, docs[0].squadData);
        });
    });
};

var createUserAction = function (criteriaWithActionTime, criteriaWithoutActionTime, dataToSet, callback) {
    // Models.userFixture.findOne(criteriaWithActionTime).exec(function (err, doc) {
    //     if (err) return callback(err);
    //     if (doc == 'undefined' || doc == null) {
    Models.userFixture.findOne(criteriaWithoutActionTime).exec(function (err, doc) {
        if (err) return callback(err);
        if (doc !== null) {
            doc.userActions.push(dataToSet);
            doc.save();
            callback(null, UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.USERACTION_MARKED);
        }
        else {
            return callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND);
        }
    });
    //     }
    //     else {
    //         return callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERACTION_EXIST);
    //     }

    // });

    // Models.userFixture.update(criteriaWithoutActionTime,dataToSet,{},callback);
};

var getNotification = function (criteria, projection, options, callback) {
    Models.notification.find(criteria, projection, options, callback);
};

var getSponsorBillboards = function (criteria, projection, options, callback) {
    Models.sponsorBillboard.find(criteria, projection, options, callback);
};


var createFanspickFixture = function (objToSave, callback) {
    Models.fanspickFixture(objToSave).save(callback)
};

var getStaticPositionStatus = function (criteriaStaticStatus, projection, callback) {
    Models.fixturePlayersStatics.find(criteriaStaticStatus, projection, callback)
}

var getFanspickFixture = function (criteria, projection, options, callback) {
    Models.fanspickFixture.find(criteria, projection, options).populate({
        path: 'lineUpPlayers.positionId',
        model: 'lkpPosition'
    }).populate({
        path: 'lineUpPlayers.playerId',
        model: 'playerData',
        select: 'knownName firstname lastname'
    }).populate({
        path: 'formationId',
        model: 'formations'
    }).populate({
        path: 'actionStats.playerId',
        model: 'playerData',
        select: 'knownName firstname lastname'
    }).exec(callback);
};

var getFanspickFixtureAggregate = function (criteria, callback) {
    var query = [];
    query.push({ $match: { fixtureId: new ObjectId(criteria.fixtureId), teamId: new ObjectId(criteria.teamId), isLive: criteria.isLive } },
        { $unwind: '$actionStats' },
        {
            $lookup:
            {
                localField: 'actionStats.playerId',
                foreignField: '_id',
                from: 'playerdatas',
                as: 'actionStats.playerId'
            }
        },
        { $unwind: '$actionStats.playerId' },
        {
            $project: {
                '_id': '$_id',
                'fixtureId': '$fixtureId',
                'isLive': '$isLive',
                'teamId': '$teamId',
                'lastUpdate': '$lastUpdate',
                'lineUpPlayers': '$lineUpPlayers',
                'formationId': '$formationId',
                'userActions': '$userActions',
                'actionStats.playerId._id': '$actionStats.playerId._id',
                'actionStats.playerId.knownName': '$actionStats.playerId.knownName',
                'actionStats.playerId.lastname': '$actionStats.playerId.lastname',
                'actionStats.playerId.firstname': '$actionStats.playerId.firstname',
                "actionStats.action": "$actionStats.action",
                "actionStats.minutes": "$actionStats.minutes",
                "actionStats.time": "$actionStats.time",
                "actionStats._id": "$actionStats._id"
            }
        },
        { $sort: { 'actionStats.minutes': 1, 'actionStats.action': -1 } },
        {
            $group: {
                _id: '$_id',
                'fixtureId': { $first: '$fixtureId' },
                'isLive': { $first: '$isLive' },
                'teamId': { $first: '$teamId' },
                'lastUpdate': { $first: '$lastUpdate' },
                'lineUpPlayers': { $first: '$lineUpPlayers' },
                'formationId': { $first: '$formationId' },
                'userActions': { $first: '$userActions' },
                'actionStats': { $push: '$actionStats' }
            }
        }
    );
    Models.fanspickFixture.aggregate(query, callback);
}

var getFanspickUserActionStat = function (fixtureCriteria, userActionCriteria, projection, callback) {

    var query = [{
        $project: projection
    },
    {
        $match: fixtureCriteria
    },
    {
        $unwind: '$userActions'
    },
    {
        $match: userActionCriteria
    },
    {
        $group: {
            _id: '$_id',
            userActions: {
                $addToSet: '$userActions'
            }
        }
    }
    ]


    // db.getCollection('fanspickfixtures').aggregate( 
    // {$project: {fixtureId:1, "userActions": 1}}, 
    // {$match:{fixtureId:ObjectId("596c535471f4e76ba53efcce")}}, 
    // {$unwind: '$userActions'}, 
    // {$match: {'userActions.current': true}}, 
    // {$group: {_id: '$_id',userActions: {$addToSet: '$userActions'}}} 
    // ) 
    Models.fanspickFixture.aggregate(query, callback);
};


var updateFanspickFixture = function (criteria, dataToSet, options, callback) {
    Models.fanspickFixture.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var getTeamsDetailsForCompetitionId = function (query, callback) {
    Models.Competition.aggregate(query).exec(function (err, result) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, result);
        }
    });
}

var getPlayersDetailForCompetitionId = function (query, callback) {
    Models.Teams.aggregate(query).exec(function (err, result) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, result);
        }
    })
}
var getPositionFromDB = function (criteria, callback) {
    Models.lkpAssociatePosition.find(criteria, callback);
}


// get all getAllFormations
var getAllFormations = function (criteria, projection, options, callback) {
    Models.formations.find(criteria, projection, options, callback);
}


var getFormationById = function (criteria, projection, options, callback) {
    var query = [
        { $match: { 'formationId': criteria.formationId } },
        {
            $lookup: {
                from: 'formations',
                localField: 'formationId',
                foreignField: '_id',
                as: 'formations'
            }
        },
        {
            $lookup: {
                from: 'lkppositions',
                localField: 'positionId',
                foreignField: '_id',
                as: 'positions'
            }
        }, { $unwind: '$formations' }
        , { $unwind: '$positions' },
        { $sort: { 'positions.Key': 1 } },
        {
            $group: {
                _id: '$formations._id',
                'formation': { $first: '$formations' },
                'positions': { $push: '$positions' }
            }
        }
    ];
    Models.formationPositionMapping.aggregate(query).exec(function (err, result) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, result);
        }
    });
}

var updateFixtureData = function (criteria, dataToSet, options, callback) {
    Models.Fixture.update(criteria, dataToSet, options, callback);
}

var getUserFixtureSorted = function (criteria, callback) {
    var query = [];
    query.push({ $match: { userId: criteria.userId, fixtureId: criteria.fixtureId, teamId: criteria.teamId, isLive: criteria.isLive } },
        { $unwind: '$lineUpPlayers' },
        {
            $lookup: {
                from: 'lkppositions',
                localField: 'lineUpPlayers.positionId',
                foreignField: '_id',
                as: 'lineUpPlayers.positionId'
            }
        },
        { $unwind: '$lineUpPlayers.positionId' },
        { $sort: { 'lineUpPlayers.positionId.Key': 1 } },
        {
            $group: {

                _id: '$_id',
                'formation': { $first: '$currentFormation' },
                'lineUpPlayers': { $push: '$lineUpPlayers' }
            }
        });
    Models.userFixture.aggregate(query).exec(callback);

}

var getManagerPickV2 = function (criteria, projection, options, callback) {
    Models.Fixture.find(criteria, projection).populate({
        path: 'localTeam.formation',
        model: 'formations'
    }).populate({
        path: 'localTeam.players.positionId',
        model: 'lkpPosition'
    }).populate({
        path: 'localTeam.players.playerId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    }).populate({
        path: 'visitorTeam.formation',
        model: 'formations'
    }).populate({
        path: 'visitorTeam.players.positionId',
        model: 'lkpPosition',
        // options : { sort : {'Key' : 1}}
    }).populate({
        path: 'visitorTeam.players.playerId',
        model: 'playerData',
        select: '_id knownName lastname firstname'
    })
        .populate({
            path: 'localTeam.livePlayers.positionId',
            model: 'lkpPosition'
        }).populate({
            path: 'visitorTeam.livePlayers.positionId',
            model: 'lkpPosition'
        }).populate({
            path: 'visitorTeam.livePlayers.playerId',
            model: 'playerData',
            select: '_id knownName lastname firstname'
        }).populate({
            path: 'localTeam.livePlayers.playerId',
            model: 'playerData',
            select: '_id knownName lastname firstname'
        }).exec(callback);
}

var getUserContacts = function (criteria, projection, options, callback) {
    Models.userContacts.find(criteria, projection, options, callback).populate({
        path: 'userId',
        model: 'fanspickUserSchema',
        select: '_id username photo'
    }).populate({
        path: 'contacts.userId',
        model: 'fanspickUserSchema',
        select: '_id username photo'
    });
}

var getRegisteredContacts = function (criteria, callback) {
    var query = [];
    query.push({ $match: { userId: criteria.userId } },
        {
            $unwind: '$contacts'
        },
        { $match: { 'contacts.groupId': { $ne: null } } },
        {
            $lookup : {
                localField : 'contacts.userId',
                foreignField : '_id',
                from : 'fanspickuserschemas',
                as : 'contacts.userId'
                }
            },
            {$unwind : '$contacts.userId'},
            {$project : {
                '_id' : '$_id',
                'userId' : '$userId',
                'groups' : '$groups',
                'contacts.groupId' : '$contacts.groupId',
                'contacts.name': '$contacts.name',
                'contacts.contactNo' : '$contacts.contactNo',
                'contacts.userId' : '$contacts.userId._id',
                'contacts.photo' : '$contacts.userId.photo',
                'contacts._id' : '$contacts._id',
                'contacts.isDeleted' : '$contacts.isDeleted',
                'contacts.status' : '$contacts.status'                
                }},
        {
            $group: {
                _id: '$_id',
                contacts: { $push: '$contacts' }
            }
        });
    Models.userContacts.aggregate(query, callback);
}

var getNonRegisteredContacts = function (criteria, callback) {
    var query = [];
    query.push({ $match: { userId: criteria.userId } },
        {
            $unwind: '$contacts'
        },
        { $match: { 'contacts.groupId': { $eq: null } } },
        {
            $group: {
                _id: '$_id',
                contacts: { $push: '$contacts' }
            }
        });
    Models.userContacts.aggregate(query, callback);
}

var getGroup = function (criteria, projection, options, callback) {
    Models.chatGroups.find(criteria, projection, options, callback);
}

var createChatGroup = function (dataToSave, callback) {
    new Models.chatGroups(dataToSave).save(callback);
}

var updateChatGroup = function (criteria, dataToUpdate, options, callback) {
    Models.chatGroups.findOneAndUpdate(criteria, dataToUpdate, options, callback);
}

var createUserContacts = function (dataToSave, callback) {
    new Models.userContacts(dataToSave).save(callback);
}
var updateUserContacts = function (criteria, dataToUpdate, options, callback) {
    Models.userContacts.findOneAndUpdate(criteria, dataToUpdate, options, callback);
}

var getGroupChat = function (criteria, projection, options, callback) {
    Models.chatHistory.find(criteria, projection, options, callback).populate({
        path: 'chats.sender',
        model: 'fanspickUserSchema',
        select: '_id username phoneNumber'
    });
}

var getGroupChatAggregated = function (criteria, groupType, callback) {
    var query = [];
    query.push({ $match: { groupId: new ObjectId(criteria.groupId) } },
        { $unwind: '$chats' },
        {
            $lookup: {
                localField: 'chats.sender',
                foreignField: '_id',
                from: 'fanspickuserschemas',
                as: 'chats.sender'
            }
        },
        { $unwind: '$chats.sender' },
        { $sort: { 'chats.time': 1 } });
    if (groupType == UniversalFunctions.CONFIG.APP_CONSTANTS.CHAT_GROUP_TYPE.ONE_TO_MANY) {
        query.push({ $match: { 'chats.time': { $gte: criteria.addedAt } } }); //filter message according to member's joining time
    }
    query.push({
        $project: {
            '_id': '$_id',
            'groupId': '$groupId',
            'chats._id': '$chats._id',
            'chats.time': '$chats.time',
            'chats.type': '$chats.type',
            'chats.message': '$chats.message',
            'chats.statusType': '$chats.statusType',
            'chats.sender._id': '$chats.sender._id',
            'chats.sender.username': '$chats.sender.username',
            'chats.sender.phoneNumber': '$chats.sender.phoneNumber',
            'chats.pending': '$chats.pending',
            'chats.deletedBy': '$chats.deletedBy',
            'chats.receivedBy': '$chats.receivedBy'
        }
    },
        {
            $lookup: {
                localField: 'groupId',
                foreignField: '_id',
                from: 'chatgroups',
                as: 'groupMembers'
            }
        },
        { $unwind: '$groupMembers' },
        {
            $group: {
                _id: '$_id',
                'groupId': { $first: '$groupId' },
                'chats': { $push: '$chats' },
                'reciever': { $first: '$groupMembers' }
            }
        });
    Models.chatHistory.aggregate(query, callback);
}

var getRecentGroupChat = function (userId, callback) {
    var query = [];
    /*    var query = [
            { $match: { groupMembers: { $elemMatch: { memberId: userId } } } },
            {
                $lookup: {
                    localField: '_id',
                    foreignField: 'groupId',
                    from: 'chathistories',
                    as: 'chats'
                }
            }
            ,
            { $unwind: '$chats' },
            { $unwind: '$chats.chats' },
            { $sort: { 'chats.chats.time': -1 } },
            
            {
                $project: {
                    _id: '$_id',
                    'lastActivatedTime': '$lastActivatedTime',
                    'isDeleted': '$isDeleted',
                    'type': '$type',
                    'groupMembers': '$groupMembers',
                    'chats': '$chats.chats'
                }
            },
            {
                $group: {
                    _id: '$_id',
                    'lastActivatedTime': { $first: '$lastActivatedTime' },
                    'isDeleted': { $first: '$isDeleted' },
                    'type': { $first: '$type' },
                    'groupMembers': { $first: '$groupMembers' },
                    'chats': { $first: '$chats' }
                }
            },
            { $unwind: '$groupMembers' },
            {
                $lookup: {
                    localField: 'groupMembers.memberId',
                    foreignField: '_id',
                    from: 'fanspickuserschemas',
                    as: 'groupMembers.memberId'
                }
            },
    
            { $unwind: '$groupMembers.memberId' },
            {
                $group: {
                    _id: '$_id',
                    'lastActivatedTime': { $first: '$lastActivatedTime' },
                    'isDeleted': { $first: '$isDeleted' },
                    'type': { $first: '$type' },
                    'groupMembers': { $addToSet: '$groupMembers' },
                    'chats': { $first: '$chats' }
                }
            },
            { $sort: { 'lastActivatedTime': -1 } }
    
        ];*/
    query.push(
        { $match: { groupMembers: { $elemMatch: { memberId: userId } } } },
        {
            $lookup: {
                localField: '_id',
                foreignField: 'groupId',
                from: 'chathistories',
                as: 'chats'
            }
        }
        ,
        { $unwind: '$chats' },
        { $unwind: '$chats.chats' },
        { $sort: { 'chats.chats.time': -1 } },
        {
            $match: { 'chats.chats.deletedBy': { $nin: [userId] } }
        },

        {
            $project: {
                _id: '$_id',
                'lastActivatedTime': '$lastActivatedTime',
                'isDeleted': '$isDeleted',
                'type': '$type',
                'name': '$name',
                'groupMembers': '$groupMembers',
                'chats': '$chats.chats'
            }
        },
        {
            $group: {
                _id: '$_id',
                'lastActivatedTime': { $first: '$lastActivatedTime' },
                'isDeleted': { $first: '$isDeleted' },
                'type': { $first: '$type' },
                'name': { $first: '$name' },
                'groupMembers': { $first: '$groupMembers' },
                'chats': { $first: '$chats' }
            }
        },
        { $unwind: '$groupMembers' },
        {
            $lookup: {
                localField: 'groupMembers.memberId',
                foreignField: '_id',
                from: 'fanspickuserschemas',
                as: 'groupMembers.memberId'
            }
        },

        { $unwind: '$groupMembers.memberId' },
        {
            $group: {
                _id: '$_id',
                'lastActivatedTime': { $first: '$lastActivatedTime' },
                'isDeleted': { $first: '$isDeleted' },
                'type': { $first: '$type' },
                'name': { $first: '$name' },
                'groupMembers': { $addToSet: '$groupMembers' },
                'chats': { $first: '$chats' }
            }
        },
        { $sort: { 'lastActivatedTime': -1 } }
    );
    Models.chatGroups.aggregate(query).exec(callback);
}

var generateOTP = function (dataToSave, callback) {
    new Models.otp(dataToSave).save(callback);
}

var getOTP = function (criteria, projection, options, callback) {
    Models.otp.find(criteria, projection, options, callback);
}

var updateOTP = function (criteria, dataToUpdate, options, callback) {
    Models.otp.findOneAndUpdate(criteria, dataToUpdate, options, callback);
}

var getAdditionalCountryData = function (criteria, projection, options, callback) {
    Models.additionalCountryData.find(criteria, projection, options, callback);
}

var updateAdditionalCountryData = function (criteria, dataToUpdate, options, callback) {
    Models.additionalCountryData.findOneAndUpdate(criteria, dataToUpdate, options, callback);
}

var createAdditionalCountryData = function (dataToSave, callback) {
    new Models.additionalCountryData(dataToSave).save(callback);
}

var updateTeamData = function (criteria, dataToSave, options, callback) {
    Models.Teams.findOneAndUpdate(criteria, dataToSave, options, callback);
}

var getCurrentMatchesInfo = function (competitionId, projection, options, callback) {
    var TimeGap = 100;
    var today = new Date();//(2017,3,15);
    var toDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), today.getUTCHours(), today.getUTCMinutes(), today.getUTCSeconds()));
    var endDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours(), today.getMinutes() + TimeGap, today.getSeconds()));;//(2017,3,16);

    Models.Fixture.aggregate([
        { $match: { competitionId: new ObjectId(competitionId) } },
        {
            $project: {
                'competitionName': '$competitionName',
                'fixtureDate': '$fixtureDate',
                'endFixtureDate': { $add: ['$fixtureDate', 6900000] },
                'visitorTeam.name': '$visitorTeam.name',
                'localTeam.name': '$localTeam.name',
                'homeTeamScore': '$homeTeamScore',
                'awayTeamScore': '$awayTeamScore',
                'competitionId': '$competitionId'

            }
        },
        {
            $match: {
                fixtureDate: { $lte: toDate }, endFixtureDate: { $gte: toDate }
            }
        }
    ]).exec(function (error, response) {
        if (error) {
            callback(error);
        } else {
            callback(null, { competitionId: competitionId.toString(), 'response': response });
        }
    });
}

var updateTeamShirtImageURL = function (arrayOfKnownName, callback) {
    Models.Teams.find({
        knownName: {
            $in: arrayOfKnownName
        }
    }).exec(function (error, doc) {
        if (error) return callback(error);
        doc.forEach(function (doc) {
            doc.teamShirtURL = doc.knownName;
            Models.Teams(doc).save();
        })
        callback();
    });
}
//Update chatHistory deletedBy field
var deleteAllChatsForGroup = function (criteria, callback) {
    Models.chatHistory.find({ groupId: criteria.groupId }, {}, {}).exec(function (error, doc) {
        if (error) {
            callback(error);
        } else {
            var updated = 0;
            doc.forEach(function (item) {
                item.chats.forEach(function (eachChat) {
                    var deletedBy = eachChat.deletedBy;
                    var index = deletedBy.map(function (el) {
                        return el.toString();
                    }).indexOf(criteria.userId.toString());
                    if (index < 0) {
                        deletedBy.push(criteria.userId);
                    }
                    eachChat.deletedBy = deletedBy;
                    updated++;
                    // console.log("length = "+doc[0].chats.length);
                    if (updated == doc[0].chats.length) {
                        item.save(callback);
                    }
                })

            })
        }
    })

}

var deleteSelectedChatsForGroup = function (criteria, callback) {
    Models.chatHistory.find({ groupId: criteria.groupId }).exec(function (error, doc) {
        if (error) {
            callback(error);
        } else {
            var updated = 0;
            doc.forEach(function (item) {
                item.chats.forEach(function (eachChat) {
                    var deletedBy = eachChat.deletedBy;
                    var index = deletedBy.map(function (el) {
                        return el.toString();
                    }).indexOf(criteria.userId.toString());
                    var indexForMessage = criteria.messageIds.indexOf(eachChat._id.toString())
                    if (index < 0 && indexForMessage > -1) {
                        deletedBy.push(criteria.userId);
                    }
                    eachChat.deletedBy = deletedBy;
                    updated++;
                    if (updated == doc[0].chats.length) {
                        item.save(callback);
                    }
                })

            })
        }
    })

}

var updateUserActionLog = function (criteria, dataToUpdate, options, callback) {
    Models.userActionsLogs.update(criteria, dataToUpdate, options, callback);
}

var updateChatHistory = function (criteria, dataToSave, options, callback) {
    Models.chatHistory.findOneAndUpdate(criteria, dataToSave, options, callback);
}

module.exports = {
    createUser: createUser,
    updateUser: updateUser,
    getUser: getUser,
    getUserTeams: getUserTeams,
    createEventLog: createEventLog,
    getCountryData: getCountryData,
    getCompetitions: getCompetitions,
    getTeamsOfLeague: getTeamsOfLeague,
    getChatHistory: getChatHistory,
    getTeamSquad: getTeamSquad,
    createUserPick: createUserPick,
    getUpcomingFixtures: getUpcomingFixtures,
    createUserFixture: createUserFixture,
    getUserFixture: getUserFixture,
    updateUserFixture: updateUserFixture,
    getAllTopicAsTopicdatas: getAllTopicAsTopicdatas,
    getPlayerData: getPlayerData,
    createUserAction: createUserAction,
    getTeamData: getTeamData,
    getNotification: getNotification,
    getSports: getSports,
    getSponsorBillboards: getSponsorBillboards,
    createFanspickFixture: createFanspickFixture,
    getFanspickFixture: getFanspickFixture,
    getFanspickUserActionStat: getFanspickUserActionStat,
    updateFanspickFixture: updateFanspickFixture,
    getUserActions: getUserActions,
    update: update,
    getTeamsDetailsForCompetitionId: getTeamsDetailsForCompetitionId,
    getPlayersDetailForCompetitionId: getPlayersDetailForCompetitionId,
    getLineUpsUserFixture: getLineUpsUserFixture,
    getUserFavTeams: getUserFavTeams,
    getStaticPositionStatus: getStaticPositionStatus,
    getPositionFromDB: getPositionFromDB,
    getUpcomingFixturesForLocalTeam: getUpcomingFixturesForLocalTeam,
    getUpcomingFixturesForVisitorTeam: getUpcomingFixturesForVisitorTeam,
    getUpcomingFixturesForBothTeams: getUpcomingFixturesForBothTeams,
    removeUserFixture: removeUserFixture,
    getFixtureById: getFixtureById,
    getUserForFavTeams: getUserForFavTeams,
    getUserpickPercentage: getUserpickPercentage,
    getAllFormations: getAllFormations,
    getFormationById: getFormationById,
    getFormation: getFormation,
    updateFixtureData: updateFixtureData,
    getManagerPick: getManagerPick,
    getUserFixtureSorted: getUserFixtureSorted,
    getManagerPickV2: getManagerPickV2,
    getUserContacts: getUserContacts,
    getGroup: getGroup,
    createChatGroup: createChatGroup,
    updateChatGroup: updateChatGroup,
    createUserContacts: createUserContacts,
    updateUserContacts: updateUserContacts,
    getRecentGroupChat: getRecentGroupChat,
    getGroupChat: getGroupChat,
    generateOTP: generateOTP,
    getOTP: getOTP,
    updateOTP: updateOTP,
    getAdditionalCountryData: getAdditionalCountryData,
    updateAdditionalCountryData: updateAdditionalCountryData,
    createAdditionalCountryData: createAdditionalCountryData,
    updateTeamData: updateTeamData,
    getPlayerDataWithStatistics: getPlayerDataWithStatistics,
    getCurrentMatchesInfo: getCurrentMatchesInfo,
    updateTeamShirtImageURL: updateTeamShirtImageURL,
    getFanspickAndManagersPickPercentage: getFanspickAndManagersPickPercentage,
    getUserpickAndManagersPickPercentage: getUserpickAndManagersPickPercentage,
    getTeamSubstitutes: getTeamSubstitutes,
    getTeamSquadAggregate: getTeamSquadAggregate,
    getUserpickVsFanspickPercentageLive: getUserpickVsFanspickPercentageLive,
    getUserpickVsManagerPickPercentageLive: getUserpickVsManagerPickPercentageLive,
    getFanspickVsManagerPickPercentageLive: getFanspickVsManagerPickPercentageLive,
    getManagerPickForStats: getManagerPickForStats,
    getRegisteredContacts: getRegisteredContacts,
    getNonRegisteredContacts: getNonRegisteredContacts,
    getGroupChatAggregated: getGroupChatAggregated,
    getFanspickFixtureAggregate: getFanspickFixtureAggregate,
    deleteAllChatsForGroup: deleteAllChatsForGroup,
    deleteSelectedChatsForGroup: deleteSelectedChatsForGroup,
    updateUserActionLog: updateUserActionLog,
    getAllCommunity: getAllCommunity,
    getMyCommunity: getMyCommunity,
    updateChatHistory: updateChatHistory
}