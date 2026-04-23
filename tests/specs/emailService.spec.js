let expect
let emailService

before('Setup', async function () {
  const chai = await import('chai')
  expect = chai.expect
  emailService = require('../../app/services/emailService')
})

describe('emailService', function () {
  describe('module structure', function () {
    it('should export sendOneTimePasscodeEmail function', function () {
      expect(emailService.sendOneTimePasscodeEmail).to.be.a('function')
    })

    it('should export sendOneTimePasscodeSMS function', function () {
      expect(emailService.sendOneTimePasscodeSMS).to.be.a('function')
    })

    it('should export lockedOut function', function () {
      expect(emailService.lockedOut).to.be.a('function')
    })

    it('should export resetPassword function', function () {
      expect(emailService.resetPassword).to.be.a('function')
    })

    it('should export confirmPasswordChange function', function () {
      expect(emailService.confirmPasswordChange).to.be.a('function')
    })

    it('should export emailConfirmation function', function () {
      expect(emailService.emailConfirmation).to.be.a('function')
    })

    it('should export expiryWarning function', function () {
      expect(emailService.expiryWarning).to.be.a('function')
    })

    it('should export expiryConfirmation function', function () {
      expect(emailService.expiryConfirmation).to.be.a('function')
    })

    it('should export requestBusinessAccess function', function () {
      expect(emailService.requestBusinessAccess).to.be.a('function')
    })

    it('should export businessServiceDecision function', function () {
      expect(emailService.businessServiceDecision).to.be.a('function')
    })
  })

  describe('function signatures', function () {
    it('sendOneTimePasscodeEmail should be async', function () {
      const result = emailService.sendOneTimePasscodeEmail('123456', 'test@test.com', 1)
      expect(result).to.be.a('promise')
    })

    it('sendOneTimePasscodeSMS should be async', function () {
      const result = emailService.sendOneTimePasscodeSMS('123456', '+447123456789', 1)
      expect(result).to.be.a('promise')
    })

    it('lockedOut should be async', function () {
      const result = emailService.lockedOut('Test User', 'test@test.com')
      expect(result).to.be.a('promise')
    })

    it('resetPassword should be async', function () {
      const result = emailService.resetPassword('test@test.com', 'token123')
      expect(result).to.be.a('promise')
    })

    it('confirmPasswordChange should be async', function () {
      const result = emailService.confirmPasswordChange('Test User', 'test@test.com')
      expect(result).to.be.a('promise')
    })

    it('emailConfirmation should be async', function () {
      const result = emailService.emailConfirmation('test@test.com', 'token123')
      expect(result).to.be.a('promise')
    })
  })
})
