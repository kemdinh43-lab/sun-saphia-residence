import { HttpError, json, sameOrigin, bodyJson, bytes, secureResponse } from './http.js';
import { login, logout, requireAdmin, limited } from './auth.js';
import { schema, defaults, initialize, state, revision, saveDraft, publish, published, renderPage } from './content.js';
import sections from './sections.json' with { type: 'json' };
import { listPosts, getPost, savePost, publishPost, publicPosts, articleCard, blogPage, renderArticle } from './posts.js';

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
    return json({ ...(await state(env)), schema, sections, email: user.email });
  }
  if(path==='/api/admin/posts'&&request.method==='GET')return json({posts:await listPosts(env)});
  if(path==='/api/admin/posts'&&request.method==='POST')return json(await savePost(env,await bodyJson(request,350000),user.email),201);
  if(path==='/api/admin/posts/publish'&&request.method==='POST')return json(await publishPost(env,await bodyJson(request,2000)));
  if(path==='/api/admin/posts/unpublish'&&request.method==='POST') {
    const body=await bodyJson(request,2000);
    if(typeof body.id!=='string'||!Number.isSafeInteger(body.version))throw new HttpError(400,'Phiên bản bài viết không hợp lệ.');
    const result=await env.DB.prepare('UPDATE posts SET published_id=NULL,version=version+1 WHERE id=? AND version=?').bind(body.id,body.version).run();
    if(result.meta.changes!==1)throw new HttpError(409,'Bài viết đã thay đổi. Hãy tải lại.');
    return json(await getPost(env,body.id));
  }
  const postMatch=path.match(/^\/api\/admin\/posts\/([a-f0-9-]{36})(?:\/(history|restore))?$/);
  if(postMatch) {
    const [,id,action]=postMatch;
    if(!action&&request.method==='GET')return json(await getPost(env,id));
    if(action==='history'&&request.method==='GET') {
      const result=await env.DB.prepare('SELECT id,created_at,created_by FROM post_revisions WHERE post_id=? ORDER BY created_at DESC LIMIT 40').bind(id).all();
      return json({revisions:result.results});
    }
    if(action==='restore'&&request.method==='POST') {
      const body=await bodyJson(request,2000);
      if(typeof body.revisionId!=='string')throw new HttpError(400,'Chưa chọn phiên bản.');
      const row=await env.DB.prepare('SELECT content FROM post_revisions WHERE id=? AND post_id=?').bind(body.revisionId,id).first();
      if(!row)throw new HttpError(404,'Không tìm thấy phiên bản.');
      return json(await savePost(env,{id,version:body.version,values:JSON.parse(row.content)},user.email));
    }
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
    return renderPage(request, env, draft.values, true,(await publicPosts(env,3)).map(articleCard).join(''));
  }
  const postPreview=path.match(/^\/preview\/bai-viet\/([a-f0-9-]{36})$/);
  if(postPreview){await requireAdmin(request,env);return renderArticle(request,env,await getPost(env,postPreview[1]),true);}
  if(path==='/bai-viet'||path==='/bai-viet/') {
    if(path.endsWith('/'))return Response.redirect(url.origin+'/bai-viet',301);
    const posts=await publicPosts(env);
    return blogPage(request,env,{title:'Tin tức & góc nhìn | Sun Saphia Residence',description:'Câu chuyện kiến trúc, tiến độ và thông tin Sun Saphia Residence.',body:`<p class="blog-category">TIN TỨC & GÓC NHÌN</p><h1>Câu chuyện Sun Saphia</h1><div class="blog-grid">${posts.length?posts.map(articleCard).join(''):'<p class="blog-empty">Nội dung đang được cập nhật. Bạn có thể liên hệ để nhận thông tin dự án.</p>'}</div>`,path:'/bai-viet'});
  }
  const postPath=path.match(/^\/bai-viet\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if(postPath) {
    const row=await env.DB.prepare('SELECT p.id,p.slug,p.published_at,r.created_at AS updated_at,r.content FROM posts p JOIN post_revisions r ON r.id=p.published_id WHERE p.slug=?').bind(postPath[1]).first();
    if(row)return renderArticle(request,env,{...row,values:JSON.parse(row.content)});
    return blogPage(request,env,{title:'Không tìm thấy bài viết | Sun Saphia',description:'Bài viết chưa được xuất bản hoặc không còn công khai.',body:'<h1>Không tìm thấy bài viết</h1><p>Bài viết chưa được xuất bản hoặc không còn công khai.</p><a href="/bai-viet">Về trang tin tức</a>',path,status:404});
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
    const posts=await publicPosts(env,1000);
    const urls=['/','/bai-viet',...posts.map(post=>'/bai-viet/'+post.slug)];
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(path=>`<url><loc>${origin.replaceAll('&','&amp;')}${path}</loc></url>`).join('')}</urlset>`, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
  }
  if (path === '/index.html') return Response.redirect(url.origin + '/', 301);
  if (path === '/') {
    const cache = caches.default, cacheKey = new Request(url.origin + '/__cms-last-published');
    let content,postCards;
    try { content = await published(env);postCards=(await publicPosts(env,3)).map(articleCard).join(''); }
    catch (error) {
      const backup = await cache.match(cacheKey);
      if (backup) { const headers = new Headers(backup.headers); headers.set('cache-control','no-cache'); headers.set('x-content-status','last-published'); return new Response(backup.body, { headers }); }
      throw error;
    }
    const response = await renderPage(request, env, content.values,false,postCards);
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
    const privatePage = path.startsWith('/admin') || path.startsWith('/api') || path === '/preview' || path.startsWith('/preview/');
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
