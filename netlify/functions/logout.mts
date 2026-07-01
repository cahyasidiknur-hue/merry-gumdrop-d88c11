import type { Config } from '@netlify/functions'
import { logout, verifyRequestOrigin } from '@netlify/identity'
import { errorResponse, json } from './auth-response.mjs'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed.' }, 405)
  }

  try {
    verifyRequestOrigin(req)
    await logout()

    return json({ ok: true, message: 'Logged out successfully.' })
  } catch (error) {
    return errorResponse(error)
  }
}

export const config: Config = {
  method: 'POST',
}
