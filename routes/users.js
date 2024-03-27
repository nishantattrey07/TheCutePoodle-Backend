const { Router } = require("express");
const userMiddleware = require("../middleware/user");
const zod = require('zod');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User, Pet } = require("../database");
const profileMiddleware = require("../middleware/profilecompleted");
const { log } = require("console");
const router = Router();
require('dotenv').config();


const saltRounds = 10;
const userSchema = zod.object({
    name: zod.string().min(3).max(20),
    username: zod.string().min(3),
    password: zod.string().min(9),
    email: zod.string().email(),
    phoneNumber: zod.string().min(10).max(10),
    role: zod.enum(['PetParent', 'PetSitter', 'Both']),
});

const petSitterSchema = zod.object({
    address: zod.string(),
    experience: zod.string(),
    price: zod.number(),
    availability: zod.string()
})

const petSchema = zod.object({
    name: zod.string().min(2).max(20),
    type: zod.enum(['Dog', 'Cat']),
    breed: zod.string().min(3),
    age: zod.number().min(1),
    size: zod.enum(['Small', 'Medium', 'Large']),
    color: zod.string(),
    description: zod.string()
});

function validateUser(name, username, password, email, phoneNumber, role) {
    let data = userSchema.safeParse({ name, username, password, email, phoneNumber, role });
    if (data.success) {
        return true;
    }
    return false;
}

function validatePet(name, type, breed, age, size, color, description) { 
    let data = petSchema.safeParse({ name, type, breed, age, size, color, description });
    if (data.success) { 
        return true;
    }
    else {
        return false;
    }
}

function valiidateUpdatedUser(address, experience, price, availability) {
    let data = petSitterSchema.safeParse({ address, experience, price, availability });
    if (data.success) {
        return true;
    }
    else {
        return false;
    }
}

router.post('/signup', async (req, res) => {
    const { name, username, password, email, phoneNumber,role } = req.body;
    if (validateUser(name, username, password, email,phoneNumber,role)) {
        try {
            const existingUser = await User.findOne({ username: username, email: email });
            const existingEmail = await User.findOne({email:email});
            const existingUsername = await User.findOne({ username: username });
            if (!existingUser) {
                if (existingUsername) {
                    return res.status(409)
                        .json({
                            message: `The username is already taken`,
                            username: existingUsername
                        });
                }
                else if (existingEmail) {
                    return res.status(409).json({
                        message: `The email is already taken`
                    });
                }
                else {
                    const hashPassword = await bcrypt.hash(password, saltRounds);
                    const newUser = new User({ name, username, password: hashPassword, email,phoneNumber,role });
                    await newUser.save();
                    const token = jwt.sign({ username: newUser.username, role: newUser.role }, process.env.JWT_SECRET);
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
    const { name, type, breed, age, size,color, description } = req.body;
    const username = req.user;
    if (!validatePet(name, type, breed, age, size, color, description)) {
        return res.status(400).send("Invalid Input");
    }
    else {
        try {
            const userId = await User.findOne({ username: username });
            const pet = new Pet({ name, type, breed, age, size, color, description,ownerId:userId._id });
            await pet.save();
            const user = await User.findOneAndUpdate({ username: username }, { $push: { pet: pet._id } });
            res.status(200).json({
                message: 'Pet added successfully',
                pet:pet
            });
        }
        catch (err) { 
            console.log(err);
            return res.status(404).send(`Our server has some issue`);
        }
        
    }
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

router.delete('/deletepet/:petId', userMiddleware, async (req, res) => {
    const petId = req.params.petId;
    const pet = await Pet.findByIdAndDelete(petId);
    if (pet) {
        const user = await User.findOneAndUpdate({ pet: petId }, { $pull: { pet: petId } }, { new: true });
        if (!user) {
            return res.status(404).send({ message: 'User not found or Pet not found in user' });
        }
        res.status(200).send({ message: 'Pet deleted successfully' });
    } else {
        res.status(404).send({ message: 'Pet not found' });
    }
});

router.get('/getpet/:petId', userMiddleware, async (req, res) => { 
    const petId = req.params.petId;
    const pet = await Pet.findById(petId);
    if (!pet) {
        res.status(404).send({ message: 'Pet not found' });
    } else {
        res.status(200).json({
            name:pet.name,
            type:pet.type,
            breed:pet.breed,
            age:pet.age,
            size:pet.size,
            color:pet.color,
            description:pet.description
        });
    }
});

router.get('/getallpets', userMiddleware, async (req, res) => {
    const username  = req.user;
    const user = await User.findOne({ username: username }).populate('pet');
    console.log(user.pets);
    res.status(200).json(user.pet);
});

router.get('/dashboard', userMiddleware, profileMiddleware, async (req, res) => {
    const username  = req.user;
    const user = await User.findOne({ username: username }, '-password -__v').populate('pet');
    res.status(200).json(user);
 })

router.post('/complete-profile', userMiddleware, async (req, res) => {
    const  username  = req.user;
    const user = await User.findOne({ username: username });
    if (user.role === "petParent") {
        try {
            const { address } = req.body;
            const updatedUser = await User.findOneAndUpdate({ username: username }, { address: address, profileCompleted: true }, { new: true });
            res.status(200).redirect('/dashboard');
        }
        catch (err) {
            console.log(err);
            res.status(400).send("Invalid Input");
        }
        
    }
    else {
        try {
            const { address, experience, price, availability } = req.body;
            if (!valiidateUpdatedUser(address, experience, price, availability)) {
                return res.status(400).send("Invalid Input");
            }
            else {
                const updatedUser = await User.findOneAndUpdate({ username: username }, { address: address, experience: experience, price: price, availability: availability, profileCompleted: true }, { new: true });
                res.status(200).redirect('/dashboard');
            }
            
        }
        catch (err) {
            console.log(err);
            res.status(400).send("Invalid Input");
        }
    
    }
});
module.exports = router;