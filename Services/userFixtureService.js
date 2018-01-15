'use strict';

var Models = require('../Models');
var Config = require('../Config');
var Constants = require('../Lib/Constants');
var async = require('async');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var ObjectId = require('mongoose').Types.ObjectId;


var find = function (criteria, projection, options, callback) {
    Models.userFixture.find(criteria, projection, options, callback);
};

var findOne = function (criteria, projection, options, callback) {
    // Models.userFixture.findOne(criteria, projection, options, callback);
    Models.userFixture.aggregate(criteria).exec(function(err,result){
        if(err){
            callback(err);
        }else{
            callback(null,result);
        }
    })


};


module.exports = {
    find: find,
    findOne: findOne
};
