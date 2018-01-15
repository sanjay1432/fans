var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');


var Comments = new Schema({
    userId: {type: Schema.ObjectId, ref: 'fanspickUserSchema'},
    type: {type: String, trim: true, required: true},
    message: {type: String, trim: true, required: true, default: null},
    time : {type : Date, required: true}
});



var topicSchema = new Schema({

    name: {type: String, trim: true, unique: true, required: true},
    fixtureID: {type: String, trim: true, required: true},
    createdDate: {type: Date, required: true},
    modifiedDate: {default: Date.now, type: Date, required: true},
    isPinned: {type: Boolean, required: true, default: true},
    isLocked: {type: Boolean, required: true, default: true},
    isDeleted: {type: Boolean, required: true, default: false},
    hot: {type: Boolean, required: true, default: false},
    topicTages: { type : Array , "default" : [] },
    communityID: {type: Schema.ObjectId, ref: 'communitySchema'},
    communityPosts:  [Comments],
    fanspickPosts : [Comments],
    fixtureId: {type: Schema.ObjectId, ref: 'fixturedata'},
});


module.exports = mongoose.model('topicSchema', topicSchema);
