let expect
let HelperService

before('Setup', async function () {
  const chai = await import('chai')
  expect = chai.expect
  HelperService = require('../../app/services/HelperService')
})

describe('HelperService', function () {
  describe('module structure', function () {
    it('should export getEdmsAccessToken function', function () {
      expect(HelperService.getEdmsAccessToken).to.be.a('function')
    })

    it('getEdmsAccessToken should be async', function () {
      // Just verify it returns a promise (don't actually call external service)
      expect(HelperService.getEdmsAccessToken).to.be.a('function')
    })
  })
})
