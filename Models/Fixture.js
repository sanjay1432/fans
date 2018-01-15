var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Config = require('../Config');

var Commentaries = new Schema({
    // contain stats of team
    important: { type: String, trim: true, default: null, sparse: true },
    isgoal: { type: String, trim: true, default: null, sparse: true },
    minute: { type: String, trim: true, default: null, sparse: true },
    comment: { type: String, trim: true, default: null, sparse: true },
    id: { type: String, trim: true, default: null, sparse: true },
});

var playerInfo = new Schema({
    // contain stats of team
    important: { type: String, trim: true, default: null, sparse: true },
    name: { type: String, trim: true, default: null, sparse: true },
    pos: { type: String, trim: true, default: null, sparse: true },
    posx: { type: String, trim: true, default: null, sparse: true },
    posy: { type: String, trim: true, default: null, sparse: true },
    shots_total: { type: String, trim: true, default: null, sparse: true },
    shots_on_goal: { type: String, trim: true, default: null, sparse: true },
    goals: { type: String, trim: true, default: null, sparse: true },
    goals_conceded: { type: String, trim: true, default: null, sparse: true },
    assists: { type: String, trim: true, default: null, sparse: true },
    offsides: { type: String, trim: true, default: null, sparse: true },
    fouls_drawn: { type: String, trim: true, default: null, sparse: true },
    fouls_commited: { type: String, trim: true, default: null, sparse: true },
    saves: { type: String, trim: true, default: null, sparse: true },
    yellowcards: { type: String, trim: true, default: null, sparse: true },
    redcards: { type: String, trim: true, default: null, sparse: true },
    pen_score: { type: String, trim: true, default: null, sparse: true },
    pen_miss: { type: String, trim: true, default: null, sparse: true },
    playerId: { type: String, trim: true, default: null, sparse: true },
    fansPickPlayerId: { type: String, trim: true, default: null, sparse: true },
});

var LocalTeam = new Schema({
    // contain stats of team
    coaches: [],
    stats: [],
    players: [], //Contains Manager's Pick
    substitutes: [],
    substitutions: [],
    name: { type: String, trim: true, default: null, sparse: true },
    goals: { type: String, trim: true, default: null, sparse: true },
    feedServerId: { type: String, trim: true, default: null, sparse: true },
    franspickTeamId: { type: Schema.ObjectId, ref: 'teams' },
    formation: { type: Schema.Types.ObjectId, ref: 'formations' }

});

var VisitorTeam = new Schema({
    // contain stats of team
    coaches: [],
    stats: [],
    players: [],  //Contains Manager's Pick
    substitutes: [],
    substitutions: [],
    name: { type: String, trim: true, default: null, sparse: true },
    goals: { type: String, trim: true, default: null, sparse: true },
    feedServerId: { type: String, trim: true, default: null, sparse: true },
    franspickTeamId: { type: Schema.ObjectId, ref: 'teams' },
    formation: { type: Schema.Types.ObjectId, ref: 'formations' }
});

var Commentary = new Schema(
    {
        commentaryId: { type: Number },
        Type: { type: String, trim: true, required: false }, // Can be Goal, redCard, YellowCard, substitution, update
        eventTime: { type: Date, trim: true, required: false }, // gmt time of event
        minsInMatch: { type: String, trim: true, required: false }, // - Number of minutes into match
        description: { type: String, trim: true, required: false }, //- Description of Commentary Event
        teamID: { type: Schema.ObjectId, ref: 'teams' }, //- Which team is this for.
    }
);

var fixtureData = new Schema({
    date: { type: Date, trim: true, required: true },
    time: { type: String, trim: true, required: true },
    fixtureDate: { type: Date, trim: true, required: true },
    status: { type: String, trim: true, required: true },
    venue: { type: String, trim: true, required: true },
    venue_id: { type: String, trim: true, required: false },
    venue_city: { type: String, trim: true, required: true },
    static_id: { type: String, trim: true, required: false },
    feedServerId: { type: String, trim: true, required: true, unique: true },
    awayTeamScore: { type: Number, required: false },
    homeTeamScore: { type: Number, required: false },
    matchinfo: [],
    commentaries: { type: Array, trim: true, required: false },
    localTeam: {
        // contain stats of team
        coaches: [],
        stats: [],
        players: [{
            "playerPos": { type: String, trim: true, default: null },
            "playerName": { type: String, trim: true, default: null },
            "playerId": { type: Schema.Types.ObjectId, ref: 'playerData' },
            "positionId": { type: Schema.Types.ObjectId, ref: 'lkpPosition' }
        }],
        substitutes: [],
        substitutions: [],
        name: { type: String, trim: true, default: null, sparse: true },
        goals: { type: String, trim: true, default: null, sparse: true },
        feedServerId: { type: String, trim: true, default: null, sparse: true },
        franspickTeamId: { type: Schema.ObjectId, ref: 'teams' },
        formation: { type: Schema.Types.ObjectId, ref: 'formations' }

    },
    visitorTeam: {
        // contain stats of team
        coaches: [],
        stats: [],
        players: [
            {
                "playerPos": { type: String, trim: true, default: null },
                "playerName": { type: String, trim: true, default: null },
                "playerId": { type: Schema.Types.ObjectId, ref: 'playerData' },
                "positionId": { type: Schema.Types.ObjectId, ref: 'lkpPosition' }
            }
        ],
        substitutes: [],
        substitutions: [],
        name: { type: String, trim: true, default: null, sparse: true },
        goals: { type: String, trim: true, default: null, sparse: true },
        feedServerId: { type: String, trim: true, default: null, sparse: true },
        franspickTeamId: { type: Schema.ObjectId, ref: 'teams' },
        formation: { type: Schema.Types.ObjectId, ref: 'formations' }

    },
    countryId: { type: Schema.ObjectId, ref: 'countryData' },
    competitionId: { type: Schema.ObjectId, ref: 'competitionData' },
    fixtureType: { type: String, trim: true, required: true },
    matchStatus :{ type: String, trim: true },
    statusTime:  { type: Date, trim: true}
});

module.exports = mongoose.model('fixturedata', fixtureData);