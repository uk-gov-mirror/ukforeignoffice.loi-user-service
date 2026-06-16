import crypto from 'node:crypto'
import axios from 'axios'
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'
import validator from 'validator'
import blackList from '../../config/blacklist.js'
import { config, validations } from '../../config/common.js'
import { logger } from '../../config/logs.js'
import phraselist from '../../config/phraselist.js'
import Model from '../model/models.js'
import dbConnection from '../sequelize.js'
import emailService from '../services/emailService.js'
import HelperService from '../services/HelperService.js'
import ValidationService from '../services/ValidationService.js'

const envVariables = config()
const mobilePattern = /^(\+|\d|\(|#| )(\+|\d|\(| |-)([0-9]|\(|\)| |-){5,14}$/
const phonePattern = /^(\+|\d|\(|#| )(\+|\d|\(| |-)([0-9]|\(|\)| |-){5,14}$/

async function sendToOrbit(accountManagementObject, user) {
  try {
    const edmsManagePortalCustomerUrl = `${envVariables.edmsHost}/api/v1/managePortalCustomer`
    const edmsBearerToken = await HelperService.getEdmsAccessToken()

    const profiler = logger.startTimer()
    const response = await axios.post(edmsManagePortalCustomerUrl, accountManagementObject, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${edmsBearerToken}`,
      },
    })

    profiler.done({ message: 'EDMS managePortalCustomer request completed', userId: user.id, status: response.status })

    if (response.status === 200) {
      logger.info(`[ACCOUNT MANAGEMENT] ACCOUNT CREATION SENT TO ORBIT SUCCESSFULLY FOR USER_ID ${user.id}`, {
        userId: user.id,
        response,
      })
    } else {
      logger.error(`[ACCOUNT MANAGEMENT] ACCOUNT CREATION FAILED SENDING TO ORBIT FOR USER_ID ${user.id}`, {
        userId: user.id,
        response,
      })
    }
  } catch (error) {
    logger.error(`[ACCOUNT MANAGEMENT] ACCOUNT CREATION FAILED SENDING TO ORBIT FOR USER_ID ${user.id}`, { error })
  }
}

export const usercheck = (req, res) => {
  if (typeof req.body['has-account'] === 'undefined') {
    return res.render('usercheck.ejs', {
      queryString: req.query,
      applicationServiceURL: envVariables.applicationServiceURL,
      error: { error: 'Please select an option.' },
      error_description: false,
    })
  }
  //copy any querystring
  let queryString = ''
  if (req.body.next) {
    queryString = `?next=${req.body.next}`
  }
  if (req.body['has-account'] === 'true') {
    return res.redirect(`/api/user/sign-in${queryString}`)
  } else {
    return res.redirect(`/api/user/register${queryString}`)
  }
}

export const show = (req, res) => {
  if (req.query.from) {
    if (req.query.from === 'home') {
      req.session.back_link = envVariables.applicationServiceURL
    } else if (req.query.from === 'start') {
      req.session.back_link = `${envVariables.applicationServiceURL}start`
    } else {
      req.session.back_link = `${envVariables.applicationServiceURL}start`
    }
  }

  return res.render('register.ejs', {
    form_values: false,
    erroneousFields: false,
    passwordErrorType: false,
    error_report: false,
    error: false,
    error_description: false,
    email: req.session.email,
    back_link: req.session.back_link,
    applicationServiceURL: envVariables.applicationServiceURL,
  })
}

export const register = (req, res) => {
  req.body.email = req.body.email.toLowerCase()
  req.body.confirm_email = req.body.confirm_email.toLowerCase()

  const patt = new RegExp(envVariables.password_settings.passwordPattern)

  const emailValid = validations.emailRegex.test(req.body.email)

  const messages = []
  const passwordErrorType = []
  const errorDescription = []
  const erroneousFields = [
    {
      email: false,
      confirm_email: false,
      password: false,
      confirm_password: false,
      business_yes_no: false,
      company_name: false,
      company_verification_check: false,
      all_info_correct: false,
    },
  ]

  if (!emailValid) {
    errorDescription.push('You have not provided a valid email address \n')
    messages.push({ email: 'Enter a valid email address \n' })
    erroneousFields[0].email = true
  }
  if (req.body.email !== req.body.confirm_email) {
    errorDescription.push('Confirm your email address \n')
    messages.push({ confirm_email: 'Email addresses must match \n' })
    erroneousFields[0].confirm_email = true
  }

  // check the password against the blacklists
  //return true if password is in the blacklist
  const passwordInBlacklist = validator.isIn(req.body.password, blackList)
  // normalise the password by removing all spaces and converting to lower case
  const normalisedPassword = validator.blacklist(req.body.password, ' ').trim().toLowerCase()
  // check to see if a word in the phraselist appears in the normalised password
  let passwordInPhraselist = false

  for (const phrase of phraselist) {
    if (normalisedPassword.includes(phrase.toLowerCase())) {
      passwordInPhraselist = true
      break
    }
  }

  if (passwordInBlacklist || passwordInPhraselist) {
    errorDescription.push(
      "Change the words in your password - don't include any commonly used words that are easy to guess. \n",
    )
    messages.push({
      password: "Change the words in your password - don't include any commonly used words that are easy to guess. \n",
    })
    erroneousFields[0].password = true
  }

  if (passwordInBlacklist) {
    passwordErrorType.push('blacklist')
  }

  if (passwordInPhraselist) {
    passwordErrorType.push('phraselist')
  }

  if (req.body.password === '') {
    errorDescription.push('You have not provided a valid password \n')
    messages.push({ password: 'Enter a password \n' })
    errorDescription.push('You must confirm the password \n')
    messages.push({ confirm_password: 'Confirm your password \n' })
    erroneousFields[0].password = true
  } else {
    if (req.body.password === '' && req.body.confirm_password === '') {
      messages.push({ confirm_password: 'Confirm your password \n' })
    } else if (req.body.password !== req.body.confirm_password) {
      errorDescription.push('You must confirm the password \n')
      messages.push({ password: 'Enter a password \n' })
      messages.push({ confirm_password: 'Passwords did not match \n' })
      erroneousFields[0].confirm_password = true
    } else {
      if (req.body.password.length < 8) {
        messages.push({
          password:
            'Enter a password with at least 8 characters, including 1 uppercase letter, 1 number and 1 special character (e.g. !, @, #) \n',
        })
        messages.push({ confirm_password: 'Confirm your password \n' })
      } else if (req.body.password.length > 50) {
        messages.push({
          password:
            'Enter a password up to 50 characters long, including 1 uppercase letter, 1 number and 1 special character (e.g. !, @, #) \n',
        })
        messages.push({ confirm_password: 'Confirm your password \n' })
      } else if (!patt.test(req.body.password)) {
        messages.push({
          password:
            'Your password must be at least 8 characters long and contain 1 uppercase letter, 1 number and 1 special character (e.g. !, @, #) \n',
        })
        messages.push({ confirm_password: 'Confirm your password \n' })
      }
    }
    erroneousFields[0].password = true
  }

  let companyVerification = false
  if (typeof req.body.company_verification_check !== 'undefined') {
    const companyVerificationArr = req.body.company_verification_check
    if (companyVerificationArr.indexOf('on') > -1) {
      companyVerification = true
    } else {
      companyVerification = false
    }
  }
  req.body.company_verification_check = companyVerification

  if (typeof req.body.business_yes_no === 'undefined') {
    errorDescription.push('You have not stated if you are registering on behalf of a business \n')
    messages.push({ business: 'Confirm whether you are registering on behalf of a business \n' })
    erroneousFields[0].business_yes_no = true
  } else {
    if (req.body.business_yes_no === 'Yes') {
      if (req.body.company_name.length < 1) {
        errorDescription.push('You have not provided a valid company name \n')
        messages.push({ company_name: 'Enter a valid company name \n' })
        erroneousFields[0].company_name = true
      }
      if (req.body.company_verification_check !== true) {
        errorDescription.push('Confirm that you represent a business \n')
        messages.push({ company_verification_check: 'Confirm that you represent a business \n' })
        erroneousFields[0].company_verification_check = true
      }
    }
  }

  const allInfoCorrectArr = req.body.all_info_correct
  let allInfoCorrect = false
  if (allInfoCorrectArr.indexOf('on') > -1) {
    allInfoCorrect = true
  } else {
    allInfoCorrect = false
  }

  req.body.all_info_correct = allInfoCorrect

  if (req.body.all_info_correct !== true) {
    errorDescription.push('You have not agreed to the terms and conditions \n')
    messages.push({ agree: 'Agree to the terms and conditions \n' })
    erroneousFields[0].all_info_correct = true
  }

  if (messages.length > 0) {
    return res.render('register.ejs', {
      error: messages,
      error_description: errorDescription,
      passwordErrorType: passwordErrorType,
      erroneousFields: erroneousFields,
      email: req.session.email,
      all_info_correct: allInfoCorrect,
      form_values: req.body,
      back_link: req.session.back_link ? req.session.back_link : '/api/user/usercheck',
      applicationServiceURL: envVariables.applicationServiceURL,
    })
  }
  //check to see if the email address has already been used
  Model.User.findOne({
    where: {
      email: req.body.email,
    },
  }).then((user) => {
    if (user) {
      //user already exists
      return res.render('emailconfirm.ejs', {
        email: req.body.email,
      })
    } else {
      req.session.email = req.body.email

      const email = req.body.email
      const password = req.body.password
      const confirm_password = req.body.confirm_password
      const salt = bcrypt.genSaltSync(10)

      /**
       * If no password/confirmpassword is provided, the hashed instances are set to empty strings
       * to force validation failure
       */
      const hashedPassword = password !== null && password !== '' ? bcrypt.hashSync(password, salt) : ''
      const hashedConfirmPassword =
        confirm_password !== null && confirm_password !== '' ? bcrypt.hashSync(confirm_password, salt) : ''

      // get payment reference for this user account
      dbConnection
        .query('SELECT * FROM get_next_payment_reference()')
        .then(async (results) => {
          let paymentReference

          if (results[0]) {
            paymentReference = results[0][0].get_next_payment_reference
          } else {
            return next(new Error('failed to retrieve next available payment reference'))
          }

          //generate registration token
          await createNewUser()

          async function createNewUser() {
            try {
              // Create random reset token
              const token = crypto.randomBytes(20).toString('hex')

              const expire = new Date()
              const expiryTime = 60 * 60 * 1000 * 24 // 24 hours
              expire.setTime(expire.getTime() + expiryTime) // now + 24 hours

              const newUser = {
                email,
                password: hashedPassword,
                confirm_password: hashedConfirmPassword,
                salt,
                failedLoginAttemptCount: 0,
                accountLocked: false,
                passwordExpiry: date_shift(new Date(), envVariables.password_settings.passwordExpiryInDays),
                payment_reference: paymentReference,
                activationToken: token,
                activated: false,
                activationTokenExpires: expire,
                premiumServiceEnabled: false,
                allInfoCorrect,
                accountExpiry: date_shift(new Date(), 365),
                warningSent: false,
                expiryConfirmationSent: false,
              }

              const createdUser = await Model.User.create(newUser)

              const accountDetails = {
                user_id: createdUser.id,
                complete: false,
                company_name: 'N/A',
                company_number: 0,
                feedback_consent: false,
                mobileNo: null,
                telephone: null,
              }

              if (req.body.business_yes_no === 'Yes') {
                accountDetails.company_name = req.body.company_name
              }

              const existingAccountDetails = await Model.AccountDetails.findOne({ where: { user_id: createdUser.id } })
              if (existingAccountDetails) {
                await Model.AccountDetails.update(accountDetails, { where: { user_id: createdUser.id } })
              } else {
                await Model.AccountDetails.create(accountDetails)
              }

              // Send the email
              emailService.emailConfirmation(req.body.email, token)

              req.flash(
                'info',
                "We've sent you a confirmation email. Click the link in the email to confirm your address.",
              )
              return res.redirect('/api/user/emailconfirm')
            } catch (error) {
              logger.error('Caught error:', error)

              if (error.name === 'SequelizeValidationError') {
                logger.error('Validation errors:', { errors: error.errors })
                error.errors.forEach((err, index) => {
                  logger.error(`  ${index + 1}. Field: ${err.path}, Message: ${JSON.stringify(err.message)}`)
                })
              } else {
                logger.error('Unknown error:', error)
              }
              return res.render('register.ejs', {
                error_report: ValidationService.buildErrorsArray(error),
                email: req.session.email,
                form_values: req.body,
                error: false,
                error_description: false,
                passwordErrorType: false,
                applicationServiceURL: envVariables.applicationServiceURL,
                back_link: req.session.back_link
                  ? envVariables.applicationServiceURL + req.session.back_link
                  : '/api/user/usercheck',
                erroneousFields: false,
              })
            }
          }
        })
        .catch((error) => {
          logger.error('Error getting payment reference:', { error })
        })
    }
  })
}
export const showAddressSkip = (_req, res) => res.render('initial/address-skip.ejs')
export const completeRegistration = (req, res) => {
  Model.User.findOne({ where: { email: req.session.email } }).then((user) => {
    Model.AccountDetails.findOne({ where: { user_id: user.id } }).then((data) => {
      if (data) {
        Model.AccountDetails.update(
          {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            mobileNo: mobilePattern.test(req.body.mobileNo) ? req.body.mobileNo : '',
            telephone:
              req.body.telephone !== '' ? (phonePattern.test(req.body.telephone) ? req.body.telephone : '') : null,
            feedback_consent: req.body.feedback_consent || '',
            complete: true,
          },
          { where: { user_id: user.id } },
        )
          .then(() => {
            req.session.initial = true
            return res.render('initial/address-skip.ejs')
          })
          .then(() => {
            const accountManagementObject = {
              portalCustomerUpdate: {
                userId: 'legalisation',
                timestamp: Date.now().toString(),
                portalCustomer: {
                  portalCustomerId: user.id,
                  forenames: req.body.first_name,
                  surname: req.body.last_name,
                  primaryTelephone:
                    req.body.telephone !== ''
                      ? phonePattern.test(req.body.telephone)
                        ? req.body.telephone
                        : null
                      : null,
                  mobileTelephone: mobilePattern.test(req.body.mobileNo) ? req.body.mobileNo : null,
                  eveningTelephone: '',
                  email: req.session.email,
                  companyName: '',
                  companyRegistrationNumber: data.company_number,
                },
              },
            }

            sendToOrbit(accountManagementObject, user)
          })
          .catch((error) => {
            logger.error('Error updating account details:', { error })

            // Custom error array builder for email match confirmation
            const erroneousFields = []

            if (req.body.first_name === '') {
              erroneousFields.push('first_name')
            }
            if (req.body.last_name === '') {
              erroneousFields.push('last_name')
            }

            if (typeof req.body.feedback_consent === 'undefined') {
              erroneousFields.push('feedback_consent')
            }
            if (req.body.telephone !== '' && req.body.telephone !== null) {
              if (
                req.body.telephone.length < 6 ||
                req.body.telephone.length > 25 ||
                !phonePattern.test(req.body.telephone)
              ) {
                erroneousFields.push('telephone')
              }
            }
            if (
              req.body.mobileNo === '' ||
              req.body.mobileNo.length < 6 ||
              req.body.mobileNo.length > 25 ||
              !mobilePattern.test(req.body.mobileNo)
            ) {
              erroneousFields.push('mobileNo')
            }

            const dataValues = []
            dataValues.push({
              first_name: req.body.first_name !== '' ? req.body.first_name : '',
              last_name: req.body.last_name !== '' ? req.body.last_name : '',
              telephone: req.body.telephone !== '' ? req.body.telephone : '',
              mobileNo: req.body.mobileNo !== '' ? req.body.mobileNo : '',
              feedback_consent: typeof req.body.feedback_consent !== 'undefined' ? req.body.feedback_consent : '',
            })
            res.render('initial/complete-details', {
              error_report: ValidationService.validateForm({
                error: error,
                erroneousFields: erroneousFields,
              }),
              form_values: req.body,
              error: false,
            })
          })
      } else {
        Model.AccountDetails.create({
          user_id: user.id,
          company_name: 'N/A',
          company_number: 0,
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          telephone: req.body.telephone,
          mobileNo: req.body.mobileNo,
          feedback_consent: req.body.feedback_consent,
          complete: true,
        })
          .then(() => {
            req.session.initial = true
            return res.redirect('/api/user/account')
          })
          .catch((error) => {
            logger.error('Error creating account details:', { error })
            // Custom error array builder for email match confirmation
            const erroneousFields = []

            if (req.body.first_name === '') {
              erroneousFields.push('first_name')
            }
            if (req.body.last_name === '') {
              erroneousFields.push('last_name')
            }
            if (req.body.mobileNo === '') {
              erroneousFields.push('mobileNo')
            }
            const dataValues = []
            dataValues.push({
              first_name: req.body.first_name !== '' ? req.body.first_name : '',
              last_name: req.body.last_name !== '' ? req.body.last_name : '',
              telephone: req.body.telephone !== '' ? req.body.telephone : '',
              mobileNo: req.body.mobileNo !== '' ? req.body.mobileNo : '',
            })
            res.render('initial/complete-details', {
              error_report: ValidationService.validateForm({
                error: error,
                erroneousFields: erroneousFields,
              }),
              form_values: req.body,
              error: false,
              error_description: false,
            })
          })
      }
    })
  })
}

export const resendActivationEmail = async (req, res) => {
  try {
    // Generate new random activation token
    const token = crypto.randomBytes(20).toString('hex')

    // Find User with the password token which has not expired
    const user = await Model.User.findOne({
      where: {
        email: req.body.email,
        activated: false,
      },
    })

    if (!user) {
      req.flash('info', `If an account matches ${req.body.email} we'll send you another confirmation email.`)
      return res.redirect('/api/user/sign-in')
    }

    // Update the user with the new token and expiry
    const expire = new Date()
    const expiryTime = 60 * 60 * 1000 * 24 // 24 hours
    expire.setTime(expire.getTime() + expiryTime) // now +24 hours

    await Model.User.update(
      {
        activationToken: token,
        activated: false,
        activationTokenExpires: expire,
      },
      {
        where: { email: req.body.email },
      },
    )

    // Send the email
    await emailService.emailConfirmation(req.body.email, token)

    req.flash('info', `If an account matches ${req.body.email} we'll send you another confirmation email.`)
    return res.redirect('/api/user/sign-in')
  } catch (error) {
    logger.error('Error resending activation email:', { error })
    req.flash('info', `If an account matches ${req.body.email} we'll send you another confirmation email.`)
    return res.redirect('/api/user/sign-in')
  }
}

export const activate = async (req, res) => {
  try {
    // Added this code to prevent HEAD requests triggering
    // the logic in Production
    if (req.method !== 'GET') {
      return res.status(200).send('OK')
    }

    // Attempt to find a user with a valid, non-expired activation token
    const user = await Model.User.findOne({
      where: {
        activationToken: req.params.token,
        activationTokenExpires: { [Op.gt]: new Date() },
      },
    })

    if (!user) {
      // If no user is found with the provided token, redirect with an error message
      req.flash('error', 'Activation token is invalid or has expired. Please request a new one.')
      return res.redirect('/api/user/sign-in')
    }

    // Update the user with the activated flag
    await Model.User.update(
      {
        activationToken: null,
        activationTokenExpires: null,
        activated: true,
      },
      {
        where: { email: user.email },
      },
    )

    req.flash('info', "You've successfully confirmed your email address. Now you can sign in to your account")
    return res.redirect('/api/user/sign-in')
  } catch (error) {
    logger.error('Error activating account:', { error, email: user?.email, userId: user?.id })
  }
}

function date_shift(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export default {
  usercheck,
  show,
  register,
  showAddressSkip,
  completeRegistration,
  resendActivationEmail,
  activate,
}
