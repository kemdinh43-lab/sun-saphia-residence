export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
}
export function sameOrigin(request) {
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new HttpError(403, 'Yêu cầu không đến từ website này. Vui lòng tải lại trang.');
  }
}
export async function bytes(request, maximum) {
  if (Number(request.headers.get('content-length')) > maximum) throw new HttpError(413, 'Dữ liệu vượt quá dung lượng cho phép.');
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > maximum) { await reader.cancel(); throw new HttpError(413, 'Dữ liệu vượt quá dung lượng cho phép.'); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const output = new Uint8Array(size); let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}
export async function bodyJson(request, maximum = 300000) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'Yêu cầu cần dùng JSON.');
  try { const value = JSON.parse(new TextDecoder().decode(await bytes(request, maximum))); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); return value; }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'Dữ liệu JSON không hợp lệ.'); }
}
export function secureResponse(response, { privatePage = false } = {}) {
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-frame-options', 'SAMEORIGIN');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('content-security-policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; media-src 'self'; font-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com https://www.youtube.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'");
  if (privatePage) { headers.set('cache-control', 'private, no-store'); headers.set('x-robots-tag', 'noindex, nofollow'); }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
