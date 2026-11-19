import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';

const $=selector=>document.querySelector(selector),studio=window.SaphiaStudio;
let editor=null,post=null,posts=[],snapshot='',working=false,mounted=false,manualSlug=false;
const fields=['title','slug','author','excerpt','category','cover','coverAlt','seoTitle','seoDescription'];
const input=name=>$('#post-form').elements.namedItem(name);
const empty=()=>({title:'',slug:'',author:'Sun Saphia Residence',excerpt:'',category:'Tin dự án',cover:'',coverAlt:'',seoTitle:'',seoDescription:'',document:{type:'doc',content:[{type:'paragraph'}]}});
const slug=value=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100).replace(/-$/,'');
function data(){return {...Object.fromEntries(fields.map(name=>[name,input(name).value])),document:editor?.getJSON()||empty().document};}
function dirty(){return !!post&&JSON.stringify(data())!==snapshot;}
function refresh(){
  if(!post)return;
  const changed=dirty();
  $('#post-save').disabled=working||!changed;
  $('#post-preview').disabled=working||changed||!post.id;
  $('#post-publish').disabled=working||changed||!post.id||post.draft_id===post.published_id;
  $('#post-unpublish').hidden=!post.published_id;
  $('#post-unpublish').disabled=working||changed;
  $('#post-new').disabled=working;
  $('#post-live').hidden=!post.published_id;$('#post-live').href='/bai-viet/'+(post.slug||input('slug').value);
  input('slug').readOnly=Boolean(post.slug);
  $('#post-slug-note').textContent=post.slug?'Đã cố định đường dẫn sau lần xuất bản đầu tiên.':'Tự gợi ý từ tiêu đề, có thể sửa trước lần xuất bản đầu tiên.';
  $('#post-save-state').textContent=working?'Đang xử lý…':changed?'Có thay đổi chưa lưu':post.published_id===post.draft_id&&post.id?'Đã xuất bản':post.id?'Đã lưu bản nháp':'Bài viết mới';
  const cover=$('#post-cover-preview');cover.hidden=!input('cover').value;
  try{cover.src=new URL(input('cover').value,location.origin+'/').href;}catch{cover.hidden=true;}
  $('#post-seo-count').textContent=(input('seoTitle').value||input('title').value).length+' ký tự';
  $('#post-wordcount').textContent=(editor.getText().trim().match(/\S+/g)||[]).length.toLocaleString('vi')+' từ';
  $('#post-toolbar').querySelectorAll('[data-command]').forEach(button=>button.setAttribute('aria-pressed',String(editor.isActive(button.dataset.command))));
  $('#post-table-tools').hidden=!editor.isActive('table');
  $('#post-block').value=editor.isActive('heading',{level:2})?'h2':editor.isActive('heading',{level:3})?'h3':'paragraph';
  $('#post-form').querySelectorAll('input,textarea,button,select').forEach(element=>{element.disabled=working;});
  if(editor.isEditable===working)editor.setEditable(!working,false);
}
async function run(action){if(working)return;working=true;refresh();try{await action();}catch(error){studio.message(error.message,true);}finally{working=false;refresh();}}
function list(){
  const root=$('#post-list'),search=$('#post-search').value.trim().toLowerCase();root.replaceChildren();
  const filtered=posts.filter(item=>`${item.title} ${item.slug||''}`.toLowerCase().includes(search));
  if(!filtered.length)root.append(studio.el('p',posts.length?'Không có bài phù hợp.':'Chưa có bài viết. Bấm Viết bài mới để bắt đầu.','empty-state'));
  for(const item of filtered){const button=studio.el('button',undefined,'post-list-item'+(post?.id===item.id?' selected':''));button.type='button';button.append(studio.el('small',item.published_id?(item.published_id===item.draft_id?'Đã xuất bản':'Đã xuất bản · Có bản sửa'):'Bản nháp'),studio.el('strong',item.title||'Bài viết chưa đặt tên'),studio.el('span',item.slug?'/bai-viet/'+item.slug:'Chưa xuất bản'));
    button.addEventListener('click',()=>{if(working)return;if(dirty()){studio.message('Hãy lưu bản nháp đang sửa trước khi chuyển bài.',true);return;}run(async()=>{await setPost(await studio.api('posts/'+item.id));studio.message('Đã mở bài viết. Sửa bản nháp không thay đổi bài đang công khai.');});});root.append(button);}
}
async function loadList(){posts=(await studio.api('posts')).posts;list();}
async function history(){const root=$('#post-history-list');root.replaceChildren();if(!post.id){root.append(studio.el('p','Lưu bài lần đầu để có lịch sử.','muted'));return;}
  const {revisions}=await studio.api('posts/'+post.id+'/history');
  for(const revision of revisions){const row=studio.el('div',undefined,'post-history-row');row.append(studio.el('span',studio.date(revision.created_at)+(revision.id===post.draft_id?' · Bản nháp hiện tại':'')));
    const button=studio.el('button','Khôi phục bản nháp');button.type='button';button.disabled=revision.id===post.draft_id;
    button.addEventListener('click',()=>run(async()=>{if(dirty())throw new Error('Hãy lưu thay đổi trước khi khôi phục.');const restored=await studio.api('posts/'+post.id+'/restore',{method:'POST',body:JSON.stringify({revisionId:revision.id,version:post.version})});await setPost(restored);await loadList();studio.message('Đã khôi phục thành bản nháp. Bài công khai chưa thay đổi.');}));row.append(button);root.append(row);}
}
async function setPost(record){post=record;manualSlug=Boolean(record.id);$('#post-empty').hidden=true;$('#post-editor-view').hidden=false;
  for(const name of fields)input(name).value=record.values[name]||'';
  editor.commands.setContent(record.values.document,{emitUpdate:false});snapshot=JSON.stringify(data());refresh();list();await history();
}
async function save(){if(!input('title').value.trim())throw new Error('Vui lòng nhập tiêu đề bài viết.');if(!input('slug').value)input('slug').value=slug(input('title').value);
  const record=await studio.api('posts',{method:'POST',body:JSON.stringify({id:post.id||undefined,version:post.version||0,values:data()})});await setPost(record);await loadList();studio.message('Đã lưu bản nháp bài viết. Bạn có thể xem trước hoặc xuất bản.');
}
function linkIsSafe(value){if(/^\/(?!\/)/.test(value))return true;try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}}
async function chooseImage(callback){await studio.chooseMedia(callback);}
function mountEditor(){
  const ArticleImage=Image.extend({renderHTML({HTMLAttributes}){const {title,...attrs}=HTMLAttributes;return ['figure',{},['img',attrs],...(title?[['figcaption',{},title]]:[])];}});
  editor=new Editor({element:$('#post-richtext'),extensions:[StarterKit.configure({heading:{levels:[2,3]},link:{openOnClick:false,autolink:false}}),ArticleImage.configure({allowBase64:false}),TableKit.configure({table:{resizable:false}}),TextAlign.configure({types:['heading','paragraph']})],content:empty().document,editorProps:{attributes:{role:'textbox','aria-label':'Nội dung bài viết','aria-multiline':'true',spellcheck:'true'}},onUpdate:refresh,onSelectionUpdate:refresh});
  for(const name of fields)input(name).addEventListener('input',()=>{if(name==='slug')manualSlug=true;if(name==='title'&&!manualSlug&&!post?.slug)input('slug').value=slug(input('title').value);refresh();});
  $('#post-form').addEventListener('submit',event=>event.preventDefault());
  $('#post-new').addEventListener('click',()=>run(async()=>{if(dirty())throw new Error('Hãy lưu bài đang sửa trước khi tạo bài mới.');await setPost({values:empty(),version:0});studio.message('Bài viết mới. Nhập tiêu đề, ảnh bìa và nội dung để bắt đầu.');input('title').focus();}));
  $('#post-save').addEventListener('click',()=>run(save));
  $('#post-preview').addEventListener('click',()=>{if(post.id&&!dirty())window.open('/preview/bai-viet/'+post.id,'_blank','noopener');});
  $('#post-publish').addEventListener('click',()=>run(async()=>{if(dirty())throw new Error('Lưu nháp trước khi xuất bản.');const record=await studio.api('posts/publish',{method:'POST',body:JSON.stringify({id:post.id,draftId:post.draft_id,version:post.version})});await setPost(record);await loadList();studio.message('Đã xuất bản bài viết. Bài đã có trang riêng và xuất hiện trong mục tin tức.');}));
  $('#post-unpublish').addEventListener('click',()=>run(async()=>{const record=await studio.api('posts/unpublish',{method:'POST',body:JSON.stringify({id:post.id,version:post.version})});await setPost(record);await loadList();studio.message('Đã gỡ bài khỏi website. Nội dung vẫn được giữ để chỉnh sửa và đăng lại.');}));
  $('#post-search').addEventListener('input',list);
  $('#post-block').addEventListener('change',event=>{const value=event.target.value;if(value==='paragraph')editor.chain().focus().setParagraph().run();else editor.chain().focus().setHeading({level:value==='h2'?2:3}).run();refresh();});
  const commands={bold:'toggleBold',italic:'toggleItalic',underline:'toggleUnderline',bulletList:'toggleBulletList',orderedList:'toggleOrderedList',blockquote:'toggleBlockquote'};
  $('#post-toolbar').querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{editor.chain().focus()[commands[button.dataset.command]]().run();refresh();}));
  $('#post-toolbar').querySelectorAll('[data-align]').forEach(button=>button.addEventListener('click',()=>editor.chain().focus().setTextAlign(button.dataset.align).run()));
  $('#post-undo').addEventListener('click',()=>editor.chain().focus().undo().run());$('#post-redo').addEventListener('click',()=>editor.chain().focus().redo().run());
  $('#post-table').addEventListener('click',()=>editor.chain().focus().insertTable({rows:3,cols:3,withHeaderRow:true}).run());
  $('#post-table-tools').querySelectorAll('[data-table]').forEach(button=>button.addEventListener('click',()=>editor.chain().focus()[button.dataset.table]().run()));
  $('#post-link').addEventListener('click',()=>{$('#post-link-url').value=editor.getAttributes('link').href||'';$('#post-link-dialog').showModal();});
  $('#post-link-form').addEventListener('submit',event=>{if(event.submitter?.value!=='apply')return;const value=$('#post-link-url').value.trim();if(!linkIsSafe(value)){event.preventDefault();studio.message('Liên kết phải là HTTP/HTTPS hoặc đường dẫn trong website.',true);return;}editor.chain().focus().extendMarkRange('link').setLink({href:value}).run();});
  $('#post-link-remove').addEventListener('click',()=>{editor.chain().focus().extendMarkRange('link').unsetLink().run();$('#post-link-dialog').close();});
  $('#post-cover-library').addEventListener('click',()=>chooseImage(url=>{input('cover').value=url;refresh();}));
  $('#post-cover-upload').addEventListener('change',event=>{const file=event.target.files[0];if(file)run(async()=>{input('cover').value=(await studio.uploadImage(file)).url;event.target.value='';refresh();studio.message('Ảnh bìa đã tải lên. Lưu bản nháp để giữ thay đổi.');});});
  $('#post-image').addEventListener('click',()=>{$('#post-image-form').reset();$('#post-image-dialog').showModal();});
  $('#post-image-library').addEventListener('click',()=>chooseImage(url=>{$('#post-image-url').value=url;}));
  $('#post-inline-upload').addEventListener('change',event=>{const file=event.target.files[0];if(file)run(async()=>{$('#post-image-url').value=(await studio.uploadImage(file)).url;event.target.value='';});});
  $('#post-image-form').addEventListener('submit',event=>{if(event.submitter?.value!=='apply')return;const src=$('#post-image-url').value.trim();if(!src||!(src.startsWith('/media/')||src.startsWith('assets/')||src.startsWith('/assets/')||src.startsWith('https://'))){event.preventDefault();studio.message('Chọn ảnh trong thư viện hoặc đường dẫn HTTPS.',true);return;}editor.chain().focus().setImage({src:src.startsWith('assets/')?'/'+src:src,alt:$('#post-image-alt').value,title:$('#post-image-caption').value}).run();});
}
window.SaphiaPosts={isDirty:dirty,async mount(){if(!mounted){mountEditor();mounted=true;}await loadList();$('#post-new').disabled=working;}};
