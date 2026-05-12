const express = require('express'),
  app = express(),
  common = require('./config/common.js'),
  environmentVariables = common.config(),
  passport = require('passport'),
  passportConfig = require('./app/passportConfig'),
  viewAuthData = require('./app/middleware/viewAuthData'),
  flash = require('connect-flash'),
  appRouter = require('./app/routes.js')(express, environmentVariables),
  bodyParser = require('body-parser'),
  jsonParser = bodyParser.json(),
  cookieParser = require('cookie-parser'),
  csrf = require('csurf')

require('./config/logs')
require('dotenv').config()

const argvPort = Number.parseInt(process.argv[2], 10)
const envPort = Number.parseInt(process.env.PORT, 10)
const serverPort = Number.isFinite(argvPort) ? argvPort : Number.isFinite(envPort) ? envPort : 3001

app.use(cookieParser())
app.set('trust proxy', 1)

// Healthcheck - responds before session/csrf to avoid creating Redis sessions
app.use((req, res, next) => {
  if (req.path === '/api/user/healthcheck') {
    return res.json({ message: 'User Service is running' })
  }
  next()
})

app.use(
  csrf({
    cookie: {
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'Lax',
      httpOnly: true,
    },
  }),
)

app.use((_req, res, next) => {
  res.removeHeader('X-Powered-By')
  res.removeHeader('Server')
  return next()
})

// =====================================
// SESSION
// =====================================
const sessionSettings = JSON.parse(process.env.THESESSION)

app.use((req, res, next) => {
  if (req.cookies.LoggedIn) {
    res.cookie('LoggedIn', true, { maxAge: sessionSettings.cookieMaxAge, httpOnly: true })
  }
  return next()
})

const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const { createClient } = require('redis')
const { password, port, host } = sessionSettings
const connectTimeout = 15000

const redisClient = createClient({
  legacyMode: true,
  password,
  socket: { connectTimeout, port, host, tls: process.env.NODE_ENV !== 'development' },
})

redisClient.connect((err) => {
  if (err) {
    console.error('Redis client error:', err)
    next(err)
  } else {
    next()
  }
})

redisClient.on('connect', () => {
  console.log('Redis client connected successfully')
})

redisClient.on('error', (error) => {
  console.error('Redis client error:', error)
})

const redisStore = new RedisStore({ client: redisClient })

app.use(
  session({
    store: redisStore,
    prefix: sessionSettings.prefix,
    saveUninitialized: false,
    secret: sessionSettings.secret,
    key: sessionSettings.key,
    resave: false,
    rolling: true,
    cookie: {
      domain: sessionSettings.domain,
      maxAge: sessionSettings.maxAge,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'Lax',
    },
  }),
)

// =====================================
// VIEW AND LOCALS
// =====================================
app.set('view engine', 'ejs')

const crypto = require('node:crypto')
const cacheBust = crypto.randomBytes(4).toString('hex')

app.use((req, res, next) => {
  res.locals = {
    cacheBust,
    piwikID: environmentVariables.live_variables.piwikId,
    feedbackURL: environmentVariables.live_variables.feedbackURL,
    service_public: environmentVariables.live_variables.Public,
    start_url: environmentVariables.live_variables.startPageURL,
    govuk_url: environmentVariables.live_variables.GOVUKURL,
    caseManagementSystem: environmentVariables.live_variables.caseManagementSystem,
    _csrf: req.csrfToken(),
  }
  next()
})

// =====================================
// PASSPORT CONFIG
// =====================================
app.use(flash()) //use connect-flash for flash messages stored in session
app.use(passport.initialize())
app.use(passport.session()) //persistent login sessions
app.use(viewAuthData)

app.use(jsonParser)
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
)

// =====================================
// JOB SCHEDULER
// =====================================
const schedule = require('node-schedule')
const jobs = require('./config/jobs.js')

// As there are 2 instances running, we need a random time, or two emails will be sent
// for accounts nearing expiration. (Flag will be set by time of 2nd job execution to stop duplicate)
const hourlyInterval = environmentVariables.userAccountSettings.jobScheduleHour
const randomSecond = Math.floor(Math.random() * 60)
const randomMin = Math.floor(Math.random() * 60) //Math.random returns a number from 0 to < 1 (never will return 60)
const jobScheduleRandom = `${randomSecond} ${randomMin} ${environmentVariables.userAccountSettings.jobScheduleHour} * * *`
schedule.scheduleJob(jobScheduleRandom, () => {
  jobs.accountExpiryCheck()
})

passportConfig(app, passport)
app.use('/api/user', appRouter)
//Automatically update passport strategy
const fs = require('fs-extra')
fs.copy(`${__dirname}/data/strategy.js`, `${__dirname}/node_modules/passport-local/lib/strategy.js`, (_err) => {})

// =====================================
// GOV STYLES
// =====================================
const oneDay = 24 * 60 * 60 * 1000 // 1 day in milliseconds

app.use('/api/user/', express.static(`${__dirname}/public`, { maxAge: oneDay }))
app.use('/api/user/styles', express.static(`${__dirname}/styles`, { maxAge: oneDay }))
app.use('/api/user/fonts', express.static(`${__dirname}/fonts`, { maxAge: oneDay }))
app.use('/api/user/images', express.static(`${__dirname}/images`, { maxAge: oneDay }))
app.use('/api/user/js', express.static(`${__dirname}/js`, { maxAge: oneDay }))

// Serve GOV.UK Frontend v5 assets
app.use(
  '/api/user/govuk-frontend',
  express.static(`${__dirname}/node_modules/govuk-frontend/dist/govuk`, { maxAge: oneDay }),
)

// =====================================
// START APP
// =====================================
process.on('uncaughtException', (error, origin) => {
  console.error('----- Uncaught Exception -----')
  console.error(error)
  console.error('----- Exception Origin -----')
  console.error(origin)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('----- Unhandled Rejection -----')
  console.error(`Promise: ${promise}`)
  console.error(`Reason: ${reason}`)
})

app.listen(serverPort)
console.log(`Server started on port ${serverPort}`)
console.log(
  `user account cleanup job will run every ${hourlyInterval} hours at ${randomMin} minutes and ${randomSecond} seconds past the hour`,
)
module.exports.getApp = app
