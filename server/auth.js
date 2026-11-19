import { HttpError, json, bodyJson } from './http.js';
const encoder = new TextEncoder();
export const hex = value => [...new Uint8Array(value)].map(v => v.toString(16).padStart(2, '0')).join('');
export async function digest(value) { return hex(await crypto.subtle.digest('SHA-256', encoder.encode(value))); }
export function equal(a, b) { if (a.length !== b.length) return false; let different = 0; for (let i = 0; i < a.length; i++) different |= a.charCodeAt(i) ^ b.charCodeAt(i); return different === 0; }
export async function passwordHash(password, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000 }, key, 256);
  return `pbkdf2$100000$${salt}$${hex(bits)}`;
}
export async function limited(env, key, limit, seconds) {
  const now = Math.floor(Date.now() / 1000), windowStart = Math.floor(now / seconds) * seconds;
  const bucket = await digest(key);
  const row = await env.DB.prepare(`INSERT INTO login_limits(key,attempts,window_start) VALUES(?,1,?)
    ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN window_start=excluded.window_start THEN attempts+1 ELSE 1 END,window_start=excluded.window_start RETURNING attempts`).bind(bucket, windowStart).first();
  if (row.attempts > limit) throw new HttpError(429, 'Bạn thao tác quá nhiều lần. Vui lòng thử lại sau.');
}
function cookie(request, token, seconds) {
  return `saphia_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export async function session(request, env) {
  const token = request.headers.get('cookie')?.match(/(?:^|;\s*)saphia_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  return env.DB.prepare('SELECT email FROM sessions WHERE token_hash=? AND expires_at>?').bind(await digest(token), Date.now()).first();
}
export async function requireAdmin(request, env) {
  const user = await session(request, env);
  if (!user || !env.ADMIN_EMAIL || user.email !== env.ADMIN_EMAIL.toLowerCase()) throw new HttpError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  return user;
}
export async function login(request, env) {
  if (!env.ADMIN_EMAIL || !/^pbkdf2\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(env.ADMIN_PASSWORD_HASH || '')) throw new HttpError(503, 'Chưa cấu hình tài khoản quản trị trên máy chủ.');
  await limited(env, 'login:' + (request.headers.get('cf-connecting-ip') || 'local'), 10, 900);
  const { email, password } = await bodyJson(request, 3000);
  if (typeof email !== 'string' || typeof password !== 'string' || password.length > 256) throw new HttpError(400, 'Thông tin đăng nhập không hợp lệ.');
  const computed = await passwordHash(password, env.ADMIN_PASSWORD_HASH.split('$')[2]);
  if (!equal(computed, env.ADMIN_PASSWORD_HASH) || email.trim().toLowerCase() !== env.ADMIN_EMAIL.toLowerCase()) throw new HttpError(401, 'Email hoặc mật khẩu không đúng.');
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()),
    env.DB.prepare('DELETE FROM login_limits WHERE window_start<?').bind(Math.floor(Date.now()/1000)-86400),
    env.DB.prepare('INSERT INTO sessions(token_hash,email,expires_at) VALUES(?,?,?)').bind(await digest(token), email.trim().toLowerCase(), Date.now() + 8 * 3600000)
  ]);
  return json({ email: email.trim().toLowerCase() }, 200, { 'set-cookie': cookie(request, token, 8 * 3600) });
}
export async function logout(request, env) {
  const token = request.headers.get('cookie')?.match(/saphia_session=([a-f0-9]{64})/)?.[1];
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();
  return json({ ok: true }, 200, { 'set-cookie': cookie(request, '', 0) });
}
