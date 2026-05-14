import { describe, expect, it } from 'vitest'
import oneTimePasscodeService from '../../app/services/oneTimePasscodeService.js'

describe('OneTimePasscodeService', () => {
  describe('generateOneTimePasscode', () => {
    it('should generate a 6 digit passcode', async () => {
      const passcode = await oneTimePasscodeService.generateOneTimePasscode()

      expect(passcode).toBeTypeOf('number')
      expect(passcode.toString().length).toBe(6)
    })

    it('should generate a passcode between 100000 and 999999', async () => {
      const passcode = await oneTimePasscodeService.generateOneTimePasscode()

      expect(passcode).toBeGreaterThanOrEqual(100000)
      expect(passcode).toBeLessThanOrEqual(999999)
    })

    it('should generate different passcodes on multiple calls', async () => {
      const passcodes = new Set()

      for (let i = 0; i < 10; i++) {
        const passcode = await oneTimePasscodeService.generateOneTimePasscode()
        passcodes.add(passcode)
      }

      expect(passcodes.size).toBeGreaterThanOrEqual(2)
    })

    it('should only generate numeric passcodes', async () => {
      const passcode = await oneTimePasscodeService.generateOneTimePasscode()

      expect(Number.isInteger(passcode)).toBe(true)
      expect(Number.isNaN(passcode)).toBe(false)
    })
  })
})
