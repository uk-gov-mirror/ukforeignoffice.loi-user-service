import moment from 'moment'
import { Op } from 'sequelize'
import { logger } from '../../config/logs.js'
import Model from '../model/models.js'

export const OneTimePasscodeService = {
  generateOneTimePasscode: () => {
    // generate a 6 digit passcode
    return Math.floor(100000 + Math.random() * 900000)
  },

  checkIfOneTimePasscodeExists: async (user_id) => {
    try {
      return await Model.OneTimePasscodes.findOne({
        where: {
          user_id: user_id,
        },
      })
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.checkIfOneTimePasscodeExists', { error })
    }
  },

  deleteOneTimePasscode: async (user_id) => {
    try {
      return await Model.OneTimePasscodes.destroy({
        where: {
          user_id: user_id,
        },
      })
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.deleteOneTimePasscode', { error })
    }
  },

  storeNewOneTimePasscode: async (user_id, one_time_passcode) => {
    try {
      return await Model.OneTimePasscodes.create({
        user_id: user_id,
        passcode: one_time_passcode,
        passcode_expiry: moment(Date.now()).add(10, 'minutes'),
      })
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.storeNewOneTimePasscode', { error })
    }
  },

  verifyUser: async (user_id, passcode) => {
    try {
      return await Model.OneTimePasscodes.findOne({
        where: {
          user_id: user_id,
          passcode: passcode,
          passcode_expiry: {
            [Op.gte]: moment().toDate(),
          },
        },
      })
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.verifyUser', { error })
    }
  },

  updateAccountPasscodeExpiryTime: async (user_id) => {
    try {
      return await Model.User.update(
        {
          oneTimePasscodeExpiry: moment().add(1, 'day').toDate(),
          oneTimePasscodeAttempts: 0,
        },
        {
          where: {
            id: user_id,
          },
        },
      )
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.updateAccountPasscodeExpiryTime', { error })
    }
  },

  updateMfaPreferenceToSMS: async (user_id) => {
    try {
      return await Model.User.update(
        {
          mfaPreference: 'SMS',
        },
        {
          where: {
            id: user_id,
          },
        },
      )
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.updateMfaPreferenceToSMS', { error })
    }
  },

  checkMobileNumber: async (user_id) => {
    try {
      return await Model.AccountDetails.findOne({
        where: {
          user_id: user_id,
        },
        attributes: ['mobileNo'],
      })
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.checkMobileNumber', { error })
    }
  },

  updateAccountMobileNumber: async (user_id, phone_number) => {
    try {
      return await Model.AccountDetails.update(
        {
          mobileNo: phone_number,
        },
        {
          where: {
            user_id: user_id,
          },
        },
      )
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.updateAccountMobileNumber', { error })
    }
  },

  updateAccountPasscodeAttempts: async (attempts, user_id) => {
    try {
      return await Model.User.update(
        {
          oneTimePasscodeAttempts: attempts,
        },
        {
          where: {
            id: user_id,
          },
        },
      )
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.updateAccountPasscodeAttempts', { error })
    }
  },

  getUserData: async (user_id) => {
    try {
      return await Model.User.findOne({
        where: {
          id: user_id,
        },
      })
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.getUserData', { error })
    }
  },

  getAccountData: async (user_id) => {
    try {
      return await Model.AccountDetails.findOne({
        where: {
          user_id: user_id,
        },
      })
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.getAccountData', { error })
    }
  },

  lockUserAccount: async (user_id) => {
    try {
      return await Model.User.update(
        {
          accountLocked: true,
        },
        {
          where: {
            id: user_id,
          },
        },
      )
    } catch (error) {
      logger.error('Error in OneTimePasscodeService.lockUserAccount', { error })
    }
  },
}

export default OneTimePasscodeService
