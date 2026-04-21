let expect
let Postcode

before('Setup', async () => {
  const chai = await import('chai')
  expect = chai.expect
  Postcode = require('postcode')
})

describe('Postcode Validation', () => {
  // Testing the postcode validation used in addressController

  describe('Valid UK Postcodes', () => {
    it('should normalise a valid postcode with space', () => {
      const result = Postcode.toNormalised('SW1A 1AA')
      expect(result).to.equal('SW1A 1AA')
    })

    it('should normalise a valid postcode without space', () => {
      const result = Postcode.toNormalised('SW1A1AA')
      expect(result).to.equal('SW1A 1AA')
    })

    it('should normalise lowercase postcode', () => {
      const result = Postcode.toNormalised('sw1a 1aa')
      expect(result).to.equal('SW1A 1AA')
    })

    it('should handle extra spaces', () => {
      const result = Postcode.toNormalised('SW1A  1AA')
      expect(result).to.equal('SW1A 1AA')
    })

    it('should normalise various valid formats', () => {
      expect(Postcode.toNormalised('EC1A 1BB')).to.equal('EC1A 1BB')
      expect(Postcode.toNormalised('W1A 0AX')).to.equal('W1A 0AX')
      expect(Postcode.toNormalised('M1 1AE')).to.equal('M1 1AE')
      expect(Postcode.toNormalised('B33 8TH')).to.equal('B33 8TH')
      expect(Postcode.toNormalised('CR2 6XH')).to.equal('CR2 6XH')
      expect(Postcode.toNormalised('DN55 1PT')).to.equal('DN55 1PT')
    })
  })

  describe('Invalid UK Postcodes', () => {
    it('should return null for invalid postcode', () => {
      const result = Postcode.toNormalised('INVALID')
      expect(result).to.be.null
    })

    it('should return null for empty string', () => {
      const result = Postcode.toNormalised('')
      expect(result).to.be.null
    })

    it('should return null for numeric only', () => {
      const result = Postcode.toNormalised('12345')
      expect(result).to.be.null
    })

    it('should return null for too short postcode', () => {
      const result = Postcode.toNormalised('SW1')
      expect(result).to.be.null
    })
  })

  describe('Postcode Validation Function', () => {
    it('should validate a valid postcode', () => {
      expect(Postcode.isValid('SW1A 1AA')).to.be.true
    })

    it('should invalidate an invalid postcode', () => {
      expect(Postcode.isValid('INVALID')).to.be.false
    })

    it('should invalidate empty string', () => {
      expect(Postcode.isValid('')).to.be.false
    })
  })

  describe('Edge Cases', () => {
    it('should return null for postcode with leading/trailing spaces (requires trim)', () => {
      // The postcode library doesn't auto-trim, so this returns null
      const result = Postcode.toNormalised('  SW1A 1AA  ')
      expect(result).to.be.null
    })

    it('should handle trimmed postcode correctly', () => {
      const result = Postcode.toNormalised('  SW1A 1AA  '.trim())
      expect(result).to.equal('SW1A 1AA')
    })

    it('should handle mixed case postcode', () => {
      const result = Postcode.toNormalised('Sw1A 1aA')
      expect(result).to.equal('SW1A 1AA')
    })
  })
})
