import { HttpError, json, sameOrigin, bodyJson, bytes, secureResponse } from './http.js';
import { login, logout, requireAdmin, limited } from './auth.js';
import { schema, defaults, initialize, state, revision, saveDraft, publish, published, renderPage } from './content.js';

const readOnly = request => ['GET', 'HEAD'].includes(request.method);
async function adminApi(request, env, path) {
  if (!readOnly(request)) sameOrigin(request);
  if (path === '/api/admin/login' && request.method === 'POST') return login(request, env);
  const user = await requireAdmin(request, env);
  if (path === '/api/admin/session' && request.method === 'GET') return json(user);
  if (path === '/api/admin/logout' && request.method === 'POST') return logout(request, env);
  if (!readOnly(request)) await limited(env, 'admin:' + user.email, 120, 60);
  if (path === '/api/admin/content' && request.method === 'GET') {
    await initialize(env);
    return json({ ...(await state(env)), schema, email: user.email });
  }
  if (path === '/api/admin/draft' && request.method === 'PUT') {
    const body = await bodyJson(request);
    return json(await saveDraft(env, body.values, body.version, user.email));
  }
  if (path === '/api/admin/publish' && request.method === 'POST') {
    const body = await bodyJson(request, 2000);
    if (typeof body.draftId !== 'string' || !Number.isSafeInteger(body.version)) throw new HttpError(400, 'Chưa chọn bản nháp hợp lệ.');
    return json(await publish(env, body.draftId, body.version));
  }
  if (path === '/api/admin/history' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT id,label,created_by,created_at FROM revisions ORDER BY created_at DESC LIMIT 60').all();
    return json({ revisions: result.results });
  }
  if (path === '/api/admin/restore' && request.method === 'POST') {
    const body = await bodyJson(request, 2000);
    if (typeof body.revisionId !== 'string') throw new HttpError(400, 'Chưa chọn phiên bản.');
    const selected = await revision(env, body.revisionId);
    return json(await saveDraft(env, selected.values, body.version, user.email, 'Khôi phục từ ' + selected.created_at));
  }
  if (path === '/api/admin/media' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM media ORDER BY created_at DESC LIMIT 100').all();
    return json({ media: result.results.map(item => ({ ...item, url: '/media/' + item.id })) });
  }
  if (path === '/api/admin/media' && request.method === 'POST') {
    const data = await bytes(request, 8 * 1024 * 1024);
    const type = request.headers.get('content-type')?.split(';')[0];
    const signature = [...data.slice(0, 12)].map(n => String.fromCharCode(n)).join('');
    const valid = (type === 'image/png' && [137,80,78,71,13,10,26,10].every((n,i) => data[i] === n))
      || (type === 'image/jpeg' && data[0] === 255 && data[1] === 216 && data[2] === 255)
      || (type === 'image/webp' && signature.startsWith('RIFF') && signature.slice(8,12) === 'WEBP');
    if (!valid) throw new HttpError(415, 'Chỉ nhận PNG, JPEG hoặc WebP hợp lệ, tối đa 8 MB.');
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[type];
    const id = crypto.randomUUID() + '.' + ext;
    let name; try { name = decodeURIComponent(request.headers.get('x-file-name') || 'image.' + ext).slice(0,200); } catch { throw new HttpError(400, 'Tên ảnh không hợp lệ.'); }
    await env.MEDIA.put(id, data, { httpMetadata: { contentType: type } });
    try { await env.DB.prepare('INSERT INTO media(id,original_name,content_type,size) VALUES(?,?,?,?)').bind(id, name, type, data.byteLength).run(); }
    catch (error) { await env.MEDIA.delete(id); throw error; }
    return json({ id, url: '/media/' + id, original_name: name }, 201);
  }
  if (path === '/api/admin/leads' && request.method === 'GET') {
    const result = await env.DB.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 200').all();
    return json({ leads: result.results });
  }
  if (path === '/api/admin/leads' && request.method === 'PATCH') {
    const body = await bodyJson(request, 2000);
    if (typeof body.id !== 'string' || !['new','contacted','closed'].includes(body.status)) throw new HttpError(400, 'Trạng thái không hợp lệ.');
    const result = await env.DB.prepare('UPDATE leads SET status=? WHERE id=?').bind(body.status, body.id).run();
    if (!result.meta.changes) throw new HttpError(404, 'Không tìm thấy yêu cầu.');
    return json({ ok: true });
  }
  throw new HttpError(404, 'Không tìm thấy chức năng.');
}
async function receiveLead(request, env) {
  sameOrigin(request);
  const body = await bodyJson(request, 5000);
  await limited(env, 'lead:' + (request.headers.get('cf-connecting-ip') || 'local'), 5, 3600);
  if (body.website) throw new HttpError(400, 'Không thể tiếp nhận yêu cầu này.');
  if (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.length > 120
    || typeof body.phone !== 'string' || !/^[+\d\s().-]{8,25}$/.test(body.phone) || body.phone.replace(/\D/g,'').length < 8
    || typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
    || body.consent !== true) throw new HttpError(400, 'Vui lòng kiểm tra họ tên, số điện thoại, email và đồng ý cho liên hệ tư vấn.');
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO leads(id,name,phone,email) VALUES(?,?,?,?)').bind(id, body.name.trim(), body.phone.trim(), body.email.trim()).run();
  return json({ id, message: 'Đã nhận đăng ký tư vấn của bạn. Cảm ơn bạn đã quan tâm Sun Saphia Residence.' }, 201);
}
async function route(request, env, ctx) {
  const url = new URL(request.url), path = url.pathname;
  if (path.startsWith('/api/admin/')) return adminApi(request, env, path);
  if (path === '/api/leads' && request.method === 'POST') return receiveLead(request, env);
  if (!readOnly(request)) throw new HttpError(405, 'Phương thức không được hỗ trợ.');
  if (path === '/preview') {
    await requireAdmin(request, env);
    const draft = await state(env);
    return renderPage(request, env, draft.values, true);
  }
  if (path === '/admin' || path === '/admin/') return env.ASSETS.fetch(new Request(new URL('/admin/index.html', request.url)));
  if (path.startsWith('/media/')) {
    const id = path.slice(7);
    if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(id)) throw new HttpError(404, 'Không tìm thấy ảnh.');
    const object = await env.MEDIA.get(id);
    if (!object) throw new HttpError(404, 'Không tìm thấy ảnh.');
    const headers = new Headers({ 'cache-control': 'public, max-age=31536000, immutable' });
    object.writeHttpMetadata(headers); headers.set('etag', object.httpEtag);
    return new Response(object.body, { headers });
  }
  if (path === '/robots.txt') {
    let sitemap = ''; try { if (new URL(env.SITE_ORIGIN).origin === url.origin) sitemap = `\nSitemap: ${url.origin}/sitemap.xml\n`; } catch {}
    return new Response(`User-agent: *\nDisallow: /admin\nDisallow: /api/\nDisallow: /preview\n${!sitemap ? 'Disallow: /\n' : sitemap}`, { headers: { 'content-type': 'text/plain' } });
  }
  if (path === '/sitemap.xml') {
    let origin; try { origin = new URL(env.SITE_ORIGIN).origin; } catch { throw new HttpError(404, 'Chưa cấu hình tên miền.'); }
    if (origin !== url.origin) throw new HttpError(404, 'Không tìm thấy sitemap tại tên miền này.');
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin.replaceAll('&','&amp;')}/</loc></url></urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
  }
  if (path === '/index.html') return Response.redirect(url.origin + '/', 301);
  if (path === '/') {
    const cache = caches.default, cacheKey = new Request(url.origin + '/__cms-last-published');
    let content;
    try { content = await published(env); }
    catch (error) {
      const backup = await cache.match(cacheKey);
      if (backup) { const headers = new Headers(backup.headers); headers.set('cache-control','no-cache'); headers.set('x-content-status','last-published'); return new Response(backup.body, { headers }); }
      throw error;
    }
    const response = await renderPage(request, env, content.values);
    const headers = new Headers(response.headers); headers.set('cache-control','public, max-age=86400');
    ctx.waitUntil(cache.put(cacheKey, new Response(response.clone().body, { status: response.status, headers })));
    return response;
  }
  if (path.startsWith('/__cms')) throw new HttpError(404, 'Không tìm thấy trang.');
  return env.ASSETS.fetch(request);
}
export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    const privatePage = path.startsWith('/admin') || path.startsWith('/api') || path === '/preview';
    try {
      let response = await route(request, env, ctx);
      if (request.method === 'HEAD') response = new Response(null, { status: response.status, headers: response.headers });
      return secureResponse(response, { privatePage });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 503;
      // Never log submitted content, passwords, session cookies or lead contact details.
      if (!(error instanceof HttpError)) console.error('CMS request failed', { path, errorType: error?.name || 'Error' });
      return secureResponse(json({ error: error instanceof HttpError ? error.message : 'Máy chủ tạm thời chưa xử lý được yêu cầu. Nội dung của bạn chưa được xác nhận đã lưu.' }, status), { privatePage: true });
    }
  }
};
