import type { AppEnv } from './types'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import { focusSessions, habits, memos, pomodoros, todos, users } from './schema'
import { hashPassword, signJwt, verifyPassword } from './jwt'

export const authApp = new Hono<AppEnv>()

const ok = (result: unknown) => ({ code: 0, message: 'OK', result })
const fail = (message: string) => ({ code: 1, message, result: null })

function validate(username: unknown, password: unknown): string | null {
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,20}$/.test(username))
    return '用户名需为 3-20 位字母、数字或下划线'
  if (typeof password !== 'string' || password.length < 6 || password.length > 64)
    return '密码长度需为 6-64 位'
  return null
}

// 注册（公开）：新用户各自拥有独立数据空间，不继承任何历史数据
authApp.post('/register', async (c) => {
  if (!c.env.JWT_SECRET)
    return c.json(fail('服务端未配置 JWT_SECRET'))
  const body = await c.req.json()
  const invalid = validate(body.username, body.password)
  if (invalid)
    return c.json(fail(invalid))
  const db = drizzle(c.env.DB)
  if (await db.select().from(users).where(eq(users.username, body.username)).get())
    return c.json(fail('用户名已被注册'))
  const id = crypto.randomUUID()
  await db.insert(users).values({ id, username: body.username, passwordHash: await hashPassword(body.password), createdAt: Date.now() })
  return c.json(ok({ token: await signJwt({ sub: id, name: body.username }, c.env.JWT_SECRET), username: body.username }))
})

// 登录
authApp.post('/login', async (c) => {
  if (!c.env.JWT_SECRET)
    return c.json(fail('服务端未配置 JWT_SECRET'))
  const body = await c.req.json()
  const db = drizzle(c.env.DB)
  const user = typeof body.username === 'string'
    ? await db.select().from(users).where(eq(users.username, body.username)).get()
    : undefined
  if (!user || typeof body.password !== 'string' || !(await verifyPassword(body.password, user.passwordHash)))
    return c.json(fail('用户名或密码错误'))
  return c.json(ok({ token: await signJwt({ sub: user.id, name: user.username }, c.env.JWT_SECRET), username: user.username }))
})

// 站长引导：仅持旧单租户令牌（AUTH_TOKEN）可调用；创建的账号继承全部历史数据。
// 历史数据 user_id 为空串，划归站长后即完成单租户 → 多用户的迁移。
authApp.post('/setup', async (c) => {
  if (!c.env.AUTH_TOKEN || c.req.header('Authorization') !== `Bearer ${c.env.AUTH_TOKEN}`)
    return c.json(fail('未授权'), 401)
  const body = await c.req.json()
  const invalid = validate(body.username, body.password)
  if (invalid)
    return c.json(fail(invalid))
  const db = drizzle(c.env.DB)
  if (await db.select().from(users).where(eq(users.username, body.username)).get())
    return c.json(fail('用户名已被注册'))
  const id = crypto.randomUUID()
  await db.insert(users).values({ id, username: body.username, passwordHash: await hashPassword(body.password), createdAt: Date.now() })
  await db.update(pomodoros).set({ userId: id }).where(eq(pomodoros.userId, ''))
  await db.update(todos).set({ userId: id }).where(eq(todos.userId, ''))
  await db.update(habits).set({ userId: id }).where(eq(habits.userId, ''))
  await db.update(memos).set({ userId: id }).where(eq(memos.userId, ''))
  await db.update(focusSessions).set({ userId: id }).where(eq(focusSessions.userId, ''))
  return c.json(ok({ username: body.username, claimed: 'legacy data assigned' }))
})
