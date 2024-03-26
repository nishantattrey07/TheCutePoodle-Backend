const { User } = require("../database");
function profileMiddleware(req, res, next) {
    User.findOne({ username: req.user })
        .then(user => {
            if (user.profileCompleted) {
                next();
            } else {
                res.redirect('/complete-profile');
            }
        })
        .catch(error => {
            console.error('Error checking profile completion:', error);
            res.status(500).send({ message: 'Server error' });
        });
}
module.exports = profileMiddleware;