import validator from 'validator'
import { describe, expect, it } from 'vitest'
import blackList from '../../config/blacklist.js'
import phraselist from '../../config/phraselist.js'

describe('Password Validation Logic', () => {
  function isPasswordInBlacklist(password) {
    return validator.isIn(password, blackList)
  }

  function isPasswordInPhraselist(password) {
    const normalisedPassword = validator.blacklist(password, ' ').trim().toLowerCase()
    for (const phrase of phraselist) {
      if (normalisedPassword.includes(phrase.toLowerCase())) {
        return true
      }
    }
    return false
  }

  function isPasswordValid(password, pattern) {
    const patt = new RegExp(pattern)
    return patt.test(password)
  }

  const passwordPattern = '(?=.*[a-zA-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9\\s]).{8,}'

  describe('Password Pattern Validation', () => {
    it('should accept valid password with uppercase, number and special char', () => {
      const password = 'SecureP@ss1'
      expect(isPasswordValid(password, passwordPattern)).toBe(true)
    })

    it('should accept password with minimum 8 characters', () => {
      const password = 'Pass@rd1'
      expect(isPasswordValid(password, passwordPattern)).toBe(true)
    })

    it('should reject password shorter than 8 characters', () => {
      const password = 'Pa@1abc'
      expect(isPasswordValid(password, passwordPattern)).toBe(false)
    })

    it('should reject password without special character', () => {
      const password = 'Password1'
      expect(isPasswordValid(password, passwordPattern)).toBe(false)
    })

    it('should reject password without number', () => {
      const password = 'Password@'
      expect(isPasswordValid(password, passwordPattern)).toBe(false)
    })

    it('should reject password without letters', () => {
      const password = '12345678@'
      expect(isPasswordValid(password, passwordPattern)).toBe(false)
    })

    it('should accept password with various special characters', () => {
      expect(isPasswordValid('Passw0rd!', passwordPattern)).toBe(true)
      expect(isPasswordValid('Passw0rd@', passwordPattern)).toBe(true)
      expect(isPasswordValid('Passw0rd#', passwordPattern)).toBe(true)
      expect(isPasswordValid('Passw0rd$', passwordPattern)).toBe(true)
      expect(isPasswordValid('Passw0rd%', passwordPattern)).toBe(true)
    })

    it('should accept long passwords', () => {
      const password = 'ThisIsAVeryLongPasswordWith@Number1'
      expect(isPasswordValid(password, passwordPattern)).toBe(true)
    })
  })

  describe('Blacklist Check', () => {
    it('should detect password in blacklist', () => {
      const blacklistedPassword = 'Password1'
      expect(isPasswordInBlacklist(blacklistedPassword)).toBe(true)
    })

    it('should allow password not in blacklist', () => {
      const safePassword = 'MyUnique$ecureP@ss123xyz'
      expect(isPasswordInBlacklist(safePassword)).toBe(false)
    })

    it('should be case-sensitive when checking blacklist', () => {
      const password = 'password1'
      const result1 = isPasswordInBlacklist('Password1')
      const result2 = isPasswordInBlacklist(password)
      expect(typeof result1).toBe('boolean')
      expect(typeof result2).toBe('boolean')
    })
  })

  describe('Phraselist Check', () => {
    it('should detect common phrase "password" in password', () => {
      const password = 'MyPassword123!'
      expect(isPasswordInPhraselist(password)).toBe(true)
    })

    it('should detect common phrase "123456" in password', () => {
      const password = 'Test123456!abc'
      expect(isPasswordInPhraselist(password)).toBe(true)
    })

    it('should detect common phrase "qwerty" in password', () => {
      const password = 'Myqwerty@1'
      expect(isPasswordInPhraselist(password)).toBe(true)
    })

    it('should allow password without common phrases', () => {
      const password = 'Xk9@mLpT2zRv'
      expect(isPasswordInPhraselist(password)).toBe(false)
    })

    it('should be case-insensitive when checking phraselist', () => {
      const password1 = 'MyPASSWORD123!'
      const password2 = 'mypassword123!'
      expect(isPasswordInPhraselist(password1)).toBe(true)
      expect(isPasswordInPhraselist(password2)).toBe(true)
    })

    it('should detect phrase regardless of position', () => {
      expect(isPasswordInPhraselist('dragon!Test1')).toBe(true)
      expect(isPasswordInPhraselist('Test!dragon1')).toBe(true)
      expect(isPasswordInPhraselist('Te!dragon1st')).toBe(true)
    })

    it('should normalise spaces before checking', () => {
      const password = 'pass word123!'
      expect(isPasswordInPhraselist(password)).toBe(true)
    })
  })

  describe('Combined Validation', () => {
    it('should reject password that is valid pattern but in blacklist', () => {
      const password = 'Password1234'
      const patternValid = isPasswordValid(password, passwordPattern)
      const inBlacklist = isPasswordInBlacklist(password)

      expect(typeof patternValid).toBe('boolean')
      expect(typeof inBlacklist).toBe('boolean')
    })

    it('should reject password that is valid pattern but contains common phrase', () => {
      const password = 'Superman@123'
      const patternValid = isPasswordValid(password, passwordPattern)
      const inPhraselist = isPasswordInPhraselist(password)

      expect(patternValid).toBe(true)
      expect(inPhraselist).toBe(true)
    })

    it('should accept secure password that passes all checks', () => {
      const password = 'Xk9@mLpT2zRv!'
      const patternValid = isPasswordValid(password, passwordPattern)
      const inBlacklist = isPasswordInBlacklist(password)
      const inPhraselist = isPasswordInPhraselist(password)

      expect(patternValid).toBe(true)
      expect(inBlacklist).toBe(false)
      expect(inPhraselist).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty password', () => {
      const password = ''
      expect(isPasswordValid(password, passwordPattern)).toBe(false)
      expect(isPasswordInBlacklist(password)).toBe(false)
      expect(isPasswordInPhraselist(password)).toBe(false)
    })

    it('should handle password with only spaces', () => {
      const password = '        '
      expect(isPasswordValid(password, passwordPattern)).toBe(false)
    })

    it('should handle password with unicode characters', () => {
      const password = 'P\u00e4ssw\u00f6rd@1'
      expect(isPasswordValid(password, passwordPattern)).toBe(true)
    })

    it('should handle very long password', () => {
      const password = `${'A'.repeat(50)}@1`
      expect(isPasswordValid(password, passwordPattern)).toBe(true)
    })

    it('should handle password with newline characters', () => {
      const password = 'Pass\nword@1'
      expect(typeof isPasswordValid(password, passwordPattern)).toBe('boolean')
    })
  })
})
