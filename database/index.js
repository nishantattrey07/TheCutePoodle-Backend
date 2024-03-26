const mongoose = require("mongoose");
require('dotenv').config();
mongoose.connect(process.env.mongodb)

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, enum: ["petParent", "petSitter", "both"], required: true },
    pet: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pet" }],
    profileCompleted: { type: Boolean, default: false },
    address: { type: String, required: true },
    experience: {
        type: String,
        required: function () { return this.role === 'petSitter' || this.role === 'both'; }
    },
    price: {
        type: Number,
        required: function () { return this.role === 'petSitter' || this.role === 'both'; }
    },
    rating: {
        type: Number,
        required: function () { return this.role === 'petSitter' || this.role === 'both'; }
    },
    availability: {
        type: String,
        required: function () { return this.role === 'petSitter' || this.role === 'both'; }
    },
})

const petSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: {type:String,required:true,enum:["dog","cat"]},
    breed: {type:String,required:true},
    age: { type: Number, required: true },
    size: { type: String, required: true, enum: ["small", "medium", "large"] },
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