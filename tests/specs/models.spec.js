import { expect } from 'chai'
import Model from '../../app/model/models.js'

describe('Model Structure', () => {
  describe('User Model', () => {
    it('should export User model', () => {
      expect(Model.User).to.exist
    })

    it('User model should have findOne method', () => {
      expect(Model.User.findOne).to.be.a('function')
    })

    it('User model should have findAll method', () => {
      expect(Model.User.findAll).to.be.a('function')
    })

    it('User model should have create method', () => {
      expect(Model.User.create).to.be.a('function')
    })

    it('User model should have update method', () => {
      expect(Model.User.update).to.be.a('function')
    })

    it('User model should have destroy method', () => {
      expect(Model.User.destroy).to.be.a('function')
    })
  })

  describe('AccountDetails Model', () => {
    it('should export AccountDetails model', () => {
      expect(Model.AccountDetails).to.exist
    })

    it('AccountDetails model should have findOne method', () => {
      expect(Model.AccountDetails.findOne).to.be.a('function')
    })

    it('AccountDetails model should have create method', () => {
      expect(Model.AccountDetails.create).to.be.a('function')
    })

    it('AccountDetails model should have update method', () => {
      expect(Model.AccountDetails.update).to.be.a('function')
    })
  })

  describe('SavedAddress Model', () => {
    it('should export SavedAddress model', () => {
      expect(Model.SavedAddress).to.exist
    })

    it('SavedAddress model should have findAll method', () => {
      expect(Model.SavedAddress.findAll).to.be.a('function')
    })

    it('SavedAddress model should have create method', () => {
      expect(Model.SavedAddress.create).to.be.a('function')
    })

    it('SavedAddress model should have update method', () => {
      expect(Model.SavedAddress.update).to.be.a('function')
    })

    it('SavedAddress model should have destroy method', () => {
      expect(Model.SavedAddress.destroy).to.be.a('function')
    })
  })

  describe('OneTimePasscodes Model', () => {
    it('should export OneTimePasscodes model', () => {
      expect(Model.OneTimePasscodes).to.exist
    })

    it('OneTimePasscodes model should have findOne method', () => {
      expect(Model.OneTimePasscodes.findOne).to.be.a('function')
    })

    it('OneTimePasscodes model should have create method', () => {
      expect(Model.OneTimePasscodes.create).to.be.a('function')
    })

    it('OneTimePasscodes model should have destroy method', () => {
      expect(Model.OneTimePasscodes.destroy).to.be.a('function')
    })
  })
})
