import type { AppEnv } from './types'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { focusSessions, habits, memos, pomodoros, todos } from './schema'

const app = new Hono<AppEnv>()

// 前端 Pages 域名与 Worker 域名不同，需要跨域；开发环境走 vite 代理不受影响
app.use('*', cors())

// 可选鉴权：wrangler.jsonc 里配置了 AUTH_TOKEN 后，所有请求需带 Authorization: Bearer <token>
app.use('*', async (c, next) => {
  const required = c.env.AUTH_TOKEN
  if (required) {
    const auth = c.req.header('Authorization') ?? ''
    if (auth !== `Bearer ${required}`)
      return c.json({ code: 1, message: '未授权，请登录', result: null }, 401)
  }
  await next()
})

// 统一返回 { code: 0, message: 'OK', result } 结构，与前端 http 拦截器约定一致
const ok = (result: unknown) => ({ code: 0, message: 'OK', result })

// ---- 番茄闹钟 ----
app.get('/pomodoros', async (c) => {
  const db = drizzle(c.env.DB)
  return c.json(ok(await db.select().from(pomodoros).all()))
})
app.post('/pomodoros', async (c) => {
  const body = await c.req.json()
  const values = { id: body.id, name: body.name, minutes: body.minutes }
  const db = drizzle(c.env.DB)
  await db.insert(pomodoros).values(values).onConflictDoUpdate({ target: pomodoros.id, set: values })
  return c.json(ok(body))
})
app.delete('/pomodoros/:id', async (c) => {
  const db = drizzle(c.env.DB)
  await db.delete(pomodoros).where(eq(pomodoros.id, c.req.param('id')))
  return c.json(ok(null))
})

// ---- 待办 ----
function toTodo(row: typeof todos.$inferSelect) {
  return { ...row, done: row.done === 1 }
}
app.get('/todos', async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(todos).all()
  return c.json(ok(rows.map(toTodo)))
})
app.post('/todos', async (c) => {
  const body = await c.req.json()
  const values = {
    id: body.id,
    name: body.name,
    date: body.date,
    time: body.time,
    priority: body.priority ?? 0,
    done: body.done ? 1 : 0,
  }
  const db = drizzle(c.env.DB)
  await db.insert(todos).values(values).onConflictDoUpdate({ target: todos.id, set: values })
  return c.json(ok({ ...values, done: values.done === 1 }))
})
app.delete('/todos/:id', async (c) => {
  const db = drizzle(c.env.DB)
  await db.delete(todos).where(eq(todos.id, c.req.param('id')))
  return c.json(ok(null))
})

// ---- 习惯 ----
function toHabit(row: typeof habits.$inferSelect) {
  return { ...row, records: JSON.parse(row.records) as string[] }
}
app.get('/habits', async (c) => {
  const db = drizzle(c.env.DB)
  const rows = await db.select().from(habits).all()
  return c.json(ok(rows.map(toHabit)))
})
app.post('/habits', async (c) => {
  const body = await c.req.json()
  const values = {
    id: body.id,
    name: body.name,
    freq: body.freq,
    records: JSON.stringify(body.records ?? []),
  }
  const db = drizzle(c.env.DB)
  await db.insert(habits).values(values).onConflictDoUpdate({ target: habits.id, set: values })
  return c.json(ok({ ...values, records: body.records ?? [] }))
})
app.delete('/habits/:id', async (c) => {
  const db = drizzle(c.env.DB)
  await db.delete(habits).where(eq(habits.id, c.req.param('id')))
  return c.json(ok(null))
})

// ---- 备忘录 ----
app.get('/memos', async (c) => {
  const db = drizzle(c.env.DB)
  return c.json(ok(await db.select().from(memos).all()))
})
app.post('/memos', async (c) => {
  const body = await c.req.json()
  const values = {
    id: body.id,
    title: body.title ?? '',
    content: body.content ?? '',
    updatedAt: body.updatedAt ?? Date.now(),
  }
  const db = drizzle(c.env.DB)
  await db.insert(memos).values(values).onConflictDoUpdate({ target: memos.id, set: values })
  return c.json(ok(values))
})
app.delete('/memos/:id', async (c) => {
  const db = drizzle(c.env.DB)
  await db.delete(memos).where(eq(memos.id, c.req.param('id')))
  return c.json(ok(null))
})

// ---- 专注记录 ----
app.get('/focus-sessions', async (c) => {
  const db = drizzle(c.env.DB)
  return c.json(ok(await db.select().from(focusSessions).all()))
})
app.post('/focus-sessions', async (c) => {
  const body = await c.req.json()
  const values = {
    id: body.id,
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
