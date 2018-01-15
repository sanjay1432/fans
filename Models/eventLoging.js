 var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');



var eventLogingSchema = new Schema({
    lat: {type: String, trim: true, required: true},
    long: {type: String, trim: true, required: true},
    deviceType: {type: String, trim: true, required: true},
    deviceToken: {type: String, trim: true, required: true},
    appVersion: {type: String, trim: true, required: true},
    eventType: {type: String, trim: true, required: true},
    eventDescription: {type: String, trim: true, required: true},
    eventAdditionalInfoID: {type: String, trim: true, required: false},
    userAgent: {type: String, trim: true, required: true},    
    userId: {type: Schema.ObjectId, ref: 'fanspickUserSchema', required: false},
    //platform: {type: String, trim: true, required: true},
    loggedInOn: {default: Date.now, type: Date, required: true}
});

//charitySchema.index({emailId:1, phoneNumber:1, name:1}, {unique: true});
module.exports = mongoose.model('eventLogingSchema', eventLogingSchema);
