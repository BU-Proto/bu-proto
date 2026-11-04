import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../types'
import { ApiError } from './http'

/** Public form endpoints: FORM_LIMITER allows 10 submissions a minute per IP. */
export const limitForms: MiddlewareHandler<AppEnv> = async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? 'local'
  const { success } = await c.env.FORM_LIMITER.limit({ key: `${new URL(c.req.url).pathname}:${ip}` })
  if (!success) throw new ApiError(429, 'Too many tries. Wait a minute and try again.')
  await next()
}
