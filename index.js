const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const userRouter = require("./routes/users");
const petSitter = require("./routes/petSitter");
require('dotenv').config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
// app.use("/petSitter", petSitter)
app.use("/user", userRouter)
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("Welcome to Cute Poodle! \n now hire someone to take care of your pet or get a job as a pet sitter.");
});
app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});