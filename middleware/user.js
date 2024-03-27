const jwt = require("jsonwebtoken");
require('dotenv').config();
const { User } = require("../database");

async function userMiddleware(req, res, next) {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json({ message: "Access Denied" });
    else {
        try {
            const authenticateUser = jwt.verify(token, process.env.JWT_SECRET);
            const verify = await User.findOne({ username: authenticateUser.username });
            if (verify) {
                console.log(authenticateUser);
                req.user = authenticateUser.username;
                next();
            }
            else {
                res.status(403).json({
                    msg: "No user found"
                })
            }
        }
        catch (err) {
            res.status(400).send('Invalid Token');
            console.log(err);
        }
    }

}




module.exports = userMiddleware;