var Models = require('../Models');
var Config = require('../Config');
var Constants = require('../Lib/Constants');
var async = require('async');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var ObjectId = require('mongoose').Types.ObjectId;


/// collect event logs
var getAllEventLogs = function (callback) {
    Models.eventLoging.find(callback);
};

var getAllUsers = function (callback) {
    Models.fanspickUser.find(callback);
};

var getSponsorReport = function (json, callback) {

    // callback data
    var toReturn = {
        totalBillboardsOpened: 0,
        totalBillboardsSelected: 0
    };

    var billboardsOpened = [];
    var billboardsSelected = [];

    async.waterfall([
       function (cb) {
            // get events for opened billboards
            var billboardOpenedQuery = { eventType: 'billboardOpened', eventAdditionalInfoID: json.billboard };
            var billboards = null;
            Models.eventLoging.find(billboardOpenedQuery, function (err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    billboardsOpened = data;
                }
                cb();
            });
        },
        function (cb) {
            // get events for opened billboards
            var billboardOpenedQuery = { eventType: 'billboardSelected', eventAdditionalInfoID: json.billboard };
            var billboards = null;
            Models.eventLoging.find(billboardOpenedQuery, function (err, data) {
                if (err) {
                    console.log(err);
                }
                else {
                    billboardsSelected = data;
                }
                cb();
            });
        },
        function (cb) {

            // loop through billboard open events
            if (billboardsOpened) {
                try {
                    if (billboardsOpened.length > 0) {
                        //set the total billboards open
                        toReturn.totalBillboardsOpened = billboardsOpened.length;
                        billboardsOpened.forEach(function (element) {
                        }, this);

                        // return the report data
                        callback(null, toReturn);
                        return;
                    }
                } catch (error) {
                    console.log(error);
                }
            }

            // loop through billboard selected events
            if (billboardsSelected) {
                try {
                    if (billboardsSelected.length > 0) {
                        //set the total billboards selected
                        toReturn.totalBillboardsSelected = billboardsSelected.length;
                        billboardsSelected.forEach(function (element) {
                        }, this);

                        // return the report data
                        callback(null, toReturn);
                        return;
                    }
                } catch (error) {
                    console.log(error);
                }
            }
        }],
        function (error, success) {
            if (error) {
                console.log(error);
            }
            else {
                
            }
        });
};

module.exports = {
    getAllEventLogs: getAllEventLogs,
    getAllUsers: getAllUsers,
    getSponsorReport: getSponsorReport
}