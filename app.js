//jshint esversion:6
require("dotenv").config(); //put at the top
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const bcrypt = require("bcrypt");

const saltRounds = 10;
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB", {
  //to connect to MongoDB Atlas change to your own url
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

// Create schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// Create mongoose model
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render("home");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    const newUser = new User({
      email: req.body.username,
      password: hash
    });
    newUser.save(err => {
      if (!err) {
        res.render("secrets");
      } else {
        console.log(err);
      }
    });
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username }, (err, foundUser) => {
    if (!err) {
      if (foundUser) {
        bcrypt.compare(password, foundUser.password, (err, result) => {
          if (result === true) {
            res.render("secrets");
          }
        });
      }
    } else {
      console.log(err);
    }
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000.");
});
