import bcrypt from 'bcryptjs'
import { Strategy as LocalStrategy } from 'passport-local'
import common from '../config/common.js'
import { logger } from '../config/logs.js'
import Model from './model/models.js'
import emailService from './services/emailService.js'

const envVariables = common.config()

export default (app, passport) => {
  app.use(passport.initialize())
  app.use(passport.session())

  passport.use(
    new LocalStrategy(async (email, password, done) => {
      let user
      try {
        user = await Model.User.findOne({ where: { email: email } })

        if (user === null) {
          return done(null, false, { message: 'There was a problem signing in' })
        }

        if (user.failedLoginAttemptCount >= envVariables.password_settings.maxLoginAttempts) {
          return done(null, false, { message: 'There was a problem signing in' })
        }

        if (user.accountLocked) {
          return done(null, false, { message: 'There was a problem signing in' })
        }

        const passwordMatch = await bcrypt.compare(password, user.password)

        if (passwordMatch) {
          if (!user.activated) {
            return done(null, false, { message: 'Activation failed' })
          } else if (user.accountExpiry < new Date()) {
            return done(null, false, { message: 'Account expired' })
          } else {
            const accountExpiry = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            await Model.User.update(
              {
                failedLoginAttemptCount: 0,
                accountExpiry: accountExpiry,
                warningSent: false,
                expiryConfirmationSent: false,
              },
              {
                where: { email: email },
              },
            )
            return done(null, user)
          }
        } else {
          await Model.User.update(
            { failedLoginAttemptCount: user.failedLoginAttemptCount + 1 },
            { where: { email: email } },
          )

          if (user.failedLoginAttemptCount + 1 >= envVariables.password_settings.maxLoginAttempts) {
            await Model.User.update(
              {
                failedLoginAttemptCount: user.failedLoginAttemptCount + 1,
                accountLocked: true,
              },
              { where: { email: email } },
            )

            await emailService.lockedOut(user.first_name, email)
            logger.info(`ACCOUNT LOCKED - UserID: ${user.id}`, { userId: user.id })
            return done(null, false, { message: 'There was a problem signing in' })
          } else {
            return done(null, false, { message: 'There was a problem signing in' })
          }
        }
      } catch (error) {
        logger.error('Error during authentication process:', { error, userId: user?.id })
        return done(error)
      }
    }),
  )

  passport.serializeUser((user, done) => {
    done(null, user.id)
  })

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await Model.User.findOne({ where: { id: id } })

      if (user === null) {
        return done(new Error('Wrong user id.'))
      }

      return done(null, user)
    } catch (error) {
      return done(error)
    }
  })
}
