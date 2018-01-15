var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var otps = new Schema({
    otp : { type: String, required: false },
    userId : { type : Schema.Types.ObjectId, ref : 'fanspickUserSchema'},
    createdOn : { type: Date }
});

module.exports = mongoose.model('otps',otps);