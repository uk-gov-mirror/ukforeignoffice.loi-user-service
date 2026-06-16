import { describe, expect, it } from 'vitest'
import ValidationService from '../../app/services/ValidationService.js'

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

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2)
      expect(Array.isArray(result[0][0].errMsgs)).toBe(true)
      expect(result[0][0].errMsgs[0].fieldName).toBe('email')
      expect(result[0][0].errMsgs[0].fieldError).toBe('Invalid email')
      expect(result[1][0].erroneousFields).toEqual(['email'])
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

      expect(result[0][0].errMsgs.length).toBe(2)
      expect(result[0][0].errMsgs[0].fieldName).toBe('email')
      expect(result[0][0].errMsgs[1].fieldName).toBe('password')
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

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
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

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].fieldName).toBe('first_name')
      expect(result[0].fieldError).toBe('You have not provided your first name')
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

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].fieldName).toBe('password')
      expect(result[0].fieldError).toBe('Password is invalid')
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

      expect(Array.isArray(result)).toBe(true)
      expect(result[0].fieldName).toBe('email')
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

      const erroneousFields = result[result.length - 1]
      expect(erroneousFields.filter((f) => f === 'email').length).toBe(1)
    })

    it('should return array with empty erroneousFields for empty error array', () => {
      const errorArr = {
        errors: [],
      }

      const result = ValidationService.buildErrorsArray(errorArr)

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)
      expect(result[0]).toEqual([])
    })
  })
})
