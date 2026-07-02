import { AuthError, MissingIdentityError, type User } from '@netlify/identity'

export type CredentialsPayload = {
  email?: unknown
  password?: unknown
  fullName?: unknown
  name?: unknown
}

export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

export async function readCredentials(req: Request): Promise<{
  email: string
  password: string
  fullName?: string
}> {
  let payload: CredentialsPayload

  try {
    payload = (await req.json()) as CredentialsPayload
  } catch {
    throw new RequestError('Request body must be valid JSON.')
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const password = typeof payload.password === 'string' ? payload.password : ''
  const fullNameValue = typeof payload.fullName === 'string' ? payload.fullName : payload.name
  const fullName = typeof fullNameValue === 'string' ? fullNameValue.trim() : ''

  if (!email || !password) {
    throw new RequestError('Email and password are required.')
  }

  return {
    email,
    password,
    ...(fullName ? { fullName } : {}),
  }
}

export function userResponse(user: User, message: string): Response {
  return json({
    ok: true,
    message,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: Boolean(user.confirmedAt),
      roles: user.roles ?? [],
    },
  })
}

export function errorResponse(error: unknown): Response {
  if (error instanceof RequestError) {
    return json({ ok: false, error: error.message }, 400)
  }

  if (error instanceof MissingIdentityError) {
    return json({ ok: false, error: 'Identity is not enabled for this site.' }, 503)
  }

  if (error instanceof AuthError) {
    const status = error.status && error.status >= 400 ? error.status : 400
    return json({ ok: false, error: error.message }, status)
  }

  return json({ ok: false, error: 'Authentication request failed.' }, 500)
}

class RequestError extends Error {}
