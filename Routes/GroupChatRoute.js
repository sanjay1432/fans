var Controller = require('../Controllers');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var Joi = require('joi');

module.exports = [{
    //create group chat api
    method: 'POST',
    path: '/api/fanspick/createGroup',
    handler: function (request, reply) {
        var userData =  request.auth && request.auth.credentials && request.auth.credentials.userData || null;
        Controller.GroupChatController.createNewGroup(userData, request.payload, function (error, result) {
            if (error) {
                reply(UniversalFunctions.sendError(error));
            } else {
                reply(UniversalFunctions.sendSuccess(null))
            }
        })
    },
    config: {
        tags: ['api', 'fanspick'],
        description: 'create a new group',
        auth: 'FanspickAuth',
        validate: {
            payload: {
                name: Joi.string().required().trim(),
                members: Joi.array().items(Joi.string()).required()

            },
           headers: UniversalFunctions.authorizationHeaderObj,
            failAction: UniversalFunctions.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
            }
        }
    }
},{
    //create group chat api
    method: 'POST',
    path: '/api/fanspick/addNewMember',
    handler: function (request, reply) {
        var userData =  request.auth && request.auth.credentials && request.auth.credentials.userData || null;
        Controller.GroupChatController.addNewMember(userData, request.payload, function (error, result) {
            if (error) {
                reply(UniversalFunctions.sendError(error));
            } else {
                reply(UniversalFunctions.sendSuccess(null))
            }
        })
    },
    config: {
        tags: ['api', 'fanspick'],
        description: 'add new member',
        auth: 'FanspickAuth',
        validate: {
            payload: {
                groupId : Joi.string().required().trim(),
                memberId : Joi.string().required().trim()

            },
           headers: UniversalFunctions.authorizationHeaderObj,
            failAction: UniversalFunctions.failActionFunction
        },
        plugins: {
            'hapi-swagger': {
                payloadType: 'form',
                responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
            }
        }
    }
},
{
    method : 'POST',
    path : '/api/fanspick/getGroupDetail',
    handler : function(request, reply){
        var userData =  request.auth && request.auth.credentials && request.auth.credentials.userData || null;
        Controller.GroupChatController.getGroupDetail(userData, request.payload, function(error, result){
            if (error) {
                reply(UniversalFunctions.sendError(error));
            } else {
                reply(UniversalFunctions.sendSuccess(null, result))
            }
        })
    },
    config : {
        tags : ['api','fanspick'],
        description : 'get group complete detial',
        auth : 'FanspickAuth',
        validate:{
            payload : {
                groupId : Joi.string().required().trim()
            },
            headers : UniversalFunctions.authorizationHeaderObj,
            failAction : UniversalFunctions.failActionFunction
        },
        plugins : {
            'hapi-swagger' : {
                payloadType : 'form',
                responseMessages : UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
            }
        }
    }    
}]