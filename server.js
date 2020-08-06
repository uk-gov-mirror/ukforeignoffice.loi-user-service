// application

var express = require('express'),
    app = express(),
    common = require('./config/common.js'),
    environmentVariables = common.config(),
    session = require('express-session'),
    RedisStore = require('connect-redis')(session),
    passport = require('passport'),
    passportConfig = require('./app/passportConfig'),
    flash = require('connect-flash'),
    appRouter = require('./app/routes.js')(express,environmentVariables),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    dotenv = require('dotenv'),
    env = dotenv.config({path: process.env.DOTENV || '.env'}),
    cookieParser = require('cookie-parser'),
    sass = require('node-sass');

require('./config/logs');

app.use(cookieParser());

app.use(function(req, res, next) {
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");
    return next();
});

app.use(function(req, res, next) {
    if (req.cookies['LoggedIn']){
        res.cookie('LoggedIn',true,{ maxAge: 1800000, httpOnly: true });
    }
    return next();
});

var port = (process.argv[2] && !isNaN(process.argv[2])  ? process.argv[2] : (process.env.PORT || 8080));

var store = new RedisStore(
    {
        host: '127.0.0.1',
        port: 6379,
        prefix: "sess:"
    });

app.set('view engine', 'ejs');

var cookie_domain = null;
if(environmentVariables.cookieDomain && environmentVariables.cookieDomain.cookieDomain ){
    cookie_domain = environmentVariables.cookieDomain.cookieDomain;
}

app.use(function (req, res, next) {
    res.locals = {
        //piwikID:cookie_domain == ("www.legalisationbeta.co.uk" ||"www.get-document-legalised.service.gov.uk") ? 19 :18,
        piwikID: environmentVariables.live_variables.piwikId,
        feedbackURL:environmentVariables.live_variables.Public ? environmentVariables.live_variables.feedbackURL : "http://www.smartsurvey.co.uk/s/2264M/",
        service_public: environmentVariables.live_variables.Public,
        start_url: environmentVariables.live_variables.startPageURL,
        govuk_url: environmentVariables.live_variables.GOVUKURL
    };
    next();
});


app.use(session({
    secret: '6542356733921bb813d3ca61002410fe',
    key: 'express.sid',
    store: store,
    resave: false,
    saveUninitialized: false,
    cookie: {
        domain: cookie_domain ,//environmentVariables.cookieDomain,
        maxAge: 30 * 60 * 1000  //30 minutes
    }
}));
app.use(flash()); //use connect-flash for flash messages stored in session
app.use(passport.initialize());
app.use(passport.session()); //persistent login sessions


app.use(jsonParser);
app.use(bodyParser.urlencoded({
  extended: true
}));



var schedule = require('node-schedule');

var jobs = require('./config/jobs.js');
//Expiry Job completed at 6:00AM every day.
var ExpiryJob = schedule.scheduleJob(environmentVariables.userAccountSettings.jobSchedule, function(){jobs.accountExpiryCheck()});


passportConfig(app, passport);
app.use('/api/user', appRouter);






//Automatically update passport strategy
var fs = require('fs-extra');
fs.copy(__dirname+'/data/strategy.js', __dirname+'/node_modules/passport-local/lib/strategy.js', function (err) {});

var path = require('path');
var sassMiddleware = require('node-sass-middleware');
var srcPath = __dirname + '/sass';
var destPath = __dirname + '/public';

app.use('/api/user',sassMiddleware({
    src: srcPath,
    dest: destPath,
    debug: false,
    outputStyle: 'compressed',
    prefix: '/api/user/'
}));

app.use("/api/user/",express.static(__dirname + "/public"));

app.use("/api/user/styles",express.static(__dirname + "/styles"));
app.use("/api/user/fonts",express.static(__dirname + "/fonts"));
app.use("/api/user/images",express.static(__dirname + "/images"));
app.use("/api/user/js",express.static(__dirname + "/js"));

//Pull in images from GOVUK packages

fs.copy('node_modules/govuk_frontend_toolkit/images', 'images/govuk_frontend_toolkit', function (err) {
    if (err) return console.error(err);
});
fs.mkdirs('images/govuk_frontend_toolkit/icons', function (err) {
    if (err) return console.error(err);
});
fs.readdir('images/govuk_frontend_toolkit', function(err, items) {
    for (var i=0; i<items.length; i++) {
        if('images/govuk_frontend_toolkit/'+items[i].substr(0,5)=='images/govuk_frontend_toolkit/icon-' && items[i].substr(items[i].length-3,3)=='png'){
           moveItem(items[i]);
        }
    }
});
function moveItem(item){
    fs.move('images/govuk_frontend_toolkit/'+item, 'images/govuk_frontend_toolkit/icons/'+item,{ clobber: true }, function (err) {
        if (err) return console.error(err);
    });
}

// start app
app.listen(port);
console.log('Server started on port ' + port);
module.exports.getApp = app;
