'use strict';

var Service = require('../Services');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var async = require('async');

var UploadManager = require('../Lib/UploadManager');
var TokenManager = require('../Lib/TokenManager');
var NotificationManager = require('../Lib/NotificationManager');
var config = require('../Config');


/*var resetPassword = function (email, callback) {
    var generatedPassword = UniversalFunctions.generateRandomString();
    var customerObj = null;
    if (!email) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    } else {
        async.series([
            function (cb) {
                //Get User
                var criteria = {
                    email: email
                };
                var setQuery = {
                    firstTimeLogin: true,
                    password: UniversalFunctions.CryptData(generatedPassword)
                };
                Service.CustomerService.updateCustomer(criteria, setQuery, {new: true}, function (err, userData) {
                    console.log('update customer', err, userData)
                    if (err) {
                        cb(err)
                    } else {
                        if (!userData || userData.length == 0) {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND);
                        } else {
                            customerObj = userData;
                            cb()
                        }
                    }
                })
            },
            function (cb) {
                if (customerObj) {
                    var variableDetails = {
                        user_name: customerObj.name,
                        password_to_login: generatedPassword
                    };
                    NotificationManager.sendEmailToUser(variableDetails, customerObj.email, cb)
                } else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                }
            }
        ], function (err, result) {
            callback(err, {generatedPassword: generatedPassword}); //TODO Change in production DO NOT Expose the password
        })
    }
};*/

var adminLogin = function (userData, callback) {

    var tokenToSend = null;
    var responseToSend = {};
    var tokenData = null;

    async.series([
        function (cb) {
            var getCriteria = {
                email: userData.email,
                password: UniversalFunctions.CryptData(userData.password)
            };
            Service.AdminService.getAdmin(getCriteria, {}, {}, function (err, data) {
                if (err) {
                    cb({ errorMessage: 'DB Error: ' + err })
                } else {
                    if (data && data.length > 0 && data[0].email) {
                        tokenData = {
                            id: data[0]._id,
                            username: data[0].username,
                            type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN
                        };
                        cb()
                    } else {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_USER_PASS)
                    }
                }
            });
        }, function (cb) {
            var setCriteria = {
                email: userData.email
            };
            var setQuery = {
                $push: {
                    loginAttempts: {
                        validAttempt: (tokenData != null),
                        ipAddress: userData.ipAddress
                    }
                }
            };
            Service.AdminService.updateAdmin(setCriteria, setQuery, function (err, data) {
                cb(err, data);
            });
        }, function (cb) {
            if (tokenData && tokenData.id) {
                TokenManager.setToken(tokenData, function (err, output) {
                    if (err) {
                        cb(err);
                    } else {
                        tokenToSend = output && output.accessToken || null;
                        cb();
                    }
                });

            } else {
                cb()
            }

        }], function (err, data) {
            console.log('sending response')
            responseToSend = { access_token: tokenToSend, ipAddress: userData.ipAddress };
            if (err) {
                callback(err);
            } else {
                callback(null, responseToSend)
            }

        });


};

var adminLogout = function (token, callback) {
    TokenManager.expireToken(token, function (err, data) {
        if (!err && data) {
            callback(null, UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT);
        } else {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TOKEN_ALREADY_EXPIRED)
        }
    })
};



var getAllCommunity = function (userAuthData, payloadData, callback) {

    var populateVariable = {
        path: "topics",
        select: 'name'
    };

    var options = { lean: true },
        projection = { modifiedDate: 0, createdDate: 0, isActive: 0, isLocked: 0, isDeleted: 0 };

    Service.AdminService.getCommunityPopulate({}, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};

var createCommunity = function (userAuthData, payloadData, callback) {

    var dataToSave = payloadData;
    var sportData = {}
    var teamData = {}
    async.series([
        function (cb) {

            var options = { lean: true },
                projection = {};

            Service.AdminService.getSportDataSimple({ _id: dataToSave.SportID }, projection, options, function (err, res) {
                if (err) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SPORT_NOT_FOUND)
                } else {
                    if (res.length == 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SPORT_NOT_FOUND)

                    }
                    else {
                        sportData = res[0];
                        cb();
                    }

                }
            });
        },
        function (cb) {

            var options = { lean: true },
                projection = {};
            var criteria = {
                _id: dataToSave.TeamID
            };
            Service.AdminService.getTeamData(criteria, projection, options, function (err, res) {
                if (err) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.LEAGUE_OR_TEAM_NOT_FOUND)
                } else {
                    if (res.length == 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.LEAGUE_OR_TEAM_NOT_FOUND)
                    }
                    else {
                        teamData = res[0];
                        cb();
                    }

                }
            });
        },
        function (cb) {
            //Insert Into DB
            var finalDataToSave = {};
            finalDataToSave.createdDate = new Date().toISOString();
            finalDataToSave.Name = dataToSave.Name;
            finalDataToSave.Description = dataToSave.Description;
            finalDataToSave.SportID = sportData._id;
            //finalDataToSave.LeagueID = teamData._id;
            finalDataToSave.TeamID = teamData._id;
            finalDataToSave.Location = dataToSave.Location;
            finalDataToSave.AgeRange = dataToSave.AgeRange;
            finalDataToSave.Admin = dataToSave.Admin;
            finalDataToSave.Moderators = dataToSave.Moderators;

            Service.AdminService.createCommunity(finalDataToSave, function (err, communityDataFromDB) {
                if (err) {
                    if (err.code == 11000 && err.message.indexOf('Name_1') > -1) {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.COMMUNITY_ALREADY_EXIST);
                    }
                    else {
                        callback(err)
                    }
                } else {
                    callback(null, communityDataFromDB);
                }
            })
        },
        function (cb) {

        }
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
};


var getAllCommunity = function (userAuthData, payloadData, callback) {


    var populateVariable = {
        path: "topics",
        select: 'name'
    };

    var options = { lean: true },
        projection = { modifiedDate: 0, createdDate: 0, isActive: 0, isLocked: 0, isDeleted: 0 };

    Service.AdminService.getCommunityPopulate({}, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};



var getAllTopic = function (userAuthData, payloadData, callback) {

    var query = {
        communityID: payloadData.communityID
    }
    var populateVariable = {
        path: "communityID",
        select: 'Name'
    };

    var options = { lean: true },
        projection = { modifiedDate: 0, isPinned: 0, isDeleted: 0, isLocked: 0 };

    Service.AdminService.getTopicPopulate(query, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};


var getTopicData = function (userAuthData, payloadData, callback) {

    var query = {
        _id: payloadData.topicId
    }
    var populateVariable = {
        path: "communityID",
        select: 'Name'
    };

    var options = { lean: true },
        projection = { modifiedDate: 0, isPinned: 0, isDeleted: 0, isLocked: 0 };

    Service.AdminService.getTopicPopulate(query, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};



var getCommunityData = function (userAuthData, payloadData, callback) {

    var query = {
        _id: payloadData.communityId
    }
    var populateVariable = {
        path: "topics",
        select: 'name'
    };

    var options = { lean: true },
        projection = { isDeleted: 0, isPinned: 0, isLocked: 0, modifiedDate: 0 };

    Service.AdminService.getCommunityPopulate(query, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};

var createTopic = function (userAuthData, payloadData, callback) {
    var communityData = {}
    var dataToSave = payloadData;
    var topicData = {}
    async.series([
        function (cb) {
            var criteria = {
                _id: payloadData.communityID
            };
            var projection = {};
            var option = {
                lean: true
            };
            Service.AdminService.getCommunity(criteria, projection, option, function (err, result) {
                if (err) return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.COMMUNITY_NOT_FOUND);
                if (result.length == 0) return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.COMMUNITY_NOT_FOUND);
                communityData = result && result[0] || null;
                return cb();
            });
        },
        function (cb) {
            //Insert Into DB
            var finalDataToSave = {};

            finalDataToSave.createdDate = new Date().toISOString();
            finalDataToSave.name = dataToSave.name;
            finalDataToSave.fixtureID = dataToSave.fixtureID;
            finalDataToSave.isPinned = dataToSave.isPinned;
            finalDataToSave.isLocked = dataToSave.isLocked;
            finalDataToSave.isDeleted = dataToSave.isDeleted;
            finalDataToSave.topicTages = dataToSave.topicTages;
            finalDataToSave.communityID = communityData._id;


            Service.AdminService.createTopic(finalDataToSave, function (err, topicDataFromDB) {
                if (err) {
                    if (err.code == 11000 && err.message.indexOf('name_1') > -1) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TOPIC_ALREADY_EXIST);
                    }
                    else {
                        cb(err)
                    }
                } else {
                    topicData = topicDataFromDB;
                    cb(null, topicDataFromDB);
                }
            })
        },
        function (cb) {
            //Update DB
            var query = {
                _id: communityData._id
            }
            var options = { lean: true };
            var dataToSet = {
                $addToSet: {
                    topics: topicData._id
                }
            }

            Service.AdminService.updateCommunity(query, dataToSet, options, function (err, topicDataFromDB) {
                if (err) {
                    cb(err)
                } else {
                    cb(null);
                }
            })
        }
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
}

























///////////////////////////SPORT CONTROLLERS /////////////////////////////////////////////////////////////////



var getSportData = function (userAuthData, payloadData, callback) {

    var populateVariable = [{
        path: "oldVersion"
    }, {
        path: "seasons"
    }];

    var options = { lean: true },
        projection = {};

    Service.AdminService.getSportData({}, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};


/* var getSeasonData = function (userAuthData, payloadData, callback) {

    var populateVariable = {
            path: "leagueId",
            select: 'leagueName leagueId'
        };

    var options = {lean: true},
        projection ={},
        query = {
                _id: payloadData.seasonId
            };

    Service.AdminService.getSeasonData(query, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null,res);
        }
    });
}; */

var getCountryList = function (userAuthData, payloadData, callback) {

    var populateVariable = {
    };

    var options = { lean: true },
        projection = {},
        query = {

        };

    Service.AdminService.getSeasonData(query, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};




var getAllTeamsOfLeague = function (userAuthData, payloadData, callback) {

    var populateVariable = {
        path: "teamId"
    };

    var options = { lean: true },
        projection = {},
        query = {
            _id: payloadData.leagueId
        };

    Service.AdminService.getAllTeamsOfLeague(query, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};


var getTeamData = function (userAuthData, payloadData, callback) {

    var options = { lean: true },
        projection = {},
        query = {
            _id: payloadData.id
        };

    Service.AdminService.getTeamData(query, projection, options, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};


var setTags = function (userAuthData, payloadData, callback) {
    var oldTagLength = 0;
    async.series([

        function (cb) {
            var options = { lean: true },
                projection = { hashtags: 1 },
                query = {
                    _id: payloadData.id
                };
            Service.AdminService.getTeamData(query, projection, options, function (err, tagResult) {
                if (err) { cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND) }
                if (tagResult[0].hashtags) {
                    oldTagLength = tagResult[0].hashtags.length
                    if (oldTagLength > 4) { return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TAGS_LENGTH_EXCEEDED) }
                    //if (oldTagLength > 5) { return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TAGS_LENGTH_EXCEEDED) }
                    else { cb() }
                }
                else {
                    cb()
                }
            });
        },
        function (cb) {
            //var datatoSet = { $push: { hashtags: { $each: payloadData.hashTags } } }
            var datatoSet = { $push: { hashtags: payloadData.hashTags } }

            var criteria = { _id: payloadData.id }
            var options = { lean: true }


            Service.AdminService.updateTeamdata(criteria, datatoSet, options, function (err, tagResult) {
                if (err) {
                    cb(err)
                } else {
                    cb()
                }
            });
        }], function (err, result) {
            if (err) {
                return callback(err)
            }
            else {
                callback(null)
            }
        });
};



var deleteTags = function (userAuthData, payloadData, callback) {
    var operatorObj = null, tags;
    var LastResult = {}
    if (!payloadData) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    } else {
        async.series([
            function (cb) {
                var options = { lean: true },
                    projection = { hashtags: 1 },
                    query = {
                        _id: payloadData.id
                    };
                Service.AdminService.getTeamData(query, projection, options, function (err, tagResult) {
                    if (err) {
                        cb(err)
                    } else {
                        if (!tagResult || tagResult[0].hashtags == 0) {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                        } else {
                            operatorObj = tagResult && tagResult[0] || null;
                            if (typeof operatorObj.hashtags[payloadData.tagIndex] === 'undefined') {
                                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                            }
                            else {
                                operatorObj.hashtags.splice(payloadData.tagIndex, 1);
                                cb()
                            }

                        }
                    }
                })
            },
            function (cb) {
                if (operatorObj) {
                    var criteria = {
                        _id: payloadData.id
                    };
                    var setQuery = {
                        "$set": { "hashtags": operatorObj.hashtags }
                    };
                    Service.AdminService.updateTeamdata(criteria, setQuery, { new: true }, function (err, tagResult) {
                        if (err) {
                            cb(err)
                        } else {
                            LastResult = tagResult.hashtags
                            cb()
                        }
                    })
                } else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                }
            }
        ], function (err, result) {
            callback(err, LastResult);
        })
    }
};

var updateTeamShirt = function (userAuthData, payloadData, callback) {
    var dataToSave = payloadData;
    var teamData = {};
    var teamDataAfterUpdate = {};

    async.series([
        /* function (cb) {
             var criteria = {
                 _id: payloadData.teamId
             };
             var projection = {};
             var option = {
                 lean: true
             };
             Service.AdminService.getTeamData(criteria, projection, option, function (err, result) {
                 if (err) return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.LEAGUE_OR_TEAM_NOT_FOUND);
                 if(result.length==0) return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.LEAGUE_OR_TEAM_NOT_FOUND);
                 teamData = result && result[0] || null;
                 return cb();
             });
         }, */
        function (cb) {
            //Insert Into DB
            var criteria = {
                _id: payloadData.teamId
            };

            var dataToSet = {
                teamShirtImage: payloadData.shirtImage
            };

            var options = {};

            Service.AdminService.updateTeamdata(criteria, dataToSet, options, function (err, teamDataAfterUpdate) {
                if (err) {
                    cb(err)
                } else {
                    cb(null, teamDataAfterUpdate);
                }
            })
        }
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
}

var createNotification = function (userAuthData, payloadData, callback) {
    var dataToSave = payloadData;

    var savedNotification = {};

    async.series([
        function (cb) {
            //Insert Into DB

            var finalDataToSave = {};
            finalDataToSave.createdDate = new Date().toISOString();
            finalDataToSave.notificationType = payloadData.notificationType;
            finalDataToSave.notificationTitle = payloadData.notificationTitle;
            finalDataToSave.notificationMessage = payloadData.notificationMessage;
            finalDataToSave.triggerAgeCheck = payloadData.triggerAgeCheck;
            finalDataToSave.notificationIcon = payloadData.notificationIcon;
            finalDataToSave.bannerImage = payloadData.notificationBanner;
            finalDataToSave.bannerUrl = payloadData.bannerUrl;

            if(payloadData.expiryDate !== undefined)
            {
                 finalDataToSave.expiryDate = payloadData.expiryDate;
            }
            else
            {
                var expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 14);

                finalDataToSave.scheduledDate = new Date().toISOString();
            }

            if(payloadData.scheduledDate !== undefined)
            {
                finalDataToSave.scheduledDate = payloadData.scheduledDate;
            }
            else
            {
                finalDataToSave.expiryDate = expiryDate.toISOString();
            }


            finalDataToSave.sent = "false";


            var question = {};
            question.playerId = null;
            question.createdDate = new Date();
            question.questionType = "Simple";
            question.question = "Will you be enjoying a Heineken at half time?";
            question.PossibleResponses = ["Yes", "No"];

            var questionnaire = {};
            questionnaire = { "questions": [question] };

            finalDataToSave.questionnaires = [questionnaire];



            Service.AdminService.createNotification(finalDataToSave, function (err, savedNotification) {
                if (err) {
                    cb(err)
                } else {
                    cb(null, savedNotification);
                }
            })
        }
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
}

// Sponsor Billboard
var createSponsorBillBoard = function(payloadData, callback){
    if(payloadData.targetType == config.APP_CONSTANTS.DATABASE.sponsorBillboardTargetType.fixture){
        payloadData.fixtureId = payloadData.targetId;
    }else if(payloadData.targetType == config.APP_CONSTANTS.DATABASE.sponsorBillboardTargetType.country){
         payloadData.countryId = payloadData.targetId;
    }else if(payloadData.targetType == config.APP_CONSTANTS.DATABASE.sponsorBillboardTargetType.competition){
         payloadData.competitionId = payloadData.targetId;
    }
    Service.AdminService.createSponsorBillboard(payloadData , function(error,result){
        if(error){
            callback(error);
        } else {
            callback(null,result);
        }
    } );
}

//hashtags for facebook/twitter
var updateTeamWithHashTags = function(payloadData, callback){
    var criteria = {
        fullName : payloadData.fullName
    }
    var newDataToUpdate = {};
     if(payloadData.twitterHashTags != undefined && payloadData.twitterHashTags.length > 0){
        newDataToUpdate['twitterHastag.hashtag'] = payloadData.twitterHashTags;
    } 
    if((payloadData.facebookHashTags != undefined) && (payloadData.facebookHashTags.length > 0)){
       newDataToUpdate['facebookTerm.term'] = payloadData.facebookHashTags;
    } 
    Service.AdminService.addHashtags(criteria , newDataToUpdate, function(error,result){
        if(error){
            callback(error);
        } else {
            callback(null,result);
        }
    } );
}


module.exports = {
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    createCommunity: createCommunity,
    getAllCommunity: getAllCommunity,
    createTopic: createTopic,
    getAllTopic: getAllTopic,
    getTopicData: getTopicData,
    getCommunityData: getCommunityData,
    getSportData: getSportData,
    getAllTeamsOfLeague: getAllTeamsOfLeague,
    getTeamData: getTeamData,
    setTags: setTags,
    deleteTags: deleteTags,
    updateTeamShirt: updateTeamShirt,
    createNotification: createNotification,
    createSponsorBillBoard : createSponsorBillBoard,
    updateTeamWithHashTags : updateTeamWithHashTags
};