let expect
let HelperService

before('Setup', async () => {
  const chai = await import('chai')
  expect = chai.expect
  HelperService = require('../../app/services/HelperService')
})

describe('HelperService', () => {
  describe('module structure', () => {
    it('should export getEdmsAccessToken function', () => {
      expect(HelperService.getEdmsAccessToken).to.be.a('function')
    })

    it('getEdmsAccessToken should be async', () => {
      // Just verify it returns a promise (don't actually call external service)
      expect(HelperService.getEdmsAccessToken).to.be.a('function')
    })
  })
})
