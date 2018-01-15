var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');


var UserNotificationSchema = new Schema({

    userId: { type: Schema.ObjectId, ref: 'fanspickUserSchema', required: true },
    notificationId: { type: Schema.ObjectId, ref: 'notification', required: true },
    generatedDate: { type: Date, required: true },
    readDate: { type: Date },
    isRead: { type: Boolean },
    deletedDate: { type: Date },
    isDeleted: { type: Boolean }
});


module.exports = mongoose.model('userNotification', UserNotificationSchema);