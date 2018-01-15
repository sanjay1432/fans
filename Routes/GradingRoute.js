'use strict';

var Controller = require('../Controllers');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var Joi = require('joi');

module.exports = [
    {
        method: 'GET',
        path: '/api/fanspick/getGrade',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            //reply(request.payload.materialImages);
            if (userData && userData.id) {
                Controller.GradingController.getGrade(userData, function (err, data) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err));
                    } else {
                        reply(UniversalFunctions.sendSuccess(null, data))
                    }
                });
            }
        },
        config: {
            description: 'Login via access token',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
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
        method: 'POST',
        path: '/api/fanspick/ageVerification',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            if (userData && userData.id) {
                Controller.GradingController.ageVerification(userData, request.payload, function (err, data, isVerified) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err));
                    } else {
                        if (isVerified) {
                            reply(UniversalFunctions.sendSuccess(null, data))
                            
                        }
                        else{
                            reply(UniversalFunctions.sendError(data))
                        }
                    }
                });
            }
        },
        config: {
            description: 'Verify Age',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    dob: Joi.string().description('YYYY-MM-DD').required()
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

]