var moongoose = require('mongoose');
var Schema = moongoose.Schema;

var userContacts = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'fanspickUserSchema' },
    contacts: [{
        userId: { type: Schema.Types.ObjectId, ref: 'fanspickUserSchema' },
        contactNo: { type: String, ref: 'fanspickUserSchema' },
        status: { type: String, default: 'online' },
        isDeleted: { type: Boolean, default : false },
        groupId: { type: Schema.Types.ObjectId, ref: 'chatGroups' },
        name : {type : String, trim: true, require:true}
    }],
    groups: [{
        groupId: { type: Schema.Types.ObjectId, ref: 'chatGroups' }
    }]
})

module.exports = moongoose.model('userContacts', userContacts);