// JWT（HS256）与 PBKDF2 密码哈希：全部基于 Workers 原生 crypto.subtle，无第三方依赖

const enc = new TextEncoder()

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = ''
  bytes.forEach(b => bin += String.fromCharCode(b))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - b64.length % 4) % 4))
  return Uint8Array.from(bin, c => c.charCodeAt(0))
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

export async function signJwt(payload: Record<string, unknown>, secret: string, expiresInSeconds = 7 * 24 * 3600): Promise<string> {
  const header = base64UrlEncode(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = base64UrlEncode(enc.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds })))
  const data = `${header}.${body}`
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return `${data}.${base64UrlEncode(new Uint8Array(sig))}`
}

export async function verifyJwt(token: string, secret: string): Promise<Record<string, any> | null> {
  const parts = token.split('.')
  if (parts.length !== 3)
    return null
  try {
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const valid = await crypto.subtle.verify('HMAC', key, base64UrlDecode(parts[2]), enc.encode(`${parts[0]}.${parts[1]}`))
    if (!valid)
      return null
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])))
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000))
      return null
    return payload
  }
  catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256)
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  if (!saltHex || !hashHex)
    return false
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: 100000 }, key, 256)
  const computed = toHex(new Uint8Array(bits))
  // 常量时间比较，避免时序侧信道
  if (computed.length !== hashHex.length)
    return false
  let diff = 0
  for (let i = 0; i < hashHex.length; i++) diff |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i)
  return diff === 0
}
