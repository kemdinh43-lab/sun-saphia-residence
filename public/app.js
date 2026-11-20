'use strict';
const siteContent = JSON.parse(document.getElementById('site-content')?.textContent || '{}');
const asset = name => /^(assets\/|\/|https:\/\/)/.test(name) ? name : `assets/${name}`;
// Editable copy and visual assets. All layout and interaction code is independently authored.
const featureCards = [
 [
  "VỊ TRÍ VEN BIỂN",
  "Nằm tại giao lộ Nguyễn Đức Thuận – Trường Sa, gần bãi tắm Sơn Thủy và công viên công cộng phía trước.",
  "assets/sun-saphia-aerial-day.webp"
 ],
 [
  "KIẾN TRÚC APSARA",
  "Mặt đứng với những đường cong lấy cảm hứng từ vũ điệu và di sản Chăm Pa.",
  "assets/sun-saphia-tower-day.webp"
 ],
 [
  "TÒA THÁP 114 M",
  "Công trình gồm 30 tầng nổi, 2 tầng hầm, mang đến các lựa chọn căn hộ tại nhiều tầng và hướng nhìn.",
  "assets/sun-saphia-tower-night.webp"
 ],
 [
  "TRẦN CAO 3,5 M",
  "Tạo cảm giác rộng mở, thoáng đãng và tăng khả năng đón ánh sáng tự nhiên.",
  "assets/sun-saphia-living-sea.webp"
 ],
 [
  "782 SẢN PHẨM",
  "Bao gồm Studio, 1BR+, 2BR, shophouse khối đế, duplex và penthouse.",
  "assets/sun-saphia-aerial-night.webp"
 ],
 [
  "CHĂM SÓC SỨC KHỎE",
  "Bể bơi hướng biển, phòng gym, yoga và pilates.",
  "assets/sun-saphia-gym.webp"
 ],
 [
  "CĂN HỘ STUDIO",
  "Diện tích 30 m², với các lựa chọn hướng thành phố, cánh bên hoặc mặt trước hướng biển tùy mã căn.",
  "assets/sun-saphia-bedroom-city.webp"
 ],
 [
  "CĂN HỘ 1BR+",
  "Diện tích 50–51 m², với không gian sinh hoạt linh hoạt cho cặp đôi hoặc gia đình nhỏ.",
  "assets/sun-saphia-living-interior.webp"
 ],
 [
  "CĂN HỘ 2BR",
  "Diện tích 60–70 m², với hai phòng ngủ và không gian sinh hoạt chung.",
  "assets/sun-saphia-bedroom-river.webp"
 ],
 [
  "BỘ SƯU TẬP ĐẶC BIỆT",
  "Duplex, penthouse và shophouse khối đế bổ sung lựa chọn về không gian và công năng.",
  "assets/sun-saphia-podium.webp"
 ],
 [
  "BÀN GIAO DỰ KIẾN",
  "Dự kiến tháng 11/2028 theo tiêu chuẩn hoàn thiện cơ bản.",
  "assets/sun-saphia-living-interior.webp"
 ]
];
const amenityCards = [
 [
  "BỂ BƠI HƯỚNG BIỂN",
  "Phối cảnh bể bơi với không gian mở nhìn ra cảnh quan ven biển.",
  "assets/sun-saphia-pool-sea.webp"
 ],
 [
  "PHÒNG GYM",
  "Phối cảnh phòng gym phục vụ nhu cầu rèn luyện sức khỏe mỗi ngày.",
  "assets/sun-saphia-gym.webp"
 ],
 [
  "KHÔNG GIAN YOGA",
  "Phối cảnh phòng yoga với ánh sáng tự nhiên và không gian thư giãn.",
  "assets/sun-saphia-yoga.webp"
 ],
 [
  "BỂ BƠI TRONG NHÀ",
  "Phối cảnh không gian bể bơi trong nhà, kết hợp cây xanh và khu ghế nghỉ.",
  "assets/sun-saphia-indoor-pool.webp"
 ],
 [
  "GÓC NHÌN BIỂN TỪ CĂN HỘ",
  "Phối cảnh tầm nhìn từ ban công hướng biển. Hướng nhìn thay đổi theo tầng và vị trí căn hộ.",
  "assets/sun-saphia-balcony-sea.webp"
 ],
 [
  "GÓC NHÌN NGŨ HÀNH SƠN",
  "Phối cảnh tầm nhìn từ ban công về Ngũ Hành Sơn và cảnh quan xung quanh.",
  "assets/sun-saphia-balcony-mountains.webp"
 ]
];
const galleryCards = [
 [
  "PHÒNG GYM",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-gym.webp"
 ],
 [
  "BỂ BƠI HƯỚNG BIỂN",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-pool-sea.webp"
 ],
 [
  "BỂ BƠI TRONG NHÀ",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-indoor-pool.webp"
 ],
 [
  "KHÔNG GIAN YOGA",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-yoga.webp"
 ],
 [
  "PHÒNG KHÁCH HƯỚNG BIỂN",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-living-sea.webp"
 ],
 [
  "BAN CÔNG HƯỚNG BIỂN",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-balcony-sea.webp"
 ],
 [
  "GÓC NHÌN NGŨ HÀNH SƠN",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-balcony-mountains.webp"
 ],
 [
  "NỘI THẤT CĂN HỘ",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-living-interior.webp"
 ],
 [
  "PHÒNG NGỦ HƯỚNG THÀNH PHỐ",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-bedroom-city.webp"
 ],
 [
  "PHÒNG NGỦ HƯỚNG SÔNG",
  "Hình ảnh phối cảnh minh họa.",
  "assets/sun-saphia-bedroom-river.webp"
 ]
];
const points = {
 'concept-points':[['DI SẢN VĂN HÓA','Dấu ấn văn hóa Chăm Pa.'],['KIẾN TRÚC UYỂN CHUYỂN','Những đường cong kiến trúc Apsara.'],['GÓC NHÌN RỘNG MỞ','Kết nối cảnh quan biển và đô thị.'],['KHÔNG GIAN KHOÁNG ĐẠT','Không gian trần cao 3,5 m.']],
 'lifestyle-points':[['BUỔI SÁNG BÊN BIỂN','Đón ngày mới bên bãi biển Sơn Thủy.'],['KHOẢNH KHẮC CÂN BẰNG','Vận động với gym, yoga, pilates và bể bơi.'],['KHÁM PHÁ ĐIỂM ĐẾN','Khám phá Ngũ Hành Sơn, ẩm thực và các điểm đến du lịch Đà Nẵng.'],['CHÂN TRỜI RỘNG MỞ','Góc nhìn hướng biển, công viên hoặc thành phố tùy vị trí căn hộ. Công viên và bãi biển là không gian công cộng.']]
};
// Values are embedded by the Worker from one published revision (or an authenticated preview).
for (const [name, cards] of Object.entries({ features:featureCards, amenities:amenityCards, gallery:galleryCards })) {
 cards.forEach((row,i)=>['title','copy','image'].forEach((field,j)=>{ const value=siteContent[`cards.${name}.${i}.${field}`]; if(typeof value==='string')row[j]=value; }));
}
for (const [name, rows] of Object.entries(points)) rows.forEach((row,i)=>['title','copy'].forEach((field,j)=>{const value=siteContent[`points.${name}.${i}.${field}`];if(typeof value==='string')row[j]=value;}));
Object.entries(points).forEach(([id,rows])=>{
 const root=document.getElementById(id);
 rows.forEach(([title,copy])=>{const el=document.createElement('article');el.className='reveal';const h=document.createElement('h4');h.textContent=title;const p=document.createElement('p');p.textContent=copy;el.append(h,p);root.append(el);});
});
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
function initCarousel(root, cards, name) {
 const track=document.createElement('div');track.className='carousel-track';track.id=`track-${name}`;track.setAttribute('aria-label',name==='features'?'Dấu ấn dự án':name==='amenities'?'Tiện ích':'Thư viện hình ảnh');track.setAttribute('tabindex','0');
 cards.forEach(([title,copy,img],i)=>{
  const card=document.createElement('article');card.className='carousel-card';card.setAttribute('aria-label',`${i+1} / ${cards.length}`);
  const picture=document.createElement('div');picture.className='carousel-image';const image=document.createElement('img');image.src=asset(img);image.alt=title;image.loading='lazy';picture.append(image);
  const heading=document.createElement('h4');heading.textContent=title;card.append(picture,heading);
  if(copy){const p=document.createElement('p');p.textContent=copy;card.append(p);}
  if(name==='amenities'){const a=document.createElement('a');a.href='#Contact-us';a.textContent='TÌM HIỂU THÊM ↗';card.append(a);}
  track.append(card);
 });
 const controls=document.createElement('div');controls.className='carousel-controls';
 const prev=document.createElement('button');prev.className='arrow';prev.textContent='←';prev.setAttribute('aria-label','Ảnh trước');prev.setAttribute('aria-controls',track.id);
 const next=document.createElement('button');next.className='arrow';next.textContent='→';next.setAttribute('aria-label','Ảnh tiếp theo');next.setAttribute('aria-controls',track.id);
 const count=document.createElement('span');count.className='carousel-count';
 controls.append(prev,count,next);root.append(track,controls);
 const advance=dir=>{const step=track.children[0].getBoundingClientRect().width+24;track.scrollBy({left:step*dir,behavior:reduceMotion.matches?'instant':'smooth'});};
 prev.addEventListener('click',()=>advance(-1));next.addEventListener('click',()=>advance(1));
 const update=()=>{const step=track.children[0].getBoundingClientRect().width+24;const i=Math.round(track.scrollLeft/step);count.textContent=`${String(i+1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;prev.disabled=track.scrollLeft<2;next.disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-2;};
 track.addEventListener('scroll',update,{passive:true});new ResizeObserver(update).observe(track);update();
}
document.querySelectorAll('[data-carousel]').forEach(el=>{const name=el.dataset.carousel;initCarousel(el,{features:featureCards,amenities:amenityCards,gallery:galleryCards}[name],name);});
// Scroll choreography is owned by motion.js.
const menuButton=document.querySelector('.menu-toggle'),menu=document.querySelector('.mobile-menu');
function closeMenu(){menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Mở menu');document.body.classList.remove('locked');}
menuButton.addEventListener('click',()=>{const opening=menu.hidden;menu.hidden=!opening;menuButton.setAttribute('aria-expanded',String(opening));menuButton.setAttribute('aria-label',opening?'Đóng menu':'Mở menu');document.body.classList.toggle('locked',opening);});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();menuButton.focus();}});
matchMedia('(min-width:801px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const banner=document.querySelector('.cookie-banner');
try{banner.hidden=localStorage.getItem('saphia-cookie-consent')==='accepted';}catch{}
document.querySelector('.cookie-accept').addEventListener('click',()=>{banner.hidden=true;try{localStorage.setItem('saphia-cookie-consent','accepted');}catch{}});
const apartmentDialog=document.getElementById('apartments');
document.querySelectorAll('a[href="#apartments"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();closeMenu();apartmentDialog.showModal();}));
apartmentDialog.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>apartmentDialog.close()));
document.querySelectorAll('.privacy-trigger').forEach(b=>b.addEventListener('click',()=>document.getElementById('privacy').showModal()));
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
// Persist the inquiry before acknowledging receipt. No personal data goes into browser storage.
document.getElementById('consultation-form').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget,button=form.querySelector('[type=submit]'),status=form.querySelector('.form-status');
 if(document.body.dataset.preview==='true'){status.textContent='Đây là bản xem trước. Biểu mẫu không gửi dữ liệu.';return;}
 if(button.disabled)return;button.disabled=true;status.textContent='Đang gửi đăng ký…';
 try {
  const data=new FormData(form);
  const response=await fetch('/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:data.get('name'),phone:data.get('phone'),email:data.get('email'),consent:data.get('consent')==='on',website:data.get('website')||''})});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'Chưa gửi được đăng ký. Vui lòng thử lại.');
  status.textContent=result.message;form.reset();
 }catch(error){status.textContent=error instanceof SyntaxError?'Chưa kết nối được hệ thống tiếp nhận. Vui lòng thử lại sau.':error.message;}
 finally{button.disabled=false;}
});

// Reference gallery: a larger selected image among smaller square thumbnails.
const galleryTrack=document.getElementById('track-gallery');
if(galleryTrack){
 const cards=Array.from(galleryTrack.children);
 const highlight=index=>cards.forEach((card,i)=>card.classList.toggle('is-active',i===index));
 let selected=Math.min(4,cards.length-1);highlight(selected);
 const center=index=>{highlight(index);const card=cards[index];galleryTrack.scrollTo({left:card.offsetLeft+card.offsetWidth/2-galleryTrack.clientWidth/2,behavior:reduceMotion.matches?'instant':'smooth'});};
 cards.forEach((card,i)=>{card.tabIndex=0;card.setAttribute('aria-label',card.getAttribute('aria-label')+' — xem ảnh');card.addEventListener('click',()=>center(i));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();center(i);}});});
 let framePending=false;galleryTrack.addEventListener('scroll',()=>{if(framePending)return;framePending=true;requestAnimationFrame(()=>{const midpoint=galleryTrack.scrollLeft+galleryTrack.clientWidth/2;let best=0,distance=Infinity;cards.forEach((card,i)=>{const d=Math.abs(card.offsetLeft+card.offsetWidth/2-midpoint);if(d<distance){distance=d;best=i;}});highlight(best);framePending=false;});},{passive:true});
 requestAnimationFrame(()=>{const card=cards[selected];galleryTrack.scrollLeft=card.offsetLeft+card.offsetWidth/2-galleryTrack.clientWidth/2;});
}

// Defer the YouTube player until the visitor chooses to watch the project film.
let projectVideoId='dU6ceuNIdXI';
if(siteContent['film.youtube']){
 const link=new URL(siteContent['film.youtube']);
 projectVideoId=link.hostname==='youtu.be'?link.pathname.slice(1):link.searchParams.get('v')||link.pathname.split('/').pop();
 document.querySelectorAll('[data-project-film],.project-film__external a').forEach(a=>a.href=`https://www.youtube.com/watch?v=${projectVideoId}`);
}
const projectFilmLink=document.querySelector('[data-project-film]');
projectFilmLink?.addEventListener('click',event=>{
 event.preventDefault();
 const frame=document.createElement('iframe');
 frame.src=`https://www.youtube-nocookie.com/embed/${projectVideoId}?autoplay=1&playsinline=1&rel=0&hl=vi`;
 frame.title='Video giới thiệu Sun Saphia Residence';
 frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
 frame.allowFullscreen=true;
 frame.referrerPolicy='strict-origin-when-cross-origin';
 projectFilmLink.replaceWith(frame);
 frame.focus();
});
