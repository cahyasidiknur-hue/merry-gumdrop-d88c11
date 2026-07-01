import type { Config } from '@netlify/functions'
import { signup, verifyRequestOrigin } from '@netlify/identity'
import { errorResponse, json, readCredentials, userResponse } from './auth-response.mjs'

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed.' }, 405)
  }

  try {
    verifyRequestOrigin(req)
    const { email, password, fullName } = await readCredentials(req)
    const user = await signup(email, password, fullName ? { full_name: fullName } : undefined)

    return userResponse(
      user,
      user.confirmedAt
        ? 'Account created and logged in successfully.'
        : 'Account created. Check your email to confirm your account.',
    )
  } catch (error) {
    return errorResponse(error)
  }
}

export const config: Config = {
  method: 'POST',
}
