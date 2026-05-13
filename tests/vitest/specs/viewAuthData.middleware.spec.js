import { afterEach, describe, expect, it } from 'vitest'
import viewAuthData from '../../../app/middleware/viewAuthData.js'
import Model from '../../../app/model/models.js'

const originalFindOne = Model.AccountDetails.findOne

afterEach(() => {
  Model.AccountDetails.findOne = originalFindOne
})

describe('viewAuthData middleware', () => {
  it('sets unauthenticated defaults when user is not logged in', async () => {
    const req = {
      isAuthenticated: () => false,
      session: {},
    }
    const res = { locals: {} }

    let nextError
    await viewAuthData(req, res, (err) => {
      nextError = err
    })

    expect(nextError).toBeUndefined()
    expect(res.locals.isAuthenticated).toBe(false)
    expect(res.locals.user).toBeNull()
    expect(res.locals.account).toBeNull()
  })

  it('uses session account when present for authenticated users', async () => {
    let findOneCalled = false
    Model.AccountDetails.findOne = () => {
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

    await viewAuthData(req, res, () => {})

    expect(findOneCalled).toBe(false)
    expect(res.locals.isAuthenticated).toBe(true)
    expect(res.locals.user.id).toBe(10)
    expect(res.locals.account.first_name).toBe('Cached')
    expect(req.session.user.id).toBe(10)
  })

  it('fetches account from database when session account is missing', async () => {
    Model.AccountDetails.findOne = async () => ({
      dataValues: {
        user_id: 11,
        first_name: 'Fetched',
      },
    })

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

    await viewAuthData(req, res, () => {})

    expect(res.locals.isAuthenticated).toBe(true)
    expect(res.locals.user.id).toBe(11)
    expect(res.locals.account.first_name).toBe('Fetched')
    expect(req.session.account.first_name).toBe('Fetched')
  })

  it('passes errors to next when account lookup fails', async () => {
    const expectedError = new Error('db failed')
    Model.AccountDetails.findOne = () => {
      throw expectedError
    }

    const req = {
      isAuthenticated: () => true,
      user: { id: 12, email: 'error@example.com' },
      session: {},
    }
    const res = { locals: {} }

    let nextError
    await viewAuthData(req, res, (err) => {
      nextError = err
    })

    expect(nextError).toBe(expectedError)
  })
})
