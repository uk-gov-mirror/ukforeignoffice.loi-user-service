import { describe, expect, it } from 'vitest'

describe('Phone Number Validation', () => {
  const mobilePattern = /^(\+|\d|\(|#| )(\+|\d|\(| |-)([0-9]|\(|\)| |-){5,14}$/
  const phonePattern = /^(\+|\d|\(|#| )(\+|\d|\(| |-)([0-9]|\(|\)| |-){5,14}$/

  describe('Valid Phone Numbers', () => {
    it('should accept UK mobile number', () => {
      expect(mobilePattern.test('07123456789')).toBe(true)
    })

    it('should accept international format with plus', () => {
      expect(mobilePattern.test('+447123456789')).toBe(true)
    })

    it('should accept number with spaces', () => {
      expect(mobilePattern.test('07123 456 789')).toBe(true)
    })

    it('should accept number with hyphens', () => {
      expect(phonePattern.test('0712-345-6789')).toBe(true)
    })

    it('should accept number with parentheses', () => {
      expect(phonePattern.test('(0712) 345 6789')).toBe(true)
    })

    it('should accept minimum length number (7 chars)', () => {
      expect(mobilePattern.test('1234567')).toBe(true)
    })

    it('should accept maximum length number (16 chars)', () => {
      expect(mobilePattern.test('1234567890123456')).toBe(true)
    })
  })

  describe('Invalid Phone Numbers', () => {
    it('should reject empty string', () => {
      expect(mobilePattern.test('')).toBe(false)
    })

    it('should reject number too short (less than 7)', () => {
      expect(mobilePattern.test('12345')).toBe(false)
    })

    it('should reject number with letters', () => {
      expect(mobilePattern.test('0712abc6789')).toBe(false)
    })

    it('should reject number starting with invalid character', () => {
      expect(mobilePattern.test('@7123456789')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should accept number starting with hash', () => {
      expect(mobilePattern.test('#123456789')).toBe(true)
    })

    it('should accept number with multiple spaces', () => {
      expect(mobilePattern.test('07 123 456 789')).toBe(true)
    })
  })

  describe('Length Validation (used in models)', () => {
    const isValidPhoneLength = (phone) => {
      return phone.length >= 6 && phone.length <= 25
    }

    it('should accept phone number within length bounds', () => {
      expect(isValidPhoneLength('07123456789')).toBe(true)
    })

    it('should reject phone number too short', () => {
      expect(isValidPhoneLength('12345')).toBe(false)
    })

    it('should reject phone number too long', () => {
      expect(isValidPhoneLength('12345678901234567890123456')).toBe(false)
    })

    it('should accept phone at minimum length (6)', () => {
      expect(isValidPhoneLength('123456')).toBe(true)
    })

    it('should accept phone at maximum length (25)', () => {
      expect(isValidPhoneLength('1234567890123456789012345')).toBe(true)
    })
  })
})
