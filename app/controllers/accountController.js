import crypto from 'node:crypto'
import util from 'node:util'
import axios from 'axios'
import moment from 'moment'
import { Op } from 'sequelize'
import common from '../../config/common.js'
import config from '../../config/environment.js'
import { logger } from '../../config/logs.js'
import Model from '../model/models.js'
import emailService from '../services/emailService.js'
import HelperService from '../services/HelperService.js'
import oneTimePasscodeService from '../services/oneTimePasscodeService.js'
import ValidationService from '../services/ValidationService.js'

const envVariables = common.config()
const mobilePattern = /^(\+|\d|\(|#| )(\+|\d|\(| |-)([0-9]|\(|\)| |-){5,14}$/
const phonePattern = /^(\+|\d|\(|#| )(\+|\d|\(| |-)([0-9]|\(|\)| |-){5,14}$/
const randomBytes = util.promisify(crypto.randomBytes)

async function sendToOrbit(accountManagementObject, user) {
  try {
    const edmsManagePortalCustomerUrl = `${config.edmsHost}/api/v1/managePortalCustomer`
    const edmsBearerToken = await HelperService.getEdmsAccessToken()

    const profiler = logger.startTimer('Orbit account management request')
    const response = await axios.post(edmsManagePortalCustomerUrl, accountManagementObject, {
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${edmsBearerToken}`,
      },
    })

    profiler.done({
      message: `Orbit account management request response time for ${user?.id}:`,
      userId: user?.id,
      ...logger.defaultMeta,
    })

    if (response.status === 200) {
      logger.info(`[ACCOUNT MANAGEMENT] ACCOUNT UPDATE SENT TO ORBIT SUCCESSFULLY FOR USER_ID ${user.id}`)
    } else {
      logger.error(`[ACCOUNT MANAGEMENT] ACCOUNT UPDATE FAILED SENDING TO ORBIT FOR USER_ID ${user.id}`, {
        responseStatus: response.status,
        responseData: response.data,
      })
    }
  } catch (error) {
    logger.error(`Error is sendToOrbit`, { error, userId: user?.id })
  }
}

export const showAccount = async (req, res) => {
  try {
    const user = await Model.User.findOne({ where: { email: req.session.email } })
    if (!user) {
      throw new Error('User not found')
    }

    const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } })
    if (!account) return res.redirect('/api/user/complete-details')

    return res.render('account_pages/account.ejs', {
      url: envVariables,
      info: req.flash('info'),
      company_info: req.flash('company_info'),
    })
  } catch (error) {
    logger.error(`Error in showAccount`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: '#',
      error,
    })
  }
}

export const showAdminSection = (req, res) => {
  try {
    return res.render('account_pages/admin.ejs', {
      user: req?.session?.user,
      account: req?.session?.account,
      url: envVariables,
      info: req.flash('info'),
      error: null,
    })
  } catch (error) {
    logger.error(`Error in showAdminSection`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: '#',
      error,
    })
  }
}

export const showAdminSearchEmail = (req, res) => {
  try {
    return res.render('account_pages/admin.ejs', {
      user: req?.session?.user,
      account: req?.session?.account,
      url: envVariables,
      info: req.flash('info'),
      error: null,
    })
  } catch (error) {
    logger.error(`Error in showAdminSearchEmail`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: '#',
      error,
    })
  }
}

export const ajaxSearchEmail = async (req, res) => {
  try {
    const emailQuery = req.query.email

    if (!emailQuery || emailQuery.length < 3) {
      return res.json([])
    }

    const users = await Model.User.findAll({
      where: {
        email: { [Op.like]: `%${emailQuery}%` },
      },
      attributes: ['id', 'email'],
      order: [['email', 'ASC']],
    })

    res.json(users)
  } catch (error) {
    logger.error(`Error in ajaxSearchEmail`, { error, userId: req?.session?.user?.id || 'unknown' })
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const adminSearchEmail = async (req, res) => {
  try {
    const user = req?.session?.user
    if (!user) {
      throw new Error('User not found')
    }
    const account = req?.session?.account
    if (!account) {
      throw new Error('Account not found')
    }

    const emailToSearchFor = req.body.searchEmail.trim()
    if (!emailToSearchFor) {
      return res.render('account_pages/admin.ejs', {
        user,
        account,
        url: envVariables,
        info: req.flash('info'),
        error: `Please enter an email address`,
      })
    }

    const searchResults = await Model.User.findOne({ where: { email: emailToSearchFor } })

    return res.render('account_pages/admin-search-email.ejs', {
      user,
      account,
      searchResults,
      url: envVariables,
      info: req.flash('info'),
    })
  } catch (error) {
    logger.error(`Error in adminSearchEmail`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: req.get('Referer'),
      error,
    })
  }
}

export const showUpdatePermissions = (req, res) => {
  try {
    return res.render('account_pages/admin.ejs', {
      user: req?.session?.user,
      account: req?.session?.account,
      url: envVariables,
      info: req.flash('info'),
      error: null,
    })
  } catch (error) {
    logger.error(`Error in showUpdatePermissions`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: '#',
      error,
    })
  }
}

export const updatePermissions = async (req, res) => {
  try {
    const accountLocked = req.body.accountLocked === 'true' || false
    const dropOffEnabled = req.body.dropOffEnabled === 'true' || false
    const premiumServiceEnabled = req.body.premiumServiceEnabled === 'true' || false

    const user = req?.session?.user
    if (!user) {
      throw new Error('User not found')
    }

    const account = req?.session?.account
    if (!account) {
      throw new Error('Account not found')
    }

    const userId = req.body.userId
    const email = req.body.email
    if (!userId) {
      throw new Error('No userId provided')
    }

    const existingUser = await Model.User.findByPk(userId)

    if (!existingUser) {
      throw new Error(`User with ID ${userId} not found.`)
    }

    const changes = []
    const updateFields = { accountLocked, dropOffEnabled, premiumServiceEnabled }

    if (existingUser.accountLocked !== accountLocked) {
      changes.push(`Account Locked: ${existingUser.accountLocked} → ${accountLocked}`)
      // If unlocking the account, reset oneTimePasscodeAttempts
      if (existingUser.accountLocked && !accountLocked) {
        updateFields.oneTimePasscodeAttempts = 0
        changes.push(`OTP Attempts reset to 0`)
      }
    }
    if (existingUser.dropOffEnabled !== dropOffEnabled) {
      changes.push(`Next-Day Service: ${existingUser.dropOffEnabled} → ${dropOffEnabled}`)
    }
    if (existingUser.premiumServiceEnabled !== premiumServiceEnabled) {
      changes.push(`Urgent Service: ${existingUser.premiumServiceEnabled} → ${premiumServiceEnabled}`)
    }

    await Model.User.update(updateFields, { where: { id: userId } })

    req.flash('info', `${email} has been updated successfully`)

    if (changes.length > 0) {
      logger.info(`[UPDATE PERMISSIONS] ${user.email} UPDATED ${email}: ${changes.join(', ')}`, {
        changes,
        updatedUserId: userId,
        updatedUserEmail: email,
        adminUserId: user.id,
      })
    }

    return res.render('account_pages/admin.ejs', {
      user,
      account,
      url: envVariables,
      info: req.flash('info'),
      error: null,
    })
  } catch (error) {
    logger.error(`Error in updatePermissions`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: req.get('Referer'),
      error,
    })
  }
}

export const showAddresses = async (req, res) => {
  try {
    const user = await Model.User.findOne({ where: { email: req.session.email } })
    if (!user) {
      throw new Error('User not found')
    }

    const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } })
    if (!account) {
      throw new Error('Account not found')
    }

    const addresses = await Model.SavedAddress.findAll({ where: { user_id: user.id }, order: [['id', 'ASC']] })

    return res.render('account_pages/addresses.ejs', {
      url: envVariables,
      addresses: addresses,
      info: req.flash('info'),
    })
  } catch (error) {
    logger.error(`Error in showAddresses`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: '/api/user/account',
      error,
    })
  }
}

export const showChangeDetails = async (req, res) => {
  try {
    const user = await Model.User.findOne({ where: { email: req.session.email } })
    if (!user) {
      throw new Error('User not found')
    }

    const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } })

    if (!account) {
      throw new Error('Account not found')
    }

    const mfaPreference = user.mfaPreference
    const disableMobileNumberEditing = mfaPreference === 'SMS'

    return res.render('account_pages/change-details.ejs', {
      error_report: false,
      form_values: account,
      url: envVariables,
      disableMobileNumberEditing: disableMobileNumberEditing,
    })
  } catch (error) {
    logger.error(`Error in showChangeDetails`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: '/api/user/account',
      error,
    })
  }
}

export const changeDetails = async (req, res) => {
  try {
    const user = await Model.User.findOne({ where: { email: req.session.email } })
    if (!user) {
      throw new Error('User not found')
    }

    const data = await Model.AccountDetails.findOne({ where: { user_id: user.id } })

    const accountDetails = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      mobileNo: mobilePattern.test(req.body.mobileNo) ? req.body.mobileNo : '',
      telephone: req.body.telephone !== '' ? (phonePattern.test(req.body.telephone) ? req.body.telephone : '') : null,
      feedback_consent: req.body.feedback_consent || '',
    }

    if (data) {
      const companyName = user.premiumServiceEnabled ? data.company_name : ''

      if (user.mfaPreference === 'SMS') {
        accountDetails.mobileNo = data.mobileNo
      }

      await Model.AccountDetails.update(accountDetails, { where: { user_id: user.id } })

      const accountManagementObject = {
        portalCustomerUpdate: {
          userId: 'legalisation',
          timestamp: Date.now().toString(),
          portalCustomer: {
            portalCustomerId: user.id,
            forenames: accountDetails.first_name,
            surname: accountDetails.last_name,
            primaryTelephone: accountDetails.telephone,
            mobileTelephone: accountDetails.mobileNo,
            eveningTelephone: '',
            email: req.session.email,
            companyName: companyName,
            companyRegistrationNumber: '',
          },
        },
      }

      sendToOrbit(accountManagementObject, user)
      req.session.account = null
      return res.redirect('/api/user/account')
    } else {
      await Model.AccountDetails.create(accountDetails)
      return res.redirect('/api/user/account')
    }
  } catch (error) {
    const user = await Model.User.findOne({ where: { email: req.session.email } })
    if (!user) {
      throw new Error('User not found')
    }

    const data = await Model.AccountDetails.findOne({ where: { user_id: user.id } })

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
    if (req.body.telephone !== '' && typeof req.body.telephone !== 'undefined') {
      if (
        req.body.telephone === '' ||
        req.body.telephone.length < 6 ||
        req.body.telephone.length > 25 ||
        !phonePattern.test(req.body.telephone)
      ) {
        erroneousFields.push('telephone')
      }
    }
    if (req.body.mobileNo !== '' && typeof req.body.mobileNo !== 'undefined') {
      if (
        req.body.mobileNo === '' ||
        req.body.mobileNo.length < 6 ||
        req.body.mobileNo.length > 25 ||
        !mobilePattern.test(req.body.mobileNo)
      ) {
        erroneousFields.push('mobileNo')
      }
    } else req.body.mobileNo = data.mobileNo

    const disableMobileNumberEditing = user.mfaPreference === 'SMS'

    return res.render('account_pages/change-details.ejs', {
      error_report: ValidationService.validateForm({ error: error, erroneousFields: erroneousFields }),
      form_values: req.body,
      url: envVariables,
      disableMobileNumberEditing: disableMobileNumberEditing,
    })
  }
}

export const showChangePassword = (_req, res) =>
  res.render('account_pages/change-password.ejs', { error: false, url: envVariables })

export const changePassword = async (req, res) => {
  try {
    const buf = await randomBytes(20)
    const token = buf.toString('hex')
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
          email: req.session.email,
        },
      },
    )

    await emailService.resetPassword(req.session.email, token)
    req.flash('info', "We've sent you an email with instructions on how to reset your password.")
    return res.redirect('/api/user/account')
  } catch (error) {
    logger.error(`Error in changePassword`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: '/api/user/account',
      error,
    })
  }
}

export const showChangeMfa = async (req, res) => {
  try {
    const user = await Model.User.findOne({ where: { email: req.session.email } })
    if (!user) throw new Error('User not found')

    const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } })
    if (!account) throw new Error('Account details not found')

    return res.render('account_pages/change-mfa.ejs', {
      error: false,
      errorsArray: null,
      url: envVariables,
      mfaPreference: user.mfaPreference,
      mobileNo: account.mobileNo,
    })
  } catch (error) {
    logger.error(`Error in showChangeMfa`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: '/api/user/account',
      error,
    })
  }
}

export const changeMfa = async (req, res) => {
  try {
    const user = await Model.User.findOne({ where: { email: req.session.email } })
    if (!user) throw new Error('User not found')

    const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } })
    if (!account) throw new Error('Account details not found')

    const mfaPreference = req.body.mfaPreference
    const mobileNoFromForm = req.body.mobileNo
    const mobileNoFromDB = account.mobileNo
    const mobileNoDiffers = mobileNoFromForm !== mobileNoFromDB

    const errorsArray = []

    // Don't need to change anything if the user is trying to
    // select the MFA method they are already using
    if (
      (mfaPreference === 'Email' && user.mfaPreference === 'Email') ||
      (mfaPreference === 'SMS' && user.mfaPreference === 'SMS' && !mobileNoDiffers)
    ) {
      return res.redirect('/api/user/account')
    }

    req.session.account = null

    if (mfaPreference === 'Email') {
      await Model.User.update({ mfaPreference: mfaPreference }, { where: { email: req.session.email } })
      req.flash('info', 'Your MFA preference has been updated to Email.')
      req.session.user = null
      return res.redirect('/api/user/account')
    } else {
      const validMobile = mobilePattern.test(mobileNoFromForm) ? mobileNoFromForm : false

      if (validMobile !== false) {
        // One-time passcodes expire 10 mins after being issued
        const oneTimePasscodeExists = await oneTimePasscodeService.checkIfOneTimePasscodeExists(user.id)

        if (oneTimePasscodeExists) {
          // If the one-time passcode for the user is old, we need to delete it and generate a new one
          if (moment(Date.parse(oneTimePasscodeExists.passcode_expiry)).isBefore(Date.now())) {
            await oneTimePasscodeService.deleteOneTimePasscode(user.id)
            const one_time_passcode = await oneTimePasscodeService.generateOneTimePasscode()
            await oneTimePasscodeService.storeNewOneTimePasscode(user.id, one_time_passcode)
            await emailService.sendOneTimePasscodeSMS(one_time_passcode, validMobile, user.id)
          }
        } else {
          const one_time_passcode = await oneTimePasscodeService.generateOneTimePasscode()
          await oneTimePasscodeService.storeNewOneTimePasscode(req.user.id, one_time_passcode)
          await emailService.sendOneTimePasscodeSMS(one_time_passcode, validMobile, req.user.id)
        }

        return res.render('account_pages/validate-sms-totp', {
          error: false,
          errorsArray: null,
          back_link: '/api/user/change-mfa',
          info: req.flash('info'),
          mobileNo: validMobile,
        })
      } else {
        errorsArray.push({
          fieldName: 'mobileNo',
          fieldError: 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 808 157 0192',
        })
        return res.render('account_pages/change-mfa.ejs', {
          error: true,
          errorsArray: errorsArray,
          url: envVariables,
          mfaPreference: user.mfaPreference,
          mobileNo: account.mobileNo,
        })
      }
    }
  } catch (error) {
    logger.error(`Error in changeMfa`, { error, userId: req?.session?.user?.id || 'unknown' })
    return res.render('generic-error.ejs', {
      backLink: '/api/user/change-mfa',
      error,
    })
  }
}

export const showValidateSMS = async (req, res) => {
  const user_id = req.session.passport.user
  const mobileNoFromForm = req.body.mobileNo
  const accountData = await oneTimePasscodeService.getAccountData(user_id)

  if (req.query.resendPasscode === 'true') {
    const one_time_passcode = await oneTimePasscodeService.generateOneTimePasscode()
    await oneTimePasscodeService.deleteOneTimePasscode(user_id)
    await oneTimePasscodeService.storeNewOneTimePasscode(user_id, one_time_passcode)
    await emailService.sendOneTimePasscodeSMS(one_time_passcode, accountData.mobileNo, user_id)
    req.flash('info', 'We have sent you another passcode via SMS.')
    res.render('account_pages/validate-sms-totp', {
      error: false,
      errorsArray: null,
      back_link: '/api/user/change-mfa',
      info: req.flash('info'),
      mobileNo: mobileNoFromForm,
    })
  } else {
    res.render('account_pages/validate-sms-totp', {
      error: false,
      errorsArray: null,
      back_link: '/api/user/change-mfa',
      info: req.flash('info'),
      mobileNo: mobileNoFromForm,
    })
  }
}

export const validateSMS = async (req, res) => {
  const passcode = req.body.passcode
  const mobileNoFromForm = req.body.mobileNo
  const user_id = req.session.passport.user
  const errorsArray = []

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

  const noErrorsPresent = validateFormInput(passcode)

  if (noErrorsPresent) {
    const verificationIsSuccessful = await oneTimePasscodeService.verifyUser(user_id, passcode)

    if (verificationIsSuccessful) {
      await oneTimePasscodeService.deleteOneTimePasscode(user_id)
      await oneTimePasscodeService.updateMfaPreferenceToSMS(user_id)
      await oneTimePasscodeService.updateAccountMobileNumber(user_id, mobileNoFromForm)

      req.flash('info', 'Your MFA preference has been updated to SMS.')
      req.session.account = null
      req.session.user = null
      res.redirect('/api/user/account')
    } else {
      errorsArray.push({
        fieldName: 'passcode',
        fieldError: 'The passcode you entered was incorrect',
      })

      return res.render('account_pages/validate-sms-totp', {
        error: true,
        errorsArray: errorsArray,
        back_link: '/api/user/change-mfa',
        info: req.flash('info'),
        mobileNo: mobileNoFromForm,
      })
    }
  } else {
    return res.render('account_pages/validate-sms-totp', {
      error: true,
      errorsArray: errorsArray,
      info: req.flash('info'),
      back_link: '/api/user/change-mfa',
      mobileNo: mobileNoFromForm,
    })
  }
}

export const showChangeCompanyDetails = async (req, res) => {
  try {
    const user = await Model.User.findOne({ where: { email: req.session.email } })
    if (!user) throw new Error('User not found')

    const account = await Model.AccountDetails.findOne({ where: { user_id: user.id } })
    if (!account) throw new Error('Account not found')

    return res.render('account_pages/change-company-details.ejs', {
      error_report: false,
      form_values: account,
      url: envVariables,
    })
  } catch (error) {
    logger.error(`Error in showChangeCompanyDetails`, {
      error,
      userId: req?.session?.user?.id || 'unknown',
    })
    return res.render('generic-error.ejs', {
      backLink: '/api/user/account',
      error,
    })
  }
}

export const changeCompanyDetails = async (req, res) => {
  const accountDetails = {
    company_name: req.body.company_name,
  }

  try {
    const user = await Model.User.findOne({ where: { email: req.session.email } })
    if (!user) throw new Error('User not found')

    const data = await Model.AccountDetails.findOne({ where: { user_id: user.id } })

    req.session.account = null

    if (data) {
      await Model.AccountDetails.update(accountDetails, { where: { user_id: user.id } })

      const accountManagementObject = {
        portalCustomerUpdate: {
          userId: 'legalisation',
          timestamp: Date.now().toString(),
          portalCustomer: {
            portalCustomerId: user.id,
            forenames: data.first_name,
            surname: data.last_name,
            primaryTelephone: data.telephone,
            mobileTelephone: data.mobileNo,
            eveningTelephone: '',
            email: req.session.email,
            companyName: req.body.company_name,
            companyRegistrationNumber: data.company_number,
          },
        },
      }

      sendToOrbit(accountManagementObject, user)
      return res.redirect('/api/user/account')
    } else {
      await Model.AccountDetails.create(accountDetails)
      return res.redirect('/api/user/account')
    }
  } catch (error) {
    logger.error(`Error in changeCompanyDetails`, { error, userId: req?.session?.user?.id || 'unknown' })
    const erroneousFields = []
    if (req.body.company_name === '') {
      erroneousFields.push('company_name')
    }

    return res.render('account_pages/change-company-details.ejs', {
      error_report: ValidationService.validateForm({ error: error, erroneousFields: erroneousFields }),
      form_values: req.body,
      url: envVariables,
    })
  }
}

export const changeEmail = async (_req, res) => res.render('account_pages/change-email.ejs')

export default {
  showAccount,
  showAdminSection,
  showAdminSearchEmail,
  ajaxSearchEmail,
  adminSearchEmail,
  showUpdatePermissions,
  updatePermissions,
  showAddresses,
  showChangeDetails,
  changeDetails,
  showChangePassword,
  changePassword,
  showChangeMfa,
  changeMfa,
  showValidateSMS,
  validateSMS,
  showChangeCompanyDetails,
  changeCompanyDetails,
  changeEmail,
}
