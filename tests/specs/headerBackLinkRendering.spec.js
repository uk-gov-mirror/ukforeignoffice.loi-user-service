import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ejs from 'ejs'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

function renderView(viewRelativePath, locals) {
  const filename = path.join(__dirname, '..', '..', 'views', viewRelativePath)
  return ejs.renderFile(filename, locals)
}

describe('Header Back Link Rendering', () => {
  it('does not render an inner-header back link on /admin', async () => {
    const html = await renderView('account_pages/admin.ejs', buildBaseLocals())
    expect(html).not.toContain('govuk-back-link inner-header-back-link')
  })

  it('does not render an inner-header back link on /account', async () => {
    const html = await renderView('account_pages/account.ejs', buildBaseLocals())
    expect(html).not.toContain('govuk-back-link inner-header-back-link')
  })

  it('does not render an inner-header back link on /addresses', async () => {
    const html = await renderView('account_pages/addresses.ejs', buildBaseLocals({ addresses: [] }))
    expect(html).not.toContain('govuk-back-link inner-header-back-link')
  })

  it('renders an inner-header back link on /admin-search-email', async () => {
    const html = await renderView('account_pages/admin-search-email.ejs', buildBaseLocals({ searchResults: null }))
    expect(html).toContain('class="govuk-back-link inner-header-back-link"')
    expect(html).toContain('href="/api/user/admin"')
  })

  it('renders inner header navigation links for authenticated account pages', async () => {
    const html = await renderView('account_pages/account.ejs', buildBaseLocals())
    expect(html).toContain('id="Account-Link"')
    expect(html).toContain('id="Addresses-Link"')
    expect(html).toContain('id="sign-out-link"')
  })

  it('renders standard back link for unauthenticated pages when innerHeaderBackLink is set', async () => {
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
    expect(html).toContain('class="govuk-back-link"')
    expect(html).not.toContain('inner-header-back-link')
    expect(html).not.toContain('id="Account-Link"')
  })

  it('does not render any back link on unauthenticated pages without innerHeaderBackLink', async () => {
    const html = await renderView(
      'session-expired.ejs',
      buildBaseLocals({
        isAuthenticated: false,
        user: null,
        account: null,
        startNewApplicationUrl: '/start-new',
      }),
    )
    expect(html).not.toContain('class="govuk-back-link"')
  })
})
