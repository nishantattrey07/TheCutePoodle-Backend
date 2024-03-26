const { Router } = require("express");
const userMiddleware = require("../middleware/user");
const zod = require('zod');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Task } = require("../database")
const router = Router();
require('dotenv').config();


const saltRounds = 10;
const userSchema = zod.object({
    name: zod.string().min(3).max(20),
    username: zod.string().min(3),
    password: zod.string().min(9),
    email: zod.string().email(),
    phoneNumber: zod.string().min(10).max(10)
});


function validateUser(name, username, password, email,phoneNumber) {
    let data = userSchema.safeParse({ name, username, password, email,phoneNumber});
    return data.success ? true : false;
}


router.post('/signup', async (req, res) => {
    const { name, username, password, email, phoneNumber } = req.body;
    if (validateUser(name, username, password, email,phoneNumber)) {
        try {
            const existingUser = await User.findOne({ username: username, email: email });
            const existingUsername = await User.findOne({ username: username });
            if (!existingUser) {
                if (existingUsername) {
                    return res.status(409)
                        .json({
                            message: `The username is already taken`,
                            username: existingUsername
                        });
                }
                else {
                    const hashPassword = await bcrypt.hash(password, saltRounds);
                    const newUser = new User({ name, username, password: hashPassword, email });
                    await newUser.save();
                    const token = jwt.sign({ username: username }, process.env.TOKEN_SECRET, { expiresIn: '7d' });
                    console.log("User is being saved")
                    res.status(201).json({
                        token: token,
                        username: username,
                        id: newUser._id
                    });
                }
            }
            else {
                return res.status(409).json({
                    message: `User already exists ${username}`,
                });
            }
        }
        catch (err) {
            console.log(err);
            return res.status(404).send(`Our server has some issue`);
        }
    }
    else {
        return res.status(400).send("Invalid Input")
    }
});

router.post('/signin', async (req, res) => {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username: username });
    const authenticatePassword = await bcrypt.compare(password, existingUser.password);
    if (existingUser && authenticatePassword) {
        const token = jwt.sign({ username: username }, process.env.TOKEN_SECRET, { expiresIn: '7d' });
        res.header('auth-token', token).json({
            token: token
        });
    }
    else {
        return res.status(401).send('Wrong credentials');
    }

})


module.exports = router;