const axios = require('axios')
const common = require('../../config/common.js')
const envVariables = common.config()
const { logger } = require('../../config/logs')

const emailService = {
  sendOneTimePasscodeEmail: async (oneTimePasscode, email, userId) => {
    const url = '/one_time_passcode_email'
    const postData = { to: email, oneTimePasscode: oneTimePasscode }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - One time passcode email sent for user ${userId}`)
    } catch (err) {
      logger.error(err)
    }
  },
  sendOneTimePasscodeSMS: async (oneTimePasscode, phoneNumber, userId) => {
    const url = '/one_time_passcode_sms'
    const postData = { to: phoneNumber, oneTimePasscode: oneTimePasscode }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - One time passcode SMS sent for user ${userId}`)
    } catch (err) {
      logger.error(err)
    }
  },
  lockedOut: async (name, email) => {
    const url = '/account_locked'
    const postData = { to: email, name: name }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - lockedOut email sent`)
    } catch (err) {
      logger.error(err)
    }
  },
  resetPassword: async (email, token) => {
    const url = '/reset-password'
    const postData = { to: email, token: token }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - reset password email sent`)
    } catch (err) {
      logger.error(err)
    }
  },
  confirmPasswordChange: async (name, email) => {
    const url = '/password-updated'
    const postData = { to: email, name: name }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - confirm password email sent`)
    } catch (err) {
      logger.error(err)
    }
  },
  emailConfirmation: async (email, token) => {
    const url = '/confirm-email'
    const postData = { to: email, token: token }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - activation email sent`)
    } catch (err) {
      logger.error(err)
    }
  },
  expiryWarning: async (email, accountExpiryDateText, dayAndMonthText, userID) => {
    const url = '/expiry_warning'
    const postData = { to: email, accountExpiryDateText: accountExpiryDateText, dayAndMonthText: dayAndMonthText }
    const options = setOptions(postData, url)

    try {
      const _response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`[USER CLEANUP JOB] WARNING EMAIL SENT SUCCESSFULLY FOR USER ${userID}`)
    } catch (err) {
      logger.error(err)
    }
  },
  expiryConfirmation: async (email, userID) => {
    const url = '/expiry_confirmation'
    const postData = { to: email }
    const options = setOptions(postData, url)

    try {
      const _response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`[USER CLEANUP JOB] EXPIRY EMAIL SENT SUCCESSFULLY FOR USER ${userID}`)
    } catch (err) {
      logger.error(err)
    }
  },
  requestBusinessAccess: async (emailData) => {
    const url = '/request-business-access'
    const options = setOptions(emailData, url)

    try {
      const _response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`BUSINESS SERVICE APPLICATION REQUEST SENT SUCCESSFULLY FOR USER ${emailData.userID}`)
    } catch (err) {
      logger.error(err)
    }
  },
  businessServiceDecision: async (emailData, decision) => {
    const url = '/business-service-decision'
    const postData = { to: emailData.email, decision: decision }
    const options = setOptions(postData, url)

    try {
      const _response = await axios.post(options.url, options.body, { headers: options.headers })
      if (decision === 'approve') {
        logger.info(`BUSINESS SERVICE ACCESS APPROVAL EMAIL SENT SUCCESSFULLY FOR USER ${emailData.id}`)
      } else {
        logger.info(`BUSINESS SERVICE ACCESS REJECTION EMAIL SENT SUCCESSFULLY FOR USER ${emailData.id}`)
      }
    } catch (err) {
      logger.error(err)
    }
  },
}

module.exports = emailService

function setOptions(postData, url) {
  return {
    url: envVariables.notificationServiceURL + url,
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
    },
    method: 'POST',
    body: postData,
  }
}
