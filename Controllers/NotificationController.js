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
var Constants = require('../Lib/Constants');



var markAllUserNotificationsAsRead = function (userData, callback) {
    var userNotifications = {};
    var criteria = {};
    var projection = {};
    var options = { lean: true };
    var dataToSet = {};
    async.series([
        function (cb) {
            criteria = { userId: userData._id, isRead: false };
            projection = { _id: 1 };
            Service.UserNotificationService.getAllUserNotification(criteria, projection, options, function (err, userNotificationsData) {
                if (err) {
                    return callback(err);
                }
                else {
                    userNotifications = userNotificationsData;
                    cb();
                }
            });


        },
        function (cb) {
            if (userNotifications !== undefined && userNotifications.length > 0) {
                userNotifications.forEach(function (userNotification, userNotificationIdx, userNotifications) {
                    criteria = { _id: userNotification._id };
                    var dataToSet = {
                        isRead: true,
                        readDate: new Date()
                    };
                    Service.UserNotificationService.updateUserNotification(criteria, dataToSet, options, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        if (userNotificationIdx === userNotifications.length - 1) {
                            cb();
                        }
                    });
                }, this);

            }
            else { cb(); }
        }
    ], function (err, data) {
        if (err) return callback(err);
        callback(null);
    });
};



var markAllUserNotificationsAsDeleted = function (userData, callback) {
    var userNotifications = {};
    var criteria = {};
    var projection = {};
    var options = { lean: true };
    var dataToSet = {};
    async.series([
        function (cb) {
            criteria = { userId: userData._id};
            projection = { _id: 1 };
            Service.UserNotificationService.getAllUserNotification(criteria, projection, options, function (err, userNotificationsData) {
                if (err) {
                    return callback(err);
                }
                else {
                    userNotifications = userNotificationsData;
                    cb();
                }
            });
        },
        function (cb) {
            if (userNotifications !== undefined && userNotifications.length > 0) {
                userNotifications.forEach(function (userNotification, userNotificationIdx, userNotifications) {
                    criteria = { _id: userNotification._id };
                    var dataToSet = {
                        isDeleted: true,
                        deletedDate: new Date()
                    };
                    Service.UserNotificationService.updateUserNotification(criteria, dataToSet, options, function (err) {
                        if (err) {
                            return callback(err);
                        }
                        if (userNotificationIdx === userNotifications.length - 1) {
                            cb();
                        }
                    });
                }, this);

            }
            else { cb(); }
        }
    ], function (err, data) {
        if (err) return callback(err);
        callback(null);
    });
};



var updateUserNotification = function (userData, payloadData, callback) {

    var criteria = { userId: userData._id, notificationId: new ObjectId(payloadData.notificationId) };
    var options = { new: true };
    var dataToSet = {
        isRead: payloadData.readStatus,
        readDate: new Date(),
        isDeleted: payloadData.deletedStatus,
        deletedDate: new Date()
    };

    Service.UserNotificationService.updateUserNotification(criteria, dataToSet, options, function (err,result) {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null);
        }
    });
};


var getUserNotifications = function (userData, callback) {
    var criteria = { userId: userData._id, isDeleted: { $ne: true } };
    var options = { lean: true };
    var projection = {};
    var populateModel = {
        path: "notificationId"
    };

    Service.UserNotificationService.getAllUserNotificationPopulate(criteria, projection, options, populateModel, function (err, userNotificationsData) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, userNotificationsData);
        }
    });


};


var createNotificationResponse = function (userData, payloadData, callback) {

    var notificationResponse = {};
    async.series([
        function (cb) {
            var criteria = {
                userId: userData._id,
                notificationId: new ObjectId(payloadData.notificationId)
            };

            var projection = { _id: 1 };
            var options = { lean: true };
            Service.notificationResponseService.get(criteria, projection, options, function (err, notificationResponseData) {
                if (err) {
                    return callback(err);
                }
                else {
                    notificationResponse = notificationResponseData;
                    cb();
                }
            });
        },
        function (cb) {
            if (notificationResponse === undefined || notificationResponse === null || notificationResponse.length === 0) {
                var finalDataToSave = {};
                finalDataToSave.userId = userData._id;
                finalDataToSave.notificationId = new ObjectId(payloadData.notificationId);
                finalDataToSave.responseDate = new Date();
                finalDataToSave.lat = payloadData.lat;
                finalDataToSave.long = payloadData.long;
                finalDataToSave.questionResponse = {
                    questionId: new ObjectId(payloadData.questionId),
                    questionText: payloadData.questionText,
                    response: payloadData.response
                };

                Service.notificationResponseService.create(finalDataToSave, function (err, res) {
                    if (err) {
                        callback(err)
                    } else {
                        cb();
                    }
                });
            }
            else {
                cb();
            }
        },
        function (cb) {
            if (notificationResponse === undefined || notificationResponse === null || notificationResponse.length === 0) {
                var criteria = { userId: userData._id, notificationId: new ObjectId(payloadData.notificationId) };
                var options = { lean: true };
                var dataToSet = {
                    isDeleted: true,
                    deletedDate: new Date()
                };

                Service.UserNotificationService.updateUserNotification(criteria, dataToSet, options, function (err) {
                    if (err) {
                        return callback(err);
                    }
                    else {
                        cb();
                    }
                });
            }
            else {
                cb();
            }
        }

    ], function (err, data) {
        if (err) return callback(err);
        callback(null);
    });
};



module.exports = {
    markAllUserNotificationsAsRead: markAllUserNotificationsAsRead,
    markAllUserNotificationsAsDeleted: markAllUserNotificationsAsDeleted,
    updateUserNotification: updateUserNotification,
    getUserNotifications: getUserNotifications,
    createNotificationResponse: createNotificationResponse
};