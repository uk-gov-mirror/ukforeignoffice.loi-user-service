const crypto = require('crypto'),
  Model = require('../model/models.js'),
  common = require('../../config/common.js'),
  envVariables = common.config(),
  validator = require('validator'),
  { Op } = require('sequelize'),
  emailService = require('../services/emailService'),
  isEmail = require('isemail')

module.exports.forgotPassword = async function (req, res) {
  try {
    // Create random reset token
    const token = await new Promise((resolve, reject) => {
      crypto.randomBytes(20, function (error, buf) {
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
    let emailValid = isEmail.validate(email)

    if (!emailValid) {
      console.info('Password reset requested. Invalid email pattern.')
      return res.render('forgot', { message: 'Please enter a valid email address.' })
    } else {
      req.session.flash = ''
      req.flash(
        'info',
        `If an account matches ${email} we'll send you an email with instructions on how to reset your password.`,
      )
    }

    if (!user) {
      console.info('Password reset requested. Email not found.')
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

    console.info('Password reset requested.')

    // Send reset password email
    await emailService.resetPassword(email, token)

    return res.redirect('/api/user/sign-in')
  } catch (error) {
    console.error('An error occurred in the forgotPassword function:', error)
    return res.redirect('/api/user/sign-in')
  }
}

module.exports.resetPassword = async function (req, res) {
  var reset = req.path != '/set-new-password'
  var patt = new RegExp(envVariables.password_settings.passwordPattern)
  var messages = []
  var passwordErrorType = []
  var blackList = require('../../config/blacklist.js')
  var phraselist = require('../../config/phraselist.js')
  var passwordInBlacklist = validator.isIn(req.body.password, blackList)
  var normalisedPassword = validator.blacklist(req.body.password, ' ').trim().toLowerCase()
  var passwordInPhraselist = false

  for (var phrase of phraselist) {
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

  if (req.body.password != req.body.confirm_password) messages.push('Passwords did not match \n')

  if (messages.length > 0) {
    return res.render(reset ? 'reset.ejs' : 'set-new-password.ejs', {
      error: messages,
      passwordErrorType: passwordErrorType,
      resetPasswordToken: req.params.token,
    })
  } else {
    try {
      //Find User with the password token which has not expired
      var where = reset
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

      var user = await Model.User.findOne(where)
      if (!user && reset) {
        req.flash('error', 'Password reset token is invalid or has expired.')
        return res.redirect('back')
      }

      //Hash the new password
      var bcrypt = require('bcryptjs')
      var salt = bcrypt.genSaltSync(10)
      var password = req.body.password,
        confirm_password = req.body.confirm_password
      var hashedPassword = password !== null && password !== '' ? bcrypt.hashSync(password, salt) : ''
      var hashedConfirmPassword =
        confirm_password !== null && confirm_password !== '' ? bcrypt.hashSync(confirm_password, salt) : ''

      function password_expiry(date, days) {
        var result = new Date(date)
        result.setDate(result.getDate() + days)
        return result
      }

      //Check that password is different from old password
      if (user.password === bcrypt.hashSync(password, user.salt)) {
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

      console.info('Password reset requested. Change successful.')
      emailService.confirmPasswordChange(user.first_name, user.email)

      return res.redirect(reset ? '/api/user/sign-in' : '/api/user/dashboard')
    } catch (error) {
      console.error(error)
      return res.status(500).send({ message: 'An error occurred while resetting the password.' })
    }
  }
}
