import { expect } from 'chai'
import emailService from '../../app/services/emailService.js'

describe('emailService', () => {
  describe('module structure', () => {
    it('should export sendOneTimePasscodeEmail function', () => {
      expect(emailService.sendOneTimePasscodeEmail).to.be.a('function')
    })

    it('should export sendOneTimePasscodeSMS function', () => {
      expect(emailService.sendOneTimePasscodeSMS).to.be.a('function')
    })

    it('should export lockedOut function', () => {
      expect(emailService.lockedOut).to.be.a('function')
    })

    it('should export resetPassword function', () => {
      expect(emailService.resetPassword).to.be.a('function')
    })

    it('should export confirmPasswordChange function', () => {
      expect(emailService.confirmPasswordChange).to.be.a('function')
    })

    it('should export emailConfirmation function', () => {
      expect(emailService.emailConfirmation).to.be.a('function')
    })

    it('should export expiryWarning function', () => {
      expect(emailService.expiryWarning).to.be.a('function')
    })

    it('should export expiryConfirmation function', () => {
      expect(emailService.expiryConfirmation).to.be.a('function')
    })

    it('should export requestBusinessAccess function', () => {
      expect(emailService.requestBusinessAccess).to.be.a('function')
    })

    it('should export businessServiceDecision function', () => {
      expect(emailService.businessServiceDecision).to.be.a('function')
    })
  })

  describe('function signatures', () => {
    it('sendOneTimePasscodeEmail should be async', () => {
      const result = emailService.sendOneTimePasscodeEmail('123456', 'test@test.com', 1)
      expect(result).to.be.a('promise')
    })

    it('sendOneTimePasscodeSMS should be async', () => {
      const result = emailService.sendOneTimePasscodeSMS('123456', '+447123456789', 1)
      expect(result).to.be.a('promise')
    })

    it('lockedOut should be async', () => {
      const result = emailService.lockedOut('Test User', 'test@test.com')
      expect(result).to.be.a('promise')
    })

    it('resetPassword should be async', () => {
      const result = emailService.resetPassword('test@test.com', 'token123')
      expect(result).to.be.a('promise')
    })

    it('confirmPasswordChange should be async', () => {
      const result = emailService.confirmPasswordChange('Test User', 'test@test.com')
      expect(result).to.be.a('promise')
    })

    it('emailConfirmation should be async', () => {
      const result = emailService.emailConfirmation('test@test.com', 'token123')
      expect(result).to.be.a('promise')
    })
  })
})
