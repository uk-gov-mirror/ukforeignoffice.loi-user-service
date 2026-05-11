let expect
let ejs
let path

before('Setup', async function () {
  const chai = await import('chai')
  expect = chai.expect
  ejs = require('ejs')
  path = require('path')
})

function buildBaseLocals(overrides = {}) {
  return {
    isAuthenticated: true,
    user: {
      id: 1,
      email: 'user@example.com',
      isAdmin: true,
      mfaPreference: 'Email',
    },
    account: {
      first_name: 'Test',
      last_name: 'User',
      telephone: '01632 960001',
      mobileNo: '07700900982',
    },
    url: {
      applicationServiceURL: '/api/user/',
    },
    info: [],
    company_info: [],
    error: null,
    _csrf: 'test-csrf-token',
    piwikID: 1,
    feedbackURL: '/feedback',
    service_public: true,
    start_url: '/start',
    govuk_url: 'https://www.gov.uk',
    caseManagementSystem: false,
    ...overrides,
  }
}

async function renderView(viewRelativePath, locals) {
  const filename = path.join(__dirname, '..', '..', 'views', viewRelativePath)
  return ejs.renderFile(filename, locals)
}

describe('Header Back Link Rendering', function () {
  it('does not render an inner-header back link on /admin', async function () {
    const html = await renderView('account_pages/admin.ejs', buildBaseLocals())
    expect(html).to.not.include('govuk-back-link inner-header-back-link')
  })

  it('does not render an inner-header back link on /account', async function () {
    const html = await renderView('account_pages/account.ejs', buildBaseLocals())
    expect(html).to.not.include('govuk-back-link inner-header-back-link')
  })

  it('does not render an inner-header back link on /addresses', async function () {
    const html = await renderView('account_pages/addresses.ejs', buildBaseLocals({ addresses: [] }))
    expect(html).to.not.include('govuk-back-link inner-header-back-link')
  })

  it('renders an inner-header back link on /admin-search-email', async function () {
    const html = await renderView('account_pages/admin-search-email.ejs', buildBaseLocals({ searchResults: null }))
    expect(html).to.include('class="govuk-back-link inner-header-back-link"')
    expect(html).to.include('href="/api/user/admin"')
  })

  it('renders inner header navigation links for authenticated account pages', async function () {
    const html = await renderView('account_pages/account.ejs', buildBaseLocals())
    expect(html).to.include('id="Account-Link"')
    expect(html).to.include('id="Addresses-Link"')
    expect(html).to.include('id="sign-out-link"')
  })

  it('renders standard back link for unauthenticated pages when innerHeaderBackLink is set', async function () {
    const html = await renderView(
      'forgot.ejs',
      buildBaseLocals({
        isAuthenticated: false,
        user: null,
        account: null,
        message: [],
        locked: false,
      }),
    )
    expect(html).to.include('class="govuk-back-link"')
    expect(html).to.not.include('inner-header-back-link')
    expect(html).to.not.include('id="Account-Link"')
  })

  it('does not render any back link on unauthenticated pages without innerHeaderBackLink', async function () {
    const html = await renderView(
      'session-expired.ejs',
      buildBaseLocals({
        isAuthenticated: false,
        user: null,
        account: null,
        startNewApplicationUrl: '/start-new',
      }),
    )
    expect(html).to.not.include('class="govuk-back-link"')
  })
})
