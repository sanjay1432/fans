var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');



var Question = new Schema({
    createdDate: { type: Date },
    createdBy: { type: String },
    validStartDate: { type: Date },
    validEndDate: { type: Date },
    question: { type: String },
    PossibleResponses: [String],
    teamId: { type: Schema.ObjectId, ref: 'teams' },
    fixtureId: { type: Schema.ObjectId, ref: 'fixturedata' },
    competitionId: { type: Schema.ObjectId, ref: 'competitionData' },
    country: { type: String }
});

var Questionnaire = new Schema({
    questions: [Question]
});

var TargetGroup = new Schema({
    targetType: { type: String, trim: true },
    targetCommunityId: { type: Schema.ObjectId, ref: 'communitySchema' },
    targetAgeRange: { type: String, trim: true }
});

var NotificationSchema = new Schema({

    notificationType: { type: String, trim: true, required: true },
    createdDate: { type: Date },
    scheduledDate: { type: Date },
    expiryDate: { type: Date },
    targetGroups: [TargetGroup],
    notificationTitle: { type: String, required: true },
    notificationMessage: { type: String, required: true },
    questionnaires: [Questionnaire],
    triggerAgeCheck: { type: String, required: true },
    sent: { type: String, required: true },
    sentDate: { type: Date },
    notificationIcon: { type: String },
    bannerImage: { type: String },
    bannerUrl: { type: String }
});


module.exports = mongoose.model('notification', NotificationSchema);