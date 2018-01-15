var mongoose = require('mongoose');
var config = require('../Config');
var Schema = mongoose.Schema;


var SponsorBillboard = new Schema({
    sponsorName: {
        type: String,
        trim: true
    },
    sponsorId: {
        type: Schema.Types.ObjectId,
        ref: 'Sponsor'
    },
    active: {
        type: Boolean,
        default: false
    },
    image: {
        type: String
    },
    link: {
        type: String
    },
    banner: {
        type: String
    },
    color: {
        type: String
    },

    sponsorImageType: {
        type: String,
        enum: [config.APP_CONSTANTS.DATABASE.sponsorImageType.billboard, config.APP_CONSTANTS.DATABASE.sponsorImageType.pitch]
    },
    targetType: {
        type: String,
        enum: [config.APP_CONSTANTS.DATABASE.sponsorBillboardTargetType.country, config.APP_CONSTANTS.DATABASE.sponsorBillboardTargetType.competition, config.APP_CONSTANTS.DATABASE.sponsorBillboardTargetType.fixture]
    },
   countryId: { 
        type: Schema.Types.ObjectId,
         ref: 'countrydatas'
         },
    fixtureId: {
         type: Schema.Types.ObjectId, 
         ref: 'fixturedata'
         },
    competitionId: {
         type: Schema.Types.ObjectId, 
         ref: 'competitionData' 
        },
    dateTimeStart: {
        type : Date,
        default : new Date()
    },
    dateTimeEnd: {
        type : Date,
        default : new Date()
    }

});

// SponsorBillboard.path('targetType').set(function(value) {
//     switch (value){
//         case 'Country' : return 'countrydatas'; break;
//         case 'Competition' : return 'competitiondatas' ; break;
//         case 'Fixture' : return 'fixturedatas'; break;
//         default : return '';
//     }
// });

// SponsorBillboard.pre('save',function(next, done){
//     var self = this._doc;
//     var temp = this._doc.targetID.ref;
//     this._doc.targetID.ref = this._doc.targetType;
//     console.log(this._doc.targetID.ref);
//     next();
// })

module.exports = mongoose.model('sponsorBillboard',SponsorBillboard);