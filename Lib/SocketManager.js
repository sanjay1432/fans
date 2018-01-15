
'use strict';
/**
 * Created by Amit on 12/7/15.
 */
var Config = require('../Config');
var TokenManager = require('./TokenManager');
var clientCount = 0;
var clientCountForEachRoom = {};
var users = {};
var Service = require('../Services');
var ObjectId = require('mongoose').Types.ObjectId;
var UniversalFunctions = require('../Utils/UniversalFunctions');

//json or array [{ userId : string, groupId : string}]
var userGroupDetail = {
    currentGroup: [],
    get: function () {
        return userGroupDetail.currentGroup;
    },
    set: function (userCurrentGroup) {
        userGroupDetail.currentGroup.push(userCurrentGroup);
    }
}


var getClientCount = function () {
    // return clientCount;
    return clientCountForEachRoom;
}
var getClinetCountForRoom = function (topicId, socket) {
    var room = topicId; //getRoomId(topicId);
    var clientCountEachRoom = 0;
    if (socket.adapter.rooms.hasOwnProperty(room) > 0)
        clientCountEachRoom = socket.adapter.rooms[room].length;
    return clientCountEachRoom;
}
var getRoomId = function (topicId) {
    var room = 'room-' + topicId;
    return room;
}


var connectSocket = function (server) {
    if (!server.app) {
        server.app = {}
    }
    server.app.socketConnections = {};
    var socket = require('socket.io').listen(server.listener);

    socket.on('connection', function (socket) {
        var currentRoomId;
        socket.on('disconnect', function () {
            //set active status false for user id
            console.log('disconnect event is been triggered');
            var userId = socket.userId;
            var today = new Date();
            var currentTime = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), today.getUTCHours(), today.getUTCMinutes(), today.getUTCSeconds()));

            // var utcTime  =currentTime.toUTCString();

            var criteria = {
                _id: userId
            };
            var dataToSet = {
                active: false,
                lastActiveTime: currentTime
            };
            Service.FanspickService.updateUser(criteria, dataToSet, {
                lean: true
            }, function (err, userData) {
                if (err) {
                    return err;
                }
                // cb();
            });

            clientCountForEachRoom[currentRoomId] = getClinetCountForRoom(currentRoomId, socket);
            clientCount--;
            if (users) {
                delete users[socket.userId];
            }
            console.log('socket disconnected  room :  ' + currentRoomId);

        });
        clientCount++;
        socket.on('createRoom', function (data) {
            // check room exists with same id
            console.log('createRoom event received');
            var room = getRoomId(data.topicId);
            console.log('room : ' + room);
            TokenManager.decodeToken(data.userId, function (err, decodedData) {
                var lastData = 1;
                if (!err && decodedData.id) {
                    // Inserting new message to db
                    data.id = decodedData.id;
                    socket.room = room;
                    socket.join(room);
                    currentRoomId = room;
                    clientCountForEachRoom[currentRoomId] = getClinetCountForRoom(room, socket);
                    console.log('room joined : ' + room);
                    // socket.emit('messageFromServer', { message: 'WELCOME TO FANSPICK', performAction: 'INFO' });
                    // socket.to(room).emit('joinedRoom', { message: "You are in room no. " + room , roomNo : room, count : clientCountEachRoom});
                } else {
                    socket.emit('messageReply', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        })

        socket.on('joinedRoom', function (data) {
            console.log('joined Room : ' + data);
        })


        socket.emit('messageFromServer', { message: 'WELCOME TO FANSPICK', performAction: 'INFO' });
        // when the client emits 'new message', this listens and executes
        socket.on('new message', function (data) {
            TokenManager.decodeToken(data.userId, function (err, decodedData) {
                var lastData = 1;
                if (!err && decodedData.id) {
                    // Inserting new message to db
                    data.id = decodedData.id;
                    process.emit("inserMessage", data);
                    process.on("messareReply", function (Fdata) {
                        lastData++;
                        if (lastData == 2) {
                            socket.broadcast.emit('onOtherMessage', { message: Fdata, performAction: 'Broadcast message' });
                        }
                        //socket.emit('messageReply', { message:'Success', performAction:'Reply of message'});
                    })
                } else {
                    socket.emit('messageReply', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        });
        //to check when user open the app
        socket.on('userStatus', function (data) {
            console.log('userStatus event is been triggered' + data);
            var token = data.userId;
            var criteria = {
                accessToken: token
            };
            var dataToSet = {
                active: true,
            };
            Service.FanspickService.updateUser(criteria, dataToSet, {
                lean: true
            }, function (err, userData) {
                if (err) {
                    return err;
                }
                // cb();
                socket.emit('userStatusReply', 'Status set to true');
                deliverAllMessage({ userId: data.userId });
                console.log('userStatusReply event is been triggered');
            });
        })
        //data for reciever user status
        socket.on('isActive', function (user) {

            console.log('isActive event is been triggered' + user);
            var userId = user.userId;
            var socketId = socket.id;
            var response;

            var criteria = {
                _id: userId
            };
            var projection = {
                // passwordHash: 1
            };
            var options = {
                lean: true
            };
            Service.FanspickService.getUser(criteria, projection, options, function (err, data) {
                if (err) {
                    return err;
                }

                if (data.length == 0) {
                    return UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.NOT_FOUND
                }
                user = data[0];

                // return cb();
                if (user.active == true) {
                    // User is active
                    var userData = { statusType: 'delivered', id: userId };
                    process.emit('msgStatusforActive', userData);
                    response = { isActive: true };
                } else {
                    // User is not active
                    response = { isActive: false, lastSeen: user.lastActiveTime };
                }
                if (socket.connected) {
                    socket.emit('onIsActive', response);
                    console.log('onIsActive event is been triggered' + response);
                }
            });

        });

        // data { userId, phoneNo }
        socket.on('add user', function (data) {
            // push new user to users array
            TokenManager.decodeToken(data.userId, function (err, decodedData) {
                var lastData = 1;
                if (!err && decodedData.id) {
                    // Inserting new message to db
                    data.id = decodedData.id;
                    socket.userId = data.id;
                    users[socket.userId] = socket;
                    socket.emit('messageReplyAddUser', { message: 'User Added', performAction: 'Reply of message' });
                } else {
                    socket.emit('messageReplyAddUser', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        })

        // register group with user : data : {userId : accessToken, groupId : string }
        socket.on('register group', function (data) {
            TokenManager.decodeToken(data.userId, function (error, decodedData) {
                if (!error && decodedData.id) {
                    // Inserting new message to db
                    data.id = decodedData.id;
                    var userCurrentGroup = { userId: data.id, groupId: data.groupId };
                    userGroupDetail.set(userCurrentGroup);
                    socket.emit('messageReplyRegisterGroup', { message: 'Group registered', performAction: 'reply of register group' });
                } else {
                    socket.emit('messageReplyRegisterGroup', { message: 'Invalid Token', performAction: 'reply of register group' });
                }
            })
        });

        // unregister group with user : data : {userId : accessToken, groupId : string }
        socket.on('unregister group', function (data) {
            TokenManager.decodeToken(data.userId, function (error, decodedData) {
                if (!error && decodedData.id) {
                    // Inserting new message to db
                    data.id = decodedData.id;
                    var userCurrentGroup = { userId: data.id, groupId: data.groupId };
                    var array = userGroupDetail.get();
                    var newArray = [];
                    array.forEach(function (obj) {
                        if (obj.userId != userCurrentGroup.userId && obj.groupId != userCurrentGroup.groupId) {
                            newArray.push(obj);
                        }
                    });
                    userGroupDetail.currentGroup = newArray;
                    socket.emit('messageReplyRegisterGroup', { message: 'Group registered', performAction: 'reply of register group' });
                } else {
                    socket.emit('messageReplyRegisterGroup', { message: 'Invalid Token', performAction: 'reply of register group' });
                }
            })
        });

        //user token, groupId, message, type
        socket.on('send message', function (data) {
            // sender, receive and message
            //message reached at server and msgAtServer event is emit to client with message value to true
            // socket.emit('msgAtServer', { message: true });
            var messageData = data;
            messageData['statusType'] = "sent";
            TokenManager.decodeToken(data.userId, function (err, decodedData) {
                if (!err && decodedData.id) {
                    data.userObjectId = decodedData.id;
                    //create group and insert chat data
                    process.emit('insertFPChat', data);
                    process.once('FPChatInserted', function (data) {
                        console.log('message type set to sent')
                        if (data.hasOwnProperty('receivers')) {
                            for (var index = 0; index < data.receivers.length; index++) {
                                var receiver = data.receivers[index].memberId.toString();
                                var tempDAta = users;
                                if (receiver != data.userObjectId && users.hasOwnProperty(receiver)) {
                                    users[receiver].emit('newMessage', { message: data, performAction: 'new message' });

                                    // if(receiver){
                                    var criteria = {
                                        _id: receiver
                                    };
                                    var projection = {
                                        // passwordHash: 1
                                    };
                                    var options = {
                                        lean: true
                                    };

                                    Service.FanspickService.getUser(criteria, projection, options, function (err, data1) {
                                        if (err) {
                                            return err;
                                        }
                                        var user = data1[0];

                                        if (user.active === true) {
                                            data.statusType = 'delivered';
                                            deliverMessage({ userId: user.accessToken, groupId: messageData.groupId, messageIds: [data.messageId] });
                                            // users[receiver].emit('deliver message', { userId: data1.accessToken, groupId: messageData.groupId, messageIds: [data.messageId] })
                                            //Set statusType corresponding to message 
                                            /*process.emit('msgStatus', data);
                                            process.once('FPmsgStatus', function (replytdata) {
                                                if (replytdata.statusType == 'delivered') {
                                                    data.userId = data.userObjectId;
                                                    if ( users.hasOwnProperty(receiver)) {
                                                        users[receiver].emit('receive message', { message: data });
                                                    }
                                                    socket.emit('msgDelivered', { delivered: true, messageData: messageData });
                                                } else {
                                                    socket.emit('msgDelivered', { delivered: false, messageData: messageData });
                                                }
                                            });*/
                                        }/* else {
                                            data.statusType = 'notdelivered';
                                            //Set statusType corresponding to message 
                                            process.emit('msgStatus', data);

                                            socket.emit('msgDelivered', { delivered: false, messageData: messageData });
                                        }*/
                                    });
                                    // }
                                } else if (receiver == data.userObjectId && users.hasOwnProperty(receiver)) {
                                    //send sender message delivered event
                                    // socket.emit('read message', { userId: messageData.userId, groupId: messageData.groupId, messageIds: [data.messageId] })
                                    socket.emit('messageDelivered', { message: messageData, performAction: 'reply of send message' });

                                }
                            }

                        } else {
                            socket.emit('messageReply', { message: 'Invalid receiver', performAction: 'Reply of message' });
                        }
                    })
                } else {
                    socket.emit('messageReply', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        })
        //msgRecieved event from app when reciever read message in live chat
        socket.on('msgReceived', function (data) {
            var isRead = data.read;
            if (isRead) {
                data.statusType = 'read';
                process.emit('msgStatus', data);
                process.once('FPmsgStatus', function (replytdata) {
                    if (replytdata.statusType == 'read') {
                        socket.emit('isReadRply', { messageData: data });
                    }
                });
            } else {
                socket.emit('isReadRply', { messageData: data });
            }
        })
        //receiver  will emit read message event to sender
        /*
        socket.on('read message', function (data) {
            // isRead should be boolean
            var isRead = data.read;
            //sender should be string
            var sender = data.sender;
            if (isRead == true) {
                users[sender].emit('readMsgReply', { msgread: true, messageId: data.messageId });
            } else {
                users[sender].emit('readMsgReply', { msgread: false, messageId: data.messageId });
            }
        })
*/
        //deliver message to member, data : { userId : accessToken, groupId : stringId, messageId : stringId}
        socket.on('deliver message', function (data) {
            deliverMessage(data);
        })

        // as user become active, deliver all messages to user : data : { userId : accessToken, groupId : stringId }
        socket.on('deliver all message', function (data) {
            deliverAllMessage(data);
        })

        //message read by member, data : { userId : accessToken, groupId : stringId, messageIds : array of strings}
        socket.on('read message', function (data) {
            TokenManager.decodeToken(data.userId, function (error, decodedData) {
                if (!error && decodedData.id) {
                    data.userId = decodedData.id
                    process.emit('upateMessageStatus', data, 'read');
                    process.on('upateMessageStatusResponse', function (error, result) {
                        if (error) {
                            socket.emit('messageReply', { message: 'status is not updated', performAction: 'error' });
                        } else {
                            socket.emit('messageReply', { message: 'status updation is done', performAction: 'Reply of message' });
                        }
                    })
                }
            })
        })


        socket.on('add contacts', function (data) {
            // var contacts = [{"name" : "first","contact":"1234567890"},{"name" : "Second", "contact": "3456789012"}];
            // data.contacts = contacts;
            // var array = JSON.parse("[" + data.contacts + "]");
            // console.log('add contacts : array : '+array);
            TokenManager.decodeToken(data.userId, function (err, decodedData) {
                if (!err && decodedData.id) {
                    data.userObjectId = decodedData.id;
                    process.emit('createContacts', data);
                    process.once('contactUpdationDone', function (data) {
                        socket.emit('messageReplyAddContacts', { message: 'Contact saved', performAction: 'Reply of message' });
                    })
                } else {
                    socket.emit('messageReplyAddContacts', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        })

        socket.on('create group', function (data) {
            TokenManager.decodeToken(data.userId, function (error, decodedData) {
                if (!error && decodedData.id) {
                    //create new group 
                    data.userId = decodedData.id;
                    process.emit('createGroup', data);
                    process.once('onCreateGroupComplete', function (data) {
                        //send response to all members of group
                        if (data.hasOwnProperty('groupMembers')) {
                            for (var index = 0; index < data.groupMembers.length; index++) {
                                var receiver = data.groupMembers[index].memberId.toString();
                                data.userId = decodedData.id;
                                if (/*receiver != data.userId &&*/ users.hasOwnProperty(receiver)) {
                                    users[receiver].emit('addedInGroup', { message: data });
                                }
                            }
                        }
                    })
                } else {
                    socket.emit('messageReplyAddUser', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        })

        socket.on('add member', function (data) {
            TokenManager.decodeToken(data.userId, function (error, decodedData) {
                if (!error && decodedData.id) {
                    //create new group 
                    data.userId = decodedData.id;
                    process.emit('addNewMember', data);
                    process.once('onAddNewMember',function(error, addmemberdata){

                        //send response to all members of group
                        if (error) {
                            socket.emit('addedInGroup', { message: error.customMessage });
                        }
                        else if (addmemberdata.hasOwnProperty('groupMembers')) {
                            // for (var index = 0; index < data.groupMembers.length; index++) {

                                // var receiver = data.groupMembers[index].memberId.toString();                        
                                // data.userId = decodedData.id;
                                // if (users.hasOwnProperty(receiver)) {
                                    socket.emit('addedInGroup', { message: addmemberdata,
                                        operation:'add',
                                        performedBy:decodedData.id,
                                        actionOnMember:data.memberId});
                                // }
                            // }
                        }
                    })
                } else {
                    socket.emit('messageReplyAddUser', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        })

        socket.on('rename group', function (data) {
            TokenManager.decodeToken(data.userId, function (error, decodedData) {
                if (!error && decodedData.id) {
                    //create new group 
                    data.userId = decodedData.id;
                    process.emit('renameGroup', data);
                    process.once('afterRenamingGroup', function (error, data) {
                        //send response to all members of group
                        if (error) {
                            socket.emit('groupNameUpdated', { message: 'user is not an admin' });
                        }
                        else if (data._doc.hasOwnProperty('groupMembers')) {
                            for (var index = 0; index < data.groupMembers.length; index++) {
                                var receiver = data.groupMembers[index].memberId.toString();
                                data.userId = decodedData.id;
                                if (users.hasOwnProperty(receiver)) {
                                    users[receiver].emit('groupNameUpdated', { message: data });
                                }
                            }
                        }
                    })
                } else {
                    socket.emit('messageReplyAddUser', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        })
        //Arvin

        // Add other member as an admin in the group by admin
        socket.on('add new Admin',function(data){
            TokenManager.decodeToken(data.userId, function(error, decodedData){
                if(!error && decodedData.id){
                    //add new admin
                    data.userId = decodedData.id;
                    process.emit('addNewAdmin', data);
                    process.on('onAddNewAdmin',function(newAdmin){
                        //send response to newly addded admin of group
                        if (newAdmin.hasOwnProperty('statusCode')) {
                            users[new ObjectId(data.userId)].emit('addedAsAdminInGroup', { message: newAdmin });                                
                        }else{
                            var receiverArray = newAdmin.admin;
                            for (var index = 0; index < receiverArray.length; index++) {
                                var receiver = receiverArray[index].adminId;
                                var adminIdfromService = receiver._id.toString();
                                var adminTobeadd = data.memberId;

                                if(receiver._id!=decodedData.id){
                                    data.userId = decodedData.id;
                                        if(adminIdfromService==adminTobeadd){
                                            newAdmin._doc['statusCode'] = 200;                                      
                                        socket.emit('addedAsAdminInGroup', { message: newAdmin, operation:'ARE CREATED ADMIN BY',
                                        performedBy:decodedData.id,
                                        actionOnMember:data.memberId });
                                        }                               
                                }
                            }                
                        }
                    })
                }else{
                    socket.emit('messageReplyAddAdmin', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        });

        //Remove member from the group by admin
        socket.on('remove member from group', function (data) {
            TokenManager.decodeToken(data.userId, function (error, decodedData) {
                if (!error && decodedData.id) {
                    //remove from group
                    data.userId = decodedData.id;
                    process.emit('removeMember', data);
                    process.on('onremoveMemberComplete', function (newGpMember) {
                        //send response to removed member of group
                        // if (newGpMember._doc.hasOwnProperty('groupMembers')) {
                        // for (var index = 0; index < newGpMember.groupMembers.length; index++) {
                        //         var memberIdfromService = newGpMember.groupMembers[index].memberId;
                        //         // var  memeberToberemoved = data.memberId;

                        //     if(memberIdfromService.toString()!=decodedData.id){
                        if (newGpMember.statusCode == 400) {
                            socket.emit('removedFromGroup',
                                {
                                    message: newGpMember
                                });
                        } else {
                            newGpMember._doc['statusCode'] = 200;
                            socket.emit('removedFromGroup',
                                {
                                    message: newGpMember,
                                    operation: 'removed',
                                    performedBy: decodedData.id,
                                    actionOnMember: data.memberId
                                });
                        }

                        //     }
                        // } 
                        // }
                    })
                } else {
                    socket.emit('messageReplyRemoveMember', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        });

        socket.on('remove self from group', function (data) {
            TokenManager.decodeToken(data.userId, function (error, decodedData) {
                if (!error && decodedData.id) {
                    //remove from group
                    data.userId = decodedData.id;
                    process.emit('removeSelf', data);
                    process.on('onRemoveSelfComplete', function (dataa) {
                                    socket.emit('removedSelfFromGroup', { 
                                    message: dataa, 
                                    operation:'removed',
                                    performedBy:decodedData.id,
                                    actionOnMember:decodedData.id});
                    })
                } else {
                    socket.emit('messageReplyRemoveSelf', { message: 'Invalid Token', performAction: 'Reply of message' });
                }
            })
        });
        /*
            socket.on('add user', function (udata) {
                if (addedUser) return;
            console.log('user add')
            // we store the username in the socket session for this client
                socket.username = udata.username;
                socket.topic = udata.room || "room123456";
                ++numUsers;
                addedUser = true;
                socket.emit('login', {
                numUsers: numUsers
                });
                
            
    
                // echo globally (all clients) that a person has connected
                socket.broadcast.emit('user joined', {
                username: socket.username,
                numUsers: numUsers,
                topic: socket.topic
                });
            });
    
    
            // when the client emits 'typing', we broadcast it to others
            socket.on('typing', function () {
                return;
                socket.broadcast.emit('typing', {
                    username: socket.username
                });
            })
    
    
            socket.on('stop typing', function () {
                socket.broadcast.emit('stop typing', {
                    username: socket.username
                });
            });
    
    
    
            // when the user disconnects.. perform this
            socket.on('disconnect', function () {
                if (addedUser) {
                --numUsers;
    
                // echo globally that this client has left
                socket.broadcast.emit('user left', {
                    username: socket.username,
                    numUsers: numUsers,
                    topic: socket.topic	
                });
                }
            });
    
    
    */



        /*
        console.log('here');
        
                socket.emit('login', { username:'Testing', numUsers:'3'});
        
                socket.on('add user', function (data) {
                    console.log(data, '==========');
                });
        
                socket.on('new message', function (data) {
                    console.log(data);
                });
        
                socket.on('messageFromClient', function (data) {
                    //Update SocketConnections
                    if (data && data.token) {
                        TokenManager.decodeToken(data.token, function (err, decodedData) {
                            if (!err && decodedData.id) {
                                if (server.app.socketConnections.hasOwnProperty(decodedData.id)) {
                                    server.app.socketConnections[decodedData.id].socketId = socket.id;
                                    socket.emit('messageFromServer', { message:'Added To socketConnections',performAction:'INFO'});
                                } else {
                                    server.app.socketConnections[decodedData.id] = {
                                        socketId: socket.id
                                    };
                                    socket.emit('messageFromServer', { message:'Socket id Updated',performAction:'INFO'});
                                }
                            } else {
                                socket.emit('messageFromServer', { message:'Invalid Token',performAction:'INFO'});
                            }
                        })
                    }else {
                        console.log('msgFromClient',data)
                    }
                });
        
                socket.emit('messageFromServer', { message:'WELCOME TO FANSPICK', performAction:'INFO'});
        
                process.on('yourCustomEvent', function (data) {
                    if (data['yourConditionHere']){
                        var sparkIdToSend = server.app.socketConnections[data['userId'].toString()]
                            && server.app.socketConnections[data['userId']].socketId;
                        //GetsocketId
                        if (sparkIdToSend) {
                            socket.to(sparkIdToSend).emit('messageFromServer', {
                                message: 'ANY_KIND_OF_MESSAGE_HERE',
                                performAction : 'INFO'
                            });
                        } else {
                            console.log('Socket id not found')
                        }
                    }else {
                        console.log('User id not found')
                    }
        
                });
        */
    });
};

var deliverMessage = function (data) {
    var accessToken = data.userId;
    TokenManager.decodeToken(data.userId, function (error, decodedData) {
        if (!error && decodedData.id) {
            data.userId = decodedData.id
            process.emit('upateMessageStatus', data, 'deliver');
            process.on('upateMessageStatusResponse', function (error, result) {
                if (error) {
                    if (users.hasOwnProperty(data.userId)) {
                        users[data.userId].emit('messageReply', { message: 'status is not updated', performAction: 'error' });
                    }

                } else {
                    if (users.hasOwnProperty(data.userId)) {
                        users[data.userId].emit('messageReply', { message: 'status updation is done', performAction: 'Reply of message' });
                    }

                }
            })
        }
    })
}
var deliverAllMessage = function (data) {
    TokenManager.decodeToken(data.userId, function (error, decodedData) {
        if (!error && decodedData.id) {
            data.userId = decodedData.id
            process.emit('upateAllMessageStatus', data, 'deliver');
            process.on('upateAllMessageStatusResponse', function (error, result) {
                if (error) {
                    if (users.hasOwnProperty(data.userId)) {
                        users[data.userId].emit('messageReply', { message: 'status is not updated', performAction: 'error' });
                    }

                } else {
                    if (users.hasOwnProperty(data.userId)) {
                        users[data.userId].emit('messageReply', { message: 'status updation is done', performAction: 'Reply of message' });
                    }

                }
            })
        }
    })
}

var readMessage = function (data) {
    TokenManager.decodeToken(data.userId, function (error, decodedData) {
        if (!error && decodedData.id) {
            data.userId = decodedData.id
            process.emit('upateMessageStatus', data, 'read');
            process.on('upateMessageStatusResponse', function (error, result) {
                if (error) {
                    users[data.userId].emit('messageReply', { message: 'status is not updated', performAction: 'error' });
                } else {
                    users[data.userId].emit('messageReply', { message: 'status updation is done', performAction: 'Reply of message' });
                }
            })
        }
    })
}

module.exports = {
    getClinetCountForRoom: getClinetCountForRoom,
    connectSocket: connectSocket,
    getClientCount: getClientCount,
    getRoomId: getRoomId,
    users: users,
    userGroupDetail: userGroupDetail,
    usersConnected: function () {
        return users;
    },
    deliverMessage: deliverMessage,
    deliverAllMessage: deliverAllMessage,
    readMessage: readMessage
}
