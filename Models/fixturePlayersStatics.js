
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');
var fixturePlayersStatic = new Schema({
    fixtureId : {
        type : Schema.ObjectId,
        ref : 'fixturedatas'
    },
    playerId : {
        type : Schema.ObjectId,
        ref : 'playerdatas'
    },
    posX : {
        type : Number,
        default : 0
    },
    posY : {
        type : Number,
        default : 0
    },
    role : {
        type : String
    },
    isStatic : {
        type : Boolean,
        default : false
    }
});

module.exports = mongoose.model('fixturePlayersStatic', fixturePlayersStatic);

