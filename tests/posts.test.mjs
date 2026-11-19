import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPost,validatePost,renderDocument } from '../server/posts.js';
import sections from '../server/sections.json' with {type:'json'};
import schema from '../server/content-schema.json' with {type:'json'};
test('Every landing field belongs to its actual section, including its cards and gallery',()=>{
  assert.equal(sections.filter(section=>!section.settings).length,17);
  assert(schema.every(field=>sections.some(section=>section.id===field.sectionId)));
  for(const field of schema){if(field.key.startsWith('cards.features.'))assert.equal(field.sectionId,'4');if(field.key.startsWith('cards.amenities.'))assert.equal(field.sectionId,'12');if(field.key.startsWith('cards.gallery.'))assert.equal(field.sectionId,'13');if(field.key.startsWith('points.concept-'))assert.equal(field.sectionId,'3');}
});
test('Rich text renders semantic headings, lists, links, images and tables while rejecting executable content',()=>{
  const doc={type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'Kiến trúc <Apsara>'}]},{type:'paragraph',content:[{type:'text',text:'Tìm hiểu',marks:[{type:'bold'},{type:'link',attrs:{href:'/bai-viet'}}]}]},{type:'image',attrs:{src:'/assets/a.webp',alt:'" onerror="alert(1)',title:'Chú thích'}},{type:'table',content:[{type:'tableRow',content:[{type:'tableHeader',content:[{type:'paragraph',content:[{type:'text',text:'Loại căn'}]}]}]}]}]};
  const output=renderDocument(doc);assert(output.includes('<h2>Kiến trúc &lt;Apsara&gt;</h2>'));assert(output.includes('<table>'));assert(output.includes('<strong>'));assert(output.includes('<figcaption>Chú thích</figcaption>'));assert(output.includes('alt="&quot; onerror=&quot;alert(1)"'));
  assert.throws(()=>renderDocument({type:'doc',content:[{type:'script',text:'alert(1)'}]}));
  assert.throws(()=>renderDocument({type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'x',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]}));
  assert.throws(()=>renderDocument({type:'doc',content:[{type:'image',attrs:{src:'data:image/svg+xml,<svg/>'}}]}));
  assert.throws(()=>renderDocument({type:'doc',content:[{type:'heading',attrs:{level:1}}]}));
  assert.throws(()=>renderDocument({type:'text',text:'Không phải tài liệu'}));
});
test('Publication requires a complete article and preserves an established slug',()=>{
  const draft={...emptyPost(),title:'Bài thử',slug:'bai-thu'};
  validatePost(draft);
  assert.throws(()=>validatePost(draft,{publishing:true}));
  assert.throws(()=>validatePost({...draft,slug:'doi-duong-dan'},{lockedSlug:'bai-thu'}));
  validatePost({...draft,cover:'/assets/a.webp',coverAlt:'Ảnh dự án',excerpt:'Mô tả',document:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Nội dung chính'}]}]}},{publishing:true});
});
