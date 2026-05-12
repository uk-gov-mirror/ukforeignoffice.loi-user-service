let expect
let ValidationService

before('Setup', async () => {
  const chai = await import('chai')
  expect = chai.expect

  // ValidationService will be loaded, and it requires config/common.js
  // which is already set up for the test environment
  ValidationService = require('../../app/services/ValidationService')
})

describe('ValidationService', () => {
  describe('validateForm', () => {
    it('should return an array with error messages and erroneous fields', () => {
      const mockError = {
        errors: [
          {
            message: JSON.stringify([
              {
                questionId: 'email',
                errInfo: 'Invalid email',
                errSoltn: 'Enter a valid email',
              },
            ]),
          },
        ],
      }
      const inputs = {
        error: mockError,
        erroneousFields: ['email'],
      }

      const result = ValidationService.validateForm(inputs)

      expect(result).to.be.an('array')
      expect(result.length).to.equal(2)
      expect(result[0][0].errMsgs).to.be.an('array')
      expect(result[0][0].errMsgs[0].fieldName).to.equal('email')
      expect(result[0][0].errMsgs[0].fieldError).to.equal('Invalid email')
      expect(result[1][0].erroneousFields).to.deep.equal(['email'])
    })

    it('should handle multiple errors', () => {
      const mockError = {
        errors: [
          {
            message: JSON.stringify([
              {
                questionId: 'email',
                errInfo: 'Invalid email',
                errSoltn: 'Enter a valid email',
              },
            ]),
          },
          {
            message: JSON.stringify([
              {
                questionId: 'password',
                errInfo: 'Password too short',
                errSoltn: 'Enter a longer password',
              },
            ]),
          },
        ],
      }
      const inputs = {
        error: mockError,
        erroneousFields: ['email', 'password'],
      }

      const result = ValidationService.validateForm(inputs)

      expect(result[0][0].errMsgs.length).to.equal(2)
      expect(result[0][0].errMsgs[0].fieldName).to.equal('email')
      expect(result[0][0].errMsgs[1].fieldName).to.equal('password')
    })

    it('should return empty array when no errors present', () => {
      const mockError = {
        errors: [],
      }
      const inputs = {
        error: mockError,
        erroneousFields: [],
      }

      const result = ValidationService.validateForm(inputs)

      expect(result).to.be.an('array')
      expect(result.length).to.equal(0)
    })
  })

  describe('buildErrorsArray', () => {
    it('should build error array for non-password fields', () => {
      const errorArr = {
        errors: [
          {
            path: 'first_name',
            type: 'validation error',
            message: 'First name required',
            value: {
              errInfo: 'You have not provided your first name',
              errSoltn: 'Enter your first name',
              questionId: 'first_name',
            },
          },
        ],
      }

      const result = ValidationService.buildErrorsArray(errorArr)

      expect(result).to.be.an('array')
      expect(result[0].fieldName).to.equal('first_name')
      expect(result[0].fieldError).to.equal('You have not provided your first name')
    })

    it('should handle password field errors with JSON message', () => {
      const errorArr = {
        errors: [
          {
            path: 'password',
            type: 'validation error',
            message: JSON.stringify([
              {
                questionId: 'password',
                errInfo: 'Password is invalid',
                errSoltn: 'Enter a valid password',
              },
            ]),
          },
        ],
      }

      const result = ValidationService.buildErrorsArray(errorArr)

      expect(result).to.be.an('array')
      expect(result[0].fieldName).to.equal('password')
      expect(result[0].fieldError).to.equal('Password is invalid')
    })

    it('should handle unique violation errors', () => {
      const errorArr = {
        errors: [
          {
            path: 'email',
            type: 'unique violation',
            message: {
              errInfo: 'Email already exists',
              errSoltn: 'Use a different email',
              questionId: 'email',
            },
          },
        ],
      }

      const result = ValidationService.buildErrorsArray(errorArr)

      expect(result).to.be.an('array')
      expect(result[0].fieldName).to.equal('email')
    })

    it('should not add duplicate fields to erroneousFields array', () => {
      const errorArr = {
        errors: [
          {
            path: 'email',
            type: 'validation error',
            message: 'Error 1',
            value: {
              errInfo: 'Error 1',
              errSoltn: 'Fix it',
              questionId: 'email',
            },
          },
          {
            path: 'email',
            type: 'validation error',
            message: 'Error 2',
            value: {
              errInfo: 'Error 2',
              errSoltn: 'Fix it again',
              questionId: 'email',
            },
          },
        ],
      }

      const result = ValidationService.buildErrorsArray(errorArr)

      // Should have only one error entry + erroneousFields array
      const erroneousFields = result[result.length - 1]
      expect(erroneousFields.filter((f) => f === 'email').length).to.equal(1)
    })

    it('should return array with empty erroneousFields for empty error array', () => {
      const errorArr = {
        errors: [],
      }

      const result = ValidationService.buildErrorsArray(errorArr)

      expect(result).to.be.an('array')
      expect(result.length).to.equal(1)
      expect(result[0]).to.deep.equal([])
    })
  })
})
