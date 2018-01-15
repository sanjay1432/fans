'use strict';

var Controller = require('../Controllers');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var Joi = require('joi');

module.exports = [
    {
        method: 'POST',
        path: '/api/reporting/getSponsorReport',
        handler: function (request, reply) {
            var userData = request.auth && request.auth.credentials && request.auth.credentials.userData || null;
            if (userData && userData.id) {
                Controller.ReportingController.getSponsorReport(request.payload, function (err, data) {
                    if (err) {
                        reply(UniversalFunctions.sendError(err));
                    } else {
                        reply(UniversalFunctions.sendSuccess(null, data))
                    }
                });
            }
        },
        config: {
            description: 'Gets the report for a particular billboard',
            tags: ['api', 'fanspick'],
            auth: 'FanspickAuth',
            validate: {
                payload: {
                    billboard: Joi.string().required().trim(), 
                    sponsorImageType: Joi.string().valid([
                        'Billboard',
                        'Pitch'
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
    }
]