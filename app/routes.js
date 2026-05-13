import moment from 'moment'
import passport from 'passport'
import { Op } from 'sequelize'
import { logger } from '../config/logs.js'
import accountController from './controllers/accountController.js'
import addressController from './controllers/addressController.js'
import passwordController from './controllers/passwordController.js'
import registerController from './controllers/registerController.js'
import requestBusinessServiceAccessController from './controllers/requestBusinessServiceAccessController.js'
import Model from './model/models.js'
import emailService from './services/emailService.js'
import oneTimePasscodeService from './services/oneTimePasscodeService.js'

const sessionSettings = JSON.parse(process.env.THESESSION)
let nextpage

export default (express, envVariables) => {
  const router = express.Router()

  const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next()
    req.flash('error', 'You have to be logged in to access the page.')
    res.redirect('/api/user/sign-in')
  }

  const isSecondFactorAuthenticated = (req, res, next) => {
    if ((req.session.method === 'totp' && req.session.secondFactorSuccess === true) || req.session.method === 'plain') {
      return next()
    } else {
      req.flash('error', 'You have to be logged in to access the page.')
      req.session.appId = false
      res.clearCookie('LoggedIn')
      res.redirect('/api/user/sign-in')
    }
  }

  const sessionValid = (req, res, next) => {
    if (!req.session.passport) {
      res.clearCookie('LoggedIn')
      return res.redirect(`${envVariables.applicationServiceURL}session-expired?LoggedIn=true`)
    } else {
      return next()
    }
  }

  const isAdmin = (req, res, next) => {
    if (req?.session?.user?.isAdmin) {
      return next()
    } else {
      req.flash('error', 'You do not have permission to access the page.')
      req.session.appId = false
      res.clearCookie('LoggedIn')
      res.redirect('/api/user/sign-in')
    }
  }

  router.get('/', (_req, res) => {
    res.redirect(envVariables.applicationServiceURL)
  })

  router.get('/usercheck', (req, res) =>
    res.render('usercheck.ejs', {
      queryString: req.query,
      applicationServiceURL: envVariables.applicationServiceURL,
      error: false,
    }),
  )

  router.post('/usercheck', registerController.usercheck)

  router.get('/register', registerController.show)

  router.post('/register', registerController.register)

  router.get('/sign-in', (req, res) => {
    const sessionCookie = req.cookies[sessionSettings.key]
    if (!sessionCookie) {
      return res.redirect(`${envVariables.applicationServiceURL}select-service?newSession=true`)
    }
    if (req.query.expired) {
      req.flash('info', 'You have been successfully signed out.')
    }
    //check if there was an activation error
    let error = req.flash('error')
    let error_subitem = ''
    if (error === 'Activation failed') {
      return res.redirect('/api/user/emailconfirm')
    } else if (error === 'There was a problem signing in') {
      error_subitem = 'Check your email and password and try again'
    } else if (error === 'Account expired') {
      error = 'Your account has expired.'
    }
    if (error.length > 0) {
      let info_text = error
      if (info_text === 'There was a problem signing in') {
        info_text = 'The specified email and password combination does not exist'
      }
      logger.info(`Failed Sign In Attempt: ${info_text}`)
    }
    //render page and pass in flash data if any exists
    let back_link = '/api/user/usercheck'

    if (req.query.from) {
      if (req.query.from === 'home') {
        back_link = envVariables.applicationServiceURL
      } else if (req.query.from === 'start') {
        back_link = `${envVariables.applicationServiceURL}start`
      } else if (req.query.from === 'docChecker') {
        back_link = `${envVariables.applicationServiceURL}choose-documents-or-skip`
      } else {
        back_link = `${envVariables.applicationServiceURL}start`
      }
    }

    if (req.query.next && req.query.next === 'continueEApp') {
      req.session.continueEAppFlow = true
    }

    if (req.query.next && req.query.next === 'continueDocChecker') {
      req.session.continueDocChecker = true
    }

    return res.render('sign-in.ejs', {
      error: error,
      error_subitem: error_subitem,
      signed_out: req.query.expired,
      info: req.flash('info'),
      email: req.session.email,
      back_link: back_link,
      applicationServiceURL: envVariables.applicationServiceURL,
      qs: req.query,
    })
  })

  router.post(
    '/sign-in',
    (req, res, next) => {
      req.body.email = req.body.email.toLowerCase()

      req.session.email = req.body.email

      if (!req.body.email) {
        if (!req.body.password) {
          req.flash('error', 'Missing email and password')
        } else {
          req.flash('error', 'Missing email')
        }
      } else if (!req.body.password) {
        req.flash('error', 'Missing password')
      }
      if (!req.body.email || !req.body.password) {
        return res.redirect('/api/user/sign-in')
      }

      req.body.username = req.body.email
      nextpage = req.body.next
      return next()
    },
    passport.authenticate('local', {
      failureRedirect: '/api/user/sign-in',
      failureFlash: true,
      keepSessionInfo: true,
    }),
    async (req, res) => {
      // check to see if the user has requested too many new codes
      // or if they have entered the passcode incorrectly too many times
      // each code generation or incorrect passcode attempt increases
      // the oneTimePasscodeAttempts value
      if (req.user.oneTimePasscodeAttempts <= 10) {
        const userNeedsToEnterAPasscode = moment(req.user.oneTimePasscodeExpiry).isBefore(moment())

        if (userNeedsToEnterAPasscode) {
          req.session.method = 'totp'

          // one time passcodes expire 10 mins after being issued
          const oneTimePasscodeExists = await oneTimePasscodeService.checkIfOneTimePasscodeExists(req.user.id)

          if (oneTimePasscodeExists) {
            // if the one time passcode for the user is old we need to
            // delete it and generate a new one
            if (moment(Date.parse(oneTimePasscodeExists.passcode_expiry)).isBefore(Date.now())) {
              await oneTimePasscodeService.deleteOneTimePasscode(req.user.id)
              const one_time_passcode = await oneTimePasscodeService.generateOneTimePasscode()
              await oneTimePasscodeService.storeNewOneTimePasscode(req.user.id, one_time_passcode)
              if (req.user.mfaPreference === 'Email') {
                await emailService.sendOneTimePasscodeEmail(one_time_passcode, req.user.email, req.user.id)
              } else {
                const mobileNumberLookup = await oneTimePasscodeService.checkMobileNumber(req.user.id)
                await emailService.sendOneTimePasscodeSMS(
                  one_time_passcode,
                  mobileNumberLookup.dataValues.mobileNo,
                  req.user.id,
                )
              }
            }
          } else {
            const one_time_passcode = await oneTimePasscodeService.generateOneTimePasscode()
            await oneTimePasscodeService.storeNewOneTimePasscode(req.user.id, one_time_passcode)
            if (req.user.mfaPreference === 'Email') {
              await emailService.sendOneTimePasscodeEmail(one_time_passcode, req.user.email, req.user.id)
            } else {
              const mobileNumberLookup = await oneTimePasscodeService.checkMobileNumber(req.user.id)
              await emailService.sendOneTimePasscodeSMS(
                one_time_passcode,
                mobileNumberLookup.dataValues.mobileNo,
                req.user.id,
              )
            }
          }

          res.redirect('/api/user/enter-totp')
        } else {
          req.session.method = 'plain'
          res.cookie('LoggedIn', true, { maxAge: 1800000, httpOnly: true })
          // success redirect
          res.redirect('/api/user/dashboard')
        }
      } else {
        req.flash('error', 'You have made too many incorrect login attempts')
        await oneTimePasscodeService.lockUserAccount(req.user.id)
        res.redirect('/api/user/sign-in')
      }
    },
  )

  router.get('/enter-totp', isAuthenticated, async (req, res) => {
    const user_id = req.session.passport.user
    const userData = await oneTimePasscodeService.getUserData(user_id)
    const accountData = await oneTimePasscodeService.getAccountData(user_id)
    const mobileNumberLookup = await oneTimePasscodeService.checkMobileNumber(user_id)

    if (req.query.resendPasscode === 'true') {
      let oneTimePasscodeAttempts = userData.oneTimePasscodeAttempts
      oneTimePasscodeAttempts = oneTimePasscodeAttempts + 1
      await oneTimePasscodeService.updateAccountPasscodeAttempts(oneTimePasscodeAttempts, user_id)

      if (oneTimePasscodeAttempts <= 10) {
        const one_time_passcode = await oneTimePasscodeService.generateOneTimePasscode()
        await oneTimePasscodeService.deleteOneTimePasscode(user_id)
        await oneTimePasscodeService.storeNewOneTimePasscode(user_id, one_time_passcode)
        if (userData.mfaPreference === 'Email') {
          if (req.query.changeMethod === 'true') {
            await emailService.sendOneTimePasscodeSMS(
              one_time_passcode,
              mobileNumberLookup?.dataValues?.mobileNo,
              user_id,
            )
          } else {
            await emailService.sendOneTimePasscodeEmail(one_time_passcode, userData.email, user_id)
          }
        } else {
          if (req.query.changeMethod === 'true') {
            await emailService.sendOneTimePasscodeEmail(one_time_passcode, userData.email, user_id)
          } else {
            await emailService.sendOneTimePasscodeSMS(
              one_time_passcode,
              mobileNumberLookup?.dataValues?.mobileNo,
              user_id,
            )
          }
        }
        req.flash('info', 'We have sent you another passcode.')
        res.render('enter-totp', {
          error: false,
          errorsArray: [],
          info: req.flash('info'),
          back_link: '/api/user/sign-in',
          mfaPreference: userData.mfaPreference,
          mobileNo: accountData?.mobileNo,
        })
      } else {
        req.flash('error', 'You have made too many incorrect login attempts')
        await oneTimePasscodeService.lockUserAccount(user_id)
        res.redirect('/api/user/sign-in')
      }
    } else {
      res.render('enter-totp', {
        error: false,
        errorsArray: [],
        mfaPreference: userData.mfaPreference,
        info: req.flash('info'),
        back_link: '/api/user/sign-in',
        mobileNo: accountData?.mobileNo,
      })
    }
  })

  router.post('/enter-totp', isAuthenticated, async (req, res) => {
    const passcode = req.body.passcode
    const user_id = req.session.passport.user
    const errorsArray = []
    const userData = await oneTimePasscodeService.getUserData(user_id)
    const mobileNumberLookup = await oneTimePasscodeService.checkMobileNumber(user_id)

    function validateFormInput(passcode) {
      if (passcode.length === 0) {
        errorsArray.push({
          fieldName: 'passcode',
          fieldError: 'Please enter a passcode',
        })
      } else if (passcode.length !== 6) {
        errorsArray.push({
          fieldName: 'passcode',
          fieldError: 'Please enter a 6 digit passcode',
        })
      }

      return errorsArray.length === 0
    }

    const noErrorsPresent = await validateFormInput(passcode)

    if (noErrorsPresent) {
      const verificationIsSuccessful = await oneTimePasscodeService.verifyUser(user_id, passcode)
      if (verificationIsSuccessful) {
        req.session.secondFactorSuccess = true
        await oneTimePasscodeService.deleteOneTimePasscode(user_id)
        await oneTimePasscodeService.updateAccountPasscodeExpiryTime(user_id)
        logger.info(`SUCCESSFUL LOGIN FOR USER ${user_id}`)
        res.cookie('LoggedIn', true, { maxAge: 1800000, httpOnly: true })
        res.redirect('/api/user/dashboard')
      } else {
        let oneTimePasscodeAttempts = userData.oneTimePasscodeAttempts
        oneTimePasscodeAttempts = oneTimePasscodeAttempts + 1
        await oneTimePasscodeService.updateAccountPasscodeAttempts(oneTimePasscodeAttempts, user_id)

        if (oneTimePasscodeAttempts <= 10) {
          errorsArray.push({
            fieldName: 'passcode',
            fieldError: 'The passcode you entered was incorrect',
          })

          res.render('enter-totp', {
            error: true,
            errorsArray: errorsArray,
            info: req.flash('info'),
            back_link: '/api/user/sign-in',
            mfaPreference: userData.mfaPreference,
            mobileNo: mobileNumberLookup.dataValues.mobileNo,
          })
        } else {
          req.flash('error', 'You have made too many incorrect login attempts')
          res.redirect('/api/user/sign-in')
        }
      }
    } else {
      return res.render('enter-totp', {
        error: true,
        errorsArray: errorsArray,
        info: req.flash('info'),
        back_link: '/api/user/sign-in',
        mfaPreference: userData.mfaPreference,
        mobileNo: mobileNumberLookup.dataValues.mobileNo,
      })
    }
  })

  router.get('/dashboard', isAuthenticated, isSecondFactorAuthenticated, (req, res) => {
    //set payment reference for user
    Model.User.findOne({ where: { email: req.session.email } }).then((user) => {
      if (user.passwordExpiry < new Date()) {
        return res.redirect('/api/user/set-new-password')
      }

      if (req.query.complete) {
        Model.AccountDetails.update({ complete: true }, { where: { user_id: user.id } }).then(() => {
          req.session.initial = false
          req.session.payment_reference = user.payment_reference
          let queryString = '?'
          queryString += 'message=' + 'Your account is now set up and you can start a new application.'

          return res.redirect(`${envVariables.applicationServiceURL}loading-dashboard${queryString}`)
        })
      } else {
        Model.AccountDetails.findOne({ where: { user_id: user.id } }).then((account) => {
          if (account?.complete) {
            // set payment reference in session
            req.session.payment_reference = user.payment_reference
            let queryString = '?'
            if (nextpage) {
              queryString += `name=${nextpage}`
            }
            if (req.query.message) {
              if (nextpage) {
                queryString += '&'
              }
              queryString += `message=${req.query.message}`
            }
            return res.redirect(`${envVariables.applicationServiceURL}loading-dashboard${queryString}`)
          } else {
            // set payment reference in session
            req.session.payment_reference = user.payment_reference
            return res.redirect('/api/user/complete-details')
          }
        })
      }
    })
  })

  router.get('/sign-out', (req, res) => {
    req.session.destroy()
    res.clearCookie('express.sid')
    res.clearCookie('LoggedIn')
    return res.redirect(`${envVariables.applicationServiceURL}select-service?newSession=true&expired=true`)
  })

  router.get('/forgot', (req, res) => {
    var locked = typeof req.query.locked !== 'undefined' ? JSON.parse(req.query.locked) : false
    res.render('forgot', { message: req.flash('info'), locked: locked })
  })

  router.post('/forgot', passwordController.forgotPassword)

  router.get('/session-expired', (_req, res) => {
    res.render('session-expired', { startNewApplicationUrl: envVariables.applicationServiceURL })
  })

  router.get('/reset/:token', (req, res) => {
    // Added this code to prevent HEAD requests triggering
    // the logic in Production
    if (req.method !== 'GET') {
      return res.status(200).send('OK')
    }

    Model.User.findOne({
      where: { resetPasswordToken: req.params.token, resetPasswordExpires: { [Op.gt]: new Date() } },
    }).then((user) => {
      if (!user) {
        req.flash('info', 'The link for resetting your password has expired. Enter your email to get sent a new link.')
        logger.info('Password reset requested. Reset link expired.')
        return res.render('forgot', { message: req.flash('info'), locked: false })
      }
      return res.render('reset', { resetPasswordToken: req.params.token, error: false })
    })
  })

  router.post('/reset/:token', passwordController.resetPassword)

  router.get('/set-new-password', sessionValid, isSecondFactorAuthenticated, (_req, res) => {
    res.render('set-new-password.ejs', { error: false })
  })

  router.post('/set-new-password', passwordController.resetPassword)

  router.get('/activate/:token', registerController.activate)

  router.get('/emailconfirm', (req, res) =>
    res.render('emailconfirm.ejs', {
      email: req.session.email,
      applicationServiceURL: envVariables.applicationServiceURL,
      info: req.flash('info'),
    }),
  )

  router.post('/resend-confirmation', registerController.resendActivationEmail)

  router.get('/complete-details', sessionValid, isSecondFactorAuthenticated, (req, res) => {
    res.render('initial/complete-details', { error_report: false, form_values: false, error: req.flash('error') })
  })
  router.get('/complete-registration', sessionValid, isSecondFactorAuthenticated, registerController.showAddressSkip)
  router.post(
    '/complete-registration',
    sessionValid,
    isSecondFactorAuthenticated,
    registerController.completeRegistration,
  )

  router.get('/account', sessionValid, isSecondFactorAuthenticated, accountController.showAccount)
  router.get('/admin', sessionValid, isSecondFactorAuthenticated, isAdmin, accountController.showAdminSection)
  router.get(
    '/admin-search-email',
    sessionValid,
    isSecondFactorAuthenticated,
    isAdmin,
    accountController.showAdminSearchEmail,
  )
  router.post(
    '/admin-search-email',
    sessionValid,
    isSecondFactorAuthenticated,
    isAdmin,
    accountController.adminSearchEmail,
  )
  router.get(
    '/ajax-search-email',
    sessionValid,
    isSecondFactorAuthenticated,
    isAdmin,
    accountController.ajaxSearchEmail,
  )
  router.post(
    '/update-permissions',
    sessionValid,
    isSecondFactorAuthenticated,
    isAdmin,
    accountController.updatePermissions,
  )
  router.get(
    '/update-permissions',
    sessionValid,
    isSecondFactorAuthenticated,
    isAdmin,
    accountController.showUpdatePermissions,
  )
  router.get('/change-details', sessionValid, isSecondFactorAuthenticated, accountController.showChangeDetails)
  router.post('/change-details', sessionValid, isSecondFactorAuthenticated, accountController.changeDetails)
  router.get('/change-password', sessionValid, isSecondFactorAuthenticated, accountController.showChangePassword)
  router.post('/change-password', sessionValid, isSecondFactorAuthenticated, accountController.changePassword)
  router.get('/change-mfa', sessionValid, isSecondFactorAuthenticated, accountController.showChangeMfa)
  router.post('/change-mfa', sessionValid, isSecondFactorAuthenticated, accountController.changeMfa)
  router.get('/validate-sms-totp', sessionValid, isSecondFactorAuthenticated, accountController.showValidateSMS)
  router.post('/validate-sms-totp', sessionValid, isSecondFactorAuthenticated, accountController.validateSMS)
  router.get(
    '/change-company-details',
    sessionValid,
    isSecondFactorAuthenticated,
    accountController.showChangeCompanyDetails,
  )
  router.post(
    '/change-company-details',
    sessionValid,
    isSecondFactorAuthenticated,
    accountController.changeCompanyDetails,
  )
  router.get('/change-email', sessionValid, isSecondFactorAuthenticated, accountController.changeEmail)
  router.get('/addresses', sessionValid, isSecondFactorAuthenticated, accountController.showAddresses)

  router.get('/add-address', sessionValid, isSecondFactorAuthenticated, addressController.showUKQuestion)
  router.post('/add-address-uk', sessionValid, isSecondFactorAuthenticated, addressController.submitUKQuestion)
  router.get('/add-address-uk', sessionValid, isSecondFactorAuthenticated, addressController.showPostcodeLookup)

  router.get('/find-your-address', sessionValid, isSecondFactorAuthenticated, addressController.findAddress)
  router.post('/find-your-address', sessionValid, isSecondFactorAuthenticated, addressController.findAddress)

  router.post('/ajax-find-your-address', sessionValid, isSecondFactorAuthenticated, addressController.ajaxFindPostcode)
  router.post(
    '/ajax-select-your-address',
    sessionValid,
    isSecondFactorAuthenticated,
    addressController.ajaxSelectAddress,
  )

  router.get('/select-your-address', sessionValid, isSecondFactorAuthenticated, addressController.selectAddress) //Redirects back to postcode search
  router.post('/select-your-address', sessionValid, isSecondFactorAuthenticated, addressController.selectAddress)

  router.get('/your-address-manual', sessionValid, isSecondFactorAuthenticated, addressController.showManualAddress)
  router.post('/save-address', sessionValid, isSecondFactorAuthenticated, addressController.saveAddress)

  router.get('/edit-address', sessionValid, isSecondFactorAuthenticated, addressController.showEditAddress)
  router.post('/edit-address', sessionValid, isSecondFactorAuthenticated, addressController.editAddress)
  router.get('/delete-address', sessionValid, isSecondFactorAuthenticated, addressController.deleteAddress)

  router.get(
    '/request-business-service-access',
    sessionValid,
    isSecondFactorAuthenticated,
    requestBusinessServiceAccessController.showRequestBusinessServiceAccess,
  )
  router.post(
    '/request-business-service-access',
    sessionValid,
    isSecondFactorAuthenticated,
    requestBusinessServiceAccessController.requestBusinessServiceAccess,
  )
  router.get('/approve/:token', requestBusinessServiceAccessController.approve)
  router.get('/reject/:token', requestBusinessServiceAccessController.reject)

  return router
}
