const express = require('express')
const app = express()

const session = require('express-session')
const passport = require('passport')
const ejs = require('ejs')
const path = require('path')
// use dotenv
require('dotenv').config()

const GoogleStrategy = require('passport-google-oauth2').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;

//Middleware
app.use(session({
    secret: "secret",
    resave: false ,
    saveUninitialized: true ,
}))

app.use(passport.initialize()) // init passport on every route call
app.use(passport.session())    //allow passport to use "express-session"
// use ejs
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));



//Get the GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET from Google Developer Console
const GOOGLE_CLIENT_ID = process.env.CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.CLIENT_SECRET



//Use "GoogleStrategy" as the Authentication Strategy
passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://test-passport.onrender.com/auth/google/callback",
    passReqToCallback   : true
  }, authUser = (request, accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }));



passport.use(new MicrosoftStrategy({  
callbackURL: `https://test-passport.onrender.com/auth/microsoft/redirect`,  
clientID: process.env.MICROSOFT_CLIENT_ID,  
clientSecret: process.env.MICROSOFT_CLIENT_SECRET_VALUE,  
scope: ['openid', 'profile', 'email']  
}, authUser = (request, accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }))


passport.serializeUser( (user, done) => { 
    console.log(`\n--------> Serialize User:`)
    console.log(user)
     // The USER object is the "authenticated user" from the done() in authUser function.
     // serializeUser() will attach this user to "req.session.passport.user.{user}", so that it is tied to the session object for each session.  

    done(null, user)
} )


passport.deserializeUser((user, done) => {
        console.log("\n--------- Deserialized User:")
        console.log(user)
        // This is the {user} that was saved in req.session.passport.user.{user} in the serializationUser()
        // deserializeUser will attach this {user} to the "req.user.{user}", so that it can be used anywhere in the App.

        done (null, user)
}) 


//Start the NODE JS server
app.listen(5000, () => console.log(`Server started on port 5000...`))


// //console.log() values of "req.session" and "req.user" so we can see what is happening during Google Authentication
// let count = 1
// showlogs = (req, res, next) => {
//     console.log("\n==============================")
//     console.log(`------------>  ${count++}`)

//     console.log(`\n req.session.passport -------> `)
//     console.log(req.session.passport)
  
//     console.log(`\n req.user -------> `) 
//     console.log(req.user) 
  
//     console.log("\n Session and Cookie")
//     console.log(`req.session.id -------> ${req.session.id}`) 
//     console.log(`req.session.cookie -------> `) 
//     console.log(req.session.cookie) 
  
//     console.log("===========================================\n")

//     next()
// }

// app.use(showlogs)

// Google Routes
app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get('/auth/google/callback',
    passport.authenticate( 'google', {
        successRedirect: '/dashboard',
        failureRedirect: '/login'
}));


// Microsoft Routes
app.get('/auth/microsoft', async (req,res) => {
  try {
    console.log('into API')
    const check = await passport.authenticate('microsoft', { session : false })
    console.log(check);
  } catch (error) {
    console.log(error);
    res.status(500);
  }
});
// app.get('/auth/microsoft/redirect', passport.authenticate('microsoft', { session: false, failureRedirect: `/login` }), (req, res) => {
//   res.redirect("/dashboard");

// });
app.get('/auth/microsoft/redirect', passport.authenticate('microsoft', { successRedirect: '/dashboard', failureRedirect: '/login' }));

//Define the Login Route
app.get("/login", (req, res) => {
    res.render("index.ejs")
})


//Use the req.isAuthenticated() function to check if user is Authenticated
checkAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { return next() }
  res.redirect("/login")
}

//Define the Protected Route, by using the "checkAuthenticated" function defined above as middleware
app.get("/dashboard", checkAuthenticated, (req, res) => {
  res.render("dashboard.ejs", {name: req.user.displayName})
})

//Define the Logout
app.get("/logout", (req,res) => {
    res.redirect("/login")
    console.log(`-------> User Logged out`)
})