import { describe, expect, it } from 'vitest'
import { validations } from '../../config/common.js'

describe('Email Validation', () => {
  describe('Valid Email Formats', () => {
    it('should accept standard email format', () => {
      expect(validations.emailRegex.test('user@example.com')).toBe(true)
    })

    it('should accept email with subdomain', () => {
      expect(validations.emailRegex.test('user@mail.example.com')).toBe(true)
    })

    it('should accept email with plus sign', () => {
      expect(validations.emailRegex.test('user+tag@example.com')).toBe(true)
    })

    it('should accept email with dots in local part', () => {
      expect(validations.emailRegex.test('first.last@example.com')).toBe(true)
    })

    it('should accept email with numbers', () => {
      expect(validations.emailRegex.test('user123@example.com')).toBe(true)
    })

    it('should accept email with hyphens in domain', () => {
      expect(validations.emailRegex.test('user@my-domain.com')).toBe(true)
    })

    it('should accept email with country TLD', () => {
      expect(validations.emailRegex.test('user@example.co.uk')).toBe(true)
    })

    it('should accept email with new TLDs', () => {
      expect(validations.emailRegex.test('user@example.technology')).toBe(true)
    })
  })

  describe('Invalid Email Formats', () => {
    it('should reject email without @ symbol', () => {
      expect(validations.emailRegex.test('userexample.com')).toBe(false)
    })

    it('should reject email without domain', () => {
      expect(validations.emailRegex.test('user@')).toBe(false)
    })

    it('should reject email without local part', () => {
      expect(validations.emailRegex.test('@example.com')).toBe(false)
    })

    it('should reject email with spaces', () => {
      expect(validations.emailRegex.test('user @example.com')).toBe(false)
    })

    it('should reject email with multiple @ symbols', () => {
      expect(validations.emailRegex.test('user@@example.com')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(validations.emailRegex.test('')).toBe(false)
    })

    it('should reject plain text', () => {
      expect(validations.emailRegex.test('notanemail')).toBe(false)
    })

    it('should reject email ending with dot', () => {
      expect(validations.emailRegex.test('user@example.')).toBe(false)
    })

    it('should reject email with consecutive dots', () => {
      expect(validations.emailRegex.test('user@example..com')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long email addresses', () => {
      const longLocal = 'a'.repeat(64)
      const longEmail = `${longLocal}@example.com`
      expect(typeof validations.emailRegex.test(longEmail)).toBe('boolean')
    })

    it('should handle email with special characters in local part', () => {
      expect(validations.emailRegex.test("user!#$%&'*+-/=?^_`{|}~@example.com")).toBe(true)
    })

    it('should handle uppercase email', () => {
      expect(validations.emailRegex.test('USER@EXAMPLE.COM')).toBe(true)
    })

    it('should handle mixed case email', () => {
      expect(validations.emailRegex.test('User@Example.Com')).toBe(true)
    })
  })
})
