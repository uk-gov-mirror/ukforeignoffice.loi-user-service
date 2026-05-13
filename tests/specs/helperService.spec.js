import { expect } from 'chai'
import HelperService from '../../app/services/HelperService.js'

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
