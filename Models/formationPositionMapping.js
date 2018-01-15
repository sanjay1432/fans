var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var formationPositionMapping = new Schema({
    formationId : {
        type: Schema.Types.ObjectId,
        ref : 'formations'
    },
    positionId : {
        type: Schema.Types.ObjectId,
        ref : 'lkpPosition'
    }
});

module.exports = mongoose.model('formationPositionMapping',formationPositionMapping);