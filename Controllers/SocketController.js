'use strict';

var Service = require('../Services');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var async = require('async');

var UploadManager = require('../Lib/UploadManager');
var TokenManager = require('../Lib/TokenManager');
var NotificationManager = require('../Lib/NotificationManager');
var CodeGenerator = require('../Lib/CodeGenerator');
var DAO = require('../DAO/DAO');
var Models = require('../Models');

var moment = require('moment');
var _ = require('underscore');
var Config = require('../Config');
var ObjectId = require('mongoose').Types.ObjectId;
var GroupController = require('./GroupChatController');

process.on("inserMessage", function (data) {
    var userDataFinal = { message: data.message }
    var errorMessage = {}
    console.log('time : ' + data.time);
    var timeInUTC = UniversalFunctions.convertStringToDate(data.time)
    userDataFinal.time = timeInUTC;
    async.series([
        function (cb) {
            var setCriteria = {
                _id: data.topicId
            };
            var setQuery = {
                $push: {}
            };
            var dataToSave = {
                userId: data.id,
                type: data.type,
                message: data.message,
                time: timeInUTC
            }
            console.log('time : ' + timeInUTC);
            if (data.chatType == Config.APP_CONSTANTS.CHAT_TYPE.FANSPICK) {
                setQuery["$push"]["fanspickPosts"] = dataToSave;
            } else if (data.chatType == Config.APP_CONSTANTS.CHAT_TYPE.COMMUNITY) {
                setQuery["$push"]["communityPosts"] = dataToSave;
            }

            Service.SocketService.insertMessage(setCriteria, setQuery, function (err, messagedata) {
                if (err) {
                    errorMessage.err1 = err
                    cb(err);
                }
                else {
                    userDataFinal.topicId = messagedata._id
                    userDataFinal.topicName = messagedata.name
                    cb();
                }
            });
        },
        function (cb) {

            var criteria = {
                _id: data.id
            };
            var projection = { username: 1 };
            var option = {
                lean: true
            };
            Service.FanspickService.getUser(criteria, {}, { lean: true }, function (err, userData) {
                if (err) {
                    errorMessage.err2 = err
                    cb(err)
                } else {
                    if (userData.length == 0) {
                        errorMessage.err3 = err
                        cb(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                    }
                    userDataFinal.userName = userData[0].username
                    userDataFinal.userId = userData[0]._id
                    cb()
                }
            })
        }
    ], function (err, result) {
        if (err) {
            process.emit("messareReply", errorMessage);
        }
        else {
            process.emit("messareReply", userDataFinal);
        }
    });

})


process.on('insertFPChat', function (data) {
    var receivers = [];
    var groupExists = false;
    var groupId;
    var chatExists = false;
    var timeInUTC = UniversalFunctions.convertStringToDate(data.time)
    console.log('insertFPChat : data : ' + data.groupId)
    async.series([
        //check group exist
        function (seriesCallback) {
            //get user id of member
            var criteria = {
                _id: data.groupId
            }
            var projection = {};
            var options = { lean: true };
            Service.SocketService.getChatGroup(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result == undefined || result.length <= 0) {
                    seriesCallback(null);
                } else {
                    console.log('insertFPChat : getChatGroup group exist');
                    groupExists = true;
                    receivers = result[0].groupMembers;
                    data['receivers'] = receivers;
                    seriesCallback(null);
                }
            })
        },
        function (seriesCallback) {
            if (groupExists) {
                //update chat history 
                var criteria = { groupId: new ObjectId(data.groupId) };
                var dataToUpdate = {
                    $addToSet: {
                        chats: {
                            sender: new ObjectId(data.userObjectId),
                            message: data.msg,
                            time: timeInUTC,
                            statusType: 'sent',//data.statusType,
                            type: Config.APP_CONSTANTS.MESSAGE_TYPE.MESSAGE,
                            receivedBy : [new ObjectId(data.userObjectId)],
                            readBy : [new ObjectId(data.userObjectId)]
                        }
                    }
                }
                var options = { upsert: true };
                Service.SocketService.updateChatHistory(criteria, dataToUpdate, options, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        seriesCallback();
                    }
                })
            } else {
                seriesCallback();
            }
        },
        function (seriesCallback) {
            var criteria = { groupId: new ObjectId(data.groupId), chats: { $elemMatch: { message: data.msg } } };
            var projection = { 'chats.$.message': 1 };
            var options = { lean: true };
            Service.SocketService.getFanspickChatHistory(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback();
                } else if (result && result.length > 0) {
                    data.messageId = result[0].chats[0]._id.toString();
                    seriesCallback();
                } else {
                    seriesCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) {
            process.emit("FPChatInserted", error);
        }
        else {
            process.emit("FPChatInserted", data);
        }

    })

})

process.on('msgStatus', function (data) {
    async.series([

        function (seriesCallback) {

            //update chat history 
            var criteria = { groupId: new ObjectId(data.groupId), chats: { $elemMatch: { _id: new ObjectId(data.messageId) } } };
            var dataToUpdate = {
                $set: {
                    "chats.$.statusType": data.statusType
                }
            }
            var options = {};
            Service.SocketService.updateChatHistory(criteria, dataToUpdate, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback();
                }
            })

        }
    ], function (error, result) {
        if (error) {
            process.emit("FPmsgStatus", error);
        }
        else {
            process.emit("FPmsgStatus", data);
        }

    })

})

process.on('msgStatusforActive', function (userData) {
    var criteria = { groupMembers: { $elemMatch: { memberId: new ObjectId(userData.id) } } };
    var projection = {};
    var options = { lean: true };
    Service.SocketService.getChatGroup(criteria, projection, options, function (error, result) {
        if (error) {
            console.log(error)
        } else {
            result.forEach(function (element) {
                var criteria = { groupId: element._id };
                var projection = {};
                var options = { lean: true };
                Service.SocketService.getFanspickChatHistory(criteria, projection, options, function (error, groups) {
                    if (error) {
                        console.log(error)
                    } else {
                        groups.forEach(function (element1) {
                            var chatArray = element1.chats;
                            chatArray.forEach(function (element2) {
                                var criteria = { chats: { $elemMatch: { _id: element2._id, statusType: 'notdelivered' } } };
                                var dataToUpdate = {
                                    $set: {
                                        "chats.$.statusType": userData.statusType
                                    }
                                }
                                var options = {};
                                Service.SocketService.updateChatHistory(criteria, dataToUpdate, options, function (error, result) {
                                    if (error) {
                                        console.log(error)
                                        // seriesCallback(error);
                                    } else {
                                        // seriesCallback();
                                    }
                                })
                            });
                        });
                    }
                });
            });
        }
    });
})
var getNonRegisteredContacts = function (allContacts, registeredContact) {
    var t;
    var a = getContactLists(registeredContact);
    var b = allContacts;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
        return b.indexOf(e) == -1;
    });
}

var getContactLists = function (registeredContact) {
    var contacts = [];
    registeredContact.forEach(function (element) {
        contacts.push(element.phoneNumber);
    }, this);
    return contacts;
}

var addNonRegisteredContacts = function (allContacts, registeredContact, data, callback) {
    var nonRegisteredContacts = getNonRegisteredContacts(allContacts, registeredContact);
    var updatedNonRegisteredContacts = createNonRegisteredContactWithName(nonRegisteredContacts, data.contacts);
    var taskArray = [];
    for (var index = 0; index < updatedNonRegisteredContacts.length; index++) {
        taskArray.push((function (index) {
            return function (seriesCallback) {
                updateNonRegisteredContact(updatedNonRegisteredContacts[index], data.userObjectId, function (error, result) {
                    seriesCallback();
                })
            }
        })(index))
    }
    async.series(taskArray, function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })

}

var updateNonRegisteredContact = function (contact, userId, callback) {
    var oldContactDetails = {};
    var contactExist = false;
    async.series([
        function (seriesCallback) {
            //check contact exists in contact schema
            var criteria = {
                userId: new ObjectId(userId),
                'contacts.contactNo': contact.contact
            };
            var projection = {
                'contacts.$': 1
            }
            var options = {};
            Service.FanspickService.getUserContacts(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result == undefined || result.length <= 0) {
                    seriesCallback();
                } else {
                    contactExist = true;
                    oldContactDetails = result[0].contacts[0];
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            //check contact exists in contact schema
            var criteria = {
                userId: new ObjectId(userId),
                'contacts.contactNo': contact.contact
            };
            var dataToUpdate = {
                $pull: {
                    contacts: { contactNo: contact.contact }
                }
            }
            var options = {};
            Service.FanspickService.updateUserContacts(criteria, dataToUpdate, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result == undefined || result.length <= 0) {
                    seriesCallback();
                } else {
                    contactExist = true;
                    seriesCallback();
                }
            })
        },

        function (seriesCallback) {
            //check contact exists in contact schema
            var criteria = {
                userId: new ObjectId(userId)
            };
            var dataToUpdate = {
                $addToSet: {
                    contacts: {
                        userId: null,
                        contactNo: oldContactDetails.hasOwnProperty('contactNo') ? oldContactDetails.contactNo : contact.contact,
                        status: oldContactDetails.hasOwnProperty('status') ? oldContactDetails.status : 'online',
                        isDeleted: oldContactDetails.hasOwnProperty('isDeleted') ? oldContactDetails.isDeleted : false,
                        name: contact.name,
                        groupId: null
                    }
                }
            }
            var options = { lean: true };
            Service.FanspickService.updateUserContacts(criteria, dataToUpdate, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result == undefined || result.length <= 0) {
                    seriesCallback();
                } else {
                    contactExist = true;
                    seriesCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })
}

var extractContactsFromJson = function (contacts) {
    var contactList = contacts.map(function (obj) {
        return obj.contact;
    });
    return contactList;
}

var createRegisteredContactsWithName = function (regtisteredContacts, allContacts) {
    var mergedList = _.map(regtisteredContacts, function (item) {
        return _.extend(item, _.findWhere(allContacts, { contact: item.phoneNumber }));
    });
    return mergedList;
}

var createNonRegisteredContactWithName = function (nonRegisteredContacts, allContacts) {
    var updatedRegisteredContact = [];
    allContacts.forEach(function (item) {
        if (nonRegisteredContacts.indexOf(item.contact) > -1) {
            updatedRegisteredContact.push(item);
        }
    });
    return updatedRegisteredContact;
}

process.on('createContacts', function (data) {
    var registeredContacts = [];
    var userRecordExist = false;
    var userRecord = {};
    var userContacts = {};
    var contacts = [];
    async.series([
        function (seriesCallback) {
            //get List of contacts
            contacts = extractContactsFromJson(data.contacts);
            seriesCallback();
        },
        function (seriesCallback) {
            //remove old contacts 
            var criteria = { userId: data.userObjectId };
            var dataToUpdate = {
                $set: { contacts: [] }
            };
            var option = { lean: true };
            Service.FanspickService.updateUserContacts(criteria, dataToUpdate, option, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            var criteria = {
                phoneNumber: { $in: contacts }
            }
            var projection = { _id: 1, phoneNumber: 1 };
            var options = { lean: true };
            Service.FanspickService.getUser(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else {
                    registeredContacts = result;
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            var criteria = { userId: data.userObjectId }
            var projection = { contacts: 1 };
            var options = { lean: true };
            Service.FanspickService.getUserContacts(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result == undefined || result.length <= 0) {
                    seriesCallback();
                } else {
                    userRecordExist = true;
                    userRecord = result[0];
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            if (!userRecordExist) {
                var dataToSave = {
                    userId: data.userObjectId
                }
                Service.FanspickService.createUserContacts(dataToSave, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        userRecordExist = true;
                        userRecord = result[0];
                        seriesCallback();
                    }
                })
            } else {
                seriesCallback();
            }
        },
        function (seriesCallback) {
            async.parallel([
                function (parallelCallback) {
                    var updatedRegisteredContacts = createRegisteredContactsWithName(registeredContacts, data.contacts);
                    updateRegisteredContacts(updatedRegisteredContacts, data, function (error, result) {
                        parallelCallback();
                    })
                },
                function (parallelCallback) {
                    addNonRegisteredContacts(contacts, registeredContacts, data, function (error, result) {
                        parallelCallback();
                    })
                }
            ], function (error, response) {
                if (error) {
                    seriesCallback(error);
                } else {
                    seriesCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) {
            process.emit("contactUpdationDone", error);
        } else {
            process.emit("contactUpdationDone", { 'data': { 'message': 'done' } });
        }
    })
})

var updateRegisteredContacts = function (registeredContacts, data, callback) {
    var recordArray = [];
    for (var index = 0; index < registeredContacts.length; index++) {
        (function (index) {
            recordArray.push(
                (function (index) {
                    return function (innerSeriesCallback) {
                        updateGroupInfo(registeredContacts[index], data, function (error, result) {
                            if (error) {
                                innerSeriesCallback(error);
                            } else {
                                innerSeriesCallback();
                            }
                        })
                    }
                }(index))
            )
        }(index))
    }

    async.series(recordArray, function (error, result) {
        if (error) {
            callback(error);
        } else {
            console.log('all contacts are done');
            callback();
        }
    })
}


var updateGroupInfo = function (contact, data, callback) {
    var groupId = null;
    var contactExist = false;
    var oldContactDetails = {};
    async.series([
        //insert group, if not exist
        function (seriesCallback) {
            var criteria = {
                'groupMembers.memberId': { $all: [data.userObjectId, contact._id] }, type: 'oneToOne'
            }
            var projection = { _id: 1 };
            var options = { lean: true };
            Service.FanspickService.getGroup(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result == undefined || result.length <= 0) {
                    seriesCallback();
                } else {
                    groupId = result[0]._id;
                    seriesCallback();
                }
            })
        },
        function (seriesCallback) {
            if (groupId == null) {
                var dataToSave = {
                    groupMembers: [
                        {
                            memberId: data.userObjectId,
                            addedAt: new Date()
                        }, {
                            memberId: contact._id,
                            addedAt: new Date()

                        }
                    ],
                    type: Config.APP_CONSTANTS.CHAT_GROUP_TYPE.ONE_TO_ONE,
                    lastActivatedTime: new Date(),
                    isDeleted: false
                }
                Service.FanspickService.createChatGroup(dataToSave, function (error, result) {
                    if (error) {
                        seriesCallback(error);
                    } else {
                        groupId = result._id;
                        seriesCallback();
                    }
                })
            } else {
                seriesCallback();
            }
        },
        function (seriesCallback) {
            //check contact exists in contact schema
            var criteria = {
                userId: new ObjectId(data.userObjectId),
                'contacts.contactNo': contact.phoneNumber
            };
            var projection = {
                'contacts.$': 1
            }
            var options = {};
            Service.FanspickService.getUserContacts(criteria, projection, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result == undefined || result.length <= 0) {
                    seriesCallback();
                } else {
                    contactExist = true;
                    oldContactDetails = result[0].contacts[0];
                    seriesCallback();
                }
            })
        },//pull old record of old contact.
        function (seriesCallback) {
            //check contact exists in contact schema
            var criteria = {
                userId: new ObjectId(data.userObjectId),
                'contacts.contactNo': contact.phoneNumber
            };
            var dataToUpdate = {
                $pull: {
                    contacts: { contactNo: contact.phoneNumber }
                }
            }
            var options = {};
            Service.FanspickService.updateUserContacts(criteria, dataToUpdate, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result == undefined || result.length <= 0) {
                    seriesCallback();
                } else {
                    contactExist = true;
                    seriesCallback();
                }
            })
        },

        function (seriesCallback) {
            //check contact exists in contact schema
            var criteria = {
                userId: new ObjectId(data.userObjectId),

            };
            var dataToUpdate = {
                $addToSet: {
                    contacts: {
                        userId: contact._id,
                        contactNo: oldContactDetails.hasOwnProperty('contactNo') ? oldContactDetails.contactNo : contact.phoneNumber,
                        status: oldContactDetails.hasOwnProperty('status') ? oldContactDetails.status : 'online',
                        isDeleted: oldContactDetails.hasOwnProperty('isDeleted') ? oldContactDetails.isDeleted : false,
                        name: contact.name,
                        groupId: groupId
                    }
                }
            }
            var options = { lean: true };
            Service.FanspickService.updateUserContacts(criteria, dataToUpdate, options, function (error, result) {
                if (error) {
                    seriesCallback(error);
                } else if (result == undefined || result.length <= 0) {
                    seriesCallback();
                } else {
                    contactExist = true;
                    seriesCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback();
        }
    })
}

process.on('createGroup', function (data) {
    // create a new group 
    /**
     * data : {
     * userId : objectId,
     * members : ['userIdString'],
     * name : 'String'
     * }
     */
    GroupController.createNewGroup({ _id: data.userId }, data, function (error, result) {
        if (error) {
            process.emit('onCreateGroupComplete', error);
        } else {
            //get group detail
            process.emit('onCreateGroupComplete', result);
        }
    })
})

process.on('addNewMember', function (data) {
    // create a new group 
    /**
     * data : {
     * userId : objectId,
     * memberId : userIdString,
     * groupId : stringId
     * }
     */
    GroupController.addNewMember({ _id: data.userId }, data, function (error, result) {
        if (error) {
            process.emit('onAddNewMember', error);
        } else {
            //get group detail
            Service.GroupChatService.getChatGroup({ _id: data.groupId }, {}, { lean: true }, function (error, result) {
                if (error) {
                    process.emit('onAddNewMember', error);
                } else {
                    process.emit('onAddNewMember', null, result[0]);
                }
            })
        }
    })
})

process.on('renameGroup', function (data) {
    // create a new group 
    /**
     * data : {
     * userId : objectId,
     * newName : newName,
     * groupId : stringId
     * }
     */
    GroupController.renameGroup({ _id: new ObjectId(data.userId) }, data, function (error, result) {
        if (error) {
            process.emit('afterRenamingGroup', error);
        } else {
            //get group detail
            process.emit('afterRenamingGroup', null, result);
        }
    })
})

//Arvin
process.on('addNewAdmin', function (data) {
    // add a new admin in group 
    /**
     * data : {
     * userId : objectId,
     * memberId : String,
     * groupId : stringId
     * }
     */
    GroupController.addNewAdmin(data, function (error, result) {
        if (error) {
            process.emit('onAddNewAdmin', error);
        } else {
            //get group detail
            process.emit('onAddNewAdmin', result);
        }
    })
});

process.on('removeMember', function (data) {
    /**
     * data : {
     * userId : objectId,
     * memberId : userIdString,
     * groupId : stringId
     * }
     */
    GroupController.removeMember(data, function (error, result) {
        if (error) {
            process.emit('onremoveMemberComplete', error);
        } else {
            //get group detail
            process.emit('onremoveMemberComplete', result);
        }
    })
});

process.on('removeSelf', function (data) {
    /**
     * data : {
     * userId : objectId,
     * groupId : stringId
     * }
     */
    GroupController.removeSelf(data, function (error, result) {
        if (error) {
            process.emit('onRemoveSelfComplete', error);
        } else {
            //get group detail
            process.emit('onRemoveSelfComplete', result);
        }
    })
});

process.on('upateMessageStatus', function (data, type) {

    var taskArray = [];
    for (var index = 0; index < data.messageIds.length; index++) {
        (function (index) {
            taskArray.push((function (index) {
                return function (innerCallback) {
                    var payloadData = {
                        groupId: data.groupId,
                        messageId: data.messageIds[index],
                        userId: data.userId
                    }
                    updateMessageStatusForEachMessage(payloadData, type, innerCallback);
                }
            })(index))
        })(index)
    }


    async.parallel(taskArray, function (error, result) {
        if (error) {
            process.emit('upateMessageStatusResponse', error);
        } else {
            process.emit('upateMessageStatusResponse', null, result);
        }
    })
})

var updateMessageStatusForEachMessage = function (data, type, callback) {
    var criteria = {
        groupId: new ObjectId(data.groupId),
        chats: { $elemMatch: { _id: new ObjectId(data.messageId) } }
    };
    var projection = {
        'chats.$': 1
    };
    var option = { lean: true };
    var oldMessage = null;
    var groupMembers = [];
    async.series([
        function (innerCallback) {
            //get group data
            var localCriteria = { _id: new ObjectId(data.groupId) };
            var projection = {};
            var option = { lean: true };
            Service.GroupChatService.getChatGroup(localCriteria, projection, option, function (error, result) {
                if (error) {
                    innerCallback(error);
                } else if (result && result.length > 0) {
                    groupMembers = result[0].groupMembers;
                    innerCallback();
                } else {
                    innerCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                }
            })
        },
        function (innerCallback) {
            // get message object
            Service.GroupChatService.getChatHistory(criteria, projection, option, function (error, result) {
                if (error) {
                    innerCallback(error);
                } else if (result && result.length > 0) {
                    oldMessage = result[0].chats[0];
                    innerCallback();
                } else {
                    innerCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                }
            })
        },
        function (innerCallback) {
            // pull message object
            var dataToUpdate = {
                $pull: { chats: { _id: new ObjectId(data.messageId) } }
            };
            Service.GroupChatService.updateChatHistory(criteria, dataToUpdate, { lean: true, new: true }, function (error, result) {
                if (error) {
                    innerCallback(error);
                } else {
                    innerCallback();
                }
            })
        },
        function (innerCallback) {
            // push updated message object
            var indexReceivedBy = -1;
            if (oldMessage.hasOwnProperty('receivedBy')) {
                for(var index = 0; index < oldMessage.receivedBy.length; index++){
                    if(oldMessage.receivedBy[index].toString() ==  data.userId){
                        indexReceivedBy = index;
                    }
                }
                // indexReceivedBy = oldMessage.receivedBy.indexOf(new ObjectId(data.userId));
            } else {
                oldMessage['receivedBy'] = [];
            }
            if (indexReceivedBy < 0) {
                oldMessage.receivedBy.push(new ObjectId(data.userId));
            }
            if (groupMembers.length == oldMessage.receivedBy.length) {
                oldMessage['statusType'] = 'delivered';
            }
            if (type == 'read') {
                var indexReadBy = -1;
                if (oldMessage.hasOwnProperty('readBy')) {
                    for(var index = 0; index < oldMessage.readBy.length; index++){
                        if(oldMessage.readBy[index].toString() ==  data.userId){
                            indexReadBy = index;
                        }
                    }
                    // indexReadBy = oldMessage.readBy.indexOf(new ObjectId(data.userId));
                } else {
                    oldMessage['readBy'] = [];
                }
                if (indexReadBy < 0) {
                    oldMessage.readBy.push(new ObjectId(data.userId));
                }
                if (groupMembers.length == oldMessage.readBy.length) {
                    oldMessage['statusType'] = 'read';
                }
            }
            var localCriteria = {
                groupId: new ObjectId(data.groupId)
            }
            var dataToUpdate = {
                $addToSet: {
                    chats: oldMessage
                }
            }
            var option = { lean: true, new: true };
            Service.GroupChatService.updateChatHistory(localCriteria, dataToUpdate, option, function (error, result) {
                if (error) {
                    innerCallback(error);
                } else {
                    innerCallback();
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })
}

//data : { userId : accessToken }
process.on('upateAllMessageStatus', function (data, type) {

    data['groupIds'] = [];
    async.series([
        function (innerCallback) {
            //get all groupIds
            var localCriteria = {
                groupMembers: { $elemMatch: { memberId: data.userId } }
            }
            Service.GroupChatService.getChatGroup(localCriteria, { _id: 1 }, { lean: true }, function (error, result) {
                if (error) {
                    innerCallback(error);
                } else if (result && result.length > 0) {
                    data['groupIds'] = result;
                    innerCallback(null, result);
                } else {
                    innerCallback(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.RECORD_NOT_FOUND);
                }
            })
        },
        function (innerCallback) {
            var taskArray = [];
            for (var index = 0; index < data.groupIds.length; index++) {
                (function (index) {
                    taskArray.push((function (index) {
                        return function (innerCallback) {
                            var payloadData = {
                                groupId: data.groupIds[index]._id,
                                userId: data.userId
                            }
                            updateMessagesForGroup(payloadData, type, innerCallback);
                        }
                    })(index))
                })(index)
            }


            async.parallel(taskArray, function (error, result) {
                if (error) {
                    process.emit('upateMessageStatusResponse', error);
                } else {
                    process.emit('upateMessageStatusResponse', null, result);
                }
            })
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })
})

var updateMessagesForGroup = function (data, type, callback) {
    var newMesageCount = 0;
    var messageToUpdate = [];
    async.series([
        function (innerCallback) {
            // get list of messages with status 'sent'
            getListOfMessages(data.groupId, 'sent', function (error, result) {
                if (error) {
                    innerCallback(error);
                } else if (result && result.length > 0) {
                    newMesageCount = result[0].chats.length;
                    messageToUpdate = result[0].chats;
                    innerCallback();
                } else {
                    innerCallback();
                }
            })
        },
        function (innerCallback) {
            // update messages
            var messageIds = createMessageIds(messageToUpdate);
            data['messageIds'] = messageIds;
            scheduleMessagesToUpdate(data, type, innerCallback);
        }
    ], function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result);
        }
    })
}


var createMessageIds = function (chats) {
    var messageIds = [];
    chats.forEach(function (chat) {
        if (chat) {
            messageIds.push(chat._id.toString());
        }
    })
    return messageIds;
}

var scheduleMessagesToUpdate = function (data, type, callback) {
    var taskArray = [];
    for (var index = 0; index < data.messageIds.length; index++) {
        (function (index) {
            taskArray.push((function (index) {
                return function (innerCallback) {
                    var payloadData = {
                        groupId: data.groupId,
                        messageId: data.messageIds[index],
                        userId: data.userId
                    }
                    updateMessageStatusForEachMessage(payloadData, type, innerCallback);
                }
            })(index))
        })(index)
    }


    async.parallel(taskArray, function (error, result) {
        if (error) {
            process.emit('upateMessageStatusResponse', error);
        } else {
            process.emit('upateMessageStatusResponse', null, result);
        }
    })
}

var getListOfMessages = function (groupId, messageStatus, callback) {
    var query = [
        { $match: { "groupId": groupId } },
        { $unwind: '$chats' },
        { $match: { 'chats.statusType': 'sent' } },
        { $sort: { 'chats.time': -1 } },
        {
            $group: {
                _id: '$_id',
                'groupId': { $first: 'groupId' },
                'chats': { $push: '$chats' }
            }
        }
    ];
    Service.GroupChatService.getChatHistoryAggregated(query, callback);
}