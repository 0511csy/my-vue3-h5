export type AppEnv = {
  Bindings: {
    DB: D1Database
    /** 站长引导令牌：仅用于 /auth/setup 创建站长账号并继承历史数据 */
    AUTH_TOKEN?: string
    /** JWT 签名密钥：通过 wrangler secret put JWT_SECRET 配置 */
    JWT_SECRET?: string
  }
  Variables: {
    userId: string
  }
}
