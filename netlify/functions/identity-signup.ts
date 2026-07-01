import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const { user } = JSON.parse(event.body || '{}')

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        ...user?.app_metadata,
        roles: ['user'],
      },
      user_metadata: {
        ...user?.user_metadata,
        signed_up_at: new Date().toISOString(),
      },
    }),
  }
}

export { handler }
