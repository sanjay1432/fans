
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var OldVersion = new Schema({
    versionNo: {type: String, trim: true, index: true, sparse: true},
    ChangeOn: {type: Date, required: true},
});


var sportVersionSchema = new Schema({
    sportName: {type: String, trim: true, required: true, unique: true},
    latestVersion: {type: String, trim: true, required: true},
    dateOn: {type: Date, required: true},
    oldVersion: [OldVersion],
    seasons: [{type: Schema.ObjectId, ref: 'seasonData'}],
});

module.exports = mongoose.model('sportVersion', sportVersionSchema);