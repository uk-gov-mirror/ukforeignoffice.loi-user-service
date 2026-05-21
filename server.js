import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bodyParser from 'body-parser'
import flash from 'connect-flash'
import { RedisStore } from 'connect-redis'
import cookieParser from 'cookie-parser'
import csrf from 'csurf'
import { config as environmentConfig } from 'dotenv'
import express from 'express'
import expressSession from 'express-session'
import fs from 'node:fs'
import schedule from 'node-schedule'
import passport from 'passport'
import { createClient } from 'redis'
import viewAuthData from './app/middleware/viewAuthData.js'
import passportConfig from './app/passportConfig.js'
import appRoutes from './app/routes.js'
import { config } from './config/common.js'
import jobs from './config/jobs.js'
import { logger } from './config/logs.js'

const __filename = fileURLToPath(import.meta.url)
const directoryPath = path.dirname(__filename)
const app = express()
const environmentVariables = config()
const appRouter = appRoutes(express, environmentVariables)
const jsonParser = bodyParser.json()

environmentConfig() // Load environment variables from .env file

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
const sessionSettings = process.env.THESESSION
  ? JSON.parse(process.env.THESESSION)
  : {
      secret: 'super_secret',
      adapter: 'connect-redis',
      host: 'localhost',
      port: 6379,
      password: '',
      prefix: 'sess:',
      key: 'express.sid',
      domain: 'http://localhost/',
      cookieMaxAge: 1800000,
    }

const sessionMiddleware = expressSession.default ?? expressSession

app.use((req, res, next) => {
  if (req.cookies.LoggedIn) {
    res.cookie('LoggedIn', true, { maxAge: sessionSettings.cookieMaxAge, httpOnly: true })
  }
  return next()
})
const { password, port, host } = sessionSettings
const connectTimeout = 15000

const redisClient = createClient({
  legacyMode: true,
  password,
  socket: { connectTimeout, port, host, tls: process.env.NODE_ENV !== 'development' },
})

redisClient.connect((err) => {
  if (err) {
    logger.error('Redis client error:', err)
    next(err)
  } else {
    next()
  }
})

redisClient.on('connect', () => {
  logger.info('Redis client connected successfully')
})

redisClient.on('error', (error) => {
  logger.error('Redis client error:', error)
})

const redisStore = new RedisStore({ client: redisClient })

app.use(
  sessionMiddleware({
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
fs.copyFile(
  `${directoryPath}/data/strategy.js`,
  `${directoryPath}/node_modules/passport-local/lib/strategy.js`,
  (_err) => {},
)

// =====================================
// GOV STYLES
// =====================================
const oneDay = 24 * 60 * 60 * 1000 // 1 day in milliseconds

app.use('/api/user/', express.static(`${directoryPath}/public`, { maxAge: oneDay }))
app.use('/api/user/styles', express.static(`${directoryPath}/styles`, { maxAge: oneDay }))
app.use('/api/user/fonts', express.static(`${directoryPath}/fonts`, { maxAge: oneDay }))
app.use('/api/user/images', express.static(`${directoryPath}/images`, { maxAge: oneDay }))
app.use('/api/user/js', express.static(`${directoryPath}/js`, { maxAge: oneDay }))

// Serve GOV.UK Frontend v5 assets
app.use(
  '/api/user/govuk-frontend',
  express.static(`${directoryPath}/node_modules/govuk-frontend/dist/govuk`, { maxAge: oneDay }),
)

// =====================================
// START APP
// =====================================
process.on('uncaughtException', (error, origin) => {
  logger.error('----- Uncaught Exception -----')
  logger.error(error)
  logger.error('----- Exception Origin -----')
  logger.error(origin)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('----- Unhandled Rejection -----')
  logger.error(`Promise: ${promise}`)
  logger.error(`Reason: ${reason}`)
})

app.listen(serverPort)
logger.info(`Server started on port ${serverPort}`)
logger.info(
  `user account cleanup job will run every ${hourlyInterval} hours at ${randomMin} minutes and ${randomSecond} seconds past the hour`,
)
export const getApp = () => app
