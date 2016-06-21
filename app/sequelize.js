var Sequelize = require('sequelize'),
    common = require('../config/common.js'),
    envVariables = common.config();
    
module.exports = envVariables.sequelizeUsers;
