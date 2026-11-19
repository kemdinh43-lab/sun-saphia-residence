import { HttpError } from './http.js';
import { imageUrl } from './content.js';
export const escape = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function safeLink(value) {
  if (typeof value !== 'string' || value.length > 1500) return false;
  if (/^\/(?!\/)[a-zA-Z0-9_./%?#=&()-]*$/.test(value) && !value.includes('..')) return true;
  try { const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password; }catch{return false;}
}
export function renderDocument(doc) {
  if(!doc||doc.type!=='doc')throw new HttpError(400,'Nội dung bài viết cần có tài liệu gốc hợp lệ.');
  let count=0,characters=0;
  const children={doc:['paragraph','heading','bulletList','orderedList','blockquote','image','table','horizontalRule','codeBlock'],paragraph:['text','hardBreak'],heading:['text','hardBreak'],bulletList:['listItem'],orderedList:['listItem'],listItem:['paragraph','bulletList','orderedList'],blockquote:['paragraph','heading','bulletList','orderedList'],table:['tableRow'],tableRow:['tableCell','tableHeader'],tableCell:['paragraph','bulletList','orderedList','image'],tableHeader:['paragraph','bulletList','orderedList'],codeBlock:['text']};
  for(const container of ['listItem','blockquote','tableCell','tableHeader'])children[container]=children.doc;
  function node(value,depth=0,parent=null) {
    if(!value||typeof value!=='object'||Array.isArray(value)||++count>5000||depth>18)throw new HttpError(400,'Cấu trúc bài viết quá lớn hoặc không hợp lệ.');
    const type=value.type;
    if(parent&&!children[parent]?.includes(type))throw new HttpError(400,'Bài viết chứa khối không được hỗ trợ.');
    if(type==='text') {
      if(typeof value.text!=='string'||(characters+=value.text.length)>80000)throw new HttpError(400,'Bài viết vượt quá 80.000 ký tự.');
      let text=escape(value.text);
      if(value.marks!==undefined&&!Array.isArray(value.marks))throw new HttpError(400,'Định dạng chữ không hợp lệ.');
      if((value.marks||[]).length>8)throw new HttpError(400,'Có quá nhiều định dạng trên một đoạn chữ.');
      for(const mark of value.marks||[]) {
        const tags={bold:'strong',italic:'em',underline:'u',strike:'s',code:'code'};
        if(tags[mark?.type])text=`<${tags[mark.type]}>${text}</${tags[mark.type]}>`;
        else if(mark?.type==='link'&&safeLink(mark.attrs?.href))text=`<a href="${escape(mark.attrs.href)}" rel="noopener noreferrer">${text}</a>`;
        else throw new HttpError(400,'Liên kết hoặc định dạng chữ không hợp lệ.');
      }
      return text;
    }
    if(type==='hardBreak')return '<br>';
    if(type==='horizontalRule')return '<hr>';
    if(type==='image') {
      const {src,alt='',title=''}=value.attrs||{};
      if(!imageUrl(src)||typeof alt!=='string'||typeof title!=='string'||alt.length>500||title.length>500)throw new HttpError(400,'Ảnh trong bài viết không hợp lệ.');
      return `<figure><img src="${escape(src.startsWith('assets/')?'/'+src:src)}" alt="${escape(alt)}" loading="lazy">${title?`<figcaption>${escape(title)}</figcaption>`:''}</figure>`;
    }
    if(!Object.hasOwn(children,type)||(!parent&&type!=='doc'))throw new HttpError(400,'Loại nội dung bài viết không được hỗ trợ.');
    if(value.content!==undefined&&!Array.isArray(value.content))throw new HttpError(400,'Nội dung khối không hợp lệ.');
    const inside=(value.content||[]).map(child=>node(child,depth+1,type)).join('');
    if(type==='doc')return inside;
    if(type==='heading'&&![2,3].includes(value.attrs?.level))throw new HttpError(400,'Tiêu đề trong bài chỉ dùng H2 hoặc H3.');
    const tags={paragraph:'p',heading:'h'+value.attrs?.level,bulletList:'ul',orderedList:'ol',listItem:'li',blockquote:'blockquote',table:'table',tableRow:'tr',tableCell:'td',tableHeader:'th',codeBlock:'pre'};
    let attrs='';
    if(['tableCell','tableHeader'].includes(type)) {
      for(const name of ['colspan','rowspan']) {const n=value.attrs?.[name]??1;if(!Number.isInteger(n)||n<1||n>20)throw new HttpError(400,'Kích thước ô bảng không hợp lệ.');if(n>1)attrs+=` ${name}="${n}"`;}
    }
    if(['paragraph','heading'].includes(type)&&value.attrs?.textAlign) {
      if(!['left','center','right','justify'].includes(value.attrs.textAlign))throw new HttpError(400,'Căn lề không hợp lệ.');
      attrs+=` class="align-${value.attrs.textAlign}"`;
    }
    const html=`<${tags[type]}${attrs}>${inside}</${tags[type]}>`;
    return type==='table'?`<div class="article-table">${html}</div>`:html;
  }
  return node(doc);
}
export function validatePost(input,{publishing=false,lockedSlug=null}={}) {
  if(!input||typeof input!=='object'||Array.isArray(input))throw new HttpError(400,'Bài viết không hợp lệ.');
  const fields={title:200,slug:100,author:120,excerpt:700,category:100,cover:1000,coverAlt:300,seoTitle:120,seoDescription:320};
  const result={};
  for(const [key,max] of Object.entries(fields)){if(typeof input[key]!=='string'||input[key].length>max)throw new HttpError(400,`Trường ${key} không hợp lệ hoặc quá dài.`);result[key]=input[key].trim();}
  if(!result.title)throw new HttpError(400,'Vui lòng nhập tiêu đề bài viết.');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result.slug))throw new HttpError(400,'Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.');
  if(lockedSlug&&result.slug!==lockedSlug)throw new HttpError(409,'Slug được cố định sau lần xuất bản đầu tiên để giữ đường dẫn bài viết.');
  if(result.cover&&!imageUrl(result.cover))throw new HttpError(400,'Ảnh bìa không hợp lệ.');
  if(JSON.stringify(input.document||{}).length>250000)throw new HttpError(413,'Bài viết quá lớn.');
  result.document=input.document;
  const html=renderDocument(result.document);
  if(publishing&&(!html.replace(/<[^>]*>/g,'').trim()&&!html.includes('<img')))throw new HttpError(400,'Bài viết cần có nội dung trước khi xuất bản.');
  if(publishing&&(!result.excerpt||!result.cover||!result.coverAlt))throw new HttpError(400,'Vui lòng nhập mô tả ngắn, ảnh bìa và mô tả ảnh trước khi xuất bản.');
  return result;
}
export const emptyPost = () => ({title:'',slug:'',author:'Sun Saphia Residence',excerpt:'',category:'Tin dự án',cover:'',coverAlt:'',seoTitle:'',seoDescription:'',document:{type:'doc',content:[{type:'paragraph'}]}});
export async function getPost(env,id) {
  const row=await env.DB.prepare('SELECT p.*,r.content FROM posts p LEFT JOIN post_revisions r ON r.id=p.draft_id WHERE p.id=?').bind(id).first();
  if(!row)throw new HttpError(404,'Không tìm thấy bài viết.');
  return {...row,values:row.content?JSON.parse(row.content):emptyPost(),content:undefined};
}
export async function listPosts(env) {
  const {results}=await env.DB.prepare('SELECT p.*,json_extract(r.content,\'$.title\') AS title,json_extract(r.content,\'$.category\') AS category FROM posts p LEFT JOIN post_revisions r ON r.id=p.draft_id ORDER BY p.updated_at DESC LIMIT 200').all();
  return results;
}
export async function savePost(env,body,email) {
  const id=body.id||crypto.randomUUID();
  if(typeof id!=='string'||!Number.isSafeInteger(body.version)||body.version<0)throw new HttpError(400,'Phiên bản bài viết không hợp lệ.');
  const current=body.id?await getPost(env,id):null;
  if(current&&current.version!==body.version)throw new HttpError(409,'Bài viết đã thay đổi ở cửa sổ khác. Vui lòng tải lại.');
  if(!current&&body.version!==0)throw new HttpError(409,'Phiên bản bài viết mới không hợp lệ.');
  const values=validatePost(body.values,{lockedSlug:current?.slug});
  const revisionId=crypto.randomUUID(),time=new Date().toISOString();
  const statements=[];
  if(!current)statements.push(env.DB.prepare('INSERT INTO posts(id) VALUES(?)').bind(id));
  statements.push(env.DB.prepare('INSERT INTO post_revisions(id,post_id,content,created_by) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM posts WHERE id=? AND version=?)').bind(revisionId,id,JSON.stringify(values),email,id,body.version));
  statements.push(env.DB.prepare('UPDATE posts SET draft_id=?,version=version+1,updated_at=? WHERE id=? AND version=? AND EXISTS(SELECT 1 FROM post_revisions WHERE id=?)').bind(revisionId,time,id,body.version,revisionId));
  const results=await env.DB.batch(statements);
  if(results.at(-1).meta.changes!==1)throw new HttpError(409,'Có thay đổi mới. Bản đang sửa chưa được lưu.');
  return getPost(env,id);
}
export async function publishPost(env,body) {
  if(typeof body.id!=='string'||typeof body.draftId!=='string'||!Number.isSafeInteger(body.version))throw new HttpError(400,'Thiếu thông tin phiên bản bài viết.');
  const post=await getPost(env,body.id);
  if(post.version!==body.version||post.draft_id!==body.draftId)throw new HttpError(409,'Bản nháp đã thay đổi. Hãy tải lại và xem trước.');
  const values=validatePost(post.values,{publishing:true,lockedSlug:post.slug});
  try {
    const result=await env.DB.prepare('UPDATE posts SET slug=?,published_id=draft_id,published_at=COALESCE(published_at,?),updated_at=? WHERE id=? AND version=? AND draft_id=?').bind(values.slug,new Date().toISOString(),new Date().toISOString(),post.id,body.version,body.draftId).run();
    if(result.meta.changes!==1)throw new HttpError(409,'Bản nháp đã thay đổi trước khi xuất bản.');
  }catch(error){if(error instanceof HttpError)throw error;if(String(error.message).includes('UNIQUE'))throw new HttpError(409,'Đường dẫn này đã có bài viết khác sử dụng.');throw error;}
  return getPost(env,post.id);
}
export async function publicPosts(env,limit=100) {
  const {results}=await env.DB.prepare('SELECT p.id,p.slug,p.published_at,r.created_at AS updated_at,r.content FROM posts p JOIN post_revisions r ON r.id=p.published_id ORDER BY p.published_at DESC LIMIT ?').bind(limit).all();
  return results.map(row=>({...row,values:JSON.parse(row.content),content:undefined}));
}
export function articleCard(post) {
  const p=post.values,href='/bai-viet/'+post.slug,src=p.cover.startsWith('assets/')?'/'+p.cover:p.cover;
  return `<article class="blog-card"><a href="${href}"><img src="${escape(src)}" alt="${escape(p.coverAlt)}" loading="lazy"><p class="blog-category">${escape(p.category)}</p><h3>${escape(p.title)}</h3><p>${escape(p.excerpt)}</p><span class="blog-read">Đọc bài viết</span></a></article>`;
}
export function blogPage(request,env,{title,description,body,path,preview=false,status=200,cover='',article=null}) {
  const url=new URL(request.url);let origin;try{const site=new URL(env.SITE_ORIGIN);if(site.protocol==='https:')origin=site.origin;}catch{}
  const indexable=origin===url.origin&&!preview&&status===200;
  const canonical=origin+path;
  const image=cover?new URL(cover.startsWith('assets/')?'/'+cover:cover,url.origin).href:'';
  const schema=article?JSON.stringify({'@context':'https://schema.org','@type':'BlogPosting',headline:article.values.title,description:description,datePublished:article.published_at,dateModified:article.updated_at,author:{'@type':'Organization',name:article.values.author},...(image?{image:[image]}:{})}).replace(/</g,'\\u003c'):'';
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="${article?'article':'website'}">${image?`<meta property="og:image" content="${escape(image)}">`:''}${indexable?`<link rel="canonical" href="${escape(canonical)}">`:'<meta name="robots" content="noindex,nofollow">'}<link rel="stylesheet" href="/assets/fonts.css"><link rel="stylesheet" href="/blog.css">${schema?`<script type="application/ld+json">${schema}</script>`:''}</head><body class="blog-public"><header class="article-header"><a class="article-brand" href="/">SUN SAPHIA<span>RESIDENCE</span></a><nav aria-label="Điều hướng"><a href="/">Trang chủ</a><a href="/bai-viet">Tin tức</a><a href="/#Contact-us">Liên hệ tư vấn</a></nav></header>${preview?'<div class="article-preview">Bản nháp riêng tư · <a href="/admin/">Về quản trị</a></div>':''}<main class="article-main">${body}</main><footer class="article-footer"><a href="/">Sun Saphia Residence</a><a href="/#Contact-us">Đăng ký tư vấn</a></footer></body></html>`;
  return new Response(html,{status,headers:{'content-type':'text/html; charset=utf-8','cache-control':preview?'private, no-store':'no-cache',...(!indexable?{'x-robots-tag':'noindex, nofollow'}:{})}});
}
export function renderArticle(request,env,post,preview=false) {
  const p=post.values,src=p.cover.startsWith('assets/')?'/'+p.cover:p.cover;
  const body=`<nav class="article-breadcrumb" aria-label="Đường dẫn"><a href="/">Trang chủ</a> / <a href="/bai-viet">Tin tức</a></nav><article><p class="blog-category">${escape(p.category)}</p><h1>${escape(p.title)}</h1><p class="article-meta">${escape(p.author)}${post.published_at?' · '+new Date(post.published_at).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):' · Bản nháp'}</p><p class="article-excerpt">${escape(p.excerpt)}</p>${src?`<img class="article-cover" src="${escape(src)}" alt="${escape(p.coverAlt)}">`:''}<div class="article-body">${renderDocument(p.document)}</div></article><a class="article-back" href="/bai-viet">Xem các bài viết khác</a>`;
  return blogPage(request,env,{title:p.seoTitle||p.title+' | Sun Saphia Residence',description:p.seoDescription||p.excerpt,body,path:'/bai-viet/'+(post.slug||p.slug),preview,cover:p.cover,article:preview?null:post});
}
