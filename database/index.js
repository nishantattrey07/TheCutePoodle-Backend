const mongoose = require("mongoose");
require('dotenv').config();
mongoose.connect(process.env.mongodb)

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, enum: ["PetParent", "PetSitter", "Both"], required: true },
    pet: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pet" }],
    profileCompleted: { type: Boolean, default: false },
    address: { type: String },
    experience: {type: String,},
    price: {type: Number,},
    rating: { type: Number, },
    availableTime: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        start: { type: String },
        end: { type: String }
    }],
    availability: { type: Boolean, default: true },
    bookings: [{
        start: { type: Date, required: true },
        end: { type: Date, required: true },
        petId: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: true }
    }]
}) 

const petSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: {type:String,required:true,enum:["Dog","Cat"]},
    breed: {type:String,required:true},
    age: { type: Number, required: true },
    size: { type: String, required: true, enum: ["Small", "Medium", "Large"] },
    color: { type: String, required: true },
    description: { type: String },
    ownerId :{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})

const User = mongoose.model('User', userSchema);
const Pet=mongoose.model('Pet',petSchema);
module.exports = {
    User,
    Pet
}