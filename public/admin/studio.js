'use strict';
const $ = selector => document.querySelector(selector);
let model = null, values = {}, saved = '', busy = false, selectedSection = '0', tab = 'content', pickerKey = null, pickerCallback = null;
const tabNames = { content: 'Nội dung landing page', posts:'Bài viết', media: 'Thư viện ảnh', history: 'Lịch sử phiên bản', leads: 'Yêu cầu tư vấn' };
function el(tag, text, className) { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; }
function message(text, error = false) { const node = $('#studio-status'); node.textContent = text; node.classList.toggle('error', error); }
function dirty() { return JSON.stringify(values) !== saved; }
function controls() {
  if (!model) return;
  $('#save').disabled = busy || !dirty();
  $('#publish').disabled = busy || dirty() || model.draftId === model.publishedId;
  $('#preview').disabled = busy || dirty();
  $('#save-state').textContent = busy ? 'Đang xử lý…' : dirty() ? 'Có thay đổi chưa lưu. Lưu nháp trước khi xem trước.' : 'Đã lưu · Bản nháp riêng với website công khai';
  $('#draft-badge').textContent = dirty() ? 'Chưa lưu' : model.draftId === model.publishedId ? 'Đã xuất bản' : 'Bản nháp';
  $('#content-form').querySelectorAll('input,textarea,button').forEach(input => { input.disabled = busy; });
  $('#section-preview').setAttribute('aria-disabled',String(dirty()));
}
async function api(path, options = {}) {
  const response = await fetch('/api/admin/' + path, { credentials: 'same-origin', ...options, headers: { ...(options.body && typeof options.body === 'string' ? { 'content-type': 'application/json' } : {}), ...options.headers } });
  let data; try { data = await response.json(); } catch { throw new Error('Không đọc được phản hồi máy chủ. Vui lòng thử lại.'); }
  if (!response.ok) {
    if (response.status === 401 && path !== 'login') { $('#studio-view').hidden = true; $('#login-view').hidden = false; }
    throw new Error(data.error || 'Không xử lý được yêu cầu.');
  }
  return data;
}
async function task(action) {
  if (busy) return; busy = true; controls();
  try { await action(); } catch (error) { message(error.message, true); }
  finally { busy = false; controls(); }
}
function date(value) { return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa xuất bản lần đầu'; }
function sections() {
  const select = $('#section-select'); select.replaceChildren();
  for (const [i,section] of model.sections.entries()) { const option = el('option', (section.settings?'':`${i+1}. `)+section.title); option.value = section.id; select.append(option); }
  if (![...select.options].some(option => option.value === selectedSection)) selectedSection = select.options[0].value;
  select.value = selectedSection;
  renderSectionMap();
}
function chooseSection(id) { selectedSection=id;$('#section-select').value=id;$('#field-search').value='';renderFields();renderSectionMap();if(matchMedia('(max-width:900px)').matches)$('#section-map').open=false; }
function renderSectionMap() {
  const list=$('#section-list');list.replaceChildren();
  const landing=model.sections.filter(section=>!section.settings);
  $('#section-count').textContent=`${landing.length} khu vực · ${landing.length-1} hiện có + Tin tức`;
  for(const section of model.sections) {
    const fields=model.schema.filter(field=>field.sectionId===section.id);
    const button=el('button',undefined,'section-option'+(selectedSection===section.id?' selected':''));button.type='button';button.setAttribute('aria-current',selectedSection===section.id?'true':'false');
    const copy=el('span');copy.append(el('strong',(section.settings?'':String(landing.indexOf(section)+1).padStart(2,'0')+'. ')+section.title));
    const types=[fields.some(field=>['text','textarea'].includes(field.type))?'Tiêu đề / nội dung':'',fields.some(field=>field.type==='image')?'Ảnh':'',fields.some(field=>field.type==='youtube')?'Video':''].filter(Boolean);
    copy.append(el('small',types.join(' · ')));button.append(copy);
    button.addEventListener('click',()=>chooseSection(section.id));list.append(button);
  }
}
function updateField(key, value) { values[key] = value; controls(); }
function renderFields() {
  const form = $('#content-form'); form.replaceChildren();
  const search = $('#field-search').value.trim().toLocaleLowerCase('vi');
  const section=model.sections.find(section=>section.id===selectedSection);
  $('#section-title').textContent=search?'Kết quả tìm kiếm':section.title;
  $('#section-description').textContent=search?'Các trường phù hợp trên toàn landing page.':section.description;
  $('#section-position').textContent=section.settings?'THIẾT LẬP':`SECTION ${model.sections.filter(s=>!s.settings).indexOf(section)+1} TRÊN LANDING PAGE`;
  $('#section-preview').hidden=!section.anchor||section.id==='apartments';$('#section-preview').href='/preview#'+(section.anchor||'');
  const fields = model.schema.filter(field => search ? `${field.section} ${field.label} ${values[field.key]}`.toLocaleLowerCase('vi').includes(search) : field.sectionId === selectedSection);
  if (!fields.length) { form.append(el('p', 'Không tìm thấy trường phù hợp.', 'empty-state')); return; }
  const groups=new Map();
  fields.forEach((field, index) => {
    const groupName=search?`${model.sections.find(s=>s.id===field.sectionId)?.title} · ${field.group}`:field.group;
    if(!groups.has(groupName)){const group=el('fieldset',undefined,'field-group');group.append(el('legend',groupName));groups.set(groupName,group);form.append(group);}
    const wrapper = el('div', undefined, 'field');
    const label = el('label', field.label); const input = document.createElement(field.type === 'textarea' || values[field.key].includes('\n') ? 'textarea' : 'input');
    if (input.tagName === 'INPUT') input.type = 'text';
    input.value = values[field.key]; input.maxLength = field.maxLength; input.name = field.key; input.id = `cms-field-${index}`;
    input.addEventListener('input', () => updateField(field.key, input.value));
    label.append(input); wrapper.append(label);
    if (field.type === 'image') {
      const row = el('div', undefined, 'image-field-row'); const image = el('img'); image.src = new URL(input.value, location.origin + '/').href; image.alt = 'Ảnh đang chọn'; image.loading = 'lazy';
      const actions = el('div'); actions.append(el('p', 'Chọn ảnh đã tải lên hoặc nhập đường dẫn HTTPS.', 'muted'));
      const buttons = el('div', undefined, 'image-actions'); const choose = el('button', 'Chọn từ thư viện'); choose.type = 'button';
      choose.addEventListener('click', () => openPicker(field.key));
      const upload = el('label', 'Tải ảnh mới', 'button upload-button'); const file = el('input'); file.type = 'file'; file.accept = 'image/png,image/jpeg,image/webp';
      file.addEventListener('change', () => { if (file.files[0]) task(async () => { const uploaded = await uploadImage(file.files[0]); updateField(field.key, uploaded.url); renderFields(); message('Đã tải ảnh. Lưu nháp để giữ lựa chọn.'); }); });
      upload.append(file); upload.hidden=model.mediaEnabled===false; buttons.append(choose, upload); actions.append(buttons); row.append(image, actions); wrapper.append(row);
      input.addEventListener('change', () => { image.src = new URL(input.value, location.origin + '/').href; });
    }
    const meta = el('small', search ? field.section : field.type === 'youtube' ? 'Dùng link youtube.com/watch hoặc youtu.be.' : `Tối đa ${field.maxLength.toLocaleString('vi')} ký tự.`, 'field-meta'); wrapper.append(meta);
    groups.get(groupName).append(wrapper);
  });
  if(selectedSection==='news'&&!search){const button=el('button','Soạn và quản lý bài viết','primary');button.type='button';button.addEventListener('click',()=>switchTab('posts'));form.append(button);}
  controls();
}
async function loadModel() {
  model = await api('content'); values = { ...model.values }; saved = JSON.stringify(values);
  $('#admin-email').textContent = model.email; sections(); renderFields(); controls();
}
async function openStudio() {
  await loadModel(); $('#login-view').hidden = true; $('#studio-view').hidden = false;
  for(const id of ['media-upload','post-cover-upload','post-inline-upload']) {
    const file=$('#'+id);file.disabled=model.mediaEnabled===false;
    file.closest('label').hidden=model.mediaEnabled===false;
  }
  message(model.draftId === model.publishedId ? 'Bạn đang biên tập từ nội dung đã xuất bản. Thay đổi sẽ được lưu thành bản nháp riêng.' : 'Có bản nháp chưa xuất bản. Website công khai vẫn giữ phiên bản trước.');
}
async function save() {
  const snapshot = { ...values };
  const result = await api('draft', { method: 'PUT', body: JSON.stringify({ values: snapshot, version: model.version }) });
  Object.assign(model, result); saved = JSON.stringify(snapshot); message('Đã lưu bản nháp. Bạn có thể xem trước hoặc xuất bản.');
}
async function uploadImage(file) {
  if(model?.mediaEnabled===false)throw new Error('Tải ảnh mới đang tạm tắt. Hãy dùng đường dẫn ảnh hiện có; kho ảnh sẽ được bật sau.');
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 8*1024*1024) throw new Error('Chọn PNG, JPEG hoặc WebP tối đa 8 MB.');
  return api('media', { method: 'POST', body: file, headers: { 'content-type': file.type, 'x-file-name': encodeURIComponent(file.name) } });
}
function mediaCard(item, choose) {
  const card = el('article', undefined, 'media-item'), image = el('img'); image.src = item.url; image.alt = item.original_name; image.loading = 'lazy';
  const button = el('button', choose ? 'Dùng ảnh này' : 'Sao chép đường dẫn'); button.type = 'button';
  button.addEventListener('click', async () => {
    if (choose) { $('#media-picker').close(); if(pickerCallback){const callback=pickerCallback;pickerCallback=null;callback(item.url);}else{updateField(pickerKey, item.url);renderFields();message('Đã chọn ảnh cho bản nháp. Hãy lưu để giữ thay đổi.');} }
    else { try { await navigator.clipboard.writeText(item.url); message('Đã sao chép đường dẫn ảnh.'); } catch { message('Đường dẫn ảnh: ' + item.url); } }
  });
  card.append(image, el('p', item.original_name), el('small', `${Math.ceil(item.size/1024)} KB · ${date(item.created_at)}`), button); return card;
}
async function renderMedia(container, choose = false) {
  const data = await api('media'); container.replaceChildren();
  if (!data.media.length) container.append(el('p', model?.mediaEnabled===false?'Kho ảnh chưa được kích hoạt. Bạn vẫn có thể dùng đường dẫn ảnh hiện có trong nội dung và bài viết.':'Chưa có ảnh tải lên. Bạn có thể tải ảnh mới từ trường ảnh trong phần Nội dung.', 'empty-state'));
  data.media.forEach(item => container.append(mediaCard(item, choose)));
}
async function openPicker(key) {
  pickerCallback=null;
  pickerKey = key;
  try { await renderMedia($('#picker-grid'), true); $('#media-picker').showModal(); } catch (error) { message(error.message, true); }
}
async function renderHistory() {
  const data = await api('history'), list = $('#history-list'); list.replaceChildren();
  data.revisions.forEach(item => {
    const row = el('article', undefined, 'history-item'), copy = el('div'); copy.append(el('p', item.label), el('small', `${date(item.created_at)} · ${item.created_by}`));
    const tags = [item.id === model.publishedId ? 'Đang công khai' : '', item.id === model.draftId ? 'Bản nháp hiện tại' : ''].filter(Boolean).join(' · '); if (tags) copy.append(el('span', tags, 'history-tags'));
    const button = el('button', 'Khôi phục thành bản nháp'); button.type = 'button';
    button.addEventListener('click', () => {
      if (dirty()) { message('Bạn còn thay đổi chưa lưu. Hãy lưu nháp trước khi khôi phục.', true); return; }
      task(async () => { await api('restore', { method: 'POST', body: JSON.stringify({ revisionId: item.id, version: model.version }) }); await loadModel(); await renderHistory(); message('Đã khôi phục thành bản nháp mới. Xem trước rồi xuất bản nếu phù hợp.'); });
    });
    row.append(copy, button); list.append(row);
  });
}
async function renderLeads() {
  const { leads } = await api('leads'), list = $('#lead-list'); list.replaceChildren();
  if (!leads.length) { const row = el('tr'), cell = el('td', 'Chưa có yêu cầu tư vấn.'); cell.colSpan = 4; row.append(cell); list.append(row); }
  for (const lead of leads) {
    const row = el('tr'), name = el('td', lead.name), contact = el('td'); contact.append(el('p',lead.phone),el('small',lead.email)); const timestamp = el('td', date(lead.created_at)); const status = el('td'), select = el('select'); select.setAttribute('aria-label','Trạng thái tư vấn của '+lead.name);
    for (const [value, label] of [['new','Mới nhận'],['contacted','Đã liên hệ'],['closed','Đã hoàn tất']]) { const option = el('option',label);option.value=value;select.append(option); } select.value=lead.status;
    select.addEventListener('change', () => task(async () => { const chosen=select.value; try { await api('leads', { method:'PATCH',body:JSON.stringify({id:lead.id,status:chosen}) }); lead.status=chosen; message('Đã cập nhật trạng thái tư vấn.'); } catch(error) { select.value=lead.status; throw error; } }));
    status.append(select); row.append(name,contact,timestamp,status);list.append(row);
  }
}
async function switchTab(name) {
  tab=name; $('#page-title').textContent=tabNames[name]; $('#page-eyebrow').textContent=name==='content'?'BIÊN TẬP NỘI DUNG':'QUẢN LÝ WEBSITE';
  document.querySelectorAll('[data-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.tab===name);button.setAttribute('aria-current',button.dataset.tab===name?'page':'false');});
  for(const key of Object.keys(tabNames)) $('#'+key+'-panel').hidden=key!==name;
  if(name==='content')message('Chọn section theo đúng thứ tự trên landing page, chỉnh nội dung rồi lưu nháp để xem trước.');
  if(name==='posts')message('Bài viết có bản nháp và đường dẫn riêng. Chỉ bài đã xuất bản mới xuất hiện trong mục tin tức.');
  $('#draft-badge').hidden=name!=='content';
  try { if(name==='posts'){if(!window.SaphiaPosts){$('#post-new').disabled=true;await import('/admin/posts-editor.js?v=3');}await window.SaphiaPosts.mount();}if(name==='media')await renderMedia($('#media-grid'));if(name==='history')await renderHistory();if(name==='leads')await renderLeads(); }catch(error){message(error.message,true);}
}
$('#login-form').addEventListener('submit', async event => {
  event.preventDefault(); const form=event.currentTarget,button=form.querySelector('button');button.disabled=true;$('#login-status').textContent='Đang đăng nhập…';
  try {const data=new FormData(form);await api('login',{method:'POST',body:JSON.stringify({email:data.get('email'),password:data.get('password')})});form.reset();$('#login-status').textContent='';await openStudio();}
  catch(error){$('#login-status').textContent=error.message;}finally{button.disabled=false;}
});
$('#logout').addEventListener('click',()=>task(async()=>{if(dirty()||window.SaphiaPosts?.isDirty())throw new Error('Bạn còn thay đổi chưa lưu. Hãy lưu nháp trước khi đăng xuất.');await api('logout',{method:'POST'});location.reload();}));
$('#section-select').addEventListener('change',event=>chooseSection(event.target.value));
$('#field-search').addEventListener('input',renderFields);
$('#content-form').addEventListener('submit',event=>event.preventDefault());
$('#save').addEventListener('click',()=>task(save));
$('#preview').addEventListener('click',()=>{if(!dirty())window.open('/preview','_blank','noopener');});
$('#publish').addEventListener('click',()=>task(async()=>{const result=await api('publish',{method:'POST',body:JSON.stringify({draftId:model.draftId,version:model.version})});Object.assign(model,result);message('Đã xuất bản thành công. Nội dung mới đã được chọn cho website công khai.');}));
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>switchTab(button.dataset.tab)));
$('#media-upload').addEventListener('change',event=>{const file=event.target.files[0];if(file)task(async()=>{await uploadImage(file);event.target.value='';await renderMedia($('#media-grid'));message('Đã tải ảnh lên thư viện. Bạn có thể chọn ảnh trong phần Nội dung.');});});
$('#close-picker').addEventListener('click',()=>$('#media-picker').close());
$('#section-preview').addEventListener('click',event=>{if(dirty()){event.preventDefault();message('Hãy lưu nháp trước khi xem section vừa sửa.',true);}});
$('#section-map').open=!matchMedia('(max-width:900px)').matches;
window.SaphiaStudio={api,el,message,uploadImage,date,chooseMedia:async callback=>{pickerCallback=callback;await renderMedia($('#picker-grid'),true);$('#media-picker').showModal();}};
window.addEventListener('beforeunload',event=>{if(dirty()||window.SaphiaPosts?.isDirty()){event.preventDefault();event.returnValue='';}});
api('session').then(openStudio).catch(error=>{if(!error.message.includes('đăng nhập'))$('#login-status').textContent=error.message;});
