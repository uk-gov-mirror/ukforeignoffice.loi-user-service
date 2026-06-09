import crypto from 'node:crypto'
import { genSaltSync, hashSync } from 'bcryptjs'
import { Op } from 'sequelize'
import validator from 'validator'
import blackList from '../../config/blacklist.js'
import { config, validations } from '../../config/common.js'
import { logger } from '../../config/logs.js'
import phraselist from '../../config/phraselist.js'
import Model from '../model/models.js'
import emailService from '../services/emailService.js'

const envVariables = config()

export const forgotPassword = async (req, res) => {
  try {
    // Create random reset token
    const token = await new Promise((resolve, reject) => {
      crypto.randomBytes(20, (error, buf) => {
        if (error) {
          reject(error)
        } else {
          const token = buf.toString('hex')
          resolve(token)
        }
      })
    })

    // Find User
    const email = req.body.email.toLowerCase()
    const user = await Model.User.findOne({ where: { email } })
    const emailValid = validations.emailRegex.test(email)

    if (!emailValid) {
      logger.info('Password reset requested. Invalid email pattern.')
      return res.render('forgot', { message: 'Please enter a valid email address.' })
    } else {
      req.session.flash = ''
      req.flash(
        'info',
        `If an account matches ${email} we'll send you an email with instructions on how to reset your password.`,
      )
    }

    if (!user) {
      logger.info('Password reset requested. Email not found.', { email })
      return res.redirect('/api/user/sign-in')
    }

    // Create expiry variable for token expiration
    const expire = new Date()
    const expiryTime = 60 * 60 * 1000 // 1 hour
    expire.setTime(expire.getTime() + expiryTime) // now +1 hour

    // Associate token and the token expiry with user
    await Model.User.update(
      {
        resetPasswordToken: token,
        resetPasswordExpires: expire,
      },
      {
        where: {
          email,
        },
      },
    )

    logger.info('Password reset requested.', { email, userId: user?.id })

    // Send reset password email
    await emailService.resetPassword(email, token)

    return res.redirect('/api/user/sign-in')
  } catch (error) {
    logger.error('An error occurred in the forgotPassword function:', { error, email })
    return res.redirect('/api/user/sign-in')
  }
}

export const resetPassword = async (req, res) => {
  const reset = req.path !== '/set-new-password'
  const patt = new RegExp(envVariables.password_settings.passwordPattern)
  const messages = []
  const passwordErrorType = []

  const passwordInBlacklist = validator.isIn(req.body.password, blackList)
  const normalisedPassword = validator.blacklist(req.body.password, ' ').trim().toLowerCase()
  let passwordInPhraselist = false

  for (const phrase of phraselist) {
    if (normalisedPassword.includes(phrase.toLowerCase())) {
      passwordInPhraselist = true
      break
    }
  }

  if (passwordInBlacklist || passwordInPhraselist) {
    messages.push(
      "Change the words in your password - don't include any commonly used words that are easy to guess. \n",
    )
  }

  if (passwordInBlacklist) {
    passwordErrorType.push('blacklist')
  }

  if (passwordInPhraselist) {
    passwordErrorType.push('phraselist')
  }

  if (req.body.password === '') {
    messages.push('Enter a password \n')
  } else {
    if (!patt.test(req.body.password))
      messages.push(
        'Your password must be at least 8 characters, including 1 uppercase letter, 1 number and 1 special character (e.g. !, @, #) \n',
      )
    else if (req.body.password.length < 8)
      messages.push(
        'Enter a password ensuring it is at least 8 characters, including 1 uppercase letter, 1 number and 1 special character (e.g. !, @, #) \n',
      )
    else if (req.body.password.length > 50)
      messages.push(
        'Enter a password ensuring it is at most 50 characters long, including 1 uppercase letter, 1 number and 1 special character (e.g. !, @, #) \n',
      )
  }

  if (req.body.password !== req.body.confirm_password) messages.push('Passwords did not match \n')

  if (messages.length > 0) {
    return res.render(reset ? 'reset.ejs' : 'set-new-password.ejs', {
      error: messages,
      passwordErrorType: passwordErrorType,
      resetPasswordToken: req.params.token,
    })
  } else {
    try {
      //Find User with the password token which has not expired
      const where = reset
        ? {
            where: {
              resetPasswordToken: req.params.token,
              resetPasswordExpires: {
                [Op.gt]: new Date(),
              },
            },
          }
        : {
            where: {
              email: req.session.email,
            },
          }

      const user = await Model.User.findOne(where)
      if (!user && reset) {
        req.flash('error', 'Password reset token is invalid or has expired.')
        return res.redirect(req.get('Referrer') || '/')
      }

      //Hash the new password
      const salt = genSaltSync(10)
      const password = req.body.password,
        confirm_password = req.body.confirm_password
      const hashedPassword = password !== null && password !== '' ? hashSync(password, salt) : ''
      const hashedConfirmPassword =
        confirm_password !== null && confirm_password !== '' ? hashSync(confirm_password, salt) : ''

      function password_expiry(date, days) {
        const result = new Date(date)
        result.setDate(result.getDate() + days)
        return result
      }

      //Check that password is different from old password
      if (user.password === hashSync(password, user.salt)) {
        return res.render(reset ? 'reset.ejs' : 'set-new-password.ejs', {
          error: ['Your new password must be different from your last password.'],
          passwordErrorType: passwordErrorType,
          resetPasswordToken: req.params.token,
        })
      }

      //Update the user with the new the password and its salt and also remove the token information.
      await Model.User.update(
        {
          password: hashedPassword,
          confirm_password: hashedConfirmPassword,
          salt: salt,
          resetPasswordToken: '',
          resetPasswordExpires: null,
          failedLoginAttemptCount: 0,
          accountLocked: false,
          passwordExpiry: password_expiry(new Date(), envVariables.password_settings.passwordExpiryInDays),
          activated: true,
        },
        {
          where: { email: user.email },
        },
      )

      logger.info('Password reset requested. Change successful.', { email: user?.email, userId: user?.id })
      emailService.confirmPasswordChange(user.first_name, user.email)

      return res.redirect(reset ? '/api/user/sign-in' : '/api/user/dashboard')
    } catch (error) {
      logger.error('An error occurred while resetting the password:', { error, email: user?.email, userId: user?.id })
      return res.status(500).send({ message: 'An error occurred while resetting the password.' })
    }
  }
}

export default {
  forgotPassword,
  resetPassword,
}
