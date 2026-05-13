import { expect } from 'chai'
import isEmail from 'isemail'

describe('Email Validation', () => {
  // Testing the email validation logic used throughout the application

  describe('Valid Email Formats', () => {
    it('should accept standard email format', () => {
      expect(isEmail.validate('user@example.com')).to.be.true
    })

    it('should accept email with subdomain', () => {
      expect(isEmail.validate('user@mail.example.com')).to.be.true
    })

    it('should accept email with plus sign', () => {
      expect(isEmail.validate('user+tag@example.com')).to.be.true
    })

    it('should accept email with dots in local part', () => {
      expect(isEmail.validate('first.last@example.com')).to.be.true
    })

    it('should accept email with numbers', () => {
      expect(isEmail.validate('user123@example.com')).to.be.true
    })

    it('should accept email with hyphens in domain', () => {
      expect(isEmail.validate('user@my-domain.com')).to.be.true
    })

    it('should accept email with country TLD', () => {
      expect(isEmail.validate('user@example.co.uk')).to.be.true
    })

    it('should accept email with new TLDs', () => {
      expect(isEmail.validate('user@example.technology')).to.be.true
    })
  })

  describe('Invalid Email Formats', () => {
    it('should reject email without @ symbol', () => {
      expect(isEmail.validate('userexample.com')).to.be.false
    })

    it('should reject email without domain', () => {
      expect(isEmail.validate('user@')).to.be.false
    })

    it('should reject email without local part', () => {
      expect(isEmail.validate('@example.com')).to.be.false
    })

    it('should reject email with spaces', () => {
      expect(isEmail.validate('user @example.com')).to.be.false
    })

    it('should reject email with multiple @ symbols', () => {
      expect(isEmail.validate('user@@example.com')).to.be.false
    })

    it('should reject empty string', () => {
      expect(isEmail.validate('')).to.be.false
    })

    it('should reject plain text', () => {
      expect(isEmail.validate('notanemail')).to.be.false
    })

    it('should reject email ending with dot', () => {
      expect(isEmail.validate('user@example.')).to.be.false
    })

    it('should reject email with consecutive dots', () => {
      expect(isEmail.validate('user@example..com')).to.be.false
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long email addresses', () => {
      const longLocal = 'a'.repeat(64)
      const longEmail = `${longLocal}@example.com`
      // The validation result depends on the library, but it should not throw
      expect(typeof isEmail.validate(longEmail)).to.equal('boolean')
    })

    it('should handle email with special characters in local part', () => {
      expect(isEmail.validate("user!#$%&'*+-/=?^_`{|}~@example.com")).to.be.true
    })

    it('should handle uppercase email', () => {
      expect(isEmail.validate('USER@EXAMPLE.COM')).to.be.true
    })

    it('should handle mixed case email', () => {
      expect(isEmail.validate('User@Example.Com')).to.be.true
    })
  })
})
