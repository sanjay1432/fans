var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');



var notificationResponseSchema = new Schema({

    userId: { type: Schema.ObjectId, ref: 'fanspickUserSchema', required: true },
    notificationId: { type: Schema.ObjectId, ref: 'notification', required: true },
    responseDate: { type: Date, required: true },
    lat: { type: String, trim: true, required: false },
    long: { type: String, trim: true, required: false },
    questionResponse: {
        questionId: { type: Schema.ObjectId },
        questionText: { type: String, trim: true },
        response: { type: String, trim: true }
    }
});

module.exports = mongoose.model('notificationResponse', notificationResponseSchema);



