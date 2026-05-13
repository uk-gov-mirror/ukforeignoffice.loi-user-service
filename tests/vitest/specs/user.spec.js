import { beforeAll, describe, expect, it } from 'vitest'
import { getApp } from '../../../server.js'

beforeAll(() => {
  getApp()
})

describe('Healthcheck is working', () => {
  const port = process.env.PORT ?? 3001
  const url = `http://localhost:${port}/api/user/healthcheck`

  describe('GET /healthcheck', () => {
    it('returns status 200', async () => {
      const response = await fetch(url)
      expect(response.status).toBe(200)
    })

    it('JSON body is correct', async () => {
      const response = await fetch(url)
      const data = await response.json()
      expect(data.message).toBe('User Service is running')
    })
  })
})
