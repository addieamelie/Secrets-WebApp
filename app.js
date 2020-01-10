//jshint esversion:6
require("dotenv").config(); //put at the top
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");
const cookieSession = require("cookie-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Must be placed here
app.use(
  cookieSession({
    name: "session",
    secret: "JayParkismyfuturehusband",
    keys: ["key1", "key2"]
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  "mongodb+srv://admin-addie:aduska123@secrets-jq6rf.mongodb.net/secretsDB",
  {
    //to connect to MongoDB Atlas change to your own url
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  }
);

mongoose.set("useCreateIndex", true);

// Create schema
const userSchema = new mongoose.Schema({
  //has to be mongoose schema
  email: String,
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Create mongoose model
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

//From passport documentation:
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//Has to be after all setup and before routes
passport.use(
  new GoogleStrategy(
    {
      clientID:
        "198069977005-is3akqmvuvmqtqpebgguqunahhmter6f.apps.googleusercontent.com",
      clientSecret: "cbBus0IZ0NDy02HApMlOJewf",
      callbackURL: "http://secrets-keeper.herokuapp.com/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" //added
    },
    function(accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id, username:profile.displayName }, function(err, user) {
        //need a package to use findOr create
        return cb(err, user);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] }) //google strategy
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    User.find({ secret: { $ne: null } }, (err, foundUsers) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", { usersWithSecrets: foundUsers });
        }
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;
  //console.log(req.user.id);
  User.findById(req.user.id, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(() => {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.post("/register", (req, res) => {
  //from passport local mongoose
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          //local strategy
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  //This method from passport
  req.login(user, err => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started on port 3000.");
});
