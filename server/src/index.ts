import type { AppEnv } from './types'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authApp } from './auth'
import { verifyJwt } from './jwt'
import { focusSessions, habits, memos, pomodoros, todos } from './schema'

const app = new Hono<AppEnv>()

// 前端 Pages 域名与 Worker 域名不同，需要跨域；开发环境直连线上接口同样依赖此处
app.use('*', cors())

const ok = (result: unknown) => ({ code: 0, message: 'OK', result })

// ---- 鉴权中间件 ----
// /auth/*（注册/登录/站长引导）与根路径健康检查公开，其余一律要求有效 JWT，
// 验证通过后将 userId 注入上下文，业务路由据此做数据隔离
app.use('*', async (c, next) => {
  const path = c.req.path
  if (path === '/' || path.startsWith('/auth/'))
    return next()
  const token = (c.req.header('Authorization') ?? '').replace(/^Bearer /, '')
  const payload = c.env.JWT_SECRET && token ? await verifyJwt(token, c.env.JWT_SECRET) : null
  if (!payload || typeof payload.sub !== 'string')
    return c.json({ code: 1, message: '未授权，请登录', result: null }, 401)
  c.set('userId', payload.sub)
  await next()
})

app.route('/auth', authApp)

app.get('/', c => c.text('focus-app api is running'))

// ---- 番茄闹钟 ----
app.get('/pomodoros', async (c) => {
  const db = drizzle(c.env.DB)
  return c.json(ok(await db.select().from(pomodoros).where(eq(pomodoros.userId, c.get('userId'))).all()))
})
app.post('/pomodoros', async (c) => {
  const body = await c.req.json()
  const values = { id: body.id, userId: c.get('userId'), name: body.name, minutes: body.minutes }
  const db = drizzle(c.env.DB)
  // 先删后插（而非 upsert）：确保 id 冲突时只能覆盖自己名下的行，防止跨租户篡改
  await db.delete(pomodoros).where(and(eq(pomodoros.id, values.id), eq(pomodoros.userId, values.userId)))
  await db.insert(pomodoros).values(values)
  return c.json(ok(body))
})
app.delete('/pomodoros/:id', async (c) => {
  const db = drizzle(c.env.DB)
  await db.delete(pomodoros).where(and(eq(pomodoros.id, c.req.param('id')), eq(pomodoros.userId, c.get('userId'))))
  return c.json(ok(null))
})

// ---- 待办 ----
function toTodo(row: typeof todos.$inferSelect) {
  return { ...row, done: row.done === 1 }
}
app.get('/todos', async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(todos).where(eq(todos.userId, c.get('userId'))).all()
  return c.json(ok(rows.map(toTodo)))
})
app.post('/todos', async (c) => {
  const body = await c.req.json()
  const values = {
    id: body.id,
    userId: c.get('userId'),
    name: body.name,
    date: body.date,
    time: body.time,
    priority: body.priority ?? 0,
    done: body.done ? 1 : 0,
  }
  const db = drizzle(c.env.DB)
  await db.delete(todos).where(and(eq(todos.id, values.id), eq(todos.userId, values.userId)))
  await db.insert(todos).values(values)
  return c.json(ok({ ...values, done: values.done === 1 }))
})
app.delete('/todos/:id', async (c) => {
  const db = drizzle(c.env.DB)
  await db.delete(todos).where(and(eq(todos.id, c.req.param('id')), eq(todos.userId, c.get('userId'))))
  return c.json(ok(null))
})

// ---- 习惯 ----
function toHabit(row: typeof habits.$inferSelect) {
  return { ...row, records: JSON.parse(row.records) as string[] }
}
app.get('/habits', async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(habits).where(eq(habits.userId, c.get('userId'))).all()
  return c.json(ok(rows.map(toHabit)))
})
app.post('/habits', async (c) => {
  const body = await c.req.json()
  const values = {
    id: body.id,
    userId: c.get('userId'),
    name: body.name,
    freq: body.freq,
    records: JSON.stringify(body.records ?? []),
  }
  const db = drizzle(c.env.DB)
  await db.delete(habits).where(and(eq(habits.id, values.id), eq(habits.userId, values.userId)))
  await db.insert(habits).values(values)
  return c.json(ok({ ...values, records: body.records ?? [] }))
})
app.delete('/habits/:id', async (c) => {
  const db = drizzle(c.env.DB)
  await db.delete(habits).where(and(eq(habits.id, c.req.param('id')), eq(habits.userId, c.get('userId'))))
  return c.json(ok(null))
})

// ---- 备忘录 ----
app.get('/memos', async (c) => {
  const db = drizzle(c.env.DB)
  return c.json(ok(await db.select().from(memos).where(eq(memos.userId, c.get('userId'))).all()))
})
app.post('/memos', async (c) => {
  const body = await c.req.json()
  const values = {
    id: body.id,
    userId: c.get('userId'),
    title: body.title ?? '',
    content: body.content ?? '',
    updatedAt: body.updatedAt ?? Date.now(),
  }
  const db = drizzle(c.env.DB)
  await db.delete(memos).where(and(eq(memos.id, values.id), eq(memos.userId, values.userId)))
  await db.insert(memos).values(values)
  return c.json(ok(values))
})
app.delete('/memos/:id', async (c) => {
  const db = drizzle(c.env.DB)
  await db.delete(memos).where(and(eq(memos.id, c.req.param('id')), eq(memos.userId, c.get('userId'))))
  return c.json(ok(null))
})

// ---- 专注记录 ----
app.get('/focus-sessions', async (c) => {
  const db = drizzle(c.env.DB)
  return c.json(ok(await db.select().from(focusSessions).where(eq(focusSessions.userId, c.get('userId'))).all()))
})
app.post('/focus-sessions', async (c) => {
  const body = await c.req.json()
  const values = {
    id: body.id,
    userId: c.get('userId'),
    name: body.name,
    minutes: body.minutes,
    date: body.date,
    at: body.at,
  }
  const db = drizzle(c.env.DB)
  await db.insert(focusSessions).values(values)
  return c.json(ok(values))
})

export default app
