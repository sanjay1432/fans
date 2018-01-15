var Service = require('../Services');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var async = require('async');
var TokenManager = require('../Lib/TokenManager');
var _ = require('underscore');
var Config = require('../Config');
var ObjectId = require('mongoose').Types.ObjectId;

var createNewGroup = function (query, payloadData, callback) {
    payloadData.members.push(query._id.toString());
    var groupId = null;
    var updatedGroupInfo = null;
    async.series([
        function (seriesCallback) {
            var dataToSave = {

                type: Config.APP_CONSTANTS.CHAT_GROUP_TYPE.ONE_TO_MANY,
                name: payloadData.name,
                isDeleted: false,
                lastActivatedTime: new Date(),
                createdBy : query._id
            }
            Service.GroupChatService.createNewGroup(dataToSave, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    groupId = result._id;
                    updatedGroupInfo = result;
                    seriesCallback(null);
                }
            })
        },
        function (seriesCallback) {
            //add 
            var memberSchema = [];
            payloadData.members.forEach(function (memberId) {
                memberSchema.push({ 'memberId': memberId
                //  'addedAt': new Date() 
                });
            })
            var criteria = {
                _id: groupId
            };
            var dataToUpdate = {
                $set: {
                    groupMembers:
                    memberSchema,

                },
                $addToSet: {
                    admin: { adminId: query._id.toString() }
                }

            };
            var option = { lean: true, new: true };
            Service.GroupChatService.updateGroup(criteria, dataToUpdate, option, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    updatedGroupInfo = result;
                    seriesCallback(null);
                }
            })
        },
        function (seriesCallback) {
            //update message in database
            var localPayloadData = {
                groupId: updatedGroupInfo._id,
                message: updatedGroupInfo.admin[0].adminId.username + " added to group " + payloadData.name,
                sender: query._id
            }
            updatedGroupInfo['message'] = localPayloadData.message;
            addNotificationInChatHistory(localPayloadData, function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, updatedGroupInfo);
        }
    })
}


var addNotificationInChatHistory = function (payloadData, callback) {
    var criteria = {
        groupId: payloadData.groupId
    };
    var dataToSave = {
        $push: {
            chats: {

                "time": new Date(),
                "message": payloadData.message,
                "sender": payloadData.sender,
                "type": Config.APP_CONSTANTS.MESSAGE_TYPE.NOTIFICATION
            }
        }
    }
    var option = { lean: true, new: true, upsert: true };
    Service.FanspickService.updateChatHistory(criteria, dataToSave, option, callback);
}

var addNewMember = function (query, payloadData, callback) {
    var groupDetailFromDB = null;
    async.series([
        function (seriesCallback) {
            //check member exists in group
            var criteria = {
                _id: payloadData.groupId,
                groupMembers: { $elemMatch: { memberId: new ObjectId(payloadData.memberId) } }
            };
            var projection = { _id: 1 };
            var options = { lean: true };
            Service.GroupChatService.getChatGroup(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result && result.length > 0) {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.USER_ALREADY_EXIST);
                } else {
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            //add new member in group
            var criteria = {
                _id: payloadData.groupId
            };
            var dataToUpdate = {
                $addToSet: {
                    groupMembers: { memberId:  new ObjectId(payloadData.memberId),
                         addedAt: new Date() 
                        }
                }
            };
            var options = { new: true };
            Service.GroupChatService.updateGroup(criteria, dataToUpdate, options, function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else {
                    groupDetailFromDB = response;
                    seriesCallback(null);
                }
            });
        },
        function (seriesCallback) {
            //update chat history schema
            var localPayloadData = {
                groupId: groupDetailFromDB._id,
                message: groupDetailFromDB.admin[0].adminId.username + " added you ",
                sender: query._id
            }
            groupDetailFromDB['message'] = localPayloadData.message;
            addNotificationInChatHistory(localPayloadData, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) callback(error);
        else {
            callback(null, groupDetailFromDB);
        }
    })
}

/**
 * 
 *query :- userData
 * payloadData :- groupId, newName, 
 */
var renameGroup = function (query, payloadData, callback) {
    var oldName = "";
    async.waterfall([
        function (waterfallCallback) {
            // check user is admin or not
            var criteria = {
                _id: new ObjectId(payloadData.groupId),
                admin: {
                    $elemMatch: {
                        adminId: query._id
                    }
                }
            }
            var projection = { _id: 1, name: 1 };
            var option = { lean: true };
            Service.GroupChatService.getChatGroup(criteria, projection, option, function (error, result) {
                if (error) {
                    waterfallCallback(error);
                } else if (result && result.length > 0) {
                    oldName = result[0].name;
                    waterfallCallback(null, result[0]);
                } else {
                    waterfallCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_AN_ADMIN);
                }
            })
        },
        function (groupDetail, waterfallCallback) {
            //update group data
            var criteria = {
                _id: new ObjectId(groupDetail._id)
            };
            var dataToUpdate = {
                name: payloadData.name
            };
            var options = { new: true };
            Service.GroupChatService.updateGroup(criteria, dataToUpdate, options, function (error, result) {
                if (error) {
                    waterfallCallback(error);
                } else {
                    result._doc['oldName'] = oldName;
                    waterfallCallback(null, result);
                }
            })
        },
        function (groupDetialFromDB, seriesCallback) {
            //update message in database
            var localPayloadData = {
                groupId: groupDetialFromDB._id,
                message: groupDetialFromDB.admin[0].adminId.username + " changed the group name from " + oldName + " to " + payloadData.name,
                sender: query._id
            }
            groupDetialFromDB._doc['message'] = localPayloadData.message;
            addNotificationInChatHistory(localPayloadData, function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback(null, groupDetialFromDB);
                }
            })
        }
    ], function (error, response) {
        if (error) {
            callback(error);
        } else {
            callback(null, response);
        }
    })
}

var getGroupDetail = function (userData, payloadData, callback) {
    async.waterfall([
        function (seriesCallback) {
            //check user is member of group or not
            var criteria = {
                _id: payloadData.groupId,
                groupMembers: { $elemMatch: { memberId: userData._id } }
            };
            var projection = { _id: 1 };
            var option = { lean: true };
            Service.GroupChatService.getChatGroup(criteria, projection, option, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result && result.length > 0) {
                    //group found
                    seriesCallback(null,result);
                } else {
                    seriesCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                }
            })
        },
        function (groupDetail, seriesCallback) {
            //get group detail  
            var criteria = {
                _id: payloadData.groupId
            }
            var projection = {};
            var option = { lean: 1 };
            Service.GroupChatService.getGroupDetail(criteria, projection, option, function (error, result){
                if(error){
                    seriesCallback();
                }else{
                    seriesCallback(null, result[0]);
                }
            })
        }
    ], function (error, result) {
        if(error){
            callback(error);
        }else{
            callback(null, result);
        }
    })
}
//Arvin
// add new admin
var addNewAdmin = function ( payloadData, callback) {
    var groupDetialFromDB=null;
    async.waterfall([
        function (waterfallCallback) {
            // check user is admin or not
            var criteria = {
                _id: new ObjectId(payloadData.groupId),
                admin: {
                    $elemMatch: {
                        adminId: payloadData.userId
                    }
                }
            }
            var projection = { _id: 1, name: 1 };
            var option = { lean: true };
            Service.GroupChatService.getChatGroup(criteria, projection, option, function (error, result) {
                if (error) {
                    waterfallCallback(error);
                } else if (result && result.length > 0) {
                    waterfallCallback();
                } else {
                    waterfallCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_AN_ADMIN);
                }
            })
        },
        function (waterfallCallback) {
            // check user is groupMember or not
            var criteria = {
                _id: new ObjectId(payloadData.groupId),
                groupMembers: {
                    $elemMatch: {
                        memberId: payloadData.memberId
                    }
                }
            }
            var projection = { _id: 1, name: 1 };
            var option = { lean: true };
            Service.GroupChatService.getChatGroup(criteria, projection, option, function (error, result) {
                if (error) {
                    waterfallCallback(error);
                } else if (result && result.length > 0) {
                    waterfallCallback(null, result[0]);
                } else {
                    waterfallCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_GROUP_MEMBER);
                }
            })
        },
        function (groupDetail, waterfallCallback) {
            //update group data
            var criteria = {
                _id: new ObjectId(groupDetail._id)
            };
            var dataToUpdate = {
                $addToSet: {
                    admin: { adminId: payloadData.memberId }
                }
            };
            var options = { new: true };
            Service.GroupChatService.updateGroup(criteria, dataToUpdate, options, function (error, result) {
                if (error) {
                    waterfallCallback(error);
                } else {
                    groupDetialFromDB =result;
                    waterfallCallback(null);
                }
            })
        },
        function (seriesCallback) {
            //update message in database
            var localPayloadData = {
                groupId: groupDetialFromDB._id,
                message: "You are an admin now",
                sender: payloadData.userId
            }
            groupDetialFromDB._doc['message'] = localPayloadData.message;
            addNotificationInChatHistory(localPayloadData, function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback(null,groupDetialFromDB);
                }
            })
        }
    ], function (error, response) {
        if (error) {
            callback(error);
        } else {
            callback(null, response);
        }
    })
}

// remove member
var removeMember = function ( payloadData, callback) {
    var groupDetialFromDB=null;
    async.waterfall([
        function (waterfallCallback) {
            // check user is admin or not
            var criteria = {
                _id: new ObjectId(payloadData.groupId),
                admin: {
                    $elemMatch: {
                        adminId: payloadData.userId // who is sending request
                    }
                }
            }
            var projection = { _id: 1, name: 1 };
            var option = { lean: true };
            Service.GroupChatService.getChatGroup(criteria, projection, option, function (error, result) {
                if (error) {
                    waterfallCallback(error);
                } else if (result && result.length > 0) {
                    
                    waterfallCallback(null, result[0]);
                } else {
                    waterfallCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_AN_ADMIN);
                }
            })
        },
        function (groupDetail, waterfallCallback) {
            //update group data
            var criteria = {
                _id: new ObjectId(groupDetail._id)
            };
            var dataToUpdate = {
                $pull: {
                    groupMembers :{ memberId: new ObjectId(payloadData.memberId) },
                    admin: { adminId: new ObjectId(payloadData.memberId) }
                }
            };
            var options = { multi: true };
            Service.GroupChatService.updateGroup(criteria, dataToUpdate, options, function (error, result) {
                if (error) {
                    waterfallCallback(error);
                } else {
                    groupDetialFromDB =result;
                    waterfallCallback(null, result);
                }
            })
        },
        function (groupDetialFromDB, seriesCallback) {
            //update message in database
            var localPayloadData = {
                groupId: groupDetialFromDB._id,
                message: "member is removed from this group",
                sender: payloadData.userId               
            }
            groupDetialFromDB._doc['message'] = localPayloadData.message;
            addNotificationInChatHistory(localPayloadData, function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback(null,groupDetialFromDB);
                }
            })
        }
    ], function (error, response) {
        if (error) {
            callback(error);
        } else {
            callback(null, response);
        }
    })
}

// remove self from group
var removeSelf = function ( payloadData, callback) {
    var groupDetialFromDB=null;
    // var isAdmin=false;
    async.waterfall([
        function (waterfallCallback) {
            // check user is admin or not
            var criteria = {
                _id: new ObjectId(payloadData.groupId),
                $or:[{
                'admin': {
                    $elemMatch: {
                        adminId: new ObjectId(payloadData.userId)
                    }
                }
            },{
                'groupMembers': {
                    $elemMatch: {
                        memberId: new ObjectId(payloadData.userId)
                    }
                }
            }]
            }
            var projection = { _id: 1, name: 1 };
            var option = { lean: true };
            Service.GroupChatService.getChatGroup(criteria, projection, option, function (error, result) {
                if (error) {
                    waterfallCallback(error);
                }else if (result && result.length > 0) {
                    // isAdmin=true;
                    waterfallCallback(null, result[0]);
                }
            })
        },
        function (groupDetail, waterfallCallback) {
            //update group data
            var criteria = {
                _id: new ObjectId(groupDetail._id)
            };
            var dataToUpdate = {
                $pull: {
                    groupMembers :{ memberId: payloadData.userId },
                    admin: { adminId: payloadData.userId }
                }
            };
            var options = { multi: true };
            Service.GroupChatService.updateGroup(criteria, dataToUpdate, options, function (error, result) {
                if (error) {
                    waterfallCallback(error);
                } else {
                    groupDetialFromDB =result;
                    waterfallCallback(null, result);
                }
            })
        },
        function (groupDetialFromDB, seriesCallback) {
             if(groupDetialFromDB.admin.length==0)
            {
                if(groupDetialFromDB.groupMembers.length>0){                     
                    var newAdmin = groupDetialFromDB.groupMembers[0].memberId;
                    var criteria = {
                        _id:  groupDetialFromDB._id
                    };
                    var dataToUpdate = {
                        $addToSet: {
                            admin: { adminId: newAdmin.toString() }
                        }
                    };
                    var options = {lean: true, new: true };
                    Service.GroupChatService.updateGroup(criteria, dataToUpdate, options, function (error, results) {
                        if (error) {
                            seriesCallback(error);
                        } else {
                            results.admin[0]['adminId'] = newAdmin;
                            groupDetialFromDB =results;
                            seriesCallback(null, results);
                        }
                    })
                }else{
                    //todo if groupMember is also empty
                    seriesCallback(null, groupDetialFromDB);
                }            
            }
            else{
                seriesCallback(null, groupDetialFromDB);
            }
          
        },
        function (groupDetialFromDBs, seriesCallback) {
         
            //update message in database
            var localPayloadData = {
                groupId: groupDetialFromDBs._id,
                message: "You are no longer member of this group",
                sender: payloadData.userId
            }
            groupDetialFromDBs['message'] = localPayloadData.message;
            addNotificationInChatHistory(localPayloadData, function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback(null,groupDetialFromDBs);
                }
            })
        }
    ], function (error, response) {
        if (error) {
            callback(error);
        } else {
            callback(null, response);
        }
    })
}
module.exports = {
    createNewGroup: createNewGroup,
    addNewMember: addNewMember,
    renameGroup: renameGroup,
    getGroupDetail: getGroupDetail,
    addNewAdmin : addNewAdmin,
    removeMember: removeMember,
    removeSelf : removeSelf
}