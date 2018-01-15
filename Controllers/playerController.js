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
var sortManager = require('../Lib/sortManager');




var recentActionForPlayer = function (userData, payloadData, callback) {
    var result = [];
    var userId = userData._id;
    var teamId = payloadData.teamId;
    var fixtureId = payloadData.fixtureId;

    /*
    var criteria = {
        userId: userId,
        teamId: teamId,
        fixtureId: fixtureId
    };
     */


    /*start new aggregate query */
    var query = [];
    query.push({ $unwind: '$userActions' });
    query.push(
        {
            $match: {
                userId: userId,
                teamId: new ObjectId(teamId),
                fixtureId: new ObjectId(fixtureId)
            }
        }
    );
    if (payloadData.playerId) {
        query.push({
            $match: {
                'userActions.playerID': payloadData.playerId
            }
        });
    }

    query.push(
        {
            $project: {
                time: '$userActions.time',
                playerID: '$userActions.playerID',
                action: '$userActions.action',
                minutes: '$userActions.minutes',
                _id: '$userActions._id'
            }
        }
    );
    /*end new aggregate query */


    var projection = {};
    var options = { lean: true };

    Service.userFixtureService.findOne(query, projection, options, function (err, res) {
        if (res !== null) {
            // var userActions = res.userActions;
            // sortManager.sortBy(userActions, (o) => -o.time);
            // userActions.forEach(function (item, idx, userActions) {
            //     if (item.playerID == payloadData.playerId) {
            //         var playerIdx = result.map(function (e) { return e.playerID; }).indexOf(item.playerID);
            //         if (playerIdx < 0) {
            //             result.push(item);
            //         }
            //     }


            // });
            return callback(null, res);
        } else {
            return callback(null, null);
        }

    });
};


module.exports = {
    recentActionForPlayer: recentActionForPlayer
};