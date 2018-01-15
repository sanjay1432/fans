/**
 * Created by shahab on 10/7/15.
 */
'use strict';
var AdminRoute = require('./AdminRoute');
var FanspickRoute = require('./FanspickRoute');
var GradingRoute = require('./GradingRoute');
var NotificationRoute = require('./NotificationRoute');
var playerRoute = require('./playerRoute');
var ReportingRoute = require('./ReportingRoute');
var GroupChatRoute = require('./GroupChatRoute');
var all = [].concat(AdminRoute, FanspickRoute, GradingRoute, NotificationRoute, playerRoute, ReportingRoute,GroupChatRoute);

module.exports = all;

