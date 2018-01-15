'use strict';
/**
 * Created by Amit.
 */

var Controller = require('../Controllers');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var Joi = require('joi');

var non_auth_routes = [


    {
        method: 'POST',
        path: '/api/admin/login',
        config: {
            description: 'Login for Super Admin',
            tags: ['api', 'admin'],
            handler: function (request, reply) {
                var queryData = {
                    email: request.payload.email,
                    password: request.payload.password,
                    ipAddress: request.info.remoteAddress || null
                };
                Controller.AdminController.adminLogin(queryData, function (err, data) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err))
                    } else {
                        reply(UniversalFunctions.sendSuccess(null, data))
                    }
                })
            },
            validate: {
                failAction: UniversalFunctions.failActionFunction,
                payload: {
                    email: Joi.string().email().required(),
                    password: Joi.string().required()
                }
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    }

];


var adminLogin = [
    {
        method: 'PUT'
        , path: '/api/admin/logout'
        , handler: function (request, reply) {
            var token = request.auth.credentials.token;
            var userData = request.auth.credentials.userData;
            if (!token) {
                reply(UniversalFunctions.sendError(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.INVALID_TOKEN));
            } else if (userData && userData.type != UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.USER_ROLES.ADMIN) {
                reply(UniversalFunctions.sendError(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.ERROR.UNAUTHORIZED))
            } else {
                Controller.AdminController.adminLogout(token, function (err, data) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err));
                    } else {
                        reply(UniversalFunctions.sendSuccess())
                    }
                });

            }
        }, config: {
            description: 'Logout for Super Admin',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
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
    }
];


/*
var adminChatSystem = [
    {
        method: 'POST'
        , path: '/api/admin/logout'
        , handler: function (request, reply) {
        var donorData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.createTopic(request.payload, donorData, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
    }, config: {
        description: 'Add new topic',
        tags: ['api', 'admin'],
        auth: 'UserAuth',
        validate: {
            payload:{
                    id:Joi.string().length(24).required(),
                    type: Joi.string().required().valid(
                        [
                            'CHARITY',
                            'CAMPAIGN'
                        ]
                    ),
                    favourite: Joi.string().required().valid(
                        [
                            'true',
                            'false'
                        ]
                    )
                },
            failAction: UniversalFunctions.failActionFunction,
            headers: UniversalFunctions.authorizationHeaderObj
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
*/



var adminCommunitySystem = [
    {
        method: 'POST',
        path: '/api/admin/addComunity',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.createCommunity(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'Create Community',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {

                    Name: Joi.string().required().trim(),
                    Description: Joi.string().required().trim(),
                    SportID: Joi.string().required().trim(),
                    LeagueID: Joi.string().trim(),
                    TeamID: Joi.string().trim(),
                    Location: Joi.string().trim(),
                    AgeRange: Joi.string().trim(),
                    Admin: Joi.string().trim(),
                    Moderators: Joi.string().trim()

                },
                //headers: UniversalFunctions.authorizationHeaderObj,
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
        path: '/api/admin/getAllCommunity',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.getAllCommunity(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all community',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
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
        path: '/api/admin/addTopic',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.createTopic(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(UniversalFunctions.CONFIG.APP_CONSTANTS.STATUS_MSG.SUCCESS.DEFAULT, data))
                }
            });
        },
        config: {
            description: 'Create Topic for Community',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {

                    name: Joi.string().required().trim(),
                    fixtureID: Joi.string().required().trim(),
                    communityID: Joi.string().required().trim(),
                    isPinned: Joi.string().required().valid(
                        [
                            'true',
                            'false'
                        ]
                    ),
                    isLocked: Joi.string().required().valid(
                        [
                            'true',
                            'false'
                        ]
                    ),
                    isDeleted: Joi.string().required().valid(
                        [
                            'true',
                            'false'
                        ]
                    ),
                    topicTages: Joi.array().optional().max(5)

                },
                //headers: UniversalFunctions.authorizationHeaderObj,
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    // payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    {
        method: 'POST',
        path: '/api/admin/getTopicsByCommunity',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.getAllTopic(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all community',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {
                    communityID: Joi.string().required().trim()
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
        path: '/api/admin/getTopicsById',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.getTopicData(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all community',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {
                    topicId: Joi.string().required().trim()
                },
                //headers: UniversalFunctions.authorizationHeaderObj,
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
        path: '/api/admin/getCommunityById',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.getCommunityData(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all community',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {
                    communityId: Joi.string().required().trim()
                },
                //headers: UniversalFunctions.authorizationHeaderObj,
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


var adminSportSystem = [
    {
        method: 'GET',
        path: '/api/admin/getSportData',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.getSportData(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all sport data',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                //headers: UniversalFunctions.authorizationHeaderObj,
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    },
    /*{
        method: 'POST',
        path: '/api/admin/getSeasonData',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.getSeasonData(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all sport data',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {
                    seasonId: Joi.string().required().trim()
                },
                //headers: UniversalFunctions.authorizationHeaderObj,
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType: 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    }, */
    {
        method: 'POST',
        path: '/api/admin/getAllTeamsOfLeague',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.getAllTeamsOfLeague(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List all teams of leagues',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {
                    leagueId: Joi.string().required().trim()
                },
                //headers: UniversalFunctions.authorizationHeaderObj,
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
        path: '/api/admin/getTeamData',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.getTeamData(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'List team Data',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {
                    id: Joi.string().required().trim()
                },
                //headers: UniversalFunctions.authorizationHeaderObj,
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
        path: '/api/admin/setHashTags',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.setTags(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Set hash tags',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {
                    id: Joi.string().required().trim(),
                    //hashTags: Joi.array().optional().max(5),
                    hashTags: Joi.string().required().trim()
                },
                //headers: UniversalFunctions.authorizationHeaderObj,
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
        path: '/api/admin/deleteTeamTags',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.deleteTags(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Delete old tags',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                headers: UniversalFunctions.authorizationHeaderObj,
                payload: {
                    id: Joi.string().required().trim(),
                    tagIndex: Joi.string().required().trim()
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
        path: '/api/admin/updateTeamShirt',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.updateTeamShirt(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'update team shirt',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {
                    teamId: Joi.string().required().trim(),
                    shirtImage: Joi.string().required()
                },
                //headers: UniversalFunctions.authorizationHeaderObj,
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
        path: '/api/admin/createNotification',
        handler: function (request, reply) {
            var adminData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            Controller.AdminController.createNotification(adminData, request.payload, function (err, data) {
                if (err) {
                    reply(UniversalFunctions.sendError(err));
                } else {
                    reply(UniversalFunctions.sendSuccess(null, data))
                }
            });
        },
        config: {
            description: 'Create Notification',
            tags: ['api', 'admin'],
            //auth: 'UserAuth',
            validate: {
                payload: {
                    notificationType: Joi.string().required().valid([
                        "BasicAlert",
                        "Questionnaire",
                        "Competition",
                        "BannerAlert"
                    ]),
                    targetGroup: Joi.string(),
                    notificationTitle: Joi.string().required(),
                    notificationMessage: Joi.string().required(),
                    triggerAgeCheck: Joi.string().required(),
                    notificationIcon: Joi.string().optional(),
                    notificationBanner: Joi.string().optional(),
                    bannerUrl: Joi.string().optional(),
                    scheduledDate: Joi.date().format('YYYY-MM-DD').description('YYYY-MM-DD').optional(),
                    expiryDate: Joi.date().format('YYYY-MM-DD').description('YYYY-MM-DD').optional()
                },
                //headers: UniversalFunctions.authorizationHeaderObj,
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


];

/* Sponsor Billboard */

var adminSponsorBillBoard = [

    {
        method: 'POST',
        path: '/api/admin/createSponsorBillboard',
        handler: function (request, reply) {
            Controller.AdminController.createSponsorBillBoard(request.payload, function (error, response) {
                if (error) {
                    reply(UniversalFunctions.sendError(error));
                } else {
                    reply(UniversalFunctions.sendSuccess('sponsor billboard created', response));
                }
            })
        },
        config: {
            description: 'create sponsor billlboard',
            tags: ['api', 'admin'],

            validate: {
                payload: {
                    sponsorName: Joi.string().required().trim(),
                    sponsorId: Joi.string(),
                    active: Joi.boolean(),
                    bannerImage: Joi.string(),
                    hyperlink: Joi.string(),
                    billboardImage: Joi.string(),
                    billboardColor: Joi.string(),
                    targetType: Joi.string().valid([
                        'Country', 
                        'Competition', 
                        'Fixture'
                        ]),
                    targetId: Joi.string(),
                    dateTimeStart: Joi.date().format('YYYY-MM-DD').description('YYYY-MM-DD'),
                    dateTimeEnd: Joi.date().format('YYYY-MM-DD').description('YYYY-MM-DD')

                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType : 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    }
];


//add hashtags for twitter and facebook

var adminHashTagsTwitterORFacebook = [

    {
        method: 'POST',
        path: '/api/admin/addHashtags',
        handler: function (request, reply) {
            Controller.AdminController.updateTeamWithHashTags(request.payload, function (error, response) {
                if (error) {
                    reply(UniversalFunctions.sendError(error));
                } else {
                    reply(UniversalFunctions.sendSuccess('successfully added', response));
                }
            })
        },
        config: {
            description: 'Update with hashtags for facebook/twitter',
            tags: ['api', 'admin'],
            validate: {
                payload: {
                    // hashTagType : Joi.string().valid([
                    //     'facebook',
                    //     'twitter'
                    // ]).required(),
                    fullName : Joi.string().required().trim(),
                    twitterHashTags : Joi.array().items(Joi.string()),
                    facebookHashTags : Joi.array().items(Joi.string())
                    
                },
                failAction: UniversalFunctions.failActionFunction
            },
            plugins: {
                'hapi-swagger': {
                    payloadType : 'form',
                    responseMessages: UniversalFunctions.CONFIG.APP_CONSTANTS.swaggerDefaultResponseMessages
                }
            }
        }
    }
];

//var authRoutes = [].concat(userRoutes, adminLogin);

//module.exports = authRoutes.concat(non_auth_routes);
module.exports = [].concat(non_auth_routes, adminLogin, adminCommunitySystem, adminSportSystem, adminSponsorBillBoard, adminHashTagsTwitterORFacebook);