'use strict';

exports.init = function(req, res){

    req.app.db.models.User.find({}, 'username', function (err, users) {
           console.log(users);
        res.render('players/index', {
            users: users

        });
    });
};
