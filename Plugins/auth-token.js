'use strict';
/**
 * Created by shahab on 12/7/15.
 */

var TokenManager = require('../Lib/TokenManager');
var UniversalFunctions = require('../Utils/UniversalFunctions');

exports.register = function(server, options, next){

//Register Authorization Plugin
    server.register(require('hapi-auth-bearer-token'), function (err) {
        server.auth.strategy('UserAuth', 'bearer-access-token', {
            allowQueryToken: false,
            allowMultipleHeaders: true,
            accessTokenName: 'accessToken',
            validateFunc: function (token, callback) {
                TokenManager.verifyToken(token, function (err,response) {
                    if (err || !response || !response.userData){
                        callback(null, false, {token: token, userData: null})
                    }else {
                        callback(null, true, {token: token, userData: response.userData})
                    }
                });

            }
        });
        server.auth.strategy('FanspickAuth', 'bearer-access-token', {
            allowQueryToken: false,
            allowMultipleHeaders: true,
            accessTokenName: 'accessToken',
            validateFunc: function (token, callback) {
                TokenManager.verifyFanspickToken(token, function (err,response) {
                    if (err || !response || !response.userData){
                        callback(err, false, {token: err, userData: null})
                    }else {
                        callback(null, true, {token: token, userData: response.userData})
                    }
                });

            }
        });
        /* server.auth.strategy('DonorAuth', 'bearer-access-token', {
            allowQueryToken: false,
            allowMultipleHeaders: true,
            accessTokenName: 'accessToken',
            validateFunc: function (token, callback) {
                console.log(token,'======')
                TokenManager.verifyDonorToken(token, function (err,response) {
                    if (err || !response || !response.userData){
                        callback(null, false, {token: token, userData: null})
                    }else {
                        callback(null, true, {token: token, userData: response.userData})
                    }
                });

            }
        }); */
        /*server.auth.strategy('AdminAuth', 'bearer-access-token', {
            allowQueryToken: false,
            allowMultipleHeaders: true,
            accessTokenName: 'accessToken',
            validateFunc: function (token, callback) {
                TokenManager.verifyAdminToken(token, function (err,response) {
                    if (err || !response || !response.userData){
                        callback(null, false, {token: token, userData: null})
                    }else {
                        callback(null, true, {token: token, userData: response.userData})
                    }
                });

            }
        });*/

    });

    next();
};

exports.register.attributes = {
    name: 'auth-token-plugin'
};