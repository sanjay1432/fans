'use strict';

/**
 * Created by shahab on 10/7/15.
 */

//External Dependencies
var Hapi = require('hapi');

//Internal Dependencies
var Config = require('./Config');
var Routes = require('./Routes');
var Plugins = require('./Plugins');
var Controller = require('./Controllers');
var Bootstrap = require('./Utils/BootStrap');
var Service = require('./Services');
var chatGroupHandler = require('./Lib/chatGroupHandler');
//Create Server
var server = new Hapi.Server({
    app: {
        name: Config.APP_CONSTANTS.SERVER.appName
    }
});

server.connection({
    port: Config.APP_CONSTANTS.SERVER.PORTS.HAPI,
    routes: { cors: true }
   
});

//Register All Plugins
server.register(Plugins, function (err) {
    if (err){
        server.error('Error while loading plugins : ' + err)
    }else {
        server.log('info','Plugins Loaded')
    }
});

//Default Routes
server.route(
    {
        method: 'GET',
        path: '/',
        handler: function (req, res) {
            //TODO Change for production server
            res.view('index')
        }
    }
);

//API Routes
server.route(Routes);

//change image content length error
 server.ext('onPreResponse', function (request, reply) {
     var response = reply.request.response;
     if (response.isBoom) {
        if(response.message.match("Payload content length greater than maximum allowed")){
            request.response.output.payload.message = "Image is too large"
        }
     }
     return reply.continue();
 })

//Connect To Socket.io
Bootstrap.connectSocket(server);

//Bootstrap admin data
Bootstrap.bootstrapAdmin(function (err, message) {
    if (err) {
        console.log('Error while bootstrapping admin : ' + err)
    } else {
        console.log(message);
    }
});

var schedule = require('node-schedule');

var rule = new schedule.RecurrenceRule();

rule.minute = 5;

var j = schedule.scheduleJob(rule, function(){
    var options = {lean: true},
                projection ={modifiedDate:0, isPinned:0, isDeleted:0, isLocked:0};

            Service.AdminService.getTopicHotUpdate({}, projection, options, function (err, res) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("cron done")
                }
            });

});

//Bootstrap Version data
/*Bootstrap.bootstrapAppVersion(function (err, message) {
    if (err) {
        console.log('Error while bootstrapping version : ' + err)
    } else {
        console.log(message);
    }
});*/



//Adding Views
server.views({
    engines: {
        html: require('handlebars')
    },
    relativeTo: __dirname,
    path: './Views'
});

//Start Server
server.start(function () {
    chatGroupHandler.getUserDetailSchedule;
    server.log('info', 'Server running at: ' + server.info.uri);
});

