const { Router } = require("express");
const userMiddleware = require("../middleware/user");
const zod = require('zod');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Pet } = require("../database")
const router = Router();
require('dotenv').config();


const saltRounds = 10;
const userSchema = zod.object({
    name: zod.string().min(3).max(20),
    username: zod.string().min(3),
    password: zod.string().min(9),
    email: zod.string().email(),
    phoneNumber: zod.string().min(10).max(10),
    role: zod.enum(['user', 'petSitter'])
});


function validateUser(name, username, password, email,phoneNumber) {
    let data = userSchema.safeParse({ name, username, password, email,phoneNumber});
    return data.success ? true : false;
}


router.post('/signup', async (req, res) => {
    const { name, username, password, email, phoneNumber,role } = req.body;
    if (validateUser(name, username, password, email,phoneNumber,role)) {
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
                    const newUser = new User({ name, username, password: hashPassword, email,phoneNumber,role });
                    await newUser.save();
                    const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET);
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

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET);
        res.status(200).send({ message: 'Login successful', token });
    } else {
        res.status(401).send({ message: 'Invalid username or password' });
    }
});

router.post('/addpet', userMiddleware, async (req, res) => {
    const { name, type, breed, age, size, description } = req.body;
    const { username } = req.user;
    const pet = new Pet({ name, type, breed, age, size, description });
    await pet.save();
    const user = await User.findOneAndUpdate({ username: username }, { $set: { pet: pet._id } });
    res.status(200).send({ message: 'Pet added successfully' });
});

router.put('/editpet/:petId', userMiddleware, async (req, res) => {
    const { name, type, breed, age, size, description } = req.body;
    const petId = req.params.petId;
    const pet = await Pet.findByIdAndUpdate(petId, { name, type, breed, age, size, description }, { new: true });
    if (pet) {
        res.status(200).send({ message: 'Pet updated successfully', pet });
    } else {
        res.status(404).send({ message: 'Pet not found' });
    }
});

module.exports = router;