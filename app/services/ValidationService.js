import Postcode from 'postcode'
import common from '../../config/common.js'
import { logger } from '../../config/logs.js'

const envVariables = common.config()

export const ValidationService = {
  validateForm: (inputs) => {
    const errors = inputs.error.errors

    const erroneousFields = inputs.erroneousFields
    const errMsgs = []

    let fieldName
    let fieldError
    let fieldSolution
    let questionId

    const fieldsAndErrors = []

    if (errors.length > 0) {
      for (let h = 0; h < errors.length; h++) {
        const errArr = JSON.parse(errors[h].message)

        fieldName = errArr[0].questionId
        fieldError = errArr[0].errInfo
        fieldSolution = errArr[0].errSoltn
        questionId = errArr[0].questionId

        errMsgs.push({
          fieldName: fieldName,
          fieldError: fieldError,
          fieldSolution: fieldSolution,
          questionId: questionId,
        })
      }

      fieldsAndErrors.push([{ errMsgs: errMsgs }])
      fieldsAndErrors.push([{ erroneousFields: erroneousFields }])
    }
    return fieldsAndErrors
  },

  buildErrorsArray: (errorArr) => {
    const fieldsAndErrorsCustom = []
    const errornousFields = []
    try {
      errorArr.errors.forEach((item) => {
        if (errornousFields.indexOf(item.path) === -1) {
          errornousFields.push(item.path)
          if (item.path === 'password') {
            /**
             * If it IS the password fields with an error, build the
             * errors array
             */
            let passwordError = item.message

            if (errornousFields.length === 1 && errornousFields.indexOf('password') > -1) {
              passwordError = JSON.parse(passwordError)[0]
            }

            fieldsAndErrorsCustom.push({
              fieldName: passwordError.questionId,
              fieldError: passwordError.errInfo,
              fieldSolution: passwordError.errSoltn,
              questionId: passwordError.questionId,
            })
          } else if (item.type === 'unique violation') {
            /**
             * Error due to duplicate email used
             */
            const emailError = item.message

            //if (errornousFields.length === 1 && errornousFields.indexOf('email') > -1) {
            //    emailError = JSON.parse(emailError);
            //}

            fieldsAndErrorsCustom.push({
              fieldName: emailError.questionId,
              fieldError: emailError.errInfo,
              fieldSolution: emailError.errSoltn,
              questionId: emailError.questionId,
            })
          } else {
            /**
             * If it IS NOT the password fields with an error, take
             * error details from model
             */
            fieldsAndErrorsCustom.push({
              fieldName: item.path,
              fieldError: item.value.errInfo,
              fieldSolution: item.value.errSoltn,
              questionId: item.value.questionId,
            })
          }
        }
      })

      fieldsAndErrorsCustom.push(errornousFields)
      //fieldsAndErrorsCustom.push({erroneousFields: erroneousFields});

      return fieldsAndErrorsCustom
    } catch (error) {
      logger.error('there was an error in the builderrorsarray ', error)
      //sails.log(error);
    }
  },

  buildAddressErrorArray: (error, req, res, countries, user, account, edit) => {
    function isValidPhoneInput(input) {
      if (input.length < 6 || input.length > 25) {
        return false
      }

      return phonePattern.test(input)
    }

    const country = req.body.country || ''
    const phonePattern = /^[0-9+()# -]+$/

    const postcodeObject = Postcode.toNormalised(req.body.postcode)
    let postcode = ' '
    if (country !== 'United Kingdom') {
      postcode =
        req.body.postcode.trim().length === 0 ? ' ' : req.body.postcode.length > 1 ? req.body.postcode : postcode
    } else {
      postcode = postcodeObject ? postcodeObject : ''
    }
    const erroneousFields = []

    error.errors.forEach((error) => {
      const parsedMessage = JSON.parse(error.message)
      parsedMessage.forEach((errDetail) => {
        erroneousFields.push(errDetail.questionId)
      })
    })

    if (req.body.full_name === '' || req.body.full_name.length < 2) {
      erroneousFields.push('full_name')
    }
    if (postcode === '' || postcode.length > 20) {
      erroneousFields.push('postcode')
    }
    if (req.body.house_name === '') {
      erroneousFields.push('house_name')
    }
    if (req.body.street === '') {
      erroneousFields.push('street')
    }
    if (req.body.town === '') {
      erroneousFields.push('town')
    }
    if (req.body.country === '' || typeof req.body.country === 'undefined') {
      erroneousFields.push('country')
    }

    const mobileNo = req.body.mobileNo
    if (!mobileNo || !isValidPhoneInput(mobileNo)) {
      erroneousFields.push('mobileNo')
    }

    const telephone = req.body.telephone
    if (telephone) {
      if (!isValidPhoneInput(telephone)) {
        erroneousFields.push('telephone')
      }
    }

    if (req.body.email !== '') {
      if (!common.validations.emailRegex.test(req.body.email)) {
        erroneousFields.push('email')
      }
    }

    const dataValues = []
    dataValues.push({
      full_name:
        req.body.full_name !== '' && req.body.full_name !== undefined && req.body.full_name !== 'undefined'
          ? req.body.full_name
          : '',
      postcode: postcode,
      organisation:
        req.body.organisation !== '' && req.body.organisation !== undefined && req.body.organisation !== 'undefined'
          ? req.body.organisation
          : '',
      house_name:
        req.body.house_name !== '' && req.body.house_name !== undefined && req.body.house_name !== 'undefined'
          ? req.body.house_name
          : '',
      street:
        req.body.street !== '' && req.body.street !== undefined && req.body.street !== 'undefined'
          ? req.body.street
          : '',
      town: req.body.town !== '' && req.body.town !== undefined && req.body.town !== 'undefined' ? req.body.town : '',
      county:
        req.body.county !== '' && req.body.county !== undefined && req.body.county !== 'undefined'
          ? req.body.county
          : '',
      country:
        req.body.country !== '' && req.body.country !== undefined && req.body.country !== 'undefined'
          ? req.body.country
          : '',
      telephone:
        req.body.telephone !== '' && req.body.telephone !== undefined && req.body.telephone !== 'undefined'
          ? req.body.telephone
          : '',
      mobileNo:
        req.body.mobileNo !== '' && req.body.mobileNo !== undefined && req.body.mobileNo !== 'undefined'
          ? req.body.mobileNo
          : '',
      email:
        req.body.email !== '' && req.body.email !== undefined && req.body.email !== 'undefined' ? req.body.email : '',
    })
    if (edit) {
      let require_contact_details = 'no'
      let back_link = ''
      if (req.session.require_contact_details === 'yes') {
        require_contact_details = 'yes'
        back_link = req.session.require_contact_details_back_link
      }
      return res.render('address_pages/edit-address.ejs', {
        uk: req.body.country === 'United Kingdom',
        addresses: req.session.addresses,
        form_values: dataValues[0],
        address_id: req.body.address_id,
        error_report: ValidationService.validateForm({ error: error, erroneousFields: erroneousFields }),
        show_fields: true,
        manual: true,
        postcodeFlash: req.flash('error'),
        step: 2,
        user: user,
        account: account,
        url: envVariables,
        countries: countries[0],
        initial: req.session.initial,
        require_contact_details: require_contact_details,
        back_link: back_link,
      })
    } else if (req.body.country === 'United Kingdom' && !JSON.parse(req.body.manual)) {
      return res.render('address_pages/UKAddress.ejs', {
        uk: true,
        addresses: req.session.addresses,
        form_values: dataValues[0],
        error_report: ValidationService.validateForm({ error: error, erroneousFields: erroneousFields }),
        postcodeFlash: req.flash('error'),
        user: user,
        initial: req.session.initial,
        account: account,
        postcode: req.body.postcode,
        chosen_address: req.body.chosen_address,
        url: envVariables,
      })
    } else if (req.body.country === 'United Kingdom' && JSON.parse(req.body.manual)) {
      return res.render('address_pages/UKManualAddress.ejs', {
        form_values: dataValues[0],
        error_report: ValidationService.validateForm({ error: error, erroneousFields: erroneousFields }),
        user: user,
        initial: req.session.initial,
        account: account,
        url: envVariables,
      })
    } else {
      return res.render('address_pages/IntlAddress.ejs', {
        form_values: dataValues[0],
        error_report: ValidationService.validateForm({ error: error, erroneousFields: erroneousFields }),
        initial: req.session.initial,
        user: user,
        account: account,
        url: envVariables,
        countries: countries[0],
      })
    }
  },
}

export default ValidationService
