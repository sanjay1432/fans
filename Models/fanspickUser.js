var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');
var UniversalFunctions = require('../Utils/UniversalFunctions');
var UserContacts = require('./userContacts');


var TeamFavourite = new Schema({
    //stats as away team 
    favouriteTeam: { type: Schema.ObjectId, ref: 'teams' },
    favouriteTeamCountry: { type: Schema.ObjectId, ref: 'sportVersion' },
    favouriteTeamLeague: { type: Schema.ObjectId, ref: 'leagueData' }
    //default: {type: Boolean, required: true, default: false},
});

var DefaultTeam = new Schema({
    //stats as away team 
    favouriteTeam: { type: Schema.ObjectId, ref: 'teams' },
    favouriteTeamCountry: { type: Schema.ObjectId, ref: 'sportVersion' },
    favouriteTeamLeague: { type: Schema.ObjectId, ref: 'leagueData' }
});

var AgeVerification = new Schema({
    dob: { type: Date, required: true },
    verificationDate: { type: Date, required: true },
    isVerified: { type: Boolean, required: true }

});

var fanspickUserSchema = new Schema({
    //**************************Required Fields**********************************//
    accessToken: { type: String, trim: true, index: true, unique: true, sparse: true },
    fcmId: { type: String, trim: true },
    profileComplete: { type: Number, default: 0, required: true },
    username: { type: String, trim: true, unique: true, required: true },
    firstname: { type: String, trim: true, required: false },
    lastname: { type: String, trim: true, required: false },
    emailId: { type: String, trim: true, unique: true, required: true },
    lat: { type: String, trim: true, required: false },
    long: { type: String, trim: true, required: false },
    rejection: { type: Boolean, required: true, default: false },
    deviceType: { type: String, trim: true, required: true },
    deviceToken: { type: String, trim: true, required: true },
    appVersion: { type: String, trim: true, required: true },
    dob: { type: Date, required: false },
    gender: { type: String, trim: true, required: true },
    onceLogin: { type: String, trim: true, required: true, default: false },
    gradeValue: { type: String, trim: true },
    gradePoint: { type: String, trim: true },


    //pictures: [{type: Schema.ObjectId, ref: 'charityImagesSchema'}],

    //**************************Optional**********************************//
    //logoFileId: {type: String, trim: true, required: false},
    passwordHash: { type: String, required: false },
    facebookId: { type: String, unique: true, trim: true, sparse: true },
    googleId: { type: String, unique: true, trim: true, sparse: true },
    loginType: { type: String, required: true, default: UniversalFunctions.CONFIG.APP_CONSTANTS.DATABASE.LOGIN_TYPE.SIMPLE },
    country: { type: String, trim: true, required: false },
    loggedInOn: { type: Date, required: false },
    lastActiveTime: { type: Date, required: false },
    deleteByAdmin: { type: Boolean, required: true, default: false },
    passwordChangedOn: { type: Number, required: false },
    passwordResetToken: { type: String, trim: true, unique: true, index: true, sparse: true },
    passwordChangesOn: { type: Date, required: false },
    //**************************Must for all Schemas**********************************//
    createdOn: { type: Date, required: true },
    teamFavourite: [TeamFavourite],
    defaultTeam: [DefaultTeam],
    communityId: [],
    ageVerification: [AgeVerification],
    updatedOn: { default: Date.now, type: Date, required: true },
    active: { type: Boolean, default: false },         //to check current user's status(active or inactive)
    photo : { type: String, trim: true, required: false },
    // photo:    { data: Buffer, required: false },
    address: { type: String, trim: true, required: false },
    phoneNumber: { type: String, trim: true },
    city: { type: String, trim: true, required: false },
    zipcode: { type: String, trim: true, required: false }
});

/**pre-save middle-ware*/
/*fanspickUserSchema.pre('update',function(next){
    //update usercontact 
    var modifiedField = this.getUpdate().$set.field;
    this.find({_id : currentData._id}, function(error, result){
        if(error){
            next(error);
        }else if(result && result.length > 0){
            if(currentData.deviceToken != result[0].deviceToken){
                UserContacts.update({userId : currentData._id}, {$set: { contacts: [] }},{new : true},function(error, result){
                    if(error){
                        next(error);
                    }else{
                        next();
                    }
                })
            }
        }else{
            next();
        }
    })
})
*/
//charitySchema.index({emailId:1, phoneNumber:1, name:1}, {unique: true});
module.exports = mongoose.model('fanspickUserSchema', fanspickUserSchema);