'use strict';

var Models = require('../Models');
var Config = require('../Config');
var Constants = require('../Lib/Constants');
var async = require('async');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var ObjectId = require('mongoose').Types.ObjectId;


var create = function (objToSave, callback) {
    Models.notificationResponse(objToSave).save(callback)
};

var get = function (criteria, projection, options, callback) {
    Models.notificationResponse.find(criteria, projection, options, callback);
};

module.exports = {
    create: create,
    get: get
};
