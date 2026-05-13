import { describe, expect, it } from 'vitest'
import emailService from '../../../app/services/emailService.js'

describe('emailService', () => {
  describe('module structure', () => {
    it('should export sendOneTimePasscodeEmail function', () => {
      expect(emailService.sendOneTimePasscodeEmail).toBeTypeOf('function')
    })

    it('should export sendOneTimePasscodeSMS function', () => {
      expect(emailService.sendOneTimePasscodeSMS).toBeTypeOf('function')
    })

    it('should export lockedOut function', () => {
      expect(emailService.lockedOut).toBeTypeOf('function')
    })

    it('should export resetPassword function', () => {
      expect(emailService.resetPassword).toBeTypeOf('function')
    })

    it('should export confirmPasswordChange function', () => {
      expect(emailService.confirmPasswordChange).toBeTypeOf('function')
    })

    it('should export emailConfirmation function', () => {
      expect(emailService.emailConfirmation).toBeTypeOf('function')
    })

    it('should export expiryWarning function', () => {
      expect(emailService.expiryWarning).toBeTypeOf('function')
    })

    it('should export expiryConfirmation function', () => {
      expect(emailService.expiryConfirmation).toBeTypeOf('function')
    })

    it('should export requestBusinessAccess function', () => {
      expect(emailService.requestBusinessAccess).toBeTypeOf('function')
    })

    it('should export businessServiceDecision function', () => {
      expect(emailService.businessServiceDecision).toBeTypeOf('function')
    })
  })

  describe('function signatures', () => {
    it('sendOneTimePasscodeEmail should be async', () => {
      const result = emailService.sendOneTimePasscodeEmail('123456', 'test@test.com', 1)
      expect(result).toBeInstanceOf(Promise)
    })

    it('sendOneTimePasscodeSMS should be async', () => {
      const result = emailService.sendOneTimePasscodeSMS('123456', '+447123456789', 1)
      expect(result).toBeInstanceOf(Promise)
    })

    it('lockedOut should be async', () => {
      const result = emailService.lockedOut('Test User', 'test@test.com')
      expect(result).toBeInstanceOf(Promise)
    })

    it('resetPassword should be async', () => {
      const result = emailService.resetPassword('test@test.com', 'token123')
      expect(result).toBeInstanceOf(Promise)
    })

    it('confirmPasswordChange should be async', () => {
      const result = emailService.confirmPasswordChange('Test User', 'test@test.com')
      expect(result).toBeInstanceOf(Promise)
    })

    it('emailConfirmation should be async', () => {
      const result = emailService.emailConfirmation('test@test.com', 'token123')
      expect(result).toBeInstanceOf(Promise)
    })
  })
})
