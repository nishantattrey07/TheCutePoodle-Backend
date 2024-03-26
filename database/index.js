const mongoose = require("mongoose");
require('dotenv').config();
mongoose.connect(process.env.mongodb)

const userSchema = new mongoose.Schema({
    name: {type:String,required:true},
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true },
    phoneNumber: { type: String, required: true },
    role: { type: String, enum: ["user", "petSitter"], required: true },
    pet: [{type:mongoose.Schema.Types.ObjectId,ref:"Pet"}]
})

const petSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: {type:String,required:true,enum:["dog","cat"]},
    breed: {type:String,required:true},
    age: { type: Number, required: true },
    size: {type:String,required:true,enum:["small","medium","large"]},
    description:{type:String},
    ownerId :{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }
})

const User = mongoose.model('User', userSchema);
const Pet=mongoose.model('Pet',petSchema);
module.exports = {
    User,
    Pet
}