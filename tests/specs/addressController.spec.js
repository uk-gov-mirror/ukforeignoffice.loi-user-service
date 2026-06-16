import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  userFindOne: vi.fn(),
  accountFindOne: vi.fn(),
  savedAddressFindOne: vi.fn(),
  loggerError: vi.fn(),
  loggerInfo: vi.fn(),
}))

vi.mock('axios', () => ({
  default: vi.fn(),
}))

vi.mock('../../config/common.js', () => {
  const env = {
    serviceSequelize: {
      query: mocks.query,
    },
    applicationServiceURL: 'http://localhost:3000/',
    postcodeLookUpApiOptions: {
      uri: 'http://localhost:3004',
    },
  }

  return {
    config: () => env,
    validations: {
      emailRegex:
        /^(?!.*\.\.)[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i,
    },
    default: {
      config: () => env,
      validations: {
        emailRegex:
          /^(?!.*\.\.)[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_\x60{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i,
      },
    },
  }
})

vi.mock('../../config/logs.js', () => ({
  logger: {
    error: mocks.loggerError,
    info: mocks.loggerInfo,
  },
}))

vi.mock('../../app/model/models.js', () => ({
  default: {
    User: {
      findOne: mocks.userFindOne,
    },
    AccountDetails: {
      findOne: mocks.accountFindOne,
    },
    SavedAddress: {
      findOne: mocks.savedAddressFindOne,
      update: vi.fn(),
      destroy: vi.fn(),
      create: vi.fn(),
    },
  },
}))

const { showEditAddress } = await import('../../app/controllers/addressController.js')

const flushPromises = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('addressController.showEditAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.userFindOne.mockResolvedValue({ id: 42, email: 'person@example.com' })
    mocks.accountFindOne.mockResolvedValue({ telephone: '02070000000', mobileNo: '07123456789' })
    mocks.savedAddressFindOne.mockResolvedValue({
      id: 7,
      country: 'United Kingdom',
      telephone: null,
      mobileNo: null,
      email: null,
    })
    mocks.query.mockResolvedValue([[{ name: 'United Kingdom' }, { name: 'France' }]])
  })

  it('renders the edit address page using countries from the database query', async () => {
    const req = {
      session: {
        email: 'person@example.com',
        initial: false,
        addresses: [],
      },
      query: {
        id: '7',
      },
      flash: vi.fn().mockReturnValue([]),
    }

    const res = {
      render: vi.fn(),
      redirect: vi.fn(),
    }

    showEditAddress(req, res)
    await flushPromises()
    await flushPromises()
    await flushPromises()

    expect(mocks.query).toHaveBeenCalledWith('SELECT  name FROM "country" ORDER BY name ASC ')
    expect(res.render).toHaveBeenCalledTimes(1)
    expect(res.render).toHaveBeenCalledWith(
      'address_pages/edit-address.ejs',
      expect.objectContaining({
        countries: [{ name: 'United Kingdom' }, { name: 'France' }],
        uk: true,
      }),
    )
    expect(res.redirect).not.toHaveBeenCalled()
  })
})
