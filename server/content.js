import schema from './content-schema.json' with { type: 'json' };
import { HttpError } from './http.js';
export { schema };
export const defaults = Object.fromEntries(schema.map(field => [field.key, field.default]));
const storedValues = value => ({ ...defaults, ...JSON.parse(value) });
export function imageUrl(value) {
  if (/^(?:\/?assets\/[a-zA-Z0-9_./%()-]+|\/media\/[a-f0-9-]+\.(?:png|jpg|webp))$/.test(value)) {
    try { if (!decodeURIComponent(value).includes('..')) return true; } catch {}
  }
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && value.length <= 1000; } catch { return false; }
}
export function videoId(value) {
  try {
    const url = new URL(value); let id;
    if (url.protocol !== 'https:') return null;
    if (['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(url.hostname)) id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts)\/([\w-]{11})\/?$/)?.[1];
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
export function validateContent(input) {
  if (!input || Array.isArray(input) || typeof input !== 'object') throw new HttpError(400, 'Nội dung không hợp lệ.');
  const output = {};
  for (const field of schema) {
    const value = input[field.key];
    if (typeof value !== 'string' || value.length > field.maxLength || value.includes('\0')) throw new HttpError(400, `${field.section} — ${field.label}: dữ liệu không hợp lệ hoặc quá dài.`);
    output[field.key] = value.trim();
    if (field.type === 'image' && !imageUrl(output[field.key])) throw new HttpError(400, `${field.label}: dùng ảnh đã tải lên hoặc URL HTTPS hợp lệ.`);
    if (field.type === 'youtube' && !videoId(output[field.key])) throw new HttpError(400, 'Link YouTube không hợp lệ.');
  }
  if (!output['seo.title'] || !output['seo.description']) throw new HttpError(400, 'Vui lòng nhập tiêu đề và mô tả SEO.');
  if (Object.keys(input).some(key => !Object.hasOwn(output, key))) throw new HttpError(400, 'Có trường nội dung không được hỗ trợ.');
  return output;
}
export async function initialize(env) {
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO revisions(id,content,label,created_by) VALUES(?,?,?,?)').bind('baseline-v1', JSON.stringify(defaults), 'Nội dung gốc của website', 'system'),
    env.DB.prepare("UPDATE site_state SET draft_id=COALESCE(draft_id,'baseline-v1'), published_id=COALESCE(published_id,'baseline-v1') WHERE id=1")
  ]);
}
export async function state(env) {
  const row = await env.DB.prepare('SELECT s.*,r.content FROM site_state s LEFT JOIN revisions r ON r.id=s.draft_id WHERE s.id=1').first();
  if (!row) throw new HttpError(503, 'Cơ sở dữ liệu chưa được khởi tạo.');
  return { draftId: row.draft_id, publishedId: row.published_id, version: row.draft_version, publishedAt: row.published_at, values: row.content ? storedValues(row.content) : defaults };
}
export async function revision(env, id) {
  const row = await env.DB.prepare('SELECT * FROM revisions WHERE id=?').bind(id).first();
  if (!row) throw new HttpError(404, 'Không tìm thấy phiên bản nội dung.');
  return { ...row, values: storedValues(row.content) };
}
export async function saveDraft(env, values, version, email, label = 'Lưu bản nháp') {
  if (!Number.isSafeInteger(version) || version < 0) throw new HttpError(400, 'Thiếu phiên bản chỉnh sửa.');
  const content = validateContent(values), id = crypto.randomUUID();
  const result = await env.DB.batch([
    env.DB.prepare('INSERT INTO revisions(id,content,label,created_by) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM site_state WHERE id=1 AND draft_version=?)').bind(id, JSON.stringify(content), label, email, version),
    env.DB.prepare('UPDATE site_state SET draft_id=?,draft_version=draft_version+1 WHERE id=1 AND draft_version=? AND EXISTS(SELECT 1 FROM revisions WHERE id=?)').bind(id, version, id)
  ]);
  if (result[1].meta.changes !== 1) throw new HttpError(409, 'Nội dung đã được sửa ở phiên khác. Hãy tải lại trước khi lưu để tránh ghi đè.');
  return { draftId: id, version: version + 1 };
}
export async function publish(env, draftId, version) {
  const selected = await revision(env, draftId); validateContent(selected.values);
  const timestamp = new Date().toISOString();
  const result = await env.DB.prepare('UPDATE site_state SET published_id=?,published_at=? WHERE id=1 AND draft_id=? AND draft_version=?').bind(draftId, timestamp, draftId, version).run();
  if (result.meta.changes !== 1) throw new HttpError(409, 'Bản nháp đã thay đổi. Vui lòng tải lại và xem trước trước khi xuất bản.');
  return { publishedId: draftId, publishedAt: timestamp };
}
export async function published(env) {
  const row = await env.DB.prepare('SELECT s.published_id,r.content FROM site_state s LEFT JOIN revisions r ON r.id=s.published_id WHERE s.id=1').first();
  if (!row) throw new HttpError(503, 'Cơ sở dữ liệu chưa được khởi tạo.');
  if (row.published_id && !row.content) throw new HttpError(503, 'Không đọc được phiên bản công khai.');
  return { id: row.published_id || 'baseline-v1', values: row.content ? storedValues(row.content) : defaults };
}
export function serialize(values) { return JSON.stringify(values).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026'); }
function escapeAttribute(value) { return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'); }
export async function renderPage(request, env, values, preview = false, postCards = '') {
  const base = new URL('/index.html', request.url);
  const asset = await env.ASSETS.fetch(new Request(base));
  const headers = new Headers(asset.headers);
  headers.delete('etag'); headers.delete('last-modified');
  headers.set('cache-control', preview ? 'private, no-store' : 'no-cache');
  let origin = null;
  try { const site = new URL(env.SITE_ORIGIN); if (site.protocol === 'https:') origin = site.origin; } catch {}
  if (preview || !origin || new URL(request.url).origin !== origin) headers.set('x-robots-tag', 'noindex, nofollow');
  const rewriter = new HTMLRewriter()
    .on('#news', { element(el) { if(postCards)el.removeAttribute('hidden'); } })
    .on('#landing-posts', { element(el) { el.setInnerContent(postCards,{html:true}); } })
    .on('body', { element(el) { if (preview) { el.setAttribute('data-preview', 'true'); el.prepend('<div class="cms-preview-bar">Bản nháp riêng tư · <a href="/admin/">Về trang quản trị</a></div>', { html: true }); } } })
    .on('[data-cms]', { element(el) { const value = values[el.getAttribute('data-cms')]; if (typeof value === 'string') el.setInnerContent(value); } })
    .on('[data-cms-image]', { element(el) {
      const key = el.getAttribute('data-cms-image'), src = values[key + '.src'];
      if (src) { if (src !== el.getAttribute('src')) el.removeAttribute('srcset'); el.setAttribute('src', src); }
      if (typeof values[key + '.alt'] === 'string') el.setAttribute('alt', values[key + '.alt']);
    } })
    .on('title', { element(el) { el.setInnerContent(values['seo.title']); } })
    .on('meta[name="description"]', { element(el) { el.setAttribute('content', values['seo.description']); } })
    .on('#site-content', { element(el) { el.setInnerContent(serialize(values), { html: true }); } })
    .on('head', { element(el) {
      const tags = `<meta property="og:title" content="${escapeAttribute(values['seo.title'])}"><meta property="og:description" content="${escapeAttribute(values['seo.description'])}"><meta property="og:type" content="website">${origin && !preview ? `<link rel="canonical" href="${escapeAttribute(origin + '/')}">` : ''}`;
      el.append(tags, { html: true });
    } });
  return rewriter.transform(new Response(asset.body, { status: asset.status, headers }));
}
