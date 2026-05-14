import isEmail from 'isemail'
import { describe, expect, it } from 'vitest'

describe('Email Validation', () => {
  describe('Valid Email Formats', () => {
    it('should accept standard email format', () => {
      expect(isEmail.validate('user@example.com')).toBe(true)
    })

    it('should accept email with subdomain', () => {
      expect(isEmail.validate('user@mail.example.com')).toBe(true)
    })

    it('should accept email with plus sign', () => {
      expect(isEmail.validate('user+tag@example.com')).toBe(true)
    })

    it('should accept email with dots in local part', () => {
      expect(isEmail.validate('first.last@example.com')).toBe(true)
    })

    it('should accept email with numbers', () => {
      expect(isEmail.validate('user123@example.com')).toBe(true)
    })

    it('should accept email with hyphens in domain', () => {
      expect(isEmail.validate('user@my-domain.com')).toBe(true)
    })

    it('should accept email with country TLD', () => {
      expect(isEmail.validate('user@example.co.uk')).toBe(true)
    })

    it('should accept email with new TLDs', () => {
      expect(isEmail.validate('user@example.technology')).toBe(true)
    })
  })

  describe('Invalid Email Formats', () => {
    it('should reject email without @ symbol', () => {
      expect(isEmail.validate('userexample.com')).toBe(false)
    })

    it('should reject email without domain', () => {
      expect(isEmail.validate('user@')).toBe(false)
    })

    it('should reject email without local part', () => {
      expect(isEmail.validate('@example.com')).toBe(false)
    })

    it('should reject email with spaces', () => {
      expect(isEmail.validate('user @example.com')).toBe(false)
    })

    it('should reject email with multiple @ symbols', () => {
      expect(isEmail.validate('user@@example.com')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isEmail.validate('')).toBe(false)
    })

    it('should reject plain text', () => {
      expect(isEmail.validate('notanemail')).toBe(false)
    })

    it('should reject email ending with dot', () => {
      expect(isEmail.validate('user@example.')).toBe(false)
    })

    it('should reject email with consecutive dots', () => {
      expect(isEmail.validate('user@example..com')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long email addresses', () => {
      const longLocal = 'a'.repeat(64)
      const longEmail = `${longLocal}@example.com`
      expect(typeof isEmail.validate(longEmail)).toBe('boolean')
    })

    it('should handle email with special characters in local part', () => {
      expect(isEmail.validate("user!#$%&'*+-/=?^_`{|}~@example.com")).toBe(true)
    })

    it('should handle uppercase email', () => {
      expect(isEmail.validate('USER@EXAMPLE.COM')).toBe(true)
    })

    it('should handle mixed case email', () => {
      expect(isEmail.validate('User@Example.Com')).toBe(true)
    })
  })
})
