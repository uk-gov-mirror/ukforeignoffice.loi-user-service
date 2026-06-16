import axios from 'axios'
import { config } from '../../config/common.js'
import { logger } from '../../config/logs.js'

const envVariables = config()

export const emailService = {
  sendOneTimePasscodeEmail: async (oneTimePasscode, email, userId) => {
    const url = '/one_time_passcode_email'
    const postData = { to: email, oneTimePasscode: oneTimePasscode }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - One time passcode email sent for user ${userId}`)
    } catch (error) {
      logger.error('Error in emailService.sendOneTimePasscodeEmail', { error })
    }
  },
  sendOneTimePasscodeSMS: async (oneTimePasscode, phoneNumber, userId) => {
    const url = '/one_time_passcode_sms'
    const postData = { to: phoneNumber, oneTimePasscode: oneTimePasscode }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - One time passcode SMS sent for user ${userId}`)
    } catch (error) {
      logger.error('Error in emailService.sendOneTimePasscodeSMS', { error })
    }
  },
  lockedOut: async (name, email) => {
    const url = '/account_locked'
    const postData = { to: email, name: name }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - lockedOut email sent`)
    } catch (error) {
      logger.error('Error in emailService.lockedOut', { error })
    }
  },
  resetPassword: async (email, token) => {
    const url = '/reset-password'
    const postData = { to: email, token: token }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - reset password email sent`)
    } catch (error) {
      logger.error('Error in emailService.resetPassword', { error })
    }
  },
  confirmPasswordChange: async (name, email) => {
    const url = '/password-updated'
    const postData = { to: email, name: name }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - confirm password email sent`)
    } catch (error) {
      logger.error('Error in emailService.confirmPasswordChange', { error })
    }
  },
  emailConfirmation: async (email, token) => {
    const url = '/confirm-email'
    const postData = { to: email, token: token }
    const options = setOptions(postData, url)

    try {
      const response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`${response.status} - activation email sent`)
    } catch (error) {
      logger.error('Error in emailService.emailConfirmation', { error })
    }
  },
  expiryWarning: async (email, accountExpiryDateText, dayAndMonthText, userID) => {
    const url = '/expiry_warning'
    const postData = { to: email, accountExpiryDateText: accountExpiryDateText, dayAndMonthText: dayAndMonthText }
    const options = setOptions(postData, url)

    try {
      const _response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`[USER CLEANUP JOB] WARNING EMAIL SENT SUCCESSFULLY FOR USER ${userID}`)
    } catch (error) {
      logger.error('Error in emailService.expiryWarning', { error })
    }
  },
  expiryConfirmation: async (email, userID) => {
    const url = '/expiry_confirmation'
    const postData = { to: email }
    const options = setOptions(postData, url)

    try {
      const _response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`[USER CLEANUP JOB] EXPIRY EMAIL SENT SUCCESSFULLY FOR USER ${userID}`)
    } catch (error) {
      logger.error('Error in emailService.expiryConfirmation', { error })
    }
  },
  requestBusinessAccess: async (emailData) => {
    const url = '/request-business-access'
    const options = setOptions(emailData, url)

    try {
      const _response = await axios.post(options.url, options.body, { headers: options.headers })
      logger.info(`BUSINESS SERVICE APPLICATION REQUEST SENT SUCCESSFULLY FOR USER ${emailData.userID}`)
    } catch (error) {
      logger.error('Error in emailService.requestBusinessAccess', { error })
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
    } catch (error) {
      logger.error('Error in emailService.businessServiceDecision', { error })
    }
  },
}

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

export default emailService
