'use strict';

var Models = require('../Models');
var async = require('async');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var ObjectId = require('mongoose').Types.ObjectId;

var createNewGroup = function (dataToSave, callback) {
    new Models.chatGroups(dataToSave).save(callback);
}

var updateGroup = function (criteria, projection, options, callback) {
    Models.chatGroups.findOneAndUpdate(criteria, projection, options).populate({
        path: 'admin.adminId',
        select: 'username'
    }).exec(callback);
}

var getChatGroup = function (criteria, projection, options, callback) {
    Models.chatGroups.find(criteria, projection, options, callback);
}

var getGroupDetail = function (criteria, projection, options, callback) {
    Models.chatGroups.find(criteria, projection, options, callback).populate({
        path: 'admin.adminId',
        select: 'username firstname lastname'
    }).populate({
        path: 'groupMembers.memberId',
        select: 'username firstname lastname'
    }).populate({
        path: 'createdBy',
        select: 'username firstname lastname'
    })
}

var getChatHistory = function (criteria, projection, options, callback) {
    Models.chatHistory.find(criteria, projection, options, callback);
}

var updateChatHistory = function (criteria, dataToUpdate, options, callback) {
    Models.chatHistory.update(criteria, dataToUpdate, options, callback);
}

var getChatHistoryAggregated = function (query, callback) {
    Models.chatHistory.aggregate(query, callback);
}


module.exports = {
    createNewGroup: createNewGroup,
    updateGroup: updateGroup,
    getChatGroup: getChatGroup,
    getGroupDetail: getGroupDetail,
    getChatHistory: getChatHistory,
    updateChatHistory: updateChatHistory,
    getChatHistoryAggregated: getChatHistoryAggregated
}