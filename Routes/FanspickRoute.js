'use strict';
/**
 * Created by Amit.
 */

var Controller = require('../Controllers');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var Joi = require('joi');
var multiparty = require('multiparty');


module.exports = [
    {
        method: 'GET',
        path: '/api/fanspick/getEventLog',
        handler: function (request, reply) {
            Controller.ReportingController.getAllEventLogs(function (err, logs) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, logs))
                }
            });
        },
        config: {
            description: 'Returns all event logs',
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
        method: 'GET',
        path: '/api/fanspick/getAllUsers',
        handler: function (request, reply) {
            Controller.ReportingController.getAllUsers(function (err, logs) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, logs))
                }
            });
        },
        config: {
            description: 'Returns all users',
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
        path: '/api/fanspick/register',
        handler: function (request, reply) {
            var payloadData = request.payload;
            Controller.FanspickController.createUser(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.CREATED, data))
                }
            });
        },
        config: {
            description: 'Register Fanspick user',
            tags: ['api', 'fanspick'],
            /* payload: {
                 output: 'file',
                 parse: true,
                 allow: 'multipart/form-data',
                 maxBytes: 40485760
             }, */
            validate: {
                payload: {

                    fcmId: Joi.string().trim(),
                    firstname: Joi.string().regex(/^[a-zA-Z -]+$/).trim().min(2).optional().options({
                        language: {
                            string: {
                                regex: {
                                    base: 'must not contain any special character'
                                }
                            }
                        }
                    }),
                    lastname: Joi.string().regex(/^[a-zA-Z -]+$/).trim().min(2).optional().options({
                        language: {
                            string: {
                                regex: {
                                    base: 'must not contain any special character'
                                }
                            }
                        }
                    }),
                    emailId: Joi.string().email().required(),
                    username: Joi.string().required().trim(),
                    dob: Joi.string(),//date().format('YYYY-MM-DD').description('YYYY-MM-DD').iso().optional(),
                    gender: Joi.string().required().valid(
                        [
                            'MALE',
                            'FEMALE'
                        ]
                    ),
                    lat: Joi.string().trim().optional(),
                    lon: Joi.string().trim().optional(),
                    deviceType: Joi.string().required().valid([UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.WEB, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS]),
                    deviceToken: Joi.string().required().min(1).trim(),
                    appVersion: Joi.string().required().trim(),
                    password: Joi.string().optional().min(6),
                    facebookId: Joi.string().optional().trim(),
                    googleId: Joi.string().optional().trim(),
                    city: Joi.string().required().optional().trim(),
                    zipcode: Joi.string().optional().trim()

                },
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
        path: '/api/fanspick/uploadFile',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.uploadFile(userData, request, function (error, result) {
                if (error) {
                    reply(UniversalFunctions.sendError(error));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, result));
                }
            })
        },
        config: {
            description: 'upload profile image',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            payload: {
                maxBytes: 30485760,
                parse: true,
                output: 'stream',
                allow: 'multipart/form-data'
            },
            validate: {
                headers: UniversalFunctions.authorizationHeaderObj,
                failAction: UniversalFunctions.failActionFunction
            }
        }
    },
    {
        method: 'POST',
        path: '/api/fanspick/editProfile',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.UpdateUser(request.payload, userData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED, data));
                }
            })
        },
        config: {
            description: 'Edit user profile',
            tags: ['api', 'fanspick', 'auth', 'bearer'],
            auth: 'FanspickAuth',
            payload: {
                maxBytes: 2621440//2097152
            },
            validate: {
                headers: UniversalFunctions.authorizationHeaderObj,

                payload: {
                    firstname: Joi.string().regex(/^[a-zA-Z -]+$/).optional().trim().options({
                        language: {
                            string: {
                                regex: {
                                    base: 'must not contain any special character'
                                }
                            }
                        }
                    }),
                    lastname: Joi.string().regex(/^[a-zA-Z -]+$/).optional().trim().options({
                        language: {
                            string: {
                                regex: {
                                    base: 'must not contain any special character'
                                }
                            }
                        }
                    }),
                    dob: Joi.string(),//.date().format('YYYY-MM-DD').description('YYYY-MM-DD').optional(),
                    lat: Joi.string().optional().trim(),
                    lon: Joi.string().optional().trim(),
                    photo: Joi.string().optional().trim().description('image name'),
                    address: Joi.string().optional().trim(),
                    phoneNumber: Joi.string().optional().trim(),
                    city: Joi.string().optional().trim(),
                    zipcode: Joi.string().optional().trim()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form-data',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/fanspick/login',
        handler: function (request, reply) {
            var payloadData = request.payload;
            Controller.FanspickController.loginUser(payloadData, function (err, data) {
                if (err) {
                    //console.log();
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Login Via Email & Password For Donor',
            tags: ['api', 'fanspick'],
            validate: {
                payload: {
                    email: Joi.string().email().required(),
                    fcmId: Joi.string().trim(),
                    password: Joi.string().trim(),
                    facebookId: Joi.string().trim(),
                    googleId: Joi.string().trim(),
                    loginType: Joi.string().required().valid([UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.SIMPLE, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.GOOGLE, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.FACEBOOK]),
                    deviceType: Joi.string().required().valid([UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.WEB, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS]),
                    deviceToken: Joi.string().required().min(1).trim(),
                    appVersion: Joi.string().required().trim()
                },
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
        path: '/api/fanspick/loginViaAccessToken',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            //reply(request.payload.materialImages);
            if (userData && userData.id) {
                Controller.FanspickController.loginViaAccessToken(request.payload, userData, function (err, data) {
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
                payload: {
                    deviceType: Joi.string().required().valid([UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS]),
                    deviceToken: Joi.string().required().min(1).trim()

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
        method: 'GET',
        path: '/api/fanspick/viewProfile',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            //reply(request.payload.materialImages);
            if (userData && userData.id) {
                Controller.FanspickController.viewProfile(userData, function (err, data) {
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
        method: 'PUT',
        path: '/api/fanspick/forgotPassword',
        handler: function (request, reply) {
            Controller.FanspickController.getResetPasswordToken(request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Sends Reset Password Token To FanspickUser',
            tags: ['api', 'fanspick'],
            validate: {
                payload: {
                    email: Joi.string().email().required()
                },
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
        method: 'PUT',
        path: '/api/fanspick/resetForgotPassword',
        handler: function (request, reply) {
            Controller.FanspickController.resetForgotPassword(request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Reset Password after Forgot',
            tags: ['api', 'fanspick'],
            validate: {
                payload: {
                    phoneNumber: Joi.string().trim().required(),
                    newPassword: Joi.string().min(5).required()
                },
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
        method: 'PUT',
        path: '/api/fanspick/resetPassword',
        handler: function (request, reply) {
            var queryData = request.payload;
            Controller.FanspickController.resetPassword(queryData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Reset Password For User',
            tags: ['api', 'fanspick'],
            validate: {
                payload: {
                    email: Joi.string().email().required(),
                    passwordResetToken: Joi.string().required(),
                    newPassword: Joi.string().min(5).required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'PUT',
        path: '/api/fanspick/changePassword',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.changePassword(request.payload, userData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.UPDATED))
                }
            });
        },
        config: {
            description: 'Change Password of User',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                headers: UniversalFunctions.authorizationHeaderObj,
                payload: {
                    oldPassword: Joi.string().required().min(6).trim(),
                    newPassword: Joi.string().required().min(6).trim()
                },
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
        path: '/api/fanspick/checkUsername',
        handler: function (request, reply) {
            var payloadData = request.payload;
            Controller.FanspickController.checkUsername(payloadData, function (err, data) {
                if (err) {
                    //console.log();
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Check avalability of username',
            tags: ['api', 'fanspick'],
            validate: {
                payload: {
                    username: Joi.string().required().trim()
                },
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
        path: '/api/fanspick/eventLoging',
        handler: function (request, reply) {
            var payloadData = request.payload;
            Controller.FanspickController.eventLoging(payloadData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Loging event of users',
            tags: ['api', 'fanspick'],
            validate: {
                payload: {
                    lat: Joi.string().required(),
                    lon: Joi.string().required(),
                    eventType: Joi.string().required().valid([
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.USER_SIGNIN,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.APP_START,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.ACC_CREATE,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.ACC_COMP,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.ACC_UPDATE,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.TEAM_SEL,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.FIX_SEL,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.COM_SEL,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.TOPIC_SEL,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.BILL_OPEN,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.BILL_SEL,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.ALERT_CLICKED,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.ALERT_BANNER_VIEW,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.ALERT_LINK_CLICKS,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.MANAGERS_PICK,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.FANS_PICK,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.SOCIAL_CLICK,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.EVENT_TYPES.COMMENTARY_VIEWED
                    ]),
                    eventDescription: Joi.string().required(),
                    eventAdditionalInfoID: Joi.string().trim(),
                    userId: Joi.string().trim(),
                    userAgent: Joi.string().required(),
                    deviceType: Joi.string().required().valid([UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.ANDROID, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.WEB, UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.DEVICE_TYPES.IOS]),
                    deviceToken: Joi.string().required().min(1).trim(),
                    appVersion: Joi.string().required().trim()
                },
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
        path: '/api/fanspick/getAllFixtures',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getAllFixtures(function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets all fixtures',
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
        path: '/api/fanspick/getTopicsByCommunity',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getAllTopic(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all community',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    communityID: Joi.string().required().trim(),
                    type: Joi.string().required().valid(
                        [
                            'HOT',
                            'ALL'
                        ]
                    ),
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
        method: 'POST',
        path: '/api/fanspick/getAllTopics',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getAllTopicAsTopicdatas(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all topics',
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
        path: '/api/fanspick/getTopicsByFixture',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getTopicByFixture(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Get Topic for a particular team and fixture',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
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
        method: 'GET',
        path: '/api/fanspick/getAllCommunity',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getAllCommunity(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all community',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                headers: UniversalFunctions.authorizationHeaderObj,
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/fanspick/getMyCommunity',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getMyCommunity(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Find community according to the team',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/addCommunity',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.addCommunity(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Find community according to the team',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    communityId: Joi.string().required().trim()
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
        method: 'GET',
        path: '/api/fanspick/getSports',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getSports(fanspickData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Lists all sports',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                headers: UniversalFunctions.authorizationHeaderObj,
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/fanspick/getCountriesForSport',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getCountriesForSport(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Lists all countries for a particular sport',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    sportId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/getLeaguesForCountry',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getLeaguesForCountry(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all domestic leagues of selected country',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    countryId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/getTeamsForCountry',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getTeamsForCountry(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all teams of a Country',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    countryId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/getTeamsForCompetition',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getTeamsForCompetition(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all teams of a Competition',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    competitionId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/getUpcomingFixtures',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getUpcomingFixtures(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets the upcoming fixtures using teamId',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/getTeamData',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getTeamData(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Get Data for a specific team',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/setFavouriteTeam',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.setFavouriteTeam(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all teams of league',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    type: Joi.string().required().valid(
                        [UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.FAV_TEAM_TYPE.PRIMARY,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.FAV_TEAM_TYPE.SECONDARY]
                    )
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
    //get favourites
    {
        method: 'GET',
        path: '/api/fanspick/getAllFavouriteTeams',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getAllFavouriteTeams(fanspickData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all favourite teams of user',
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
        path: '/api/fanspick/getTeamSquad',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getTeamSquad(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all teams of league',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST',
        path: '/api/fanspick/getTeamSubstitutes',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getTeamSubstitutes(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all substitutes of team',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST',
        path: '/api/fanspick/getPlayerData',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getPlayerDataWithStatistics(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List player details',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    playerId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/unSetFavouriteTeam',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.unSetFavouriteTeam(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Unset favorite team',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/chatHistory',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getChatData(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all chat history',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    topicId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/setUserPick',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.setUserPick(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Set User Pick',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    oldPlayerId: Joi.string().trim(),
                    newPlayerId: Joi.string().required().trim(),
                    positionId: Joi.string().required().trim(),
                    formation: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST',
        path: '/api/fanspick/getSubstitutionStatus',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getSubstitutionStatus(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Set User Pick',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/unsetUserPick',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.unsetUserPick(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Remove player from User Pick',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    playerId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST',
        path: '/api/fanspick/getUserPick',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getUserPick(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets all players selected in User Pick',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST',
        path: '/api/fanspick/clearUserPick',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.clearUserPick(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Clears all players in users pick',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST',
        path: '/api/fanspick/getManagersPick',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getManagersPick(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets all players selected by manager',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim()
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
    }, {
        method: 'POST',
        path: '/api/fanspick/getManagersPickPercentage',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getManagersPickPercentage(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets fanspick and managerpick percentage',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim()
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
    }, {
        method: 'POST',
        path: '/api/fanspick/getFanspickAndManagersPickPercentage',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getFanspickAndManagersPickPercentage(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets fanspick and managerpick percentage',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim()
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
    }, {
        method: 'POST',
        path: '/api/fanspick/getUserpickAndManagersPickPercentage',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getUserpickAndManagersPickPercentage(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets userpick and managerpick percentage',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/createUserAction',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            if (userData && userData.id) {
                Controller.FanspickController.createUserAction(userData, request.payload, function (err, data) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err));
                    } else {
                        reply(UniversalFunctions.sendSuccess(null, data))
                    }
                });
            }
        },
        config: {
            description: 'Create User Action',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    userId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    teamId: Joi.string().required().trim(),
                    playerId: Joi.string().required().trim(),
                    action: Joi.string().required().trim(),
                    time: Joi.string().trim()
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
        method: 'POST',
        path: '/api/fanspick/getNotification',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getNotification(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Get Notification',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    notificationID: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/getFixtureData',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getFixtureData(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets Match Status, Goals and Commentary',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/getFixtureStatus',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getFixtureStatus(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets Fixture Status and Goals',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/getSponsorBillboard',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getSponsorBillboards(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Get billboards for fixture',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().required().trim(),
                    sponsorImageType: Joi.string().default('Billboard').valid([
                        'Billboard', 'Pitch'
                    ])
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
        method: 'POST',
        path: '/api/fanspick/getFanspickFixture',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getFanspickFixture(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets fixture related fanspick data',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST',
        path: '/api/fanspick/getFanspickUserActionStat',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getFanspickUserActionStat(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets fanspick user actions stat data',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST'
        , path: '/api/fanspick/logout'
        , handler: function (request, reply) {
            var token = request.auth.credentials.token;
            var userData = request.auth.credentials.userData;
            if (!token) {
                reply(UniversalFunctions.sendError(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN));
            } else {
                Controller.FanspickController.logout(token, userData, function (err, data) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err));
                    } else {
                        reply(UniversalFunctions.sendSuccess())
                    }
                });

            }
        }, config: {
            description: 'Logout ',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                failAction: UniversalFunctions.failActionFunction,
                headers: UniversalFunctions.authorizationHeaderObj
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/fanspick/getTeamsDetailsForCompetitionId',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getTeamsDetailsForCompetitionId(request.query, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });

        }, config: {
            description: 'get League Standing team`s Data For CompetitionId',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                query: {
                    competitionId: Joi.string().required().trim()
                },
                headers: UniversalFunctions.authorizationHeaderObj,
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/api/fanspick/getPlayersDetailForCompetitionId',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getPlayersDetailForCompetitionId(request.query, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });

        }, config: {
            description: 'get League Standing player`s Data For CompetitionId',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                query: {
                    competitionId: Joi.string().required().trim()
                },
                headers: UniversalFunctions.authorizationHeaderObj,
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/fanspick/getLiveScores',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getLiveScores(request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });

        }, config: {
            description: "get League's live score",
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().required().trim()
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
        method: 'POST',
        path: '/api/fanspick/getUserpickPercentage',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getUserpickPercentage(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });

        }, config: {
            description: "get percentage",
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().required().trim(),
                    teamId: Joi.string().required().trim()
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
    }, {
        method: 'POST',
        path: '/api/fanspick/getUserpickVsFanspickPercentageLive',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getUserpickVsFanspickPercentageLive(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });

        }, config: {
            description: "get percentage Userpick Vs Fanspick",
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().required().trim(),
                    teamId: Joi.string().required().trim()
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
    }, {
        method: 'POST',
        path: '/api/fanspick/getUserpickVsManagerPickPercentageLive',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getUserpickVsManagerPickPercentageLive(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });

        }, config: {
            description: "get percentage Userpick Vs Managerspick",
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().required().trim(),
                    teamId: Joi.string().required().trim()
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
    }, {
        method: 'POST',
        path: '/api/fanspick/getFanspickVsManagerPickPercentageLive',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getFanspickVsManagerPickPercentageLive(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });

        }, config: {
            description: "get percentage Fanspick Vs Managerspick",
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().required().trim(),
                    teamId: Joi.string().required().trim()
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
    // get all formations 
    {
        method: 'POST',
        path: '/api/fanspick/getAllFormations',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getAllFormations(userData, function (error, result) {
                if (error) {
                    reply(UniversalFunctions.sendError(error));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, result))
                }
            })
        },
        config: {
            description: 'get all formations',
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
    // get all formations by _id
    {
        method: 'POST',
        path: '/api/fanspick/getFormationById',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getFormationById(userData, request.payload, function (error, result) {
                if (error) {
                    reply(UniversalFunctions.sendError(error));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, result))
                }
            })
        },
        config: {
            description: 'get formation by id',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    formationId: Joi.string().required().trim()
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
    // get all formations by type
    {
        method: 'POST',
        path: '/api/fanspick/getFormationByType',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getFormationByType(userData, request.payload, function (error, result) {
                if (error) {
                    reply(UniversalFunctions.sendError(error));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, result))
                }
            })
        },
        config: {
            description: 'get formation by id',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    type: Joi.string().required().trim()
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
    //get new formation
    {
        method: 'POST',
        path: '/api/fanspick/getNewFormationWithPlayers',
        handler: function (request, reply) {
            //Controller
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getNewFormationWithPlayersForLiveAndPreMAtch(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'get new formation with players of old formation',
            tags: ['fanspick', 'api'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().required().trim(),
                    teamId: Joi.string().required().trim(),
                    newFormationId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(true)
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
        method: 'POST',
        path: '/api/fanspick/getUserPickIOS',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getUserPickIOS(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets all players selected in User Pick',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST',
        path: '/api/fanspick/getManagerPick_V2',
        handler: function (request, reply) {
            //controller
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getManagerPickV2(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Get Manager Pick',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().trim(),
                    teamId: Joi.string().trim()
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
        method: 'POST',
        path: '/api/fanspick/getFanspickFixtureV2',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getFanspickFixtureV2(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets fixture related fanspick data',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    fixtureId: Joi.string().required().trim(),
                    isLive: Joi.bool().default(false)
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

    // get registered user contacts
    {
        method: 'POST',
        path: '/api/fanspick/getRegisteredContacts',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getRegisteredContacts(fanspickData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets registered user contacts',
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

    // get chats for group
    {
        method: 'POST',
        path: '/api/fanspick/getChatsForGroup',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getChatsForGroup(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets chats for group',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    groupId: Joi.string().required().trim()
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

    // Delete chats for group
    {
        method: 'POST',
        path: '/api/fanspick/deleteChatsForGroup',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.deleteChatsForGroup(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Delete chats for group',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    groupId: Joi.string().required().trim(),
                    type: Joi.string().valid(["All", "Selected"]).default("All"),
                    messageIds: Joi.array().items(Joi.string())
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

    // get recent chats for group
    {
        method: 'POST',
        path: '/api/fanspick/getRecentChats',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getRecentChats(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets recent chats  ',
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
    // generate otp
    {
        method: 'POST',
        path: '/api/fanspick/generateOTP',
        handler: function (request, reply) {
            // var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.generateOTP( request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets recent chats  ',
            tags: ['api', 'fanspick'],
            // auth: 'FanspickAuth',
            validate: {
                payload: {
                    phoneNumber: Joi.string().trim().required(),
                    signUp:Joi.bool().default(true)
                },
                // headers: UniversalFunctions.authorizationHeaderObj,
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
    // Verify otp
    {
        method: 'POST',
        path: '/api/fanspick/verifyOTP',
        handler: function (request, reply) {
            // var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.verifyOTP(request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Gets recent chats  ',
            tags: ['api', 'fanspick'],
            // auth: 'FanspickAuth',
            validate: {
                payload: {
                    otp: Joi.string().required()
                },
                // headers: UniversalFunctions.authorizationHeaderObj,
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
        path: '/api/fanspick/getTeamsForCompetitionName',
        handler: function (request, reply) {
            var fanspickData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getTeamsForCompetitionName(fanspickData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Get teams for competition name',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    competitionName: Joi.string().required().valid([
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.COMPETITIONS.EUROPA_LEAGUE,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.COMPETITIONS.CHAMPIONS_LEAGUE,
                        UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.COMPETITIONS.FA_CUP
                    ])
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
        method: 'POST',
        path: '/api/fanspick/changeFixtureTime',
        handler: function (request, reply) {

            Controller.FanspickController.changeFixtureTime(request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Change Fixture date',
            tags: ['api', 'fanspick'],
            // auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().trim().required(),
                    date: Joi.string().trim().required(),
                    time: Joi.string().trim().required()
                },
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
        path: '/api/fanspick/getMarqueeLeagueResult',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getMarqueeLeagueResult(userData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'getMarqueeLeagueResult',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().trim().required()
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
        method: 'POST',
        path: '/api/fanspick/updateTeamShirtImageURL',
        handler: function (request, reply) {
            Controller.FanspickController.updateTeamShirtImageURL(request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'getMarqueeLeagueResult',
            tags: ['api', 'fanspick'],
            validate: {
                payload: {
                    teams: Joi.array().items(Joi.string()),
                    //   fixtureId: Joi.string().trim().required()
                },
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
        path: '/api/fanspick/changeMatchStatus',
        handler: function (request, reply) {

            Controller.FanspickController.changeMatchStatus(request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Change Fixture date',
            tags: ['api', 'fanspick'],
            // auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().trim().required(),
                    matchStatus: Joi.string().trim().required(),
                    statusTime: Joi.string().trim().required()
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    }, {
        method: 'POST',
        path: '/api/fanspick/getPitchPlayers',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.getPitchPlayers(userData, request.payload, function (error, response) {
                if (error) {
                    reply(UniversalFunctions.sendError(error));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, response));
                }
            })
        },
        config: {
            description: "get pitch's players",
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().trim().required(),
                    teamId: Joi.string().trim().required(),
                    selectedPlayerId: Joi.string().trim().required(),
                    isLive: Joi.bool().default(false)
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
    }, {
        method: 'POST',
        path: '/api/fanspick/swapPlayers',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.swapPlayers(userData, request.payload, function (error, response) {
                if (error) {
                    reply(UniversalFunctions.sendError(error));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, response));
                }
            })
        },
        config: {
            description: "swap two players ",
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    fixtureId: Joi.string().trim().required(),
                    teamId: Joi.string().trim().required(),
                    oldPlayerId: Joi.string().trim().required(),
                    newPlayerId: Joi.string().trim().required(),
                    isLive: Joi.bool().default(false)
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
        method: 'POST',
        path: '/api/fanspick/updateLoginStatus',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.FanspickController.updateLoginStatus(userData, request.payload, function (error, success) {
                if (error) {
                    reply(UniversalFunctions.sendError(error));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, success));
                }
            })
        },
        config: {
            description: "update login status of user",
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    onceLogin: Joi.string().trim().required()
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
    }

];