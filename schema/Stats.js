/**
 * Created by Piquet Sébastien on 02/06/15.
 */
'use strict';

exports = module.exports = function (app, mongoose) {

    var statSchema = new.mongoose.Schema({

        gamename: { type: mongoose.Schema.Types.ObjectId, ref: 'GameType' },
        notes: { type : Number, min : 0 },
        user: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: { type: String, default: '' }
        }
    });
};
