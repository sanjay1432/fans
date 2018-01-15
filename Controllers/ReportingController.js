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

var getAllEventLogs = function (callback) {
    Service.ReportingService.getAllEventLogs(function (err, logs) {
        if (err) {
            console.log(err);
        }
        else {
            callback(null, logs);
            return;
        }
    });
}


var getAllUsers = function (callback) {
    Service.ReportingService.getAllUsers(function (err, logs) {
        if (err) {
            console.log(err);
        }
        else {
            callback(null, logs);
            return;
        }
    });
}

var getSponsorReport = function (json, callback) {
    Service.ReportingService.getSponsorReport(json, function (err, report) {
        if (err) {
            console.log(err);
        }
        else {
            callback(null, report);
            return;
        }
    });
}


module.exports = {
    getAllEventLogs: getAllEventLogs,
    getAllUsers: getAllUsers,
    getSponsorReport: getSponsorReport
};