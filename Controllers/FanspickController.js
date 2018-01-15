var Service = require('../Services');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var async = require('async');

var UploadManager = require('../Lib/UploadManager');
var TokenManager = require('../Lib/TokenManager');
var NotificationManager = require('../Lib/NotificationManager');
var CodeGenerator = require('../Lib/CodeGenerator');
var DAO = require('../DAO/DAO');
var Models = require('../Models');

var paypal = require('paypal-rest-sdk');
var moment = require('moment');
var _ = require('underscore');
var Config = require('../Config');
var ObjectId = require('mongoose').Types.ObjectId;
var sortManager = require('../Lib/sortManager');
var socketManager = require('../Lib/SocketManager');
var fsExtra = require('fs-extra');
var multiparty = require('multiparty');
var Path = require('path');

var multer = require('multer');

var ftp = require('ftp');

var createUser = function (payloadData, callback) {

    var Filter = require('bad-words'),
        filter = new Filter();

    console.log(payloadData, filter.clean(payloadData.username)); //Don't be an ******


    var accessToken = null;
    var userRegData = {};
    var uniqueCode = null;
    var dataToSave = payloadData;
    if (dataToSave.password)
        dataToSave.password = UniversalFunctions.CryptData(dataToSave.password);
    dataToSave.firstTimeLogin = false;
    var dataToUpdate = {};
    var updatedDonorData = {};

    dataToSave.emailId = dataToSave.emailId.toLowerCase();
    async.series([
        function (cb) {
            //verify email 
            if (!UniversalFunctions.verifyEmailFormat(dataToSave.emailId)) {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL);
            } else {
                cb();
            }
        },
        /*
                // check email exists
                function (cb) {
                    UniversalFunctions.checkEmailExists(dataToSave.emailId, function (result) {
                        if (result) {
                            cb();
                        } else {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_EMAIL);
                        }
                    })
                },*/
        //check username exists 
        function (cb) {
            var regexValue = new RegExp(payloadData.username, 'i');
            var criteria = {
                username: regexValue
            }
            var projection = {},
                options = {
                    lean: true
                };
            Service.FanspickService.getUser(criteria, projection, options, function (error, result) {
                if (error) {
                    cb(error);
                } else if (result.length > 0) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERNAME_EXIST);
                } else {
                    cb();
                }
            })
        },
        function (cb) {
            //Validate for facebookId and password
            if (typeof payloadData.facebookId != 'undefined' && payloadData.facebookId) {
                if (payloadData.password) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FACEBOOK_ID_PASSWORD_ERROR);
                } else if (typeof payloadData.googleId != 'undefined' && payloadData.googleId) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TYPE_ALL_ERROR);
                } else {
                    cb();
                }
            } else if (typeof payloadData.googleId != 'undefined' && payloadData.googleId) {
                if (payloadData.password) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.GOOGLE_ID_PASSWORD_ERROR);
                } else if (typeof payloadData.facebookId != 'undefined' && payloadData.facebookId) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TYPE_ALL_ERROR);
                } else {
                    cb();
                }
            } else if (!payloadData.password) {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PASSWORD_REQUIRED);
            } else {
                cb();
            }
        },
        function (cb) {
            var criteria = {
                deviceToken: dataToSave.deviceToken,
                active: true
            };
            Service.FanspickService.update(criteria, {
                $set: {
                    active: false
                }
            }, {
                    multi: true
                }, function (err, result) {
                    if (err) return cb(err);
                    cb();
                });
        },


        /* function (cb) {
            //Validate for facebookId and password
            if (typeof dataToSave.googleId != 'undefined' && dataToSave.googleId) {
                if (dataToSave.password) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.GOOGLE_ID_PASSWORD_ERROR);
                } else {
                    cb();
                }
            } else if (!dataToSave.password) {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PASSWORD_REQUIRED);
            } else {
                cb();
            }
        }, */
        function (cb) {
            //Insert Into DB
            var finalDataToSave = {};
            finalDataToSave.fcmId = dataToSave.fcmId;
            finalDataToSave.createdOn = new Date().toISOString();
            finalDataToSave.loggedInOn = new Date().toISOString();
            finalDataToSave.emailId = dataToSave.emailId;
            finalDataToSave.firstname = dataToSave.firstname;
            finalDataToSave.lastname = dataToSave.lastname;
            finalDataToSave.lat = dataToSave.lat;
            finalDataToSave.long = dataToSave.lon;
            finalDataToSave.username = dataToSave.username;

            if (dataToSave.dob) {
                finalDataToSave.dob = convertStringToDate(dataToSave.dob);
            }
            finalDataToSave.gender = dataToSave.gender;
            finalDataToSave.deviceType = dataToSave.deviceType;
            finalDataToSave.deviceToken = dataToSave.deviceToken;
            finalDataToSave.appVersion = dataToSave.appVersion;
            finalDataToSave.city = dataToSave.city;
            finalDataToSave.zipcode = dataToSave.zipcode;
            finalDataToSave.active = true; //user logged in
            if (typeof dataToSave.facebookId != 'undefined' && dataToSave.facebookId) {
                finalDataToSave.facebookId = dataToSave.facebookId;
                finalDataToSave.loginType = UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.FACEBOOK;
            } else if (typeof dataToSave.googleId != 'undefined' && dataToSave.googleId) {
                finalDataToSave.googleId = dataToSave.googleId;
                finalDataToSave.loginType = UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.GOOGLE;
            } else {
                finalDataToSave.passwordHash = dataToSave.password;
                finalDataToSave.loginType = UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.SIMPLE;
            }
            Service.FanspickService.createUser(finalDataToSave, function (err, userDataFromDB) {
                if (err) {
                    if (err.code == 11000 && err.message.indexOf('emailId_1') > -1) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_ALREADY_EXIST);
                    } else if (err.code == 11000 && err.message.indexOf('facebookId_1') > -1) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FACEBOOK_ID_EXIST);
                    } else if (err.code == 11000 && err.message.indexOf('username_1') > -1) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERNAME_EXIST);
                    }
                    cb(err)
                } else {
                    userRegData = userDataFromDB;
                    cb();
                }
            })
        },
        function (cb) {
            if (userRegData) {
                var tokenData = {
                    id: userRegData._id,
                    type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.FANSPICK
                };
                TokenManager.setToken(tokenData, function (err, output) {
                    if (err) {
                        cb(err);
                    } else {
                        accessToken = output && output.accessToken || null;
                        cb();
                    }
                });
            } else {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
            }
        }
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                accessToken: accessToken,
                userDetails: UniversalFunctions.deleteUnnecessaryUserData(userRegData)
            });
        }
    });
};




var loginViaAccessToken = function (payloadData, userData, callback) {
    if (!userData || !userData.id) {
        return callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }

    var userDataArray = {};
    async.series([
        function (cb) {
            var criteria = {
                _id: userData.id
            };
            var dataToSet = {
                deviceToken: payloadData.deviceToken,
                deviceType: payloadData.deviceType
            };

            Service.FanspickService.updateUser(criteria, dataToSet, {
                lean: true
            }, function (err, userData) {
                if (err) {
                    return cb(err);
                }
                userDataArray = userData;
                cb();

            });
        }
    ], function (err) {
        if (err) return callback(err);
        return callback(null, {
            userDetails: UniversalFunctions.deleteUnnecessaryUserData(userDataArray)
        });
    });
};



var viewProfile = function (userData, callback) {
    var criteria = {
        _id: userData._id
    };
    var projection = {
        accessToken: 0,
        passwordChangesOn: 0,
        profileComplete: 0,
        rejection: 0
    };
    var option = {
        lean: true
    };
    Service.FanspickService.getUserTeams(criteria, projection, option, function (err, result) {
        if (err) return callback(err)
        if (result.length > 0 && result[0].dob != undefined) {
            result[0].dob = convertDateToString(result[0].dob);
        }
        callback(null, UniversalFunctions.deleteUnnecessaryUserData(result))
    });
};


var loginUser = function (payloadData, callback) {
    var userFound = false;
    var accessToken = null;
    var successLogin = false;
    var updatedUserDetails = null;
    payloadData.email = payloadData.email.toLowerCase();
    async.series([
        function (cb) {
            //Validate for facebookId and password
            if (typeof payloadData.facebookId != 'undefined' && payloadData.facebookId) {
                if (payloadData.password) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FACEBOOK_ID_PASSWORD_ERROR);
                } else if (typeof payloadData.googleId != 'undefined' && payloadData.googleId) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TYPE_ALL_ERROR);
                } else {
                    cb();
                }
            } else if (typeof payloadData.googleId != 'undefined' && payloadData.googleId) {
                if (payloadData.password) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.GOOGLE_ID_PASSWORD_ERROR);
                } else if (typeof payloadData.facebookId != 'undefined' && payloadData.facebookId) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TYPE_ALL_ERROR);
                } else {
                    cb();
                }
            } else if (!payloadData.password) {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PASSWORD_REQUIRED);
            } else {
                cb();
            }
        },
        function (cb) {
            var criteria = {
                deviceToken: payloadData.deviceToken,
                active: true,
                emailId: {
                    $ne: payloadData.email
                }
            };
            Service.FanspickService.update(criteria, {
                $set: {
                    active: false
                }
            }, {
                    multi: true
                }, function (err, result) {
                    if (err) return cb(err);
                    cb();
                });
        },

        function (cb) {
            var criteria = {
                emailId: payloadData.email
            };
            var projection = {};
            var option = {
                lean: true
            };
            Service.FanspickService.getUser(criteria, projection, option, function (err, result) {
                if (err) return cb(err)
                if (result.length == 0) return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_NOT_FOUND);
                userFound = result && result[0] || null;
                if (userFound.loginType != payloadData.loginType) {
                    return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                }
                // updatedUserDetails= result;
                return cb();
            });
        },
        function (cb) {

            if (!userFound) {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_NOT_FOUND);
            } else if (userFound.loginType == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.SIMPLE) {
                if (userFound && userFound.passwordHash != UniversalFunctions.CryptData(payloadData.password)) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INCORRECT_PASSWORD);
                } else {
                    successLogin = true;
                    cb();
                }
            } else if (userFound.loginType == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.FACEBOOK) {
                if (userFound && userFound.facebookId != userFound.facebookId) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                } else {
                    successLogin = true;
                    cb();
                }
            } else if (userFound.loginType == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.GOOGLE) {
                if (userFound && userFound.googleId != userFound.googleId) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                } else {
                    successLogin = true;
                    cb();
                }
            }
        },
        function (cb) { //console.log("userFound 153  ",userFound);
            if (successLogin) {
                var tokenData = {
                    id: userFound._id,
                    type: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.FANSPICK
                };
                TokenManager.setToken(tokenData, function (err, output) {
                    if (err) {
                        cb(err);
                    } else {
                        if (output && output.accessToken) {
                            accessToken = output && output.accessToken;
                            cb();
                        } else {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.ERROR.IMP_ERROR)
                        }
                    }
                })
            } else {
                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.ERROR.IMP_ERROR)
            }

        }, function (cb) {
            isDeviceTokenUpdated(userFound._id, payloadData.deviceToken, function (error, found) {
                if (error) {
                    cb(error);
                } else if (found) {
                    var criteria = { userId: userFound._id };
                    var dataToUpdate = { $set: { contacts: [] } };
                    var option = { lean: true };
                    Service.FanspickService.updateUserContacts(criteria, dataToUpdate, option, cb);
                } else {
                    cb();
                }
            })
        },
        function (cb) {
            var criteria = {
                _id: userFound._id
            };
            var setQuery = {
                appVersion: payloadData.appVersion,
                deviceToken: payloadData.deviceToken,
                deviceType: payloadData.deviceType,
                fcmId: payloadData.fcmId,
                // onceLogin: true,
                active: true
            };
            Service.FanspickService.updateUser(criteria, setQuery, {
                lean: true
            }, function (err, data) {
                updatedUserDetails = data;
                cb(err, data);
            });

        }
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, {
                accessToken: accessToken,
                userDetails: UniversalFunctions.deleteUnnecessaryDonorData(updatedUserDetails)
            });
        }
    });
};
var isDeviceTokenUpdated = function (userId, deviceToken, callback) {
    var criteria = {
        _id: userId
    };
    var projection = { deviceToken: 1 };
    var options = { lean: true };
    var found = false;
    Service.FanspickService.getUser(criteria, projection, options, function (error, result) {
        if (error) {
            callback(error);
        } else {
            if (deviceToken != result[0].deviceToken) {
                found = true;
            }
            callback(null, found);
        }
    })
}

var checkUsername = function (payloadData, callback) {
    var userFound = false;
    var accessToken = null;
    var successLogin = false;
    var updatedUserDetails = null;
    //payloadData.email =payloadData.email.toLowerCase();
    async.series([
        function (cb) {
            var criteria = {
                username: payloadData.username
            };
            var projection = {};
            var option = {
                lean: true
            };
            Service.FanspickService.getUser(criteria, projection, option, function (err, result) {
                if (err) return cb(err)
                if (result.length != 0) return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERNAME_EXIST);
                return cb();
            });
        }
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
};






var eventLoging = function (payloadData, callback) {
    var dataToSave = payloadData;
    async.series([
        function (cb) {
            //Insert Into DB

            var finalDataToSave = {};
            finalDataToSave.createdOn = new Date().toISOString();
            finalDataToSave.lat = dataToSave.lat;
            finalDataToSave.long = dataToSave.lon;
            finalDataToSave.deviceType = dataToSave.deviceType;
            finalDataToSave.deviceToken = dataToSave.deviceToken;
            finalDataToSave.appVersion = dataToSave.appVersion;
            finalDataToSave.eventType = dataToSave.eventType;
            finalDataToSave.eventDescription = dataToSave.eventDescription;
            finalDataToSave.eventAdditionalInfoID = dataToSave.eventAdditionalInfoID;
            finalDataToSave.userId = dataToSave.userId;


            if (dataToSave.userAgent != 'undefined' && dataToSave.userAgent) {
                finalDataToSave.userAgent = dataToSave.userAgent;
            }
            Service.FanspickService.createEventLog(finalDataToSave, function (err, userDataFromDB) {
                if (err) {
                    cb(err)
                } else {
                    cb();
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
};


var getAllTopicAsTopicdatas = function (userAuthData, payloadData, callback) {
    var criteria = {

    };
    var projection = {};
    var option = {
        lean: true
    };
    Service.FanspickService.getAllTopicAsTopicdatas(criteria, projection, option, function (err, result) {
        if (err) return callback(err)
        if (result.length != 0) return callback(err);
        return callback(null, result);
    });
}

var getAllTopic = function (userAuthData, payloadData, callback) {
    var LastData = {}
    /*
            var populateVariable = {
                path: "communityID",
                select: 'Name'
            };
            if (payloadData.type != 'ALL') {
                var query = {
                    communityID: payloadData.communityID,
                    hot: true
                }
            }
            else {
                var query = {
                    communityID: payloadData.communityID,
                    hot: false
                }
            }

            var options = { lean: true },
                projection = { modifiedDate: 0, isPinned: 0, isDeleted: 0, isLocked: 0 };

            Service.AdminService.getTopicPopulate(query, projection, options, populateVariable, function (err, res) {
                if (err) {
                    callback(err)
                } else {
                    LastData["topics"] = res
                    callback(null,res);
                }
            });
    */
    async.series([

        function (cb) {
            var populateVariable = {
                path: "communityID",
                select: 'Name'
            };
            if (payloadData.type != 'ALL') {
                var query = {
                    communityID: payloadData.communityID,
                    hot: true
                }
            } else {
                var query = {
                    communityID: payloadData.communityID,
                    hot: false
                }
            }

            var options = {
                lean: true
            },
                projection = {
                    modifiedDate: 0,
                    isPinned: 0,
                    isDeleted: 0,
                    isLocked: 0
                };

            Service.AdminService.getTopicPopulate(query, projection, options, populateVariable, function (err, res) {
                if (err) {
                    cb(err)
                } else {
                    LastData["topics"] = res
                    cb();
                }
            });
        },
        //get users connected
        function (cb) {
            var clientCount = socketManager.getClientCount();
            if (LastData.topics.length > 0) {
                LastData.topics.forEach(function (topic) {
                    var roomId = socketManager.getRoomId(topic._id.toString());
                    if (clientCount.hasOwnProperty(roomId) > 0) {
                        topic["activeUserCount"] = clientCount[roomId];
                    } else {
                        topic["activeUserCount"] = 0;
                    }
                })
            }
            cb();
        }
    ], function (err, data) {
        if (err) return callback(err);
        callback(null, LastData.topics);
    });
};

var getTopicByFixture = function (userAuthData, payloadData, callback) {
    var LastData = {};
    var Community = {};
    async.series([
        function (cb) {

            var query = {
                TeamID: payloadData.teamId
            }

            var options = {
                lean: true
            },
                projection = {
                    modifiedDate: 0,
                    isPinned: 0,
                    isDeleted: 0,
                    isLocked: 0
                };

            Service.AdminService.getCommunity(query, projection, options, function (err, res) {
                if (err) {
                    cb(err)
                } else {
                    Community = res[0];
                    cb();
                }
            });
        },
        function (cb) {

            var query = {
                communityID: Community._id,
                fixtureID: payloadData.fixtureId
            }

            var options = {
                lean: true
            },
                projection = {
                    modifiedDate: 0,
                    isPinned: 0,
                    isDeleted: 0,
                    isLocked: 0
                };

            Service.AdminService.getTopic(query, projection, options, function (err, res) {
                if (err) {
                    cb(err)
                } else {
                    LastData = res
                    cb();
                }
            });
        }
    ], function (err, data) {
        if (err) return callback(err);
        callback(null, LastData);
    });
};



var getAllCommunity = function (userAuthData, payloadData, callback) {

    var populateVariable = {
        path: "topics",
        select: 'name'
    };

    var options = {
        lean: true
    },
        projection = {
            modifiedDate: 0,
            isActive: 0,
            isLocked: 0,
            isDeleted: 0
        };

    Service.FanspickService.getAllCommunity({}, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};

var getMyCommunity = function (userAuthData, payloadData, callback) {

    var populateVariable = {
        path: "topics",
        select: 'name'
    };

    var criteria = {
        TeamID: payloadData.teamId
    };
    var options = {
        lean: true
    },
        projection = {
            modifiedDate: 0,
            createdDate: 0,
            isActive: 0,
            isLocked: 0,
            isDeleted: 0
        };

    Service.FanspickService.getMyCommunity(criteria, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};

/*
var addCommunity = function (userAuthData, payloadData, callback) {
    var communityId = {};
    async.series([
        function(cb) {
            var populateVariable = {
                path: "topics",
                select: 'name'
            };
            var criteria = {_id : payloadData.communityId  };
            var options = {lean: true},
                projection ={modifiedDate:0, createdDate:0, isActive:0, isLocked:0, isDeleted:0};

            Service.AdminService.getCommunityPopulate(criteria, projection, options, populateVariable, function (err, res) {
                if (err) {
                    return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND)
                } else {
                    communityId = res[0]._id;
                    cb();
                }
            });
        },
        function(cb) {
            var criteria = {_id: userFound._id};
            var setQuery = {
                $addToSet: {
                    communityId: communityId
                }
            };
            var options = {lean: true};
            Service.FanspickService.updateUser(criteria, setQuery, options, function(err,suceess){
                if(err)
                {
                    return cb(err);
                }
                cb();
            });
        }
    ], function (err, result) {
        if(err)
        {
            return callback(err);
        }
        return callback();
    })
};
*/

var changePassword = function (queryData, userData, callback) {
    var userFound = null;
    if (!queryData.oldPassword || !queryData.newPassword || !userData) {
        return callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    }
    async.series([
        function (cb) {
            var criteria = {
                _id: userData.id
            };
            var projection = {
                passwordHash: 1
            };
            var options = {
                lean: true
            };
            Service.FanspickService.getUser(criteria, projection, options, function (err, data) {
                if (err) {
                    return cb(err);
                }

                if (data.length == 0) {
                    return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND)
                }
                userFound = data[0];
                return cb();
            });
        },
        function (cb) {

            if (userFound.passwordHash != UniversalFunctions.CryptData(queryData.oldPassword)) {
                return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INCORRECT_OLD_PASS)
            } else if (userFound.passwordHash == UniversalFunctions.CryptData(queryData.newPassword)) {
                return cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SAME_PASSWORD)
            }
            return cb();
        },
        function (cb) {
            var criteria = {
                _id: userFound._id
            };
            var setQuery = {
                $set: {
                    passwordHash: UniversalFunctions.CryptData(queryData.newPassword),
                    passwordChangesOn: new Date().toISOString()
                }
            };
            var options = {
                lean: true
            };
            Service.FanspickService.updateUser(criteria, setQuery, options, function (err, suceess) {
                if (err) {
                    return cb(err);
                }
                cb();
            });
        }

    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        return callback();
    })
};




var resetPassword = function (payloadData, callback) {
    var DonorObj = null;
    if (!payloadData || !payloadData.email || !payloadData.passwordResetToken || !payloadData.newPassword) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    } else {
        async.series([
            function (cb) {
                //Get User
                var criteria = {
                    emailId: payloadData.email
                };
                Service.FanspickService.getUser(criteria, {}, {
                    lean: true
                }, function (err, userData) {
                    if (err) {
                        cb(err)
                    } else {
                        if (!userData || userData.length == 0) {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND);
                        } else {
                            DonorObj = userData && userData[0] || null;
                            cb()
                        }
                    }
                })
            },
            function (cb) {
                if (DonorObj) {
                    if (DonorObj.passwordResetToken != payloadData.passwordResetToken) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_RESET_PASSWORD_TOKEN);
                    } else {
                        cb();
                    }
                } else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND);
                }
            },
            function (cb) {
                if (DonorObj) {
                    var criteria = {
                        emailId: payloadData.email
                    };
                    var setQuery = {
                        passwordHash: UniversalFunctions.CryptData(payloadData.newPassword),
                        $unset: {
                            passwordResetToken: 1
                        }
                    };
                    Service.FanspickService.updateUser(criteria, setQuery, {}, function (err, userData) {
                        if (err) {
                            cb(err)
                        } else {
                            cb();
                        }
                    })
                } else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                }
            }
        ], function (err, result) {
            callback(err, null);
        })
    }
};

var resetForgotPassword = function (payloadData, callback) {
    var DonorObj = null;
    if (!payloadData || !payloadData.phoneNumber || !payloadData.newPassword) {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
    } else {
        async.series([
            function (cb) {
                //Get User
                var criteria = {
                    phoneNumber: payloadData.phoneNumber
                };
                Service.FanspickService.getUser(criteria, {}, {
                    lean: true
                }, function (err, userData) {
                    if (err) {
                        cb(err)
                    } else {
                        if (!userData || userData.length == 0) {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND);
                        } else {
                            DonorObj = userData && userData[0] || null;
                            cb()
                        }
                    }
                })
            },
            function (cb) {
                if (DonorObj) {
                    var criteria = {
                        phoneNumber: payloadData.phoneNumber
                    };
                    var setQuery = {
                        passwordHash: UniversalFunctions.CryptData(payloadData.newPassword)
                        // $unset: {
                        //     passwordResetToken: 1
                        // }
                    };
                    Service.FanspickService.updateUser(criteria, setQuery,  function (err, userData) {
                        if (err) {
                            cb(err)
                        } else {
                            cb(null, UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED);
                        }
                    })
                } else {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                }
            }
        ], function (err, result) {
            callback(err, result[1]);
        })
    }
};



var getResetPasswordToken = function (query, callback) {
    var variableDetails = {};
    if (query.email) {
        var email = query.email;
        var generatedString = UniversalFunctions.generateRandomString();
        var fanspickdata = null;
        var charityOwnerData = null;
        if (!email) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR);
        } else {
            async.series([
                function (cb) {
                    //update user
                    var criteria = {
                        emailId: email
                    };
                    var setQuery = {
                        passwordResetToken: UniversalFunctions.CryptData(generatedString)
                    };
                    Service.FanspickService.updateUser(criteria, setQuery, {
                        new: true
                    }, function (err, userData) {
                        if (err) {
                            cb(err)
                        } else {
                            if (!userData || userData.length == 0) {
                                cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.EMAIL_NOT_FOUND);
                            } else {
                                fanspickdata = userData;
                                cb()
                            }
                        }
                    })
                },
                function (cb) {
                    if (fanspickdata) {
                        variableDetails = {
                            user_name: fanspickdata.name,
                            password_reset_token: fanspickdata.passwordResetToken,
                            date: moment().format("D MMMM YYYY"),
                            password_reset_link: Config.APP_CONSTANTS.DOMAIN_NAME_MAIL + '/api/charity/resetPassword?passwordResetToken=' + fanspickdata.passwordResetToken + '&email=' + fanspickdata.emailId + "&newPassword=" //TODO change this to proper html page link
                            // password_reset_link:Config.APP_CONSTANTS.DOMAIN_NAME_MAIL +'/giveapp-dev/giveapp-admin/changePassword.html?passwordResetToken='+fanspickdata.passwordResetToken+'&type=donor&email='+donorData.emailId+"&newPassword=" //TODO change this to proper html page link
                        };
                        cb();
                    } else {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
                    }
                },
                function (callback) {
                    NotificationManager.sendEmailToUser('FANSPICK_FORGOT_PASSWORD', variableDetails, fanspickdata.emailId, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        callback();
                    });
                }
            ], function (err, result) {
                if (err) {
                    callback(err)
                } else {
                    //callback(null, {password_reset_token: driverObj.passwordResetToken})//TODO Change in production DO NOT Expose the password
                    callback(null) //TODO Change in production DO NOT Expose the password
                }
            })
        }
    } else {
        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.EMPTY_VALUE);
    }
};

var convertDateToString = function (dateObj) {
    if (typeof dateObj == "string") {
        console.log('already a string');
        return dateObj;
    }
    var m_names = new Array("January", "February", "March",
        "April", "May", "June", "July", "August", "September",
        "October", "November", "December");
    var dd = dateObj.getDate();
    var mm = dateObj.getMonth() + 1;
    var yyyy = dateObj.getFullYear();
    var time = dateObj.getTime();
    var dateV = dd;
    var monthV = mm;

    if (dd < 10) {
        dateV = "0" + dd;
    }
    if (mm < 10) {
        monthV = "0" + mm;
    }

    //time
    // var hours = dateObj.getHours();
    // var minutes = dateObj.getMinutes();
    // var ampm = hours >= 12 ? 'PM' : 'AM';
    // hours = hours % 12;
    // hours = hours ? hours : 12; // the hour '0' should be '12'
    // minutes = minutes < 10 ? '0' + minutes : minutes;
    // var strTime = hours + ':' + minutes + ' ' + ampm;
    //
    //  var date = m_names[mm] + '-' + dd + ', ' + yyyy;// + ' ' + strTime;
    var date = yyyy + "-" + monthV + "-" + dateV;

    return date;
}
var convertStringToDate = function (dateString) {
    var dateValue = dateString; //'2017-03-02';
    var d = new Date();

    var yearV = dateValue.slice(0, 4);
    var monthV = dateValue.slice(5, 7);
    var dayV = dateValue.slice(8, 10);


    d.setDate(dayV);
    d.setMonth(monthV - 1);
    d.setYear(yearV);
    d.setUTCHours(0);
    d.setUTCMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);

    return d;
}
var UpdateUser = function (payloadData, UserData, callback) {
    var donorProfileData = null;
    var dataToSave = payloadData;
    var fileName = payloadData.photo;
    async.series([
        function (cb) {

            if (dataToSave.dob != 'undefined' && dataToSave.dob) {
                // finalDataToSave.dob = convertStringToDate(dataToSave.dob);
                dataToSave.dob = convertStringToDate(dataToSave.dob);
            }
            var criteria = {
                _id: UserData._id
            };
            var options = {
                new: true
            };
            Service.FanspickService.updateUser(criteria, dataToSave, options, function (err, charityDataFromDB) {
                if (err) {
                    if (err.code == 11000 && err.message.indexOf('donorschemas.$phoneNumber_1') > -1) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PHONE_ALREADY_EXIST);
                    } else {
                        cb(err)
                    }
                    cb(err)
                } else {
                    cb();
                }
            });
        },
        function (cb) {
            //delete file
            if (payloadData.photo) {
                deleteFile(fileName, cb);
            } else {
                cb();
            }
        }
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};





/////////////////////////////////////////////////////////////////////SPORT DATA //////////////////////////////////////////////////////////////////

var getSports = function (query, callback) {

    var criteria = {};

    var options = {},
        projection = {};

    Service.FanspickService.getSports(criteria, projection, options, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};


var getCountriesForSport = function (query, payloadData, callback) {

    var criteria = {
        SportID: payloadData.sportId,
        isContinent: false
    };

    var populateVariable = {};

    var options = {},
        projection = {};

    Service.FanspickService.getCountryData(criteria, projection, options, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};

var getLeaguesForCountry = function (query, payloadData, callback) {
    var criteria = {
        countryId: payloadData.countryId,
        isNationalLeague: true,
        isLeague: true
    };

    var options = {},
        projection = {
            teamMini: false
        };

    Service.FanspickService.getCompetitions(criteria, projection, options, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });

};

var getTeamsForCompetition = function (query, payloadData, callback) {
    var criteria = {
        "competitionMini": {
            $elemMatch: {
                "competitionId": payloadData.competitionId
            }
        }
    }
    var projection = {
        countryName: 1
    };
    var option = {
        lean: true
    };
    Service.FanspickService.getCountryData(criteria, projection, option, function (error, result) {
        if (error) {
            callback(error);
        } else if (result != undefined && result.length > 0) {
            //check UEFA competition or not
            if (result[0].countryName == UniversalFunctions.CONFIG.APP_CONSTANTS.EUROPEAN_COUNTRY_NAME) {
                //get Teams for UEFA's leagues
                getTeamsForCompetitionForUEFA(query, payloadData, function (error, result) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, result);
                    }
                })
            } else {
                getTeamsForCompetitionExceptUEFA(query, payloadData, function (error, result) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, result);
                    }
                })
            }

        } else {
            // country not found
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.COUNTRY_NOT_FOUND)
        }
    })
}

var getTeamsForCompetitionForUEFA = function (query, payloadData, callback) {
    var stage = UniversalFunctions.CONFIG.APP_CONSTANTS.EUROPEAN_STAGES.GROUP_STAGE; // static
    var season = '2017/2018'; //static
    var seasonId = null,
        stageId = null;
    async.parallel([
        function (parallelCallback) {
            //get seasonId 
            var criteria = {
                season: season
            };
            var projection = {
                _id: 1
            };
            var option = {
                lean: true
            };
            Service.lkpStageService.getSeasons(criteria, projection, option, function (error, result) {
                if (error) {
                    parallelCallback(error);
                } else if (result != undefined && result.length > 0) {
                    seasonId = result[0]._id;
                    parallelCallback(null);
                } else {
                    parallelCallback(null);
                }
            })
        },
        function (parallelCallback) {
            //get stageId
            var criteria = {
                stage: stage
            };
            var projection = {
                _id: 1
            };
            var option = {
                lean: true
            };
            Service.lkpStageService.getStages(criteria, projection, option, function (error, result) {
                if (error) {
                    parallelCallback(error);
                } else if (result != undefined && result.length > 0) {
                    stageId = result[0]._id;
                    parallelCallback(null);
                } else {
                    parallelCallback(null);
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            if (seasonId != null && stageId != null) {
                // get teams data from lkpstageteams schema
                var criteria = {
                    seasonId: seasonId,
                    stageId: stageId,
                    competitionId: new ObjectId(payloadData.competitionId)
                }
                Service.lkpStageService.getTeamsDetailsForStage(criteria, function (error, result) {
                    if (error) {
                        callback(error);
                    } else if (result != undefined && result.length > 0) {
                        var resultData = updateTeamDataWithFavCategory(result, query);
                        callback(null, resultData);
                    } else {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                    }
                })
            } else {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SEASON_NOT_FOUND)
            }
        }
    })
}

var getTeamsForCompetitionExceptUEFA = function (query, payloadData, callback) {
    var criteria = {
        // "competitions: $elemMatch: {competitionId:": payloadData.competitionId 
        // "competitions.competitionId": { "$in" : payloadData.competitionId }
        "competitions": {
            $elemMatch: {
                "competitionId": payloadData.competitionId
            }
        }

    };

    var options = {
        lean: true
    };
    var projection = {
        squadData: 0,
        teamShirtImage: 0,
        competitions: 0,
        facebookTerm: 0,
        twitterHastag: 0,
        shortCode: 0,
        teamFeedID: 0,
        coachId: 0,
        teamMini: 0,
        teamLogo: false
    };
    var FACup = false;

    async.series([
        function (seriesCallback) {
            Service.FanspickService.getCompetitions({
                _id: payloadData.competitionId,
                competitionName: 'FA Cup'
            }, {
                    competitionName: 1
                }, {}, function (err, result) {
                    if (err) {
                        seriesCallback(err);
                    } else if (result.length == 0) {
                        seriesCallback();
                    } else {
                        FACup = true;
                        seriesCallback();
                    }
                })
        },
        function (seriesCallback) {
            Service.FanspickService.getTeamData(criteria, projection, options, function (err, res) {
                if (err) {
                    seriesCallback(err)
                } else if (res.length == 0) {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                } else {
                    // Team Data Updation for favourite Team
                    var resultData = updateTeamDataWithFavCategory(res, query);
                    seriesCallback(null, res);
                }
            });

        }
        // }
    ], function (err, result) {
        if (err) {
            callback(err);
        } else {
            var respone = [];
            if (result[1] != undefined) {
                respone = result[1];
            }
            callback(null, respone);
        }
    })
};

var updateTeamDataWithFavCategory = function (teams, query) {
    teams.forEach(function (eachTeam) {
        query.defaultTeam.forEach(function (eachDefaultTeam) {
            if (eachTeam._id.toString() == eachDefaultTeam.favouriteTeam.toString())
                eachTeam["isPrimaryFavouriteTeam"] = true;
        });
        query.teamFavourite.forEach(function (eachFavTeam) {
            if (eachTeam._id.toString() == eachFavTeam.favouriteTeam.toString()) {
                eachTeam["isSecondaryFavouriteTeam"] = true;
            }
        })
    })
    return teams;
}

var getTeamsForCountry = function (query, payloadData, callback) {
    var criteria = {
        countryId: payloadData.countryId,
    };

    var options = {},
        projection = {
            squadData: false,
            teamShirtImage: false,
            teamLogo: false

        };

    Service.FanspickService.getTeamData(criteria, projection, options, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};


var getTeamData = function (query, payloadData, callback) {
    var teamData = {};

    var criteria = {
        _id: payloadData.teamId
    };

    var projection = {
        squadData: false,
        teamLogo: false
    };

    var options = {};


    Service.FanspickService.getTeamData(criteria, projection, options, function (err, res) {
        if (err) {
            callback(err)
        } else {

            if (res !== undefined) {
                if (res.length != 0) {
                    teamData = res[0]
                    callback(null, teamData)
                } else {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                }
            }
        }
    })

};

var getTeamSubstitutes = function (query, payloadData, callback) {
    var userPick = {
        _id: null,
        substitutes: [],
        substitutions: []
    }
    var mangerPickSubstitutes = [];
    var teamData = [];

    async.series([
        function (seriesCallback) {
            //get substitutes
            var criteria = {
                teamId: new ObjectId(payloadData.teamId),
                userId: query._id,
                fixtureId: new ObjectId(payloadData.fixtureId),
                isLive: payloadData.isLive
            };
            var projection = {
                // 'substitutions': 1
            };

            var options = {
                lean: true
            };
            Service.FanspickService.getUserFixture(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    userPick._id = result[0]._id;
                    if (result[0].substitutions && result[0].substitutions.length > 0) {
                        result[0].substitutions.forEach(function (each) {
                            userPick.substitutions.push(each.playerInId._id);
                        })
                    }
                    seriesCallback();
                } else {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                }
            })
        },
        function (seriesCallback) {
            //get substitutes from manager pick
            var criteria = {
                _id: new ObjectId(payloadData.fixtureId)
            };
            var projection = {
                localTeam: 1,
                visitorTeam: 1
            };
            var options = {
                lean: true
            };
            Service.FanspickService.getManagerPick(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result && result.length > 0) {
                    var team;
                    if (result[0].localTeam && result[0].localTeam.franspickTeamId.toString() == payloadData.teamId) {
                        team = result[0].localTeam;
                    } else if (result[0].visitorTeam && result[0].visitorTeam.franspickTeamId.toString() == payloadData.teamId) {
                        team = result[0].visitorTeam;
                    }
                    if (team.substitutes && team.substitutes.length > 0) {
                        team.substitutes.forEach(function (each) {
                            mangerPickSubstitutes.push(each.playerId);
                        })
                        seriesCallback(null);
                    } else {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SUBTITUTES_NOT_FOUND)
                    }
                } else {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                }
            })
        },
        function (seriesCallback) {
            //update substitutes list 
            if (userPick.substitutions && userPick.substitutions.length > 0) {
                mangerPickSubstitutes.forEach(function (eachSubstitute) {
                    var substituted = false;
                    userPick.substitutions.forEach(function (eachSubstitution) {
                        if (eachSubstitute.toString() == eachSubstitution.toString()) {
                            substituted = true;
                        }
                    })
                    if (!substituted) {
                        userPick.substitutes.push(eachSubstitute);
                    }
                })
                seriesCallback(null);
            } else {
                userPick.substitutes = mangerPickSubstitutes;
                seriesCallback(null);
            }
        },
        function (seriesCallback) {
            if (userPick.substitutes.length > 0) {
                var query = [];
                query.push({
                    $match: {
                        _id: new ObjectId(payloadData.teamId)
                    }
                }, {
                        $unwind: '$squadData'
                    }, {
                        $match: {
                            'squadData.playerId': {
                                $in: userPick.substitutes
                            }
                        }
                    }, {
                        $group: {
                            '_id': '$_id',
                            data: {
                                $push: '$squadData'
                            }
                        }
                    })
                Service.FanspickService.getTeamSquadAggregate(query, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else if (result != undefined && result.length > 0) {
                        teamData = result[0].data;
                        seriesCallback()
                    } else {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                    }
                })
            } else {
                seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
            }
        }
    ], function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, teamData)
        }
    })
};


var getUpcomingFixtures = function (query, payloadData, callback) {
    // need to comment for upcoming fixtures ---- start
    // var today = new Date(2017, 00, 13);
    // var collectionDate = new Date(2017, 04, 30);
    // need to comment for upcoming fixtures ---- end

    // need to uncomment for 10 upcoming fixtures ---- start
    var today = new Date();
    // today.setDate(today.getDate() - 70);
    // need to uncomment for 10 upcoming fixtures ---- end



    var options = {
        lean: true
    },
        projection = {
            "localTeam.players": false,
            "visitorTeam.players": false,
            commentaries: false,
            substitutions: false
        },
        query = {
            // $or: [{ "localTeam.franspickTeamId": payloadData.teamId }, { "visitorTeam.franspickTeamId": payloadData.teamId }]
            // need to comment for upcoming fixtures ---- start
            // , date: { $gte: today, $lt: collectionDate }
            // need to comment for upcoming fixtures ---- end

            // need to uncomment for upcoming fixtures ---- start
            // , date: { $gt: today }
            // need to uncomment for upcoming fixtures ---- end
        }
    async.parallel([
        function (parallelCallback) {
            query = {
                $or: [{
                    "localTeam.franspickTeamId": payloadData.teamId
                }, {
                    "visitorTeam.franspickTeamId": payloadData.teamId
                }],
                fixtureDate: {
                    $lt: today
                }
            }
            Service.FanspickService.getUpcomingFixtures(query, projection, options, -1, function (err, res) {
                if (err) {
                    parallelCallback(err)
                } else {

                    res = res.splice(0, 10);

                    res.forEach(function (fixture) {
                        var convertedDate = new Date(fixture.date);

                        var year = String(convertedDate.getFullYear());
                        var month = String(convertedDate.getMonth() + 1);
                        var dt = String(convertedDate.getDate());

                        if (dt < 10) {
                            dt = '0' + dt;
                        }
                        if (month < 10) {
                            month = '0' + month;
                        }

                        fixture.convertedDate = year + '-' + month + '-' + dt;
                        //console.log(year+'-' + month + '-'+dt);
                    }, this);


                    parallelCallback(null, res)
                }
            })
        },
        function (parallelCallback) {

            query = {
                $or: [{
                    "localTeam.franspickTeamId": payloadData.teamId
                }, {
                    "visitorTeam.franspickTeamId": payloadData.teamId
                }],
                fixtureDate: {
                    $gte: today
                }
            }
            Service.FanspickService.getUpcomingFixtures(query, projection, options, 1, function (err, res) {
                if (err) {
                    parallelCallback(err)
                } else {

                    res = res.splice(0, 10);

                    res.forEach(function (fixture) {
                        var convertedDate = new Date(fixture.date);

                        var year = String(convertedDate.getFullYear());
                        var month = String(convertedDate.getMonth() + 1);
                        var dt = String(convertedDate.getDate());

                        if (dt < 10) {
                            dt = '0' + dt;
                        }
                        if (month < 10) {
                            month = '0' + month;
                        }

                        fixture.convertedDate = year + '-' + month + '-' + dt;
                        //console.log(year+'-' + month + '-'+dt);
                    }, this);


                    parallelCallback(null, res)
                }
            })
        }
    ], function (err, result) {
        if (err) {
            callback(err);
        } else {
            var resultCombine = [];
            if (result[0])
                resultCombine = result[0].reverse();
            if (result[1])
                resultCombine = resultCombine.concat(result[1]);
            callback(null, resultCombine);
        }
    })

};

var updateTeamDataWithCountryId = function (teamData, callback) {
    var countryId = null;
    async.series([
        function (seriesCallback) {
            var criteria = {
                countryName: teamData.country
            };
            var projection = {
                _id: 1
            };
            var options = {
                lean: true
            };
            Service.FanspickService.getCountryData(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    countryId = result[0]._id;
                    seriesCallback();
                } else {
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            if (countryId == null) {
                var criteria = {
                    countryName: teamData.country
                };
                var dataToUpdate = {};
                var options = {
                    upsert: true,
                    new: true
                };
                Service.FanspickService.updateAdditionalCountryData(criteria, dataToUpdate, options, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        countryId = result._id;
                        seriesCallback();
                    }
                })
            } else {
                seriesCallback();
            }

        },
        function (seriesCallback) {
            if (countryId != null) {
                var criteria = {
                    _id: teamData._id
                };
                var dataToUpdate = {
                    countryId: countryId
                };
                var options = {
                    new: true
                };
                Service.FanspickService.updateTeamData(criteria, dataToUpdate, options, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        teamData = result;
                        seriesCallback();
                    }
                })
            } else {
                seriesCallback();
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, teamData);
        }
    })
}

var getCountryName = function (countryId, callback) {
    var countryName = '';
    var found = false;
    async.series([
        function (seriesCallback) {
            //get country name from countryDAtas
            var criteria = {
                _id: countryId
            };
            var projection = {};
            var options = {
                lean: true
            };
            Service.FanspickService.getCountryData(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    found = true;
                    countryName = result[0].countryName;
                    seriesCallback();
                } else {
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            //get country name from additional countryDatas
            if (!found) {
                //get country name from countryDAtas
                var criteria = {
                    _id: countryId
                };
                var projection = {};
                var options = {
                    lean: true
                };
                Service.FanspickService.getAdditionalCountryData(criteria, projection, options, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else if (result != undefined && result.length > 0) {
                        found = true;
                        countryName = result[0].countryName;
                        seriesCallback();
                    } else {
                        seriesCallback();
                    }
                })
            } else {
                seriesCallback();
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, countryName);
        }
    })
}

var setFavouriteTeam = function (query, payloadData, callback) {
    var teamData = {};
    // var defVal = false;
    var addNewRecord = false;
    async.series([
        function (cb) {
            var criteria = {
                _id: payloadData.teamId
            };
            Service.FanspickService.getTeamData(criteria, {}, {
                lean: true
            }, function (err, teamDataResult) {
                if (err) {
                    cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                } else {
                    if (teamDataResult.length == 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                    } else {
                        teamData = teamDataResult[0];
                        cb(null, teamData)
                    }
                }
            })
        },
        function (cb) {
            //check country Id exists 
            updateTeamDataWithCountryId(teamData, function (error, result) {
                if (error) {
                    cb(error);
                } else {
                    teamData = result;
                    cb();
                }
            })
        },
        function (cb) {
            //Check if team is already a favourite
            var criteria = {
                _id: query._id,
                $or: [{
                    defaultTeam: {
                        "$elemMatch": {
                            "favouriteTeam": payloadData.teamId
                        }
                    }
                },
                {
                    teamFavourite: {
                        "$elemMatch": {
                            "favouriteTeam": payloadData.teamId
                        }
                    }
                }
                ]

            }
            var options = {
                lean: true
            };
            Service.FanspickService.getUserForFavTeams(criteria, {}, options, function (err, userData) {
                if (err) {
                    cb(err)
                } else {
                    if (userData.length != 0) {
                        var isReturn = false;
                        var countryId = '';
                        var teamName = '';
                        userData[0].defaultTeam.forEach(function (defaultTeamFavourite) {
                            if (defaultTeamFavourite.favouriteTeam._id.toString() == payloadData.teamId.toString()) {
                                isReturn = true;
                                countryId = defaultTeamFavourite.favouriteTeamCountry;
                                teamName = defaultTeamFavourite.favouriteTeam.knownName;
                            }
                        }, this);
                        if (isReturn) {
                            getCountryName(countryId, function (err, result) {
                                if (err) {
                                    return cb(err);
                                } else {
                                    var error = {
                                        statusCode: 400,
                                        customMessage: teamName + ' is already set as Primary Favourite  for ' + result,
                                        type: 'PRIMARY_VALUE_EXIST'
                                    };
                                    return cb(error);
                                }
                            })

                        } else {
                            userData[0].teamFavourite.forEach(function (defaultTeamFavourite) {
                                console.log(defaultTeamFavourite.favouriteTeam + defaultTeamFavourite.favouriteTeam._id);
                                if (defaultTeamFavourite.favouriteTeam._id.toString() == payloadData.teamId.toString()) {
                                    isReturn = true;
                                    countryId = defaultTeamFavourite.favouriteTeamCountry;
                                    teamName = defaultTeamFavourite.favouriteTeam.knownName;
                                }
                            }, this);
                            if (isReturn) {
                                getCountryName(countryId, function (err, result) {
                                    if (err) {
                                        return cb(err);
                                    } else {
                                        var error = {
                                            statusCode: 400,
                                            customMessage: teamName + ' is already set as Secondary Favourite for ' + result,
                                            type: 'SECONDARY_VALUE_EXIST'
                                        };
                                        return cb(error);
                                    }
                                })

                            }
                        }

                        // cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.VALUE_EXIST)
                    } else {
                        cb();
                    }
                }
            });
        },
        function (cb) {
            //Check if a team from the same country is already a favourite
            // var teamExistsInCountry = false;

            var criteria = {
                _id: query._id
            }
            var options = {
                lean: true
            };
            Service.FanspickService.getUserForFavTeams(criteria, {}, options, function (err, userData) {
                if (err) {
                    cb(err)
                } else {
                    if (userData.length != 0) {
                        // Team Updation favourite
                        if (payloadData.type == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.FAV_TEAM_TYPE.PRIMARY) {
                            if (userData[0].defaultTeam && userData[0].defaultTeam.length == 0) {
                                addNewRecord = true;
                            } else {
                                addNewRecord = true;
                                var countryId;
                                userData[0].defaultTeam.forEach(function (defaultTeamFavourite) {
                                    var teamFavouriteCountryInStringFormat = defaultTeamFavourite.favouriteTeamCountry.toString();
                                    var currentlySelectedCountryInString = teamData.countryId.toString();
                                    if (teamFavouriteCountryInStringFormat == currentlySelectedCountryInString) // For some reason this only worked like this if (teamFavourite.favouriteTeamCountry == teamData.countryId) 
                                    {
                                        addNewRecord = false;
                                        countryId = defaultTeamFavourite.favouriteTeamCountry;
                                    }
                                }, this);
                                if (!addNewRecord) {
                                    // var error = UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PRIMARY_DUPLICATE_ENTERY;
                                    // error.customMessage = error.customMessage + ' ' + countryName;
                                    getCountryName(countryId, function (err, result) {
                                        if (err) {
                                            return cb(err);
                                        } else {
                                            var error = {
                                                statusCode: 400,
                                                customMessage: 'You can set only one team as Primary Favourite for ' + result,
                                                type: 'PRIMARY_DUPLICATE_ENTERY'
                                            };
                                            return cb(error);
                                        }
                                    })
                                }
                                // cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PRIMARY_VALUE_EXIST)
                            }

                        } else if (payloadData.type == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.FAV_TEAM_TYPE.SECONDARY) {

                            addNewRecord = true;
                        }

                        if (!addNewRecord) {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DUPLICATE_FAVOURITE);
                        } else {
                            cb();
                        }
                    } else {
                        cb();
                    }
                }
            });
        },
        function (cb) {
            if (payloadData.type == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.FAV_TEAM_TYPE.PRIMARY && addNewRecord) {

                var setQuery = {
                    $addToSet: {
                        defaultTeam: {
                            favouriteTeamCountry: teamData.countryId,
                            favouriteTeam: teamData._id
                        }
                    }
                };
            } else if (payloadData.type == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.FAV_TEAM_TYPE.SECONDARY && addNewRecord) {
                var setQuery = {
                    $addToSet: {
                        teamFavourite: {
                            favouriteTeamCountry: teamData.countryId,
                            favouriteTeam: teamData._id
                        }
                    }
                };
            }
            var criteria = {
                _id: query._id
            };
            var options = {
                lean: true
            };


            Service.FanspickService.updateUser(criteria, setQuery, options, function (err, userData) {
                if (err) {
                    cb(err)
                } else {
                    updateUserPickDataForFavTeam(query,payloadData,cb);
                    // cb();
                }
            });
        }
    ], function (err, result) {
        if (err) {
            return callback(err);
        }else{
            callback();
        }
    });
};

var updateUserPickDataForFavTeam = function (query, payload, callback) {
    //update userpick if any changes perform in fav. team
    var criteria = {
        teamId: payload.teamId,
        userId : query._id
    };
    var dataToUpdate = {$set:{}};
    if (payload.type == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.FAV_TEAM_TYPE.PRIMARY) {
        dataToUpdate['$set']['isPrimaryFavouriteTeam'] = "true";
    } else if (payload.type == UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.FAV_TEAM_TYPE.SECONDARY) {
        dataToUpdate['$set']['isFavouriteTeam'] = "true";
    }
    var option = { multi: true };
    Service.FanspickService.updateUserFixture(criteria, dataToUpdate, option, callback);
}

var getAllFavouriteTeams = function (userData, callback) {
    var criteria = {
        _id: userData._id
    }
    var projection = {
        defaultTeam: 1,
        teamFavourite: 1
    }
    Service.FanspickService.getUser(criteria, function (err, userData) {
        if (err) {
            callback(err)
        } else if (userData.length > 0) {
            var teamIds = [];
            userData[0].defaultTeam.forEach(function (defaultTeamEach) {
                teamIds.push(new ObjectId(defaultTeamEach.favouriteTeam));
            })
            userData[0].teamFavourite.forEach(function (teamFavEach) {
                teamIds.push(new ObjectId(teamFavEach.favouriteTeam));
            })
            var projectionTeam = {
                squadData: 0
            }
            Service.FanspickService.getUserFavTeams(teamIds, projectionTeam, function (err, teams) {
                if (err) {
                    callback(err);
                } else {
                    if (teams.length > 0) {
                        teams.forEach(function (eachTeam) {
                            userData[0].defaultTeam.forEach(function (defaultTeamEach) {
                                if (eachTeam._id.toString() == defaultTeamEach.favouriteTeam.toString()) {
                                    eachTeam['isPrimaryFavouriteTeam'] = true;
                                }
                            })
                            userData[0].teamFavourite.forEach(function (teamFavEach) {
                                if (eachTeam._id.toString() == teamFavEach.favouriteTeam.toString()) {
                                    eachTeam['isSecondaryFavouriteTeam'] = true;
                                }
                            })

                        })
                        callback(null, teams);
                    } else {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.RECORD_NOT_FOUND);
                    }
                }
            })
        }
    });
}


var unSetFavouriteTeam = function (query, payloadData, callback) {
    var leagueData = {};
    async.series([
        function (cb) {
            var criteria = {
                _id: query._id,
                defaultTeam: {
                    $elemMatch: {
                        favouriteTeam: payloadData.teamId
                    }
                }
            };
            Service.FanspickService.getUser(criteria, {}, {
                lean: true
            }, function (err, leagueDataResult) {
                if (err) {
                    cb(err)
                } else {
                    if (leagueDataResult.length != 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.DEFAULT_FAV);
                    } else
                        cb()
                }
            })
        },
        function (cb) {
            var criteria = {
                _id: query._id,
                teamFavourite: {
                    $elemMatch: {
                        favouriteTeam: payloadData.teamId
                    }
                }
            };
            Service.FanspickService.getUser(criteria, {}, {
                lean: true
            }, function (err, leagueDataResult) {
                if (err) {
                    cb(err)
                } else {
                    if (leagueDataResult.length == 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                    }
                    leagueData = leagueDataResult;
                    cb(null, leagueData)
                }
            })
        },
        function (cb) {

            var setQuery = {
                $pull: {
                    teamFavourite: {
                        favouriteTeam: payloadData.teamId
                    }
                }
            };
            var criteria = {
                _id: query._id
            };
            var options = {
                lean: true
            };


            Service.FanspickService.updateUser(criteria, setQuery, options, function (err, userData) {
                if (err) {
                    cb(err)
                } else {
                    cb();
                }
            });
        }
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback();
    });
};



var getChatData = function (query, payloadData, callback) {

    var criteria = {
        _id: payloadData.topicId
    };
    Service.FanspickService.getChatHistory(criteria, {
        posts: 0
    }, {
            lean: true
        }, function (err, chatData) {
            if (err) {
                callback(err)
            } else {
                var result = [];
                result.push(chatData);
                callback(null, result)
            }
        })
};

var getTeamSquad = function (query, payloadData, callback) {

    var criteria = {
        _id: payloadData.teamId
    };
    Service.FanspickService.getTeamSquad(criteria, {}, {
        lean: true
    }, function (err, chatData) {
        if (err) {
            callback(err)
        } else {
            Service.FanspickService.getLineUpsUserFixture({
                userId: query._id,
                teamId: payloadData.teamId,
                fixtureId: payloadData.fixtureId,
                isLive: payloadData.isLive
            }, {
                    'lineUpPlayers': 1,
                    'removeLineUpPlayers': 1
                }, function (err, lineUpPlayer) {
                    if (err) {
                        callback(err);
                    } else {
                        chatData.forEach(function (eachSquad) {
                            var stringFormattedID = eachSquad.playerId.toString();
                            eachSquad['isSelected'] = false;
                            if (lineUpPlayer.length > 0) {
                                lineUpPlayer.forEach(function (eachUserFixture) {
                                    var eachFixtureslineUpPlayer = eachUserFixture._doc.lineUpPlayers;
                                    if (eachFixtureslineUpPlayer && eachFixtureslineUpPlayer.length > 0) {
                                        eachFixtureslineUpPlayer.forEach(function (eachPlayer) {
                                            if (stringFormattedID == eachPlayer.playerId) {
                                                eachSquad['isSelected'] = true;
                                            }
                                        })
                                    }
                                    // var eachFixturesRemovelineUpPlayer = eachUserFixture._doc.removeLineUpPlayers;
                                    // if (eachFixturesRemovelineUpPlayer && eachFixturesRemovelineUpPlayer.length > 0) {
                                    //     eachFixturesRemovelineUpPlayer.forEach(function (eachPlayer) {
                                    //         if (stringFormattedID == eachPlayer.playerId) {
                                    //             eachSquad['isSelected'] = true;
                                    //         }
                                    //     })
                                    // }
                                })
                            }
                        })
                        callback(null, chatData)
                    }
                })
        }
    })
};

var getPlayerData = function (query, payloadData, callback) {
    var criteria = {
        _id: payloadData.playerId
    };
    Service.FanspickService.getPlayerData(criteria, {
        playerImage: 0
    }, {}, function (err, playerData) {
        if (err) {
            callback(err)
        } else {
            callback(null, playerData)
        }
    })
};

var getPlayerDataWithStatistics = function (query, payloadData, callback) {
    Service.FanspickService.getPlayerDataWithStatistics(payloadData.playerId, function (err, playerData) {
        if (err) {
            callback(err)
        } else {
            callback(null, playerData)
        }
    })
}

//Internal Query that checks for and creates a UserFixture Event
var getOrCreateUserFixture = function (query, payloadData, callback) {
    var userData = {};
    var userFixtureData = {};
    var dateNow = new Date();
    var Pick = {}

    async.waterfall([
        function (cb) {

            var criteria = {
                _id: query._id
            };

            Service.FanspickService.getUser(criteria, {}, {
                lean: true
            }, function (err, teamDataResult) {
                if (err) {
                    cb(err)
                } else {
                    if (teamDataResult.length == 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.NOT_FOUND);
                    }
                    userData = teamDataResult;
                    cb(null, userData);
                }
            })
        },

        function (err, cb) {
            var criteria = {
                userId: query._id,
                fixtureId: payloadData.fixtureId,
                teamId: payloadData.teamId,
                isLive: payloadData.isLive
            };
            Service.FanspickService.getUserFixture(criteria, {}, {
                lean: true
            }, function (err, userFixtureDataResult) {
                if (err) {
                    cb(err)
                } else {
                    if (userFixtureDataResult.length == 0) {


                        var isFavouriteTeam = "false";
                        var isPrimaryFavouriteTeam = "false";

                        if (userData[0].defaultTeam !== undefined) {
                            if (userData[0].defaultTeam.length != 0) {
                                userData[0].defaultTeam.forEach(function (defaultTeam) {
                                    if (defaultTeam.favouriteTeam.toString() == payloadData.teamId) {
                                        isPrimaryFavouriteTeam = "true";
                                        isFavouriteTeam = "true";
                                    }
                                }, this);
                            }
                        }

                        if (userData[0].teamFavourite !== undefined) {
                            if (userData[0].teamFavourite.length != 0) {
                                userData[0].teamFavourite.forEach(function (teamFavourite) {
                                    if (teamFavourite.favouriteTeam.toString() == payloadData.teamId) {
                                        isFavouriteTeam = "true";
                                    }
                                }, this);
                            }
                        }


                        //Create a User Fixture if one is not found. 
                        var userFixtureToSave = {};
                        userFixtureToSave.userId = query._id;
                        userFixtureToSave.fixtureId = payloadData.fixtureId;
                        userFixtureToSave.teamId = payloadData.teamId;
                        userFixtureToSave.currentFormation = null;
                        userFixtureToSave.isFavouriteTeam = isFavouriteTeam;
                        userFixtureToSave.isPrimaryFavouriteTeam = isPrimaryFavouriteTeam;
                        userFixtureToSave.createdDate = dateNow;
                        userFixtureToSave.updatedDate = dateNow;
                        userFixtureToSave.isLive = payloadData.isLive;

                        Service.FanspickService.createUserFixture(userFixtureToSave, function (err, savedData) {
                            if (err) {
                                cb(err)
                            } else {
                                userFixtureData = savedData._doc;
                                cb(err, userFixtureData);
                            }
                        })


                    } else {
                        userFixtureData = userFixtureDataResult[0];
                        cb(null, userFixtureData);
                    }
                }
            })
        },

    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, userFixtureData);
    });
};

var createUserAction = function (query, payloadData, callback) {
    var userFixtureData = {};
    payloadData.isLive = true;
    var recordFound = false;
    async.series([
        function (cb) {
            getOrCreateUserFixture(query, payloadData, function (err, userFixtureDataReturned) {
                if (err) {
                    cb(err)
                } else {
                    if (userFixtureDataReturned !== undefined) {
                        userFixtureData = userFixtureDataReturned;
                        cb();
                    } else {
                        return callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND);
                    }

                }
            });
        },

        function (cb) {
            var criteriaWithActionTime = {
                "userId": new ObjectId(payloadData.userId),
                "fixtureId": new ObjectId(payloadData.fixtureId),
                "teamId": new ObjectId(payloadData.teamId),
                "userActions": {
                    $elemMatch: {
                        action: payloadData.action
                    }
                },
                isLive: true
            };
            Service.FanspickService.getLineUpsUserFixture(criteriaWithActionTime, {}, function (error, result) {
                if (error) {
                    cb(error);
                } else if (result.length == 0) {
                    cb();
                } else {
                    var criteria = {
                        _id: result[0]._id
                    }
                    var dataToSet = {
                        $pull: {
                            'userActions': {
                                "action": payloadData.action
                            }
                        }
                    }
                    Service.FanspickService.updateUserFixture(criteria, dataToSet, {}, function (error, response) {
                        if (error) {
                            cb(error)
                        } else {
                            cb();
                        }
                    })
                }
            })
        },
        function (cb) {
            if (payloadData.action != "manofmatch") {
                var criteriaWithActionTime = {
                    "userId": new ObjectId(payloadData.userId),
                    "fixtureId": new ObjectId(payloadData.fixtureId),
                    "teamId": new ObjectId(payloadData.teamId),
                    "userActions": {
                        $elemMatch: {
                            playerId: new ObjectId(payloadData.playerId),
                            $or: [{
                                action: 'star'
                            }, {
                                action: 'hairdryer'
                            }]
                        }
                    }
                };
                Service.FanspickService.getLineUpsUserFixture(criteriaWithActionTime, {
                    "userActions.$": 1
                }, function (error, result) {
                    if (error) {
                        cb(error);
                    } else if (result.length == 0) {
                        cb();
                    } else {
                        // recordFound = true;
                        // cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.MAN_OF_THE_MATCH_EXIST);

                        var criteria = {
                            _id: result[0]._id
                            // userActions: { $elemMatch: { "action": 'manofmatch' } }
                        }

                        var dataToSet = {
                            $pull: {
                                'userActions': {
                                    "playerId": new ObjectId(payloadData.playerId),
                                    "action": result[0].userActions[0].action
                                }
                            }
                        }
                        Service.FanspickService.updateUserFixture(criteria, dataToSet, {}, function (error, response) {
                            if (error) {
                                cb(error)
                            } else {
                                cb();
                            }
                        })
                    }
                })

            } else {
                cb();
            }
        },
        function (cb) {
            var currentDate = new Date();
            // var lastActionTime = currentDate.setMinutes(currentDate.getMinutes() - 15);

            var criteriaWithActionTime = {
                "userId": new ObjectId(payloadData.userId),
                "fixtureId": new ObjectId(payloadData.fixtureId),
                "teamId": new ObjectId(payloadData.teamId)
            };

            var criteriaWithoutActionTime = {
                "_id": userFixtureData._id
            };
            var timeInUTC = UniversalFunctions.convertStringToDate(payloadData.time)
            var dataToSet = {
                "time": timeInUTC || new Date(),
                "playerId": payloadData.playerId,
                "action": payloadData.action,
                "minutes": randomInt(1, 90)
            };

            Service.FanspickService.createUserAction(criteriaWithActionTime, criteriaWithoutActionTime, dataToSet, function (err, result) {
                if (err) {
                    cb(err)
                } else {
                    cb(null, result);
                }
            })
        },
        function (cb) {
            // update userAction log schema
            var criteriaToFind = {
                userId: payloadData.userId,
                fixtureId: payloadData.fixtureId,
                teamId: payloadData.teamId,
                pitch: 'UserPick',
                isLive: true
            };
            var timeInUTC = UniversalFunctions.convertStringToDate(payloadData.time)
            var userActionToUpdate = {
                "time": timeInUTC || new Date(),
                "playerId": payloadData.playerId,
                "action": payloadData.action
            }
            updateUserActionLog(criteriaToFind, userActionToUpdate, function (error, result) {
                if (error) {
                    cb(error)
                } else {
                    cb(null, result);
                }
            })
        }
    ], function (err, data) {
        if (err) {
            callback(err);
        } else {
            callback(null, data[2]);
        }
    });
};

var updateUserActionLog = function (payloadData, userAction, callback) {
    var criteria = {
        userId: payloadData.userId,
        fixtureId: payloadData.fixtureId,
        teamId: payloadData.teamId,
        pitch: payloadData.pitch,
        isLive: payloadData.isLive
    };
    var dataToUpdate = {
        $addToSet: {
            userActions: userAction
        }
    };
    var option = { upsert: true };
    Service.FanspickService.updateUserActionLog(criteria, dataToUpdate, option, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })
}

var getSubstitutionStatus = function (query, payloadData, callback) {
    var criteria = {
        userId: query._id,
        fixtureId: payloadData.fixtureId,
        teamId: payloadData.teamId,
        isLive: true
    }
    var projection = {
        removeLineUpPlayers: 1
    }
    var options = {
        lean: true
    }
    Service.FanspickService.getUserFixture(criteria, projection, options, function (error, result) {
        if (error) {
            callback(error);
        } else if (result.length <= 0) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
        } else {
            if (result[0].removeLineUpPlayers && result[0].removeLineUpPlayers.length >= 3) {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SUBSTITUTE_LIMIT);
            } else {
                callback(null, 'You can do ' + (3 - result[0].removeLineUpPlayers.length) + ' of substituations ');
            }
        }
    })
}


// var setUserPick = function (query, payloadData, callback) {
//     var userData = {};
//     var userFixtureData = {};
//     var dateNow = new Date();
//     var Pick = {}
//     async.waterfall([
//         function (cb) {

//             getOrCreateUserFixture(query, payloadData, function (err, userFixtureDataReturned) {
//                 if (err) {
//                     cb(err)
//                 } else {
//                     userFixtureData = userFixtureDataReturned;
//                     cb(null, userFixtureData);
//                 }
//             })

//         },


//         function (err, cb) {
//             if (userFixtureData != null && userFixtureData.length != 0) {

//                 var fixture = userFixtureData;

//                 if (fixture !== undefined) {

//                     var lineUpPlayer;

//                     fixture.lineUpPlayers.forEach(function (player) {
//                         if (player.positionId._id.toString() == payloadData.positionId) {
//                             lineUpPlayer = player;
//                         }
//                     }, this);

//                     if (lineUpPlayer !== undefined) {
//                         lineUpPlayer.playerId = payloadData.playerId;
//                         lineUpPlayer.positionId = payloadData.positionId;
//                     }
//                     else {
//                         lineUpPlayer = {};
//                         lineUpPlayer.playerId = payloadData.playerId;
//                         lineUpPlayer.positionId = payloadData.positionId
//                         fixture.lineUpPlayers.push(lineUpPlayer);
//                     }

//                     var criteria = {
//                         _id: fixture._id
//                     };
//                     var options = {
//                         //upsert: true
//                     };

//                     /*Service.FanspickService.getUserFixture(criteria, {}, { lean: true }, function (err, userFixtureDataResult) {
//                         if (err) {
//                             cb(err)
//                         } else {
//                             var test = userFixtureDataResult;
//                         }
//                     }); */


//                     var dataToSet = {
//                         lineUpPlayers: fixture.lineUpPlayers,
//                         currentFormation: payloadData.formation,
//                         updatedDate: dateNow
//                     };


//                     Service.FanspickService.updateUserFixture(criteria, dataToSet, options, function (err) {
//                         if (err) {
//                             cb(err)
//                         } else {
//                             //Pick = pickData
//                             cb();
//                         }
//                     });
//                 }
//             }
//         },
//     ], function (err, result) {
//         if (err) {
//             return callback(err);
//         }
//         callback(null, "Great Success!");
//     });
// };

var setUserPick = function (query, payloadData, callback) {
    var userData = {};
    var userFixtureData = {};
    var dateNow = new Date();
    var Pick = {}
    var substitutes = [];
    async.waterfall([
        function (cb) {

            getOrCreateUserFixture(query, payloadData, function (err, userFixtureDataReturned) {
                if (err) {
                    cb(err)
                } else {
                    userFixtureData = userFixtureDataReturned;
                    cb(null, userFixtureData);
                }
            })

        },
        function (err, cb) {
            //get substitutes from manager pick
            if (payloadData.isLive) {
                var criteria = {
                    _id: new Object(payloadData.fixtureId)
                }
                var projection = {
                    localTeam: 1,
                    visitorTeam: 1
                };
                var option = {
                    lean: true
                };
                Service.FanspickService.getManagerPick(criteria, projection, option, function (error, result) {
                    if (error) {
                        cb(error);
                    } else if (result && result.length > 0) {
                        var team;
                        if (result[0].localTeam.franspickTeamId.toString() == payloadData.teamId) {
                            team = result[0].localTeam;
                        } else if (result[0].visitorTeam.franspickTeamId.toString() == payloadData.teamId) {
                            team = result[0].visitorTeam;
                        }
                        if (team && team.substitutes && team.substitutes.length > 0) {
                            substitutes = team.substitutes;
                            cb(null, substitutes);
                        } else {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SUBTITUTES_NOT_FOUND);
                        }
                    }
                })
            } else {
                cb(null, substitutes);
            }
        },
        function (err, cb) {
            if (userFixtureData != null && userFixtureData.length != 0) {

                var fixture = userFixtureData;

                if (fixture !== undefined) {

                    var lineUpPlayer;

                    fixture.lineUpPlayers.forEach(function (player) {
                        if (player.positionId._id.toString() == payloadData.positionId) {
                            lineUpPlayer = player;
                        }
                    }, this);
                    if (payloadData.isLive) {
                        //remove substituted player from substitutes array
                        var substitutedPlayer = null;
                        var indexOfSubstitutedPlayer = -1;
                        substitutes.forEach(function (player) {
                            if (player.playerId.toString() == payloadData.newPlayerId) {
                                substitutedPlayer = player;
                                indexOfSubstitutedPlayer = substitutes.indexOf(substitutedPlayer);
                            }
                        })
                        if (indexOfSubstitutedPlayer !== -1) {
                            substitutes.splice(indexOfSubstitutedPlayer, 1);
                        }
                        if (substitutedPlayer != null) {
                            if (fixture.substitutions == undefined || fixture.substitutions.length <= 0) {
                                fixture.substitutions = [];
                            }
                            var substitutions = {
                                playerInId: new ObjectId(payloadData.newPlayerId),
                                playerOutId: new ObjectId(payloadData.oldPlayerId),
                                positionId: new ObjectId(payloadData.positionId)
                            }
                            fixture.substitutions.push(substitutions);
                        }
                    }


                    if (lineUpPlayer !== undefined) {
                        lineUpPlayer.playerId = payloadData.newPlayerId;
                        lineUpPlayer.positionId = payloadData.positionId;
                    } else {
                        lineUpPlayer = {};
                        lineUpPlayer.playerId = payloadData.newPlayerId;
                        lineUpPlayer.positionId = payloadData.positionId
                        fixture.lineUpPlayers.push(lineUpPlayer);
                    }

                    var criteria = {
                        _id: fixture._id
                    };
                    var options = {
                        //upsert: true
                    };

                    var dataToSet = {
                        lineUpPlayers: fixture.lineUpPlayers,
                        currentFormation: payloadData.formation,
                        substitutes: substitutes,
                        substitutions: fixture.substitutions,
                        updatedDate: dateNow
                    };


                    Service.FanspickService.updateUserFixture(criteria, dataToSet, options, function (err) {
                        if (err) {
                            cb(err)
                        } else {
                            //Pick = pickData
                            cb();
                        }
                    });
                }
            } else {
                cb();
            }
        },
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, "Great Success!");
    });
};



var unsetUserPick = function (query, payloadData, callback) {
    var userData = {};
    var userFixtureData = {};
    var dateNow = new Date();
    var Pick = {}
    async.waterfall([
        function (cb) {

            var criteria = {
                _id: query._id
            };

            Service.FanspickService.getUser(criteria, {}, {
                lean: true
            }, function (err, teamDataResult) {
                if (err) {
                    cb(err)
                } else {
                    if (teamDataResult.length == 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.NOT_FOUND);
                    }
                    userData = teamDataResult;
                    cb(null, userData);
                }
            })
        },

        function (err, cb) {
            var criteria = {
                userId: query._id,
                fixtureId: payloadData.fixtureId,
                teamId: payloadData.teamId,
                isLive: payloadData.isLive
            };
            Service.FanspickService.getUserFixture(criteria, {}, {
                lean: true
            }, function (err, userFixtureDataResult) {
                if (err) {
                    cb(err)
                } else {
                    if (userFixtureDataResult.length == 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
                    } else {
                        userFixtureData = userFixtureDataResult[0];
                        cb(null, userFixtureData);
                    }
                }
            })
        },

        function (err, cb) {
            if (userFixtureData != null && userFixtureData.length != 0) {

                var fixture = userFixtureData;

                if (fixture !== undefined) {
                    if (fixture.removeLineUpPlayers && fixture.removeLineUpPlayers.length == 3 && payloadData.isLive) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.SUBSTITUTE_LIMIT);
                    } else {
                        var lineUpPlayer;
                        var playerIndex;
                        var removeLineUpPlayers;

                        fixture.lineUpPlayers.forEach(function (player) {
                            if (player.playerId._id.toString() == payloadData.playerId) {
                                lineUpPlayer = player;
                                playerIndex = fixture.lineUpPlayers.indexOf(lineUpPlayer);
                                fixture.removeLineUpPlayers.push(player);
                            }
                        }, this);




                        if (playerIndex !== undefined) {
                            fixture.lineUpPlayers.splice(playerIndex, 1);

                            var criteria = {
                                _id: fixture._id
                            };
                            var options = {
                                //upsert: true
                            };

                            var dataToSet = {
                                lineUpPlayers: fixture.lineUpPlayers,
                                removeLineUpPlayers: fixture.removeLineUpPlayers,
                                updatedDate: dateNow
                            };


                            Service.FanspickService.updateUserFixture(criteria, dataToSet, options, function (err) {
                                if (err) {
                                    cb(err)
                                } else {
                                    cb();
                                }
                            });
                        } else {
                            cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PLAYER_NOT_FOUND);
                        }
                    }




                }
            }
        },
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, "Great Success!");
    });
};

// var getUserPick = function (query, payloadData, callback) {

//     var userFixtureData = {};

//     var criteria = {
//         userId: query._id,
//         fixtureId: payloadData.fixtureId,
//         teamId: payloadData.teamId
//     };
//     Service.FanspickService.getUserFixture(criteria, {}, { lean: true }, function (err, userFixtureDataResult) {
//         if (err) {
//             callback(err)
//         } else {
//             if (userFixtureDataResult.length == 0) {
//                 callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
//             }
//             else {
//                 if (payloadData.isLive != undefined) {
//                     if (userFixtureDataResult.length == 2) {
//                         if (userFixtureDataResult[0].isLive == payloadData.isLive) {
//                             callback(null, createFormation(userFixtureDataResult[0]));
//                         }
//                         else {
//                             createFormation(userFixtureDataResult[1])
//                             callback(null, createFormation(userFixtureDataResult[1]));
//                         }
//                     }
//                     else if (userFixtureDataResult.length == 1) {
//                         if (userFixtureDataResult[0].isLive == payloadData.isLive) {
//                             // if (userFixtureDataResult[0].lineUpPlayers > 0) {
//                             callback(null, createFormation(userFixtureDataResult[0]));
//                             // }
//                             // else {
//                             //     callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
//                             // }
//                         }
//                         else if (payloadData.isLive == true) {
//                             userFixtureDataResult[0]['isLive'] = true;
//                             userFixtureDataResult[0]._id = null;
//                             userFixtureDataResult[0].createdDate = new Date();
//                             userFixtureDataResult[0].updatedDate = new Date();
//                             Service.FanspickService.createUserFixture(userFixtureDataResult[0], function (err, result) {
//                                 if (err) {
//                                     callback(err);
//                                 } else {
//                                     userFixtureData.formation = result.currentFormation;
//                                     userFixtureData.lineUpPlayers = result.lineUpPlayers;
//                                     userFixtureData.userActions = result.userActions;
//                                     callback(null, userFixtureData);
//                                 }
//                             })
//                         } else {
//                             callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
//                         }
//                     }
//                     else if (userFixtureDataResult.length == 0) {
//                         callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
//                     }

//                 } else {
//                     callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
//                 }
//             }
//         }
//     })

// };

var checkUserFixtureIsComplete = function (userFixture, payloadData, query, callback) {
    var fixtureDate = null;
    var isDeleted = false;
    async.series([
        function (seriesCallback) {
            //get Fixture's time
            var criteria = {
                _id: new ObjectId(payloadData.fixtureId)
            }
            var projection = {
                fixtureDate: 1
            };
            var options = {
                lean: true
            };
            Service.FanspickService.getFixtureById(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    fixtureDate = result[0].fixtureDate;
                    seriesCallback();
                } else {
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            var today = new Date();
            var minutes = fixtureDate.getMinutes();
            var minuteUTC = fixtureDate.getUTCMinutes();
            var todayUTCDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), today.getUTCHours(), today.getUTCMinutes(), today.getUTCSeconds()));
            var deadlineDate = new Date(Date.UTC(fixtureDate.getUTCFullYear(), fixtureDate.getUTCMonth(), fixtureDate.getUTCDate(), fixtureDate.getUTCHours() - 1, fixtureDate.getUTCMinutes(), fixtureDate.getUTCSeconds()))

            if (todayUTCDate >= deadlineDate && userFixture.lineUpPlayers.length < 11) {
                isDeleted = true;
            }
            var criteria = {
                userId: query._id,
                fixtureId: new ObjectId(payloadData.fixtureId),
                teamId: new ObjectId(payloadData.teamId),
                isLive: payloadData.isLive,
                $or: [{
                    isDeleted: {
                        $exists: false
                    }
                }, {
                    isDeleted: false
                }]
            };
            var dataToSave = {
                isDeleted: isDeleted
            }
            var options = {
                new: true
            };
            Service.FanspickService.updateUserFixture(criteria, dataToSave, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    userFixture = result[0];
                    seriesCallback();
                } else {
                    seriesCallback();
                }
            })

        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, isDeleted)
        }
    })
}

//new one
var getUserPick = function (query, payloadData, callback) {

    var userFixtureData = {};
    var isDeleted = false;
    var criteria = {
        userId: query._id,
        fixtureId: payloadData.fixtureId,
        teamId: payloadData.teamId,
        isLive: payloadData.isLive,
        $or: [{
            isDeleted: {
                $exists: false
            }
        }, {
            isDeleted: false
        }]
    };
    var fixtureFound = false;

    async.series([
        function (seriesCallback) {
            Service.FanspickService.getUserFixture(criteria, {}, {
                lean: true
            }, function (err, userFixtureDataResult) {
                if (err) {
                    seriesCallback(err)
                } else {
                    if (userFixtureDataResult.length == 0) {
                        if (!payloadData.isLive)
                            seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
                        else
                            seriesCallback(null)
                    } else {
                        userFixtureData = createFormation(userFixtureDataResult[0])
                        fixtureFound = true;
                        seriesCallback(null, userFixtureData);
                    }
                }
            })
        },
        function (seriesCallback) {
            //check userfixture is not deleted
            if (userFixtureData != null && payloadData.isLive == false) {
                checkUserFixtureIsComplete(userFixtureData, payloadData, query, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else if (result == true) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
                    } else {
                        seriesCallback();
                    }
                })
            } else {
                seriesCallback();
            }
        },
        function (seriesCallback) {
            if (!payloadData.isLive || fixtureFound) {
                seriesCallback(null);
            } else {
                var managersPick = {};
                var fixtureData = {};

                var criteria = {
                    $or: [{
                        "localTeam.franspickTeamId": payloadData.teamId
                    }, {
                        "visitorTeam.franspickTeamId": payloadData.teamId
                    }],
                    _id: payloadData.fixtureId
                };
                getManagersPick(query, payloadData, function (error, fixtureDataResult) {
                    if (error) {
                        seriesCallback(error)
                    } else {
                        if (fixtureDataResult.length == 0) {
                            seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FIXTURE_NOT_FOUND);
                        } else {
                            var fixtureData = {};

                            var lineUpPlayer = [];
                            fixtureDataResult.lineUpPlayers = [];
                            fixtureDataResult.actualPlayers.forEach(function (player) {
                                var playerDataToPush = {
                                    playerId: player.playerId,
                                    positionId: player.positionId._id
                                };
                                fixtureDataResult.lineUpPlayers.push(playerDataToPush);
                            })
                            fixtureDataResult.isLive = payloadData.isLive;

                            fixtureDataResult.userActions = [];
                            userFixtureData.formation = fixtureDataResult.formation._id;
                            userFixtureData.lineUpPlayers = fixtureDataResult.lineUpPlayers;
                            userFixtureData.substitutes = fixtureDataResult.substitutes;

                            seriesCallback(null, userFixtureData);
                        }
                    }
                })
            }
        },
        function (seriesCallback) {
            if (!payloadData.isLive || fixtureFound) {
                seriesCallback(null);
            } else {
                //query for userActions 
                getOrCreateUserFixture(query, payloadData, function (error, userFixture) {
                    if (error) {
                        seriesCallback(error);
                    } else if (userFixture == undefined) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FIXTURE_NOT_FOUND);
                    } else {

                        var criteria = {
                            _id: userFixture._id
                        };
                        var options = {
                            new: true
                        };

                        var dataToSet = {
                            lineUpPlayers: userFixtureData.lineUpPlayers,
                            currentFormation: userFixtureData.formation,
                            substitutes: userFixtureData.substitutes,
                            updatedDate: new Date()
                        };


                        Service.FanspickService.updateUserFixture(criteria, dataToSet, options, function (err, result) {
                            if (err) {
                                seriesCallback(err)
                            } else {
                                userFixtureData = createFormation(result)
                                seriesCallback(null, result);
                            }
                        });
                    }
                })
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            if (userFixtureData.formation != null) {
                var formationDetail = {
                    formationId: userFixtureData.formation._id
                }
                getFormationById(null, formationDetail, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        if (result.length > 0) {
                            userFixtureData.positions = result[0].positions;
                        } else {
                            userFixtureData.positions = [];
                        }
                        callback(null, userFixtureData);
                    }
                });
            } else {
                callback(null, userFixtureData);
            }
        }

    })

};


var getNewFormationWithPlayers = function (userData, payloadData, callback) {
    var userFixtureData = {};

    var criteria = {
        userId: userData._id,
        fixtureId: new ObjectId(payloadData.fixtureId),
        teamId: new ObjectId(payloadData.teamId),
        isLive: payloadData.isLive
    };
    Service.FanspickService.getUserFixtureSorted(criteria, function (err, userFixtureDataResult) {
        if (err) {
            callback(err)
        } else {
            if (userFixtureDataResult.length > 0 /*&& (userFixtureDataResult[0].lineUpPlayers.length == 11)*/) {
                var criteria = {
                    formationId: new ObjectId(payloadData.newFormationId)
                }
                Service.FanspickService.getFormationById(criteria, {}, {}, function (error, result) {
                    if (error) {
                        callback(error);
                    } else if (result.length > 0) {
                        var lineUpPlayers = adjustPlayerAccordingToFomation(userFixtureDataResult[0].lineUpPlayers, result[0].positions);
                        var criteria = {
                            _id: userFixtureDataResult[0]._id
                        }
                        var dataToUpdate = {
                            lineUpPlayers: lineUpPlayers,
                            currentFormation: result[0].formation._id
                        }
                        Service.FanspickService.updateUserFixture(criteria, dataToUpdate, {
                            new: true
                        }, function (error, response) {
                            if (error) {
                                callback(error);
                            } else {
                                callback(null);
                            }
                        })
                    } else {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                        //need to change error 
                    }
                })
            } else {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
            }
        }
    })
}

var getNewFormationWithPlayersForLiveAndPreMAtch = function (userData, payloadData, callback) {
    var userFixtureData = {};

    var criteria = {
        userId: userData._id,
        fixtureId: new ObjectId(payloadData.fixtureId),
        teamId: new ObjectId(payloadData.teamId),
        isLive: payloadData.isLive
    };

    async.series([
        function (seriesCallback) {
            //get userfixture 
            Service.FanspickService.getLineUpsUserFixture(criteria, {
                currentFormation: 1,
                lineUpPlayers: 1
            }, function (err, userFixtureDataResult) {
                if (err) {
                    seriesCallback(err)
                } else if (userFixtureDataResult == undefined || userFixtureDataResult.length <= 0) {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                } else {
                    userFixtureData = userFixtureDataResult[0];
                    seriesCallback(null);
                }
            })
        },
        function (seriesCallback) {
            //get formation's positions
            if (userFixtureData != undefined) {
                var criteria = {
                    formationId: userFixtureData.currentFormation
                }
                var projection = {};

                Service.FanspickService.getFormationById(criteria, projection, {
                    lean: true
                }, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else if (result == undefined) {
                        seriesCallback();
                    } else {
                        userFixtureData.oldLineUpPlayers = adjustPlayerAccordingToFomationForLiveAndPreMatch(userFixtureData.lineUpPlayers, result[0].positions);
                        seriesCallback();
                    }
                })
            } else {
                seriesCallback(null);
            }
        },
        function (seriesCallback) {
            if (userFixtureData != undefined && userFixtureData.oldLineUpPlayers != undefined) {
                //get positions for new formation
                var criteria = {
                    formationId: new ObjectId(payloadData.newFormationId)
                };
                var projection = {};
                var option = {
                    lean: true
                };
                Service.FanspickService.getFormationById(criteria, projection, option, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else if (result == undefined) {
                        seriesCallback();
                    } else {
                        userFixtureData.newLineUpPlayers = adjustPlayerAccordingToFomation(userFixtureData.oldLineUpPlayers, result[0].positions);
                        seriesCallback();
                    }
                })
            } else {
                seriesCallback();
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else if (userFixtureData != undefined && userFixtureData.newLineUpPlayers != undefined) {
            //update userFixture 
            var lineUpPlayers = getLineupPlayersWithPlayerId(userFixtureData.newLineUpPlayers);
            var criteria = {
                _id: userFixtureData._id
            }
            var dataToUpdate = {
                lineUpPlayers: lineUpPlayers,
                currentFormation: payloadData.newFormationId
            }
            Service.FanspickService.updateUserFixture(criteria, dataToUpdate, {
                new: true
            }, function (error, response) {
                if (error) {
                    callback(error);
                } else {
                    callback(null);
                }
            })

        } else {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
        }
    })
}

var getLineupPlayersWithPlayerId = function (lineUpPlayers) {
    var updateLineUpPlayers = [];
    for (var index = 0; index < lineUpPlayers.length; index++) {
        if (lineUpPlayers[index].playerId != null) {
            updateLineUpPlayers.push(lineUpPlayers[index]);
        }
    }
    return updateLineUpPlayers;
}

var adjustPlayerAccordingToFomation = function (lineUpPlayers, positions) {
    var lineUpPlayersNew = []
    for (var playerIndex = 0; playerIndex < lineUpPlayers.length; playerIndex++) {
        var lineUpPlayerData = {};
        lineUpPlayerData.positionId = positions[playerIndex]._id;
        lineUpPlayerData.playerId = lineUpPlayers[playerIndex].playerId;
        lineUpPlayersNew.push(lineUpPlayerData);
    }
    return lineUpPlayersNew;
}

var adjustPlayerAccordingToFomationForLiveAndPreMatch = function (lineUpPlayers, positions) {
    var lineUpPlayersNew = []
    for (var positionIndex = 0; positionIndex < positions.length; positionIndex++) {
        var lineUpPlayerData = {};
        lineUpPlayerData.positionId = positions[positionIndex]._id;
        lineUpPlayerData.playerId = null;
        for (var lineUpIndex = 0; lineUpIndex < lineUpPlayers.length; lineUpIndex++) {
            if (positions[positionIndex]._id.toString() == lineUpPlayers[lineUpIndex].positionId.toString()) {
                lineUpPlayerData.playerId = lineUpPlayers[lineUpIndex].playerId;
            }
        }
        lineUpPlayersNew.push(lineUpPlayerData);
    }
    return lineUpPlayersNew;
}



var createFormation = function (result) {
    var userFixtureData = {};
    userFixtureData.formation = result.currentFormation;
    userFixtureData.lineUpPlayers = result.lineUpPlayers;
    if (result.isLive) {
        userFixtureData.lineUpPlayers.forEach(function (eachPlayer, index, lineUpPlayers) {
            result.userActions.forEach(function (eachUserAction, index, userActions) {
                var player = eachPlayer.playerId;
                if (player._id.toString() == eachUserAction.playerId.toString()) {
                    // eachPlayer.playerId._doc["userActions"]= eachUserAction;
                    if (eachPlayer.playerId.hasOwnProperty('userActions')) {
                        eachPlayer.playerId["userActions"].push(eachUserAction);
                    } else {
                        eachPlayer.playerId["userActions"] = [];
                        eachPlayer.playerId["userActions"].push(eachUserAction);
                    }

                    // console.log(eachPlayer);
                }
            })
        })
    }

    return userFixtureData;
}




var clearUserPick = function (query, payloadData, callback) {
    var userData = {};
    var userFixtureData = {};
    var dateNow = new Date();
    var Pick = {}
    async.waterfall([
        function (cb) {

            var criteria = {
                _id: query._id
            };

            Service.FanspickService.getUser(criteria, {}, {
                lean: true
            }, function (err, teamDataResult) {
                if (err) {
                    cb(err)
                } else {
                    if (teamDataResult.length == 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.NOT_FOUND);
                    }
                    userData = teamDataResult;
                    cb(null, userData);
                }
            })
        },

        function (err, cb) {
            var criteria = {
                userId: query._id,
                fixtureId: payloadData.fixtureId,
                isLive: payloadData.isLive,
                teamId: payloadData.teamId
            };
            Service.FanspickService.getUserFixture(criteria, {}, {
                lean: true
            }, function (err, userFixtureDataResult) {
                if (err) {
                    cb(err)
                } else {
                    if (userFixtureDataResult.length == 0) {
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
                    } else {
                        // userFixtureData = userFixtureDataResult[0];
                        Service.FanspickService.removeUserFixture(criteria, {}, {}, function (err, result) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null, result);
                            }
                        })
                        // cb(null, userFixtureData);
                    }
                }
            })
        },

        function (err, cb) {
            if (userFixtureData != null && userFixtureData.length != 0) {

                var fixture = userFixtureData;

                if (fixture !== undefined) {

                    fixture.lineUpPlayers = [];

                    var criteria = {
                        _id: fixture._id
                    };
                    var options = {
                        //upsert: true
                    };

                    var dataToSet = {
                        lineUpPlayers: fixture.lineUpPlayers,
                        updatedDate: dateNow
                    };

                    Service.FanspickService.updateUserFixture(criteria, dataToSet, options, function (err) {
                        if (err) {
                            cb(err)
                        } else {
                            cb();
                        }
                    });



                }
            }
        },
    ], function (err, result) {
        if (err) {
            return callback(err);
        }
        callback(null, "Great Success!");
    });
};

var getAllFixtures = function (callback) {
    var options = {
        lean: true
    },
        projection = {
            "localTeam.players": false,
            "visitorTeam.players": false,
            commentaries: false,
            substitutions: false
        },
        query = {}

    Service.FanspickService.getUpcomingFixtures(query, projection, options, -1, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res)
        }
    })
};
var getPlayerIDs = function (players) {
    var playerIDArray = [];
    players.players.forEach(function (teamData) {
        var player = teamData;
        var stringFormattedID = player.playerId.toString();
        playerIDArray.push(stringFormattedID);
    }, this);
    return playerIDArray;
}
var updateAndGetManagerPick = function (query, payloadData, callback) {
    Service.FanspickService.getUpcomingFixturesForBothTeams(payloadData, {}, {
        lean: true
    }, function (err, fixtureDataResult) {
        if (err) {
            callback(err)
        } else {
            if (fixtureDataResult.length == 0) {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FIXTURE_NOT_FOUND);
            } else {
                var fixtureData = {};
                fixtureData.players = [];
                var row1 = 0;
                var row2 = 0;
                var row3 = 0;
                var row4 = 0;

                var playerIDArray = [];
                var formationId = null;
                var dataToUpdate = {
                    formationId: formationId
                };
                var playersToSave = [];

                fixtureDataResult[0].team.forEach(function (teamData) {
                    var player = teamData.players;
                    var playerDataToSave = {
                        "playerPos": player.playerPos,
                        "playerName": player.playerName,
                        "playerId": player.playerId,
                        "positionId": player.detail.Positions[0]._id
                    };
                    playersToSave.push(playerDataToSave);
                    player['playerPositionX'] = player.isStatic ? player.playerPositionX : player.detail.Positions[0].PosX;
                    player['playerPositionY'] = player.isStatic ? player.playerPositionY : player.detail.Positions[0].PosY;

                    player['role'] = player.isStatic ? player.role : player.detail.Positions[0].Role;

                    fixtureData.players.push(player);

                    var stringFormattedID = player.playerId.toString();
                    playerIDArray.push(stringFormattedID);
                    switch (player.playerPositionX) {
                        case 2:
                            row1 += 1;
                            break;
                        case 3:
                            row2 += 1;
                            break;
                        case 4:
                            row3 += 1;
                            break;
                        case 5:
                            row4 += 1;
                            break;
                        default:
                    }


                }, this);

                fixtureData.formation = row1 > 0 ? row1.toString() : '';

                fixtureData.formation = fixtureData.formation + (row2 > 0 ? row2.toString() : '');
                fixtureData.formation = fixtureData.formation + (row3 > 0 ? row3.toString() : '');
                fixtureData.formation = fixtureData.formation + (row4 > 0 ? row4.toString() : '');
                dataToUpdate.players = playersToSave;

                async.parallel([
                    function (parallelCallback) {
                        if (fixtureDataResult[0].team.formation == undefined || fixtureDataResult[0].team.formation == null) {
                            var criteria = {
                                type: fixtureData.formation
                            }
                            Service.FanspickService.getFormation(criteria, {}, {}, function (error, result) {
                                if (error) {
                                    parallelCallback(error);
                                } else {
                                    if (result && result.length > 0)
                                        formationId = result[0]._id;
                                    dataToUpdate.formationId = formationId;
                                    parallelCallback(null, result);
                                }
                            })
                        } else {
                            parallelCallback(null);
                        }
                    },
                    function (parallelCallback) {
                        //query for userActions 
                        getUserActions(playerIDArray, payloadData, fixtureData, function (err, fixtureData) {
                            if (err) {
                                parallelCallback(err);
                            } else {
                                parallelCallback(null, fixtureData);
                            }
                        })
                    }
                ], function (error, result) {
                    //update fixture
                    if (error) {
                        callback(error);
                    } else {
                        if (formationId != null) {
                            updateFixtureData(fixtureDataResult[0]._id, fixtureDataResult[0].team[0].franspickTeamId, dataToUpdate, function (error, result) {
                                if (error) {
                                    callback(error);
                                } else {

                                    callback(null, fixtureData);
                                }
                            })
                        } else {
                            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FORMATION_NOT_FOUND);
                        }

                    }
                })


            }
        }
    })
}
var getManagerPickWithFormation = function (query, payloadData, callback) {
    var criteria = {
        $or: [{
            "localTeam.franspickTeamId": payloadData.teamId
        }, {
            "visitorTeam.franspickTeamId": payloadData.teamId
        }],
        _id: payloadData.fixtureId
    };
    var projection = {
        'visitorTeam.summary': 0,
        'visitorTeam.coaches': 0,
        'visitorTeam.stats': 0,
        // 'visitorTeam.livePlayers': 0,
        // 'visitorTeam.substitutes': 0,
        'visitorTeam.substitutions': 0,
        'visitorTeam.managerPick': 0,
        'localTeam.summary': 0,
        'localTeam.coaches': 0,
        'localTeam.stats': 0,
        // 'localTeam.livePlayers': 0,
        // 'localTeam.substitutes': 0,
        'localTeam.substitutions': 0,
        'localTeam.managerPick': 0
    }
    var fixtureData = {};
    fixtureData.needToUpdate = false;
    Service.FanspickService.getManagerPick(criteria, projection, {
        lean: true
    }, function (error, fixtureDetail) {
        if (error) {
            callback(error);
        } else if (fixtureDetail.length > 0) {
            if (fixtureDetail[0].localTeam.franspickTeamId.toString() == payloadData.teamId) {
                if (fixtureDetail[0].localTeam.formation == null)
                    fixtureData.needToUpdate = true;
                fixtureData.team = fixtureDetail[0].localTeam;
            } else if (fixtureDetail[0].visitorTeam.franspickTeamId.toString() == payloadData.teamId) {
                if (fixtureDetail[0].visitorTeam.formation == null)
                    fixtureData.needToUpdate = true;
                fixtureData.team = fixtureDetail[0].visitorTeam;
            }
            callback(null, fixtureData);
        } else {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
        }
    })
}

var getManagersPick = function (query, payloadData, callback) {

    var managersPick = {};
    var needToUpdate = false;
    payloadData.userId = query._id;
    var resultFixtureData;
    async.waterfall([
        function (seriesCallback) {
            getManagerPickWithFormation(query, payloadData, function (error, fixtureData) {
                if (error) {
                    seriesCallback(error);
                } else {
                    //return managerPick
                    seriesCallback(null, fixtureData)
                }
            })
        },
        function (fixtureDetail, seriesCallback) {
            if (fixtureDetail.needToUpdate) {
                updateAndGetManagerPick(query, payloadData, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        resultFixtureData = result;
                        //return managerPick
                        getManagerPickWithFormation(query, payloadData, function (error, fixtureData) {
                            if (error) {
                                seriesCallback(error);
                            } else {
                                //return managerPick
                                seriesCallback(null, fixtureData)
                            }
                        })

                        // seriesCallback(null, result)
                    }
                })
            } else {
                seriesCallback(null, fixtureDetail)
            }
        },
        function (fixtureDetail, seriesCallback) {
            if (fixtureDetail.team != null) {
                var playerIDArray = getPlayerIDs(fixtureDetail.team);
                getUserActions(playerIDArray, payloadData, fixtureDetail, function (err, result) {
                    if (err) {
                        seriesCallback(err);
                    } else {
                        resultFixtureData = result;
                        seriesCallback(null, resultFixtureData);
                    }
                })
            } else {
                seriesCallback(null, fixtureDetail)
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            var managerPick = createFormatForManagerPick(resultFixtureData.team);
            callback(null, managerPick);
        }
    })
};

var createFormatForManagerPick = function (data) {
    data['actualPlayers'] = data.players;
    data.players = [];
    data.players = data.livePlayers;
    delete data.livePlayers;
    return data;
}

//update fixture Data 
var updateFixtureData = function (fixtureId, teamId, dataToUpdate, callback) {
    var options = {
        new: true
    }
    async.parallel([
        function (parallelCallback) {
            var criteria = {
                _id: fixtureId,
                'localTeam.franspickTeamId': teamId
            }
            var dataToSet = {
                'localTeam.players': dataToUpdate.players,
                'localTeam.formation': dataToUpdate.formationId
            }
            Service.FanspickService.updateFixtureData(criteria, dataToSet, options, function (error, result) {
                if (error) {
                    parallelCallback(error);
                } else {
                    parallelCallback(null, result);
                }
            })
        },
        function (parallelCallback) {
            var criteria = {
                _id: fixtureId,
                'visitorTeam.franspickTeamId': teamId
            }
            var dataToSet = {
                'visitorTeam.players': dataToUpdate.players,
                'visitorTeam.formation': dataToUpdate.formationId
            }
            Service.FanspickService.updateFixtureData(criteria, dataToSet, options, function (error, result) {
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
            callback(null, result);
        }
    })
}



var calculateFormation = function (fixtureDataResult, callback) {
    fixtureDataResult[0].team.forEach(function (teamData) {
        async.series([
            function (seriesCallback) {
                var player = teamData.players;
                player['playerPositionX'] = player.isStatic ? player.playerPositionX : player.detail.Positions[0].PosX;
                player['playerPositionY'] = player.isStatic ? player.playerPositionY : player.detail.Positions[0].PosY;

                player['role'] = player.isStatic ? player.role : player.detail.Positions[0].Role;
                fixtureData.players.push(player);

                var stringFormattedID = player.playerId.toString();
                playerIDArray.push(stringFormattedID);
                switch (player.playerPositionX) {
                    case 2:
                        row1 += 1;
                        break;
                    case 3:
                        row2 += 1;
                        break;
                    case 4:
                        row3 += 1;
                        break;
                    case 5:
                        row4 += 1;
                        break;
                    default:
                }
            }
        ], function (error, result) {

        })
    })
    fixtureDataResult[0].team.forEach(function (teamData) {
        var player = teamData.players;
        player['playerPositionX'] = player.isStatic ? player.playerPositionX : player.detail.Positions[0].PosX;
        player['playerPositionY'] = player.isStatic ? player.playerPositionY : player.detail.Positions[0].PosY;

        player['role'] = player.isStatic ? player.role : player.detail.Positions[0].Role;
        fixtureData.players.push(player);

        var stringFormattedID = player.playerId.toString();
        playerIDArray.push(stringFormattedID);
        switch (player.playerPositionX) {
            case 2:
                row1 += 1;
                break;
            case 3:
                row2 += 1;
                break;
            case 4:
                row3 += 1;
                break;
            case 5:
                row4 += 1;
                break;
            default:
        }


    }, this);

    fixtureData.formation = row1.toString();

    fixtureData.formation = fixtureData.formation + row2.toString();
    fixtureData.formation = fixtureData.formation + row3.toString();
    fixtureData.formation = fixtureData.formation + row4.toString();

    callback()
}

var getUserActions = function (playerIDArray, payloadData, fixtureData, callback) {
    Service.FanspickService.getUserActions(playerIDArray, payloadData, function (err, userActions) {
        if (err) {
            callback(err);
        } else if (userActions.length > 0) {
            fixtureData.players.forEach(function (eachPlayer) {
                userActions.forEach(function (eachUserAction) {
                    if (eachPlayer.playerId.toString() == eachUserAction.userActions.playerID) {
                        eachPlayer.userActions = eachUserAction.userActions;
                    }
                })
            })
            callback(null, fixtureData);
        } else {
            callback(null, fixtureData);
        }
    });
}

function getPlayerPositions(fixtureId, playerId, callback) {
    var player = {};
    var criteriaStaticStatus = {
        fixtureId: fixtureId,
        playerId: playerId
    }
    Service.FanspickService.getStaticPositionStatus(criteriaStaticStatus, {}, function (err, result) {
        if (err) {
            callback(err);
        } else if (result && result.length > 0 && result[0].isStatic) {
            player.playerPositionX = result[0].posX;
            player.playerPositionY = result[0].posY;
            player.role = result[0].role;
            callback(null, player);
        } else {
            var criteria = {
                Position: player.playerPos
            }
            Service.FanspickService.getPositionFromDB(criteria, function (err, result) {
                if (err) {
                    callback(err);
                } else if (result && result.length > 0 && result[0].isStatic) {
                    player.playerPositionX = result[0].PosX;
                    player.playerPositionY = result[0].PosY;
                    player.role = result[0].Role;
                    callback(null, player);
                }
            })
        }
    })

}

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}
var getUserpickAndManagersPickPercentage = function (query, payloadData, callback) {
    var criteria = {
        fixtureId: new ObjectId(payloadData.fixtureId),
        teamId: new ObjectId(payloadData.teamId),
        isLive: false,
        userId: query._id
    };
    var projection = {};
    var options = {
        lean: true
    };
    Service.FanspickService.getUserpickAndManagersPickPercentage(criteria, projection, options, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })
}

var getFanspickAndManagersPickPercentage = function (query, payloadData, callback) {

    var managersPick = {};
    var fixtureData = {};
    payloadData.userId = query._id;
    var criteria = {
        $or: [{
            "localTeam.franspickTeamId": payloadData.teamId
        }, {
            "visitorTeam.franspickTeamId": payloadData.teamId
        }],
        _id: payloadData.fixtureId
    };
    var projection = {};
    var options = {
        lean: true
    };

    var criteriaFanspickFixture = {
        fixtureId: new ObjectId(payloadData.fixtureId),
        teamId: new ObjectId(payloadData.teamId),
        isLive: false
    };
    Service.FanspickService.getFanspickAndManagersPickPercentage(criteriaFanspickFixture, projection, options, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })
    /*
        Service.FanspickService.getUpcomingFixturesForBothTeams(payloadData, projection, options, function (err, fixtureDataResult) {
            if (err) {
                callback(err)
            } else {
                if (fixtureDataResult.length == 0) {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FIXTURE_NOT_FOUND);
                }
                else {
                    Service.FanspickService.getFanspickFixture(criteriaFanspickFixture, projection, options, function (err, fanspickFixture) {
                        if (err) {
                            callback(err);
                        }
                        else if (fanspickFixture.length == 0) {
                            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FIXTURE_NOT_FOUND);
                        } else {
                            var points = calculateManaPickPercentage(fixtureDataResult[0].team, fanspickFixture[0]);
                            var percentage = (points * 100) / 11;
                            callback(null, Math.round(percentage));
                        }
                    })
    
                }
            }
        })*/
};

var getManagersPickPercentage = function (query, payloadData, callback) {

    var managersPick = {};
    var fixtureData = {};
    payloadData.userId = query._id;
    var criteria = {
        $or: [{
            "localTeam.franspickTeamId": payloadData.teamId
        }, {
            "visitorTeam.franspickTeamId": payloadData.teamId
        }],
        _id: payloadData.fixtureId
    };
    var projection = {};
    var options = {
        lean: true
    };

    var criteriaFanspickFixture = {
        fixtureId: new ObjectId(payloadData.fixtureId),
        teamId: new ObjectId(payloadData.teamId),
        isLive: false
    };

    Service.FanspickService.getUpcomingFixturesForBothTeams(payloadData, projection, options, function (err, fixtureDataResult) {
        if (err) {
            callback(err)
        } else {
            if (fixtureDataResult.length == 0) {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FIXTURE_NOT_FOUND);
            } else {
                Service.FanspickService.getFanspickFixture(criteriaFanspickFixture, projection, options, function (err, fanspickFixture) {
                    if (err) {
                        callback(err);
                    } else if (fanspickFixture.length == 0) {
                        callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FIXTURE_NOT_FOUND);
                    } else {
                        var points = calculateManaPickPercentage(fixtureDataResult[0].team, fanspickFixture[0]);
                        var percentage = (points * 100) / 11;
                        callback(null, Math.round(percentage));
                    }
                })

            }
        }
    })
}
var calculateManaPickPercentage = function (managerPick, fanspick) {
    var count = 0;
    fanspick.lineUpPlayers.forEach(function (eachFanspickPlayer) {
        if (eachFanspickPlayer.playerId != null) {
            managerPick.forEach(function (eachElement) {
                if (eachElement.players != null) {
                    if (eachElement.players.playerId.toString() == eachFanspickPlayer.playerId._id.toString()) {
                        count++;
                    }
                }
            })
        }
    });
    return count;
}



var getNotification = function (query, payloadData, callback) {
    var notificationData = {};

    var criteria = {
        _id: payloadData.notificationID
    };

    var projection = {};

    var options = {};


    Service.FanspickService.getNotification(criteria, projection, options, function (err, res) {
        if (err) {
            callback(err)
        } else {

            if (res !== undefined) {
                if (res.length != 0) {
                    notificationData = res[0]
                    callback(null, notificationData)
                } else {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                }
            }
        }
    })

};

//ageVerification

var ageVerification = function (query, payloadData, callback) {


    var dateOfBirth = payloadData.dob;

    var verifiedDate = new Date();
    verifiedDate.setFullYear(verifiedDate.getFullYear() - 18);

    if (dateOfBirth <= verifiedDate) {
        callback(null, "Verified");
    } else {
        callback("Date Not Verified");
    }

    //if the user

};

var getFixtureData = function (query, payloadData, callback) {
    var teamData = {};

    var criteria = {
        _id: payloadData.fixtureId
    };

    var projection = {
        localTeam: false,
        visitorTeam: false,
        substitutions: false
    };

    var options = {};


    Service.FanspickService.getUpcomingFixtures(criteria, projection, options, -1, function (err, res) {
        if (err) {
            callback(err)
        } else {

            if (res !== undefined) {
                if (res.length != 0) {
                    teamData = res[0]

                    if (teamData.commentaries !== undefined) {
                        sortManager.sortBy(teamData.commentaries, (o) => -o.commentaryId);
                    }

                    callback(null, teamData)
                } else {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                }
            }
        }
    })

};

var getFixtureStatus = function (query, payloadData, callback) {
    var teamData = {};

    var criteria = {
        _id: payloadData.fixtureId
    };

    var projection = {
        localTeam: false,
        visitorTeam: false,
        substitutions: false,
        commentaries: false
    };

    var options = {};


    Service.FanspickService.getUpcomingFixtures(criteria, projection, options, -1, function (err, res) {
        if (err) {
            callback(err)
        } else {

            if (res !== undefined) {
                if (res.length != 0) {
                    teamData = res[0]
                    callback(null, teamData)
                } else {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                }
            }
        }
    })

};

var getSponsorBillboards = function (userId, payloadData, callback) {
    var resultBillboards = [];
    var criteria = {
        fixtureId: payloadData.fixtureId,
        active: true,
        sponsorImageType: payloadData.sponsorImageType
    }
    var projection = {
        // bannerImage: 1,
        // hyperlink: 1,
        // billboardImage: 1,
        // billboardColor: 1

    };
    var options = {};
    Service.FanspickService.getSponsorBillboards(criteria, projection, options, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })
}


var getFanspickFixture = function (query, payloadData, callback) {
    var fanspickFixture = {};

    var criteria = {
        teamId: payloadData.teamId,
        fixtureId: payloadData.fixtureId,
        isLive: payloadData.isLive
    };

    var projection = {
        userActions: 0
    };

    var options = {
        lean: true
    };
    var fanspickFixture = {};

    async.series([
        function (seriesCallback) {
            Service.FanspickService.getFanspickFixture(criteria, projection, options, function (err, res) {
                if (err) {
                    seriesCallback(err)
                } else if (res && res.length > 0) {
                    fanspickFixture = res[0];
                    seriesCallback(null, res);
                } else {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                }
            })
        },
        function (seriesCallback) {
            Service.FanspickService.getFanspickFixtureAggregate(criteria, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result && result.length > 0) {
                    fanspickFixture.actionStats = result[0].actionStats;
                    seriesCallback();
                } else {
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            isLineUpPlayerValid(fanspickFixture.lineUpPlayers, function (isValid) {
                if (isValid) {
                    mergeUserActionsData(query, payloadData, fanspickFixture, function (err, res) {
                        seriesCallback(null, res);
                    });
                } else {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_INCOMPLETE);
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, fanspickFixture);
        }
    })
    /*
    Service.FanspickService.getFanspickFixtureAggregate(criteria, function (err, res) {
        if (err) {
            callback(err)
        } else {

            if (res !== undefined) {
                if (res.length != 0) {
                    fanspickFixture = res[0]
                    isLineUpPlayerValid(fanspickFixture.lineUpPlayers, function (isValid) {
                        if (isValid) {
                            mergeUserActionsData(query, payloadData, fanspickFixture, function (err, res) {
                                callback(null, res);
                            });
                        } else {
                            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FANSPICK_INCOMPLETE);
                        }
                    })
                } else {
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                }
            }
        }
    })
*/
};

var isLineUpPlayerValid = function (lineUpPlayers, callback) {
    var valid = true;
    // if (lineUpPlayers.length < 11) {
    //     valid = false;
    // } else {
    //     lineUpPlayers.forEach(function (eachPlayerDetail) {
    //         if (eachPlayerDetail.playerId == undefined || eachPlayerDetail.playerId == null) {
    //             valid = false;
    //         }
    //     })
    // }
    callback(valid);
}

var mergeUserActionsData = function (query, payloadData, fanspickFixture, callback) {
    getFanspickUserActionStat(query, payloadData, function (err, userActionsData) {
        if (userActionsData != null && userActionsData.userActions != undefined && userActionsData.userActions.length > 0 &&
            fanspickFixture != null && fanspickFixture.lineUpPlayers != undefined && fanspickFixture.lineUpPlayers.length > 0) {
            userActionsData.userActions.forEach(function (userAction) {
                fanspickFixture.lineUpPlayers.forEach(function (lineUpPlayer) {
                    if (lineUpPlayer.playerId._id.toString() == userAction.playerId.toString()) {
                        if (lineUpPlayer.userActions == undefined) {
                            lineUpPlayer.userActions = [];
                        }
                        lineUpPlayer.userActions.push(userAction);
                    }
                });
            });
        }
        callback(null, fanspickFixture);
    });
};



var getFanspickUserActionStat = function (query, payloadData, callback) {
    var userActionsData = {};
    var fixtureCriteria = {
        teamId: new ObjectId(payloadData.teamId),
        fixtureId: new ObjectId(payloadData.fixtureId),
        isLive: payloadData.isLive
    };
    var userActionCriteria = {
        'userActions.current': true
    };

    var projection = {
        "fixtureId": 1,
        "userActions": 1,
        "isLive": 1,
        "teamId": 1
    };

    Service.FanspickService.getFanspickUserActionStat(fixtureCriteria, userActionCriteria, projection, function (err, res) {
        if (err) {
            callback(err)
        } else {

            if (res !== undefined) {
                if (res.length != 0) {
                    userActionsData = res[0]
                    callback(null, userActionsData)
                } else {
                    callback(null);
                    //callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                }
            }
        }
    })

};

var logout = function (token, userData, callback) {
    TokenManager.expireToken(token, function (err, data) {
        if (!err && data) {
            //to set active false when user logout
            // var criteria = {
            //     _id: userData._id
            // };
            // var dataToSet = {
            //     active: false,
            // };
            // Service.FanspickService.updateUser(criteria, dataToSet, {
            //     lean: true
            // }, function (err, userData) {
            //     if (err) {
            //         return callback(err);
            //     }
            //     // callback();
            // });
            callback(null, UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT);
        } else {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.TOKEN_ALREADY_EXPIRED)
        }
    })
};

var getTeamsDetailsForCompetitionId = function (payloadData, callback) {
    var competitionIdObj = new ObjectId(payloadData.competitionId);
    var query = [{
        $match: {
            "_id": competitionIdObj
        }
    },
    {
        $unwind: "$teamMini"
    },
    {
        $lookup: {
            from: "teams",
            localField: "teamMini.teamFeedID",
            foreignField: "teamFeedID",
            as: "teamMini.detail"
        }
    },
    {
        $unwind: '$teamMini.detail'
    },
    {
        $project: {
            "_id": "$_id",
            "competitionFeedId": "$competitionFeedId",
            "countryId": "$countryId",
            "competitionName": "$competitionName",
            "teamMini._id": "$teamMini._id",
            "teamMini.teamFeedID": "$teamMini.teamFeedID",
            "teamMini.overallStats": "$teamMini.overallStats",
            "teamMini.homeStats": "$teamMini.homeStats",
            "teamMini.awayStats": "$teamMini.awayStats",
            "teamMini.points": "$teamMini.points",
            "teamMini.leaguePosition": "$teamMini.leaguePositionc",
            "teamMini.teamKnownName": "$teamMini.teamKnownName",
            "teamMini.teamId": "$teamMini.detail._id",
            "teamMini.coachId": "$teamMini.detail.coachId",
            "teamMini.coachName": "$teamMini.detail.coachName",
            "teamMini.fullName": "$teamMini.detail.fullName",
            "teamMini.sportId": "$teamMini.detail.sportId",
            "teamMini.isNationalTeam": "$teamMini.detail.isNationalTeam",
            // "teamMini.teamLogo": "$teamMini.detail.teamLogo",
            "teamMini.imageURL": "$teamMini.detail.imageURL",
            "teamMini.homePoints": {
                $sum: [{
                    $multiply: ['$teamMini.homeStats.Wins', 3]
                }, '$teamMini.homeStats.Draws']
            },
            "teamMini.awayPoints": {
                $sum: [{
                    $multiply: ['$teamMini.awayStats.Wins', 3]
                }, '$teamMini.awayStats.Draws']
            },
        }
    },
    {
        $sort: {
            "teamMini.points": -1
        }
    }
    ];

    Service.FanspickService.getTeamsDetailsForCompetitionId(query, function (err, result) {
        if (err)
            callback(err);
        else if (result.length <= 0) {
            // callback(null,UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
            callback(null);
        } else {
            callback(null, result);
        }
    })
}

var getPlayersDetailForCompetitionId = function (payloadData, callback) {
    var competitionIdObj = new ObjectId(payloadData.competitionId);
    var query = [{
        $unwind: '$competitions'
    }, {
        $match: {
            "competitions.competitionId": competitionIdObj
        }
    },
    {
        $unwind: '$squadData'
    },
    {
        $lookup: {
            from: 'playerdatas',
            localField: 'squadData.playerId',
            foreignField: '_id',
            as: 'playerDetail'
        }
    }, {
        $unwind: '$playerDetail'
    },
    {
        $project: {
            'players._id': "$playerDetail._id",
            'players.playerFeedId': '$playerDetail.playerFeedId',
            'players.imageURL': '$playerDetail.imageURL',
            "players.fanspickTeamId": '$playerDetail.fanspickTeamId',
            "players.weight": '$playerDetail.weight',
            "players.height": '$playerDetail.height',
            "players.position": '$playerDetail.position',
            "players.birthplace": '$playerDetail.birthplace',
            "players.birthcountry": '$playerDetail.birthcountry',
            "players.age": '$playerDetail.age',
            "players.birthdate": '$playerDetail.birthdate',
            "players.nationality": '$playerDetail.nationality',
            "players.teamid": '$playerDetail.teamid',
            "players.team": '$playerDetail.team',
            "players.knownName": "$playerDetail.knownName",
            "players.lastname": "$playerDetail.lastname",
            "players.firstname": "$playerDetail.firstname",
            "players.name": "$playerDetail.name",
            "players.redcards": "$squadData.redcards",
            "players.yellowred": "$squadData.yellowred",
            "players.yellowcards": "$squadData.yellowcards",
            "players.assists": "$squadData.assists",
            "players.goals": "$squadData.goals",
            "players.substitute_in": "$squadData.substitute_in",
            "players.number": "$squadData.number"
        }
    },
    {
        $sort: {
            "players.goals": -1
        }
    }, {
        $limit: 10
    }
    ];

    Service.FanspickService.getPlayersDetailForCompetitionId(query, function (err, result) {
        if (err)
            callback(err);
        else if (result.length <= 0) {
            callback(null, UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.RECORD_NOT_FOUND);
        } else {
            callback(null, result);
        }
    })
}

var getLiveScores = function (payload, callback) {
    var criteria = {
        _id: new ObjectId(payload.fixtureId)
    }
    var projection = {
        awayTeamScore: 1,
        homeTeamScore: 1
    }
    Service.FanspickService.getFixtureById(criteria, projection, {}, function (err, result) {
        if (err) {
            callback(err);
        } else {
            if (result.length <= 0) {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
            } else
                callback(null, result);
        }
    });
}
var getUserpickPercentage = function (userData, payload, callback) {
    var criteria = {
        userId: userData._id,
        fixtureId: new ObjectId(payload.fixtureId),
        teamId: new ObjectId(payload.teamId)
    }
    Service.FanspickService.getUserpickPercentage(criteria, {}, {
        lean: true
    }, function (err, result) {
        if (err) {
            callback(err);
        } else {
            if (result.length <= 0) {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
            } else
                callback(null, result);
        }
    });


}

var getUserpickVsFanspickPercentageLive = function (userData, payload, callback) {
    var criteria = {
        userId: userData._id,
        fixtureId: new ObjectId(payload.fixtureId),
        teamId: new ObjectId(payload.teamId)
    }
    Service.FanspickService.getUserpickVsFanspickPercentageLive(criteria, {}, {
        lean: true
    }, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

var getUserpickVsManagerPickPercentageLive = function (userData, payload, callback) {
    var criteria = {
        userId: userData._id,
        fixtureId: new ObjectId(payload.fixtureId),
        teamId: new ObjectId(payload.teamId)
    }
    Service.FanspickService.getUserpickVsManagerPickPercentageLive(criteria, {}, {
        lean: true
    }, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

var getFanspickVsManagerPickPercentageLive = function (userData, payload, callback) {
    var criteria = {
        // userId: userData._id,
        fixtureId: new ObjectId(payload.fixtureId),
        teamId: new ObjectId(payload.teamId)
    }
    Service.FanspickService.getFanspickVsManagerPickPercentageLive(criteria, {}, {
        lean: true
    }, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}



// get all formations
var getAllFormations = function (userData, callback) {
    var criteria = {};
    var projection = {};
    Service.FanspickService.getAllFormations(criteria, projection, {}, function (error, result) {
        if (error) {
            callback(error);
        } else if (result.length <= 0) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
        } else {
            callback(null, result);
        }
    });
}


var getFormationById = function (userData, payload, callback) {
    var criteria = {
        formationId: new ObjectId(payload.formationId)
    };
    var projection = {};
    Service.FanspickService.getFormationById(criteria, projection, {}, function (error, result) {
        if (error) {
            callback(error);
        } else if (result.length <= 0) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
        } else {
            callback(null, result);
        }
    });
}

var getFormationByType = function (userData, payload, callback) {
    var formationDetail;
    payload["formationId"] = null;
    async.series([
        function (seriesCallback) {
            var criteria = {
                type: payload.type
            };
            var projection = {
                _id: 1
            };
            var options = {
                lean: true
            };
            Service.FanspickService.getFormation(criteria, projection, options, function (error, result) {
                if (error) seriesCallback(error);
                else if (result.length > 0) {
                    payload["formationId"] = result[0]._id;
                    seriesCallback(null);
                } else {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FORMATION_NOT_FOUND);
                }
            })
        },
        function (seriesCallback) {
            getFormationById(userData, payload, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result.length <= 0) {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                } else {
                    formationDetail = result[0];
                    seriesCallback(null, result);
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else if (formationDetail.length <= 0) {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
        } else {
            callback(null, formationDetail);
        }
    })
}

var getUserPickIOS = function (query, payloadData, callback) {

    var userFixtureData = {};

    var criteria = {
        userId: query._id,
        fixtureId: payloadData.fixtureId,
        teamId: payloadData.teamId,
        isLive: payloadData.isLive
    };
    var fixtureFound = false;

    async.series([
        function (seriesCallback) {
            Service.FanspickService.getUserFixture(criteria, {}, {
                lean: true
            }, function (err, userFixtureDataResult) {
                if (err) {
                    seriesCallback(err)
                } else {
                    if (userFixtureDataResult.length == 0) {
                        if (!payloadData.isLive)
                            seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
                        else
                            seriesCallback(null)
                    } else {
                        userFixtureData = createFormation(userFixtureDataResult[0])
                        fixtureFound = true;
                        seriesCallback(null, userFixtureData);
                    }
                }
            })
        },
        function (seriesCallback) {
            if (!payloadData.isLive || fixtureFound) {
                seriesCallback(null);
            } else {
                var managersPick = {};
                var fixtureData = {};

                var criteria = {
                    $or: [{
                        "localTeam.franspickTeamId": payloadData.teamId
                    }, {
                        "visitorTeam.franspickTeamId": payloadData.teamId
                    }],
                    _id: payloadData.fixtureId
                };
                getManagersPick(query, payloadData, function (error, fixtureDataResult) {
                    if (error) {
                        seriesCallback(error)
                    } else {
                        if (fixtureDataResult.length == 0) {
                            seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FIXTURE_NOT_FOUND);
                        } else {
                            var fixtureData = {};

                            var lineUpPlayer = [];
                            fixtureDataResult.lineUpPlayers = [];
                            fixtureDataResult.players.forEach(function (player) {
                                var playerDataToPush = {
                                    playerId: player.playerId,
                                    positionId: player.positionId._id
                                };
                                fixtureDataResult.lineUpPlayers.push(playerDataToPush);
                            })
                            fixtureDataResult.isLive = payloadData.isLive;

                            fixtureDataResult.userActions = [];
                            userFixtureData.formation = fixtureDataResult.formation._id;
                            userFixtureData.lineUpPlayers = fixtureDataResult.lineUpPlayers;

                            seriesCallback(null, userFixtureData);
                        }
                    }
                })
            }
        },
        function (seriesCallback) {
            if (!payloadData.isLive || fixtureFound) {
                seriesCallback(null);
            } else {
                //query for userActions 
                getOrCreateUserFixture(query, payloadData, function (error, userFixture) {
                    if (error) {
                        seriesCallback(error);
                    } else if (userFixture == undefined) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FIXTURE_NOT_FOUND);
                    } else {

                        var criteria = {
                            _id: userFixture._id
                        };
                        var options = {
                            new: true
                        };

                        var dataToSet = {
                            lineUpPlayers: userFixtureData.lineUpPlayers,
                            currentFormation: userFixtureData.formation,
                            updatedDate: new Date()
                        };


                        Service.FanspickService.updateUserFixture(criteria, dataToSet, options, function (err, result) {
                            if (err) {
                                seriesCallback(err)
                            } else {
                                userFixtureData = createFormation(result)
                                seriesCallback(null, result);
                            }
                        });
                    }
                })
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            if (userFixtureData.formation != null) {
                var formationDetail = {
                    formationId: userFixtureData.formation._id
                }
                getFormationById(null, formationDetail, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        if (result.length > 0) {
                            userFixtureData.positions = result[0].positions;

                        } else {
                            userFixtureData.positions = [];
                        }
                        userFixtureData = updatePositionsWithLineupPlayers(userFixtureData);
                        callback(null, userFixtureData);
                    }
                });
            } else {
                callback(null, userFixtureData);
            }
        }
    })
};

var updatePositionsWithLineupPlayers = function (userFixtureData) {
    var positionArray = userFixtureData.positions;
    var lineUpPlayerArray = userFixtureData.lineUpPlayers;
    positionArray.forEach(function (eachPosition) {
        lineUpPlayerArray.forEach(function (eachLineUp) {
            if (eachLineUp.positionId._id.toString() == eachPosition._id.toString()) {
                eachPosition['playerId'] = eachLineUp.playerId;
            }
        })
    });
    userFixtureData.positions = positionArray;
    return userFixtureData;
}

var getManagerPickV2 = function (query, payloadData, callback) {
    var projection = {
        'visitorTeam.summary': 0,
        'visitorTeam.coaches': 0,
        'visitorTeam.stats': 0,
        // 'visitorTeam.livePlayers': 0,
        'visitorTeam.substitutes': 0,
        'visitorTeam.substitutions': 0,
        'visitorTeam.managerPick': 0,
        'visitorTeam.players.playerName': 0,
        'visitorTeam.players.playerPos': 0,
        'localTeam.summary': 0,
        'localTeam.coaches': 0,
        'localTeam.stats': 0,
        // 'localTeam.livePlayers': 0,
        'localTeam.substitutes': 0,
        'localTeam.substitutions': 0,
        'localTeam.managerPick': 0,
        'localTeam.players.playerName': 0,
        'localTeam.players.playerPos': 0,

    }
    var fixtureData = {};

    async.series([
        //get manager pick with formation
        function (seriesCallback) {
            getManagerPickWithFormationV2(payloadData, projection, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    fixtureData = result;
                    seriesCallback(null);
                }
            })
        },
        //get positions for formation
        function (seriesCallback) {
            if (!fixtureData.needToUpdate) {
                var payload = {
                    formationId: fixtureData.team.formation._id
                }
                getFormationById(null, payload, function (err, result) {
                    if (err) {
                        seriesCallback(err);
                    } else {
                        if (result.length > 0) {
                            fixtureData.positions = result[0].positions;
                        } else {
                            fixtureData.positions = [];
                        }
                        seriesCallback(null);
                    }
                });
            } else {
                if (!fixtureData.team.formation) {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FORMATION_NOT_FOUND);
                } else {
                    seriesCallback(null);
                }
            }
        },
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            if (fixtureData.team.players && fixtureData.team.players.length > 0) {
                var userData = {};
                userData.formation = fixtureData.team.formation;
                userData.lineUpPlayers = fixtureData.team.livePlayers;
                userData.positions = fixtureData.positions;
                callback(null, userData);
            } else {
                callback(null, UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
            }
        }
    })
}


var getManagerPickWithFormationV2 = function (payloadData, projection, callback) {
    var criteria = {
        $or: [{
            "localTeam.franspickTeamId": payloadData.teamId
        }, {
            "visitorTeam.franspickTeamId": payloadData.teamId
        }],
        _id: payloadData.fixtureId
    };

    var fixtureData = {};
    fixtureData['needToUpdate'] = false;
    Service.FanspickService.getManagerPickV2(criteria, projection, {
        lean: true
    }, function (error, fixtureDetail) {
        if (error) {
            callback(error);
        } else if (fixtureDetail.length > 0) {
            if (fixtureDetail[0].localTeam.franspickTeamId.toString() == payloadData.teamId) {
                if (fixtureDetail[0].localTeam.formation == null)
                    fixtureData.needToUpdate = true;
                fixtureData['team'] = fixtureDetail[0]._doc.localTeam;
            } else if (fixtureDetail[0].visitorTeam.franspickTeamId.toString() == payloadData.teamId) {
                if (fixtureDetail[0].visitorTeam.formation == null)
                    fixtureData.needToUpdate = true;
                fixtureData['team'] = fixtureDetail[0]._doc.visitorTeam;
            }
            callback(null, fixtureData);
        } else {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
        }
    })
}

var getFanspickFixtureV2 = function (query, payloadData, callback) {
    var fanspickFixture = {};

    var criteria = {
        teamId: payloadData.teamId,
        fixtureId: payloadData.fixtureId,
        isLive: payloadData.isLive
    };

    var projection = {
        //        localTeam: false,
        //       visitorTeam: false,
        //        substitutions: false,
        //        commentaries: false
    };

    var options = {};
    async.series([
        //get fanspick formation
        function (seriesCallback) {
            Service.FanspickService.getFanspickFixture(criteria, projection, options, function (err, res) {
                if (err) {
                    seriesCallback(err)
                } else {

                    if (res !== undefined) {
                        if (res.length != 0) {
                            fanspickFixture = res[0];
                            seriesCallback(null);
                        } else {
                            seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND)
                        }
                    } else {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                    }
                }
            })
        },
        //get positions for formation
        function (seriesCallback) {
            if (fanspickFixture.formationId != null) {
                var payload = {
                    formationId: fanspickFixture.formationId._id
                }
                getFormationById(null, payload, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        if (result.length > 0) {
                            fanspickFixture.positions = result[0].positions;
                        } else {
                            fanspickFixture.positions = [];
                        }
                        seriesCallback(null);
                    }
                })
            } else {
                seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.FORMATION_NOT_FOUND);
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            var userData = {
                formation: fanspickFixture.formationId,
                lineUpPlayers: fanspickFixture.lineUpPlayers,
                positions: fanspickFixture.positions
            };
            callback(null, userData);
        }
    })



};

var getRegisteredContacts = function (userData, callback) {
    var registeredContacts = [];
    var userRecordExist = false;
    var userRecord = {
        _id: null,
        userId: userData._id,
        groups: [],
        registeredContacts: [],
        nonRegisteredContacts: []
    };
    var userContacts = {};
    async.series([
        function (seriesCallback) {
            //get all contacts with groups
            var criteria = {
                userId: userData._id
            }
            var projection = {
                userId: 1,
                groups: 1
            },
                options = {
                    lean: true
                };
            Service.FanspickService.getUserContacts(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    userRecord._id = result[0]._id;
                    userRecord.userId = result[0].userId;
                    userRecord.groups = result[0].groups;
                    seriesCallback();
                } else {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                }
            })
        },
        function (seriesCallback) {
            //get registered contacts 
            var criteria = {
                userId: userData._id
            };
            Service.FanspickService.getRegisteredContacts(criteria, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    userRecord.registeredContacts = result[0].contacts;
                    seriesCallback();
                } else {
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            //get non-registered contacts 
            var criteria = {
                userId: userData._id
            };
            Service.FanspickService.getNonRegisteredContacts(criteria, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    userRecord.nonRegisteredContacts = result[0].contacts;
                    seriesCallback();
                } else {
                    seriesCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, userRecord);
        }
    })
}

var getChatsForGroup = function (userData, payload, callback) {
    var criteria = {
        groupId: payload.groupId
    };
    var projection = {},
        options = {
            lean: true
        };
    var isGroupConnectToUser = false;
    var chatHistory = {};
    var groupDetailFromDB = null;
    var groupType = UniversalFunctions.CONFIG.APP_CONSTANTS.CHAT_GROUP_TYPE.ONE_TO_ONE;
    async.series([ 
        function(seriesCallback){
            //check group type
            var localCriteria = {
                _id : new ObjectId(payload.groupId),
                'groupMembers.addedAt' : {$exists : true},
                groupMembers:{$elemMatch : {memberId:userData._id}}
            };
            var localProjection = {
                type : 1,
                'groupMembers.$.addedAt':1
            };
            var localOption = { lean : true };
            Service.FanspickService.getGroup(localCriteria, localProjection, localOption, function(error, result){
                if(error){
                    seriesCallback(error);
                }else if(result && result.length > 0){
                    groupType = result[0].type;
                    groupDetailFromDB = result[0];
                    seriesCallback(null, result);
                }else{
                    seriesCallback();
                }
            })
        },
        function(seriesCallback){
            if(groupDetailFromDB && groupDetailFromDB.type == UniversalFunctions.CONFIG.APP_CONSTANTS.CHAT_GROUP_TYPE.ONE_TO_MANY){
                criteria.addedAt = groupDetailFromDB.groupMembers[0].addedAt;
                groupType = UniversalFunctions.CONFIG.APP_CONSTANTS.CHAT_GROUP_TYPE.ONE_TO_MANY;
                seriesCallback();
            }else{
                seriesCallback();
            }
        },
        function (seriesCallback) {
            Service.FanspickService.getGroupChatAggregated(criteria,groupType, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    chatHistory = result[0];
                    var filteredChat = filterDeletedChat(chatHistory.chats, userData._id);
                    chatHistory.chats = filteredChat;
                    seriesCallback(null, result);
                } else {
                    seriesCallback(null);
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, chatHistory);
        }
    })
}


var filterDeletedChat = function (chats, userId) {

    var filteredChat = chats.filter(function (chat) {
        var index = -1;
        if (chat.deletedBy) {
            index = chat.deletedBy.map(function (el) {
                return el.toString();
            }).indexOf(userId.toString());
        }
        if (index < 0) {
            return chat;
        }
    })
    return filteredChat;
}

// To delete chat 

var deleteChatsForGroup = function (userData, payload, callback) {
    var criteria = {
        groupId: payload.groupId,
        userId: userData._id,
        messageIds: payload.messageIds
    };
    var projection = {},
        options = {
            lean: true
        };
    var isGroupConnectToUser = false;
    var chatHistory = {};
    async.series([
        function (seriesCallback) {
            //check group exist 
            var criteria = {
                _id: new ObjectId(payload.groupId),
                'groupMembers': { $elemMatch: { memberId: new ObjectId(userData._id) } }
            }
            var projection = {}, options = { lean: true };
            Service.FanspickService.getGroup(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result && result.length > 0) {
                    seriesCallback(null);
                } else {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.GROUP_NOT_EXIST);
                }
            })
        },
        function (seriesCallback) {
            if (payload.type == "All") {
                Service.FanspickService.deleteAllChatsForGroup(criteria, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else if (result == undefined || result.length <= 0) {
                        seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.GROUP_NOT_EXIST);
                    } else {
                        // isGroupConnectToUser = true;
                        seriesCallback(null, result);
                    }
                })
            } else if (payload.type == "Selected") {
                if (criteria.messageIds && criteria.messageIds.length > 0) {
                    Service.FanspickService.deleteSelectedChatsForGroup(criteria, function (error, result) {
                        if (error) {
                            seriesCallback(error);
                        } else if (result == undefined || result.length <= 0) {
                            seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.GROUP_NOT_EXIST);
                        } else {
                            seriesCallback(null, result);
                        }
                    })
                } else {
                    seriesCallback(null);
                }

            }
        },

    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null);
        }
    })
}

var getRecentChats = function (userData, payload, callback) {
    var userName = userData.username;
    var finalResult = {
        userData: {
            _id: userData._id,
            username: userData.username
        },
        chats: []
    };

    Service.FanspickService.getRecentGroupChat(userData._id, function (error, result) {
        if (error) {
            callback(error);
        } else {
            finalResult.chats = result;
            finalResult.chats.sort(function (a, b) {
                return b.chats.time - a.chats.time;
            });

            var memberphoneNumber = [];
        
            result.forEach(function (member) {
                for (var index = 0; index < member.groupMembers.length; index++) {
                    memberphoneNumber.push(member.groupMembers[index].memberId.phoneNumber);  
                }          
            });
            
            var unqiue = memberphoneNumber.filter((x, i, a) => a.indexOf(x) == i);
            var Results = finalResult.chats;

            var criteria = {
                userId: userData._id
            };
            var projection = {},
                options = {
                    lean: true
                };

            Service.FanspickService.getUserContacts(criteria, projection, options, function (error, result) {
                if (error) {
                    callback(error);
                }
                else if(result == undefined || result.length <= 0){
                    callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.CONTACTS_NOT_FOUND);
                }
                else{
                  
                    var userC = result[0].contacts;
                    var numberObject = [];
                    unqiue.forEach(function (number) {
                        for (var i = 0; i < userC.length; i++) {
                            if (userC[i].contactNo === number) {
                                numberObject.push({
                                    'number': number,
                                    'name': userC[i].name
                                });
                            }
                        }
                    });
                    Results.forEach(function (member) {
                        numberObject.forEach(function (element) {
                            for (var index = 0; index < member.groupMembers.length; index++) {
                                if (member.groupMembers[index].memberId.phoneNumber == element.number) {
                                        member.groupMembers[index].memberId["name"] = element.name;
                                    } 
                            }     

                        });

                    });
                    // finalResult.chats = filterDeletedChatForRecent(finalResult.chats, userData._id);
                    callback(null, finalResult);
                }
            })
        }
    });

}
var filterDeletedChatForRecent = function (chats, userId) {

    var filteredChat = chats.filter(function (chat) {
        var index = -1;
        if (chat.chats.deletedBy) {
            index = chat.chats.deletedBy.map(function (el) {
                return el.toString();
            }).indexOf(userId.toString());
        }
        if (index < 0) {
            return chat;
        }
    })
    return filteredChat;
}

var generateOTP = function (payloadData, callback) {

    var randomNumber = CodeGenerator.generateRandomNumbers(4, []);
    var currentDate = new Date();
    var validUpto = new Date();
    var createdDate = new Date();
    var userId;
    createdDate.setMinutes(currentDate.getMinutes() - UniversalFunctions.CONFIG.APP_CONSTANTS.OTP_EXPIRATION_TIME);
    validUpto.setMinutes(currentDate.getMinutes() + UniversalFunctions.CONFIG.APP_CONSTANTS.OTP_EXPIRATION_TIME);
    async.series([
        function (seriesCallback) {
            //get previously valid otp
            var criteria = {
                createdOn: {
                    $gt: createdDate,
                    $lte: validUpto
                }
            };
            var dataToUpdate = {
                createdOn: createdDate
            };
            var option = {
                multi: true
            };
            Service.FanspickService.updateOTP(criteria, dataToUpdate, option, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            //get previously valid otp
            // while used for signup
          if(payloadData.signUp){  
            var criteria = {
                phoneNumber:payloadData.phoneNumber
            };
           
            var option = {
                lean: true
            };
            Service.FanspickService.getUser(criteria, option, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if(result != undefined && result.length > 0){
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PHONE_ALREADY_EXIST);
                }  
                else {
                    seriesCallback();
                }
            })
          }else{
             seriesCallback();
          }
        },
        function (seriesCallback) {
            //get previously valid otp
            // while used for forgot password
          if(!payloadData.signUp){  
            var criteria = {
                phoneNumber:payloadData.phoneNumber
            };
           
            var option = {
                lean: true
            };
            Service.FanspickService.getUser(criteria, option, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if(result == undefined || result.length <= 0){
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PHONE_NOT_REGISTERED);
                }  
                else {
                    userId=  result[0]._id;
                    seriesCallback();
                }
            })
          }else{
             seriesCallback();
          }
        },
        function (seriesCallback) {
            async.parallel([
                function (parallelCallback) {
                    //create new otp
                    var dataToSave = {
                        otp: randomNumber,
                        createdOn: currentDate,
                        // userId: userData._id
                        userId: userId
                    };
                    Service.FanspickService.generateOTP(dataToSave, function (error, result) {
                        if (error) {
                            parallelCallback(error);
                        } else {
                            parallelCallback();
                        }
                    })
                },
                function (parallelCallback) {
                    //send otp to user
                    NotificationManager.sendSMSToUser(randomNumber, payloadData.phoneNumber, function (error, result) {
                        if (error) {
                            parallelCallback(error);
                        } else {
                            parallelCallback();
                        }
                    })
                }
            ], function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback();
        }
    })
} 

var verifyOTP = function (payload, callback) {
    var currentDate = new Date();
    var currentDateTime = currentDate.getTime();
    var validUpto = new Date();
    validUpto.setMinutes(currentDate.getMinutes() - UniversalFunctions.CONFIG.APP_CONSTANTS.OTP_EXPIRATION_TIME);
    var validUptoTime = validUpto.getTime();
    var criteria = {
        // createdOn: { $gte: validUpto, $lte: currentDate }
        otp: payload.otp
    };
    var projection = {

    };
    var option = {
        lean: true
    };
    Service.FanspickService.getOTP(criteria, projection, option, function (error, result) {
        if (error) {
            callback(error);
        } else if (result != undefined && result.length > 0) {
            var createdOn = result[0].createdOn.getTime();
            if (createdOn >= validUptoTime && createdOn <= currentDate) {
                callback(null, {
                    isFound: true
                });
            } else {
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.OTP_EXPIRED);
            }
        } else {
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INCORRECT_OTP);
        }
    })
}

var getTeamsForCompetitionName = function (userData, payload, callback) {
    var criteria = {
        competitionName: payload.competitionName
    };
    var projection = {
        _id: 1
    };
    var option = {
        lean: true
    };
    var competitionId = null;
    var response;
    async.series([
        function (seriesCallback) {
            //get competition id
            Service.FanspickService.getCompetitions(criteria, projection, option, function (error, result) {
                if (error) {
                    return seriesCallback(error);
                } else if (result != undefined && result.length > 0) {
                    competitionId = result[0]._id;
                    seriesCallback();
                } else {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                }
            })
        },
        function (seriesCallback) {
            //getTeamsForCompetition
            getTeamsForCompetition(userData, {
                competitionId: competitionId
            }, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    response = result;
                    seriesCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, response);
        }
    })
}

var changeStringDateToObject = function (dateString1, timeString) {
    var dateString = dateString1.replace(/\./g, '/'); // Oct 23
    var dateParts = dateString.split("/");
    var timePart = timeString.split(":")
    var dateObject = new Date(Date.UTC(dateParts[2], dateParts[1] - 1, dateParts[0], timePart[0], timePart[1], 0));
    return dateObject;
}

var changeFixtureTime = function (payload, callback) {
    var fixtureDate = changeStringDateToObject(payload.date, payload.time);
    var criteria = {
        _id: new ObjectId(payload.fixtureId)
    };
    var dataToSave = {
        fixtureDate: fixtureDate,
        time: payload.time
    };
    var options = {
        new: true
    };
    Service.FanspickService.updateFixtureData(criteria, dataToSave, options, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null);
        }
    })
}

var changeMatchStatus = function (payload, callback) {
    var criteria = {
        _id: new ObjectId(payload.fixtureId)
    };
    var dataToSave = {
        matchStatus: payload.matchStatus,
        statusTime: payload.statusTime
    };
    var options = {
        new: true
    };
    Service.FanspickService.updateFixtureData(criteria, dataToSave, options, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null);
        }
    })
}

var getMarqueeLeagueResult = function (userData, payload, callback) {
    var newsText = "";
    var finalResult = {};
    var competitionId = null;
    async.series([
        function (seriesCallback) {
            //get competitionId
            var criteria = {
                _id: payload.fixtureId
            };
            var projection = {
                competitionId: 1
            };
            var options = {
                lean: true
            };
            Service.FanspickService.getFixtureById(criteria, projection, options, function (error, result) {
                if (error) {
                    callback(error);
                } else {
                    if (result != undefined && result.length > 0) {
                        competitionId = result[0].competitionId;
                        seriesCallback();
                    } else {
                        seriesCallback();
                    }
                }
            })
        },
        function (seriesCallback) {
            if (competitionId == null) {
                //error 
                seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
            } else {
                Service.FanspickService.getCurrentMatchesInfo(competitionId, {}, {}, function (error, response) {
                    if (error) {
                        callback(error);
                    } else if (response.response.length == 0) {
                        var result = {};
                        result.competitionId = response.competitionId;
                        result.newsText = 'Live scores will show here.'
                        result.bgcolour = '#D3D3D3';
                        result.count = 0;
                        callback(null, result);

                    } else if (response.response.length > 0) {
                        var newsText = response.response[0].competitionName + ": ";
                        response.response.forEach(function (eachFixture) {
                            if (eachFixture.localTeam !== undefined) {
                                newsText += eachFixture.localTeam.name + " ";
                                if (eachFixture.homeTeamScore !== undefined && eachFixture.homeTeamScore != null)
                                    newsText += eachFixture.homeTeamScore + " - ";
                                else
                                    newsText += 0 + " - ";
                            }

                            if (eachFixture.visitorTeam !== undefined) {
                                if (eachFixture.awayTeamScore !== undefined && eachFixture.awayTeamScore != null) {
                                    newsText += eachFixture.awayTeamScore;
                                } else
                                    newsText += 0;
                                newsText += " " + eachFixture.visitorTeam.name;
                            }
                            newsText += ", ";

                        });
                        newsText = newsText.substring(0, newsText.length - 2);

                        finalResult.competitionId = response.competitionId;
                        finalResult.newsText = newsText;
                        finalResult.bgcolour = '#ffff00';
                        finalResult.count = response.response.length;
                        seriesCallback(null);
                    }
                })
            }
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, finalResult);
        }
    })



};

var updateTeamShirtImageURL = function (payload, callback) {
    Service.FanspickService.updateTeamShirtImageURL(payload.teams, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null);
        }
    })
}

//get pitch players except seleted player and goal keeper
var getPitchPlayers = function (userData, payloadData, callback) {
    var criteria = {
        userId: userData._id,
        fixtureId: payloadData.fixtureId,
        teamId: payloadData.teamId,
        isLive: payloadData.isLive
    }
    var projection = {
        lineUpPlayers: 1
    }
    var options = {
        lean: true
    };
    Service.FanspickService.getUserFixture(criteria, projection, options, function (error, result) {
        if (error) {
            callback(error);
        } else if (result != undefined && result.length > 0) {
            var filteredPlayers = filterPitchPlayers(result[0].lineUpPlayers, payloadData.selectedPlayerId);
            callback(null, filteredPlayers);
        } else {
            //user fixture not found
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
        }
    })
}

var filterPitchPlayers = function (players, selectedPlayer) {
    var lineUpPlayers = [];
    for (var index = 0; index < players.length; index++) {
        var currentPlayer = players[index];
        if (currentPlayer.positionId['Key'] != '1_3' && currentPlayer.playerId._id.toString() != selectedPlayer) {
            lineUpPlayers.push(currentPlayer);
        }
    }
    return lineUpPlayers;
}

//swap selected players
var swapPlayers = function (userData, payloadData, callback) {
    var criteria = {
        userId: userData._id,
        fixtureId: payloadData.fixtureId,
        teamId: payloadData.teamId,
        isLive: payloadData.isLive
    }
    var projection = {
        lineUpPlayers: 1
    };
    var options = {
        lean: true
    };
    Service.FanspickService.getUserFixture(criteria, projection, options, function (error, result) {
        if (error) {
            callback(error);
        } else if (result != undefined && result.length > 0) {
            var userFixture = result[0];
            // check players exists in user fixture
            var oldPlayerDetail, newPlayerDetail;
            var newLineUpPlayers = [];
            for (var index = 0; index < userFixture.lineUpPlayers.length; index++) {
                var currentPlayer = {
                    playerId: userFixture.lineUpPlayers[index].playerId._id,
                    positionId: userFixture.lineUpPlayers[index].positionId._id
                };
                if (payloadData.oldPlayerId == currentPlayer.playerId.toString()) {
                    oldPlayerDetail = currentPlayer;
                } else if (payloadData.newPlayerId == currentPlayer.playerId.toString()) {
                    newPlayerDetail = currentPlayer;
                } else {
                    newLineUpPlayers.push(currentPlayer);
                }
            }
            if (oldPlayerDetail != undefined && newPlayerDetail != undefined) {
                var oldPlayerPosition = oldPlayerDetail.positionId;
                var newPlayerPositon = newPlayerDetail.positionId;
                oldPlayerDetail.positionId = newPlayerPositon;
                newPlayerDetail.positionId = oldPlayerPosition;
                newLineUpPlayers.push(oldPlayerDetail);
                newLineUpPlayers.push(newPlayerDetail);
                //update user fixture 
                var criteria = {
                    _id: userFixture._id
                }
                var dataToSet = {
                    lineUpPlayers: newLineUpPlayers
                }
                var options = {};
                Service.FanspickService.updateUserFixture(criteria, dataToSet, options, function (error, result) {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null);
                    }
                })
            } else {
                // playerIds doesn't exists in lineupplayers
                callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.PLAYER_NOT_FOUND);
            }
        } else {
            // userfixture not found
            callback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USERFIXTURE_NOT_FOUND);
        }
    })
}

var updateLoginStatus = function (userData, payloadData, callback) {
    // update onceLogin field in user profile
    var loginStatus = payloadData.onceLogin;
    var criteria = {
        _id: userData._id
    };
    var dataToUpdate = {
        onceLogin: loginStatus.toLowerCase()
    };
    var option = {
        new: true
    };
    Service.FanspickService.updateUser(criteria, dataToUpdate, option, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null);
        }
    })
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/tmp/my-uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
    }
})

var uploadFile = function (query, request, reply) {
    var data = request.payload;
    console.log("file found");
    if (data.file) {
        var name = query._id + "-" + data.file.hapi.filename;
        var path = Path.resolve(".") + "/uploads/" + name;
        var file = fsExtra.createWriteStream(path);
        file.on('error', function (err) {
            console.error(err)
            reply(err);
        });

        data.file.pipe(file);

        data.file.on('end', function (err) {
            console.log("file created");
            var ret = {
                filename: name,
                headers: data.file.hapi.headers
            }
            uploadFileToServer(path, name, function (error, result) {
                if (error) {
                    reply(error);
                } else {
                    reply(null, ret);
                }
            });
        })

    }

};


var uploadFileToServer = function (path, fileName, callback) {
    console.log("file uploadig on server");
    var serverPath = Config.APP_CONSTANTS.ImageServer.Profile_URL + fileName;
    var ftpClient = new ftp();
    ftpClient.on('ready', function () {
        ftpClient.put(path, serverPath, function (err) {
            if (err) callback(err);
            ftpClient.end();
            callback();
        });
    });
    ftpClient.connect({
        host: Config.APP_CONSTANTS.ImageServer.IP_Address,
        user: Config.APP_CONSTANTS.ImageServer.username,
        password: Config.APP_CONSTANTS.ImageServer.password
    });

}

var getFileData = function (fileName, callback) {
    var path = Path.resolve(".") + "\\uploads\\" + fileName;
    fsExtra.readFile(path, "utf8", function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            console.log(data);
        }
    });
}
var deleteFile = function (fileName, callback) {
    var path = Path.resolve(".") + "/uploads/" + fileName;
    fsExtra.delete(path, function (err) {
        console.log('error deleting file>>', err)
        callback();
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
    createUser: createUser,
    loginUser: loginUser,
    checkUsername: checkUsername,
    eventLoging: eventLoging,
    getAllTopic: getAllTopic,
    getAllCommunity: getAllCommunity,
    loginViaAccessToken: loginViaAccessToken,
    getResetPasswordToken: getResetPasswordToken,
    resetPassword: resetPassword,
    changePassword: changePassword,
    UpdateUser: UpdateUser,
    getSports: getSports,
    getCountriesForSport: getCountriesForSport,
    getLeaguesForCountry: getLeaguesForCountry,
    getTeamsForCompetition: getTeamsForCompetition,
    getTeamsForCountry: getTeamsForCountry,
    setFavouriteTeam: setFavouriteTeam,
    unSetFavouriteTeam: unSetFavouriteTeam,
    getMyCommunity: getMyCommunity,
    viewProfile: viewProfile,
    getChatData: getChatData,
    getTeamSquad: getTeamSquad,
    setUserPick: setUserPick,
    getUpcomingFixtures: getUpcomingFixtures,
    unsetUserPick: unsetUserPick,
    getUserPick: getUserPick,
    clearUserPick: clearUserPick,
    getManagersPick: getManagersPick,
    getAllFixtures: getAllFixtures,
    getAllTopicAsTopicdatas: getAllTopicAsTopicdatas,
    getPlayerData: getPlayerData,
    createUserAction: createUserAction,
    getTopicByFixture: getTopicByFixture,
    getTeamData: getTeamData,
    getNotification: getNotification,
    getFixtureData: getFixtureData,
    getFixtureStatus: getFixtureStatus,
    getOrCreateUserFixture: getOrCreateUserFixture,
    getSponsorBillboards: getSponsorBillboards,
    getFanspickFixture: getFanspickFixture,
    getFanspickUserActionStat: getFanspickUserActionStat,
    logout: logout,
    getTeamsDetailsForCompetitionId: getTeamsDetailsForCompetitionId,
    getPlayersDetailForCompetitionId: getPlayersDetailForCompetitionId,
    getAllFavouriteTeams: getAllFavouriteTeams,
    getLiveScores: getLiveScores,
    getUserpickPercentage: getUserpickPercentage,
    getManagersPickPercentage: getManagersPickPercentage,
    getAllFormations: getAllFormations,
    getFormationById: getFormationById,
    getSubstitutionStatus: getSubstitutionStatus,
    getNewFormationWithPlayers: getNewFormationWithPlayers,
    getUserPickIOS: getUserPickIOS,
    getManagerPickV2: getManagerPickV2,
    getFanspickFixtureV2: getFanspickFixtureV2,
    getFormationByType: getFormationByType,
    getRegisteredContacts: getRegisteredContacts,
    getChatsForGroup: getChatsForGroup,
    getRecentChats: getRecentChats,
    generateOTP: generateOTP,
    verifyOTP: verifyOTP,
    getTeamsForCompetitionName: getTeamsForCompetitionName,
    getPlayerDataWithStatistics: getPlayerDataWithStatistics,
    changeFixtureTime: changeFixtureTime,
    getMarqueeLeagueResult: getMarqueeLeagueResult,
    updateTeamShirtImageURL: updateTeamShirtImageURL,
    getFanspickAndManagersPickPercentage: getFanspickAndManagersPickPercentage,
    getUserpickAndManagersPickPercentage: getUserpickAndManagersPickPercentage,
    getTeamSubstitutes: getTeamSubstitutes,
    getUserpickVsFanspickPercentageLive: getUserpickVsFanspickPercentageLive,
    getUserpickVsManagerPickPercentageLive: getUserpickVsManagerPickPercentageLive,
    getFanspickVsManagerPickPercentageLive: getFanspickVsManagerPickPercentageLive,
    getNewFormationWithPlayersForLiveAndPreMAtch: getNewFormationWithPlayersForLiveAndPreMAtch,
    changeMatchStatus: changeMatchStatus,
    getPitchPlayers: getPitchPlayers,
    swapPlayers: swapPlayers,
    updateLoginStatus: updateLoginStatus,
    deleteChatsForGroup: deleteChatsForGroup,
    uploadFile: uploadFile,
    getFileData: getFileData,
    resetForgotPassword:resetForgotPassword
    //addCommunity: addCommunity
};