// /**
//  * Created by preciousr on 07/01/2016.
//  */
// var Sequelize = require('sequelize');

// module.exports = {

var dotenv = require('dotenv');
var env = dotenv.config();
var mongourl = JSON.parse(env.MONGOURL);
var cookiedomain = JSON.parse(env.COOKIEDOMAIN);
var sequelizeusers = JSON.parse(env.SEQUELIZEUSERS);
var servicesequelize = JSON.parse(env.SERVICESEQUELIZE);
var applicationserviceurl = JSON.parse(env.APPLICATIONSERVICEURL);
var notificationserviceurl = JSON.parse(env.NOTIFICATIONSERVICEURL);
var passwordsettings = JSON.parse(env.PASSWORDSETTINGS);
var postcodelookupoptions = JSON.parse(env.POSTCODELOOKUPOPTIONS);
var live_variables = JSON.parse(env.LIVEVARIABLES);
var pgPassword = env.PGPASSWORD;
var Sequelize = require('sequelize');

var config = {
    "mongoURL": mongourl.mongoURL,
    "cookieDomain": cookiedomain,
    "sequelizeUsers":new Sequelize(sequelizeusers.sequelizeusers.dbName, sequelizeusers.sequelizeusers.dbUser, sequelizeusers.sequelizeusers.dbPass,
        {'host': sequelizeusers.userconnection.host,'port': sequelizeusers.userconnection.port, 'dialect': 'postgres', 'logging': false}),
    "serviceSequelize":new Sequelize(servicesequelize.servicesequelize.dbName, servicesequelize.servicesequelize.dbUser, servicesequelize.servicesequelize.dbPass,
        {'host': servicesequelize.serviceconnection.host,'port':servicesequelize.serviceconnection.port, 'dialect': 'postgres', 'logging': false}),
    "applicationServiceURL":applicationserviceurl.applicationserviceurl,
    "notificationServiceURL":notificationserviceurl.notificationserviceurl,
    "password_settings":passwordsettings,
    "postcodeLookUpApiOptions":postcodelookupoptions,
    "pgpassword": pgPassword,
    "live_variables":live_variables
};

module.exports = config;

