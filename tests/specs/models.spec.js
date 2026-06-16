import { describe, expect, it } from 'vitest'
import Model from '../../app/model/models.js'

describe('Model Structure', () => {
  describe('User Model', () => {
    it('should export User model', () => {
      expect(Model.User).toBeDefined()
    })

    it('User model should have findOne method', () => {
      expect(Model.User.findOne).toBeTypeOf('function')
    })

    it('User model should have findAll method', () => {
      expect(Model.User.findAll).toBeTypeOf('function')
    })

    it('User model should have create method', () => {
      expect(Model.User.create).toBeTypeOf('function')
    })

    it('User model should have update method', () => {
      expect(Model.User.update).toBeTypeOf('function')
    })

    it('User model should have destroy method', () => {
      expect(Model.User.destroy).toBeTypeOf('function')
    })
  })

  describe('AccountDetails Model', () => {
    it('should export AccountDetails model', () => {
      expect(Model.AccountDetails).toBeDefined()
    })

    it('AccountDetails model should have findOne method', () => {
      expect(Model.AccountDetails.findOne).toBeTypeOf('function')
    })

    it('AccountDetails model should have create method', () => {
      expect(Model.AccountDetails.create).toBeTypeOf('function')
    })

    it('AccountDetails model should have update method', () => {
      expect(Model.AccountDetails.update).toBeTypeOf('function')
    })
  })

  describe('SavedAddress Model', () => {
    it('should export SavedAddress model', () => {
      expect(Model.SavedAddress).toBeDefined()
    })

    it('SavedAddress model should have findAll method', () => {
      expect(Model.SavedAddress.findAll).toBeTypeOf('function')
    })

    it('SavedAddress model should have create method', () => {
      expect(Model.SavedAddress.create).toBeTypeOf('function')
    })

    it('SavedAddress model should have update method', () => {
      expect(Model.SavedAddress.update).toBeTypeOf('function')
    })

    it('SavedAddress model should have destroy method', () => {
      expect(Model.SavedAddress.destroy).toBeTypeOf('function')
    })
  })

  describe('OneTimePasscodes Model', () => {
    it('should export OneTimePasscodes model', () => {
      expect(Model.OneTimePasscodes).toBeDefined()
    })

    it('OneTimePasscodes model should have findOne method', () => {
      expect(Model.OneTimePasscodes.findOne).toBeTypeOf('function')
    })

    it('OneTimePasscodes model should have create method', () => {
      expect(Model.OneTimePasscodes.create).toBeTypeOf('function')
    })

    it('OneTimePasscodes model should have destroy method', () => {
      expect(Model.OneTimePasscodes.destroy).toBeTypeOf('function')
    })
  })
})
