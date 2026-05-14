import Postcode from 'postcode'
import { describe, expect, it } from 'vitest'

describe('Postcode Validation', () => {
  describe('Valid UK Postcodes', () => {
    it('should normalise a valid postcode with space', () => {
      const result = Postcode.toNormalised('SW1A 1AA')
      expect(result).toBe('SW1A 1AA')
    })

    it('should normalise a valid postcode without space', () => {
      const result = Postcode.toNormalised('SW1A1AA')
      expect(result).toBe('SW1A 1AA')
    })

    it('should normalise lowercase postcode', () => {
      const result = Postcode.toNormalised('sw1a 1aa')
      expect(result).toBe('SW1A 1AA')
    })

    it('should handle extra spaces', () => {
      const result = Postcode.toNormalised('SW1A  1AA')
      expect(result).toBe('SW1A 1AA')
    })

    it('should normalise various valid formats', () => {
      expect(Postcode.toNormalised('EC1A 1BB')).toBe('EC1A 1BB')
      expect(Postcode.toNormalised('W1A 0AX')).toBe('W1A 0AX')
      expect(Postcode.toNormalised('M1 1AE')).toBe('M1 1AE')
      expect(Postcode.toNormalised('B33 8TH')).toBe('B33 8TH')
      expect(Postcode.toNormalised('CR2 6XH')).toBe('CR2 6XH')
      expect(Postcode.toNormalised('DN55 1PT')).toBe('DN55 1PT')
    })
  })

  describe('Invalid UK Postcodes', () => {
    it('should return null for invalid postcode', () => {
      const result = Postcode.toNormalised('INVALID')
      expect(result).toBeNull()
    })

    it('should return null for empty string', () => {
      const result = Postcode.toNormalised('')
      expect(result).toBeNull()
    })

    it('should return null for numeric only', () => {
      const result = Postcode.toNormalised('12345')
      expect(result).toBeNull()
    })

    it('should return null for too short postcode', () => {
      const result = Postcode.toNormalised('SW1')
      expect(result).toBeNull()
    })
  })

  describe('Postcode Validation Function', () => {
    it('should validate a valid postcode', () => {
      expect(Postcode.isValid('SW1A 1AA')).toBe(true)
    })

    it('should invalidate an invalid postcode', () => {
      expect(Postcode.isValid('INVALID')).toBe(false)
    })

    it('should invalidate empty string', () => {
      expect(Postcode.isValid('')).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should return null for postcode with leading/trailing spaces (requires trim)', () => {
      const result = Postcode.toNormalised('  SW1A 1AA  ')
      expect(result).toBeNull()
    })

    it('should handle trimmed postcode correctly', () => {
      const result = Postcode.toNormalised('  SW1A 1AA  '.trim())
      expect(result).toBe('SW1A 1AA')
    })

    it('should handle mixed case postcode', () => {
      const result = Postcode.toNormalised('Sw1A 1aA')
      expect(result).toBe('SW1A 1AA')
    })
  })
})
