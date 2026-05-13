import { describe, expect, it } from 'vitest'
import HelperService from '../../../app/services/HelperService.js'

describe('HelperService', () => {
  describe('module structure', () => {
    it('should export getEdmsAccessToken function', () => {
      expect(HelperService.getEdmsAccessToken).toBeTypeOf('function')
    })

    it('getEdmsAccessToken should be async', () => {
      expect(HelperService.getEdmsAccessToken).toBeTypeOf('function')
    })
  })
})
