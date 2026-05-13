import crypto from 'node:crypto'
import axios from 'axios'
import common from '../../config/common.js'
import config from '../../config/environment.js'
import { logger } from '../../config/logs.js'
import Model from '../model/models.js'
import emailService from '../services/emailService.js'
import HelperService from '../services/HelperService.js'

const envVariables = common.config()

export const showRequestBusinessServiceAccess = async (req, res) => {
  try {
    if (req.session.email) {
      const userAccount = await findUserAccount()
      const userAccountDetails = await findUserAccountDetails(userAccount)

      if (userAccount.businessUpgradeToken) return res.redirect('/api/user/account')

      renderPage(userAccount, userAccountDetails)

      async function findUserAccount() {
        try {
          return await Model.User.findOne({ where: { email: req.session.email } })
        } catch (error) {
          logger.error('showRequestBusinessServiceAccess.findUserAccount', error)
        }
      }

      async function findUserAccountDetails(user) {
        try {
          return await Model.AccountDetails.findOne({ where: { user_id: user.id } })
        } catch (error) {
          logger.error('showRequestBusinessServiceAccess.findUserAccountDetails', error)
        }
      }

      function renderPage(user, account) {
        try {
          let back_link = '/api/user/account'
          if (req.query.from) {
            if (req.query.from === 'start') {
              back_link = `${envVariables.applicationServiceURL}select-service`
            }
          }

          return res.render('account_pages/request-business-service-access.ejs', {
            user: user,
            account: account,
            url: envVariables,
            error: false,
            errorsArray: [],
            back_link: back_link,
            form_values: false,
          })
        } catch (error) {
          logger.error('showRequestBusinessServiceAccess.renderPage', error)
        }
      }
    }
  } catch (error) {
    logger.error('requestBusinessServiceAccessController.showRequestBusinessServiceAccess', error)
  }
}

export const requestBusinessServiceAccess = async (req, res) => {
  try {
    if (req.session.email) {
      const emailData = {
        userEmail: req.session.email,
        companyName: req.body['company-name'],
        companiesHouseNumber: req.body['companies-house-number'],
        businessArea: req.body['business-area'],
        justification: req.body.justification,
        token: '',
        userID: '',
      }

      const userAccount = await findUserAccount()
      const userAccountDetails = await findUserAccountDetails(userAccount)
      const noErrorsPresent = await validateFormInput(emailData, userAccount, userAccountDetails)

      if (noErrorsPresent) {
        let token = await generateUserToken()
        token = token.toString('hex')
        emailData.token = token
        await assignTokenToUser(userAccount, token)
        await updateCompanyName(userAccount)
        emailData.userID = userAccount.id
        await emailService.requestBusinessAccess(emailData)
        redirectToSelectServicePage()
      }

      async function findUserAccount() {
        try {
          return await Model.User.findOne({ where: { email: req.session.email } })
        } catch (error) {
          logger.error('requestBusinessServiceAccess.findUserAccount', error)
        }
      }

      async function findUserAccountDetails(user) {
        try {
          return await Model.AccountDetails.findOne({ where: { user_id: user.id } })
        } catch (error) {
          logger.error('showRequestBusinessServiceAccess.findUserAccountDetails', error)
        }
      }

      async function assignTokenToUser(user, token) {
        try {
          // track the number of times user requests access
          let attempts = user.noOfBusinessRequestAttempts
          attempts = attempts + 1

          return await Model.User.update(
            {
              businessUpgradeToken: token,
              noOfBusinessRequestAttempts: attempts,
            },
            {
              where: {
                email: user.email,
              },
            },
          )
        } catch (error) {
          logger.error('requestBusinessServiceAccess.assignTokenToUser', error)
        }
      }

      async function updateCompanyName(user) {
        try {
          return await Model.AccountDetails.update(
            {
              company_name: req.body['company-name'],
            },
            {
              where: {
                user_id: user.id,
              },
            },
          )
        } catch (error) {
          logger.error('requestBusinessServiceAccess.updateCompanyName', error)
        }
      }

      async function generateUserToken() {
        try {
          return await crypto.randomBytes(20)
        } catch (error) {
          logger.error('requestBusinessServiceAccess.generateUserToken', error)
        }
      }

      function validateFormInput(emailData, user, account) {
        try {
          const errorsArray = []

          if (emailData.companyName === '') {
            errorsArray.push({
              fieldName: 'company-name',
              fieldError: 'Company name cannot be empty',
            })
          }

          if (emailData.companiesHouseNumber.length > 0 && emailData.companiesHouseNumber.length !== 8) {
            errorsArray.push({
              fieldName: 'companies-house-number',
              fieldError: 'Please enter a valid Companies House number',
            })
          }

          if (emailData.businessArea === '' || emailData.businessArea === 'Please select') {
            errorsArray.push({
              fieldName: 'business-area',
              fieldError: 'Please select a business area',
            })
          }

          if (emailData.justification === '') {
            errorsArray.push({
              fieldName: 'justification',
              fieldError: 'Justification cannot be empty',
            })
          }

          // If the user has already applied 3 times then throw a validation error
          if (user.noOfBusinessRequestAttempts >= 3) {
            errorsArray.push({
              fieldName: '#',
              fieldError: 'You have exceeded the number of times you can apply for a business account',
            })
          }

          // If the user has a pending request inflight then what are they even doing?
          if (user.businessUpgradeToken) {
            errorsArray.push({
              fieldName: '#',
              fieldError: 'You have already requested access to a business account',
            })
          }

          if (errorsArray.length !== 0) {
            renderPage(user, account, errorsArray)
          } else return true
        } catch (error) {
          logger.error('requestBusinessServiceAccess.validateFormInput', error)
        }
      }

      function renderPage(user, account, errorsArray) {
        try {
          return res.render('account_pages/request-business-service-access.ejs', {
            user: user,
            account: account,
            url: envVariables,
            error: true,
            errorsArray: errorsArray,
            back_link: `${envVariables.applicationServiceURL}select-service`,
            form_values: req.body,
          })
        } catch (error) {
          logger.error('requestBusinessServiceAccess.renderPage', error)
        }
      }

      function redirectToSelectServicePage() {
        try {
          req.flash(
            'info',
            'Your request to gain access to the Next-Day service has been submitted successfully. You will be notified via email when a decision has been made.',
          )
          return res.redirect(`${envVariables.applicationServiceURL}select-service`)
        } catch (error) {
          logger.error('requestBusinessServiceAccess.redirectToSelectServicePage', error)
        }
      }
    }
  } catch (error) {
    logger.error('requestBusinessAccessController.requestBusinessServiceAccess', error)
  }
}

export const approve = async (req, res) => {
  try {
    // Added this code to prevent HEAD requests triggering
    // the logic in Production
    if (req.method !== 'GET') {
      return res.status(200).send('OK')
    }

    const token = req.params.token
    const userAccountMatchingToken = await findAccountMatchingToken(token)

    if (!userAccountMatchingToken) {
      return res.render('account_pages/approve-reject-business-service-access.ejs', {
        requestType: 'approve',
        success: false,
      })
    } else {
      const userAccountDetails = await findAccountDetails(userAccountMatchingToken.id)
      await grantPermissionsToUserAccount(userAccountMatchingToken)
      await emailService.businessServiceDecision(userAccountMatchingToken, 'approve')
      await sendAccountUpdateToOrbit(userAccountMatchingToken, userAccountDetails)

      return res.render('account_pages/approve-reject-business-service-access.ejs', {
        userEmail: userAccountMatchingToken.email,
        requestType: 'approve',
        success: true,
      })
    }

    async function findAccountMatchingToken(token) {
      try {
        return await Model.User.findOne({
          where: {
            businessUpgradeToken: token,
          },
        })
      } catch (error) {
        logger.error('approve.findAccountMatchingToken', error)
      }
    }

    async function findAccountDetails(id) {
      try {
        return await Model.AccountDetails.findOne({
          where: {
            user_id: id,
          },
        })
      } catch (error) {
        logger.error('approve.findAccountDetails', error)
      }
    }

    async function grantPermissionsToUserAccount(userAccountMatchingToken) {
      try {
        return await Model.User.update(
          {
            dropOffEnabled: true,
            businessUpgradeToken: null,
          },
          {
            where: {
              email: userAccountMatchingToken.email,
            },
          },
        )
      } catch (error) {
        logger.error('approve.grantPermissionsToUserAccount', error)
      }
    }

    async function sendAccountUpdateToOrbit(userAccountMatchingToken, userAccountDetails) {
      const startTime = new Date()
      try {
        const edmsManagePortalCustomerUrl = `${config.edmsHost}/api/v1/managePortalCustomer`
        const edmsBearerToken = await HelperService.getEdmsAccessToken()

        const accountManagementObject = {
          portalCustomerUpdate: {
            userId: 'legalisation',
            timestamp: Date.now().toString(),
            portalCustomer: {
              portalCustomerId: userAccountMatchingToken.id,
              forenames: userAccountDetails.first_name,
              surname: userAccountDetails.last_name,
              primaryTelephone: userAccountDetails.telephone,
              mobileTelephone: userAccountDetails.mobileNo !== null ? userAccountDetails.mobileNo : '',
              eveningTelephone: '',
              email: userAccountMatchingToken.email,
              companyName: userAccountDetails.company_name,
              companyRegistrationNumber: '',
            },
          },
        }

        try {
          const response = await axios.post(edmsManagePortalCustomerUrl, accountManagementObject, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${edmsBearerToken}`,
            },
          })

          const endTime = new Date()
          const elapsedTime = endTime - startTime

          if (response.status === 200) {
            logger.info(
              '[ACCOUNT MANAGEMENT] ACCOUNT UPDATE SENT TO ORBIT SUCCESSFULLY FOR USER_ID ' +
                userAccountMatchingToken.id,
            )
          } else {
            logger.error(
              `[ACCOUNT MANAGEMENT] ACCOUNT UPDATE FAILED SENDING TO ORBIT FOR USER_ID ${userAccountMatchingToken.id}`,
            )
            logger.error(`response code: ${response.status}`)
            logger.error(response.data)
          }

          logger.info(`Orbit account management request response time: ${elapsedTime}ms`)
        } catch (error) {
          const endTime = new Date()
          const elapsedTime = endTime - startTime
          logger.error(
            `[ACCOUNT MANAGEMENT] ACCOUNT UPDATE FAILED SENDING TO ORBIT FOR USER_ID ${userAccountMatchingToken.id}`,
          )
          logger.error(error.response ? error.response.data : error.message)
          logger.info(`Orbit account management request response time: ${elapsedTime}ms`)
        }
      } catch (error) {
        logger.error('approve.sendAccountUpdateToOrbit', error)
      }
    }
  } catch (error) {
    logger.error('requestBusinessAccessController.approve', error)
  }
}

export const reject = async (req, res) => {
  try {
    // Added this code to prevent HEAD requests triggering
    // the logic in Production
    if (req.method !== 'GET') {
      return res.status(200).send('OK')
    }

    async function findAccountMatchingToken(token) {
      try {
        return await Model.User.findOne({
          where: {
            businessUpgradeToken: token,
          },
        })
      } catch (error) {
        logger.error('reject.findAccountMatchingToken', error)
      }
    }

    async function rejectPermissionsToUserAccount(userAccountMatchingToken) {
      try {
        return await Model.User.update(
          {
            dropOffEnabled: false,
            businessUpgradeToken: null,
          },
          {
            where: {
              email: userAccountMatchingToken.email,
            },
          },
        )
      } catch (error) {
        logger.error('reject.rejectPermissionsToUserAccount', error)
      }
    }

    async function clearCompanyName(userAccountMatchingToken) {
      try {
        return await Model.AccountDetails.update(
          {
            company_name: 'N/A',
          },
          {
            where: {
              user_id: userAccountMatchingToken.id,
            },
          },
        )
      } catch (error) {
        logger.error('reject.clearCompanyName', error)
      }
    }

    async function sendAccountUpdateToOrbit(userAccountMatchingToken, userAccountDetails) {
      const startTime = new Date()
      try {
        const edmsManagePortalCustomerUrl = `${config.edmsHost}/api/v1/managePortalCustomer`
        const edmsBearerToken = await HelperService.getEdmsAccessToken()

        const accountManagementObject = {
          portalCustomerUpdate: {
            userId: 'legalisation',
            timestamp: Date.now().toString(),
            portalCustomer: {
              portalCustomerId: userAccountMatchingToken.id,
              forenames: userAccountDetails.first_name,
              surname: userAccountDetails.last_name,
              primaryTelephone: userAccountDetails.telephone,
              mobileTelephone: userAccountDetails.mobileNo !== null ? userAccountDetails.mobileNo : '',
              eveningTelephone: '',
              email: userAccountMatchingToken.email,
              companyName: userAccountDetails.company_name,
              companyRegistrationNumber: '',
            },
          },
        }

        const response = await axios.post(edmsManagePortalCustomerUrl, accountManagementObject, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${edmsBearerToken}`,
          },
        })

        const endTime = new Date()
        const elapsedTime = endTime - startTime

        if (response.status === 200) {
          logger.info(
            `[ACCOUNT MANAGEMENT] ACCOUNT UPDATE SENT TO ORBIT SUCCESSFULLY FOR USER_ID ${userAccountMatchingToken.id}`,
          )
        } else {
          logger.error(
            `[ACCOUNT MANAGEMENT] ACCOUNT UPDATE FAILED SENDING TO ORBIT FOR USER_ID ${userAccountMatchingToken.id}`,
          )
          logger.error(`response code: ${response.status}`)
          logger.error(response.data)
        }

        logger.info(`Orbit account management request response time: ${elapsedTime}ms`)
      } catch (error) {
        const endTime = new Date()
        const elapsedTime = endTime - startTime
        logger.error(
          `[ACCOUNT MANAGEMENT] ACCOUNT UPDATE FAILED SENDING TO ORBIT FOR USER_ID ${userAccountMatchingToken.id}`,
        )
        logger.error(error.response ? error.response.data : error.message)
        logger.info(`Orbit account management request response time: ${elapsedTime}ms`)
        logger.error('reject.sendAccountUpdateToOrbit', error)
      }
    }

    async function findAccountDetails(id) {
      try {
        return await Model.AccountDetails.findOne({
          where: {
            user_id: id,
          },
        })
      } catch (error) {
        logger.error('reject.findAccountDetails', error)
      }
    }

    const token = req.params.token
    const userAccountMatchingToken = await findAccountMatchingToken(token)

    if (!userAccountMatchingToken) {
      return res.render('account_pages/approve-reject-business-service-access.ejs', {
        requestType: 'reject',
        success: false,
      })
    } else {
      const userAccountDetails = await findAccountDetails(userAccountMatchingToken.id)
      await rejectPermissionsToUserAccount(userAccountMatchingToken)
      await clearCompanyName(userAccountMatchingToken)
      await emailService.businessServiceDecision(userAccountMatchingToken, 'reject')
      await sendAccountUpdateToOrbit(userAccountMatchingToken, userAccountDetails)

      return res.render('account_pages/approve-reject-business-service-access.ejs', {
        userEmail: userAccountMatchingToken.email,
        requestType: 'reject',
        success: true,
      })
    }
  } catch (error) {
    logger.error('requestBusinessAccessController.reject', error)
  }
}

export default { approve, reject, showRequestBusinessServiceAccess, requestBusinessServiceAccess }
