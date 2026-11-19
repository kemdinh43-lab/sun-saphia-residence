'use strict';
const asset = name => `assets/${name}`;
// Editable copy and visual assets. All layout and interaction code is independently authored.
const featureCards = [
 ['VỊ TRÍ VEN BIỂN','Nằm tại giao lộ Nguyễn Đức Thuận – Trường Sa, gần bãi tắm Sơn Thủy và công viên công cộng phía trước.','669394ccd9f34f3a2f9b8179_Photo.webp'],
 ['KIẾN TRÚC APSARA','Mặt đứng với những đường cong lấy cảm hứng từ vũ điệu và di sản Chăm Pa.','66d083e7364c1b52fe8dd886_33.webp'],
 ['TÒA THÁP 114 M','Công trình gồm 30 tầng nổi, 2 tầng hầm, mang đến các lựa chọn căn hộ tại nhiều tầng và hướng nhìn.','669394cc52591b8b1e42a39f_Photo-2.webp'],
 ['TRẦN CAO 3,5 M','Tạo cảm giác rộng mở, thoáng đãng và tăng khả năng đón ánh sáng tự nhiên.','669394ccffb9862a914d8f47_Photo-3.webp'],
 ['782 SẢN PHẨM','Bao gồm Studio, 1BR+, 2BR, shophouse khối đế, duplex và penthouse.','669394cc5deb6fbbf22253ba_Photo-4.webp'],
 ['CHĂM SÓC SỨC KHỎE','Bể bơi hướng biển, phòng gym, yoga và pilates.','669394cccbc7e78e84b8a3ac_Photo-5.webp'],
 ['CĂN HỘ STUDIO','Diện tích 30 m², với các lựa chọn hướng thành phố, cánh bên hoặc mặt trước hướng biển tùy mã căn.','669394cc383af3570041f3a9_Photo-6.webp'],
 ['CĂN HỘ 1BR+','Diện tích 50–51 m², với không gian sinh hoạt linh hoạt cho cặp đôi hoặc gia đình nhỏ.','66d08426b9ed0d4963e3cb33_Porsche.webp'],
 ['CĂN HỘ 2BR','Diện tích 60–70 m², với hai phòng ngủ và không gian sinh hoạt chung.','669394cc21cfbc637ecdcdf1_Photo-8.webp'],
 ['BỘ SƯU TẬP ĐẶC BIỆT','Duplex, penthouse và shophouse khối đế bổ sung lựa chọn về không gian và công năng.','66ccb851576b757ca4699208_concierge-2.webp'],
 ['BÀN GIAO DỰ KIẾN','Dự kiến tháng 11/2028 theo tiêu chuẩn hoàn thiện cơ bản.','68494397ed927eb6ebff53ae_wheelchair.avif']
];
const amenityCards = [
 ['BỂ BƠI HƯỚNG BIỂN','Bể bơi được định hướng nhìn về phía công viên và bãi biển, tạo không gian thư giãn ven biển.','66941240c825827d10fba510_infrastructure_1.webp'],
 ['PHÒNG GYM','Phòng gym phục vụ nhu cầu rèn luyện sức khỏe và duy trì thói quen vận động.','669412402c29addda447ab11_infrastructure_2.webp'],
 ['KHÔNG GIAN YOGA','Không gian dành cho những hoạt động nhẹ nhàng, thư giãn và cân bằng tinh thần.','6694124079c4ff2e35536ba3_infrastructure_3.webp'],
 ['KHÔNG GIAN PILATES','Khu vực pilates bổ sung các lựa chọn tập luyện trong hệ tiện ích chăm sóc sức khỏe.','6694124066776b60f6368488_infrastructure_4.webp'],
 ['CÔNG VIÊN VEN BIỂN','Công viên công cộng phía trước dự án có hồ nước, sân tennis, đường đi bộ và những khoảng cây xanh.','66941240e88c1b08e56790da_infrastructure_5.webp'],
 ['BÃI TẮM SƠN THỦY','Bãi tắm công cộng gần dự án, thuận tiện cho những trải nghiệm biển và hoạt động ngoài trời.','66941240b7eaf9da62f93748_infrastructure_6.webp']
];
const galleryCards = [
 ['PHÒNG GYM','','66c85a37dea8eb1d6873d669_1Photo-5.avif'],['BỂ BƠI HƯỚNG BIỂN','','66c858d41c944040b12ef6fa_Photo-6.avif'],['KHÔNG GIAN PILATES','','66c85a3842e8f4bf183bd168_1Photo-4.avif'],['KHÔNG GIAN YOGA','','66d5c4a6ab2d2e470737c019_restaurant-home.webp'],['CÔNG VIÊN VEN BIỂN','','66c85a37ae1f509051ab027e_1Photo-3.avif'],['BÃI TẮM SƠN THỦY','','66c858d492cf4fc3888168ef_Photo-7.avif'],['DANH THẮNG NGŨ HÀNH SƠN','','66c858d4824ed7c557641b99_Photo-8.avif'],['DI SẢN CHĂM PA','','66c858d4e2d5d4ef7d2196bf_Photo-9.avif'],['CẢNH QUAN THÀNH PHỐ','','66c858d4cb3c0aaddac51240_1.avif'],['NHỊP SỐNG ĐÀ NẴNG','','66c85a37ebd92c5b3e0c0500_1Photo-6.avif']
];
const points = {
 'concept-points':[['DI SẢN VĂN HÓA','Dấu ấn văn hóa Chăm Pa.'],['KIẾN TRÚC UYỂN CHUYỂN','Những đường cong kiến trúc Apsara.'],['GÓC NHÌN RỘNG MỞ','Kết nối cảnh quan biển và đô thị.'],['KHÔNG GIAN KHOÁNG ĐẠT','Không gian trần cao 3,5 m.']],
 'lifestyle-points':[['BUỔI SÁNG BÊN BIỂN','Đón ngày mới bên bãi biển Sơn Thủy.'],['KHOẢNH KHẮC CÂN BẰNG','Vận động với gym, yoga, pilates và bể bơi.'],['KHÁM PHÁ ĐIỂM ĐẾN','Khám phá Ngũ Hành Sơn, ẩm thực và các điểm đến du lịch Đà Nẵng.'],['CHÂN TRỜI RỘNG MỞ','Góc nhìn hướng biển, công viên hoặc thành phố tùy vị trí căn hộ. Công viên và bãi biển là không gian công cộng.']]
};
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
// No backend destination was supplied. Validate without sending or persisting personal data.
document.getElementById('consultation-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('.form-status').textContent='Thông tin đã hợp lệ. Biểu mẫu hiện chưa kết nối hệ thống tiếp nhận nên chưa gửi đăng ký.';});

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
const projectFilmLink=document.querySelector('[data-project-film]');
projectFilmLink?.addEventListener('click',event=>{
 event.preventDefault();
 const frame=document.createElement('iframe');
 frame.src='https://www.youtube-nocookie.com/embed/dU6ceuNIdXI?autoplay=1&playsinline=1&rel=0&hl=vi';
 frame.title='Video giới thiệu Sun Saphia Residence';
 frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
 frame.allowFullscreen=true;
 frame.referrerPolicy='strict-origin-when-cross-origin';
 projectFilmLink.replaceWith(frame);
 frame.focus();
});
