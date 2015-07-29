var express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    multer = require('multer'),
    passport = require('passport'),
    session = require('express-session'),
    LocalStrategy = require('passport-local').Strategy,
    passHash = require('password-hash'),
    flash = require('express-flash'),
    databank = require('databank').Databank;

// import routes
var routes = require('./routes/index');
var ontologies = require('./routes/ontologies');
var users = require('./routes/users');

// connect to the database
var params = {
    'schema': {},
    'port': 6379
};
var db = databank.get('redis', params);
db.connect({}, function(err) {
    if(err) {
        throw new Error('Could not connect to database');
    }
}.bind(this));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false, limit: '500mb' }));
app.use(multer());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'it takes a lot of dye to cover a whole dinosaur' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

// Populate the routes with useful info
app.use(function(req, res, next) {
  req.aberowl = 'http://localhost/service/api/';
  req.db = db;
  res.locals.user = req.user;
  next();
});

app.use('/', routes);
app.use('/ontology', ontologies);
app.use('/user', users);
app.post('/login', 
  passport.authenticate('local', {
    'successRedirect': '/',
    'failureRedirect': '/login',
    'failureFlash': true
  })
);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Set up authentication

passport.use(new LocalStrategy(function(username, password, done) {
  db.read('users', username, function(err, user) {
    if(!err && user) {
      if(passHash.verify(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, { 'message': 'Incorrect password' });
      }
    } else {
      return done(null, false, { 'message': 'Unknown user' });
    }
  }); 
}));

passport.serializeUser(function(user, done) {
  done(null, user.username);
});

passport.deserializeUser(function(id, done) {
  db.read('users', id, function (err, user) {
    done(err, user);
  });
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
