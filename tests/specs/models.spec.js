let expect
let Model

before('Setup', async function () {
  const chai = await import('chai')
  expect = chai.expect
  Model = require('../../app/model/models')
})

describe('Model Structure', function () {
  describe('User Model', function () {
    it('should export User model', function () {
      expect(Model.User).to.exist
    })

    it('User model should have findOne method', function () {
      expect(Model.User.findOne).to.be.a('function')
    })

    it('User model should have findAll method', function () {
      expect(Model.User.findAll).to.be.a('function')
    })

    it('User model should have create method', function () {
      expect(Model.User.create).to.be.a('function')
    })

    it('User model should have update method', function () {
      expect(Model.User.update).to.be.a('function')
    })

    it('User model should have destroy method', function () {
      expect(Model.User.destroy).to.be.a('function')
    })
  })

  describe('AccountDetails Model', function () {
    it('should export AccountDetails model', function () {
      expect(Model.AccountDetails).to.exist
    })

    it('AccountDetails model should have findOne method', function () {
      expect(Model.AccountDetails.findOne).to.be.a('function')
    })

    it('AccountDetails model should have create method', function () {
      expect(Model.AccountDetails.create).to.be.a('function')
    })

    it('AccountDetails model should have update method', function () {
      expect(Model.AccountDetails.update).to.be.a('function')
    })
  })

  describe('SavedAddress Model', function () {
    it('should export SavedAddress model', function () {
      expect(Model.SavedAddress).to.exist
    })

    it('SavedAddress model should have findAll method', function () {
      expect(Model.SavedAddress.findAll).to.be.a('function')
    })

    it('SavedAddress model should have create method', function () {
      expect(Model.SavedAddress.create).to.be.a('function')
    })

    it('SavedAddress model should have update method', function () {
      expect(Model.SavedAddress.update).to.be.a('function')
    })

    it('SavedAddress model should have destroy method', function () {
      expect(Model.SavedAddress.destroy).to.be.a('function')
    })
  })

  describe('OneTimePasscodes Model', function () {
    it('should export OneTimePasscodes model', function () {
      expect(Model.OneTimePasscodes).to.exist
    })

    it('OneTimePasscodes model should have findOne method', function () {
      expect(Model.OneTimePasscodes.findOne).to.be.a('function')
    })

    it('OneTimePasscodes model should have create method', function () {
      expect(Model.OneTimePasscodes.create).to.be.a('function')
    })

    it('OneTimePasscodes model should have destroy method', function () {
      expect(Model.OneTimePasscodes.destroy).to.be.a('function')
    })
  })
})
