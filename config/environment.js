import { config as envConfig } from 'dotenv'
import Sequelize from 'sequelize'
import { logger } from './logs.js'

envConfig()

const cookiedomain = process.env.COOKIEDOMAIN
  ? JSON.parse(process.env.COOKIEDOMAIN)
  : { cookieDomain: 'http://localhost/' }
const sequelizeusers = process.env.SEQUELIZEUSERS
  ? JSON.parse(process.env.SEQUELIZEUSERS)
  : {
      sequelizeusers: { dbName: 'FCO-LOI-User', dbUser: 'postgres', dbPass: 'password' },
      userconnection: { host: 'localhost', port: 5432, ssl: false, dialect: 'postgres', logging: 'false' },
    }
const servicesequelize = process.env.SERVICESEQUELIZE
  ? JSON.parse(process.env.SERVICESEQUELIZE)
  : {
      servicesequelize: { dbName: 'FCO-LOI-Service', dbUser: 'postgres', dbPass: 'password' },
      serviceconnection: { host: 'localhost', port: 5432, ssl: false, dialect: 'postgres', logging: 'false' },
    }
const applicationserviceurl = process.env.APPLICATIONSERVICEURL
  ? JSON.parse(process.env.APPLICATIONSERVICEURL)
  : { applicationserviceurl: 'http://localhost:3000/' }
const notificationserviceurl = process.env.NOTIFICATIONSERVICEURL
  ? JSON.parse(process.env.NOTIFICATIONSERVICEURL)
  : { notificationserviceurl: 'http://localhost:3002/api/notification' }
const passwordsettings = process.env.PASSWORDSETTINGS
  ? JSON.parse(process.env.PASSWORDSETTINGS)
  : {
      maxLoginAttempts: 5,
      passwordExpiryInDays: 183,
      passwordPattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).{8,50}$',
    }
const postcodelookupoptions = process.env.POSTCODELOOKUPOPTIONS
  ? JSON.parse(process.env.POSTCODELOOKUPOPTIONS)
  : { uri: 'http://localhost:3004/api/address/', timeout: 5000 }
const live_variables = process.env.LIVEVARIABLES
  ? JSON.parse(process.env.LIVEVARIABLES)
  : {
      Public: false,
      startPageURL: 'https://www.gov.uk/get-document-legalised',
      GOVUKURL: 'https://www.gov.uk/',
      feedbackURL: 'https://www.smartsurvey.co.uk/s/legalisation/',
      piwikId: 18,
      premiumServiceActivationDate: '23 November 2022',
      caseManagementSystem: 'ORBIT',
    }
const userAccountSettings = process.env.USERACCOUNTSETTINGS
  ? JSON.parse(process.env.USERACCOUNTSETTINGS)
  : { jobScheduleHour: 9, gracePeriod: 15 }
const pgPassword = process.env.PGPASSWORD
const edmsHost = process.env.EDMS_HOST
const edmsBearerToken = process.env.EDMS_BEARER_TOKEN
  ? JSON.parse(process.env.EDMS_BEARER_TOKEN)
  : {
      'EDMS-Web-Submissions-Token': 'Testing',
      cognito_app_client_id: 'cognito_app_client_id_should_be_set_in_env_variables',
      cognito_app_client_secret: 'cognito_app_client_secret_should_be_set_in_env_variables',
    }
const edmsAuthHost = process.env.EDMS_AUTH_HOST
const edmsAuthScope = process.env.EDMS_AUTH_SCOPE

const sequelizeUsers = new Sequelize(
  sequelizeusers.sequelizeusers.dbName,
  sequelizeusers.sequelizeusers.dbUser,
  sequelizeusers.sequelizeusers.dbPass,
  {
    host: sequelizeusers.userconnection.host,
    port: sequelizeusers.userconnection.port,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      connectTimeout: 15000, // 15 seconds timeout
      ssl: sequelizeusers.userconnection.ssl,
    },
    retry: {
      base: 1000,
      multiplier: 2,
      max: 5000,
    },
  },
)

const serviceSequelize = new Sequelize(
  servicesequelize.servicesequelize.dbName,
  servicesequelize.servicesequelize.dbUser,
  servicesequelize.servicesequelize.dbPass,
  {
    host: servicesequelize.serviceconnection.host,
    port: servicesequelize.serviceconnection.port,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      connectTimeout: 15000, // 15 seconds timeout
      ssl: servicesequelize.serviceconnection.ssl,
    },
    retry: {
      base: 1000,
      multiplier: 2,
      max: 5000,
    },
  },
)

//=========================
// SEQUELIZE CONNECTION
//=========================
sequelizeUsers
  .authenticate()
  .then(() => {
    logger.info(`Connection has been established to ${sequelizeusers.sequelizeusers.dbName} successfully.`)
  })
  .catch((error) => {
    logger.error(`Unable to connect to the ${sequelizeusers.sequelizeusers.dbName} database: ${error}`)
  })

serviceSequelize
  .authenticate()
  .then(() => {
    logger.info(`Connection has been established to ${servicesequelize.servicesequelize.dbName} successfully.`)
  })
  .catch((error) => {
    logger.error(`Unable to connect to the ${servicesequelize.servicesequelize.dbName} database: ${error}`)
  })

export const config = {
  cookieDomain: cookiedomain,
  sequelizeUsers,
  serviceSequelize,
  applicationServiceURL: applicationserviceurl.applicationserviceurl,
  notificationServiceURL: notificationserviceurl.notificationserviceurl,
  password_settings: passwordsettings,
  postcodeLookUpApiOptions: postcodelookupoptions,
  pgpassword: pgPassword,
  userAccountSettings: userAccountSettings,
  live_variables: live_variables,
  edmsHost,
  edmsBearerToken,
  edmsAuthHost,
  edmsAuthScope,
}

export default config
