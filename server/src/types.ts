export interface Bindings {
  DB: D1Database
  AUTH_TOKEN?: string
}

export type AppEnv = {
  Bindings: Bindings
}
