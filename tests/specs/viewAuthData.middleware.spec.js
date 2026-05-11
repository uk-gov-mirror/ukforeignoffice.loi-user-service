let expect
let viewAuthData
let Model
let originalFindOne

before('Setup', async function () {
  const chai = await import('chai')
  expect = chai.expect

  viewAuthData = require('../../app/middleware/viewAuthData')
  Model = require('../../app/model/models')
  originalFindOne = Model.AccountDetails.findOne
})

afterEach(function () {
  Model.AccountDetails.findOne = originalFindOne
})

describe('viewAuthData middleware', function () {
  it('sets unauthenticated defaults when user is not logged in', async function () {
    const req = {
      isAuthenticated: () => false,
      session: {},
    }
    const res = { locals: {} }

    let nextError
    await viewAuthData(req, res, function (err) {
      nextError = err
    })

    expect(nextError).to.equal(undefined)
    expect(res.locals.isAuthenticated).to.equal(false)
    expect(res.locals.user).to.equal(null)
    expect(res.locals.account).to.equal(null)
  })

  it('uses session account when present for authenticated users', async function () {
    let findOneCalled = false
    Model.AccountDetails.findOne = async function () {
      findOneCalled = true
      return null
    }

    const req = {
      isAuthenticated: () => true,
      user: { id: 10, email: 'user@example.com' },
      session: {
        account: { user_id: 10, first_name: 'Cached' },
      },
    }
    const res = { locals: {} }

    await viewAuthData(req, res, function () {})

    expect(findOneCalled).to.equal(false)
    expect(res.locals.isAuthenticated).to.equal(true)
    expect(res.locals.user.id).to.equal(10)
    expect(res.locals.account.first_name).to.equal('Cached')
    expect(req.session.user.id).to.equal(10)
  })

  it('fetches account from database when session account is missing', async function () {
    Model.AccountDetails.findOne = async function () {
      return {
        dataValues: {
          user_id: 11,
          first_name: 'Fetched',
        },
      }
    }

    const req = {
      isAuthenticated: () => true,
      user: {
        dataValues: {
          id: 11,
          email: 'fetched@example.com',
        },
      },
      session: {},
    }
    const res = { locals: {} }

    await viewAuthData(req, res, function () {})

    expect(res.locals.isAuthenticated).to.equal(true)
    expect(res.locals.user.id).to.equal(11)
    expect(res.locals.account.first_name).to.equal('Fetched')
    expect(req.session.account.first_name).to.equal('Fetched')
  })

  it('passes errors to next when account lookup fails', async function () {
    const expectedError = new Error('db failed')
    Model.AccountDetails.findOne = async function () {
      throw expectedError
    }

    const req = {
      isAuthenticated: () => true,
      user: { id: 12, email: 'error@example.com' },
      session: {},
    }
    const res = { locals: {} }

    let nextError
    await viewAuthData(req, res, function (err) {
      nextError = err
    })

    expect(nextError).to.equal(expectedError)
  })
})
