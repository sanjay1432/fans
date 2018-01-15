var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Config = require('../Config');


// var LineUpPlayers = new Schema({
//     playerId: {type: String, trim: true},
//     playerName: {type: String, trim: true},
//     playerPositionX: {type: Number, trim: true, default: null},
//     playerPositionY: {type: Number, trim: true, default: null},
//     playerRole: {type: String, trim: true}
// });

var LineUpPlayers = new Schema({
    playerId: {type: Schema.Types.ObjectId, ref : 'playerData'},
    positionId : {type : Schema.Types.ObjectId, ref : 'lkpPosition'}
});

var removeLineUpPlayers = new Schema({
    playerId: {type: Schema.Types.ObjectId, ref : 'playerData'},
    positionId : {type : Schema.Types.ObjectId, ref : 'lkpPosition'}
});


var Substitutions = new Schema({
    // playerOutId: {type: Schema.ObjectId, trim: true},
    // playerOutName: {type: String, trim: true},
    // playerOutPositionX: {type: Number, trim: true, default: null},
    // playerOutPositionY: {type: Number, trim: true, default: null},
    // playerOutRole: {type: String, trim: true},
    // playerInID: {type: Schema.ObjectId, trim: true},
    // playerInName: {type: String, trim: true},
    // playerInPositionX: {type: Number, trim: true, default: null},
    // playerInPositionY: {type: Number, trim: true, default: null},
    // playerInRole: {type: String, trim: true},
    // minutes: {type: String, trim: true},
    // time: {type: Date, required: true}

    // new
     playerOutId: {type: Schema.ObjectId, trim: true},
     playerInId : {type: Schema.ObjectId, trim: true},
     positionId : {type: Schema.ObjectId, trim: true},
     minutes: {type: String, trim: true, default :'0'}
},{_id: false});

var UserActions = new Schema({
    time: {type: Date, required: true},
    minutes: {type: String, trim: true},
    playerId:  {type: Schema.Types.ObjectId, ref : 'playerData'},//{type: String, trim: true},
    action: {type: String, trim: true}
});

var UserFixtureSchema = new Schema({

    userId: {type: Schema.ObjectId, ref: 'fanspickUserSchema'},
    fixtureId: {type: Schema.ObjectId, ref: 'fixturedata'},
    teamId: {type: Schema.ObjectId, ref: 'teams'},
    currentFormation:  {type: Schema.Types.ObjectId, ref : 'formations'},//{type: String, trim: true, required: false, unique: false},
    isFavouriteTeam: {type: String, index: true, required: false, sparse: true},
    isPrimaryFavouriteTeam: {type: String, required: false},
    createdDate: {type: Date},
    updatedDate: {type: Date},    
    lineUpPlayers: [LineUpPlayers],
    substitutes: [],//[Subsitutes],
    substitutions : [Substitutions],
    userActions: [UserActions],
    removeLineUpPlayers : [removeLineUpPlayers],
    isLive : {type : Boolean, default : false},
    isDeleted : {type : Boolean, default : false}

});


module.exports = mongoose.model('userFixture', UserFixtureSchema);