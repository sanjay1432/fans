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



var getGrade = function (userData, callback) {
    var projection = { accessToken: 0, passwordChangesOn: 0, profileComplete: 0, rejection: 0 };
    var option = {
        lean: true
    };
    var gradePoint = "";
    Service.GradingService.getGrade(userData._id, projection, option, function (err, result) {
        if (err) return callback(err)

        if (result >= 100) {
            gradePoint = "Grade A";
        }
        else if (result >= 80 && result < 100) {
            gradePoint = "Grade B";
        }
        else if (result >= 50 && result < 80) {
            gradePoint = "Grade C";
        }
        else if (result >= 30 && result < 50) {
            gradePoint = "Grade D";
        }
        else if (result >= 10 && result < 30) {
            gradePoint = "Grade E";
        }
        else {
            gradePoint = "No Grade";
        }

        updateGrade(userData, gradePoint, result, function (err, res) {
            if (err) return callback(err)
            else {
                data = {
                    gradePoint: gradePoint,
                    gradeValue: result
                };
                callback(null, data);
            }
        });
    });
};

var updateGrade = function (userData, gradePoint, gradeValue, callback) {
    var criteria = { _id: userData._id };
    var options = { lean: true };
    var dataToSet = {
        gradePoint: gradePoint,
        gradeValue: gradeValue
    };

    Service.FanspickService.updateUser(criteria, dataToSet, options, function (err) {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null);
        }
    });
};


var ageVerification = function (userData, payloadData, callback) {
    var dob = new Date(payloadData.dob);
    var verifiableDate = new Date();
    verifiableDate.setFullYear(verifiableDate.getFullYear() - 18);
    var isVerified = (dob <= verifiableDate);

    var dataToSet = {
        "dob": dob,
        "verificationDate": new Date(),
        "isVerified": isVerified
    };

    var criteria = {
        _id: userData._id
    };

    Service.GradingService.ageVerification(criteria, dataToSet, function (err) {
        if (err) {
            callback(err);
        } else {
            if (isVerified) {
                callback(null, Constants.VERIFIED, isVerified);
            }
            else {
                callback(null, Constants.UNABLE_TO_VERIFY, isVerified);
            }
        }
    });
};


module.exports = {
    getGrade: getGrade,
    ageVerification: ageVerification
};