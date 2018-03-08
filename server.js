var express = require('express');
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;
var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;


// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'http://b99783b3.ngrok.io/login/facebook/return',
  profileFields: ['id', 'displayName', 'photos', 'email',
    'birthday', 'age_range', 'education', 'first_name', 'gender',
    'languages', 'last_name', 'middle_name', 'work']
},
  function (accessToken, refreshToken, profile, cb) {
    // In this example, the user's Facebook profile is supplied as the user
    // record.  In a production-quality application, the Facebook profile should
    // be associated with a user record in the application's database, which
    // allows for account linking and authentication with other identity
    // providers.
    return cb(null, profile);
  }));

passport.use(new LinkedInStrategy({
  clientID: `81i9bxa75rs1kv`,
  clientSecret: `NlzLAwBQvBkZMJvU`,
  callbackURL: "http://b99783b3.ngrok.io/auth/linkedin/callback",
  scope: ['r_emailaddress', 'r_basicprofile'],
}, function (accessToken, refreshToken, profile, done) {
  // asynchronous verification, for effect... 
  process.nextTick(function () {
    // To keep the example simple, the user's LinkedIn profile is returned to 
    // represent the logged-in user. In a typical application, you would want 
    // to associate the LinkedIn account with a user record in your database, 
    // and return that user instead. 
    return done(null, profile);
  });
}));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());


// Define routes.
app.get('/',
  function (req, res) {
    console.log(req.user);
    res.render('home', { user: req.user });
  });

app.get('/login',
  function (req, res) {
    res.render('login');
  });

app.get('/login/facebook',
  passport.authenticate('facebook'));

app.get('/login/linkedin',
  passport.authenticate('linkedin'));

app.get('/login/facebook/return',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function (req, res) {
    console.log("from Facebook");
    console.log(res);
    res.redirect('/');
  });

app.get('/auth/linkedin/callback', passport.authenticate('linkedin', {
  // successRedirect: '/',
  failureRedirect: '/login'
}), function (req, res) {
  console.log("from linkedIn");
  console.log(res);
  res.redirect('/');
});

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function (req, res) {
    res.render('profile', { user: req.user });
  });

app.listen(3000);
