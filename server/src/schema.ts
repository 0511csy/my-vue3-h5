import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 表结构与前端 src/store/modules/focus-app.ts 中的 interface 一一对应

// 用户表：密码为 PBKDF2-SHA256（10 万次迭代）哈希，格式 `salt:hash`（均为 hex）
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const pomodoros = sqliteTable('pomodoros', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  name: text('name').notNull(),
  minutes: integer('minutes').notNull(),
})

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  name: text('name').notNull(),
  date: text('date').notNull(), // yyyy-MM-dd
  time: text('time').notNull(), // HH:mm
  priority: integer('priority').notNull().default(0),
  done: integer('done').notNull().default(0), // 0/1，返回时转为 boolean
})

export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  name: text('name').notNull(),
  freq: text('freq').notNull(),
  records: text('records').notNull().default('[]'), // JSON 字符串数组，如 ["2026-10-01"]
})

export const memos = sqliteTable('memos', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  title: text('title').notNull().default(''),
  content: text('content').notNull().default(''),
  updatedAt: integer('updated_at').notNull(),
})

export const focusSessions = sqliteTable('focus_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().default(''),
  name: text('name').notNull(),
  minutes: integer('minutes').notNull(),
  date: text('date').notNull(), // yyyy-MM-dd
  at: integer('at').notNull(), // 完成时间戳
})
