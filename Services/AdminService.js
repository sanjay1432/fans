'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var async = require('async');
var Models = require('../Models');
var _ = require('underscore');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var ObjectId = require('mongoose').Types.ObjectId;
//Get Users from DB
var getAdmin = function (criteria, projection, options, callback) {
    Models.Admins.find(criteria, projection, options, callback);
};


//Insert User in DB
var createAdmin = function (objToSave, callback) {
    new Models.Admins(objToSave).save(callback)
};

//Update User in DB
var updateAdmin = function (criteria, dataToSet, options, callback) {
    Models.Admins.findOneAndUpdate(criteria, dataToSet, options, callback);
};






/*========================================================================
Community
=========================================================================*/

//Insert User in DB
var createCommunity = function (objToSave, callback) {
    new Models.community(objToSave).save(callback)
};


//Get Users from DB
var getCommunity = function (criteria, projection, options, callback) {
    Models.community.find(criteria, projection, options, callback);
};

//Get Users from DB
var getCommunityPopulate = function (criteria, projection, options, populateModel, callback) {
    // Models.community.find(criteria, projection, options).populate(populateModel).sort({
    //     createdDate: -1
    // }).exec(function (err, docs) {
    //     if (err) {
    //         return callback(err, docs);
    //     } else {
    //         callback(null, docs);
    //     }
    // });
    var query = [];
    query.push(
        { $match: { TeamID: criteria.TeamID } },
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
       { $unwind: {"path": "$topics.fixturedata",
            "preserveNullAndEmptyArrays": true }},
            
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

//Insert User in DB
var createTopic = function (objToSave, callback) {

    Models.topic.findOneAndUpdate({
        fixtureID: objToSave.fixtureID,
        communityID: objToSave.communityID
    }, objToSave, {
        upsert: true,
        new: true
    }, callback);

    //new Models.topic(objToSave).save(callback)
    // fixtureID
    // communityID
};


//Get Users from DB
var getTopicHotUpdate = function (criteria, projection, options, callback) {
    var finalDoc = {}
    async.series([
        function (cb) {
            Models.topic.update({}, {
                "$set": {
                    hot: false
                }
            }, {
                multi: true
            }, function (err, data) {
                console.log(err, data)
            })
            cb()
        },
        function (cb) {
            Models.topic.update({
                isPinned: true
            }, {
                "$set": {
                    hot: true
                }
            }, {
                multi: true
            }, function (err, data) {
                console.log(err, data)
            })
            cb()
        },
        function (cb) {
            var err = 0
            Models.topic.aggregate([{
                    $unwind: "$posts"
                },
                {
                    $group: {
                        _id: "$_id",
                        len: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        len: -1
                    }
                },
                {
                    $limit: 2
                }
            ], function (err, data) {
                _.each(data, function (arrObj) {
                    Models.topic.findOneAndUpdate({
                        _id: arrObj._id
                    }, {
                        "$set": {
                            hot: true
                        }
                    }, {
                        lean: true
                    }, function (err, data) {
                        if (err) {
                            err++
                        }
                    });
                })
            })
            if (err.length == 0) {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_ID)
            } else {
                cb()
            }
        }
    ], function (err, data) {
        if (err) return callback(err);
        callback(null);
    });

};

//Get Users from DB
var getTopicPopulate = function (criteria, projection, options, populateModel, callback) {
    var finalDoc = {}
    async.series([
        function (cb) {
            if ('hot' in criteria) {
                if (criteria.hot == false) {
                    delete criteria["hot"];
                    delete criteria.hot;
                }
            }
            Models.topic.find(criteria, projection, {
                    lean: true
                }).populate({
                    path: 'communityId',
                    select: 'name'
                }).populate({
                    path: 'communityPosts.userId',
                    select: 'emailId firstName lastName username gender deviceType'
                }).populate({
                    path: 'fanspickPosts.userId',
                    select: 'emailId firstName lastName username gender deviceType'
                }).populate({
                    path: 'fixtureId',
                    select: 'fixtureDate'
                }).sort({
                    _id: -1
                }).exec(function (err, docs) {
                    if (err) return cb(err, docs);
                    else if (docs.length == 0) return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NO_COMMENT_FOUND);
                    else {
                        finalDoc = docs;
                        cb(null, docs);
                    }
                    // Models.fanspickUser.populate(docs[0].communityPosts, {
                    //     path: 'userId'
                    //     , select: 'emailId firstName lastName username gender deviceType'
                    // }, function (err, things) {
                    //     if (err) return cb(err, docs);
                    //     finalDoc = docs
                    //     cb(null, docs);
                    // });
                });

        }
    ], function (err, data) {
        if (err) return callback(err, finalDoc);
        callback(null, finalDoc);
    });

};

//Get Users from DB
var getTopic = function (criteria, projection, options, callback) {
    Models.topic.find(criteria, projection, options, callback);

};

//Update Community
var updateCommunity = function (criteria, dataToSet, options, callback) {
    Models.community.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var getUserDiscussionCount = function (query, callback) {
    Models.topic.aggregate(query, callback);
}

































/////////////////////////////////////////////////////////////SPORT INFO////////////////////////////


//Get Sport from DB
var getSportDataSimple = function (criteria, projection, options, callback) {
    Models.sportVersion.find(criteria, projection, options, callback);
};

//Get Sport from DB
var getSportData = function (criteria, projection, options, populateModel, callback) {

    Models.sportVersion.find(criteria, projection, options).populate(populateModel).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        } else {
            callback(null, docs);
        }
    });
};


var getSeasonData = function (criteria, projection, options, populateModel, callback) {

    Models.Season.find(criteria, projection, options).populate(populateModel).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        } else {
            callback(null, docs);
        }
    });
};

var getAllTeamsOfLeague = function (criteria, projection, options, populateModel, callback) {

    Models.League.find(criteria, projection, options).populate(populateModel).exec(function (err, docs) {
        if (err) {
            return callback(err, docs);
        } else {
            callback(null, docs);
        }
    });
};


//Get Teams from DB
var getTeamData = function (criteria, projection, options, callback) {
    Models.Teams.find(criteria, projection, options, callback);
};


var updateTeamdata = function (criteria, dataToSet, options, callback) {
    ////////////////////
    //////////////Updating only hashtags///////////////////////////
    ////////////////////////
    Models.Teams.findOneAndUpdate(criteria, dataToSet, options, callback);
};

var createNotification = function (objToSave, callback) {
    new Models.notification(objToSave).save(callback)
};

// Sponsor Billboard 

var createSponsorBillboard = function (objToSave, callback) {
    new Models.sponsorBillboard(objToSave).save(callback)
};

// twitter/facebook hashTags 

var addHashtags = function (criteria, newDataToUpdate, callback) {
    Models.Teams.update(criteria, {
        $set: newDataToUpdate
    }, {
        upsert: true
    }, callback);
};


module.exports = {
    getAdmin: getAdmin,
    createAdmin: createAdmin,
    updateAdmin: updateAdmin,
    createCommunity: createCommunity,
    getCommunityPopulate: getCommunityPopulate,
    createTopic: createTopic,
    getCommunity: getCommunity,
    getTopicPopulate: getTopicPopulate,
    updateCommunity: updateCommunity,
    getSportData: getSportData,
    getSportDataSimple: getSportDataSimple,
    getSeasonData: getSeasonData,
    getAllTeamsOfLeague: getAllTeamsOfLeague,
    getTeamData: getTeamData,
    updateTeamdata: updateTeamdata,
    getTopicHotUpdate: getTopicHotUpdate,
    getTopic: getTopic,
    createNotification: createNotification,
    createSponsorBillboard: createSponsorBillboard,
    addHashtags: addHashtags,
    getUserDiscussionCount: getUserDiscussionCount
};