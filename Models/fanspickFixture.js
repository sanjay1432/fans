var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');


// var LineUpPlayers = new Schema({
//     _id: false,
//     playerId: {
//         type: String,
//         trim: true
//     },
//     playerName: {
//         type: String,
//         trim: true
//     },
//     playerPositionX: {
//         type: Number,
//         trim: true,
//         default: null
//     },
//     playerPositionY: {
//         type: Number,
//         trim: true,
//         default: null
//     },
//     playerRole: {
//         type: String,
//         trim: true
//     }
// });

var LineUpPlayers = new Schema({
    playerId: {
        type: Schema.ObjectId,
        ref: 'playerData'
    },
    positionId: {
        type: Schema.ObjectId,
        ref: 'lkpPosition'
    }
});


var PlayerStatus = new Schema({
    _id: false,
    playerID: {
        type: String,
        trim: true
    },
    isHairdryer: {
        type: String,
        trim: true
    },
    isStar: {
        type: String,
        trim: true
    },
    isManOfMatch: {
        type: String,
        trim: true
    }
});

var Substitutions = new Schema({
    playerOutId: { type: Schema.ObjectId, trim: true },
    playerInId: { type: Schema.ObjectId, trim: true },
    positionId: { type: Schema.ObjectId, trim: true },
    minutes: { type: String, trim: true, default: '0' }
}, { _id: false });

var ActionStats = new Schema({
    playerId: {
        type: Schema.ObjectId,
        ref: 'fanspickUserSchema'
    },
    action: {
        type: String,
        trim: true
    },
    minutes: {
        type: String,
        trim: true
    },
    time: {
        type: Date,
        required: true
    }
});

var FanspickFixtureSchema = new Schema({

    fixtureId: {
        type: Schema.ObjectId,
        ref: 'fixture'
    },
    teamId: {
        type: Schema.ObjectId,
        ref: 'teams'
    },
    formationId: {
        type: Schema.ObjectId,
        ref: 'formations'
    },
    lineUpPlayers: [LineUpPlayers],
    actionStats: [ActionStats],
    lastUpdate: {
        type: Date
    },

    isLive: {
        type: Boolean,
        default: false
    },
    substitutions: [Substitutions]
});


module.exports = mongoose.model('fanspickFixture', FanspickFixtureSchema);