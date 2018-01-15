'use strict';

var Models = require('../Models');
var Config = require('../Config');
var Constants = require('../Lib/Constants');
var async = require('async');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var ObjectId = require('mongoose').Types.ObjectId;


var getAllUserNotification = function (criteria, projection, options, callback) {
    Models.userNotification.find(criteria, projection, options, callback);
};

var getAllUserNotificationPopulate = function (criteria, projection, options, populateModel, callback) {
    Models.userNotification.find(criteria, projection, options).populate(populateModel).exec(callback);
};


var updateUserNotification = function (criteria, dataToSet, options, callback) {
    Models.userNotification.findOneAndUpdate(criteria, dataToSet, options, callback);
};


module.exports = {
    getAllUserNotification: getAllUserNotification,
    updateUserNotification: updateUserNotification,
    getAllUserNotificationPopulate: getAllUserNotificationPopulate
}
