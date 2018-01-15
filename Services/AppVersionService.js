'use strict';

var Models = require('../Models');
var Config = require('../Config');

var getAppVersion = function (criteria, projection, options, callback) {
    Models.AppVersions
        .find(criteria,projection,options)
        .exec(callback)
};

var createAppVersion= function (objToSave, callback) {
    new Models.AppVersions(objToSave).save(callback)
};

var updateAppVersion= function (criteria, dataToSet, options, callback) {
    Models.AppVersions.findOneAndUpdate(criteria, dataToSet, options, callback);
};


var getMyCommunity = function (userAuthData, payloadData, callback) {

    var populateVariable = {
        path: "topics",
        select: 'name'
    };
    var criteria = {TeamID : payloadData.teamId  };
    var options = {lean: true},
        projection ={modifiedDate:0, createdDate:0, isActive:0, isLocked:0, isDeleted:0};

    Service.AdminService.getCommunityPopulate(criteria, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null,res);
        }
    });
};


var getMyCommunity = function (userAuthData, payloadData, callback) {

    var populateVariable = {
        path: "topics",
        select: 'name'
    };
    var criteria = {TeamID : payloadData.teamId  };
    var options = {lean: true},
        projection ={modifiedDate:0, createdDate:0, isActive:0, isLocked:0, isDeleted:0};

    Service.AdminService.getCommunityPopulate(criteria, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null,res);
        }
    });
};

module.exports = {
    getAppVersion: getAppVersion,
    updateAppVersion: updateAppVersion,
    createAppVersion: createAppVersion
};

