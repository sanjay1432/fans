var userGroupDetail = require('./SocketManager').userGroupDetail;  //[{ userId : Id, groupId: Id}]
var usersConnected = require('./SocketManager').usersConnected; //user's socket detail
var getChatForGroup = require('../Controllers').FanspickController.getChatsForGroup;
var nodeScheduler = require('node-schedule');
var async = require('async');

var getInfoRule = new nodeScheduler.RecurrenceRule();
getInfoRule.second = new nodeScheduler.Range(0, 59, 1);

var getUserGroupDetails = function () {
    // iterate for userGroupDetail, and fetch user detail for each group
    console.log('service is started : ' + new Date());
    var taskArray = [];
    var userSockets = usersConnected();
    var userGroupUpdatedDetail = userGroupDetail.get();
    console.log("number of users : " + userGroupUpdatedDetail.length);
    for (var index = 0; index < userGroupUpdatedDetail.length; index++) {
        (function (index) {
            taskArray.push((function (index) {
                return function (innerCallback) {
                    getEachUserDetail(userGroupUpdatedDetail[index], userSockets, innerCallback);
                }
            })(index))
        })(index)
    }
    async.parallel(taskArray, function () {
        console.log('group detail complete : ' + new Date());
    })
}

var getEachUserDetail = function (userGroupInfo, userSockets, callback) {
    getChatForGroup({ _id: userGroupInfo.userId }, { groupId: userGroupInfo.groupId }, function (error, result) {
        // emit event to acknowledge user
        if (error) {
            callback(error);
        } else {
            if (userSockets.hasOwnProperty(userGroupInfo.userId)) {
                userSockets[userGroupInfo.userId].emit('getGroupDetail', { message: result, performAction: 'detail of group' });
            }
            callback(null);
        }
    })
}

var getUserDetailSchedule = nodeScheduler.scheduleJob(getInfoRule, getUserGroupDetails);

module.exports = {
    getUserGroupDetails: getUserGroupDetails,
    getUserDetailSchedule: getUserDetailSchedule
}