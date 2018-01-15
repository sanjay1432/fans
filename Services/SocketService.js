'use strict';

var Models = require('../Models');
var async = require('async');
var UniversalFunctions = require('../Utils/UniversalFunctions');

/*  ====================================================
CREATING Socket
=======================================================*/

// /Update Donation in DB
var insertMessage = function (criteria, dataToSet, options, callback) {
    Models.topic.findOneAndUpdate(criteria, dataToSet, options, callback);
};



var getMySockets = function (userAuthData, payloadData, callback) {

    var populateVariable = {
        path: "topics",
        select: 'name'
    };
    var criteria = { TeamID: payloadData.teamId };
    var options = { lean: true },
        projection = { modifiedDate: 0, createdDate: 0, isActive: 0, isLocked: 0, isDeleted: 0 };

    Service.AdminService.getCommunityPopulate(criteria, projection, options, populateVariable, function (err, res) {
        if (err) {
            callback(err)
        } else {
            callback(null, res);
        }
    });
};


var getChatGroup = function (criteria, projection, options, callback) {
    Models.chatGroups.find(criteria, projection, options, callback);
}

var getFanspickChatHistory = function (criteria, projection, options, callback) {
    Models.chatHistory.find(criteria, projection, options, callback);
}

var createChatGroup = function (dataToSave, callback) {
     new Models.chatGroups(dataToSave).save(callback)
}

var insertFanspickChatHistory = function (dataToSave, callback) {
    new Models.chatHistory(dataToSave).save(callback);
}

var updateChatGroup = function (criteria, dataToSet, options, callback) {
    Models.chatGroups.findOneAndUpdate(criteria, dataToSet, options, callback);
}

var updateChatHistory = function (criteria, dataToSet, options, callback) {
    Models.chatHistory.findOneAndUpdate(criteria, dataToSet, options, callback);
}



module.exports = {
    insertMessage: insertMessage,
    updateChatHistory: updateChatHistory,
    updateChatGroup : updateChatGroup,
    insertFanspickChatHistory: insertFanspickChatHistory,
    createChatGroup: createChatGroup,
    getFanspickChatHistory: getFanspickChatHistory,
    getChatGroup: getChatGroup
}
