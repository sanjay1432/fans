'use strict';

var Models = require('../Models');
var Config = require('../Config');
var Constants = require('../Lib/Constants');
var async = require('async');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var ObjectId = require('mongoose').Types.ObjectId;

var getGrade = function (usrId, projection, options, callback) {
    var gradePoints = 0;

    async.series([
        function (cb) {
            var criteria = { _id: usrId };
            Models.fanspickUser.findOne(criteria, projection, options, function (err, doc) {
                gradePoints += Constants.GRADE_POINTS_SIGNUP;
                if (doc.dob !== undefined && doc.dob !== null) {
                    gradePoints += Constants.GRADE_POINTS_DOB;
                }

                if (doc.firstname !== undefined && doc.firstname !== null
                    && doc.lastname !== undefined && doc.lastname !== null) {
                    gradePoints += Constants.GRADE_POINTS_NAME;
                }

                if (doc.lat !== undefined && doc.lat !== null
                    && doc.long !== undefined && doc.long !== null) {
                    gradePoints += Constants.GRADE_POINTS_LOCATION;
                }

                if (doc.loginType !== undefined && doc.loginType !== null
                    && (doc.loginType.toLowerCase() === Constants.LOGIN_TYPE_GOOGLE.toLowerCase() || doc.loginType.toLowerCase() === Constants.LOGIN_TYPE_FACEBOOK.toLowerCase())) {
                    gradePoints += Constants.GRADE_POINTS_THIRD_PARTY_SIGNUP;
                }
                if (doc.ageVerification !== undefined && doc.ageVerification !== null) {
                    var verifiedRecords = 0;
                    doc.ageVerification.forEach(function (ele) {
                        if (ele.isVerified) {
                            verifiedRecords++;
                        }
                    }, this);
                    if (verifiedRecords > 0 && verifiedRecords <= 3) {
                        gradePoints += Constants.GRADE_POINTS_VERIFIED_DOB * verifiedRecords;
                    }
                    else if (verifiedRecords > 3) {
                        gradePoints += Constants.GRADE_POINTS_VERIFIED_DOB * 3;
                    }

                }

                cb();
            }, function (err, things) {
                if (err) return cb(err, gradePoints);
                cb(null, gradePoints);
            })
        },
        function (cb) {
            var criteria = { userId: usrId, lat: { $ne: '0' } };
            Models.eventLoging.findOne(criteria, { _id: 1 }, options, function (err, eventLoging) {
                if (eventLoging !== undefined && eventLoging !== null) {
                    gradePoints += Constants.GRADE_POINTS_VERIFIED_LOCATION;
                }
                cb();
            }, function (err, things) {
                if (err) return cb(err, gradePoints);
                cb(null, gradePoints);
            })
        }
    ], function (err, data) {
        if (err) return callback(err, gradePoints);
        callback(null, gradePoints);
    });
};


var ageVerification = function (criteria, dataToSet, callback) {
    
    Models.fanspickUser.findOne(criteria).exec(function (err, doc) {
        if (err) return callback(err);
        if (doc !== 'undefined' && doc !== null) {
            doc.ageVerification.push(dataToSet);
            doc.save(callback);
        }
    });
};






module.exports = {
    getGrade: getGrade,
    ageVerification: ageVerification
}