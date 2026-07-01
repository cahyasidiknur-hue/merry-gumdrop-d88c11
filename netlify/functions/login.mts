import type { Config } from '@netlify/functions'
import { login, verifyRequestOrigin } from '@netlify/identity'
import { errorResponse, json, readCredentials, userResponse } from './auth-response.mjs'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed.' }, 405)
  }

  try {
    verifyRequestOrigin(req)
    const { email, password } = await readCredentials(req)
    const user = await login(email, password)

    return userResponse(user, 'Logged in successfully.')
  } catch (error) {
    return errorResponse(error)
  }
}

export const config: Config = {
  method: 'POST',
}
