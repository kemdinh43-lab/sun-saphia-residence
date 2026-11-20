import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { passwordHash } from '../server/auth.js';

test('Worker: authentication, private drafts, preview, atomic publication, media, leads and rollback', { timeout: 120000 }, async () => {
  const folder = path.resolve('.wrangler/integration'); await fs.mkdir(folder, { recursive: true });
  const password = crypto.randomUUID() + '-integration', email = 'integration@example.test';
  const config = {
    name:'sun-saphia-integration',main:path.resolve('server/worker.js'),compatibility_date:'2026-11-19',
    assets:{directory:path.resolve('public'),binding:'ASSETS',run_worker_first:true,html_handling:'none',not_found_handling:'none'},
    d1_databases:[{binding:'DB',database_name:'sun-saphia-test',database_id:'11111111-1111-1111-1111-111111111111',migrations_dir:path.resolve('migrations')}],
    r2_buckets:[{binding:'MEDIA',bucket_name:'sun-saphia-test'}],
    vars:{ADMIN_EMAIL:email,ADMIN_PASSWORD_HASH:await passwordHash(password),SITE_ORIGIN:''}
  };
  const configFile=path.join(folder,'wrangler.json');await fs.writeFile(configFile,JSON.stringify(config));
  const wrangler=path.resolve('node_modules/wrangler/bin/wrangler.js'), persistence=path.join(folder,'state-'+crypto.randomUUID());
  execFileSync(process.execPath,[wrangler,'d1','migrations','apply','sun-saphia-test','--local','--config',configFile,'--persist-to',persistence],{stdio:'pipe',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
  let logs=''; const child=spawn(process.execPath,[wrangler,'dev','--config',configFile,'--ip','127.0.0.1','--port','8790','--persist-to',persistence],{stdio:['ignore','pipe','pipe'],env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
  child.stdout.on('data',data=>{logs+=data});child.stderr.on('data',data=>{logs+=data});
  const origin='http://127.0.0.1:8790';let cookie='';
  const request=(url,method='GET',body,headers={})=>fetch(origin+url,{method,headers:{...(method!=='GET'?{'origin':origin}:{}),...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
  try {
    let started=false;
    for(let i=0;i<150;i++){try{await fetch(origin+'/admin/');started=true;break;}catch{if(child.exitCode!==null)throw new Error('Worker stopped: '+logs);await new Promise(resolve=>setTimeout(resolve,200));}}
    assert(started,'Worker must start');
    assert.equal((await request('/api/admin/content')).status,401);
    assert.equal((await request('/api/admin/history')).status,401);
    assert.equal((await request('/preview')).status,401);
    assert.equal((await request('/api/admin/login','POST',{email,password},{origin:'https://evil.test'})).status,403);
    assert.equal((await request('/api/admin/login','POST',{email,password:'wrong-password'})).status,401);
    const logged=await request('/api/admin/login','POST',{email,password});assert.equal(logged.status,200);cookie=logged.headers.get('set-cookie').split(';')[0];assert(logged.headers.get('set-cookie').includes('HttpOnly'));
    assert.equal((await request('/api/admin/draft','PUT',{}, {origin:'https://evil.test'})).status,403,'Cross-origin writes must be blocked even with a session');
    let content=await (await request('/api/admin/content')).json();assert(content.schema.length>100);const original={...content.values};
    const baseline=await (await request('/')).text();assert(baseline.includes('Sun Saphia Residence'));
    const key=content.schema.find(field=>field.section==='Hero'&&field.type==='text').key;
    const marker='BẢN NHÁP KIỂM TRA '+crypto.randomUUID();const changed={...original,[key]:marker,'seo.title':'Tiêu đề thử nghiệm','advisor.phone':'0901234567'};
    const save=await request('/api/admin/draft','PUT',{values:changed,version:content.version});assert.equal(save.status,200);const saved=await save.json();
    assert(!(await (await request('/')).text()).includes(marker),'Draft must never leak into public HTML');
    const preview=await request('/preview');assert.equal(preview.status,200);assert(preview.headers.get('x-robots-tag').includes('noindex'));assert(preview.headers.get('cache-control').includes('no-store'));assert((await preview.text()).includes(marker));
    const phonePreview=await (await request('/preview')).text();assert(phonePreview.includes('href="tel:+84901234567"'));assert(phonePreview.includes('href="https://zalo.me/0901234567"'));
    assert.equal((await request('/api/admin/draft','PUT',{values:original,version:content.version})).status,409,'Stale editor cannot overwrite a newer draft');
    assert.equal((await request('/api/admin/publish','POST',{draftId:saved.draftId,version:content.version})).status,409,'Stale version cannot publish');
    assert.equal((await request('/api/admin/publish','POST',saved)).status,200);
    const live=await request('/');const html=await live.text();assert(html.includes(marker));assert(html.includes('<title>Tiêu đề thử nghiệm</title>'));
    assert.equal((await request('/api/admin/draft','PUT',{values:{...changed,'film.youtube':'javascript:alert(1)'},version:saved.version})).status,400);
    const attack='</script><script>alert(1)</script>';
    const xss=await (await request('/api/admin/draft','PUT',{values:{...changed,[key]:attack},version:saved.version})).json();
    const xssPreview=await (await request('/preview')).text();assert(!xssPreview.includes(attack));assert(xssPreview.includes('\\u003c/script\\u003e'));
    const restore=await request('/api/admin/restore','POST',{revisionId:content.draftId,version:xss.version});assert.equal(restore.status,200);const restored=await restore.json();
    assert((await (await request('/')).text()).includes(marker),'Restore must not publish silently');
    assert.equal((await request('/api/admin/publish','POST',restored)).status,200);
    assert(!(await (await request('/')).text()).includes(marker));
    const image=new Uint8Array(await fs.readFile('public/assets/sun-saphia-hero-panorama-960.webp'));
    const upload=await fetch(origin+'/api/admin/media',{method:'POST',headers:{origin,cookie,'content-type':'image/webp','x-file-name':'test.webp'},body:image});assert.equal(upload.status,201);const media=await upload.json();
    const downloaded=await request(media.url);assert.equal(downloaded.status,200);assert.equal(downloaded.headers.get('content-type'),'image/webp');assert.equal((await downloaded.arrayBuffer()).byteLength,image.byteLength);
    assert.equal((await fetch(origin+'/api/admin/media',{method:'POST',headers:{origin,cookie,'content-type':'image/png'},body:'<svg onload=alert(1)>'})).status,415);
    assert.equal((await request('/api/leads','POST',{name:'Test',phone:'bad',email:'bad',consent:true})).status,400);
    const lead=await request('/api/leads','POST',{name:'Khách kiểm tra',phone:'0900000000',email:'cms-integration@example.test',consent:true});assert.equal(lead.status,201);const leadRecord=await lead.json();
    const leads=await(await request('/api/admin/leads')).json();assert(leads.leads.some(item=>item.id===leadRecord.id));
    assert.equal((await request('/api/admin/leads','PATCH',{id:leadRecord.id,status:'contacted'})).status,200);
    const history=await(await request('/api/admin/history')).json();assert(history.revisions.length>=4);
    const articleTitle='Bài viết tích hợp '+crypto.randomUUID(),articleSlug='bai-viet-'+crypto.randomUUID();
    const postValues={title:articleTitle,slug:articleSlug,author:'Sun Saphia Residence',excerpt:'Mô tả bài thử',category:'Kiến trúc',cover:media.url,coverAlt:'Ảnh phối cảnh',seoTitle:'SEO của bài thử',seoDescription:'Mô tả SEO riêng',document:{type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'Đường cong kiến trúc'}]},{type:'paragraph',content:[{type:'text',text:'Nội dung bài viết tích hợp.'}]}]}};
    const created=await request('/api/admin/posts','POST',{version:0,values:postValues});assert.equal(created.status,201);let post=await created.json();
    assert.equal((await request('/bai-viet/'+articleSlug)).status,404,'Unpublished article is private');
    const articlePreview=await request('/preview/bai-viet/'+post.id);assert.equal(articlePreview.status,200);assert(articlePreview.headers.get('x-robots-tag').includes('noindex'));assert((await articlePreview.text()).includes(articleTitle));
    assert.equal((await request('/api/admin/posts/publish','POST',{id:post.id,draftId:post.draft_id,version:post.version-1})).status,409);
    const publishedPost=await request('/api/admin/posts/publish','POST',{id:post.id,draftId:post.draft_id,version:post.version});assert.equal(publishedPost.status,200);post=await publishedPost.json();
    const publicArticle=await(await request('/bai-viet/'+articleSlug)).text();assert(publicArticle.includes('<h2>Đường cong kiến trúc</h2>'));assert(publicArticle.includes('<title>SEO của bài thử</title>'));assert((await(await request('/')).text()).includes(articleTitle));assert((await(await request('/bai-viet')).text()).includes(articleTitle));
    const edited=await request('/api/admin/posts','POST',{id:post.id,version:post.version,values:{...postValues,title:'BẢN SỬA CHƯA ĐĂNG'}});assert.equal(edited.status,201);post=await edited.json();
    assert(!(await(await request('/bai-viet/'+articleSlug)).text()).includes('BẢN SỬA CHƯA ĐĂNG'));
    assert.equal((await request('/api/admin/posts','POST',{id:post.id,version:post.version,values:{...postValues,slug:'doi-slug'}})).status,409);
    assert.equal((await request('/api/admin/posts','POST',{id:post.id,version:post.version,values:{...postValues,document:{type:'doc',content:[{type:'script'}]}}})).status,400);
    const duplicate=await(await request('/api/admin/posts','POST',{version:0,values:postValues})).json();assert.equal((await request('/api/admin/posts/publish','POST',{id:duplicate.id,draftId:duplicate.draft_id,version:duplicate.version})).status,409);
    const postHistory=await(await request('/api/admin/posts/'+post.id+'/history')).json();assert(postHistory.revisions.length>=2);
    const restoredPost=await request('/api/admin/posts/'+post.id+'/restore','POST',{revisionId:postHistory.revisions.at(-1).id,version:post.version});assert.equal(restoredPost.status,200);post=await restoredPost.json();
    const unpublish=await request('/api/admin/posts/unpublish','POST',{id:post.id,version:post.version});assert.equal(unpublish.status,200);assert.equal((await request('/bai-viet/'+articleSlug)).status,404);assert(!(await(await request('/')).text()).includes(articleTitle));
    assert.equal((await request('/api/admin/logout','POST')).status,200);assert.equal((await request('/api/admin/leads')).status,401);assert.equal((await request('/api/admin/media','POST',{})).status,401);
    assert.equal((await request('/preview/bai-viet/'+post.id)).status,401);assert.equal((await request('/api/admin/posts')).status,401);
    execFileSync(process.execPath,[wrangler,'d1','execute','sun-saphia-test','--local','--config',configFile,'--persist-to',persistence,'--command','DROP TABLE site_state'],{stdio:'pipe',env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
    const degraded=await request('/');assert.equal(degraded.status,200);assert.equal(degraded.headers.get('x-content-status'),'last-published');assert(!(await degraded.text()).includes(marker),'Storage outage must preserve last published content, not draft content');
  } finally {
    child.kill('SIGTERM');
    await new Promise(resolve=>{if(child.exitCode!==null)resolve();else {child.once('exit',resolve);setTimeout(()=>{child.kill('SIGKILL');resolve();},5000).unref();}});
    await fs.rm(configFile,{force:true});
  }
});
